import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

const REPO_URL = "https://github.com/bdougie/pull2press";

export default function Sunset() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8fa]">
      <nav className="bg-white border-b border-[#d0d7de] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-xl font-semibold">pull2press</span>
        </div>
      </nav>

      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto py-10 px-4">
          <Card className="p-6 border-[#d0d7de]">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-block rounded-full border border-[#d0d7de] bg-[#f6f8fa] px-2 py-0.5 text-xs font-medium text-gray-700">
                Archived
              </span>
              <h1 className="text-2xl font-semibold">
                pull2press is no longer running
              </h1>
            </div>

            <p className="text-gray-600 mb-4">
              This hosted service has been shut down and is no longer supported.
              Generation, sign-in, and saved post history are turned off.
            </p>
            <p className="text-gray-600 mb-6">
              The source code is open under the Apache 2.0 license. If you want
              to keep using pull2press, fork the repository and run it yourself
              with your own GitHub, OpenAI, and Supabase credentials. The README
              covers local setup.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <a
                  href={`${REPO_URL}/fork`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Fork on GitHub
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
                  View source
                </a>
              </Button>
            </div>
          </Card>
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
