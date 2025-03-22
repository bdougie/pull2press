/*
  # Create cached_posts table with user authentication

  1. New Tables
    - `cached_posts`
      - `id` (uuid, primary key)
      - `pr_url` (text)
      - `title` (text)
      - `content` (text)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `cached_posts` table
    - Add policies for authenticated users to manage their own posts
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS cached_posts;

-- Create the table with proper user_id reference
CREATE TABLE cached_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_url text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(pr_url, user_id),
  CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES auth.users (id)
    ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE cached_posts ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own posts
CREATE POLICY "Users can read own posts"
  ON cached_posts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to insert their own posts
CREATE POLICY "Users can insert own posts"
  ON cached_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own posts
CREATE POLICY "Users can update own posts"
  ON cached_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);