import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, Edit2, Crown } from 'lucide-react';
import { Navbar, PageWrapper } from '../components/layout';
import { ProtectedRoute } from '../components/layout';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Badge, Avatar, Dropdown, Modal, Select, Spinner, EmptyState } from '../components/ui';
import { formatDate } from '../utils/helpers';
import type { User } from '../types';

export function AdminUsersPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminUsersContent />
    </ProtectedRoute>
  );
}

function AdminUsersContent() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getAllUsers();
      setUsers(data);
      setError(null);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'member') => {
    setSaving(true);
    try {
      await api.updateUser(userId, { role: newRole });
      await loadUsers();
      setShowEditModal(false);
      setEditingUser(null);
    } catch {
      setError('Failed to update user role');
    } finally {
      setSaving(false);
    }
  };

  const menuItems = (user: User) => [
    { label: 'Change role', value: 'edit', icon: <Edit2 className="h-4 w-4" /> },
    {
      label: 'Make Admin',
      value: 'make_admin',
      icon: <Crown className="h-4 w-4" />,
      description: user.role === 'admin' ? 'Already admin' : undefined,
      disabled: user.role === 'admin',
    },
  ];

  const handleMenu = (user: User, value: string) => {
    if (value === 'edit') {
      setEditingUser(user);
      setShowEditModal(true);
    } else if (value === 'make_admin' && user.role !== 'admin') {
      handleUpdateRole(user.id, 'admin');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#080808]">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center w-full flex-grow">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#080808]">
      <Navbar />
      <PageWrapper
        title="User Management"
        subtitle="Manage user accounts and permissions (Admin only)"
        actions={
          <Badge variant="primary" dot>
            Admin Access
          </Badge>
        }
      >
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-error-50 text-error-700">
            {error}
            <Button variant="ghost" size="sm" onClick={loadUsers} className="ml-4">
              Retry
            </Button>
          </div>
        )}

        {users.length === 0 ? (
          <EmptyState title="No users yet" description="Users will appear here once they sign up" />
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0B0B0B]">
                    <th className="text-left py-3 px-4 text-sm font-bold text-white/40">User</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-white/40 hidden md:table-cell">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-white/40">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-white/40 hidden sm:table-cell">Joined</th>
                    <th className="text-right py-3 px-4 text-sm font-bold text-white/40">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.name} src={user.avatar} size="sm" />
                          <div>
                            <p className="font-bold text-white/90">{user.name}</p>
                            <p className="text-xs text-white/40 md:hidden">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-white/60 hidden md:table-cell">{user.email}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={user.role === 'admin' ? 'primary' : 'secondary'}
                          size="sm"
                        >
                          {user.role === 'admin' ? (
                            <>
                              <Crown className="h-3 w-3 mr-1" />
                              Admin
                            </>
                          ) : (
                            'Member'
                          )}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-white/40 text-sm hidden sm:table-cell">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {currentUser?.id !== user.id && (
                          <Dropdown
                            trigger={
                              <button className="p-2 rounded-lg text-white/40 hover:bg-white/5 hover:text-white transition-colors">
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            }
                            items={menuItems(user)}
                            onSelect={(value) => handleMenu(user, value)}
                            showChevron={false}
                            align="right"
                          />
                        )}
                        {currentUser?.id === user.id && (
                          <Badge variant="secondary" size="sm">
                            You
                          </Badge>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingUser(null);
          }}
          title="Change User Role"
          size="sm"
        >
          {editingUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-lg">
                <Avatar name={editingUser.name} src={editingUser.avatar} size="sm" />
                <div>
                  <p className="font-bold text-white/90">{editingUser.name}</p>
                  <p className="text-sm text-white/40">{editingUser.email}</p>
                </div>
              </div>

              <Select
                label="Role"
                options={[
                  { value: 'member', label: 'Member' },
                  { value: 'admin', label: 'Admin' },
                ]}
                value={editingUser.role}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, role: e.target.value as 'admin' | 'member' })
                }
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleUpdateRole(editingUser.id, editingUser.role)}
                  loading={saving}
                >
                  Update Role
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </PageWrapper>
    </div>
  );
}

export default AdminUsersPage;
