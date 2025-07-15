import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { selectedText, userPrompt, previousMessages, systemPrompt } = await request.json();

    // Get API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey,
    });

    const messages = [
      { role: 'system', content: systemPrompt || `You are an AI writing assistant integrated into a blog editor. 
When given text and instructions, provide helpful improvements, corrections, or additions.
Be concise and directly provide the improved text without excessive explanation.
Maintain the original tone and style unless specifically asked to change it.` },
      ...(previousMessages || []),
      { 
        role: 'user', 
        content: `Selected text: "${selectedText}"\n\nInstruction: ${userPrompt}` 
      }
    ];

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages as any,
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Create a ReadableStream to send the response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in prompt editor API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}