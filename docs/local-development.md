# Local Development Guide

This guide helps you set up Pull2Press for local development.

## Prerequisites

- Node.js 18+ and npm
- Git
- Supabase CLI (optional, for local Supabase)
- GitHub account (for OAuth testing)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/bdougie/pull2press.git
cd pull2press
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://[YOUR-PROJECT].supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Start Development Server

```bash
npm run dev
```

Visit http://localhost:5173

## Local Supabase Development (Optional)

For complete local development without depending on cloud Supabase:

### 1. Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows/Linux
npm install -g supabase
```

### 2. Start Local Supabase

```bash
supabase start
```

This starts:
- PostgreSQL database (port 54322)
- Auth server (port 54321)
- Storage server
- Realtime server
- Edge Functions runtime

### 3. Update Environment Variables

Use local Supabase URLs:

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=[local-anon-key-from-supabase-start-output]
```

### 4. Run Migrations

```bash
supabase db reset
```

### 5. Serve Edge Functions Locally

```bash
# In a separate terminal
supabase functions serve generate-content --env-file .env
```

Add to `.env`:
```env
OPENAI_API_KEY=sk-...
```

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Coverage report
npm run coverage
```

### Linting

```bash
# Run ESLint
npm run lint

# Run TypeScript compiler check
npx tsc --noEmit
```

### Building

```bash
# Development build
npm run build

# Production build
npm run build:prod

# Preview production build
npm run preview
```

## Common Development Tasks

### Adding a New Component

1. Create component in `src/components/`
2. Add tests in same directory with `.test.tsx`
3. Export from `src/components/index.ts` if needed

### Adding a Database Table

1. Create migration:
   ```bash
   supabase migration new table_name
   ```
2. Edit migration in `supabase/migrations/`
3. Apply migration:
   ```bash
   supabase db reset
   ```

### Adding an Edge Function

1. Create function:
   ```bash
   supabase functions new function-name
   ```
2. Implement in `supabase/functions/function-name/index.ts`
3. Test locally:
   ```bash
   supabase functions serve function-name
   ```

### Modifying UI Components

We use Shadcn UI. To add a new component:

```bash
# This would work with the Shadcn CLI if set up
# For now, copy from components/ui/
```

## Debugging

### React DevTools

1. Install React DevTools browser extension
2. Use Components and Profiler tabs

### Network Debugging

1. Open browser DevTools Network tab
2. Check for:
   - Failed requests (red)
   - CORS errors
   - 401/403 auth errors

### Supabase Debugging

1. Check Supabase logs:
   ```bash
   supabase db logs
   ```

2. Test database queries:
   ```bash
   supabase db query "SELECT * FROM cached_posts"
   ```

3. Check function logs:
   ```bash
   supabase functions logs generate-content
   ```

### Common Issues

#### "Missing Supabase environment variables"
- Ensure `.env` file exists
- Check variable names start with `VITE_`
- Restart dev server after changing `.env`

#### "Failed to fetch PR data"
- Check GitHub API rate limits
- Try signing in for higher limits
- Verify PR URL is valid and public

#### "Failed to generate content"
- Check OpenAI API key is set
- Verify Supabase function is running
- Check browser console for errors

#### CORS Errors
- Ensure Supabase URL is correct
- Check if running local Supabase
- Verify Edge Function CORS headers

## Development Best Practices

### Code Style

- Use TypeScript for type safety
- Follow existing component patterns
- Keep components small and focused
- Write tests for new features

### Git Workflow

1. Create feature branch:
   ```bash
   git checkout -b feature/your-feature
   ```

2. Make changes and commit:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. Push and create PR:
   ```bash
   git push origin feature/your-feature
   ```

### Testing Checklist

Before pushing:
- [ ] Run `npm test`
- [ ] Run `npm run lint`
- [ ] Test manually in browser
- [ ] Check console for errors
- [ ] Test both authenticated and unauthenticated flows

## Performance Tips

### Hot Module Replacement (HMR)

Vite provides fast HMR. If it's not working:

1. Check for syntax errors
2. Restart dev server
3. Clear browser cache

### Build Performance

- Keep dependencies up to date
- Use dynamic imports for large components
- Minimize asset sizes

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com/)