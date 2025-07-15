import { useState } from 'react';
import { Card } from '../components/ui/card';
import { SimplePromptEditor } from '../components/prompt-editor/SimplePromptEditor';

export default function PromptEditorDemo() {
  const [content, setContent] = useState(`# Welcome to the Prompt Editor Demo

This is a demo page to test the AI-powered prompt editor.

## How to use:

1. Select any text in this textarea
2. The AI Editor popup should appear
3. Choose an action or type your own instruction
4. The AI will help improve your selected text

## Sample text to try:

This is a sample paragraph that you can select and improve. It might have some grammatical errors or could be written more clearly. Try selecting this text and using the AI editor to make it better!

Here's another paragraph with some technical content. The prompt editor can help you add code examples, improve clarity, or make the content more concise. Just highlight any portion of this text to get started.
`);

  const handleTextReplace = (originalText: string, newText: string) => {
    const index = content.indexOf(originalText);
    if (index !== -1) {
      const before = content.substring(0, index);
      const after = content.substring(index + originalText.length);
      setContent(before + newText + after);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-[#24292f]">Prompt Editor Demo</h1>
      
      <Card className="border border-[#d0d7de] p-4">
        <p className="text-sm text-[#57606a] mb-4">
          Select any text in the editor below to activate the AI prompt editor.
        </p>
        
        <SimplePromptEditor onTextReplace={handleTextReplace}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-[500px] p-4 font-mono text-sm border border-[#d0d7de] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-transparent resize-none"
            placeholder="Type or paste your content here..."
          />
        </SimplePromptEditor>
      </Card>

      <Card className="border border-[#d0d7de] p-4 bg-[#f6f8fa]">
        <h3 className="font-semibold text-[#24292f] mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-[#57606a]">
          <li>Select any text in the editor above</li>
          <li>The AI Editor sidebar will appear from the right</li>
          <li>Choose a preset action or type your own instruction</li>
          <li>Click "Apply" to replace the selected text</li>
        </ol>
      </Card>
    </div>
  );
}