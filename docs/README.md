# Pull2Press Documentation

Welcome to the Pull2Press documentation! This guide covers the architecture, authentication flows, deployment instructions, and performance optimizations for the application.

## Table of Contents

### Core Documentation
- [Architecture Overview](./architecture.md)
- [Authentication Guide](./authentication.md)
- [Supabase Functions](./supabase-functions.md)
- [Deployment Guide](./deployment.md)
- [API Reference](./api-reference.md)
- [Local Development](./local-development.md)

### Performance & APIs
- [API Setup Guide](./API_SETUP.md) - GitHub and OpenAI API configuration
- [Performance Optimization](./PERFORMANCE_OPTIMIZATION.md) - Speed improvements and benchmarks

## Quick Start

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your Supabase credentials
3. Install dependencies: `npm install`
4. Run locally: `npm run dev`

For detailed API setup, see the [API Setup Guide](./API_SETUP.md).

## Key Features

- **GitHub PR to Blog Post**: Transform pull requests into technical blog posts
- **AI-Powered Generation**: Uses OpenAI GPT-4 for content generation
- **User Preferences**: Customize writing style and tone
- **Regeneration Options**: Multiple ways to regenerate content
- **Authentication**: GitHub OAuth via Supabase Auth
- **Performance Optimized**: Parallel API calls, visual progress indicators

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + Shadcn UI
- **Backend**: Supabase (Database + Auth + Edge Functions)
- **AI**: OpenAI GPT-4
- **Deployment**: Netlify (frontend) + Supabase (backend)

## Development Tools

### Performance Testing
```bash
# Run performance demo
npm run demo:perf

# Test with real APIs (requires .env setup)
npm run test:perf:node https://github.com/owner/repo/pull/123
```

### Environment Setup
```bash
# Copy example environment
cp .env.example .env

# Add your API keys to .env (for local testing)
# OPENAI_API_KEY=sk-...
# GITHUB_TOKEN=ghp-...
```

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│   Netlify   │────▶│  Supabase   │
│   (React)   │     │   (Static)  │     │  (Backend)  │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                    ┌─────────┴────────┐
                                    ▼                  ▼
                              ┌──────────┐      ┌──────────┐
                              │ GitHub   │      │ OpenAI   │
                              │   API    │      │   API    │
                              └──────────┘      └──────────┘
```

## Contributing

When adding new features or optimizations:
1. Document API changes in [API_SETUP.md](./API_SETUP.md)
2. Update performance benchmarks in [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md)
3. Add architectural changes to [architecture.md](./architecture.md)
4. Update this index with new documentation

## Support

- **Issues**: [GitHub Issues](https://github.com/bdougie/pull2press/issues)
- **Discussions**: [GitHub Discussions](https://github.com/bdougie/pull2press/discussions)