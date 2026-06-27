/*
# Create boards table for Kanban boards

This migration creates the boards table that stores Kanban boards with their
column configurations and member access control.

## 1. New Tables

### boards
- `id` (uuid, primary key) - auto-generated
- `title` (text, not null) - board title (1-100 chars)
- `description` (text, max 500 chars) - optional board description
- `owner_id` (uuid, not null) - references users table, defaults to auth.uid()
- `members` (uuid array) - array of user IDs who have access
- `columns` (jsonb, not null) - column definitions with id, title, order, color
- `is_archived` (boolean, default false) - soft delete flag
- `created_at` (timestamptz) - record creation time
- `updated_at` (timestamptz) - last update time

## 2. Column Structure (JSONB)

Each column in the columns array contains:
- id: uuid string
- title: display name
- order: numeric position
- color: hex color for column header

## 3. Security

- RLS enabled on `boards`
- Users can read boards they own or are members of
- Users can create new boards (become owner)
- Only owners can update/delete their boards
- Admins have full access via helper function

## 4. Notes

1. Default columns are created by the application layer
2. Members array allows for collaborative access
3. Owner defaults to the authenticated user creating the board
*/

CREATE TABLE IF NOT EXISTS boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 100),
  description text DEFAULT '' CHECK (char_length(description) <= 500),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES users(id) ON DELETE CASCADE,
  members uuid[] NOT NULL DEFAULT '{}',
  columns jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function to check board access
CREATE OR REPLACE FUNCTION has_board_access(board_row boards)
RETURNS boolean AS $$
BEGIN
  RETURN is_admin() 
    OR board_row.owner_id = auth.uid()
    OR board_row.members @> ARRAY[auth.uid()];
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Select policy: users can read boards they have access to
DROP POLICY IF EXISTS "boards_select_access" ON boards;
CREATE POLICY "boards_select_access"
ON boards FOR SELECT
TO authenticated
USING (
  is_admin() 
  OR owner_id = auth.uid()
  OR members @> ARRAY[auth.uid()]
);

-- Insert policy: any authenticated user can create boards
DROP POLICY IF EXISTS "boards_insert_authenticated" ON boards;
CREATE POLICY "boards_insert_authenticated"
ON boards FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Update policy: only owner (or admin) can update
DROP POLICY IF EXISTS "boards_update_owner" ON boards;
CREATE POLICY "boards_update_owner"
ON boards FOR UPDATE
TO authenticated
USING (is_admin() OR owner_id = auth.uid())
WITH CHECK (is_admin() OR owner_id = auth.uid());

-- Delete policy: only owner (or admin) can delete
DROP POLICY IF EXISTS "boards_delete_owner" ON boards;
CREATE POLICY "boards_delete_owner"
ON boards FOR DELETE
TO authenticated
USING (is_admin() OR owner_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_boards_owner ON boards(owner_id);
CREATE INDEX IF NOT EXISTS idx_boards_is_archived ON boards(is_archived);
CREATE INDEX IF NOT EXISTS idx_boards_members ON boards USING GIN(members);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_boards_updated_at ON boards;
CREATE TRIGGER update_boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();