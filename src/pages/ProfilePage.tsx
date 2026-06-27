import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navbar, PageWrapper } from '../components/layout';
import { Button, Input, Card, Badge, Avatar } from '../components/ui';
import { formatDate } from '../utils/helpers';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await updateProfile({ name: data.name });

    if (result.error) {
      setError(result.error.message || 'Failed to update profile');
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#080808]">
      <Navbar />
      <PageWrapper title="Profile" subtitle="Manage your account settings">
        <div className="max-w-2xl">
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-secondary-200">
              <Avatar name={user.name} src={user.avatar} size="xl" />
              <div>
                <h2 className="text-lg font-semibold text-secondary-900">{user.name}</h2>
                <p className="text-secondary-500">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={user.role === 'admin' ? 'primary' : 'secondary'}>
                    <Shield className="h-3 w-3 mr-1" />
                    {user.role === 'admin' ? 'Admin' : 'Member'}
                  </Badge>
                  <span className="text-xs text-secondary-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Joined {formatDate(user.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg bg-error-50 border border-error-200 text-error-700 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg bg-success-50 border border-success-200 text-success-700 text-sm"
                >
                  Profile updated successfully!
                </motion.div>
              )}

              <Input
                label="Display Name"
                placeholder="Your name"
                leftIcon={<User className="h-4 w-4" />}
                error={errors.name?.message}
                {...register('name')}
              />

              <Input
                label="Email Address"
                value={user.email}
                disabled
                leftIcon={<Mail className="h-4 w-4" />}
                helperText="Email cannot be changed"
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button type="submit" loading={loading} disabled={!isDirty}>
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </PageWrapper>
    </div>
  );
}

export default ProfilePage;
