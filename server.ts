import express from 'express';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Load env variables
dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'task-flow-mgmt-jwt-secret-key-2026';
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

// Helper to generate unique ID
function generateId() {
  return 'id-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// ----------------- MONGODB CONFIG & SCHEMAS -----------------
let isMongoConnected = false;

const UserSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, default: 'member' },
  avatar: { type: String, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const BoardSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  owner_id: { type: String, required: true },
  members: [{ type: String }],
  columns: [{
    id: { type: String, required: true },
    title: { type: String, required: true },
    order: { type: Number, required: true },
    color: { type: String, required: true }
  }],
  is_archived: { type: Boolean, default: false }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const TaskSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  priority: { type: String, default: 'medium' },
  status: { type: String, default: 'todo' },
  due_date: { type: Date, default: null },
  board_id: { type: String, required: true },
  column_id: { type: String, required: true },
  assignee_id: { type: String, default: null },
  created_by: { type: String, required: true },
  order: { type: Number, default: 0 },
  tags: [{ type: String }],
  is_archived: { type: Boolean, default: false }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const MongoUser = mongoose.model('User', UserSchema);
const MongoBoard = mongoose.model('Board', BoardSchema);
const MongoTask = mongoose.model('Task', TaskSchema);

// ----------------- IN-MEMORY STORE FALLBACK -----------------
const inMemoryStore = {
  users: [] as any[],
  boards: [] as any[],
  tasks: [] as any[]
};

// Seed function for default data
async function seedDefaultData() {
  const defaultUserEmail = 'user@example.com';
  const hashedPassword = await bcrypt.hash('password', 10);
  const defaultUserId = 'mock-user-1';

  const defaultUser = {
    _id: defaultUserId,
    email: defaultUserEmail,
    password: hashedPassword,
    name: 'Alex Rivera',
    role: 'admin',
    avatar: null,
    created_at: new Date(),
    updated_at: new Date()
  };

  const defaultBoardId = 'mock-board-1';
  const defaultBoard = {
    _id: defaultBoardId,
    title: '🚀 Q3 Product Launch',
    description: 'Roadmap and Kanban board for launch marketing, sales alignment, and final feature stabilization.',
    owner_id: defaultUserId,
    members: [defaultUserId],
    columns: [
      { id: 'col-todo', title: 'To Do', order: 0, color: '#64748b' },
      { id: 'col-progress', title: 'In Progress', order: 1, color: '#3b82f6' },
      { id: 'col-review', title: 'In Review', order: 2, color: '#8b5cf6' },
      { id: 'col-done', title: 'Done', order: 3, color: '#22c55e' }
    ],
    is_archived: false,
    created_at: new Date(),
    updated_at: new Date()
  };

  const defaultTasks = [
    {
      _id: 'mock-task-1',
      title: 'Analyze competitor pricing structures',
      description: 'Formulate Q3 marketing package plans by studying high/low pricing tiers of competitor offerings.',
      priority: 'high',
      status: 'todo',
      due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      board_id: defaultBoardId,
      column_id: 'col-todo',
      assignee_id: defaultUserId,
      created_by: defaultUserId,
      order: 0,
      tags: ['Research', 'Marketing'],
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      _id: 'mock-task-2',
      title: 'Draft final landing page wireframes',
      description: 'Design sleek, conversion-oriented mobile and desktop wireframes in Figma.',
      priority: 'medium',
      status: 'in_progress',
      due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      board_id: defaultBoardId,
      column_id: 'col-progress',
      assignee_id: defaultUserId,
      created_by: defaultUserId,
      order: 0,
      tags: ['Design', 'Figma'],
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      _id: 'mock-task-3',
      title: 'Setup continuous integration workflows',
      description: 'Establish automated unit testing, formatting checks, and preview deployment on pull requests.',
      priority: 'critical',
      status: 'review',
      due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Overdue
      board_id: defaultBoardId,
      column_id: 'col-review',
      assignee_id: defaultUserId,
      created_by: defaultUserId,
      order: 0,
      tags: ['DevOps', 'CI/CD'],
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      _id: 'mock-task-4',
      title: 'Incorporate feedback from security audit',
      description: 'Verify proper JWT signature checking on API endpoints and secure password hashing workflows.',
      priority: 'critical',
      status: 'done',
      due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      board_id: defaultBoardId,
      column_id: 'col-done',
      assignee_id: defaultUserId,
      created_by: defaultUserId,
      order: 0,
      tags: ['Security', 'Audit'],
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  if (isMongoConnected) {
    const userCount = await MongoUser.countDocuments();
    if (userCount === 0) {
      console.log('[Server] Seeding default user into MongoDB...');
      await MongoUser.create(defaultUser);
      await MongoBoard.create(defaultBoard);
      await MongoTask.insertMany(defaultTasks);
      console.log('[Server] MongoDB seeding completed!');
    }
  } else {
    if (inMemoryStore.users.length === 0) {
      console.log('[Server] Seeding default user into In-Memory Store...');
      inMemoryStore.users.push(defaultUser);
      inMemoryStore.boards.push(defaultBoard);
      inMemoryStore.tasks.push(...defaultTasks);
      console.log('[Server] In-Memory seeding completed!');
    }
  }
}

// Connect to MongoDB if MONGODB_URI is provided
async function connectToDatabase() {
  if (!MONGODB_URI) {
    console.warn('[Server] WARNING: MONGODB_URI env variable is not set. Falling back to in-memory mode.');
    isMongoConnected = false;
    await seedDefaultData();
    return;
  }

  try {
    console.log('[Server] Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isMongoConnected = true;
    console.log('[Server] Successfully connected to MongoDB Atlas!');
    await seedDefaultData();
  } catch (error) {
    console.error('[Server] Failed to connect to MongoDB Atlas:', error);
    console.warn('[Server] Falling back to In-Memory store for offline/sandbox mode.');
    isMongoConnected = false;
    await seedDefaultData();
  }
}

// Initialize database
connectToDatabase();

// ----------------- AUTHENTICATION MIDDLEWARE -----------------
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
}

// ----------------- API ENDPOINTS -----------------

// Database Status Indicator
app.get('/api/db-status', (req, res) => {
  res.json({
    connected: isMongoConnected,
    type: isMongoConnected ? 'MongoDB Atlas' : 'In-Memory Store (Sandbox)'
  });
});

// Auth Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    let existingUser = null;
    if (isMongoConnected) {
      existingUser = await MongoUser.findOne({ email: normalizedEmail });
    } else {
      existingUser = inMemoryStore.users.find(u => u.email === normalizedEmail);
    }

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateId();

    const newUser = {
      _id: userId,
      email: normalizedEmail,
      password: hashedPassword,
      name,
      role: 'member',
      avatar: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    if (isMongoConnected) {
      await MongoUser.create(newUser);
    } else {
      inMemoryStore.users.push(newUser);
    }

    const token = jwt.sign({ id: userId, email: normalizedEmail }, JWT_SECRET, { expiresIn: '7d' });
    
    // omit password
    const { password: _, ...userWithoutPassword } = newUser;
    const cleanUser = { id: userId, ...userWithoutPassword };

    res.status(201).json({ token, user: cleanUser });
  } catch (error: any) {
    console.error('[Server API] Register error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// Auth Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    let user = null;
    if (isMongoConnected) {
      user = await MongoUser.findOne({ email: normalizedEmail });
    } else {
      user = inMemoryStore.users.find(u => u.email === normalizedEmail);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id || user.id, email: normalizedEmail }, JWT_SECRET, { expiresIn: '7d' });

    const cleanUser = {
      id: user._id || user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    res.json({ token, user: cleanUser });
  } catch (error: any) {
    console.error('[Server API] Login error:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

// Auth Me
app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;

    let user = null;
    if (isMongoConnected) {
      user = await MongoUser.findById(userId);
    } else {
      user = inMemoryStore.users.find(u => u._id === userId || u.id === userId);
    }

    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json({
      id: user._id || user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      created_at: user.created_at,
      updated_at: user.updated_at
    });
  } catch (error: any) {
    console.error('[Server API] Fetch me error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch user' });
  }
});

// Update Profile
app.put('/api/auth/profile', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { name, avatar } = req.body;

    let updatedUser = null;

    if (isMongoConnected) {
      const u = await MongoUser.findById(userId);
      if (!u) return res.status(404).json({ error: 'User not found' });
      if (name !== undefined) u.name = name;
      if (avatar !== undefined) u.avatar = avatar;
      await u.save();
      updatedUser = u;
    } else {
      const idx = inMemoryStore.users.findIndex(u => u._id === userId || u.id === userId);
      if (idx === -1) return res.status(404).json({ error: 'User not found' });
      if (name !== undefined) inMemoryStore.users[idx].name = name;
      if (avatar !== undefined) inMemoryStore.users[idx].avatar = avatar;
      inMemoryStore.users[idx].updated_at = new Date();
      updatedUser = inMemoryStore.users[idx];
    }

    res.json({
      id: updatedUser._id || updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at
    });
  } catch (error: any) {
    console.error('[Server API] Update profile error:', error);
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

// Users
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    let users = [];
    if (isMongoConnected) {
      users = await MongoUser.find({}, '-password').sort({ created_at: -1 });
    } else {
      users = inMemoryStore.users.map(({ password, ...u }) => u);
    }

    const formattedUsers = users.map((u: any) => ({
      id: u._id || u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      avatar: u.avatar,
      created_at: u.created_at,
      updated_at: u.updated_at
    }));

    res.json(formattedUsers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    let user = null;
    if (isMongoConnected) {
      user = await MongoUser.findById(id, '-password');
    } else {
      user = inMemoryStore.users.find(u => u._id === id || u.id === id);
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id || user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      created_at: user.created_at,
      updated_at: user.updated_at
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Boards
app.get('/api/boards', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    let boards = [];

    if (isMongoConnected) {
      // Find boards owned by user OR boards where user is a member
      boards = await MongoBoard.find({
        is_archived: false,
        $or: [
          { owner_id: userId },
          { members: userId }
        ]
      }).sort({ created_at: -1 });
    } else {
      boards = inMemoryStore.boards.filter(b => 
        !b.is_archived && (b.owner_id === userId || (b.members && b.members.includes(userId)))
      );
    }

    const formattedBoards = boards.map((b: any) => ({
      id: b._id || b.id,
      title: b.title,
      description: b.description,
      owner_id: b.owner_id,
      members: b.members || [],
      columns: b.columns || [],
      is_archived: b.is_archived,
      created_at: b.created_at,
      updated_at: b.updated_at
    }));

    res.json(formattedBoards);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/boards/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    let board = null;

    if (isMongoConnected) {
      board = await MongoBoard.findById(id);
    } else {
      board = inMemoryStore.boards.find(b => b._id === id || b.id === id);
    }

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Load owner info
    let owner = null;
    if (isMongoConnected) {
      owner = await MongoUser.findById(board.owner_id, '-password');
    } else {
      owner = inMemoryStore.users.find(u => u._id === board.owner_id || u.id === board.owner_id);
    }

    // Load member profiles
    const memberIds = board.members || [];
    let memberDetails = [];
    if (isMongoConnected) {
      memberDetails = await MongoUser.find({ _id: { $in: memberIds } }, '-password');
    } else {
      memberDetails = inMemoryStore.users.filter(u => memberIds.includes(u._id || u.id));
    }

    const formatUser = (u: any) => u ? ({
      id: u._id || u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      avatar: u.avatar,
      created_at: u.created_at,
      updated_at: u.updated_at
    }) : null;

    res.json({
      id: board._id || board.id,
      title: board.title,
      description: board.description,
      owner_id: board.owner_id,
      members: board.members || [],
      columns: board.columns || [],
      is_archived: board.is_archived,
      created_at: board.created_at,
      updated_at: board.updated_at,
      owner: formatUser(owner),
      memberDetails: memberDetails.map(formatUser)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/boards', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { title, description, members = [] } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const defaultColumns = [
      { id: generateId(), title: 'To Do', order: 0, color: '#64748b' },
      { id: generateId(), title: 'In Progress', order: 1, color: '#3b82f6' },
      { id: generateId(), title: 'Review', order: 2, color: '#8b5cf6' },
      { id: generateId(), title: 'Done', order: 3, color: '#22c55e' }
    ];

    const boardId = generateId();
    const boardMembers = Array.from(new Set([userId, ...members]));

    const newBoard = {
      _id: boardId,
      title,
      description: description || '',
      owner_id: userId,
      members: boardMembers,
      columns: defaultColumns,
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date()
    };

    if (isMongoConnected) {
      await MongoBoard.create(newBoard);
    } else {
      inMemoryStore.boards.push(newBoard);
    }

    res.status(201).json({
      id: boardId,
      ...newBoard,
      _id: undefined
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/boards/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    let updatedBoard = null;

    if (isMongoConnected) {
      const b = await MongoBoard.findById(id);
      if (!b) return res.status(404).json({ error: 'Board not found' });
      
      if (updates.title !== undefined) b.title = updates.title;
      if (updates.description !== undefined) b.description = updates.description;
      if (updates.is_archived !== undefined) b.is_archived = updates.is_archived;
      if (updates.members !== undefined) b.members = updates.members;
      if (updates.columns !== undefined) b.columns = updates.columns;

      await b.save();
      updatedBoard = b;
    } else {
      const idx = inMemoryStore.boards.findIndex(b => b._id === id || b.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Board not found' });

      const b = inMemoryStore.boards[idx];
      if (updates.title !== undefined) b.title = updates.title;
      if (updates.description !== undefined) b.description = updates.description;
      if (updates.is_archived !== undefined) b.is_archived = updates.is_archived;
      if (updates.members !== undefined) b.members = updates.members;
      if (updates.columns !== undefined) b.columns = updates.columns;
      b.updated_at = new Date();

      updatedBoard = b;
    }

    res.json({
      id: updatedBoard._id || updatedBoard.id,
      title: updatedBoard.title,
      description: updatedBoard.description,
      owner_id: updatedBoard.owner_id,
      members: updatedBoard.members || [],
      columns: updatedBoard.columns || [],
      is_archived: updatedBoard.is_archived,
      created_at: updatedBoard.created_at,
      updated_at: updatedBoard.updated_at
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/boards/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected) {
      await MongoBoard.findByIdAndDelete(id);
      await MongoTask.deleteMany({ board_id: id });
    } else {
      inMemoryStore.boards = inMemoryStore.boards.filter(b => b._id !== id && b.id !== id);
      inMemoryStore.tasks = inMemoryStore.tasks.filter(t => t.board_id !== id);
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/boards/:id/columns', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { columns } = req.body;

    if (!columns) return res.status(400).json({ error: 'Columns are required' });

    let updatedBoard = null;
    if (isMongoConnected) {
      const b = await MongoBoard.findById(id);
      if (!b) return res.status(404).json({ error: 'Board not found' });
      b.columns = columns;
      await b.save();
      updatedBoard = b;
    } else {
      const idx = inMemoryStore.boards.findIndex(b => b._id === id || b.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Board not found' });
      inMemoryStore.boards[idx].columns = columns;
      inMemoryStore.boards[idx].updated_at = new Date();
      updatedBoard = inMemoryStore.boards[idx];
    }

    res.json({
      id: updatedBoard._id || updatedBoard.id,
      title: updatedBoard.title,
      description: updatedBoard.description,
      owner_id: updatedBoard.owner_id,
      members: updatedBoard.members || [],
      columns: updatedBoard.columns || [],
      is_archived: updatedBoard.is_archived,
      created_at: updatedBoard.created_at,
      updated_at: updatedBoard.updated_at
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/boards/:id/members', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    let updatedBoard = null;

    if (isMongoConnected) {
      const b = await MongoBoard.findById(id);
      if (!b) return res.status(404).json({ error: 'Board not found' });
      if (b.members.includes(userId)) {
        return res.status(400).json({ error: 'User is already a member' });
      }
      b.members.push(userId);
      await b.save();
      updatedBoard = b;
    } else {
      const idx = inMemoryStore.boards.findIndex(b => b._id === id || b.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Board not found' });
      const b = inMemoryStore.boards[idx];
      if (b.members.includes(userId)) {
        return res.status(400).json({ error: 'User is already a member' });
      }
      b.members.push(userId);
      b.updated_at = new Date();
      updatedBoard = b;
    }

    res.json({
      id: updatedBoard._id || updatedBoard.id,
      title: updatedBoard.title,
      members: updatedBoard.members || []
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/boards/:id/members/:userId', authenticateToken, async (req, res) => {
  try {
    const { id, userId } = req.params;

    let updatedBoard = null;

    if (isMongoConnected) {
      const b = await MongoBoard.findById(id);
      if (!b) return res.status(404).json({ error: 'Board not found' });
      b.members = b.members.filter(m => m !== userId);
      await b.save();
      updatedBoard = b;
    } else {
      const idx = inMemoryStore.boards.findIndex(b => b._id === id || b.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Board not found' });
      const b = inMemoryStore.boards[idx];
      b.members = b.members.filter((m: string) => m !== userId);
      b.updated_at = new Date();
      updatedBoard = b;
    }

    res.json({
      id: updatedBoard._id || updatedBoard.id,
      title: updatedBoard.title,
      members: updatedBoard.members || []
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Tasks
app.get('/api/boards/:boardId/tasks', authenticateToken, async (req, res) => {
  try {
    const { boardId } = req.params;
    let tasks = [];

    if (isMongoConnected) {
      tasks = await MongoTask.find({ board_id: boardId, is_archived: false }).sort({ order: 1 });
    } else {
      tasks = inMemoryStore.tasks.filter(t => (t.board_id === boardId) && !t.is_archived)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    const formattedTasks = tasks.map((t: any) => ({
      id: t._id || t.id,
      title: t.title,
      description: t.description,
      priority: t.priority,
      status: t.status,
      due_date: t.due_date,
      board_id: t.board_id,
      column_id: t.column_id,
      assignee_id: t.assignee_id,
      created_by: t.created_by,
      order: t.order ?? 0,
      tags: t.tags || [],
      is_archived: t.is_archived,
      created_at: t.created_at,
      updated_at: t.updated_at
    }));

    res.json(formattedTasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    let task = null;

    if (isMongoConnected) {
      task = await MongoTask.findById(id);
    } else {
      task = inMemoryStore.tasks.find(t => t._id === id || t.id === id);
    }

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Load assignee and creator info
    let assignee = null;
    let creator = null;

    if (isMongoConnected) {
      if (task.assignee_id) assignee = await MongoUser.findById(task.assignee_id, '-password');
      if (task.created_by) creator = await MongoUser.findById(task.created_by, '-password');
    } else {
      if (task.assignee_id) assignee = inMemoryStore.users.find(u => u._id === task.assignee_id || u.id === task.assignee_id);
      if (task.created_by) creator = inMemoryStore.users.find(u => u._id === task.created_by || u.id === task.created_by);
    }

    const formatUser = (u: any) => u ? ({
      id: u._id || u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      avatar: u.avatar,
      created_at: u.created_at,
      updated_at: u.updated_at
    }) : null;

    res.json({
      id: task._id || task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      due_date: task.due_date,
      board_id: task.board_id,
      column_id: task.column_id,
      assignee_id: task.assignee_id,
      created_by: task.created_by,
      order: task.order ?? 0,
      tags: task.tags || [],
      is_archived: task.is_archived,
      created_at: task.created_at,
      updated_at: task.updated_at,
      assignee: formatUser(assignee),
      creator: formatUser(creator)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const taskData = req.body;

    const taskId = generateId();
    const newTask = {
      _id: taskId,
      title: taskData.title,
      description: taskData.description || '',
      priority: taskData.priority || 'medium',
      status: taskData.status || 'todo',
      due_date: taskData.due_date ? new Date(taskData.due_date) : null,
      board_id: taskData.board_id,
      column_id: taskData.column_id,
      assignee_id: taskData.assignee_id || null,
      created_by: userId,
      order: taskData.order ?? 0,
      tags: taskData.tags || [],
      is_archived: false,
      created_at: new Date(),
      updated_at: new Date()
    };

    if (isMongoConnected) {
      await MongoTask.create(newTask);
    } else {
      inMemoryStore.tasks.push(newTask);
    }

    res.status(201).json({
      id: taskId,
      ...newTask,
      _id: undefined
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    let updatedTask = null;

    if (isMongoConnected) {
      const t = await MongoTask.findById(id);
      if (!t) return res.status(404).json({ error: 'Task not found' });

      if (updates.title !== undefined) t.title = updates.title;
      if (updates.description !== undefined) t.description = updates.description;
      if (updates.priority !== undefined) t.priority = updates.priority;
      if (updates.status !== undefined) t.status = updates.status;
      if (updates.due_date !== undefined) t.due_date = updates.due_date ? new Date(updates.due_date) : null;
      if (updates.column_id !== undefined) t.column_id = updates.column_id;
      if (updates.assignee_id !== undefined) t.assignee_id = updates.assignee_id;
      if (updates.order !== undefined) t.order = updates.order;
      if (updates.tags !== undefined) t.tags = updates.tags;
      if (updates.is_archived !== undefined) t.is_archived = updates.is_archived;

      await t.save();
      updatedTask = t;
    } else {
      const idx = inMemoryStore.tasks.findIndex(t => t._id === id || t.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Task not found' });

      const t = inMemoryStore.tasks[idx];
      if (updates.title !== undefined) t.title = updates.title;
      if (updates.description !== undefined) t.description = updates.description;
      if (updates.priority !== undefined) t.priority = updates.priority;
      if (updates.status !== undefined) t.status = updates.status;
      if (updates.due_date !== undefined) t.due_date = updates.due_date ? new Date(updates.due_date) : null;
      if (updates.column_id !== undefined) t.column_id = updates.column_id;
      if (updates.assignee_id !== undefined) t.assignee_id = updates.assignee_id;
      if (updates.order !== undefined) t.order = updates.order;
      if (updates.tags !== undefined) t.tags = updates.tags;
      if (updates.is_archived !== undefined) t.is_archived = updates.is_archived;
      t.updated_at = new Date();

      updatedTask = t;
    }

    res.json({
      id: updatedTask._id || updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description,
      priority: updatedTask.priority,
      status: updatedTask.status,
      due_date: updatedTask.due_date,
      board_id: updatedTask.board_id,
      column_id: updatedTask.column_id,
      assignee_id: updatedTask.assignee_id,
      created_by: updatedTask.created_by,
      order: updatedTask.order ?? 0,
      tags: updatedTask.tags || [],
      is_archived: updatedTask.is_archived,
      created_at: updatedTask.created_at,
      updated_at: updatedTask.updated_at
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tasks/:id/move', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { column_id, order } = req.body;

    let updatedTask = null;

    if (isMongoConnected) {
      const t = await MongoTask.findById(id);
      if (!t) return res.status(404).json({ error: 'Task not found' });
      t.column_id = column_id;
      t.order = order;
      await t.save();
      updatedTask = t;
    } else {
      const idx = inMemoryStore.tasks.findIndex(t => t._id === id || t.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Task not found' });
      inMemoryStore.tasks[idx].column_id = column_id;
      inMemoryStore.tasks[idx].order = order;
      inMemoryStore.tasks[idx].updated_at = new Date();
      updatedTask = inMemoryStore.tasks[idx];
    }

    res.json({
      id: updatedTask._id || updatedTask.id,
      column_id: updatedTask.column_id,
      order: updatedTask.order
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tasks/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    let updatedTask = null;

    if (isMongoConnected) {
      const t = await MongoTask.findById(id);
      if (!t) return res.status(404).json({ error: 'Task not found' });
      t.status = status;
      await t.save();
      updatedTask = t;
    } else {
      const idx = inMemoryStore.tasks.findIndex(t => t._id === id || t.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Task not found' });
      inMemoryStore.tasks[idx].status = status;
      inMemoryStore.tasks[idx].updated_at = new Date();
      updatedTask = inMemoryStore.tasks[idx];
    }

    res.json({
      id: updatedTask._id || updatedTask.id,
      status: updatedTask.status
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks/reorder', authenticateToken, async (req, res) => {
  try {
    const { tasks } = req.body; // array of { id, columnId, order }
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    if (isMongoConnected) {
      const bulkOps = tasks.map(task => ({
        updateOne: {
          filter: { _id: task.id },
          update: {
            $set: {
              column_id: task.columnId,
              order: task.order,
              updated_at: new Date()
            }
          }
        }
      }));
      await MongoTask.bulkWrite(bulkOps);
    } else {
      tasks.forEach(task => {
        const t = inMemoryStore.tasks.find(x => x._id === task.id || x.id === task.id);
        if (t) {
          t.column_id = task.columnId;
          t.order = task.order;
          t.updated_at = new Date();
        }
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected) {
      await MongoTask.findByIdAndDelete(id);
    } else {
      inMemoryStore.tasks = inMemoryStore.tasks.filter(t => t._id !== id && t.id !== id);
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard Endpoints
app.get('/api/dashboard/stats', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    let boardIds: string[] = [];

    // Find all boards user owns or belongs to
    if (isMongoConnected) {
      const boards = await MongoBoard.find({
        is_archived: false,
        $or: [
          { owner_id: userId },
          { members: userId }
        ]
      }, '_id');
      boardIds = boards.map(b => b._id);
    } else {
      boardIds = inMemoryStore.boards
        .filter(b => !b.is_archived && (b.owner_id === userId || (b.members && b.members.includes(userId))))
        .map(b => b._id || b.id);
    }

    if (boardIds.length === 0) {
      return res.json({
        totalTasks: 0,
        todoTasks: 0,
        inProgressTasks: 0,
        reviewTasks: 0,
        doneTasks: 0,
        overdueTasks: 0,
        myTasks: 0,
      });
    }

    let tasks = [];
    if (isMongoConnected) {
      tasks = await MongoTask.find({
        board_id: { $in: boardIds },
        is_archived: false
      });
    } else {
      tasks = inMemoryStore.tasks.filter(t => boardIds.includes(t.board_id) && !t.is_archived);
    }

    const now = new Date();

    const stats = {
      totalTasks: tasks.length,
      todoTasks: tasks.filter(t => t.status === 'todo').length,
      inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
      reviewTasks: tasks.filter(t => t.status === 'review').length,
      doneTasks: tasks.filter(t => t.status === 'done').length,
      overdueTasks: tasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'done').length,
      myTasks: tasks.filter(t => t.assignee_id === userId).length,
    };

    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard/my-tasks', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    let tasks = [];

    if (isMongoConnected) {
      tasks = await MongoTask.find({
        assignee_id: userId,
        is_archived: false
      }).sort({ due_date: 1 }).limit(5);
    } else {
      tasks = inMemoryStore.tasks
        .filter(t => t.assignee_id === userId && !t.is_archived)
        .sort((a, b) => {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        })
        .slice(0, 5);
    }

    const formattedTasks = tasks.map((t: any) => ({
      id: t._id || t.id,
      title: t.title,
      description: t.description,
      priority: t.priority,
      status: t.status,
      due_date: t.due_date,
      board_id: t.board_id,
      column_id: t.column_id,
      assignee_id: t.assignee_id,
      created_by: t.created_by,
      order: t.order ?? 0,
      tags: t.tags || [],
      is_archived: t.is_archived,
      created_at: t.created_at,
      updated_at: t.updated_at
    }));

    res.json(formattedTasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard/overdue', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    let boardIds: string[] = [];

    if (isMongoConnected) {
      const boards = await MongoBoard.find({
        is_archived: false,
        $or: [
          { owner_id: userId },
          { members: userId }
        ]
      }, '_id');
      boardIds = boards.map(b => b._id);
    } else {
      boardIds = inMemoryStore.boards
        .filter(b => !b.is_archived && (b.owner_id === userId || (b.members && b.members.includes(userId))))
        .map(b => b._id || b.id);
    }

    if (boardIds.length === 0) return res.json([]);

    const now = new Date();
    let tasks = [];

    if (isMongoConnected) {
      tasks = await MongoTask.find({
        board_id: { $in: boardIds },
        due_date: { $lt: now },
        status: { $ne: 'done' },
        is_archived: false
      }).sort({ due_date: 1 }).limit(5);
    } else {
      tasks = inMemoryStore.tasks
        .filter(t => boardIds.includes(t.board_id) && t.due_date && new Date(t.due_date) < now && t.status !== 'done' && !t.is_archived)
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
        .slice(0, 5);
    }

    const formattedTasks = tasks.map((t: any) => ({
      id: t._id || t.id,
      title: t.title,
      description: t.description,
      priority: t.priority,
      status: t.status,
      due_date: t.due_date,
      board_id: t.board_id,
      column_id: t.column_id,
      assignee_id: t.assignee_id,
      created_by: t.created_by,
      order: t.order ?? 0,
      tags: t.tags || [],
      is_archived: t.is_archived,
      created_at: t.created_at,
      updated_at: t.updated_at
    }));

    res.json(formattedTasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ----------------- VITE MIDDLEWARE / STATIC FILES -----------------

async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
  });
}

setupVite().catch(err => {
  console.error('[Server] Error starting backend server:', err);
});
