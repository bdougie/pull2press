import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Copy, Check, Send, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { streamPromptResponse, ConversationContext } from '../../lib/prompt-editor';

interface PromptEditorSidebarProps {
  selectedText: string;
  isOpen: boolean;
  onClose: () => void;
  onApply: (newText: string) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const EXAMPLE_PROMPTS = [
  { icon: '📝', label: 'Improve writing', prompt: 'Improve the clarity and style of this text' },
  { icon: '✅', label: 'Fix grammar', prompt: 'Fix spelling and grammar errors' },
  { icon: '📢', label: 'Add CTA', prompt: 'Add a compelling call-to-action' },
  { icon: '💻', label: 'Add code example', prompt: 'Add a relevant code example' },
  { icon: '🎯', label: 'Make concise', prompt: 'Make this more concise while keeping the key points' },
];

export function PromptEditorSidebar({ 
  selectedText, 
  isOpen,
  onClose, 
  onApply 
}: PromptEditorSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokenCount, setTokenCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const contextRef = useRef(new ConversationContext(5));

  useEffect(() => {
    // Focus input when opened
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handlePromptClick = async (prompt: string) => {
    await handleSendMessage(prompt);
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isStreaming) return;

    const userMessage: Message = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    setStreamingContent('');
    setError(null);

    // Add to context
    contextRef.current.addMessage({ role: 'user', content: message });

    try {
      let fullResponse = '';
      
      // Stream the response
      const stream = streamPromptResponse(
        selectedText,
        message,
        contextRef.current.getMessages()
      );

      for await (const chunk of stream) {
        fullResponse += chunk;
        setStreamingContent(fullResponse);
      }
      
      const assistantMessage: Message = { 
        role: 'assistant', 
        content: fullResponse 
      };
      
      // Add to context
      contextRef.current.addMessage({ role: 'assistant', content: fullResponse });
      
      setMessages(prev => [...prev, assistantMessage]);
      setStreamingContent('');
      
      // Update token count
      setTokenCount(contextRef.current.getTotalTokens());
    } catch (error) {
      console.error('Error generating response:', error);
      let errorMessage = 'Failed to generate response';
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorMessage = 'OpenAI API key not configured on server. Please check your .env file.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to the Supabase edge function. The OPENAI_API_KEY may need to be set in Supabase Edge Function environment variables.';
        } else {
          errorMessage = error.message;
        }
      }
      setError(errorMessage);
      setStreamingContent('');
    } finally {
      setIsStreaming(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/20 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        style={{ zIndex: 998 }}
      />
      
      {/* Sidebar */}
      <div 
        className={`fixed right-0 top-0 h-full w-[400px] bg-white shadow-xl border-l border-[#d0d7de] transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ zIndex: 999 }}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#d0d7de]">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#0969da]" />
              <h3 className="font-semibold text-[#24292f]">AI Editor</h3>
              {tokenCount > 0 && (
                <span className="text-xs text-[#57606a]">~{tokenCount} tokens</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Selected text preview */}
          <div className="p-3 bg-[#f6f8fa] border-b border-[#d0d7de]">
            <p className="text-xs text-[#57606a] mb-1">Selected text:</p>
            <p className="text-sm text-[#24292f] line-clamp-3">{selectedText}</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && !isStreaming && (
              <div className="space-y-2">
                <p className="text-sm text-[#57606a] mb-3">Choose an action or type your own:</p>
                {EXAMPLE_PROMPTS.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handlePromptClick(prompt.prompt)}
                    className="w-full text-left p-2 rounded-md border border-[#d0d7de] hover:bg-[#f6f8fa] transition-colors"
                  >
                    <span className="mr-2">{prompt.icon}</span>
                    <span className="text-sm text-[#24292f]">{prompt.label}</span>
                  </button>
                ))}
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`space-y-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-[#0969da] text-white' 
                    : 'bg-[#f6f8fa] text-[#24292f] border border-[#d0d7de]'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === 'assistant' && (
                  <div className="flex gap-2 mt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(message.content, index)}
                      className="h-7 text-xs"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onApply(message.content)}
                      className="h-7 text-xs"
                      style={{ backgroundColor: '#2da44e', color: 'white' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2c974b'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2da44e'}
                    >
                      Apply
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {isStreaming && streamingContent && (
              <div className="space-y-1">
                <div className="inline-block max-w-[80%] p-3 rounded-lg bg-[#f6f8fa] text-[#24292f] border border-[#d0d7de]">
                  <p className="text-sm whitespace-pre-wrap">{streamingContent}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-[#d0d7de]">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your instruction..."
                className="flex-1 px-3 py-2 text-sm border border-[#d0d7de] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-transparent resize-none"
                rows={2}
                disabled={isStreaming}
              />
              <Button
                onClick={() => handleSendMessage(input)}
                disabled={!input.trim() || isStreaming}
                size="icon"
                className="h-auto"
                style={{ backgroundColor: '#2da44e', color: 'white' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2c974b'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2da44e'}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}