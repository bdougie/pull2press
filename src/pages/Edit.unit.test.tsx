import { describe, it, expect } from 'vitest';

// Test the PR URL parsing logic directly
describe('PR URL Parsing', () => {
  const getPRDisplay = (prUrl: string | null) => {
    if (!prUrl) return null;
    
    // Extract owner, repo, and PR number from GitHub PR URL
    const match = prUrl.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    if (match) {
      const [, owner, repo, number] = match;
      return `${owner}/${repo}#${number}`;
    }
    return null;
  };

  it('should parse GitHub PR URL correctly', () => {
    const prUrl = 'https://github.com/owner/repo/pull/123';
    expect(getPRDisplay(prUrl)).toBe('owner/repo#123');
  });

  it('should handle complex repo names', () => {
    const prUrl = 'https://github.com/my-org/my-awesome-repo/pull/456';
    expect(getPRDisplay(prUrl)).toBe('my-org/my-awesome-repo#456');
  });

  it('should return null for invalid URLs', () => {
    expect(getPRDisplay('https://github.com/owner/repo')).toBeNull();
    expect(getPRDisplay('https://example.com/pull/123')).toBeNull();
    expect(getPRDisplay('')).toBeNull();
  });

  it('should return null for null input', () => {
    expect(getPRDisplay(null)).toBeNull();
  });
});