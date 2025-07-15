# Local Embeddings with Transformers.js

This document describes the local embedding generation system that replaces expensive OpenAI embeddings with free, open-source alternatives.

## Overview

Pull2Press now uses **Transformers.js** with the **all-MiniLM-L6-v2** model to generate embeddings locally. This provides:

- **Zero API costs** - Embeddings are generated on your machine
- **Better privacy** - Your content never leaves your infrastructure
- **Good performance** - 384-dimensional embeddings with excellent quality
- **Fast inference** - Quantized model for quick embedding generation

## Architecture

### Model Choice

We use `all-MiniLM-L6-v2` because it offers:
- Excellent balance of speed and quality
- Small model size (~80MB)
- 384-dimensional embeddings (compact but effective)
- Trained on over 1 billion sentence pairs
- Consistently ranks well in embedding benchmarks

### Components

1. **Embedding Generation** (`/src/lib/embeddings.ts`)
   - Loads and caches the transformer model
   - Generates normalized embeddings
   - Supports batch processing
   - Includes similarity calculations

2. **Database Storage**
   - Embeddings stored in `cached_posts.embedding` column
   - Uses PostgreSQL's `vector` type (requires pgvector extension)
   - Indexed for fast similarity search

3. **Semantic Search** (`/src/lib/semantic-search.ts`)
   - Query-based semantic search
   - Find related posts functionality
   - Automatic embedding updates

## Usage

### Generate Embeddings

Run the embedding generation script:

```bash
npm run embeddings:generate
```

This will:
1. Fetch all posts without embeddings
2. Generate embeddings using the local model
3. Store them in Supabase

### Programmatic Usage

```typescript
import { generateEmbedding, findSimilar } from './lib/embeddings';

// Generate embedding for text
const embedding = await generateEmbedding("Your text here");

// Find similar texts
const similar = await findSimilar(
  "search query",
  ["text1", "text2", "text3"],
  topK = 3
);
```

### Semantic Search

```typescript
import { semanticSearch } from './lib/semantic-search';

// Search for similar posts
const results = await semanticSearch(
  "performance optimization",
  limit = 5,
  threshold = 0.5
);
```

### Auto-update Embeddings

Use the hook to automatically update embeddings when content changes:

```typescript
import { useAutoUpdateEmbedding } from './hooks/useEmbeddings';

function YourComponent({ postId, content }) {
  // Automatically updates embedding 5 seconds after content stops changing
  useAutoUpdateEmbedding(postId, content);
}
```

## Database Setup

1. Enable pgvector extension in Supabase:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. Run the migration:
   ```bash
   supabase migration up
   ```

## Performance Considerations

### Model Loading
- First load takes 5-10 seconds
- Subsequent calls use cached model
- Model size: ~80MB download

### Embedding Speed
- Single text: ~50-100ms
- Batch of 32: ~500ms
- Scales linearly with text count

### Storage
- Each embedding: 384 floats × 4 bytes = 1.5KB
- 1000 posts ≈ 1.5MB of embeddings

## Comparison with OpenAI

| Feature | OpenAI ada-002 | all-MiniLM-L6-v2 |
|---------|----------------|-------------------|
| Cost | $0.10/1M tokens | Free |
| Dimensions | 1536 | 384 |
| Quality | Excellent | Very Good |
| Speed | API latency | ~50ms local |
| Privacy | API call | Fully local |
| Maintenance | None | Model updates |

## Best Practices

1. **Text Preparation**
   - Combine title and content for better context
   - Limit to 2000 characters (≈512 tokens)
   - Clean excessive whitespace

2. **Batch Processing**
   - Process multiple texts together
   - Use batch size of 32 for optimal throughput

3. **Similarity Threshold**
   - 0.7+ for high similarity
   - 0.5+ for moderate similarity
   - 0.3+ for loose similarity

4. **Update Strategy**
   - Generate on content creation
   - Regenerate on significant edits
   - Batch process during off-hours

## Troubleshooting

### Model Download Fails
- Check internet connection
- Clear cache: `rm -rf node_modules/.cache/transformers`
- Retry with: `npm run embeddings:generate`

### Out of Memory
- Reduce batch size in generate script
- Use quantized model (default)
- Process in smaller chunks

### Slow Performance
- Ensure model is cached after first run
- Check CPU usage
- Consider using GPU acceleration (future)

## Future Enhancements

1. **GPU Acceleration** - Use WebGL/WebGPU for faster inference
2. **Better Models** - Upgrade to BGE or Instructor models
3. **Vector Database** - Integrate specialized vector DB
4. **Hybrid Search** - Combine with keyword search
5. **Multilingual** - Support non-English content