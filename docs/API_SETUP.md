# API Setup Guide for Pull2Press

This guide explains how to set up the OpenAI and GitHub APIs for processing pull requests into blog posts.

## Overview

Pull2Press uses two main APIs:
- **GitHub API**: To fetch pull request data (title, description, commits, files)
- **OpenAI API**: To generate blog content using GPT-4

## API Flow Diagram

```
User submits PR URL
        ↓
[GitHub API] Fetch PR data
        ↓
    Extract:
    - PR title & description
    - Commit messages
    - File changes
        ↓
[OpenAI API] Generate blog post
        ↓
    Return formatted content
```

## GitHub API Setup

### For Authenticated Users

When users log in with GitHub OAuth (via Supabase), their GitHub token is automatically available:

```typescript
// src/lib/github.ts
const { data: { session } } = await supabase.auth.getSession();
if (session?.provider_token) {
  const octokit = new Octokit({ auth: session.provider_token });
  // User's token provides access to private repos they can access
}
```

### For Unauthenticated Users

The app falls back to server-side API calls using environment variables:

1. Create a GitHub Personal Access Token:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate new token with `repo` scope
   - Copy the token

2. Add to environment:
   ```bash
   GITHUB_TOKEN=ghp_your_token_here
   ```

### API Endpoints Used

```typescript
// Fetch PR details
octokit.rest.pulls.get({ owner, repo, pull_number })

// Fetch commits
octokit.rest.pulls.listCommits({ owner, repo, pull_number })

// Fetch changed files
octokit.rest.pulls.listFiles({ owner, repo, pull_number })
```

## OpenAI API Setup

### Configuration

1. Get an OpenAI API key:
   - Visit https://platform.openai.com/api-keys
   - Create new secret key
   - Copy the key

2. Add to environment:
   ```bash
   OPENAI_API_KEY=sk-your-key-here
   ```

### Server-Side Implementation

```typescript
// app/api/generate-content/route.ts
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const completion = await openai.chat.completions.create({
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ],
  model: "gpt-4-1106-preview",
  temperature: 0.7,
  max_tokens: 2000,
});
```

### Prompt Engineering

The system uses structured prompts to generate consistent blog posts:

```typescript
// System prompt defines the AI's role
const systemPrompt = `You are a technical blog post writer. 
Transform pull request data into an engaging developer blog post.`;

// User prompt includes PR data
const userPrompt = `Write a blog post about this PR:
Title: ${prData.title}
Description: ${prData.description}
Files changed: ${prData.files.length}
Key changes: ${summarizeChanges(prData)}`;
```

## Environment Variables

### Required for Production

```bash
# Supabase (for auth and database)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# OpenAI (server-side only)
OPENAI_API_KEY=sk-your-openai-key

# GitHub (optional, for server-side fallback)
GITHUB_TOKEN=ghp_your-github-token
```

### Development Setup

```bash
# Copy example environment
cp .env.example .env

# Edit .env with your keys
# Start development server
npm run dev
```

## Cost Considerations

### GitHub API
- **Rate Limits**: 
  - Authenticated: 5,000 requests/hour
  - Unauthenticated: 60 requests/hour
- **Cost**: Free for public repos

### OpenAI API
- **GPT-4 Pricing** (as of 2024):
  - Input: $0.01 / 1K tokens
  - Output: $0.03 / 1K tokens
- **Average blog post**: ~$0.10-0.20 per generation
- **Optimization**: Cache results in Supabase to avoid regenerating

## Security Best Practices

1. **Never expose API keys in client code**
   - Use server-side API routes
   - Environment variables with `VITE_` prefix are public

2. **Validate PR URLs**
   ```typescript
   const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
   if (!match) throw new Error('Invalid GitHub PR URL');
   ```

3. **Rate limiting**
   - Implement request throttling
   - Cache results to reduce API calls

4. **Error handling**
   ```typescript
   try {
     const data = await fetchPRData(url);
   } catch (error) {
     if (error.status === 404) {
       // PR not found or private
     } else if (error.status === 403) {
       // Rate limit exceeded
     }
   }
   ```

## Monitoring and Debugging

### Check API Usage

```typescript
// GitHub rate limit
const { data: rateLimit } = await octokit.rest.rateLimit.get();
console.log('Remaining:', rateLimit.rate.remaining);

// OpenAI usage
// Check dashboard at https://platform.openai.com/usage
```

### Debug Mode

```typescript
// Enable detailed logging
if (process.env.NODE_ENV === 'development') {
  console.log('PR Data:', prData);
  console.log('Generated content length:', content.length);
}
```

## Troubleshooting

### Common Issues

1. **"Failed to fetch PR data"**
   - Check if PR is public
   - Verify GitHub token has correct scopes
   - Check rate limits

2. **"OpenAI API key not configured"**
   - Ensure OPENAI_API_KEY is set in environment
   - Restart server after adding env variables

3. **Slow generation**
   - Normal: GPT-4 takes 8-15 seconds
   - Use progress indicators
   - Consider GPT-3.5 for faster (but lower quality) results

### Testing APIs

```bash
# Test GitHub API
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/owner/repo/pulls/1

# Test OpenAI API
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```