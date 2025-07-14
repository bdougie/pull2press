import { fetchPRData } from '../src/lib/github';
import { generateBlogPost } from '../src/lib/openai';
import { performance } from 'perf_hooks';

interface PerformanceMetrics {
  fetchPRData: number;
  generateContent: number;
  total: number;
}

async function measurePerformance(prUrl: string): Promise<PerformanceMetrics> {
  console.log(`\n🔍 Testing performance for: ${prUrl}`);
  console.log('━'.repeat(60));

  const startTotal = performance.now();
  
  // Measure PR data fetching
  console.log('\n📊 Fetching PR data...');
  const startFetch = performance.now();
  const prData = await fetchPRData(prUrl);
  const fetchTime = performance.now() - startFetch;
  console.log(`✅ PR data fetched in ${(fetchTime / 1000).toFixed(2)}s`);
  console.log(`   - Title: ${prData.title}`);
  console.log(`   - Files changed: ${prData.files?.length || 0}`);
  console.log(`   - Commits: ${prData.commits?.length || 0}`);
  
  // Measure content generation
  console.log('\n🤖 Generating blog content...');
  const startGenerate = performance.now();
  const content = await generateBlogPost(prData);
  const generateTime = performance.now() - startGenerate;
  console.log(`✅ Content generated in ${(generateTime / 1000).toFixed(2)}s`);
  console.log(`   - Content length: ${content.length} characters`);
  
  const totalTime = performance.now() - startTotal;
  
  console.log('\n📈 Performance Summary:');
  console.log('━'.repeat(60));
  console.log(`   Fetch PR Data:    ${(fetchTime / 1000).toFixed(2)}s (${((fetchTime / totalTime) * 100).toFixed(1)}%)`);
  console.log(`   Generate Content: ${(generateTime / 1000).toFixed(2)}s (${((generateTime / totalTime) * 100).toFixed(1)}%)`);
  console.log(`   Total Time:       ${(totalTime / 1000).toFixed(2)}s`);
  console.log('━'.repeat(60));
  
  return {
    fetchPRData: fetchTime,
    generateContent: generateTime,
    total: totalTime
  };
}

async function runMultipleTests(prUrls: string[]) {
  const results: PerformanceMetrics[] = [];
  
  for (const url of prUrls) {
    try {
      const metrics = await measurePerformance(url);
      results.push(metrics);
    } catch (error) {
      console.error(`\n❌ Error testing ${url}:`, error);
    }
  }
  
  if (results.length > 1) {
    console.log('\n\n📊 OVERALL PERFORMANCE ANALYSIS');
    console.log('═'.repeat(60));
    
    const avgFetch = results.reduce((sum, r) => sum + r.fetchPRData, 0) / results.length;
    const avgGenerate = results.reduce((sum, r) => sum + r.generateContent, 0) / results.length;
    const avgTotal = results.reduce((sum, r) => sum + r.total, 0) / results.length;
    
    console.log(`\n📈 Average Times (${results.length} tests):`);
    console.log(`   Fetch PR Data:    ${(avgFetch / 1000).toFixed(2)}s`);
    console.log(`   Generate Content: ${(avgGenerate / 1000).toFixed(2)}s`);
    console.log(`   Total Time:       ${(avgTotal / 1000).toFixed(2)}s`);
    
    console.log('\n🎯 Optimization Opportunities:');
    if (avgFetch > avgGenerate) {
      console.log('   - PR data fetching is the bottleneck');
      console.log('   - Consider parallelizing GitHub API calls');
      console.log('   - Implement request batching where possible');
    } else {
      console.log('   - Content generation is the bottleneck');
      console.log('   - Consider using a faster model for initial drafts');
      console.log('   - Implement streaming responses');
    }
  }
}

// Test with the provided PR and some additional ones
const testUrls = [
  'https://github.com/bdougie/dinnerpeople/pull/21',
  // Add more test URLs as needed
];

console.log('🚀 Starting Pull2Press Performance Test Suite');
console.log('═'.repeat(60));

runMultipleTests(testUrls).catch(console.error);