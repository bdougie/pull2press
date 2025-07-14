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

export interface FetchProgress {
  stage: 'pr_details' | 'commits' | 'files' | 'generating' | 'complete';
  progress: number; // 0-100
  message: string;
}

export async function fetchPRDataOptimized(
  prUrl: string,
  onProgress?: (progress: FetchProgress) => void
) {
  const { data: { session } } = await supabase.auth.getSession();
  
  // If user is authenticated, use their GitHub token directly
  if (session?.provider_token) {
    const octokit = new Octokit({ auth: session.provider_token });
    const { owner, repo, pull_number } = extractPRInfo(prUrl);

    // Report initial progress
    onProgress?.({
      stage: 'pr_details',
      progress: 10,
      message: 'Fetching pull request data...'
    });

    // Fetch all data in parallel for maximum speed
    const [prResult, commitsResult, filesResult] = await Promise.allSettled([
      octokit.rest.pulls.get({ owner, repo, pull_number }),
      octokit.rest.pulls.listCommits({ owner, repo, pull_number }),
      octokit.rest.pulls.listFiles({ owner, repo, pull_number }),
    ]);

    // Update progress after parallel fetch
    onProgress?.({
      stage: 'files',
      progress: 60,
      message: 'Processing pull request data...'
    });

    // Handle errors gracefully
    if (prResult.status === 'rejected') {
      throw new Error(`Failed to fetch PR details: ${prResult.reason}`);
    }

    const pr = prResult.value.data;
    const commits = commitsResult.status === 'fulfilled' ? commitsResult.value.data : [];
    const files = filesResult.status === 'fulfilled' ? filesResult.value.data : [];

    // For large PRs, limit the data we process
    const processedCommits = commits.slice(0, 20).map((commit) => ({
      message: commit.commit.message,
      sha: commit.sha,
      url: commit.html_url,
    }));

    const processedFiles = files.slice(0, 50).map((file) => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      patch: file.patch,
    }));

    onProgress?.({
      stage: 'generating',
      progress: 80,
      message: 'Preparing content generation...'
    });

    return {
      title: pr.title,
      description: pr.body || '',
      commits: processedCommits,
      files: processedFiles,
      author: {
        login: pr.user?.login || '',
        avatar: pr.user?.avatar_url || '',
      },
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      // Include summary stats for content generation
      stats: {
        totalCommits: commits.length,
        totalFiles: files.length,
        additions: files.reduce((sum, f) => sum + f.additions, 0),
        deletions: files.reduce((sum, f) => sum + f.deletions, 0),
      }
    };
  }
  
  // For unauthenticated users, use server-side API
  onProgress?.({
    stage: 'pr_details',
    progress: 20,
    message: 'Fetching pull request data...'
  });

  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prUrl }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch PR data');
  }

  onProgress?.({
    stage: 'generating',
    progress: 80,
    message: 'Preparing content generation...'
  });

  const data = await response.json();
  return data.prData;
}