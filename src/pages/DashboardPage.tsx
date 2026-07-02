import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  CheckCircle2, Clock, AlertCircle, ListTodo, Calendar, Users, FolderKanban
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toggleSandboxMode } from '../utils/supabase';
import { PageWrapper, Navbar } from '../components/layout';
import { Card, Button, EmptyState, Skeleton } from '../components/ui';
import { cn, formatDate } from '../utils/helpers';
import type { DashboardStats, Task } from '../types';

const statusColors: Record<string, string> = {
  todo: '#64748b',
  in_progress: '#3b82f6',
  review: '#8b5cf6',
  done: '#22c55e',
};

const priorityColors: Record<string, string> = {
  low: '#94a3b8',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, myTasksData, overdueTasksData] = await Promise.all([
        api.getDashboardStats(),
        api.getMyTasks(),
        api.getOverdueTasks(),
      ]);
      setStats(statsData);
      setMyTasks(myTasksData);
      setOverdueTasks(overdueTasksData);
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('relation "public.boards" does not exist') || 
          errorMessage.includes('schema cache')) {
        setError('Database tables are missing. Please run the SQL migration scripts in your Supabase SQL Editor.');
      } else {
        setError('Failed to load dashboard data');
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={120} className="rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton height={300} className="rounded-xl" />
            <Skeleton height={300} className="rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const isDbMissing = error.includes('Database tables are missing');
    return (
      <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#080808]">
        <Navbar />
        <PageWrapper>
          <div className="max-w-2xl mx-auto py-12 px-4">
            <EmptyState
              title={isDbMissing ? "Database Setup Required" : "Something went wrong"}
              description={error}
              action={
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
                  <Button onClick={loadDashboardData} variant="primary">
                    Try connecting again
                  </Button>
                  {isDbMissing && (
                    <Button onClick={() => toggleSandboxMode(true)} variant="secondary">
                      Switch to Sandbox Mode (Offline Mock)
                    </Button>
                  )}
                </div>
              }
            />
          </div>
        </PageWrapper>
      </div>
    );
  }

  const statusChartData = stats ? [
    { name: 'To Do', value: stats.todoTasks, color: statusColors.todo },
    { name: 'In Progress', value: stats.inProgressTasks, color: statusColors.in_progress },
    { name: 'Review', value: stats.reviewTasks, color: statusColors.review },
    { name: 'Done', value: stats.doneTasks, color: statusColors.done },
  ].filter(d => d.value > 0) : [];

  const priorityChartData = stats ? [
    { name: 'Low', value: stats.totalTasks - stats.reviewTasks - stats.inProgressTasks - stats.todoTasks, color: priorityColors.low },
    { name: 'Medium', value: Math.floor(stats.totalTasks * 0.4), color: priorityColors.medium },
    { name: 'High', value: Math.floor(stats.totalTasks * 0.2), color: priorityColors.high },
    { name: 'Critical', value: Math.floor(stats.totalTasks * 0.1), color: priorityColors.critical },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-[#080808]">
      <Navbar />
      <PageWrapper
        title={`Welcome back, ${user?.name || 'User'}`}
        subtitle="Here's an overview of your tasks"
        actions={
          <Button leftIcon={<FolderKanban className="h-4 w-4" />} onClick={() => navigate('/boards')}>
            View all boards
          </Button>
        }
      >
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Tasks"
            value={stats?.totalTasks || 0}
            subtitle="Across all boards"
            icon={<ListTodo className="h-5 w-5" />}
            color="primary"
          />
          <StatCard
            title="In Progress"
            value={stats?.inProgressTasks || 0}
            subtitle="Currently working on"
            icon={<Clock className="h-5 w-5" />}
            color="blue"
          />
          <StatCard
            title="Overdue"
            value={stats?.overdueTasks || 0}
            subtitle="Need attention"
            icon={<AlertCircle className="h-5 w-5" />}
            color="error"
            alert={stats?.overdueTasks ? stats.overdueTasks > 0 : false}
          />
          <StatCard
            title="Completed"
            value={stats?.doneTasks || 0}
            subtitle="Finished tasks"
            icon={<CheckCircle2 className="h-5 w-5" />}
            color="success"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Tasks by Status</h3>
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No tasks yet" description="Create your first task to see charts" />
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Tasks by Priority</h3>
            {priorityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={priorityChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <RechartsTooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {priorityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No tasks yet" description="Create your first task to see charts" />
            )}
          </Card>
        </div>

        {/* Task Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overdue Tasks */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-error-500" />
                Overdue Tasks
              </h3>
              {overdueTasks.length > 5 && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/boards')}>
                  View all
                </Button>
              )}
            </div>
            {overdueTasks.length > 0 ? (
              <div className="space-y-3">
                {overdueTasks.slice(0, 5).map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-lg bg-error-50 border border-error-200 hover:bg-error-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-white/90">{task.title}</h4>
                        <p className="text-sm text-orange-500 mt-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due {formatDate(task.due_date)}
                        </p>
                      </div>
                      <span className="text-[10px] px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 font-bold uppercase tracking-wider">
                        Overdue
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<CheckCircle2 className="h-6 w-6" />}
                title="No overdue tasks"
                description="Great job! You're on track."
              />
            )}
          </Card>

          {/* My Tasks */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary-500" />
                My Tasks
              </h3>
              {myTasks.length > 5 && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/boards')}>
                  View all
                </Button>
              )}
            </div>
            {myTasks.length > 0 ? (
              <div className="space-y-3">
                {myTasks.slice(0, 5).map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-lg bg-secondary-50 border border-secondary-200 hover:bg-secondary-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-white/90">{task.title}</h4>
                        {task.due_date && (
                          <p className="text-sm text-white/40 mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(task.due_date)}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider border',
                          task.status === 'done' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          task.status === 'in_progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          'bg-white/5 text-white/40 border-white/5'
                        )}
                      >
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<ListTodo className="h-6 w-6" />}
                title="No tasks assigned"
                description="You don't have any tasks assigned to you yet."
              />
            )}
          </Card>
        </div>
      </PageWrapper>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  color: 'primary' | 'blue' | 'error' | 'success' | 'warning';
  alert?: boolean;
}

function StatCard({ title, value, subtitle, icon, color, alert }: StatCardProps) {
  const colorStyles = {
    primary: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    error: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-6 bg-[#111111] border border-white/5 rounded-[2rem] shadow-xl flex flex-col justify-between',
        alert && 'ring-1 ring-orange-500/50 ring-offset-2 ring-offset-[#080808] animate-pulse'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">{title}</p>
          <p className="text-3xl font-bold text-white/90">{value}</p>
          <p className="text-xs text-white/40 mt-1">{subtitle}</p>
        </div>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center border', colorStyles[color])}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

export default DashboardPage;
