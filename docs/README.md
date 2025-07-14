# Pull2Press Documentation

Welcome to the Pull2Press documentation! This directory contains technical guides and references for developers working with Pull2Press.

## 📚 Documentation Index

### [API Setup Guide](./API_SETUP.md)
Complete guide for configuring GitHub and OpenAI APIs:
- GitHub API authentication and endpoints
- OpenAI GPT-4 integration
- Environment variables setup
- Cost considerations
- Security best practices
- Troubleshooting common issues

### [Performance Optimization](./PERFORMANCE_OPTIMIZATION.md)
Details on performance improvements implemented:
- Parallel API calls (2-3x faster)
- Visual progress indicators
- Smart caching strategies
- Performance testing scripts
- Optimization results and benchmarks

## 🚀 Quick Start

1. **Set up APIs**: Follow the [API Setup Guide](./API_SETUP.md)
2. **Run performance tests**: See [Performance Optimization](./PERFORMANCE_OPTIMIZATION.md)
3. **Deploy**: Check the main [README](../README.md) for deployment instructions

## 🔧 Development Tools

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

# Add your API keys to .env
# OPENAI_API_KEY=sk-...
# GITHUB_TOKEN=ghp-...
```

## 📊 Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│  Next.js    │────▶│  Supabase   │
│   (React)   │     │  API Routes │     │  (Auth/DB)  │
└─────────────┘     └─────────────┘     └─────────────┘
                            │
                    ┌───────┴────────┐
                    ▼                ▼
              ┌──────────┐    ┌──────────┐
              │ GitHub   │    │ OpenAI   │
              │   API    │    │   API    │
              └──────────┘    └──────────┘
```

## 🤝 Contributing

When adding new features or optimizations:
1. Document API changes in [API_SETUP.md](./API_SETUP.md)
2. Update performance benchmarks in [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md)
3. Add new guides to this index

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/bdougie/pull2press/issues)
- **Discussions**: [GitHub Discussions](https://github.com/bdougie/pull2press/discussions)