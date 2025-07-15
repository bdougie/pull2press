# Architecture Overview

Pull2Press is built with a modern, serverless architecture leveraging Supabase for backend services and React for the frontend.

## System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   React App     │────▶│  Supabase Edge  │────▶│   OpenAI API    │
│   (Vite)        │     │   Functions     │     │   (GPT-4)       │
│                 │     │                 │     │                 │
└────────┬────────┘     └─────────────────┘     └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│  Supabase Auth  │     │ Supabase DB     │
│  (GitHub OAuth) │     │  (PostgreSQL)   │
│                 │     │                 │
└─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│                 │
│   GitHub API    │
│                 │
└─────────────────┘
```

## Frontend Architecture

### Tech Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Shadcn UI
- **Routing**: React Router v7
- **State Management**: React hooks + Context (via Supabase)
- **Testing**: Vitest + React Testing Library

### Key Components

```
src/
├── components/
│   ├── auth-button.tsx         # GitHub authentication
│   ├── markdown-editor.tsx     # Blog post editor
│   ├── regeneration-dropdown.tsx # Content regeneration
│   └── ui/                     # Shadcn UI components
├── lib/
│   ├── github.ts              # GitHub API integration
│   ├── openai.ts              # OpenAI integration
│   ├── supabase.ts            # Supabase client
│   ├── enhanced-prompt-utils.ts # AI prompt generation
│   └── prompt-utils.ts        # Basic prompt utilities
├── pages/
│   ├── Home.tsx               # Landing page
│   ├── Edit.tsx               # Post editor
│   └── Settings.tsx           # User preferences
└── App.tsx                    # Main app component
```

## Backend Architecture

### Supabase Services

1. **Database (PostgreSQL)**
   - `cached_posts`: Stores generated blog posts
   - `user_preferences`: User settings and writing samples
   - `regeneration_presets`: Predefined regeneration options
   - `regeneration_history`: Track regeneration attempts

2. **Authentication**
   - GitHub OAuth provider
   - Session management
   - JWT tokens with GitHub access token

3. **Edge Functions**
   - `generate-content`: OpenAI API integration
   - Deno runtime
   - Deployed at edge locations

4. **Row Level Security (RLS)**
   - Users can only access their own data
   - Automatic policy enforcement

### Database Schema

```sql
-- Main posts table
cached_posts (
  id uuid PRIMARY KEY,
  pr_url text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  user_id uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now()
)

-- User preferences
user_preferences (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users UNIQUE,
  writing_samples text[],
  preferred_tone varchar(50),
  preferred_length varchar(50),
  custom_instructions text,
  created_at timestamptz,
  updated_at timestamptz
)

-- Regeneration options
regeneration_presets (
  id uuid PRIMARY KEY,
  name varchar(100),
  description text,
  system_prompt_modifier text,
  user_prompt_modifier text,
  temperature decimal(3,2),
  is_default boolean
)

-- History tracking
regeneration_history (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  post_id uuid REFERENCES cached_posts,
  content text,
  regeneration_type varchar(50),
  preset_used varchar(100),
  custom_prompt text,
  user_preferences_snapshot jsonb,
  created_at timestamptz
)
```

## Data Flow

### Content Generation Flow

1. **User Input**
   - User enters GitHub PR URL
   - Frontend validates URL format

2. **PR Data Fetching**
   - Authenticated: Uses user's GitHub token
   - Unauthenticated: Uses public GitHub API

3. **Content Generation**
   - Frontend prepares prompts
   - Calls Supabase Edge Function
   - Edge Function calls OpenAI API
   - Returns generated content

4. **Storage** (Authenticated only)
   - Save to `cached_posts` table
   - Navigate to editor with post ID

### Authentication Flow

1. **Sign In**
   - User clicks "Sign in with GitHub"
   - Redirect to GitHub OAuth
   - Callback to Supabase Auth
   - Session created with tokens

2. **Session Management**
   - Tokens stored in localStorage
   - Auto-refresh before expiry
   - Provider token for GitHub API

## API Integration

### GitHub API

```typescript
// Authenticated requests (higher rate limit)
const octokit = new Octokit({ 
  auth: session.provider_token 
});

// Unauthenticated requests (60/hour limit)
const octokit = new Octokit();
```

### OpenAI API

- Accessed via Supabase Edge Function
- Never exposed to frontend
- Uses GPT-4 Turbo model

### Supabase Client

```typescript
// Initialize once
const supabase = createClient(url, anonKey);

// Use throughout app
supabase.auth.getSession();
supabase.from('table').select();
supabase.functions.invoke('function-name');
```

## Security Architecture

### Frontend Security
- Environment variables prefixed with `VITE_`
- No sensitive keys in frontend code
- CORS properly configured

### Backend Security
- API keys stored as Supabase secrets
- Row Level Security on all tables
- JWT verification on functions

### Authentication Security
- OAuth 2.0 flow
- Tokens managed by Supabase
- Automatic token refresh

## Deployment Architecture

### Frontend (Netlify)
- Static site deployment
- Automatic builds from GitHub
- Environment variables configured

### Backend (Supabase)
- Managed PostgreSQL database
- Edge Functions globally distributed
- Automatic backups and scaling

## Performance Considerations

### Caching
- Generated posts cached in database
- React Query could be added for client caching

### Optimization
- Lazy loading for UI components
- Code splitting with React.lazy
- Tailwind CSS purging unused styles

### Scalability
- Serverless functions auto-scale
- Database connection pooling
- CDN for static assets