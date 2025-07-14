/*
  # Add regeneration history tracking

  1. New Tables
    - `regeneration_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `post_id` (uuid, references cached_posts)
      - `content` (text) - The generated content
      - `regeneration_type` (varchar) - Type of regeneration (preset, custom, user_style)
      - `preset_used` (varchar) - Name of preset if used
      - `custom_prompt` (text) - Custom prompt if used
      - `user_preferences_snapshot` (jsonb) - Snapshot of user preferences at time of generation
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for authenticated users to manage their own history
*/

-- Create regeneration_history table
CREATE TABLE IF NOT EXISTS regeneration_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  post_id uuid REFERENCES cached_posts NOT NULL,
  content text NOT NULL,
  regeneration_type varchar(50) NOT NULL CHECK (regeneration_type IN ('preset', 'custom', 'user_style')),
  preset_used varchar(100),
  custom_prompt text,
  user_preferences_snapshot jsonb,
  created_at timestamptz DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX regeneration_history_user_post_idx ON regeneration_history(user_id, post_id);
CREATE INDEX regeneration_history_created_idx ON regeneration_history(created_at DESC);

-- Enable RLS
ALTER TABLE regeneration_history ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own regeneration history
CREATE POLICY "Users can read own regeneration history"
  ON regeneration_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to insert their own regeneration history
CREATE POLICY "Users can insert own regeneration history"
  ON regeneration_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own regeneration history
CREATE POLICY "Users can delete own regeneration history"
  ON regeneration_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add a trigger to limit history entries per post (keep last 10)
CREATE OR REPLACE FUNCTION limit_regeneration_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete old entries if we have more than 10 for this post
  DELETE FROM regeneration_history
  WHERE id IN (
    SELECT id FROM regeneration_history
    WHERE user_id = NEW.user_id AND post_id = NEW.post_id
    ORDER BY created_at DESC
    OFFSET 10
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER limit_regeneration_history_trigger
  AFTER INSERT ON regeneration_history
  FOR EACH ROW
  EXECUTE FUNCTION limit_regeneration_history();