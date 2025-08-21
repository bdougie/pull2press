import { supabase } from './supabase';

export interface LinkSuggestion {
  title: string;
  url: string;
  description: string;
  relevance: 'high' | 'medium' | 'low';
  type: 'documentation' | 'tutorial' | 'reference' | 'article' | 'tool';
}

export interface LinkFinderResponse {
  links: LinkSuggestion[];
  topics?: string;
}

export interface LinkFinderOptions {
  topic?: string;
  maxLinks?: number;
}

/**
 * Find helpful links and references for technical content
 * @param content The blog post or text content to analyze
 * @param options Optional configuration for link finding
 * @returns Promise with link suggestions and extracted topics
 */
export async function findHelpfulLinks(
  content: string,
  options: LinkFinderOptions = {}
): Promise<LinkFinderResponse> {
  const { topic, maxLinks = 5 } = options;

  try {
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('find-helpful-links', {
      body: {
        content,
        topic,
        maxLinks,
      },
    });

    if (error) {
      console.error('Error calling find-helpful-links function:', error);
      throw new Error(error.message || 'Failed to find helpful links');
    }

    if (!data || !data.links) {
      throw new Error('No links found');
    }

    return {
      links: data.links,
      topics: data.topics,
    };
  } catch (error) {
    console.error('Error finding helpful links:', error);
    
    // Return fallback links if the service fails
    return {
      links: [
        {
          title: 'MDN Web Docs',
          url: 'https://developer.mozilla.org',
          description: 'Comprehensive documentation for web technologies',
          relevance: 'high',
          type: 'documentation',
        },
        {
          title: 'GitHub Documentation',
          url: 'https://docs.github.com',
          description: 'Official GitHub documentation and guides',
          relevance: 'medium',
          type: 'documentation',
        },
      ],
      topics: 'Unable to extract topics',
    };
  }
}

/**
 * Format link suggestions as markdown
 * @param links Array of link suggestions
 * @returns Formatted markdown string with links
 */
export function formatLinksAsMarkdown(links: LinkSuggestion[]): string {
  if (!links || links.length === 0) {
    return '';
  }

  const sections = {
    high: [] as LinkSuggestion[],
    medium: [] as LinkSuggestion[],
    low: [] as LinkSuggestion[],
  };

  // Group links by relevance
  links.forEach(link => {
    sections[link.relevance].push(link);
  });

  let markdown = '\n\n## Helpful Resources\n\n';

  // Add high relevance links first
  if (sections.high.length > 0) {
    markdown += '### Essential Reading\n\n';
    sections.high.forEach(link => {
      markdown += `- [${link.title}](${link.url}) - ${link.description}\n`;
    });
    markdown += '\n';
  }

  // Add medium relevance links
  if (sections.medium.length > 0) {
    markdown += '### Additional Resources\n\n';
    sections.medium.forEach(link => {
      markdown += `- [${link.title}](${link.url}) - ${link.description}\n`;
    });
    markdown += '\n';
  }

  // Add low relevance links
  if (sections.low.length > 0) {
    markdown += '### Further Reading\n\n';
    sections.low.forEach(link => {
      markdown += `- [${link.title}](${link.url}) - ${link.description}\n`;
    });
    markdown += '\n';
  }

  return markdown;
}

/**
 * Format link suggestions as inline references
 * @param links Array of link suggestions
 * @returns Array of formatted inline link strings
 */
export function formatLinksAsInline(links: LinkSuggestion[]): string[] {
  return links.map(link => `[${link.title}](${link.url})`);
}

/**
 * Insert links into content at appropriate locations
 * @param content The original content
 * @param links Link suggestions to insert
 * @returns Content with links inserted
 */
export function insertLinksIntoContent(
  content: string,
  links: LinkSuggestion[]
): string {
  // This is a simple implementation that adds links at the end
  // A more sophisticated version could analyze the content and insert links contextually
  return content + formatLinksAsMarkdown(links);
}