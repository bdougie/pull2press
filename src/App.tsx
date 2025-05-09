import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import EditPage from "./pages/EditPage";
function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8fa]">
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/edit" element={<EditPage />} />
        </Routes>
      </main>
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
