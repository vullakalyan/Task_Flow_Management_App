import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FolderPlus, LayoutGrid, List, Settings, Calendar, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toggleSandboxMode } from '../utils/supabase';
import { Navbar, PageWrapper } from '../components/layout';
import { Button, Card, Spinner, EmptyState, Modal, Input, Dropdown, Badge, ConfirmDialog } from '../components/ui';
import { cn, formatDate } from '../utils/helpers';
import type { Board } from '../types';

export function BoardListPage() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      setLoading(true);
      const data = await api.getBoards();
      setBoards(data);
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('relation "public.boards" does not exist') || 
          errorMessage.includes('schema cache')) {
        setError('Database tables are missing. Please run the SQL migration scripts in your Supabase SQL Editor.');
      } else {
        setError('Failed to load boards');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#080808]">
        <Navbar />
        <div className="container mx-auto px-4 py-8 w-full flex-grow">
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#080808]">
      <Navbar />
      <PageWrapper
        title="My Boards"
        subtitle="Manage your Kanban boards"
        actions={
          <Button onClick={() => setShowCreateModal(true)} leftIcon={<FolderPlus className="h-4 w-4" />}>
            New Board
          </Button>
        }
      >
        {error ? (
          <EmptyState
            title={error.includes('Database tables are missing') ? "Database Setup Required" : "Something went wrong"}
            description={error}
            action={
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
                <Button onClick={loadBoards} variant="primary">
                  Try connecting again
                </Button>
                {error.includes('Database tables are missing') && (
                  <Button onClick={() => toggleSandboxMode(true)} variant="secondary">
                    Switch to Sandbox Mode (Offline Mock)
                  </Button>
                )}
              </div>
            }
          />
        ) : boards.length === 0 ? (
          <EmptyState
            title="No boards yet"
            description="Create your first board to start organizing your projects"
            action={
              <Button onClick={() => setShowCreateModal(true)} leftIcon={<FolderPlus className="h-4 w-4" />}>
                Create Board
              </Button>
            }
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-secondary-500 text-sm">
                {boards.length} board{boards.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-1 border border-white/10 rounded-lg p-1 bg-white/5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-1.5 rounded-md transition-colors',
                    viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-1.5 rounded-md transition-colors',
                    viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {boards.map((board, index) => (
                  <BoardCard key={board.id} board={board} index={index} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {boards.map((board, index) => (
                  <BoardListItem key={board.id} board={board} index={index} />
                ))}
              </div>
            )}
          </>
        )}

        <CreateBoardModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={(board) => navigate(`/boards/${board.id}`)}
        />
      </PageWrapper>
    </div>
  );
}

function BoardCard({ board, index }: { board: Board; index: number }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const menuItems = [
    { label: 'Settings', value: 'settings', icon: <Settings className="h-4 w-4" /> },
    { label: 'Delete', value: 'delete', icon: <Trash2 className="h-4 w-4" />, danger: true },
  ];

  const handleMenu = (value: string) => {
    if (value === 'settings') {
      navigate(`/boards/${board.id}`);
    } else if (value === 'delete') {
      setShowDeleteConfirm(true);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await api.deleteBoard(board.id);
      window.location.reload();
    } catch (err) {
      console.error("Failed to delete board:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      alert(`Failed to delete board: ${errMsg}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        onClick={() => navigate(`/boards/${board.id}`)}
        className="cursor-pointer group"
        hoverable
      >
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white/90 truncate group-hover:text-indigo-400 transition-colors">
                {board.title}
              </h3>
              <p className="text-sm text-white/40 mt-1 line-clamp-2">
                {board.description || 'No description'}
              </p>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <Dropdown
                trigger={
                  <button
                    className="p-1 rounded text-white/40 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                }
                items={menuItems}
                onSelect={handleMenu}
                showChevron={false}
                align="right"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-white/40">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(board.created_at)}
            </div>
            {board.owner_id === user?.id && <Badge variant="primary" size="sm">Owner</Badge>}
          </div>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Board"
        message={`Are you sure you want to delete the board "${board.title}"? This will also permanently delete all columns and tasks inside this board. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        loading={isDeleting}
      />
    </motion.div>
  );
}

function BoardListItem({ board, index }: { board: Board; index: number }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card
        onClick={() => navigate(`/boards/${board.id}`)}
        className="cursor-pointer group"
        hoverable
      >
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
              <FolderPlus className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white/90 truncate group-hover:text-indigo-400 transition-colors">
                {board.title}
              </h3>
              <p className="text-sm text-white/40 truncate">
                {board.description || 'No description'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="primary" size="sm">{board.columns?.length || 0} columns</Badge>
            <Badge variant="secondary" size="sm">{board.members?.length || 0} members</Badge>
            <span className="text-xs text-secondary-400 hidden sm:block">
              {formatDate(board.created_at)}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function CreateBoardModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (board: Board) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const board = await api.createBoard(title.trim(), description.trim());
      onCreated(board);
      resetForm();
    } catch {
      setError('Failed to create board');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setError(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Board">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-error-50 text-error-700 text-sm">
            {error}
          </div>
        )}
        <Input
          label="Board title"
          placeholder="e.g., Product Roadmap 2024"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Input
          label="Description (optional)"
          placeholder="What's this board for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Board
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default BoardListPage;
