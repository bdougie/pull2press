import { GithubIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f8fa]">
      <nav className="bg-white border-b border-[#d0d7de] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GithubIcon className="h-6 w-6" />
            <h1 className="text-xl font-semibold">CommitChronicles</h1>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto py-10 px-4">
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-6">Transform Your Pull Request into a Blog Post</h2>
          <p className="text-gray-600 mb-6">
            Turn your code commits into engaging developer-friendly blog posts. Simply paste your pull request URL below to get started.
          </p>
          <form className="space-y-4">
            <div>
              <label htmlFor="pr-url" className="block text-sm font-medium text-gray-700 mb-1">
                Pull Request URL
              </label>
              <input
                type="url"
                id="pr-url"
                className="w-full px-3 py-2 border border-[#d0d7de] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-transparent"
                placeholder="https://github.com/owner/repo/pull/123"
              />
            </div>
            <Button className="bg-[#2da44e] hover:bg-[#2c974b] text-white">
              Generate Blog Post
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}