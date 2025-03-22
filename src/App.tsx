import { GithubIcon } from "lucide-react";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { useState, useEffect } from "react";
import MarkdownEditor from "./components/markdown-editor";
import { fetchPRData } from "./lib/github";
import { generateBlogPost } from "./lib/openai";
import { AuthButton } from "./components/auth-button";
import { HistoryDrawer } from "./components/history-drawer";
import { supabase } from "./lib/supabase";
import type { CachedPost } from "./lib/supabase";

function App() {
  const [blogContent, setBlogContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPrUrl, setCurrentPrUrl] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

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
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const prUrl = formData.get("pr-url") as string;
    setCurrentPrUrl(prUrl);

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
          setBlogContent(existingPosts.content);
          setIsLoading(false);
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

      setBlogContent(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!currentPrUrl) return;
    setIsLoading(true);
    setError(null);

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
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPost = (post: CachedPost) => {
    setCurrentPrUrl(post.pr_url);
    setBlogContent(post.content);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8fa]">
      <nav className="bg-white border-b border-[#d0d7de] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GithubIcon className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Pull 2 Press</h1>
          </div>
          <div className="flex items-center space-x-2">
            {user && <HistoryDrawer onSelectPost={handleSelectPost} />}
            <AuthButton />
          </div>
        </div>
      </nav>

      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto py-10 px-4">
          {!blogContent ? (
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
                    className="w-full px-3 py-2 border border-[#d0d7de] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-transparent"
                    placeholder="https://github.com/owner/repo/pull/123"
                    required
                  />
                </div>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <div className="space-y-3">
                  <Button
                    type="submit"
                    className="bg-[#2da44e] hover:bg-[#2c974b] text-white w-full"
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
          ) : (
            <MarkdownEditor
              initialContent={blogContent}
              onRegenerate={handleRegenerate}
              isRegenerating={isLoading}
              showSignInPrompt={!user}
            />
          )}
        </div>
      </div>

      <footer className="border-t border-gray-200 py-4 mt-auto bg-white">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          Generated using{" "}
          <a
            href="https://bolt.new"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            bolt.new
          </a>{" "}
          by{" "}
          <a
            href="https://b.dougle.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            bdougie
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
