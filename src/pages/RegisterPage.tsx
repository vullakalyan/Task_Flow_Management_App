import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, UserPlus, Database, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/layout';
import { Button, Input } from '../components/ui';
import { isUsingMock } from '../utils/supabase';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const passwordRequirements = [
  { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { label: 'One uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'One lowercase letter', test: (v: string) => /[a-z]/.test(v) },
  { label: 'One number', test: (v: string) => /[0-9]/.test(v) },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password', '');
  const passwordValid = passwordRequirements.map((req) => ({
    ...req,
    passed: req.test(password),
  }));

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    const result = await signUp(data.email, data.password, data.name);

    if (result.error) {
      let errorMessage = result.error.message || 'Failed to create account';
      if (errorMessage.toLowerCase().includes('rate limit')) {
        errorMessage = 'Email rate limit exceeded. Please try again later or disable email confirmation in your Supabase dashboard (Authentication > Providers > Email).';
      }
      setError(errorMessage);
      setIsLoading(false);
    } else if (result.needsEmailVerification) {
      setError('Please check your email for a confirmation link to complete your registration.');
      setIsLoading(false);
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Get started with TaskFlow">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="mb-2">
          {isUsingMock ? (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Sandbox Mode (Offline Mock Database)</p>
                <p className="text-[10px] text-amber-500/80 mt-0.5">Using locally simulated storage. Enter any email & password to register & test the app instantly!</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Database className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-400">Database: Connected</p>
                <p className="text-[10px] text-emerald-400/80 mt-0.5">Successfully linked to your custom live Supabase backend.</p>
              </div>
            </div>
          )}
        </div>

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
          label="Full name"
          type="text"
          placeholder="John Doe"
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="space-y-2">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a strong password"
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
          {password && (
            <div className="flex flex-wrap gap-2">
              {passwordValid.map((req, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg border ${
                    req.passed
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : 'bg-white/5 text-white/40 border-white/5'
                  }`}
                >
                  {req.passed ? '✓' : '○'} {req.label}
                </span>
              ))}
            </div>
          )}
        </div>

        <Input
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Confirm your password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" loading={isLoading} className="w-full" leftIcon={<UserPlus className="h-4 w-4" />}>
          Create account
        </Button>

        <p className="text-center text-sm text-white/40 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-white hover:text-indigo-400 font-bold transition-colors">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default RegisterPage;
