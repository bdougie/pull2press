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

  // Use server-side API route for OpenAI calls
  const response = await fetch('/api/generate-content', {
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
