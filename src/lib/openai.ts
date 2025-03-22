import OpenAI from 'openai';
import { PullRequestData, getSystemPrompt, buildUserPrompt } from './prompt-utils';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function generateBlogPost(prData: PullRequestData) {
  const systemPrompt = getSystemPrompt();
  const userPrompt = buildUserPrompt(prData);

  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    model: "gpt-4-turbo-preview",
    temperature: 0.7,
    max_tokens: 2000,
  });

  return completion.choices[0].message.content || '';
}