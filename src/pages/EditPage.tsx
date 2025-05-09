import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { AuthButton } from "@/components/auth-button";
import MarkdownEditor from "@/components/markdown-editor";
import { fetchPRData } from "@/lib/github";
import { generateBlogPost } from "@/lib/openai";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { EditLocation } from "@/types/router";

export default function EditPage() {
  const location = useLocation() as Partial<EditLocation>;
  const navigate = useNavigate();
  const [blogContent, setBlogContent] = useState<string | null>(null);
  const [currentPrUrl, setCurrentPrUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [missingState, setMissingState] = useState(false);

  useEffect(() => {
    // Check if we have state from navigation
    if (location.state?.content && location.state?.prUrl) {
      setBlogContent(location.state.content);
      setCurrentPrUrl(location.state.prUrl);
    } else {
      // Mark that we're missing the required state
      setMissingState(true);
    }

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [location]);

  // Redirect to home if we don't have the necessary state
  useEffect(() => {
    if (missingState) {
      // Give a brief moment to see the message before redirecting
      const timer = setTimeout(() => {
        navigate("/");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [missingState, navigate]);

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

  const handleBack = () => {
    navigate("/");
  };

  if (missingState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">No Content Available</h2>
          <p className="mb-4">
            No blog post content was found. Redirecting to home page...
          </p>
          <Button onClick={handleBack}>Go to Home Page</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <nav className="bg-white border-b border-[#d0d7de] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link to="/">
              <h1 className="text-xl font-semibold hover:text-blue-600 transition-colors">
                pull2press
              </h1>
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <AuthButton />
          </div>
        </div>
      </nav>

      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto py-4 px-4">
          <div className="mb-4">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </div>

          {blogContent && (
            <MarkdownEditor
              initialContent={blogContent}
              onRegenerate={handleRegenerate}
              isRegenerating={isLoading}
              showSignInPrompt={!user}
            />
          )}
        </div>
      </div>
    </>
  );
}
