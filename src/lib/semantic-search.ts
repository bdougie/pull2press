import { supabase } from './supabase';
import { generateEmbedding, cosineSimilarity } from './embeddings';

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  pr_url: string;
  similarity: number;
  created_at: string;
}

/**
 * Search for similar blog posts using semantic search
 * @param query - The search query
 * @param limit - Maximum number of results
 * @param threshold - Minimum similarity score (0-1)
 * @returns Array of similar posts
 */
export async function semanticSearch(
  query: string,
  limit: number = 5,
  threshold: number = 0.5
): Promise<SearchResult[]> {
  try {
    // Generate embedding for the query
    console.log('Generating query embedding...');
    const queryEmbedding = await generateEmbedding(query);
    
    // Fetch all posts with embeddings
    // In production, you'd want to use a vector database like pgvector
    const { data: posts, error } = await supabase
      .from('cached_posts')
      .select('id, title, content, pr_url, embedding, created_at')
      .not('embedding', 'is', null);
    
    if (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
    
    if (!posts || posts.length === 0) {
      return [];
    }
    
    // Calculate similarities
    const results = posts
      .map(post => {
        const similarity = cosineSimilarity(queryEmbedding, post.embedding);
        return {
          id: post.id,
          title: post.title,
          content: post.content.substring(0, 200) + '...',
          pr_url: post.pr_url,
          similarity,
          created_at: post.created_at
        };
      })
      .filter(result => result.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    return results;
    
  } catch (error) {
    console.error('Semantic search error:', error);
    return [];
  }
}

/**
 * Find related posts to a given post
 * @param postId - The ID of the post to find related posts for
 * @param limit - Maximum number of results
 * @returns Array of related posts
 */
export async function findRelatedPosts(
  postId: string,
  limit: number = 3
): Promise<SearchResult[]> {
  try {
    // Get the post and its embedding
    const { data: post, error } = await supabase
      .from('cached_posts')
      .select('embedding, title')
      .eq('id', postId)
      .single();
    
    if (error || !post?.embedding) {
      console.error('Error fetching post:', error);
      return [];
    }
    
    // Find similar posts
    const { data: posts, error: searchError } = await supabase
      .from('cached_posts')
      .select('id, title, content, pr_url, embedding, created_at')
      .neq('id', postId)
      .not('embedding', 'is', null);
    
    if (searchError || !posts) {
      return [];
    }
    
    // Calculate similarities
    const results = posts
      .map(p => {
        const similarity = cosineSimilarity(post.embedding, p.embedding);
        return {
          id: p.id,
          title: p.title,
          content: p.content.substring(0, 200) + '...',
          pr_url: p.pr_url,
          similarity,
          created_at: p.created_at
        };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    return results;
    
  } catch (error) {
    console.error('Find related posts error:', error);
    return [];
  }
}

/**
 * Update embedding for a specific post
 * @param postId - The post ID to update
 * @returns Success boolean
 */
export async function updatePostEmbedding(postId: string): Promise<boolean> {
  try {
    // Fetch the post
    const { data: post, error } = await supabase
      .from('cached_posts')
      .select('title, content')
      .eq('id', postId)
      .single();
    
    if (error || !post) {
      console.error('Error fetching post:', error);
      return false;
    }
    
    // Generate embedding
    const textToEmbed = `${post.title}\n\n${post.content}`.substring(0, 2000);
    const embedding = await generateEmbedding(textToEmbed);
    
    // Update in database
    const { error: updateError } = await supabase
      .from('cached_posts')
      .update({
        embedding,
        embedding_model: 'all-MiniLM-L6-v2',
        embedding_updated_at: new Date().toISOString()
      })
      .eq('id', postId);
    
    if (updateError) {
      console.error('Error updating embedding:', updateError);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('Update embedding error:', error);
    return false;
  }
}