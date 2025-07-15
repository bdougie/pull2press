import { OpenAI } from 'openai';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface PromptEditorOptions {
  maxMessages?: number;
  systemPrompt?: string;
}

const DEFAULT_SYSTEM_PROMPT = `You are an AI writing assistant integrated into a blog editor. 
When given text and instructions, provide helpful improvements, corrections, or additions.
Be concise and directly provide the improved text without excessive explanation.
Maintain the original tone and style unless specifically asked to change it.`;

export async function* streamPromptResponse(
  selectedText: string,
  userPrompt: string,
  previousMessages: ChatMessage[] = [],
  options: PromptEditorOptions = {}
): AsyncGenerator<string, void, unknown> {
  const { maxMessages = 5, systemPrompt = DEFAULT_SYSTEM_PROMPT } = options;

  // Get API key from environment or user preferences
  const apiKey = localStorage.getItem('openai_api_key') || '';
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please add it in settings.');
  }

  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });

  // Build context from previous messages (limited to last N messages)
  const contextMessages = previousMessages.slice(-maxMessages * 2); // *2 to account for user+assistant pairs

  // Build messages array
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...contextMessages,
    { 
      role: 'user', 
      content: `Selected text: "${selectedText}"\n\nInstruction: ${userPrompt}` 
    }
  ];

  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: messages as any,
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    console.error('Error streaming response:', error);
    throw error;
  }
}

// Token counting approximation (for display purposes)
export function estimateTokenCount(text: string): number {
  // Rough estimation: ~4 characters per token on average
  return Math.ceil(text.length / 4);
}

// Helper to manage conversation context
export class ConversationContext {
  private messages: ChatMessage[] = [];
  private maxMessages: number;

  constructor(maxMessages: number = 5) {
    this.maxMessages = maxMessages;
  }

  addMessage(message: ChatMessage) {
    this.messages.push(message);
    // Keep only the last N message pairs
    if (this.messages.length > this.maxMessages * 2) {
      this.messages = this.messages.slice(-this.maxMessages * 2);
    }
  }

  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  clear() {
    this.messages = [];
  }

  getTotalTokens(): number {
    return this.messages.reduce((total, msg) => {
      return total + estimateTokenCount(msg.content);
    }, 0);
  }
}