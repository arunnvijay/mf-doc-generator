# Hugging Face API Integration Setup

## Get Your Free Hugging Face API Key

1. **Visit Hugging Face**: Go to [https://huggingface.co](https://huggingface.co)
2. **Sign Up/Login**: Create a free account or login to your existing account
3. **Get API Token**: 
   - Go to [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
   - Click "New token"
   - Name it "Mainframe Doc Generator" 
   - Select "Read" permissions (free tier)
   - Copy the generated token (starts with `hf_`)

## Add API Key to Your Application

1. **Edit Backend Environment File**:
   ```bash
   # Open the backend .env file
   nano /app/backend/.env
   ```

2. **Add Your API Key**:
   ```env
   HUGGING_FACE_API_KEY=hf_your_token_here
   ```

3. **Restart Backend**:
   ```bash
   sudo supervisorctl restart backend
   ```

## Test the Integration

1. **Open the Mainframe Doc Generator**: `http://localhost:3000/mainframe-doc-generator.html`
2. **Add Sample Code** in the COBOL/ASM/PL1 section:
   ```cobol
   IDENTIFICATION DIVISION.
   PROGRAM-ID. SAMPLE-PROG.
   PROCEDURE DIVISION.
       DISPLAY 'Hello Mainframe'
       STOP RUN.
   ```
3. **Click Generate**: The documentation will now be generated using the Hugging Face LLM!

## Available Models

The application uses **microsoft/DialoGPT-medium** by default, which is:
- ✅ **Free to use** with Hugging Face API
- ✅ **Good for documentation tasks**
- ✅ **Fast response times**

## Fallback Mode

If no API key is provided, the application automatically falls back to rule-based documentation generation, so it works even without the API key!

## Cost & Limits

- **Hugging Face Inference API**: Free tier with rate limits
- **Typical usage**: Very minimal cost for documentation generation
- **Rate limits**: Usually 1000 requests per hour for free accounts

## Troubleshooting

1. **Model Loading**: If you see "model is loading" - wait 20-30 seconds and try again
2. **Rate Limits**: Wait a few minutes if you hit rate limits
3. **API Errors**: Check your API key is correct and has proper permissions
4. **No Response**: Application automatically falls back to rule-based generation

Your Mainframe Documentation Generator is now ready with AI-powered documentation generation!