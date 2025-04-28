import { useState, useEffect } from "react";
import MarkdownEditor from "../components/markdown-editor";
import { generateBlogPost } from "../lib/openai";
import { fetchPRData } from "../lib/github";
import { supabase } from "../lib/supabase";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Edit({ user }: { user: any }) {
  const [blogContent, setBlogContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPrUrl, setCurrentPrUrl] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Get content and PR URL from location state
    const state = location.state as { content: string; prUrl: string } | null;
    
    if (state?.content) {
      setBlogContent(state.content);
      setCurrentPrUrl(state.prUrl);
    } else {
      // If there's no content, redirect back to home
      navigate("/");
    }
  }, [location, navigate]);

  const handleRegenerate = async () => {
    if (!currentPrUrl) return;
    setIsLoading(true);

    try {
      const prData = await fetchPRData(currentPrUrl);
      const content = await generateBlogPost(prData);

      // Update in Supabase if user is logged in
      if (user) {
        const { error: updateError } = await supabase
          .from("cached_posts")
          .update({ content })
          .eq("pr_url", currentPrUrl)
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Error updating post:", updateError);
        }
      }

      setBlogContent(content);
    } catch (err) {
      console.error("Error regenerating:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate("/");
  };

  if (!blogContent) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackClick}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </div>
      
      <MarkdownEditor
        initialContent={blogContent}
        onRegenerate={handleRegenerate}
        isRegenerating={isLoading}
        showSignInPrompt={!user}
      />
    </div>
  );
}