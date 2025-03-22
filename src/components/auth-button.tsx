import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { supabase } from "@/lib/supabase";
import { LogIn, LogOut, Loader2 } from "lucide-react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "../../components/ui/avatar";

export function AuthButton() {
  const [loading, setLoading] = useState(false);
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error("Error signing out:", err);
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
      ? `https://github.com/${githubUsername}.png`
      : null;

    console.log("User metadata:", user.user_metadata); // Debug user metadata

    return (
      <div className="flex items-center gap-2">
        {avatarUrl && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={githubUsername} />
            <AvatarFallback>
              {githubUsername?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          Sign Out
        </Button>
      </div>
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
