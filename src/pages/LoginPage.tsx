import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/layout';
import { Button, Input } from '../components/ui';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    const result = await signIn(data.email, data.password);

    if (result.error) {
      let errorMessage = result.error.message || 'Invalid email or password';
      if (errorMessage.toLowerCase().includes('rate limit')) {
        errorMessage = 'Email rate limit exceeded. Please try again later or disable email confirmation in your Supabase dashboard.';
      }
      setError(errorMessage);
      setIsLoading(false);
    } else {
      navigate(from, { replace: true });
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your TaskFlow account">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 text-sm font-bold"
          >
            {error}
          </motion.div>
        )}

        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            error={errors.password?.message}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-white/40 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            {...register('password')}
          />
        </div>

        <Button type="submit" loading={isLoading} className="w-full" leftIcon={<LogIn className="h-4 w-4" />}>
          Sign in
        </Button>

        <p className="text-center text-sm text-white/40 font-medium">
          Don't have an account?{' '}
          <Link to="/register" className="text-white hover:text-indigo-400 font-bold transition-colors">
            Create one
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default LoginPage;
