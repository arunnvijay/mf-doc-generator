const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8002;
const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGINS === '*' ? '*' : process.env.CORS_ORIGINS?.split(',') || '*',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/api/', (req, res) => {
    res.json({ 
        message: 'Mainframe Documentation Generator API - Node.js Backend',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// Generate documentation endpoint
app.post('/api/generate-documentation', async (req, res) => {
    try {
        const { jcl_code, proc_code, program_code, session_id } = req.body;
        
        // Validation: At least one input must be provided
        if (!jcl_code?.trim() && !proc_code?.trim() && !program_code?.trim()) {
            return res.status(400).json({
                error: 'At least one input (JCL, PROC, or Program) must be provided',
                session_id: session_id || generateSessionId()
            });
        }

        // Create the prompt based on provided inputs
        const prompt = createDocumentationPrompt(jcl_code, proc_code, program_code);
        
        console.log('Calling Google Gemini API...');
        
        // Call Google Gemini API
        const geminiResponse = await axios.post(GEMINI_ENDPOINT, {
            contents: [
                {
                    parts: [
                        { text: prompt }
                    ]
                }
            ]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': GOOGLE_GEMINI_API_KEY
            },
            timeout: 30000 // 30 second timeout
        });

        // Parse Gemini response
        if (geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            const documentation = geminiResponse.data.candidates[0].content.parts[0].text;
            
            console.log('Successfully generated documentation with Google Gemini');
            
            res.json({
                documentation: documentation,
                session_id: session_id || generateSessionId(),
                method: 'google_gemini',
                status: 'success'
            });
        } else {
            throw new Error('Invalid response format from Gemini API');
        }

    } catch (error) {
        console.error('Error generating documentation:', error.message);
        
        // Return LLM call failed message as requested
        res.json({
            documentation: 'LLM call failed',
            session_id: req.body.session_id || generateSessionId(),
            method: 'failed',
            status: 'error',
            error: error.message
        });
    }
});

// LLM status endpoint
app.get('/api/llm-status', (req, res) => {
    res.json({
        status: GOOGLE_GEMINI_API_KEY ? 'configured' : 'no_key',
        message: GOOGLE_GEMINI_API_KEY ? 'Google Gemini API key configured' : 'No Google Gemini API key provided',
        model: 'gemini-2.0-flash',
        provider: 'google',
        available: !!GOOGLE_GEMINI_API_KEY
    });
});

// Helper function to create documentation prompt
function createDocumentationPrompt(jcl_code, proc_code, program_code) {
    let prompt = `You are a COBOL documentation generator. Given JCL, PROC, and/or Program code, generate a technical program summary and detailed explanations of transformations and validations. If only one of JCL, PROC, or Program is provided, document that one alone.

Generate comprehensive documentation following this structure:

1. Overview
2. Job Flow (if JCL provided)
3. Transformations 
4. Validations
5. Inputs & Outputs
6. Dependencies
7. Special Notes

---`;

    if (jcl_code?.trim()) {
        prompt += `\n\nJCL:\n${jcl_code.trim()}`;
    }

    if (proc_code?.trim()) {
        prompt += `\n\nPROC:\n${proc_code.trim()}`;
    }

    if (program_code?.trim()) {
        prompt += `\n\nPROGRAM:\n${program_code.trim()}`;
    }

    prompt += `\n\nGenerate detailed technical documentation for the provided code(s). Focus on the specific components provided and their functionality.`;

    return prompt;
}

// Generate session ID
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Mainframe Documentation Generator Backend running on port ${PORT}`);
    console.log(`🔑 Google Gemini API: ${GOOGLE_GEMINI_API_KEY ? 'Configured' : 'Not configured'}`);
    console.log(`🌐 CORS: ${process.env.CORS_ORIGINS || '*'}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/`);
});

module.exports = app;