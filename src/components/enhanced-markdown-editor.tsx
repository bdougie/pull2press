import { useState, useRef, DragEvent, KeyboardEvent } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Eye, Edit2, Copy, Check, ExternalLink, Sparkles, Upload } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { AuthButton } from "./auth-button";
import RegenerationDropdown from "./regeneration-dropdown";
import { SimplePromptEditor } from "./prompt-editor/SimplePromptEditor";
import { uploadImage, isImageFile } from "../lib/image-upload";
import { useToast } from "../../hooks/use-toast";

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
}

export default function EnhancedMarkdownEditor({
  initialContent,
  onRegenerate,
  isRegenerating,
  showSignInPrompt,
  user,
}: EnhancedMarkdownEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
      setContent(before + newText + after);
    }
  };

  const handleAIEditorClick = () => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.select();
      const event = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        view: window
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

  const insertTextAtCursor = (text: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = content.substring(0, start);
    const after = content.substring(end);
    
    const newContent = before + text + after;
    setContent(newContent);
    
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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      
      const textarea = textareaRef.current;
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = content.substring(start, end);
      
      if (selectedText) {
        // Prompt user for URL
        const url = prompt('Enter URL for the link:');
        if (url) {
          const linkMarkdown = `[${selectedText}](${url})`;
          const before = content.substring(0, start);
          const after = content.substring(end);
          const newContent = before + linkMarkdown + after;
          setContent(newContent);
          
          // Set cursor position after the link
          setTimeout(() => {
            textarea.focus();
            const newPosition = start + linkMarkdown.length;
            textarea.setSelectionRange(newPosition, newPosition);
          }, 0);
        }
      } else {
        toast({
          title: "No text selected",
          description: "Please select text to convert to a link",
        });
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
              <Button
                onClick={handleAIEditorClick}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                title="Open AI Editor (selects all text)"
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
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                className="w-full h-[500px] p-4 font-mono text-sm border-none focus:outline-none resize-none"
                placeholder="Write your blog post in Markdown... (Drag images here or press Cmd+K to create links)"
              />
            </SimplePromptEditor>
            
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              Cmd+K to create link • Drag or paste images
            </div>
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
        </div>
      </Tabs>
    </Card>
  );
}