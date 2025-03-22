// Define proper types for PR data
export interface Commit {
  message: string;
  sha: string;
  url: string;
}

export interface File {
  filename: string;
  patch?: string;
  status: string;
  additions: number;
  deletions: number;
}

export interface PullRequestData {
  title: string;
  description: string;
  commits: Commit[];
  files: File[];
}

// Shared system prompt
export const getSystemPrompt = (): string => {
  return `You are an expert technical writer and software engineer with deep knowledge of modern development practices. Your task is to create engaging, technically accurate blog posts about code changes. When writing:

- Use a clear, professional tone while keeping the content engaging
- Focus on the technical value and impact of the changes
- Explain complex concepts in an accessible way
- Include relevant code snippets with proper context
- Structure the content with clear headings and sections
- Highlight best practices and engineering decisions
- End with concrete takeaways for the reader`;
};

// Shared user prompt builder
export const buildUserPrompt = (prData: PullRequestData): string => {
  return `Write a detailed technical blog post about the following GitHub pull request:

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
};
