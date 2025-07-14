import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { OpenAI } from "https://deno.land/x/openai@v4.24.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { systemPrompt, userPrompt, temperature = 0.7 } = await req.json();

    // Validate required fields
    if (!systemPrompt || !userPrompt) {
      return new Response(
        JSON.stringify({ error: "Both systemPrompt and userPrompt are required" }),
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

    // Generate content
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "gpt-4-1106-preview",
      temperature,
      max_tokens: 2000,
    });

    const content = completion.choices[0].message.content || '';

    return new Response(
      JSON.stringify({ content }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error generating content:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate content",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});