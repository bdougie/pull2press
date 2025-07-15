# Prompt Editor

The Prompt Editor is an AI-powered text improvement feature that helps users enhance their content with intelligent suggestions and edits.

## Overview

The Prompt Editor appears as a sliding sidebar from the right when users select text in the markdown editor. It provides AI-powered text improvements through a conversational interface powered by OpenAI's GPT-4.

## Features

### Text Selection Detection
- Automatically detects when users select text in the editor
- Displays the selected text in the sidebar for context
- Works seamlessly with the existing markdown editor

### AI-Powered Improvements
The sidebar offers several preset improvement options:
- **Improve writing** - Enhances clarity and style
- **Fix grammar** - Corrects spelling and grammar errors  
- **Add CTA** - Adds compelling calls-to-action
- **Add code example** - Inserts relevant code examples
- **Make concise** - Shortens text while preserving key points

### Custom Instructions
- Users can type custom instructions for specific improvements
- Full conversational interface allows back-and-forth refinement
- Context is maintained across multiple messages (last 5 message pairs)

### Streaming Responses
- Real-time streaming of AI responses for immediate feedback
- Token count display to track usage
- Smooth scrolling to latest messages

### Easy Application
- Copy button to copy any AI-generated response
- Apply button to instantly replace selected text with improvements
- Maintains original text formatting and style unless instructed otherwise

## Technical Implementation

### Components

#### SimplePromptEditor
Located at `/src/components/prompt-editor/SimplePromptEditor.tsx`

The main wrapper component that:
- Detects text selection through mouse events
- Manages sidebar visibility state
- Handles text replacement in the parent editor
- Uses React Portal for rendering the sidebar overlay

#### PromptEditorSidebar  
Located at `/src/components/prompt-editor/PromptEditorSidebar.tsx`

The sidebar UI component that:
- Displays selected text and chat interface
- Manages conversation history
- Handles streaming API responses
- Provides copy/apply functionality

### API Integration

The Prompt Editor uses a Supabase Edge Function for secure server-side OpenAI API calls:

```typescript
// Client-side call
const response = await fetch(`${supabaseUrl}/functions/v1/prompt-editor`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    selectedText,
    userPrompt,
    previousMessages,
    systemPrompt,
  }),
});
```

### Edge Function Setup

The `prompt-editor` edge function handles:
- CORS for cross-origin requests
- OpenAI API authentication using environment variables
- Streaming response transformation
- Error handling and fallbacks

## Configuration

### Environment Variables

The following environment variables must be set:

1. **Client-side** (in `.env`):
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. **Supabase Edge Functions** (in Supabase dashboard):
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```

### Deployment

1. Deploy the edge function:
   ```bash
   supabase functions deploy prompt-editor
   ```

2. Set the OpenAI API key in Supabase:
   - Navigate to your Supabase project dashboard
   - Go to Edge Functions → Settings
   - Add `OPENAI_API_KEY` environment variable

## Usage

### For End Users

1. Select any text in the markdown editor
2. The AI Editor sidebar automatically appears
3. Choose a preset action or type custom instructions
4. Review the AI-generated improvement
5. Click "Apply" to replace the selected text

### For Developers

To integrate the Prompt Editor in a component:

```tsx
import { SimplePromptEditor } from './components/prompt-editor/SimplePromptEditor';

function YourEditor() {
  const [content, setContent] = useState('');
  
  const handleTextReplace = (originalText: string, newText: string) => {
    // Replace logic here
    const updated = content.replace(originalText, newText);
    setContent(updated);
  };

  return (
    <SimplePromptEditor onTextReplace={handleTextReplace}>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} />
    </SimplePromptEditor>
  );
}
```

## Architecture

### Data Flow

1. User selects text in editor
2. `SimplePromptEditor` detects selection via mouseup event
3. `PromptEditorSidebar` opens with selected text
4. User provides instruction (preset or custom)
5. Request sent to Supabase edge function
6. Edge function calls OpenAI API with system + user prompts
7. Streaming response returned to client
8. User can copy or apply the improved text

### Context Management

The `ConversationContext` class manages:
- Message history (last 5 exchanges)
- Token counting estimates
- Context pruning to stay within limits

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure edge function is deployed
   - Check CORS headers in edge function
   - Verify Supabase URL is correct

2. **"Failed to fetch" Errors**
   - Verify OPENAI_API_KEY is set in Supabase environment
   - Check edge function logs for errors
   - Ensure edge function is active

3. **Text Selection Not Working**
   - Check browser console for errors
   - Verify event listeners are attached
   - Test in different browsers

### Debug Mode

Enable debug logging by checking console output:
- Selection events: `Mouse up - checking selection:`
- API errors: Detailed error messages in sidebar

## Future Enhancements

- Support for multiple AI models
- Custom prompt templates
- Keyboard shortcuts for quick access
- Integration with version control for tracking changes
- Batch processing for multiple text selections