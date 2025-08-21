import { describe, it, expect } from 'vitest';
import {
  analyzeWritingStyle,
  generateStylePrompt,
  buildEnhancedSystemPrompt,
  buildEnhancedUserPrompt,
  getTemperature,
  type WritingStyle,
  type UserPreferences,
  type RegenerationPreset,
  type RegenerationOptions,
} from './enhanced-prompt-utils';
import type { PullRequestData } from './prompt-utils';

describe('analyzeWritingStyle', () => {
  it('should return default style for empty samples', () => {
    const result = analyzeWritingStyle([]);
    expect(result).toEqual({
      tone: 'professional',
      avgSentenceLength: 20,
      vocabularyLevel: 'intermediate',
      structurePreference: 'structured',
      codeExampleStyle: 'detailed'
    });
  });

  it('should detect casual tone from writing samples', () => {
    const samples = [
      "Hey folks! Gonna show you this awesome feature I built. It's pretty cool stuff.",
      "So I was thinking, hey, why not make this thing work better? Kinda makes sense, right?",
      "Wanna see something cool? Check out this implementation!",
      "This is gonna be awesome when we ship it!"
    ];
    const result = analyzeWritingStyle(samples);
    expect(result.tone).toBe('casual');
  });

  it('should detect technical tone from writing samples', () => {
    const samples = [
      "The implementation leverages a middleware architecture for optimal abstraction.",
      "This refactoring optimizes the algorithm through improved data structures.",
      "The architecture employs a microservices pattern with event-driven communication.",
      "Performance optimization was achieved through algorithmic improvements."
    ];
    const result = analyzeWritingStyle(samples);
    expect(result.tone).toBe('technical');
  });

  it('should calculate average sentence length correctly', () => {
    const samples = [
      "This is short. Very short. Tiny sentences.",
      "Quick and punchy. Direct communication. No fluff."
    ];
    const result = analyzeWritingStyle(samples);
    expect(result.avgSentenceLength).toBeLessThan(10);
  });

  it('should detect vocabulary level', () => {
    const simpleText = ["This is easy to read. Simple words here. Nothing complex."];
    const advancedText = [
      "The heterogeneous implementation demonstrates polymorphic characteristics through abstraction layers."
    ];
    
    const simpleResult = analyzeWritingStyle(simpleText);
    const advancedResult = analyzeWritingStyle(advancedText);
    
    expect(simpleResult.vocabularyLevel).toBe('simple');
    expect(advancedResult.vocabularyLevel).toBe('advanced');
  });

  it('should detect tutorial structure preference', () => {
    const samples = [
      "First, let's set up our environment. Next, we'll configure the database. Then, implement the feature. Finally, test everything.",
      "Step 1: Install dependencies. Step 2: Configure settings. Step 3: Run the application."
    ];
    const result = analyzeWritingStyle(samples);
    expect(result.structurePreference).toBe('tutorial');
  });

  it('should detect structured preference with markdown', () => {
    const samples = [
      `## Introduction
      This is the intro section.
      
      ## Implementation
      - Point one
      - Point two
      - Point three
      
      ## Conclusion`
    ];
    const result = analyzeWritingStyle(samples);
    expect(result.structurePreference).toBe('structured');
  });

  it('should detect code example style', () => {
    const minimalCode = ["Use `Array.map()` for transformation and `filter()` for filtering."];
    const annotatedCode = [
      `\`\`\`javascript
      // This function handles user authentication
      function authenticate(user) {
        // First, validate the credentials
        if (!user.email) return false;
        // Then check the password
        return validatePassword(user.password);
      }
      \`\`\``
    ];
    
    const minimalResult = analyzeWritingStyle(minimalCode);
    const annotatedResult = analyzeWritingStyle(annotatedCode);
    
    expect(minimalResult.codeExampleStyle).toBe('minimal');
    expect(annotatedResult.codeExampleStyle).toBe('annotated');
  });
});

describe('generateStylePrompt', () => {
  it('should generate casual tone prompt', () => {
    const style: WritingStyle = {
      tone: 'casual',
      avgSentenceLength: 15,
      vocabularyLevel: 'simple',
      structurePreference: 'narrative',
      codeExampleStyle: 'minimal'
    };
    const prompt = generateStylePrompt(style);
    expect(prompt).toContain('casual, conversational tone');
    expect(prompt).toContain('clear, simple language');
  });

  it('should generate technical tone prompt', () => {
    const style: WritingStyle = {
      tone: 'technical',
      avgSentenceLength: 25,
      vocabularyLevel: 'advanced',
      structurePreference: 'structured',
      codeExampleStyle: 'annotated'
    };
    const prompt = generateStylePrompt(style);
    expect(prompt).toContain('precise technical language');
    expect(prompt).toContain('sophisticated technical vocabulary');
  });

  it('should handle sentence length preferences', () => {
    const shortStyle: WritingStyle = {
      tone: 'professional',
      avgSentenceLength: 10,
      vocabularyLevel: 'intermediate',
      structurePreference: 'narrative',
      codeExampleStyle: 'detailed'
    };
    const longStyle: WritingStyle = {
      ...shortStyle,
      avgSentenceLength: 30
    };
    
    const shortPrompt = generateStylePrompt(shortStyle);
    const longPrompt = generateStylePrompt(longStyle);
    
    expect(shortPrompt).toContain('concise and punchy');
    expect(longPrompt).toContain('detailed, comprehensive sentences');
  });
});

