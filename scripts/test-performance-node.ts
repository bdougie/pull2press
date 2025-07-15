import { Octokit } from 'octokit';
import OpenAI from 'openai';
import { config } from 'dotenv';
config();

interface PerformanceMetrics {
  fetchPRDetails: number;
  fetchCommits: number;
  fetchFiles: number;
  totalFetch: number;
  generateContent: number;
  total: number;
}

// Extract PR info from URL
function extractPRInfo(url: string) {
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

async function testPerformance(prUrl: string): Promise<PerformanceMetrics> {
  console.log(`\n🔍 Testing performance for: ${prUrl}`);
  console.log('━'.repeat(60));

  const octokit = new Octokit({ 
    auth: process.env.GITHUB_TOKEN 
  });
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const { owner, repo, pull_number } = extractPRInfo(prUrl);
  const startTotal = performance.now();

  // Test sequential fetching (current implementation)
  console.log('\n📊 Sequential Fetching:');
  const startFetch = performance.now();
  
  const startPR = performance.now();
  const { data: pr } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number,
  });
  const prTime = performance.now() - startPR;
  console.log(`   ✓ PR details: ${(prTime / 1000).toFixed(2)}s`);

  const startCommits = performance.now();
  const { data: commits } = await octokit.rest.pulls.listCommits({
    owner,
    repo,
    pull_number,
  });
  const commitsTime = performance.now() - startCommits;
  console.log(`   ✓ Commits (${commits.length}): ${(commitsTime / 1000).toFixed(2)}s`);

  const startFiles = performance.now();
  const { data: files } = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number,
  });
  const filesTime = performance.now() - startFiles;
  console.log(`   ✓ Files (${files.length}): ${(filesTime / 1000).toFixed(2)}s`);

  const totalFetchTime = performance.now() - startFetch;
  console.log(`   Total fetch: ${(totalFetchTime / 1000).toFixed(2)}s`);

  // Test parallel fetching (optimized)
  console.log('\n⚡ Parallel Fetching (Optimized):');
  const startParallel = performance.now();
  
  const [prDataParallel, commitsParallel, filesParallel] = await Promise.all([
    octokit.rest.pulls.get({ owner, repo, pull_number }),
    octokit.rest.pulls.listCommits({ owner, repo, pull_number }),
    octokit.rest.pulls.listFiles({ owner, repo, pull_number }),
  ]);
  
  const parallelTime = performance.now() - startParallel;
  console.log(`   ✓ All data fetched in parallel: ${(parallelTime / 1000).toFixed(2)}s`);
  console.log(`   🎯 Speed improvement: ${((totalFetchTime - parallelTime) / 1000).toFixed(2)}s faster (${((1 - parallelTime/totalFetchTime) * 100).toFixed(0)}% improvement)`);

  // Test content generation
  console.log('\n🤖 Content Generation:');
  const startGenerate = performance.now();
  
  const prData = {
    title: pr.title,
    description: pr.body || '',
    commits: commits.slice(0, 10).map(c => c.commit.message).join('\n'),
    filesChanged: files.length,
    additions: files.reduce((sum, f) => sum + f.additions, 0),
    deletions: files.reduce((sum, f) => sum + f.deletions, 0),
  };

  const systemPrompt = "You are a technical blog post writer. Transform pull request data into an engaging developer blog post.";
  const userPrompt = `Write a blog post about this PR:\nTitle: ${prData.title}\nDescription: ${prData.description}\nFiles changed: ${prData.filesChanged}\nAdditions: ${prData.additions}\nDeletions: ${prData.deletions}`;

  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    model: "gpt-4o",
    temperature: 0.7,
    max_tokens: 2000,
  });

  const generateTime = performance.now() - startGenerate;
  console.log(`   ✓ Content generated: ${(generateTime / 1000).toFixed(2)}s`);
  console.log(`   ✓ Content length: ${completion.choices[0].message.content?.length || 0} characters`);

  const totalTime = performance.now() - startTotal;

  console.log('\n📈 Performance Summary:');
  console.log('━'.repeat(60));
  console.log(`   Sequential Fetch: ${(totalFetchTime / 1000).toFixed(2)}s`);
  console.log(`   Parallel Fetch:   ${(parallelTime / 1000).toFixed(2)}s`);
  console.log(`   Generate Content: ${(generateTime / 1000).toFixed(2)}s`);
  console.log(`   Total Time:       ${(totalTime / 1000).toFixed(2)}s`);
  console.log('━'.repeat(60));

  return {
    fetchPRDetails: prTime,
    fetchCommits: commitsTime,
    fetchFiles: filesTime,
    totalFetch: totalFetchTime,
    generateContent: generateTime,
    total: totalTime,
  };
}

// Main execution
async function main() {
  if (!process.env.GITHUB_TOKEN || !process.env.OPENAI_API_KEY) {
    console.error('❌ Please set GITHUB_TOKEN and OPENAI_API_KEY environment variables');
    process.exit(1);
  }

  const testUrl = process.argv[2] || 'https://github.com/bdougie/dinnerpeople/pull/21';
  
  try {
    await testPerformance(testUrl);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();