/*
# Create tasks table for Kanban task cards

This migration creates the tasks table that stores individual task cards
within Kanban boards, including priority, status, assignments, and due dates.

## 1. New Tables

### tasks
- `id` (uuid, primary key) - auto-generated
- `title` (text, not null) - task title (1-200 chars)
- `description` (text, max 2000 chars) - detailed task description
- `priority` (text, default 'medium') - 'low', 'medium', 'high', 'critical'
- `status` (text, default 'todo') - 'todo', 'in_progress', 'review', 'done'
- `due_date` (timestamptz, nullable) - optional due date
- `board_id` (uuid, not null) - references boards, cascade delete
- `column_id` (text, not null) - references a column id in board.columns
- `assignee_id` (uuid, nullable) - references users
- `created_by` (uuid, not null) - user who created the task
- `order` (integer, not null) - position within column
- `tags` (text array) - array of tag strings for organization
- `is_archived` (boolean, default false) - soft delete flag
- `created_at` (timestamptz) - record creation time
- `updated_at` (timestamptz) - last update time

## 2. Security

- RLS enabled on `tasks`
- Board members can read/write tasks in their boards
- Admins have full access
- Tasks inherit access from their parent board

## 3. Notes

1. column_id references the id within board.columns JSONB array
2. Order determines vertical position within a column
3. Tags are stored as a simple text array
4. Cascade delete ensures tasks are removed when board is deleted
*/

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  description text DEFAULT '' CHECK (char_length(description) <= 2000),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  due_date timestamptz DEFAULT NULL,
  board_id uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  column_id text NOT NULL,
  assignee_id uuid DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "order" integer NOT NULL DEFAULT 0,
  tags text[] NOT NULL DEFAULT '{}',
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user has access to a task's board
CREATE OR REPLACE FUNCTION has_task_board_access(task_row tasks)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM boards 
    WHERE id = task_row.board_id
    AND (
      is_admin()
      OR owner_id = auth.uid()
      OR members @> ARRAY[auth.uid()]
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Select policy: users can read tasks in boards they have access to
DROP POLICY IF EXISTS "tasks_select_board_access" ON tasks;
CREATE POLICY "tasks_select_board_access"
ON tasks FOR SELECT
TO authenticated
USING (has_task_board_access(tasks));

-- Insert policy: board members can create tasks
DROP POLICY IF EXISTS "tasks_insert_board_member" ON tasks;
CREATE POLICY "tasks_insert_board_member"
ON tasks FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM boards
    WHERE id = board_id
    AND (
      is_admin()
      OR owner_id = auth.uid()
      OR members @> ARRAY[auth.uid()]
    )
  )
);

-- Update policy: board members can update tasks
DROP POLICY IF EXISTS "tasks_update_board_member" ON tasks;
CREATE POLICY "tasks_update_board_member"
ON tasks FOR UPDATE
TO authenticated
USING (has_task_board_access(tasks))
WITH CHECK (has_task_board_access(tasks));

-- Delete policy: board owner/creator or admin can delete
DROP POLICY IF EXISTS "tasks_delete_board_member" ON tasks;
CREATE POLICY "tasks_delete_board_member"
ON tasks FOR DELETE
TO authenticated
USING (
  is_admin()
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM boards
    WHERE id = board_id AND owner_id = auth.uid()
  )
  OR has_task_board_access(tasks)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_board_id ON tasks(board_id);
CREATE INDEX IF NOT EXISTS idx_tasks_column_id ON tasks(board_id, column_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_order ON tasks(board_id, column_id, "order");
CREATE INDEX IF NOT EXISTS idx_tasks_is_archived ON tasks(is_archived);
CREATE INDEX IF NOT EXISTS idx_tasks_tags ON tasks USING GIN(tags);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();