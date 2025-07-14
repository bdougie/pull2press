import { PullRequestData, getSystemPrompt, buildUserPrompt } from './prompt-utils';
import { supabase } from './supabase';

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

  // Use Supabase Edge Function for OpenAI calls
  const { data, error } = await supabase.functions.invoke('generate-content', {
    body: {
      systemPrompt,
      userPrompt,
      temperature,
    },
  });

  if (error) {
    console.error('Error calling Supabase function:', error);
    throw new Error(error.message || 'Failed to generate content');
  }

  if (!data || !data.content) {
    throw new Error('No content generated');
  }

  return data.content;
}
