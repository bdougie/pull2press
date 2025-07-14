import { Handler } from "@netlify/functions";
import OpenAI from "openai";

const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Request body is required" }),
      };
    }

    const { systemPrompt, userPrompt, temperature = 0.7 } = JSON.parse(event.body);

    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "OpenAI API key not configured" }),
      };
    }

    if (!systemPrompt || !userPrompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Both systemPrompt and userPrompt are required" }),
      };
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ content }),
    };
  } catch (error) {
    console.error("Error generating content:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to generate content" }),
    };
  }
};

export { handler };