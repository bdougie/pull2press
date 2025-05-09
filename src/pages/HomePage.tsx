import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchPRData } from "@/lib/github";
import { generateBlogPost } from "@/lib/openai";
import { AuthButton } from "@/components/auth-button";
import { HistoryDrawer } from "@/components/history-drawer";
import { supabase } from "@/lib/supabase";
import type { CachedPost } from "@/lib/supabase";

export default function HomePage() {
  const [isLoading, setIsLoading = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
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
  }, [);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const prUrl = formData.get("pr-url") as string;

    try {
      // If user is logged in, check cache first
      if (user) {
        const { data: existingPosts } = await supabase
          .from("cached_posts")
          .select("*")
          .eq("pr_url", prUrl)
          .eq("user_id", user.id)
          .single();

        if (existingPosts) {
          // Navigate to edit page with the content
          navigate("/edit", { 
            state: { 
              content: existingPosts.content,
              prUrl: prUrl
            } 
          });
          return;
        }
      }

      // Generate new content
      const prData = await fetchPRData(prUrl);
      const content = await generateBlogPost(prData);

      // If user is logged in, save to Supabase
      if (user) {
        const { error: saveError } = await supabase
          .from("cached_posts")
          .insert({
            pr_url: prUrl,
            content,
            title: prData.title,
            user_id: user.id,
          });

        if (saveError) {
          console.error("Error saving post:", saveError);
        }
      }

      // Navigate to edit page with the generated content
      navigate("/edit", { 
        state: { 
          content,
          prUrl
        } 
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  const handleSelectPost = (post: CachedPost) => {
    navigate("/edit", { 
      state: { 
        content: post.content,
        prUrl: post.pr_url
      } 
    });
  };

  return (
    <>
      <nav className="bg-white border-b border-[#d0d7de] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link to="/">
              <h1 className="text-xl font-semibold hover:text-blue-600 transition-colors">pull2press</h1>
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            {user && <HistoryDrawer onSelectPost={handleSelectPost} />}
            <AuthButton />
          </div>
        </div>
      </nav>

      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto py-10 px-4">
          <Card className="p-6 bg-white">
            <h2 className="text-2xl font-semibold mb-6">
              Transform Your Pull Request into a Blog Post
            </h2>
            <p className="text-gray-600 mb-6">
              Turn your code commits into engaging developer-friendly blog
              posts. Simply paste your pull request URL below to get started.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="pr-url"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Pull Request URL
                </label>
                <input
                  type="url"
                  id="pr-url"
                  name="pr-url"
                  className="w-full px-3 py-2 border border-[#d0d7de rounded-md focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-transparent"
                  placeholder="https://github.com/owner/repo/pull/123"
                  required
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="space-y-3">
                <Button
                  type="submit"
                  className="bg-[#2da44e] hover:bg-[#2c974b text-white w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Generating..." : "Generate Blog Post"}
                </Button>
                {!user && (
                  <p className="text-sm text-muted-foreground text-center italic">
                    Sign in to save your generated posts and access them later
                  </p>
                )}
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}