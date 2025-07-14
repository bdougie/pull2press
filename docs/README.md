# Pull2Press Documentation

Welcome to the Pull2Press documentation! This guide covers the architecture, authentication flows, and deployment instructions for the application.

## Table of Contents

- [Architecture Overview](./architecture.md)
- [Authentication Guide](./authentication.md)
- [Supabase Functions](./supabase-functions.md)
- [Deployment Guide](./deployment.md)
- [API Reference](./api-reference.md)

## Quick Start

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your Supabase credentials
3. Install dependencies: `npm install`
4. Run locally: `npm run dev`

## Key Features

- **GitHub PR to Blog Post**: Transform pull requests into technical blog posts
- **AI-Powered Generation**: Uses OpenAI GPT-4 for content generation
- **User Preferences**: Customize writing style and tone
- **Regeneration Options**: Multiple ways to regenerate content
- **Authentication**: GitHub OAuth via Supabase Auth

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + Shadcn UI
- **Backend**: Supabase (Database + Auth + Edge Functions)
- **AI**: OpenAI GPT-4
- **Deployment**: Netlify (frontend) + Supabase (backend)