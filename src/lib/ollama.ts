import { PullRequestData, getSystemPrompt, buildUserPrompt } from './prompt-utils';

// Ollama client configuration
const OLLAMA_API_URL = import.meta.env.VITE_OLLAMA_API_URL || 'http://localhost:11434';
const DEFAULT_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'llama3';

export async function generateBlogPost(prData: PullRequestData) {
  const systemPrompt = getSystemPrompt();
  const userPrompt = buildUserPrompt(prData);

  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        options: {
          temperature: 0.7,
        },
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.message?.content || '';
  } catch (error) {
    console.error('Error generating blog post with Ollama:', error);
    throw error;
  }
}

// Utility function to check if Ollama server is available
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/status`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}
