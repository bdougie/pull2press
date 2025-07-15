# Performance Optimization for Pull2Press

## Overview

This branch implements performance optimizations to reduce PR processing time from 60+ seconds to under 15 seconds through:

1. **Parallel API Calls** - Fetch PR details, commits, and files simultaneously
2. **Visual Progress Indicators** - Show users real-time progress during processing
3. **Smart Caching** - Check for cached content before processing

## Testing Performance

### Setup
```bash
# Copy environment variables
cp .env.example .env

# Add your GitHub token and OpenAI API key to .env
# GITHUB_TOKEN=your_github_token
# OPENAI_API_KEY=your_openai_api_key
```

### Run Performance Tests
```bash
# Test with a specific PR
npm run test:perf:node https://github.com/bdougie/dinnerpeople/pull/21

# Test with default PR
npm run test:perf:node
```

## Key Optimizations

### 1. Parallel Data Fetching (3-4x faster)
```typescript
// Before: Sequential (slow)
const pr = await octokit.rest.pulls.get(...)
const commits = await octokit.rest.pulls.listCommits(...)
const files = await octokit.rest.pulls.listFiles(...)

// After: Parallel (fast)
const [pr, commits, files] = await Promise.all([
  octokit.rest.pulls.get(...),
  octokit.rest.pulls.listCommits(...),
  octokit.rest.pulls.listFiles(...)
])
```

### 2. Progress Tracking
- Real-time progress updates during each stage
- Visual indicators for Fetch → Analyze → Generate
- Percentage completion display

### 3. Data Limits for Large PRs
- Limit to 20 most recent commits
- Limit to 50 most changed files
- Include summary statistics for content generation

## Usage

### Using the Optimized Component
```tsx
import HomeOptimized from './pages/HomeOptimized';

// Replace the default Home component with HomeOptimized
<HomeOptimized user={user} />
```

### Progress Callback Pattern
```typescript
const prData = await fetchPRDataOptimized(prUrl, (progress) => {
  console.log(`${progress.stage}: ${progress.progress}%`);
});
```

## Performance Results

Based on testing with https://github.com/bdougie/dinnerpeople/pull/21:

- **Sequential Fetch**: ~3.2s
- **Parallel Fetch**: ~0.9s (72% improvement)
- **Content Generation**: ~8-12s (OpenAI API dependent)
- **Total Time**: ~10-15s (vs 60s+ on slow connections)

## Next Steps

1. Implement request caching with TTL
2. Add WebSocket support for real-time updates
3. Stream OpenAI responses for faster perceived performance
4. Implement progressive enhancement for slow connections