import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPRDataOptimized, FetchProgress } from "../lib/github-optimized";
import { generateBlogPost } from "../lib/openai";
import { supabase } from "../lib/supabase";
import { LoadingProgress } from "../components/loading-progress";

export default function HomeOptimized({ user }: { user: any }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<FetchProgress>({
    stage: 'pr_details',
    progress: 0,
    message: 'Starting...'
  });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const prUrl = formData.get("pr-url") as string;

    try {
      // If user is logged in, check cache first
      if (user) {
        setProgress({
          stage: 'pr_details',
          progress: 5,
          message: 'Checking cache...'
        });

        const { data: existingPosts } = await supabase
          .from("cached_posts")
          .select("*")
          .eq("pr_url", prUrl)
          .eq("user_id", user.id);

        if (existingPosts && existingPosts.length > 0) {
          setProgress({
            stage: 'complete',
            progress: 100,
            message: 'Found cached content!'
          });
          
          // Small delay for user to see the complete state
          await new Promise(resolve => setTimeout(resolve, 500));
          
          navigate(`/edit/${existingPosts[0].id}`);
          return;
        }
      }

      // Generate new content with progress updates
      const prData = await fetchPRDataOptimized(prUrl, setProgress);
      
      setProgress({
        stage: 'generating',
        progress: 85,
        message: 'Creating your blog post with AI...'
      });

      const content = await generateBlogPost(prData);

      setProgress({
        stage: 'complete',
        progress: 95,
        message: 'Saving your content...'
      });

      // If user is logged in, save to Supabase
      let postId = null;
      if (user) {
        const { data: savedPost, error: saveError } = await supabase
          .from("cached_posts")
          .insert({
            pr_url: prUrl,
            content,
            title: prData.title,
            user_id: user.id,
          })
          .select()
          .single();

        if (saveError) {
          console.error("Error saving post:", saveError);
        } else if (savedPost) {
          postId = savedPost.id;
        }
      }

      setProgress({
        stage: 'complete',
        progress: 100,
        message: 'Success! Redirecting to editor...'
      });

      // Small delay for user to see the complete state
      await new Promise(resolve => setTimeout(resolve, 500));

      // Navigate to edit page with content
      if (postId) {
        navigate(`/edit/${postId}`);
      } else {
        // If not saved (user not logged in or error), navigate with state
        navigate(`/edit`, { 
          state: { 
            content: content,
            prUrl: prUrl 
          } 
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading ? (
        <LoadingProgress progress={progress} />
      ) : (
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
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500">
                e.g., https://github.com/octocat/hello-world/pull/1
              </p>
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Processing..." : "Generate Blog Post"}
            </Button>
          </form>
        </Card>
      )}
    </>
  );
}