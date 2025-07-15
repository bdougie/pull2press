import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { supabase } from "@/lib/supabase";
import { LogIn, LogOut, Loader2, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "../../components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useToast } from "../../hooks/use-toast";

export function AuthButton() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
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
  }, []);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/`,
          scopes: "repo",
        },
      });

      if (error) {
        console.error("Error signing in:", error.message);
        throw error;
      }

      // Log the auth response for debugging
      console.log("Auth response:", data);
    } catch (err) {
      console.error("Failed to sign in:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);

      // First check if a session exists to avoid errors
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Only attempt to sign out if there's an active session
      if (session) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }

      // Always perform these actions, even if there's no session
      // Manually clear user state
      setUser(null);

      // Show success toast
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });

      // Force reload the page to ensure all auth state is cleared
      window.location.href = "/";
    } catch (err) {
      console.error("Error signing out:", err);
      toast({
        title: "Sign out failed",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    // Get GitHub username from user metadata
    const githubUsername =
      user.user_metadata?.user_name ||
      user.user_metadata?.preferred_username ||
      user.user_metadata?.login;
    const avatarUrl = githubUsername
      ? `https://avatars.githubusercontent.com/${githubUsername}`
      : null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-accent focus:outline-none">
            <Avatar className="h-8 w-8 border border-border">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={githubUsername || "User"} />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary">
                  {githubUsername?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="text-sm font-medium">
              {githubUsername || "User"}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-background">
          <DropdownMenuLabel className="font-normal p-3">
            <div className="flex flex-col">
              <p className="text-sm font-medium leading-none">
                {githubUsername}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => navigate('/settings')}
            className="cursor-pointer hover:bg-accent p-3 focus:bg-accent focus:outline-none"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer hover:bg-accent p-3 focus:bg-accent focus:outline-none"
            asChild
          >
            <a
              href="https://github.com/bdougie/pull2press/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <span>Give feedback</span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            disabled={loading}
            className={cn(
              "cursor-pointer hover:bg-destructive/10 p-3 focus:bg-destructive/10 focus:text-destructive focus:outline-none",
              loading ? "opacity-50 cursor-not-allowed" : ""
            )}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4 text-destructive" />
            )}
            <span className="text-destructive">Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSignIn}
      disabled={loading}
      className="flex items-center gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogIn className="h-4 w-4" />
      )}
      Sign In
    </Button>
  );
}
