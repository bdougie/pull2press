import { Octokit } from 'octokit';
import { supabase } from './supabase';
import { EnhancedFetchProgress } from '../components/enhanced-loading-progress';

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

export async function fetchPRDataEnhanced(
  prUrl: string,
  onProgress?: (progress: EnhancedFetchProgress) => void
) {
  const { data: { session } } = await supabase.auth.getSession();
  
  const octokit = session?.provider_token 
    ? new Octokit({ auth: session.provider_token })
    : new Octokit();
  
  const { owner, repo, pull_number } = extractPRInfo(prUrl);

  try {
    // Report initial progress
    onProgress?.({
      stage: 'pr_details',
      progress: 5,
      message: 'Connecting to GitHub...'
    });

    // Fetch PR details first
    const pr = await octokit.rest.pulls.get({ owner, repo, pull_number });
    
    onProgress?.({
      stage: 'pr_details',
      progress: 15,
      message: 'Fetching pull request details...'
    });

    // Fetch comments
    onProgress?.({
      stage: 'pr_details',
      progress: 20,
      message: 'Looking at comments...',
      details: {
        isAnalyzingComments: true
      }
    });

    const [comments, reviews] = await Promise.all([
      octokit.rest.issues.listComments({ owner, repo, issue_number: pull_number }),
      octokit.rest.pulls.listReviews({ owner, repo, pull_number })
    ]);

    onProgress?.({
      stage: 'commits',
      progress: 30,
      message: 'Analyzing commits...'
    });

    // Fetch commits
    const commits = await octokit.rest.pulls.listCommits({ owner, repo, pull_number });
    
    // Report progress for each commit
    const processedCommits = [];
    for (let i = 0; i < Math.min(commits.data.length, 20); i++) {
      const commit = commits.data[i];
      
      onProgress?.({
        stage: 'commits',
        progress: 30 + (i / Math.min(commits.data.length, 20)) * 15,
        message: `Analyzing commit ${i + 1} of ${commits.data.length}`,
        details: {
          currentCommit: i + 1,
          commitCount: commits.data.length
        }
      });

      processedCommits.push({
        message: commit.commit.message,
        sha: commit.sha,
        url: commit.html_url,
      });
    }

    onProgress?.({
      stage: 'files',
      progress: 45,
      message: 'Processing changed files...'
    });

    // Fetch files
    const files = await octokit.rest.pulls.listFiles({ owner, repo, pull_number });
    
    // Report progress for each file
    const processedFiles = [];
    const filesToProcess = Math.min(files.data.length, 50);
    
    for (let i = 0; i < filesToProcess; i++) {
      const file = files.data[i];
      
      onProgress?.({
        stage: 'files',
        progress: 45 + (i / filesToProcess) * 30,
        message: `Looking at file: ${file.filename}`,
        details: {
          currentFile: file.filename,
          totalFiles: files.data.length,
          currentFileIndex: i + 1
        }
      });

      // Simulate processing time for each file
      await new Promise(resolve => setTimeout(resolve, 100));

      processedFiles.push({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch,
      });
    }

    onProgress?.({
      stage: 'generating',
      progress: 80,
      message: 'Preparing content generation...'
    });

    // Process comments and reviews
    const processedComments = comments.data.slice(0, 10).map(comment => ({
      body: comment.body,
      user: comment.user?.login || 'unknown',
      created_at: comment.created_at
    }));

    const processedReviews = reviews.data.slice(0, 10).map(review => ({
      body: review.body,
      state: review.state,
      user: review.user?.login || 'unknown',
      submitted_at: review.submitted_at
    }));

    return {
      title: pr.data.title,
      description: pr.data.body || '',
      commits: processedCommits,
      files: processedFiles,
      comments: processedComments,
      reviews: processedReviews,
      author: {
        login: pr.data.user?.login || '',
        avatar: pr.data.user?.avatar_url || '',
      },
      created_at: pr.data.created_at,
      updated_at: pr.data.updated_at,
      // Include summary stats for content generation
      stats: {
        totalCommits: commits.data.length,
        totalFiles: files.data.length,
        totalComments: comments.data.length,
        totalReviews: reviews.data.length,
        additions: files.data.reduce((sum, f) => sum + f.additions, 0),
        deletions: files.data.reduce((sum, f) => sum + f.deletions, 0),
      }
    };
  } catch (error) {
    console.error('Error fetching PR data:', error);
    if (error instanceof Error && error.message.includes('rate limit')) {
      throw new Error('GitHub API rate limit exceeded. Please sign in to continue.');
    }
    throw new Error('Failed to fetch PR data. Please check the URL and try again.');
  }
}