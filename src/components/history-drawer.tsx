import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { CachedPost } from "@/lib/supabase";

interface HistoryDrawerProps {
  onSelectPost: (post: CachedPost) => void;
}

export function HistoryDrawer({ onSelectPost }: HistoryDrawerProps) {
  const [posts, setPosts] = useState<CachedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return;

      const { data, error } = await supabase
        .from('cached_posts')
        .select('*')
        .eq('user_id', session.session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      setPosts(data || []);
      setLoading(false);
    };

    fetchPosts();

    // Subscribe to changes
    const channel = supabase
      .channel('cached_posts_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cached_posts'
      }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <History className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Previous Pull Requests</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <span className="loading">Loading...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center text-muted-foreground p-4">
              No previous pull requests found
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => onSelectPost(post)}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{post.title}</h3>
                    <a
                      href={post.pr_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}