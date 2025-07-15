# Deployment Guide

This guide covers deploying Pull2Press to production using Netlify for the frontend and Supabase for the backend.

## Prerequisites

- Node.js 18+ installed
- Supabase account and project created
- Netlify account (or similar hosting service)
- OpenAI API key

## Backend Setup (Supabase)

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project
3. Save your project URL and anon key

### 2. Configure GitHub OAuth

1. In Supabase Dashboard, go to Authentication > Providers
2. Enable GitHub provider
3. Create a GitHub OAuth App:
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - New OAuth App
   - Authorization callback URL: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`
4. Add Client ID and Secret to Supabase

### 3. Run Database Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref [YOUR-PROJECT-REF]

# Run migrations
supabase db push
```

### 4. Deploy Edge Functions

```bash
# Set OpenAI API key
supabase secrets set OPENAI_API_KEY=sk-...

# Deploy the generate-content function
supabase functions deploy generate-content
```

### 5. Configure Database Security

The migrations already include RLS policies, but verify they're enabled:

1. Go to Database > Tables
2. For each table, ensure RLS is enabled
3. Check policies are created

## Frontend Setup

### 1. Environment Variables

Create a `.env.production` file:

```env
VITE_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Build the Application

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Test the build locally
npm run preview
```

## Netlify Deployment

### 1. Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

### 2. Deploy via GitHub

1. Push your code to GitHub
2. In Netlify Dashboard:
   - New site from Git
   - Connect to GitHub
   - Select repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`

### 3. Configure Environment Variables

In Netlify Dashboard > Site settings > Environment variables:

```
VITE_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Configure Redirects

The `_redirects` file is already configured for SPA routing:

```
/* /index.html 200
```

## Post-Deployment

### 1. Test Authentication

1. Visit your deployed site
2. Click "Sign in with GitHub"
3. Authorize the app
4. Verify you're logged in

### 2. Test Content Generation

1. Find a public GitHub PR
2. Paste the URL
3. Generate content
4. Verify it saves (if authenticated)

### 3. Monitor Performance

#### Supabase Dashboard
- Monitor API usage
- Check function invocations
- Review database performance

#### Netlify Analytics
- Page views
- Performance metrics
- Build times

## Production Checklist

### Security
- [ ] Environment variables set correctly
- [ ] RLS policies enabled
- [ ] API keys secured in Supabase secrets
- [ ] CORS configured for production domain

### Performance
- [ ] Database indexes created
- [ ] Function cold starts acceptable
- [ ] Static assets cached
- [ ] Images optimized

### Monitoring
- [ ] Error tracking configured
- [ ] Uptime monitoring enabled
- [ ] Alerts configured
- [ ] Backup strategy in place

## Troubleshooting

### "Failed to fetch PR data"
- Check GitHub API rate limits
- Verify GitHub OAuth is configured
- Check CORS settings

### "Failed to generate content"
- Verify OpenAI API key is set
- Check Supabase function logs
- Verify function is deployed

### "Authentication failed"
- Check callback URLs match
- Verify GitHub OAuth credentials
- Check Supabase Auth settings

### Database Connection Issues
- Verify Supabase URL and key
- Check RLS policies
- Review connection pooling settings

## Scaling Considerations

### Database
- Enable connection pooling for high traffic
- Consider read replicas for scaling
- Monitor query performance

### Edge Functions
- Functions auto-scale
- Monitor cold start times
- Consider warming strategies

### Frontend
- Enable Netlify's CDN caching
- Use image optimization
- Consider lazy loading

## Backup and Recovery

### Database Backups
- Supabase provides daily backups (Pro plan)
- Consider additional backup strategies
- Test restore procedures

### Code Backups
- Use Git for version control
- Tag releases
- Document deployment process

## Cost Optimization

### Supabase
- Free tier: Good for development
- Pro tier ($25/mo): Production ready
- Monitor usage to avoid overages

### Netlify
- Free tier: 100GB bandwidth
- Pro tier: Better performance
- Consider build minute usage

### OpenAI
- Monitor token usage
- Implement caching where possible
- Consider rate limiting