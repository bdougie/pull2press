import { generateBlogPost as generateOpenAIBlogPost } from './openai';
import { generateBlogPost as generateOllamaBlogPost, isOllamaAvailable } from './ollama';

// Function to choose the appropriate generator based on environment
export async function generateBlogPost(prData: any) {
  // In development or local environment, try to use Ollama first
  if (import.meta.env.DEV) {
    try {
      const ollamaAvailable = await isOllamaAvailable();
      if (ollamaAvailable) {
        return await generateOllamaBlogPost(prData);
      }
    } catch (error) {
      console.warn('Ollama not available, falling back to OpenAI:', error);
    }
  }
  
  // Fall back to OpenAI
  return generateOpenAIBlogPost(prData);
}

export { generateOpenAIBlogPost, generateOllamaBlogPost, isOllamaAvailable };
