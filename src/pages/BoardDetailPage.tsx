import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Settings, Users, Edit2, Trash2,
  MoreHorizontal, UserPlus, X
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Navbar, PageWrapper } from '../components/layout';
import { KanbanBoard } from '../components/board';
import { Button, Spinner, EmptyState, Modal, Input, Badge, Avatar, Dropdown, ConfirmDialog } from '../components/ui';
import type { BoardWithDetails, Task, User } from '../types';

export function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [board, setBoard] = useState<BoardWithDetails | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadBoard = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [boardData, tasksData] = await Promise.all([
        api.getBoard(id),
        api.getTasks(id),
      ]);
      setBoard(boardData);
      setTasks(tasksData);
      setError(null);
    } catch {
      setError('Failed to load board');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const handleTasksChange = useCallback(() => {
    loadBoard();
  }, [loadBoard]);

  const handleBoardChange = useCallback(() => {
    loadBoard();
  }, [loadBoard]);

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#080808]">
        <Navbar />
        <div className="flex-1 flex flex-col min-w-0 items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#080808]">
        <Navbar />
        <div className="flex-1 flex flex-col min-w-0">
          <PageWrapper>
            <EmptyState
              title="Board not found"
              description={error || "The board you're looking for doesn't exist or you don't have access."}
              action={<Button onClick={() => navigate('/boards')}>Go to Boards</Button>}
            />
          </PageWrapper>
        </div>
      </div>
    );
  }

  const isOwner = board.owner_id === user?.id;
  const isAdmin = user?.role === 'admin';
  const canManage = isOwner || isAdmin;

  const columns = board.columns || [];
  const memberUsers = board.memberDetails || [];

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#080808]">
      <Navbar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-[#0B0B0B] border-b border-white/5 z-30 shrink-0">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/boards')}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  Back
                </Button>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-white/90 truncate">{board.title}</h1>
                  {board.description && (
                    <p className="text-sm text-white/40 truncate">{board.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowMembersModal(true)}
                  leftIcon={<Users className="h-4 w-4" />}
                >
                  {board.members?.length || 0} Members
                </Button>
                {canManage && (
                  <Dropdown
                    trigger={
                      <button className="p-2 rounded-lg text-white/40 hover:bg-white/10 transition-colors">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    }
                    items={[
                      { label: 'Edit board', value: 'edit', icon: <Edit2 className="h-4 w-4" /> },
                      { label: 'Settings', value: 'settings', icon: <Settings className="h-4 w-4" /> },
                      { label: 'Delete board', value: 'delete', icon: <Trash2 className="h-4 w-4" />, danger: true },
                    ]}
                    onSelect={(value) => {
                      if (value === 'edit' || value === 'settings') setShowSettingsModal(true);
                      if (value === 'delete') {
                        setShowDeleteConfirm(true);
                      }
                    }}
                    showChevron={false}
                    align="right"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Board Content */}
        <div className="flex-1 overflow-hidden">
          <KanbanBoard
            board={board}
            tasks={tasks}
            columns={columns}
            onTasksChange={handleTasksChange}
            onBoardChange={handleBoardChange}
            memberUsers={memberUsers}
          />
        </div>
      </div>

      {/* Members Modal */}
      <MembersModal
        board={board}
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        onUpdated={handleBoardChange}
      />

      {/* Settings Modal */}
      <BoardSettingsModal
        board={board}
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onUpdated={handleBoardChange}
      />

      {board && (
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={async () => {
            setIsDeleting(true);
            try {
              await api.deleteBoard(board.id);
              navigate('/boards');
            } catch (err) {
              console.error("Failed to delete board:", err);
              const errMsg = err instanceof Error ? err.message : String(err);
              alert(`Failed to delete board: ${errMsg}`);
            } finally {
              setIsDeleting(false);
              setShowDeleteConfirm(false);
            }
          }}
          title="Delete Board"
          message={`Are you sure you want to delete the board "${board.title}"? This will also permanently delete all columns and tasks inside this board. This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          isDestructive={true}
          loading={isDeleting}
        />
      )}
    </div>
  );
}

function MembersModal({
  board,
  isOpen,
  onClose,
  onUpdated,
}: {
  board: BoardWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const canManage = board.owner_id === user?.id || user?.role === 'admin';

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await api.getAllUsers();
        setAllUsers(users.filter((u) => !board.members?.includes(u.id)));
      } catch (err) {
        console.error(err);
      }
    };
    if (isOpen && canManage) {
      loadUsers();
    }
  }, [isOpen, canManage, board.members]);

  const handleRemoveMember = async (userId: string) => {
    try {
      await api.removeBoardMember(board.id, userId);
      onUpdated();
    } catch {
      setError('Failed to remove member');
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      await api.addBoardMember(board.id, userId);
      onUpdated();
      loadUsers();
    } catch {
      setError('Failed to add member');
    }
  };

  const members = board.memberDetails || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Board Members" size="lg">
      <div className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-error-50 text-error-700 text-sm">
            {error}
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium text-white/60 mb-3">Current Members</h3>
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={member.name} src={member.avatar} size="sm" />
                  <div>
                    <p className="font-bold text-white/90">{member.name}</p>
                    <p className="text-sm text-white/40">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {member.id === board.owner_id ? (
                    <Badge variant="primary" size="sm">Owner</Badge>
                  ) : canManage && member.id !== user?.id ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <X className="h-4 w-4 text-white/40" />
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        {canManage && allUsers.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-white/60 mb-3">Add Members</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {allUsers.slice(0, 10).map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5"
                >
                  <div className="flex items-center gap-2">
                    <Avatar name={u.name} src={u.avatar} size="xs" />
                    <span className="text-sm font-bold text-white/90">{u.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddMember(u.id)}
                    leftIcon={<UserPlus className="h-3 w-3" />}
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function BoardSettingsModal({
  board,
  isOpen,
  onClose,
  onUpdated,
}: {
  board: BoardWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [title, setTitle] = useState(board.title);
  const [description, setDescription] = useState(board.description || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(board.title);
    setDescription(board.description || '');
  }, [board]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.updateBoard(board.id, {
        title: title.trim(),
        description: description.trim(),
      });
      onUpdated();
      onClose();
    } catch {
      setError('Failed to update board');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Board Settings">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-error-50 text-error-700 text-sm">
            {error}
          </div>
        )}
        <Input
          label="Board title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default BoardDetailPage;
