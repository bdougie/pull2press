# API Reference

This document covers all API endpoints and functions used in Pull2Press.

## Supabase Edge Functions

### generate-content

Generates blog post content using OpenAI GPT-4.

**Endpoint**: `https://[YOUR-PROJECT].supabase.co/functions/v1/generate-content`

**Method**: `POST`

**Headers**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer [ANON-KEY or USER-JWT]"
}
```

**Request Body**:
```typescript
{
  systemPrompt: string;    // Required: System instructions for AI
  userPrompt: string;      // Required: User prompt with PR details
  temperature?: number;    // Optional: Creativity (0-1), default 0.7
}
```

**Response**:
```typescript
// Success 200
{
  content: string;  // Generated blog post in Markdown
}

// Error 400
{
  error: "Both systemPrompt and userPrompt are required"
}

// Error 500
{
  error: "Failed to generate content",
  details?: string  // Optional error details
}
```

**Example**:
```javascript
const { data, error } = await supabase.functions.invoke('generate-content', {
  body: {
    systemPrompt: 'You are a technical blog writer...',
    userPrompt: 'Write about PR #123...',
    temperature: 0.7
  }
});
```

## GitHub API Integration

### fetchPRData

Fetches pull request data from GitHub.

**Function**: `fetchPRData(prUrl: string)`

**Returns**:
```typescript
interface PullRequestData {
  title: string;
  description: string;
  commits: Array<{
    message: string;
    sha: string;
    url: string;
  }>;
  files: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
  }>;
  author: {
    login: string;
    avatar: string;
  };
  created_at: string;
  updated_at: string;
}
```

**Usage**:
```typescript
import { fetchPRData } from '@/lib/github';

try {
  const prData = await fetchPRData('https://github.com/owner/repo/pull/123');
  console.log(prData.title);
} catch (error) {
  // Handle rate limits or invalid URLs
}
```

## Supabase Database

### Tables

#### cached_posts

Stores generated blog posts.

```typescript
interface CachedPost {
  id: string;          // UUID
  pr_url: string;      // GitHub PR URL
  title: string;       // PR title
  content: string;     // Generated content
  user_id: string;     // User who generated it
  created_at: string;  // ISO timestamp
}
```

**Operations**:
```typescript
// Create
const { data, error } = await supabase
  .from('cached_posts')
  .insert({
    pr_url,
    title,
    content,
    user_id
  })
  .select()
  .single();

// Read
const { data, error } = await supabase
  .from('cached_posts')
  .select('*')
  .eq('id', postId)
  .single();

// Update
const { error } = await supabase
  .from('cached_posts')
  .update({ content })
  .eq('id', postId);

// Delete
const { error } = await supabase
  .from('cached_posts')
  .delete()
  .eq('id', postId);
```

#### user_preferences

Stores user settings and writing samples.

```typescript
interface UserPreferences {
  id: string;
  user_id: string;
  writing_samples: string[];
  preferred_tone: 'casual' | 'professional' | 'technical';
  preferred_length: 'short' | 'medium' | 'long';
  custom_instructions?: string;
  created_at: string;
  updated_at: string;
}
```

**Operations**:
```typescript
// Get preferences
const { data, error } = await supabase
  .from('user_preferences')
  .select('*')
  .eq('user_id', userId)
  .single();

// Upsert preferences
const { error } = await supabase
  .from('user_preferences')
  .upsert({
    user_id: userId,
    writing_samples,
    preferred_tone,
    preferred_length,
    custom_instructions
  });
```

#### regeneration_presets

Predefined regeneration options.

```typescript
interface RegenerationPreset {
  id: string;
  name: string;
  description: string;
  system_prompt_modifier: string;
  user_prompt_modifier: string;
  temperature: number;
  is_default: boolean;
  created_at: string;
}
```

**Operations**:
```typescript
// Get all presets
const { data, error } = await supabase
  .from('regeneration_presets')
  .select('*')
  .order('name');
```

#### regeneration_history

Tracks content regeneration attempts.

```typescript
interface RegenerationHistory {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  regeneration_type: 'preset' | 'custom' | 'user_style';
  preset_used?: string;
  custom_prompt?: string;
  user_preferences_snapshot?: object;
  created_at: string;
}
```

**Operations**:
```typescript
// Add history entry
const { error } = await supabase
  .from('regeneration_history')
  .insert({
    user_id,
    post_id,
    content,
    regeneration_type,
    preset_used
  });

// Get history for a post
const { data, error } = await supabase
  .from('regeneration_history')
  .select('*')
  .eq('post_id', postId)
  .order('created_at', { ascending: false });
```

## Authentication

### Sign In

```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: window.location.origin
  }
});
```

### Sign Out

```typescript
const { error } = await supabase.auth.signOut();
```

### Get Session

```typescript
const { data: { session } } = await supabase.auth.getSession();

if (session) {
  // User is authenticated
  const userId = session.user.id;
  const githubToken = session.provider_token;
}
```

### Session Listener

```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    if (event === 'SIGNED_IN') {
      // Handle sign in
    } else if (event === 'SIGNED_OUT') {
      // Handle sign out
    }
  }
);

// Cleanup
subscription.unsubscribe();
```

## Utility Functions

### buildEnhancedSystemPrompt

Builds system prompt with user preferences.

```typescript
function buildEnhancedSystemPrompt(
  userPreferences?: UserPreferences,
  regenerationOptions?: RegenerationOptions
): string
```

### buildEnhancedUserPrompt

Builds user prompt with PR data.

```typescript
function buildEnhancedUserPrompt(
  prData: PullRequestData,
  regenerationOptions?: RegenerationOptions
): string
```

### analyzeWritingStyle

Analyzes writing samples to determine style.

```typescript
function analyzeWritingStyle(
  writingSamples: string[]
): WritingStyle

interface WritingStyle {
  tone: 'casual' | 'professional' | 'technical';
  avgSentenceLength: number;
  vocabularyLevel: 'simple' | 'intermediate' | 'advanced';
  structurePreference: 'narrative' | 'structured' | 'tutorial';
  codeExampleStyle: 'minimal' | 'detailed' | 'annotated';
}
```

## Error Handling

### Common Error Codes

- `PGRST116` - No rows returned (Supabase)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (RLS policy violation)
- `429` - Rate limit exceeded
- `500` - Internal server error

### Error Response Format

```typescript
interface ErrorResponse {
  error: string;        // Human-readable error message
  code?: string;        // Error code
  details?: any;        // Additional error details
}
```

## Rate Limits

### GitHub API
- **Authenticated**: 5,000 requests/hour
- **Unauthenticated**: 60 requests/hour

### OpenAI API
- Based on your OpenAI plan
- Typically 3,500 requests/minute for GPT-4

### Supabase
- **Database**: Based on plan
- **Edge Functions**: 500K/month (free tier)
- **Auth**: 50K MAU (free tier)