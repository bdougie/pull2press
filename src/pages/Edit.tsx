import { useState, useEffect } from "react";
import MarkdownEditor from "../components/markdown-editor";
import { generateBlogPost } from "../lib/openai";
import { fetchPRDataEnhanced } from "../lib/github-enhanced";
import { supabase } from "../lib/supabase";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  buildEnhancedSystemPrompt,
  buildEnhancedUserPrompt,
  getTemperature,
  type RegenerationPreset,
  type UserPreferences
} from "../lib/enhanced-prompt-utils";
import { EnhancedLoadingProgress, EnhancedFetchProgress } from "../components/enhanced-loading-progress";

export default function Edit({ user }: { user: any }) {
  const [blogContent, setBlogContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPrUrl, setCurrentPrUrl] = useState<string | null>(null);
  const [postId, setPostId] = useState<string | null>(null);
  const [progress, setProgress] = useState<EnhancedFetchProgress>({
    stage: 'pr_details',
    progress: 0,
    message: '',
    details: undefined
  });
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();

  useEffect(() => {
    const fetchPostById = async (id: string) => {
      setIsLoading(true);
      try {
        // Fetch post from Supabase by ID
        const { data, error } = await supabase
          .from("cached_posts")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("Error fetching post:", error);
          navigate("/");
          return;
        }

        if (data) {
          setBlogContent(data.content);
          setCurrentPrUrl(data.pr_url);
          setPostId(data.id);
        } else {
          // Post not found
          navigate("/");
        }
      } catch (err) {
        console.error("Error:", err);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    // Check if we have an ID in the URL
    if (params.id) {
      fetchPostById(params.id);
    } else {
      // If no ID, try to get from location state (old method)
      const state = location.state as { content: string; prUrl: string } | null;

      if (state?.content) {
        setBlogContent(state.content);
        setCurrentPrUrl(state.prUrl);
      } else {
        // If there's no content or ID, redirect back to home
        navigate("/");
      }
    }
  }, [params.id, location, navigate]);

  const handleRegenerate = async (options?: {
    preset?: RegenerationPreset;
    customPrompt?: string;
    useUserStyle?: boolean;
  }) => {
    if (!currentPrUrl) return;
    setIsLoading(true);

    try {
      setProgress({
        stage: 'pr_details',
        progress: 0,
        message: 'Fetching PR data...',
        details: undefined
      });
      
      const prData = await fetchPRDataEnhanced(currentPrUrl, (progressUpdate) => {
        setProgress(progressUpdate);
      });
      
      let userPreferences: UserPreferences | undefined;
      
      // Load user preferences if needed
      if (user && (options?.useUserStyle || !options)) {
        try {
          const { data } = await supabase
            .from("user_preferences")
            .select("*")
            .eq("user_id", user.id)
            .single();
          
          if (data) {
            userPreferences = data;
          }
        } catch (err) {
          console.error("Error loading user preferences:", err);
        }
      }
      
      // Build enhanced prompts
      const regenerationOptions = {
        type: (options?.preset ? 'preset' : options?.customPrompt ? 'custom' : options?.useUserStyle ? 'user_style' : 'preset') as 'preset' | 'custom' | 'user_style',
        preset: options?.preset,
        customPrompt: options?.customPrompt,
        userPreferences,
        temperature: options?.preset?.temperature
      };
      
      const systemPrompt = buildEnhancedSystemPrompt(userPreferences, regenerationOptions);
      const userPrompt = buildEnhancedUserPrompt(prData, regenerationOptions);
      const temperature = getTemperature(regenerationOptions);
      
      // Generate with enhanced prompts
      setProgress({
        stage: 'generating',
        progress: 90,
        message: 'Generating blog post...',
        details: undefined
      });
      
      const content = await generateBlogPost(prData, {
        systemPrompt,
        userPrompt,
        temperature
      });

      // Update in Supabase if user is logged in
      if (user) {
        const updateQuery = postId
          ? supabase.from("cached_posts").update({ content }).eq("id", postId)
          : supabase
              .from("cached_posts")
              .update({ content })
              .eq("pr_url", currentPrUrl)
              .eq("user_id", user.id);

        const { error: updateError } = await updateQuery;

        if (updateError) {
          console.error("Error updating post:", updateError);
        }
      }

      setBlogContent(content);
    } catch (err) {
      console.error("Error regenerating:", err);
    } finally {
      setIsLoading(false);
      setProgress({
        stage: 'complete',
        progress: 100,
        message: '',
        details: undefined
      });
    }
  };

  const handleBackClick = () => {
    navigate("/");
  };

  // Show enhanced loading progress when regenerating
  if (isLoading && progress.stage !== 'complete') {
    return <EnhancedLoadingProgress progress={progress} />;
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!blogContent) {
    return <div className="text-center py-12">Loading post content...</div>;
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
        user={user}
      />
    </div>
  );
}
