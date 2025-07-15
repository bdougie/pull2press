import { useState, useEffect } from "react";
import { AuthButton } from "./components/auth-button";
import { HistoryDrawer } from "./components/history-drawer";
import { supabase } from "./lib/supabase";
import type { CachedPost } from "./lib/supabase";
import { Routes, Route, useNavigate } from "react-router-dom";
import HomeEnhanced from "./pages/HomeEnhanced";
import Edit from "./pages/Edit";
import Settings from "./pages/Settings";

function App() {
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
  }, []);

  const handleSelectPost = (post: CachedPost) => {
    navigate("/edit", {
      state: {
        content: post.content,
        prUrl: post.pr_url,
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8fa]">
      <nav className="bg-white border-b border-[#d0d7de] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-semibold">pull2press</h1>
          </div>
          <div className="flex items-center space-x-2">
            {user && <HistoryDrawer onSelectPost={handleSelectPost} />}
            <AuthButton />
          </div>
        </div>
      </nav>

      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto py-10 px-4">
          <Routes>
            <Route path="/" element={<HomeEnhanced user={user} />} />
            <Route path="/edit" element={<Edit user={user} />} />
            <Route path="/edit/:id" element={<Edit user={user} />} />
            <Route path="/settings" element={<Settings user={user} />} />
          </Routes>
        </div>
      </div>

      <footer className="border-t border-gray-200 py-4 mt-auto bg-[#f6f8fa]">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          Made with ❤️ from{" "}
          <a
            href="https://b.dougie.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:underline"
          >
            bdougie
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
