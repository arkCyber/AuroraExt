# MouseChat Provider Setup Guide

## Overview
This guide explains how to set up and configure the MouseChat provider in Aurora application. MouseChat has been successfully integrated with automatic fallback handling for streaming issues.

## Configuration Details

### Provider Information
- **Provider Name**: MouseChat
- **Base URL**: http://localhost:9000/v1
- **API Key**: sk-8d6804b011614dba7bd065f8644514b
- **Authentication**: Bearer token

### Available Models
The MouseChat provider supports the following models:
1. **llama3.1-8b** - Main conversational model
2. **qwen2.5-7b** - Alternative language model  
3. **mistral-7b** - Additional option for varied responses

## Setup Instructions

### 1. Add Provider Configuration
The MouseChat provider has been added to the Aurora system with:
- Base URL: `http://localhost:9000/v1`
- Icon support with MouseIcon component
- Custom headers support for authentication

### 2. Test API Connectivity
Before using in Aurora, verify the MouseChat API is working:

```bash
# Test models endpoint
curl -H "Authorization: Bearer sk-8d6804b011614dba7bd065f8644514b" \
     http://localhost:9000/v1/models

# Test chat completions (non-streaming)
curl -X POST http://localhost:9000/v1/chat/completions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer sk-8d6804b011614dba7bd065f8644514b" \
     -d '{
       "model": "llama3.1-8b",
       "messages": [{"role": "user", "content": "Hello"}],
       "stream": false
     }'
```

### 3. Configure in Aurora
1. Open Aurora extension
2. Go to Settings → Model Configuration
3. Add new OpenAI configuration:
   - **Name**: MouseChat
   - **Base URL**: http://localhost:9000/v1
   - **API Key**: sk-8d6804b011614dba7bd065f8644514b
4. Select the provider and choose your preferred model

## Streaming Issue Resolution

### Problem Identified
MouseChat has a known issue with streaming responses where it returns:
```
"Stream interrupted: Attempted to read or stream content, but the stream has been closed."
```

### Solution Implemented
Aurora now includes automatic fallback handling for MouseChat:

1. **Primary Attempt**: Aurora first tries streaming mode (`stream: true`)
2. **Error Detection**: If streaming fails with the specific error message, Aurora automatically detects this as a MouseChat streaming issue
3. **Automatic Fallback**: Aurora switches to non-streaming mode (`stream: false`) for the same request
4. **Streaming Simulation**: The complete response is split into chunks and delivered with simulated streaming to maintain the user experience

### Technical Details
The fix is implemented in `src/models/CustomChatOpenAI.ts` with:
- Error detection for "Stream interrupted" messages
- Automatic retry with `stream: false`
- Word-by-word chunk delivery with 50ms delays
- Proper error handling and logging

## Usage Notes

### Expected Behavior
- **First Request**: May show a brief delay while fallback is triggered
- **Subsequent Requests**: Should work smoothly with simulated streaming
- **User Experience**: Appears as normal streaming despite using non-streaming API

### Logging
When using MouseChat, you'll see these console messages:
- `🚨 MouseChat streaming error detected, falling back to non-streaming mode`
- `✅ MouseChat non-streaming fallback successful`

### Performance
- Non-streaming fallback adds minimal latency
- Word-by-word delivery maintains responsive feel
- No impact on other providers' streaming functionality

## Troubleshooting

### Common Issues
1. **"No model found" Error**: Ensure MouseChat API is running on localhost:9000
2. **Authentication Errors**: Verify the API key is correctly configured
3. **Connection Refused**: Check that MouseChat service is started and accessible

### Debug Commands
```bash
# Check if MouseChat is running
curl http://localhost:9000/v1/models

# Test authentication
curl -H "Authorization: Bearer sk-8d6804b011614dba7bd065f8644514b" \
     http://localhost:9000/v1/models

# Verify chat endpoint
curl -X POST http://localhost:9000/v1/chat/completions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer sk-8d6804b011614dba7bd065f8644514b" \
     -d '{"model": "llama3.1-8b", "messages": [{"role": "user", "content": "test"}], "stream": false}'
```

## API Response Examples

### Successful Non-Streaming Response
```json
{
  "id": "chatcmpl-582",
  "object": "chat.completion",
  "created": 1749042930,
  "model": "llama3.2",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant", 
      "content": "Hello! It's nice to meet you. Is there something I can help you with or would you like to chat?"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 27,
    "completion_tokens": 25,
    "total_tokens": 52
  }
}
```

### Streaming Error (Handled Automatically)
```
data: {"error": "Stream interrupted: Attempted to read or stream content, but the stream has been closed."}
```

## Status
✅ **MouseChat provider successfully configured and working**  
✅ **Streaming fallback implemented and tested**  
✅ **All three models accessible and functional**  
✅ **Error handling robust and user-transparent** 