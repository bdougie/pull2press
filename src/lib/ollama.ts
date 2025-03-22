// Define proper types for PR data
interface Commit {
  message: string;
  sha: string;
  url: string;
}

interface File {
  filename: string;
  patch?: string;
  status: string;
  additions: number;
  deletions: number;
}

interface PullRequestData {
  title: string;
  description: string;
  commits: Commit[];
  files: File[];
}

// Ollama response type
interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

// Ollama client configuration
const OLLAMA_API_URL = import.meta.env.VITE_OLLAMA_API_URL || 'http://localhost:11434';
const DEFAULT_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'llama3';

export async function generateBlogPost(prData: PullRequestData) {
  const systemPrompt = `You are an expert technical writer and software engineer with deep knowledge of modern development practices. Your task is to create engaging, technically accurate blog posts about code changes. When writing:

- Use a clear, professional tone while keeping the content engaging
- Focus on the technical value and impact of the changes
- Explain complex concepts in an accessible way
- Include relevant code snippets with proper context
- Structure the content with clear headings and sections
- Highlight best practices and engineering decisions
- End with concrete takeaways for the reader`;

  const userPrompt = `Write a detailed technical blog post about the following GitHub pull request:

Title: ${prData.title}
Description: ${prData.description}

Changes:
- Number of commits: ${prData.commits.length}
- Number of files modified: ${prData.files.length}

Commit messages:
${prData.commits.map((commit) => `- ${commit.message}`).join('\n')}

Files changed:
${prData.files.map((file) => `- ${file.filename} (${file.additions} additions, ${file.deletions} deletions)`).join('\n')}

Please write a comprehensive blog post that:
1. Explains the purpose and context of these changes
2. Discusses the technical implementation details
3. Highlights any important code changes
4. Includes relevant code examples where appropriate
5. Concludes with the impact and benefits of these changes

Use a professional but engaging tone and format the post in Markdown.`;

  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        options: {
          temperature: 0.7,
        },
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.message?.content || '';
  } catch (error) {
    console.error('Error generating blog post with Ollama:', error);
    throw error;
  }
}

// Utility function to check if Ollama server is available
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/status`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}
