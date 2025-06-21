### Planning Article Generation Improvements

Created a comprehensive plan for improving generated articles with user writing samples in settings.

### Todo List
- [x] Read repository setup instructions (CLAUDE.md) - No CLAUDE.md found
- [x] Analyze current article generation system
- [x] Understand current settings structure  
- [x] Examine regeneration functionality
- [x] Design plan for user writing samples integration
- [x] Create implementation roadmap

### Current System Analysis

After analyzing the codebase, here's what I found:

**Current Generation Flow:**
- User enters PR URL → fetches PR data → uses fixed prompts → generates content
- Regeneration button (`src/components/markdown-editor.tsx:58-72`) simply calls the same generation function with identical parameters
- Uses hardcoded system and user prompts from `src/lib/prompt-utils.ts`

**Current Database Schema:**
- Only has `cached_posts` table for storing generated content
- No user preferences/settings table exists
- No way to store user writing samples or preferences

**Pain Points Identified:**
1. Regeneration produces identical content (as mentioned in the issue)
2. No customization options for writing style
3. No user preferences system
4. Fixed prompting system with no variation

## Comprehensive Implementation Plan

### Phase 1: Database Schema & User Preferences

**1. Create User Settings Table**
```sql
CREATE TABLE user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  writing_samples text[], -- Array of user writing samples
  preferred_tone varchar(50) DEFAULT 'professional', -- casual, professional, technical
  preferred_length varchar(50) DEFAULT 'medium', -- short, medium, long
  custom_instructions text, -- Additional user instructions
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
```

**2. Create Regeneration Presets Table**
```sql
CREATE TABLE regeneration_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  description text,
  system_prompt_modifier text,
  user_prompt_modifier text,
  temperature decimal(3,2) DEFAULT 0.7,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

### Phase 2: Settings UI Components

**1. User Settings Page** (`src/pages/Settings.tsx`)
- Writing samples management (add/edit/delete samples)
- Tone and length preferences
- Custom instructions field
- Preview how samples affect generation

**2. Enhanced Regeneration Options** (Dropdown in `markdown-editor.tsx`)
- "Regenerate with different tone" (casual, professional, technical)
- "Regenerate shorter/longer version"
- "Regenerate with my writing style" (uses samples)
- "Custom regeneration" (modal with prompt input)

### Phase 3: Enhanced Prompt System

**1. Dynamic Prompt Builder** (`src/lib/enhanced-prompt-utils.ts`)
- Incorporate user writing samples into system prompt
- Apply tone and length preferences
- Support for regeneration variations
- Style analysis from writing samples

**2. Regeneration Strategies**
- **Style-based**: Analyze user samples for tone, structure, vocabulary
- **Variation-based**: Use different angles (technical focus, business impact, tutorial style)
- **Length-based**: Generate condensed or expanded versions
- **Custom**: User-provided instructions for specific regeneration

### Phase 4: Smart Regeneration Features

**1. Writing Style Analysis**
```typescript
interface WritingStyle {
  tone: 'casual' | 'professional' | 'technical';
  avgSentenceLength: number;
  vocabularyLevel: 'simple' | 'intermediate' | 'advanced';
  structurePreference: 'narrative' | 'structured' | 'tutorial';
  codeExampleStyle: 'minimal' | 'detailed' | 'annotated';
}
```

**2. Intelligent Prompt Augmentation**
- Analyze user's writing samples to extract style patterns
- Generate style-specific instructions for the LLM
- Incorporate user's preferred terminology and explanations
- Adapt code commenting style based on samples

## Detailed Implementation Roadmap

### Step 1: Database Foundation (1-2 days)
1. Create migration for `user_preferences` table
2. Create migration for `regeneration_presets` with default presets
3. Add RLS policies for both tables
4. Update Supabase types

### Step 2: Basic Settings Infrastructure (2-3 days)
1. Create Settings page route and navigation
2. Build writing samples CRUD interface
3. Add tone/length preference selectors
4. Create custom instructions textarea
5. Add settings save/load functionality

### Step 3: Enhanced Regeneration UI (2-3 days)
1. Replace simple regenerate button with dropdown menu
2. Add preset regeneration options ("More casual", "More technical", etc.)
3. Create custom regeneration modal
4. Add loading states and error handling

### Step 4: Intelligent Prompt System (3-4 days)
1. Create writing style analysis functions
2. Build dynamic prompt generation system
3. Implement user sample integration into prompts
4. Add regeneration strategy logic
5. Create prompt preview functionality

### Step 5: Advanced Features (2-3 days)
1. Add writing sample analysis (tone detection, structure analysis)
2. Implement smart regeneration suggestions
3. Add regeneration history tracking
4. Create A/B testing for different regeneration approaches

### Step 6: Testing & Polish (1-2 days)
1. Add comprehensive tests for new functionality
2. UI/UX polish and responsive design
3. Error handling and edge cases
4. Performance optimization