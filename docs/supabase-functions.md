# Supabase Edge Functions Guide

Pull2Press uses Supabase Edge Functions for server-side operations, primarily for OpenAI API calls.

## Overview

### Why Supabase Edge Functions?

- **Security**: Keep API keys on the server
- **Performance**: Run at the edge, close to users
- **Integration**: Seamless integration with Supabase Auth
- **Scalability**: Auto-scaling with no server management

## Content Generation Function

### Location
`supabase/functions/generate-content/index.ts`

### Purpose
Handles OpenAI API calls to generate blog post content from PR data.

### Function Code Structure

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { OpenAI } from "https://deno.land/x/openai@v4.24.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Function logic here...
});
```

### Request Format

```typescript
{
  systemPrompt: string;  // System instructions for GPT-4
  userPrompt: string;    // User prompt with PR data
  temperature?: number;  // Optional, defaults to 0.7
}
```

### Response Format

```typescript
{
  content: string;  // Generated blog post content
}
```

### Error Responses

```typescript
// 400 Bad Request
{
  error: "Both systemPrompt and userPrompt are required"
}

// 500 Internal Server Error
{
  error: "Failed to generate content",
  details?: "Error message"
}
```

## Frontend Integration

### Using the Function

```typescript
import { supabase } from './supabase';

const { data, error } = await supabase.functions.invoke('generate-content', {
  body: {
    systemPrompt: 'You are a technical blog writer...',
    userPrompt: 'Write about this PR...',
    temperature: 0.7
  },
});

if (error) {
  console.error('Error:', error);
  throw new Error(error.message);
}

const content = data.content;
```

### Authentication

The function automatically receives the user's session token when called via `supabase.functions.invoke()`. While not currently used, this allows for:

- User-specific rate limiting
- Usage tracking
- Premium features

## Deployment

### Prerequisites

1. Supabase CLI installed
2. Project linked to Supabase
3. OpenAI API key set as secret

### Set Environment Variables

```bash
# Set OpenAI API key as a secret
supabase secrets set OPENAI_API_KEY=sk-...
```

### Deploy Function

```bash
# Deploy the function
supabase functions deploy generate-content

# Check deployment status
supabase functions list
```

### Local Development

```bash
# Start Supabase locally
supabase start

# Serve function locally
supabase functions serve generate-content --env-file .env

# In another terminal, run your app
npm run dev
```

## Configuration

### Model Settings

Currently using GPT-4 Turbo:
- Model: `gpt-4-1106-preview`
- Max tokens: 2000
- Temperature: 0.7 (configurable)

### CORS Configuration

The function allows all origins (`*`) for development. For production, consider restricting to your domain:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://yourdomain.com',
  // ...
};
```

## Monitoring

### View Logs

```bash
# View function logs
supabase functions logs generate-content

# Follow logs in real-time
supabase functions logs generate-content --follow
```

### Metrics

Monitor in Supabase Dashboard:
- Invocations count
- Error rate
- Execution time
- Cold starts

## Cost Considerations

### Supabase Edge Functions
- Free tier: 500K invocations/month
- Paid: $0.10 per 1M invocations

### OpenAI API
- GPT-4 Turbo: ~$0.01 per 1K input tokens, ~$0.03 per 1K output tokens
- Average blog post: ~$0.10-0.20

## Best Practices

1. **Error Handling**: Always wrap API calls in try-catch
2. **Timeouts**: Edge functions have a 150s timeout
3. **Secrets**: Never hardcode API keys
4. **CORS**: Configure appropriately for production
5. **Rate Limiting**: Consider implementing user-based limits

## Troubleshooting

### Function Not Found
```bash
# Check if function is deployed
supabase functions list
```

### CORS Errors
- Ensure CORS headers are set correctly
- Check for OPTIONS request handling

### Authentication Errors
- Verify Supabase URL and anon key
- Check if session is valid

### OpenAI Errors
- Verify API key is set: `supabase secrets list`
- Check OpenAI API status
- Monitor rate limits