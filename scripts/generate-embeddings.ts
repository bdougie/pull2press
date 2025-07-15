import { supabase } from '../src/lib/supabase';
import { generateEmbedding, prepareTextForEmbedding } from '../src/lib/embeddings';

/**
 * Generate and store embeddings for blog posts
 * Run this as part of build process or as a scheduled job
 */
async function generateBlogEmbeddings() {
  console.log('🚀 Starting embedding generation...');
  
  try {
    // Fetch posts without embeddings
    const { data: posts, error } = await supabase
      .from('cached_posts')
      .select('id, title, content')
      .is('embedding', null)
      .limit(100); // Process in batches
    
    if (error) {
      console.error('Error fetching posts:', error);
      return;
    }
    
    if (!posts || posts.length === 0) {
      console.log('✅ No posts need embeddings');
      return;
    }
    
    console.log(`📝 Processing ${posts.length} posts...`);
    
    // Process each post
    for (const post of posts) {
      try {
        // Prepare text for embedding (title + content preview)
        const textToEmbed = prepareTextForEmbedding(
          `${post.title}\n\n${post.content}`,
          2000 // Limit to ~512 tokens
        );
        
        // Generate embedding
        console.log(`  Generating embedding for post ${post.id}...`);
        const embedding = await generateEmbedding(textToEmbed);
        
        // Store embedding in Supabase
        const { error: updateError } = await supabase
          .from('cached_posts')
          .update({ 
            embedding: embedding,
            embedding_model: 'all-MiniLM-L6-v2',
            embedding_updated_at: new Date().toISOString()
          })
          .eq('id', post.id);
        
        if (updateError) {
          console.error(`  ❌ Error updating post ${post.id}:`, updateError);
        } else {
          console.log(`  ✅ Updated post ${post.id}`);
        }
        
        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.error(`  ❌ Error processing post ${post.id}:`, err);
      }
    }
    
    console.log('✅ Embedding generation complete!');
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateBlogEmbeddings()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

export { generateBlogEmbeddings };