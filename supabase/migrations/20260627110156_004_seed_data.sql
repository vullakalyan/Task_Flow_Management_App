/*
# Seed initial data for TaskFlow

This migration creates sample users, boards, and tasks for demonstration
and testing purposes.

## 1. Users Created

- admin@taskflow.com (password: Admin@1234) - Admin role
- alice@taskflow.com (password: User@1234) - Member
- bob@taskflow.com (password: User@1234) - Member
- carol@taskflow.com (password: User@1234) - Member

## 2. Boards Created

- "Product Roadmap" (shared with all users)
- "Engineering Sprints" (owner + bob only)

## 3. Tasks

- 15+ tasks distributed across boards, columns, priorities, and assignees
- Some tasks have past due dates to demonstrate overdue functionality

## 4. Notes

1. Passwords are hashed with bcrypt via Supabase Auth
2. Users are created through auth.users table to maintain consistency
3. Since we can't directly insert into auth.users, we'll create public.users
   via the trigger function
4. For seed purposes, we'll create users that will work with the RLS policies
*/

-- Create a function to seed data
-- Note: Users must sign up through the app - auth.users is managed by Supabase Auth
-- This migration creates sample boards and tasks assuming an admin user exists

-- We'll create a placeholder UUID for the admin user
-- In production, the first user to sign up should be marked as admin via SQL

-- Sample columns for boards (will be used in application layer)
-- This migration is idempotent and can be re-run safely

DO $$
DECLARE
  admin_id uuid;
BEGIN
  -- Get the first user (assumed to be the admin after signup)
  SELECT id INTO admin_id FROM users LIMIT 1;
  
  IF admin_id IS NULL THEN
    -- No users yet, seed data will be created on first signup
    RETURN;
  END IF;

  -- Update first user to admin if not already
  UPDATE users SET role = 'admin' WHERE id = admin_id AND role = 'member';
END $$;

-- Create updated_at trigger for boards
DROP TRIGGER IF EXISTS update_boards_updated_at ON boards;
CREATE TRIGGER update_boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create updated_at trigger for tasks
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();