# Authentication Guide

Pull2Press uses Supabase Auth with GitHub OAuth for user authentication. The app supports both authenticated and unauthenticated usage with different capabilities.

## Authentication Flow

### Authenticated Users

1. **Login Process**
   - User clicks "Sign in with GitHub"
   - Redirected to GitHub OAuth consent page
   - GitHub redirects back with auth code
   - Supabase exchanges code for tokens
   - User session created with GitHub access token

2. **Benefits**
   - Higher GitHub API rate limits (5,000 requests/hour)
   - Ability to save and manage posts
   - Access to user preferences and writing samples
   - Regeneration history tracking

3. **Token Usage**
   ```typescript
   // The GitHub token is available in the session
   const { data: { session } } = await supabase.auth.getSession();
   
   if (session?.provider_token) {
     // Use authenticated GitHub API
     const octokit = new Octokit({ auth: session.provider_token });
   }
   ```

### Unauthenticated Users

1. **Capabilities**
   - Can generate blog posts from public GitHub PRs
   - Limited to GitHub's public API rate limit (60 requests/hour)
   - Generated content is not saved
   - No access to preferences or regeneration features

2. **Rate Limit Handling**
   ```typescript
   try {
     // Make GitHub API call
   } catch (error) {
     if (error.message.includes('rate limit')) {
       throw new Error('GitHub API rate limit exceeded. Please sign in to continue.');
     }
   }
   ```

## Implementation Details

### Auth Button Component

Located at: `src/components/auth-button.tsx`

The auth button handles:
- Sign in with GitHub
- Sign out
- User avatar display
- Loading states

### Session Management

Supabase Auth automatically:
- Persists sessions in localStorage
- Refreshes tokens before expiry
- Handles redirect flows

### Protected Routes

While the app doesn't have strict protected routes, certain features are only available to authenticated users:

- `/edit/:id` - Can only access saved posts if authenticated
- Settings page - Only accessible when signed in
- Post saving - Requires authentication

## GitHub OAuth Setup

### Supabase Configuration

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Providers
3. Enable GitHub provider
4. Add your GitHub OAuth App credentials:
   - Client ID
   - Client Secret
   - Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### GitHub OAuth App Setup

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL to your Supabase callback URL
4. Copy Client ID and Client Secret to Supabase

### Environment Variables

No GitHub OAuth credentials needed in `.env` - they're configured in Supabase dashboard.

```env
# Only Supabase credentials needed
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Security Considerations

1. **Token Storage**: GitHub access tokens are managed by Supabase Auth
2. **Token Refresh**: Supabase automatically refreshes tokens
3. **Scope**: Only public repo access is requested
4. **Rate Limiting**: Implemented to prevent API abuse

## Troubleshooting

### Common Issues

1. **"Sign in failed"**
   - Check Supabase Auth settings
   - Verify GitHub OAuth app configuration
   - Check redirect URLs match

2. **"Rate limit exceeded"**
   - Sign in to get higher limits
   - Wait for rate limit reset (1 hour for public API)

3. **"Session expired"**
   - Supabase should auto-refresh
   - If not, user needs to sign in again