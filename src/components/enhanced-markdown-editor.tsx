import { useState, useRef, DragEvent } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Eye, Edit2, Copy, Check, ExternalLink, Sparkles, Upload, HelpCircle, Cloud, CloudOff } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { AuthButton } from "./auth-button";
import RegenerationDropdown from "./regeneration-dropdown";
import { SimplePromptEditor } from "./prompt-editor/SimplePromptEditor";
import { uploadImage, isImageFile } from "../lib/image-upload";
import { useToast } from "../../hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

interface EnhancedMarkdownEditorProps {
  initialContent: string;
  onRegenerate?: (options?: {
    preset?: any;
    customPrompt?: string;
    useUserStyle?: boolean;
  }) => void;
  isRegenerating?: boolean;
  showSignInPrompt?: boolean;
  user?: any;
  onChange?: (content: string) => void;
  saveStatus?: 'saved' | 'saving' | 'error' | null;
}

export default function EnhancedMarkdownEditor({
  initialContent,
  onRegenerate,
  isRegenerating,
  showSignInPrompt,
  user,
  onChange,
  saveStatus,
}: EnhancedMarkdownEditorProps) {
  const [content, setContent] = useState(initialContent);

  // Update parent when content changes
  const updateContent = (newContent: string) => {
    setContent(newContent);
    onChange?.(newContent);
  };
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handleTextReplace = (originalText: string, newText: string) => {
    const currentContent = content;
    const index = currentContent.indexOf(originalText);
    if (index !== -1) {
      const before = currentContent.substring(0, index);
      const after = currentContent.substring(index + originalText.length);
      updateContent(before + newText + after);
    }
  };

  const handleAIEditorClick = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Trigger cmd+j programmatically
      const event = new KeyboardEvent('keydown', {
        key: 'j',
        metaKey: true,
        ctrlKey: false,
        bubbles: true,
        cancelable: true
      });
      textarea.dispatchEvent(event);
    }
  };

  const getBoltNewUrl = () => {
    const prompt = encodeURIComponent(
      `Create an Astro blog using this markdown content as a blog post:\n\n${content}`
    );
    return `https://bolt.new?prompt=${prompt}`;
  };

  const wrapSelection = (before: string, after: string = before) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const beforeContent = content.substring(0, start);
    const afterContent = content.substring(end);
    
    const newContent = beforeContent + before + selectedText + after + afterContent;
    updateContent(newContent);
    
    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        // If text was selected, select the wrapped text
        textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
      } else {
        // If no text selected, position cursor between the markers
        textarea.setSelectionRange(start + before.length, start + before.length);
      }
    }, 0);
  };

  const insertTextAtCursor = (text: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = content.substring(0, start);
    const after = content.substring(end);
    
    const newContent = before + text + after;
    updateContent(newContent);
    
    // Reset cursor position after React re-renders
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const handleImageUpload = async (file: File) => {
    if (!isImageFile(file)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, GIF, or WebP)",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const imageUrl = await uploadImage(file);
      const imageMarkdown = `![${file.name}](${imageUrl})`;
      insertTextAtCursor(imageMarkdown);
      
      toast({
        title: "Image uploaded",
        description: "Image has been uploaded and inserted into your content",
      });
    } catch (error) {
      console.error("Image upload failed:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragging to false if we're leaving the editor area entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(isImageFile);
    
    if (imageFiles.length === 0) {
      toast({
        title: "No images found",
        description: "Please drop image files only",
        variant: "destructive",
      });
      return;
    }
    
    // Upload all images
    for (const file of imageFiles) {
      await handleImageUpload(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMeta = e.metaKey || e.ctrlKey;
    
    if (isMeta) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          wrapSelection('**');
          break;
        case 'i':
          e.preventDefault();
          wrapSelection('*');
          break;
        case 'k':
          e.preventDefault();
          const textarea = textareaRef.current;
          if (!textarea) return;
          
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const selectedText = content.substring(start, end);
          
          if (selectedText) {
            // Wrap selected text in markdown link syntax
            const linkMarkdown = `[${selectedText}](url)`;
            const before = content.substring(0, start);
            const after = content.substring(end);
            const newContent = before + linkMarkdown + after;
            updateContent(newContent);
            
            // Set cursor position inside the url placeholder
            setTimeout(() => {
              textarea.focus();
              // Position cursor at the start of 'url' text
              const urlStart = start + selectedText.length + 3; // +3 for ']('
              const urlEnd = urlStart + 3; // length of 'url'
              textarea.setSelectionRange(urlStart, urlEnd);
            }, 0);
          } else {
            // If no text is selected, insert empty link syntax and position cursor
            const linkMarkdown = `[](url)`;
            const before = content.substring(0, start);
            const after = content.substring(start);
            const newContent = before + linkMarkdown + after;
            updateContent(newContent);
            
            // Position cursor inside the square brackets
            setTimeout(() => {
              textarea.focus();
              textarea.setSelectionRange(start + 1, start + 1);
            }, 0);
          }
          break;
      }
    }
    
    // Alt/Option key shortcuts
    if (e.altKey) {
      switch (e.key) {
        case '`':
          e.preventDefault();
          wrapSelection('`');
          break;
      }
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find(item => item.type.startsWith('image/'));
    
    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (file) {
        await handleImageUpload(file);
      }
    }
  };

  return (
    <Card className="border border-[#d0d7de] bg-white">
      <Tabs defaultValue="edit" className="w-full">
        <div className="border-b border-[#d0d7de] px-4 py-2">
          <div className="flex justify-between items-center">
            <TabsList className="grid w-60 grid-cols-2">
              <TabsTrigger value="edit" className="flex items-center gap-2">
                <Edit2 className="h-4 w-4" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              {saveStatus && (
                <div className="flex items-center gap-1 text-sm">
                  {saveStatus === 'saving' && (
                    <>
                      <div className="animate-spin h-3 w-3 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                      <span className="text-gray-600">Saving...</span>
                    </>
                  )}
                  {saveStatus === 'saved' && (
                    <>
                      <Cloud className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">Saved</span>
                    </>
                  )}
                  {saveStatus === 'error' && (
                    <>
                      <CloudOff className="h-4 w-4 text-red-600" />
                      <span className="text-red-600">Error saving</span>
                    </>
                  )}
                </div>
              )}
              
              <Button
                onClick={handleAIEditorClick}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                title="Open AI Editor (Cmd+J)"
              >
                <Sparkles className="h-4 w-4" />
                AI Editor
              </Button>
              
              {onRegenerate && (
                <RegenerationDropdown
                  onRegenerate={onRegenerate}
                  isRegenerating={isRegenerating || false}
                  user={user}
                />
              )}
            </div>
          </div>
        </div>

        <TabsContent value="edit" className="p-0">
          <div
            className={`relative ${isDragging ? 'bg-blue-50' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isDragging && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-blue-50 bg-opacity-90 border-2 border-dashed border-blue-400 rounded-md m-4">
                <div className="text-center">
                  <Upload className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                  <p className="text-blue-600 font-medium">Drop images here to upload</p>
                  <p className="text-sm text-blue-500">Max size: 4MB</p>
                </div>
              </div>
            )}
            
            {isUploading && (
              <div className="absolute top-4 right-4 z-20 bg-white border border-gray-200 rounded-md px-3 py-2 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                  <span className="text-sm">Uploading image...</span>
                </div>
              </div>
            )}
            
            <SimplePromptEditor onTextReplace={handleTextReplace}>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => updateContent(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                className="w-full h-[500px] p-4 font-mono text-sm border-none focus:outline-none resize-none"
                placeholder="Write your blog post in Markdown... (Drag images here or press Cmd+K to create links)"
              />
            </SimplePromptEditor>
            
          </div>
        </TabsContent>

        <TabsContent value="preview" className="p-4">
          <article className="prose prose-slate dark:prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </article>
        </TabsContent>

        <div className="flex justify-between items-center border-t border-[#d0d7de] p-4">
          {showSignInPrompt && (
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Sign in to save your changes
              </p>
              <AuthButton />
            </div>
          )}
          <div className="flex items-center justify-between flex-1">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCopy}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
              <a href={getBoltNewUrl()} target="_blank" rel="noopener noreferrer">
                <Button className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Create Astro Blog
                </Button>
              </a>
            </div>
            <button
              onClick={() => setShowTips(true)}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
              Keyboard shortcuts
            </button>
          </div>
        </div>
      </Tabs>
      
      <Dialog open={showTips} onOpenChange={setShowTips}>
        <DialogContent className="sm:max-w-[500px] fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>
              Quick markdown editing shortcuts for the editor
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-[120px_1fr] gap-4 text-sm">
              <div className="font-mono bg-gray-100 px-3 py-1.5 rounded text-center">Cmd+B</div>
              <div className="py-1.5">Bold text</div>
              
              <div className="font-mono bg-gray-100 px-3 py-1.5 rounded text-center">Cmd+I</div>
              <div className="py-1.5">Italic text</div>
              
              <div className="font-mono bg-gray-100 px-3 py-1.5 rounded text-center">Cmd+K</div>
              <div className="py-1.5">Insert link</div>
              
              <div className="font-mono bg-gray-100 px-3 py-1.5 rounded text-center">Alt+`</div>
              <div className="py-1.5">Inline code</div>
              
              <div className="font-mono bg-gray-100 px-3 py-1.5 rounded text-center">Cmd+J</div>
              <div className="py-1.5">Open AI editor</div>
            </div>
            
            <div className="mt-2 pt-4 border-t">
              <p className="text-sm font-medium mb-2">Other features:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Drag and drop images to upload</li>
                <li>• Paste images from clipboard</li>
                <li>• Maximum image size: 4MB</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}