import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPRData } from "../lib/github";
import { generateBlogPost } from "../lib/openai";
import { supabase } from "../lib/supabase";

export default function Home({ user }: { user: any }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        const { data: existingPosts, error: fetchError } = await supabase
          .from("cached_posts")
          .select("*")
          .eq("pr_url", prUrl)
          .eq("user_id", user.id);

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error("Error fetching cached posts:", fetchError);
        }

        if (existingPosts && existingPosts.length > 0) {
          // Navigate to edit page with the post ID
          navigate(`/edit/${existingPosts[0].id}`);
          return;
        }
      }

      // Generate new content
      const prData = await fetchPRData(prUrl);
      const content = await generateBlogPost(prData);

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

      // Navigate to edit page with content
      if (postId) {
        navigate(`/edit/${postId}`);
      } else {
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
            className="w-full"
            style={{ backgroundColor: '#2da44e', color: 'white' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2c974b'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2da44e'}
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
  );
}