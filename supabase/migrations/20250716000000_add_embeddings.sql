-- Add embedding columns to cached_posts table
ALTER TABLE cached_posts
ADD COLUMN IF NOT EXISTS embedding vector(384), -- all-MiniLM-L6-v2 produces 384-dimensional embeddings
ADD COLUMN IF NOT EXISTS embedding_model text,
ADD COLUMN IF NOT EXISTS embedding_updated_at timestamp with time zone;

-- Create index for faster similarity search
-- Note: This requires pgvector extension
CREATE INDEX IF NOT EXISTS cached_posts_embedding_idx ON cached_posts 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Add a function to search by similarity (optional, for SQL-based search)
CREATE OR REPLACE FUNCTION search_similar_posts(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  pr_url text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.id,
    cp.title,
    cp.content,
    cp.pr_url,
    1 - (cp.embedding <=> query_embedding) AS similarity
  FROM cached_posts cp
  WHERE cp.embedding IS NOT NULL
    AND 1 - (cp.embedding <=> query_embedding) > match_threshold
  ORDER BY cp.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;