import { useState, useEffect, useCallback, useRef } from "react";
import EnhancedMarkdownEditor from "../components/enhanced-markdown-editor";
import { generateBlogPost } from "../lib/openai";
import { fetchPRDataEnhanced } from "../lib/github-enhanced";
import { supabase } from "../lib/supabase";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
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
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
  const [progress, setProgress] = useState<EnhancedFetchProgress>({
    stage: 'pr_details',
    progress: 0,
    message: '',
    details: undefined
  });
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

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

    const createNewDraft = async (content: string, prUrl: string) => {
      if (!user) {
        // If no user, just set the content without saving
        setBlogContent(content);
        setCurrentPrUrl(prUrl);
        return;
      }

      try {
        // Create a new draft post
        const { data, error } = await supabase
          .from("cached_posts")
          .insert({
            pr_url: prUrl,
            title: "Draft",
            content: content,
            user_id: user.id,
            is_draft: true
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating draft:", error);
          // Still set the content even if save fails
          setBlogContent(content);
          setCurrentPrUrl(prUrl);
          return;
        }

        if (data) {
          // Navigate to the edit page with the new ID
          navigate(`/edit/${data.id}`, { replace: true });
          setBlogContent(data.content);
          setCurrentPrUrl(data.pr_url);
          setPostId(data.id);
        }
      } catch (err) {
        console.error("Error creating draft:", err);
        setBlogContent(content);
        setCurrentPrUrl(prUrl);
      }
    };

    // Check if we have an ID in the URL
    if (params.id) {
      fetchPostById(params.id);
    } else {
      // If no ID, check location state
      const state = location.state as { content: string; prUrl: string } | null;

      if (state?.content && state?.prUrl) {
        // Create a new draft with the provided content
        createNewDraft(state.content, state.prUrl);
      } else {
        // No content or ID, redirect to home
        navigate("/");
      }
    }
  }, [params.id, location, navigate, user]);

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

  // Parse PR URL to get owner/repo#number format
  const getPRDisplay = (prUrl: string | null) => {
    if (!prUrl) return null;
    
    // Extract owner, repo, and PR number from GitHub PR URL
    const match = prUrl.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    if (match) {
      const [, owner, repo, number] = match;
      return `${owner}/${repo}#${number}`;
    }
    return null;
  };

  // Auto-save functionality
  const saveContent = useCallback(async (content: string) => {
    if (!user || !postId) return;
    
    setSaveStatus('saving');
    
    try {
      const { error } = await supabase
        .from("cached_posts")
        .update({ 
          content,
          is_draft: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", postId);

      if (error) {
        console.error("Error saving draft:", error);
        setSaveStatus('error');
      } else {
        setSaveStatus('saved');
        // Clear save status after 2 seconds
        setTimeout(() => setSaveStatus(null), 2000);
      }
    } catch (err) {
      console.error("Error saving draft:", err);
      setSaveStatus('error');
    }
  }, [user, postId]);

  // Handle content changes with debouncing
  const handleContentChange = useCallback((newContent: string) => {
    setBlogContent(newContent);
    
    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    // Set new timer for auto-save (1.5 seconds after user stops typing)
    saveTimerRef.current = setTimeout(() => {
      saveContent(newContent);
    }, 1500);
  }, [saveContent]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

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
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackClick}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
        
        {currentPrUrl && (
          <a
            href={currentPrUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {getPRDisplay(currentPrUrl) || "View PR"}
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      <EnhancedMarkdownEditor
        initialContent={blogContent}
        onRegenerate={handleRegenerate}
        isRegenerating={isLoading}
        showSignInPrompt={!user}
        user={user}
        onChange={handleContentChange}
        saveStatus={saveStatus}
      />
    </div>
  );
}
