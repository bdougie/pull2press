import { PullRequestData } from './prompt-utils';

export interface WritingStyle {
  tone: 'casual' | 'professional' | 'technical';
  avgSentenceLength: number;
  vocabularyLevel: 'simple' | 'intermediate' | 'advanced';
  structurePreference: 'narrative' | 'structured' | 'tutorial';
  codeExampleStyle: 'minimal' | 'detailed' | 'annotated';
}

export interface UserPreferences {
  id: string;
  user_id: string;
  writing_samples: string[];
  preferred_tone: 'casual' | 'professional' | 'technical';
  preferred_length: 'short' | 'medium' | 'long';
  custom_instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface RegenerationPreset {
  id: string;
  name: string;
  description: string;
  system_prompt_modifier: string;
  user_prompt_modifier: string;
  temperature: number;
  is_default: boolean;
  created_at: string;
}

export interface RegenerationOptions {
  type: 'preset' | 'custom' | 'user_style';
  preset?: RegenerationPreset;
  customPrompt?: string;
  userPreferences?: UserPreferences;
  temperature?: number;
}

// Analyze writing style from user samples
export function analyzeWritingStyle(writingSamples: string[]): WritingStyle {
  if (writingSamples.length === 0) {
    return {
      tone: 'professional',
      avgSentenceLength: 20,
      vocabularyLevel: 'intermediate',
      structurePreference: 'structured',
      codeExampleStyle: 'detailed'
    };
  }

  const combinedText = writingSamples.join('\n');
  const sentences = combinedText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = combinedText.split(/\s+/).filter(w => w.length > 0);
  
  // Calculate average sentence length
  const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 20;
  
  // Detect tone based on common patterns
  const casualMarkers = /\b(gonna|wanna|kinda|sorta|hey|awesome|cool|stuff)\b/gi;
  const technicalMarkers = /\b(implementation|architecture|algorithm|optimization|refactor|middleware|abstraction)\b/gi;
  const casualCount = (combinedText.match(casualMarkers) || []).length;
  const technicalCount = (combinedText.match(technicalMarkers) || []).length;
  
  let tone: 'casual' | 'professional' | 'technical' = 'professional';
  if (casualCount > technicalCount && casualCount > 3) {
    tone = 'casual';
  } else if (technicalCount > casualCount && technicalCount > 3) {
    tone = 'technical';
  }
  
  // Detect vocabulary level based on word complexity
  const complexWords = words.filter(word => word.length > 8).length;
  const vocabularyLevel = complexWords / words.length > 0.15 ? 'advanced' : 
                         complexWords / words.length > 0.08 ? 'intermediate' : 'simple';
  
  // Detect structure preference
  const hasNumberedLists = /^\d+\./gm.test(combinedText);
  const hasBulletPoints = /^[-*+]/gm.test(combinedText);
  const hasStepWords = /\b(first|second|then|next|finally|step|begin by)\b/gi.test(combinedText);
  
  let structurePreference: 'narrative' | 'structured' | 'tutorial' = 'narrative';
  if (hasStepWords || hasNumberedLists) {
    structurePreference = 'tutorial';
  } else if (hasBulletPoints || /^#{1,6}\s/gm.test(combinedText)) {
    structurePreference = 'structured';
  }
  
  // Detect code example style
  const codeBlocks = (combinedText.match(/```[\s\S]*?```/g) || []).length;
  const inlineCode = (combinedText.match(/`[^`]+`/g) || []).length;
  const codeComments = (combinedText.match(/\/\/.*|\/\*[\s\S]*?\*\//g) || []).length;
  
  let codeExampleStyle: 'minimal' | 'detailed' | 'annotated' = 'detailed';
  if (codeComments > codeBlocks) {
    codeExampleStyle = 'annotated';
  } else if (inlineCode > codeBlocks * 2) {
    codeExampleStyle = 'minimal';
  }
  
  return {
    tone,
    avgSentenceLength,
    vocabularyLevel,
    structurePreference,
    codeExampleStyle
  };
}

// Generate style-specific system prompt additions
export function generateStylePrompt(style: WritingStyle): string {
  let stylePrompt = '';
  
  // Tone adjustments
  switch (style.tone) {
    case 'casual':
      stylePrompt += 'Use a casual, conversational tone. Write as if explaining to a friend or colleague. Use contractions and speak directly to the reader. ';
      break;
    case 'technical':
      stylePrompt += 'Use precise technical language and focus on implementation details, architectural decisions, and technical concepts. ';
      break;
    default:
      stylePrompt += 'Maintain a professional but approachable tone. ';
  }
  
  // Sentence length preferences
  if (style.avgSentenceLength < 15) {
    stylePrompt += 'Keep sentences concise and punchy. ';
  } else if (style.avgSentenceLength > 25) {
    stylePrompt += 'Use more detailed, comprehensive sentences with thorough explanations. ';
  }
  
  // Vocabulary level
  switch (style.vocabularyLevel) {
    case 'simple':
      stylePrompt += 'Use clear, simple language that\'s accessible to developers of all levels. ';
      break;
    case 'advanced':
      stylePrompt += 'Use sophisticated technical vocabulary and assume familiarity with advanced concepts. ';
      break;
    default:
      stylePrompt += 'Use intermediate-level technical vocabulary with explanations for complex concepts. ';
  }
  
  // Structure preferences
  switch (style.structurePreference) {
    case 'tutorial':
      stylePrompt += 'Structure the content as a step-by-step guide with clear progression. ';
      break;
    case 'structured':
      stylePrompt += 'Use clear headings, bullet points, and well-organized sections. ';
      break;
    default:
      stylePrompt += 'Write in a narrative flow that tells the story of the changes. ';
  }
  
  // Code example style
  switch (style.codeExampleStyle) {
    case 'minimal':
      stylePrompt += 'Include concise code snippets that focus on key changes. ';
      break;
    case 'annotated':
      stylePrompt += 'Provide detailed code examples with comprehensive comments and explanations. ';
      break;
    default:
      stylePrompt += 'Include relevant code examples with appropriate context. ';
  }
  
  return stylePrompt.trim();
}

// Build enhanced system prompt with user preferences
export function buildEnhancedSystemPrompt(
  userPreferences?: UserPreferences,
  regenerationOptions?: RegenerationOptions
): string {
  let systemPrompt = `You are a software engineer writing about your own work. Write in first person throughout the entire post ("I implemented", "I discovered", "I chose", etc.). Your tone should be pragmatic and informative - focus on technical details, implementation decisions, and practical insights.`;
  
  // Apply regeneration preset modifications
  if (regenerationOptions?.preset?.system_prompt_modifier) {
    systemPrompt += `\n\n${regenerationOptions.preset.system_prompt_modifier}`;
  }
  
  // Apply user style preferences
  if (userPreferences && userPreferences.writing_samples.length > 0) {
    const style = analyzeWritingStyle(userPreferences.writing_samples);
    const stylePrompt = generateStylePrompt(style);
    systemPrompt += `\n\nAdapt your writing style to match the user's preferences: ${stylePrompt}`;
  } else if (userPreferences) {
    // Use basic preferences if no samples available
    systemPrompt += `\n\nWrite in a ${userPreferences.preferred_tone} tone with ${userPreferences.preferred_length} length content.`;
  }
  
  // Apply custom instructions
  if (userPreferences?.custom_instructions) {
    systemPrompt += `\n\nAdditional user instructions: ${userPreferences.custom_instructions}`;
  }
  
  systemPrompt += `\n\nWhen writing:
- Write exclusively in first person - you are the developer who made these changes
- Be pragmatic and informative - focus on what was done and why
- Share technical insights and implementation details
- Explain your reasoning for architectural and design decisions
- Include relevant code snippets that demonstrate key changes
- Structure content with clear, descriptive headings
- Discuss challenges encountered and how you solved them
- End with practical takeaways and lessons learned`;
  
  return systemPrompt;
}

// Build enhanced user prompt with regeneration options
export function buildEnhancedUserPrompt(
  prData: PullRequestData,
  regenerationOptions?: RegenerationOptions
): string {
  let userPrompt = `Write a detailed technical blog post about the following GitHub pull request:

Title: ${prData.title}
Description: ${prData.description}

Changes:
- Number of commits: ${prData.commits.length}
- Number of files modified: ${prData.files.length}

Commit messages:
${prData.commits.map((commit) => `- ${commit.message}`).join('\n')}

Files changed:
${prData.files.map((file) => `- ${file.filename} (${file.additions} additions, ${file.deletions} deletions)`).join('\n')}`;
  
  // Apply preset modifications
  if (regenerationOptions?.preset?.user_prompt_modifier) {
    userPrompt += `\n\n${regenerationOptions.preset.user_prompt_modifier}`;
  } else if (regenerationOptions?.customPrompt) {
    userPrompt += `\n\n${regenerationOptions.customPrompt}`;
  } else {
    userPrompt += `\n\nPlease write a comprehensive blog post that:
1. Explains the purpose and context of these changes
2. Discusses the technical implementation details
3. Highlights any important code changes
4. Includes relevant code examples where appropriate
5. Concludes with the impact and benefits of these changes`;
  }
  
  userPrompt += `\n\nUse a professional but engaging tone and format the post in Markdown.`;
  
  return userPrompt;
}

// Get temperature based on regeneration options
export function getTemperature(regenerationOptions?: RegenerationOptions): number {
  if (regenerationOptions?.temperature !== undefined) {
    return regenerationOptions.temperature;
  }
  if (regenerationOptions?.preset?.temperature !== undefined) {
    return regenerationOptions.preset.temperature;
  }
  return 0.7; // default
}