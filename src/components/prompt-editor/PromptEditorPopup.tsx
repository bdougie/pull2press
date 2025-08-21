import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Copy, Check, Send, AlertCircle, Link2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { streamPromptResponse, ConversationContext } from '../../lib/prompt-editor';
import { findHelpfulLinks, formatLinksAsMarkdown, LinkSuggestion } from '../../lib/link-finder';

interface PromptEditorPopupProps {
  selectedText: string;
  position: { top: number; left: number };
  onClose: () => void;
  onApply: (newText: string) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ExamplePrompt {
  icon: string;
  label: string;
  prompt: string;
  isSpecial?: boolean;
}

const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  { icon: '📝', label: 'Improve writing', prompt: 'Improve the clarity and style of this text' },
  { icon: '✅', label: 'Fix grammar', prompt: 'Fix spelling and grammar errors' },
  { icon: '📢', label: 'Add CTA', prompt: 'Add a compelling call-to-action' },
  { icon: '💻', label: 'Add code example', prompt: 'Add a relevant code example' },
  { icon: '🎯', label: 'Make concise', prompt: 'Make this more concise while keeping the key points' },
  { icon: '🔗', label: 'Add GitHub links', prompt: 'Add GitHub links to relevant files mentioned in this text. Use semantic search to find the actual file paths on the default branch and create direct links. If specific files cannot be found, include a link to the PR as fallback. Integrate the links naturally into the text or as a call-to-action.' },
  { icon: '🔍', label: 'Find helpful links', prompt: '__FIND_HELPFUL_LINKS__', isSpecial: true },
];

export function PromptEditorPopup({ 
  selectedText, 
  position, 
  onClose, 
  onApply 
}: PromptEditorPopupProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokenCount, setTokenCount] = useState(0);
  const [isFindingLinks, setIsFindingLinks] = useState(false);
  const [foundLinks, setFoundLinks] = useState<LinkSuggestion[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const contextRef = useRef(new ConversationContext(5));

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handlePromptClick = async (prompt: string, isSpecial?: boolean) => {
    if (prompt === '__FIND_HELPFUL_LINKS__') {
      await handleFindHelpfulLinks();
    } else {
      await handleSendMessage(prompt);
    }
  };

  const handleFindHelpfulLinks = async () => {
    setIsFindingLinks(true);
    setError(null);

    try {
      const response = await findHelpfulLinks(selectedText, { maxLinks: 5 });
      
      if (response.links && response.links.length > 0) {
        setFoundLinks(response.links);
        
        // Format the links as markdown
        const linksMarkdown = formatLinksAsMarkdown(response.links);
        
        // Create a message with the found links
        const assistantMessage: Message = {
          role: 'assistant',
          content: `I found ${response.links.length} helpful resources for your content:\n${linksMarkdown}\n\nYou can apply these links to add them to your content, or I can help you integrate them more naturally into the text.`
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        // Add to context
        contextRef.current.addMessage({ 
          role: 'assistant', 
          content: assistantMessage.content 
        });
        
        // Update token count
        setTokenCount(contextRef.current.getTotalTokens());
      } else {
        setError('No helpful links found for this content');
      }
    } catch (error) {
      console.error('Error finding helpful links:', error);
      setError(error instanceof Error ? error.message : 'Failed to find helpful links');
    } finally {
      setIsFindingLinks(false);
    }
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
      setError(error instanceof Error ? error.message : 'Failed to generate response');
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

  // Calculate popup position to ensure it's visible
  const popupStyle = {
    position: 'fixed' as const,
    top: `${Math.min(position.top, window.innerHeight - 500)}px`,
    left: `${Math.min(position.left, window.innerWidth - 400)}px`,
    zIndex: 1000,
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20" 
        onClick={onClose}
        style={{ zIndex: 999 }}
      />
      
      {/* Popup */}
      <Card className="w-96 max-h-[500px] flex flex-col bg-white shadow-xl border border-[#d0d7de]" style={popupStyle}>
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
          <p className="text-sm text-[#24292f] line-clamp-2">{selectedText}</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
          {messages.length === 0 && !isStreaming && (
            <div className="space-y-2">
              <p className="text-sm text-[#57606a] mb-3">Choose an action or type your own:</p>
              {EXAMPLE_PROMPTS.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handlePromptClick(prompt.prompt, prompt.isSpecial)}
                  disabled={isFindingLinks}
                  className="w-full text-left p-2 rounded-md border border-[#d0d7de] hover:bg-[#f6f8fa] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="mr-2">{prompt.icon}</span>
                  <span className="text-sm text-[#24292f]">{prompt.label}</span>
                  {prompt.label === 'Find helpful links' && isFindingLinks && (
                    <span className="ml-2 text-xs text-[#57606a]">(searching...)</span>
                  )}
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
      </Card>
    </>
  );
}