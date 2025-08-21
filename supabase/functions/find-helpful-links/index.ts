import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { OpenAI } from "https://deno.land/x/openai@v4.24.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LinkSuggestion {
  title: string;
  url: string;
  description: string;
  relevance: 'high' | 'medium' | 'low';
  type: 'documentation' | 'tutorial' | 'reference' | 'article' | 'tool';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { content, topic, maxLinks = 5 } = await req.json();

    // Validate required fields
    if (!content) {
      return new Response(
        JSON.stringify({ error: "Content is required" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get OpenAI API key from environment
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: openAIApiKey,
    });

    // Extract technical topics and concepts from the content
    const topicExtractionPrompt = `Analyze this technical blog post and identify the main technologies, concepts, and topics that would benefit from helpful links and references. Focus on:
1. Programming languages and frameworks mentioned
2. Technical concepts that readers might want to learn more about
3. Tools and libraries referenced
4. Best practices or patterns discussed

Content: ${content}

${topic ? `Specific topic to focus on: ${topic}` : ''}

Provide a list of 3-5 key topics that would most benefit from external references.`;

    const topicsResponse = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a technical content analyst helping identify topics that need supporting documentation and references."
        },
        { role: "user", content: topicExtractionPrompt }
      ],
      model: "gpt-4o",
      temperature: 0.3,
      max_tokens: 500,
    });

    const extractedTopics = topicsResponse.choices[0].message.content || '';

    // Generate search queries and find relevant links
    const linkFindingPrompt = `Based on these technical topics from a blog post:
${extractedTopics}

Generate ${maxLinks} helpful link suggestions that would enhance the reader's understanding. For each link, provide:
1. A descriptive title
2. The actual URL (use real, well-known documentation sites and resources)
3. A brief description of what the reader will find
4. Relevance level (high/medium/low)
5. Type (documentation/tutorial/reference/article/tool)

Focus on:
- Official documentation (MDN, React docs, Node.js docs, etc.)
- Popular tutorial sites (freeCodeCamp, CSS-Tricks, Dev.to)
- GitHub repositories for mentioned tools
- Stack Overflow discussions for common issues
- Technical blog posts from reputable sources

Return as JSON array with this structure:
[
  {
    "title": "Example Title",
    "url": "https://example.com/path",
    "description": "What the reader will learn",
    "relevance": "high",
    "type": "documentation"
  }
]`;

    const linksResponse = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a technical reference curator. Provide real, accurate URLs to well-known technical resources. Never make up URLs - use actual documentation sites and resources that developers commonly reference."
        },
        { role: "user", content: linkFindingPrompt }
      ],
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    let links: LinkSuggestion[] = [];
    
    try {
      const responseContent = linksResponse.choices[0].message.content || '{}';
      const parsed = JSON.parse(responseContent);
      
      // Handle both array response and object with links property
      if (Array.isArray(parsed)) {
        links = parsed;
      } else if (parsed.links && Array.isArray(parsed.links)) {
        links = parsed.links;
      } else {
        // Fallback: try to extract any array from the response
        const arrayMatch = responseContent.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          links = JSON.parse(arrayMatch[0]);
        }
      }
    } catch (parseError) {
      console.error("Error parsing links response:", parseError);
      // Return some default helpful links as fallback
      links = [
        {
          title: "MDN Web Docs",
          url: "https://developer.mozilla.org",
          description: "Comprehensive documentation for web technologies",
          relevance: "high",
          type: "documentation"
        },
        {
          title: "GitHub Guides",
          url: "https://guides.github.com",
          description: "Official GitHub guides and best practices",
          relevance: "medium",
          type: "tutorial"
        }
      ];
    }

    // Validate and sanitize URLs
    const validatedLinks = links
      .filter(link => link.url && link.url.startsWith('http'))
      .slice(0, maxLinks);

    return new Response(
      JSON.stringify({ 
        links: validatedLinks,
        topics: extractedTopics
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error finding helpful links:", error);
    
    let errorMessage = "Failed to find helpful links";
    let errorDetails = "Unknown error";
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorDetails = error.message;
      
      if (error.message.includes("401") || error.message.includes("Unauthorized")) {
        errorMessage = "Invalid OpenAI API key";
        statusCode = 401;
      } else if (error.message.includes("429")) {
        errorMessage = "OpenAI API rate limit exceeded";
        statusCode = 429;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      }),
      { 
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});