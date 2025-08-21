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
  return `You are a software engineer writing about your own work. Write in first person throughout the entire post ("I implemented", "I discovered", "I chose", etc.). Your tone should be pragmatic and informative - focus on technical details, implementation decisions, and practical insights. When writing:

- Write exclusively in first person - you are the developer who made these changes
- Be pragmatic and informative - focus on what was done and why
- Share technical insights and implementation details
- Explain your reasoning for architectural and design decisions
- Include relevant code snippets that demonstrate key changes
- Structure content with clear, descriptive headings
- Discuss challenges encountered and how you solved them
- End with practical takeaways and lessons learned`;
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
