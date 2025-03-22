import { Octokit } from 'octokit';
import { supabase } from './supabase';

// Create an Octokit instance with the appropriate token
async function getOctokit() {
  const { data: { session } } = await supabase.auth.getSession();
  
  // If user is authenticated, use their GitHub token
  if (session?.provider_token) {
    return new Octokit({ auth: session.provider_token });
  }
  
  // Fallback to environment variable for unauthenticated users
  return new Octokit({ auth: import.meta.env.VITE_GITHUB_TOKEN });
}

export function extractPRInfo(url: string) {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) {
    throw new Error('Invalid GitHub PR URL');
  }
  return {
    owner: match[1],
    repo: match[2],
    pull_number: parseInt(match[3], 10),
  };
}

export async function fetchPRData(prUrl: string) {
  const octokit = await getOctokit();
  const { owner, repo, pull_number } = extractPRInfo(prUrl);

  // Fetch PR details
  const { data: pr } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number,
  });

  // Fetch PR commits
  const { data: commits } = await octokit.rest.pulls.listCommits({
    owner,
    repo,
    pull_number,
  });

  // Fetch PR files
  const { data: files } = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number,
  });

  return {
    title: pr.title,
    description: pr.body || '',
    commits: commits.map((commit) => ({
      message: commit.commit.message,
      sha: commit.sha,
      url: commit.html_url,
    })),
    files: files.map((file) => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      patch: file.patch,
    })),
    author: {
      login: pr.user?.login || '',
      avatar: pr.user?.avatar_url || '',
    },
    created_at: pr.created_at,
    updated_at: pr.updated_at,
  };
}