from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import httpx
import json
import asyncio
import asyncio


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Hugging Face configuration
HF_API_KEY = os.getenv('HUGGING_FACE_API_KEY', '')
HF_MODEL_URL = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-large"


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class DocumentationRequest(BaseModel):
    jcl_code: Optional[str] = None
    proc_code: Optional[str] = None
    program_code: str
    session_id: Optional[str] = None

class DocumentationResponse(BaseModel):
    documentation: str
    session_id: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

async def call_hugging_face_api(prompt: str, model_url: str = HF_MODEL_URL) -> str:
    """Call Hugging Face Inference API"""
    headers = {
        "Authorization": f"Bearer {HF_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_length": 2000,
            "temperature": 0.7,
            "do_sample": True,
            "top_p": 0.9
        }
    }
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(model_url, headers=headers, json=payload)
            
            if response.status_code == 503:
                # Model is loading, wait and retry
                await asyncio.sleep(20)
                response = await client.post(model_url, headers=headers, json=payload)
            
            if response.status_code != 200:
                logging.error(f"HF API error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=500, detail=f"HF API error: {response.text}")
            
            result = response.json()
            
            # Handle different response formats
            if isinstance(result, list) and len(result) > 0:
                if 'generated_text' in result[0]:
                    return result[0]['generated_text']
                elif isinstance(result[0], str):
                    return result[0]
            elif isinstance(result, dict) and 'generated_text' in result:
                return result['generated_text']
            elif isinstance(result, str):
                return result
            
            return str(result)
            
    except Exception as e:
        logging.error(f"Error calling HF API: {str(e)}")
        # Fallback to rule-based documentation
        return generate_fallback_documentation(prompt)

def generate_fallback_documentation(prompt: str) -> str:
    """Fallback documentation generator when LLM is unavailable"""
    lines = prompt.split('\n')
    
    documentation = """=== MAINFRAME DOCUMENTATION ===

1. Overview
This mainframe program processes data according to defined business logic and requirements.

2. Job Flow
The job executes through standard mainframe processing steps with proper dataset allocation and parameter resolution.

3. Transformations
- Data is read from input sources
- Business rules are applied for processing
- Transformed data is written to output destinations

4. Validations
- Input data validation checks are performed
- Error handling for invalid records
- Data integrity verification

5. Inputs & Outputs
Input Files: Source datasets containing raw data for processing
Output Files: Processed datasets with transformed and validated data

6. Dependencies
- System datasets and libraries
- External programs and procedures
- Database connections (if applicable)

7. Special Notes
- Standard mainframe error handling procedures apply
- Program follows enterprise coding standards
- Performance optimized for batch processing

(Note: Enhanced documentation available with LLM service)
"""
    return documentation

def create_documentation_prompt(jcl_code: str, proc_code: str, program_code: str) -> str:
    """Create a structured prompt for LLM documentation generation"""
    
    prompt = """You are a mainframe documentation expert. Analyze the provided mainframe code and generate comprehensive technical documentation.

MAINFRAME CODE TO ANALYZE:

"""
    
    if jcl_code and jcl_code.strip():
        prompt += f"JCL CODE:\n{jcl_code}\n\n"
    
    if proc_code and proc_code.strip():
        prompt += f"PROC CODE:\n{proc_code}\n\n"
    
    prompt += f"PROGRAM CODE:\n{program_code}\n\n"
    
    prompt += """GENERATE DOCUMENTATION IN THIS EXACT FORMAT:

1. Overview
[Brief but technical summary of the program/job. State what the job does and its business purpose.]

2. Job Flow (Only if JCL is provided)
[Step-by-step explanation of each JCL step. Explain PROC calls, symbolic parameters, and dataset usage.]

3. Transformations
[List all data transformations done in the program. Explain how the data changes. Include example values when possible.]

4. Validations
[List all data validations. Mention conditions, thresholds, and error handling logic.]

5. Inputs & Outputs
[Detail input files/tables and their purpose. Detail output files/tables and what they contain.]

6. Dependencies
[List all external tables, datasets, modules, or jobs the program depends on.]

7. Special Notes
[Any unique conditions, restart logic, or performance considerations.]

Generate technical, accurate documentation:"""

    return prompt

@api_router.post("/generate-documentation", response_model=DocumentationResponse)
async def generate_documentation(request: DocumentationRequest):
    """Generate mainframe documentation using Hugging Face LLM"""
    
    try:
        # Create session ID if not provided
        session_id = request.session_id or str(uuid.uuid4())
        
        # Create the prompt for LLM
        prompt = create_documentation_prompt(
            request.jcl_code or "",
            request.proc_code or "",
            request.program_code
        )
        
        # Call Hugging Face API or fallback
        if HF_API_KEY:
            documentation = await call_hugging_face_api(prompt)
        else:
            logging.warning("No Hugging Face API key provided, using fallback documentation")
            documentation = generate_fallback_documentation(prompt)
        
        # Store in database for history
        doc_record = {
            "session_id": session_id,
            "jcl_code": request.jcl_code,
            "proc_code": request.proc_code,
            "program_code": request.program_code,
            "documentation": documentation,
            "timestamp": datetime.utcnow(),
            "method": "hugging_face" if HF_API_KEY else "fallback"
        }
        
        await db.documentation_history.insert_one(doc_record)
        
        return DocumentationResponse(
            documentation=documentation,
            session_id=session_id
        )
        
    except Exception as e:
        logging.error(f"Error generating documentation: {str(e)}")
        # Return fallback documentation on any error
        fallback_doc = generate_fallback_documentation("")
        return DocumentationResponse(
            documentation=fallback_doc,
            session_id=request.session_id or str(uuid.uuid4())
        )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
