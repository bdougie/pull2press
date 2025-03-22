import { NextResponse } from "next/server";
import OpenAI from "openai";
import { Octokit } from "octokit";

// Initialize Octokit
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

function extractPRInfo(url: string) {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) {
    throw new Error("Invalid GitHub PR URL");
  }
  return {
    owner: match[1],
    repo: match[2],
    pull_number: parseInt(match[3], 10),
  };
}

async function fetchPRData(prUrl: string) {
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
    description: pr.body || "",
    commits: commits.map(commit => ({
      message: commit.commit.message,
      sha: commit.sha,
      url: commit.html_url,
    })),
    files: files.map(file => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      patch: file.patch,
    })),
    author: {
      login: pr.user?.login || "",
      avatar: pr.user?.avatar_url || "",
    },
    created_at: pr.created_at,
    updated_at: pr.updated_at,
  };
}

export async function POST(req: Request) {
  try {
    const { prUrl } = await req.json();

    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json(
        { error: "GitHub token not configured" },
        { status: 500 }
      );
    }

    const prData = await fetchPRData(prUrl);

    // TODO: Use Vercel AI SDK to generate blog post
    // For now, return the fetched PR data
    return NextResponse.json({
      content: `# ${prData.title}\n\n${prData.description}\n\n## Changes\n\nThis pull request includes ${prData.commits.length} commits and modifies ${prData.files.length} files.`,
      prData,
    });
  } catch (error) {
    console.error("Error generating blog post:", error);
    if (error instanceof Error && error.message === "Invalid GitHub PR URL") {
      return NextResponse.json(
        { error: "Invalid GitHub PR URL format" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to generate blog post" },
      { status: 500 }
    );
  }
}