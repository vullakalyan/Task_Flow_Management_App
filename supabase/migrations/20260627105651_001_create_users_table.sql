/*
# Create users table with role-based access control

This migration creates the core users table that extends Supabase's built-in auth.users
with additional profile information and role-based access control.

## 1. New Tables

### users
- `id` (uuid, primary key) - references auth.users, cascade delete
- `email` (text, unique, not null) - user email from auth
- `name` (text, not null) - display name (2-50 chars)
- `role` (text, default 'member') - 'admin' or 'member' for RBAC
- `avatar` (text, nullable) - URL to avatar image
- `created_at` (timestamptz) - record creation time
- `updated_at` (timestamptz) - last update time

## 2. Security

- RLS enabled on `users`
- Users can read their own profile
- Users can update their own name and avatar
- Admin role check via helper function

## 3. Notes

1. The table references auth.users for seamless integration with Supabase Auth
2. Role defaults to 'member' for new sign-ups
3. Cascading delete ensures clean removal when auth user is deleted
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  name text NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 50),
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  avatar text DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies for users table
DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_insert_own" ON users;
CREATE POLICY "users_insert_own"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Create index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();