/*
  # Create user_preferences and regeneration_presets tables

  1. New Tables
    - `user_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `writing_samples` (text array)
      - `preferred_tone` (varchar)
      - `preferred_length` (varchar)
      - `custom_instructions` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `regeneration_presets`
      - `id` (uuid, primary key)
      - `name` (varchar)
      - `description` (text)
      - `system_prompt_modifier` (text)
      - `user_prompt_modifier` (text)
      - `temperature` (decimal)
      - `is_default` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  writing_samples text[] DEFAULT '{}',
  preferred_tone varchar(50) DEFAULT 'professional',
  preferred_length varchar(50) DEFAULT 'medium',
  custom_instructions text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create regeneration_presets table
CREATE TABLE IF NOT EXISTS regeneration_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  description text,
  system_prompt_modifier text,
  user_prompt_modifier text,
  temperature decimal(3,2) DEFAULT 0.7,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own preferences
CREATE POLICY "Users can read own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to insert their own preferences
CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own preferences
CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own preferences
CREATE POLICY "Users can delete own preferences"
  ON user_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable RLS on regeneration_presets
ALTER TABLE regeneration_presets ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read presets
CREATE POLICY "Authenticated users can read presets"
  ON regeneration_presets
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert default regeneration presets
INSERT INTO regeneration_presets (name, description, system_prompt_modifier, user_prompt_modifier, is_default) VALUES
('More Casual', 'Make the content more conversational and approachable', 'Write in a casual, conversational tone. Use contractions and speak directly to the reader as if explaining to a colleague.', 'Rewrite this to be more casual and conversational while maintaining technical accuracy.', true),
('More Technical', 'Increase technical depth and detail', 'Focus on technical implementation details, architectural decisions, and deep technical concepts. Use precise technical terminology.', 'Rewrite this with more technical depth, focusing on implementation details and architectural considerations.', true),
('Shorter Version', 'Create a concise, condensed version', 'Create a concise version that captures the key points without sacrificing important technical details.', 'Rewrite this as a shorter, more concise version while keeping the essential technical information.', true),
('Longer Version', 'Expand with more detail and context', 'Expand the content with more detailed explanations, additional context, and comprehensive coverage of the topic.', 'Rewrite this as a longer, more detailed version with expanded explanations and additional context.', true),
('Tutorial Style', 'Structure as a step-by-step tutorial', 'Write in a tutorial format with clear steps, code examples, and explanations that guide the reader through the process.', 'Rewrite this as a step-by-step tutorial that guides readers through understanding and implementing these changes.', true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_preferences updated_at
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();