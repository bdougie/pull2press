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

  // Build context from previous messages (limited to last N messages)
  const contextMessages = previousMessages.slice(-maxMessages * 2); // *2 to account for user+assistant pairs

  try {
    // Get Supabase URL from environment
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }
    const response = await fetch(`${supabaseUrl}/functions/v1/prompt-editor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        selectedText,
        userPrompt,
        previousMessages: contextMessages,
        systemPrompt,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get response');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      if (chunk) {
        yield chunk;
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