describe('buildEnhancedSystemPrompt', () => {
  it('should build basic system prompt without user preferences', () => {
    const prompt = buildEnhancedSystemPrompt();
    expect(prompt).toContain('software engineer writing about your own work');
    expect(prompt).toContain('first person');
    expect(prompt).not.toContain('user\'s preferences');
  });

  it('should incorporate user preferences into system prompt', () => {
    const userPreferences: UserPreferences = {
      id: '123',
      user_id: 'user123',
      writing_samples: ['Sample text here'],
      preferred_tone: 'casual',
      preferred_length: 'short',
      custom_instructions: 'Always include emojis',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const prompt = buildEnhancedSystemPrompt(userPreferences);
    expect(prompt).toContain('user\'s preferences');
    expect(prompt).toContain('Always include emojis');
  });

  it('should add preset modifiers to system prompt', () => {
    const preset: RegenerationPreset = {
      id: '456',
      name: 'More Technical',
      description: 'Technical focus',
      system_prompt_modifier: 'Focus heavily on technical implementation details.',
      user_prompt_modifier: '',
      temperature: 0.8,
      is_default: true,
      created_at: new Date().toISOString()
    };
    
    const regenerationOptions: RegenerationOptions = {
      type: 'preset',
      preset: preset
    };
    
    const prompt = buildEnhancedSystemPrompt(undefined, regenerationOptions);
    expect(prompt).toContain('Focus heavily on technical implementation details');
  });
});

describe('buildEnhancedUserPrompt', () => {
  const mockPRData: PullRequestData = {
    title: 'Add new feature',
    description: 'This PR adds a new feature',
    commits: [
      { message: 'Initial implementation', sha: 'abc123', url: 'https://github.com/owner/repo/commit/abc123' },
      { message: 'Add tests', sha: 'def456', url: 'https://github.com/owner/repo/commit/def456' }
    ],
    files: [
      { filename: 'src/feature.ts', additions: 50, deletions: 10, status: 'modified' }
    ]
  };

  it('should build basic user prompt', () => {
    const prompt = buildEnhancedUserPrompt(mockPRData);
    expect(prompt).toContain('Add new feature');
    expect(prompt).toContain('This PR adds a new feature');
    expect(prompt).toContain('Initial implementation');
    expect(prompt).toContain('src/feature.ts');
  });

  it('should apply preset modifications', () => {
    const regenerationOptions: RegenerationOptions = {
      type: 'preset',
      preset: {
        id: '789',
        name: 'Shorter Version',
        description: 'Concise version',
        system_prompt_modifier: '',
        user_prompt_modifier: 'Make this much shorter and more concise.',
        temperature: 0.5,
        is_default: true,
        created_at: new Date().toISOString()
      }
    };
    
    const prompt = buildEnhancedUserPrompt(mockPRData, regenerationOptions);
    expect(prompt).toContain('Make this much shorter and more concise');
  });

  it('should apply custom prompt modifications', () => {
    const regenerationOptions: RegenerationOptions = {
      type: 'custom',
      customPrompt: 'Focus on security implications of these changes.'
    };
    
    const prompt = buildEnhancedUserPrompt(mockPRData, regenerationOptions);
    expect(prompt).toContain('Focus on security implications');
  });
});

describe('getTemperature', () => {
  it('should return default temperature when no options provided', () => {
    expect(getTemperature()).toBe(0.7);
  });

  it('should return preset temperature when available', () => {
    const options: RegenerationOptions = {
      type: 'preset',
      preset: {
        id: '123',
        name: 'Test',
        description: 'Test preset',
        system_prompt_modifier: '',
        user_prompt_modifier: '',
        temperature: 0.9,
        is_default: false,
        created_at: new Date().toISOString()
      }
    };
    expect(getTemperature(options)).toBe(0.9);
  });

  it('should prioritize explicit temperature over preset', () => {
    const options: RegenerationOptions = {
      type: 'preset',
      temperature: 0.3,
      preset: {
        id: '123',
        name: 'Test',
        description: 'Test preset',
        system_prompt_modifier: '',
        user_prompt_modifier: '',
        temperature: 0.9,
        is_default: false,
        created_at: new Date().toISOString()
      }
    };
    expect(getTemperature(options)).toBe(0.3);
  });
});