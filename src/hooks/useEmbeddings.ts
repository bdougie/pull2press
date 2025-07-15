import { useEffect } from 'react';
import { updatePostEmbedding } from '../lib/semantic-search';

/**
 * Hook to automatically update embeddings when content changes
 * @param postId - The post ID
 * @param content - The content to embed
 * @param enabled - Whether to enable auto-update
 */
export function useAutoUpdateEmbedding(
  postId: string | null,
  content: string,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!postId || !content || !enabled) return;

    // Debounce the update to avoid too many API calls
    const timeoutId = setTimeout(async () => {
      try {
        await updatePostEmbedding(postId);
        console.log('Embedding updated for post:', postId);
      } catch (error) {
        console.error('Failed to update embedding:', error);
      }
    }, 5000); // Wait 5 seconds after last change

    return () => clearTimeout(timeoutId);
  }, [postId, content, enabled]);
}