import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Eye, Edit2, Copy, Check, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { AuthButton } from "./auth-button";
import RegenerationDropdown from "./regeneration-dropdown";
import { PromptEditor } from "./prompt-editor/PromptEditor";

interface MarkdownEditorProps {
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

export default function MarkdownEditor({
  initialContent,
  onRegenerate,
  isRegenerating,
  showSignInPrompt,
  user,
}: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [copied, setCopied] = useState(false);

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
    // Replace the selected text with the new text
    const currentContent = content;
    const index = currentContent.indexOf(originalText);
    if (index !== -1) {
      const before = currentContent.substring(0, index);
      const after = currentContent.substring(index + originalText.length);
      setContent(before + newText + after);
    }
  };

  const getBoltNewUrl = () => {
    const prompt = encodeURIComponent(
      `Create an Astro blog using this markdown content as a blog post:\n\n${content}`
    );
    return `https://bolt.new?prompt=${prompt}`;
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

            {onRegenerate && (
              <RegenerationDropdown
                onRegenerate={onRegenerate}
                isRegenerating={isRegenerating || false}
                user={user}
              />
            )}
          </div>
        </div>

        <TabsContent value="edit" className="p-0">
          <PromptEditor onTextReplace={handleTextReplace}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-[500px] p-4 font-mono text-sm border-none focus:outline-none resize-none"
              placeholder="Write your blog post in Markdown..."
            />
          </PromptEditor>
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
