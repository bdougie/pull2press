import { Octokit } from 'octokit';
import { supabase } from './supabase';


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
  const { data: { session } } = await supabase.auth.getSession();
  
  // If user is authenticated, use their GitHub token directly
  if (session?.provider_token) {
    const octokit = new Octokit({ auth: session.provider_token });
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
  
  // For unauthenticated users, use GitHub's public API (with rate limits)
  const octokit = new Octokit();
  const { owner, repo, pull_number } = extractPRInfo(prUrl);

  try {
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
  } catch (error) {
    console.error('Error fetching PR data:', error);
    if (error instanceof Error && error.message.includes('rate limit')) {
      throw new Error('GitHub API rate limit exceeded. Please sign in to continue.');
    }
    throw new Error('Failed to fetch PR data. Please check the URL and try again.');
  }
}