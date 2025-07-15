import { pipeline, env } from '@xenova/transformers';

// Configure Transformers.js
env.allowLocalModels = false;
env.useBrowserCache = false;

// Cache the pipeline to avoid recreating it
let embeddingPipeline: any = null;

/**
 * Initialize the embedding pipeline
 * Uses all-MiniLM-L6-v2 for good balance of speed and quality
 */
async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',
      { quantized: true } // Use quantized model for faster inference
    );
  }
  return embeddingPipeline;
}

/**
 * Generate embeddings for a single text
 * @param text - The text to embed
 * @returns A normalized embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const extractor = await getEmbeddingPipeline();
  
  // Generate embeddings
  const output = await extractor(text, {
    pooling: 'mean',
    normalize: true
  });
  
  // Convert to regular array
  return Array.from(output.data);
}

/**
 * Generate embeddings for multiple texts in batch
 * @param texts - Array of texts to embed
 * @returns Array of embedding vectors
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const extractor = await getEmbeddingPipeline();
  
  // Process in batches for efficiency
  const batchSize = 32;
  const embeddings: number[][] = [];
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    
    // Generate embeddings for batch
    const outputs = await Promise.all(
      batch.map(text => extractor(text, {
        pooling: 'mean',
        normalize: true
      }))
    );
    
    // Convert to arrays
    outputs.forEach(output => {
      embeddings.push(Array.from(output.data));
    });
  }
  
  return embeddings;
}

/**
 * Calculate cosine similarity between two embeddings
 * @param a - First embedding vector
 * @param b - Second embedding vector
 * @returns Similarity score between -1 and 1
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find the most similar texts to a query
 * @param query - The query text
 * @param texts - Array of texts to search
 * @param topK - Number of results to return
 * @returns Array of indices and scores of most similar texts
 */
export async function findSimilar(
  query: string,
  texts: string[],
  topK: number = 5
): Promise<Array<{ index: number; score: number; text: string }>> {
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  
  // Generate embeddings for all texts
  const textEmbeddings = await generateEmbeddings(texts);
  
  // Calculate similarities
  const similarities = textEmbeddings.map((embedding, index) => ({
    index,
    score: cosineSimilarity(queryEmbedding, embedding),
    text: texts[index]
  }));
  
  // Sort by similarity and return top K
  return similarities
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Prepare text for embedding by cleaning and truncating
 * @param text - Raw text
 * @param maxLength - Maximum length (default 512 tokens ~2000 chars)
 * @returns Cleaned text
 */
export function prepareTextForEmbedding(text: string, maxLength: number = 2000): string {
  // Clean whitespace
  let cleaned = text.trim().replace(/\s+/g, ' ');
  
  // Truncate if needed
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength) + '...';
  }
  
  return cleaned;
}