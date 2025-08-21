// Test script for the find-helpful-links Edge Function
// Run with: node test-link-finder.js

async function testLinkFinder() {
  const supabaseUrl = 'https://mzjbwtuwfhqujpktlonh.supabase.co';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY_HERE';
  
  const testContent = `
    In this post, I implemented a new authentication system using React hooks and TypeScript.
    I chose to use the Context API for state management instead of Redux because it simplified
    our codebase significantly. The main challenge I encountered was handling token refresh
    logic, which I solved by implementing a custom useAuth hook with automatic retry mechanisms.
    
    I also integrated Supabase for the backend authentication, which provided a great developer
    experience with its real-time subscriptions and row-level security policies.
  `;

  try {
    console.log('Testing find-helpful-links Edge Function...\n');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/find-helpful-links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        content: testContent,
        maxLinks: 5
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error:', error);
      return;
    }

    const data = await response.json();
    
    console.log('Topics identified:');
    console.log(data.topics);
    console.log('\nHelpful links found:');
    
    data.links.forEach((link, index) => {
      console.log(`\n${index + 1}. ${link.title}`);
      console.log(`   URL: ${link.url}`);
      console.log(`   Description: ${link.description}`);
      console.log(`   Relevance: ${link.relevance}`);
      console.log(`   Type: ${link.type}`);
    });
    
  } catch (error) {
    console.error('Failed to test Edge Function:', error);
  }
}

// Check if we have the anon key in environment
if (!process.env.VITE_SUPABASE_ANON_KEY) {
  console.log('Please set VITE_SUPABASE_ANON_KEY environment variable');
  console.log('You can find it in your .env file or Supabase project settings');
} else {
  testLinkFinder();
}