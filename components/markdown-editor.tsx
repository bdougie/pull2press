"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Edit2 } from "lucide-react";

interface MarkdownEditorProps {
  initialContent: string;
}

export default function MarkdownEditor({ initialContent }: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent);

  return (
    <Card className="border border-[#d0d7de]">
      <Tabs defaultValue="edit" className="w-full">
        <div className="border-b border-[#d0d7de] px-4 py-2">
          <TabsList className="grid w-60 grid-cols-2">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit2 className="h-4 w-4" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit" className="p-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-[500px] p-4 font-mono text-sm border-none focus:outline-none resize-none"
            placeholder="Write your blog post in Markdown..."
          />
        </TabsContent>

        <TabsContent value="preview" className="markdown-preview p-4">
          {/* We'll add markdown rendering here later */}
          <div className="prose max-w-none">
            {content}
          </div>
        </TabsContent>

        <div className="flex justify-end gap-2 border-t border-[#d0d7de] p-4">
          <Button variant="outline">Save Draft</Button>
          <Button className="bg-[#2da44e] hover:bg-[#2c974b] text-white">
            Publish
          </Button>
        </div>
      </Tabs>
    </Card>
  );
}