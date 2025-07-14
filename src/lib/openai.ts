import { PullRequestData, getSystemPrompt, buildUserPrompt } from './prompt-utils';

export async function generateBlogPost(
  prData: PullRequestData,
  options?: {
    systemPrompt?: string;
    userPrompt?: string;
    temperature?: number;
  }
) {
  const systemPrompt = options?.systemPrompt || getSystemPrompt();
  const userPrompt = options?.userPrompt || buildUserPrompt(prData);
  const temperature = options?.temperature || 0.7;

  // Use Netlify Function for OpenAI calls
  const endpoint = import.meta.env.DEV 
    ? '/.netlify/functions/generate-content'
    : '/.netlify/functions/generate-content';
    
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemPrompt,
      userPrompt,
      temperature,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to generate content');
  }

  const data = await response.json();
  return data.content;
}
