import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, LogOut, Menu, Settings, User, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isUsingMock, toggleSandboxMode, hasRealCredentials } from '../../utils/supabase';
import { cn } from '../../utils/helpers';
import Avatar from '../ui/Avatar';
import Dropdown from '../ui/Dropdown';
import { Modal, Button } from '../ui';

const navLinks = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/boards', label: 'Boards', icon: FolderKanban },
];

export function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCredsWarning, setShowCredsWarning] = useState(false);

  const handleConnectRealDb = () => {
    if (hasRealCredentials()) {
      toggleSandboxMode(false);
    } else {
      setShowCredsWarning(true);
    }
  };

  const userMenuItems = [
    { label: 'Profile', value: 'profile', icon: <User className="h-4 w-4" /> },
    { label: 'Settings', value: 'settings', icon: <Settings className="h-4 w-4" /> },
    { label: 'Sign out', value: 'signout', icon: <LogOut className="h-4 w-4" />, danger: true },
  ];

  const handleUserMenu = (value: string) => {
    if (value === 'signout') {
      signOut();
    }
    if (value === 'profile') {
      navigate('/profile');
    }
    if (value === 'settings') {
      navigate('/settings');
    }
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0B0B0B] border-b border-white/5 shrink-0 w-full z-40 relative">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-black text-white text-sm">TF</span>
          </div>
          <span className="font-bold text-lg tracking-tight text-white/90">TaskFlow</span>
        </Link>
        <div className="flex items-center gap-3">
          {isUsingMock && (
            <button
              onClick={handleConnectRealDb}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 font-semibold animate-pulse hover:bg-orange-500/20 active:scale-95 transition-all cursor-pointer"
            >
              Connect Real DB
            </button>
          )}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-white/60 hover:text-white">
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-[#080808] flex flex-col pt-20 px-6">
          <nav className="space-y-2 flex-grow">
            {navLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                    isActive
                      ? 'bg-white/5 text-white border border-white/5'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/[0.02]'
                  )}
                >
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    isActive ? 'bg-indigo-400' : 'bg-transparent border border-white/20'
                  )}></div>
                  <span className="text-base font-medium">{link.label}</span>
                </Link>
              );
            })}
          </nav>
          
          {isUsingMock && (
            <div className="mt-4 mb-6 px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <p className="text-xs font-semibold mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                Sandbox Mode (Offline)
              </p>
              <button
                onClick={handleConnectRealDb}
                className="text-[11px] underline hover:text-orange-300 font-medium cursor-pointer"
              >
                Connect Real Database
              </button>
            </div>
          )}
          
          {user && (
            <div className="mt-auto py-6 border-t border-white/5">
              <Dropdown
                trigger={
                  <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white/[0.02] transition-colors text-left">
                    <Avatar name={user.name} src={user.avatar} size="sm" />
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-medium text-white/90 truncate">{user.name}</span>
                      <span className="text-xs text-white/40 truncate">System User</span>
                    </div>
                  </button>
                }
                items={userMenuItems}
                onSelect={(val) => {
                  handleUserMenu(val);
                  setIsMobileMenuOpen(false);
                }}
                showChevron={false}
                align="left"
              />
            </div>
          )}
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-white/5 flex-col p-6 bg-[#0B0B0B] h-full shrink-0 overflow-y-auto">
        <Link to="/" className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-black text-white text-lg">TF</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-white/90">TaskFlow</span>
        </Link>

        <nav className="space-y-1 flex-grow">
          {navLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors',
                  isActive
                    ? 'bg-white/5 text-white border border-white/5'
                    : 'text-white/40 hover:text-white/60 hover:bg-white/[0.02]'
                )}
              >
                <div className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  isActive ? 'bg-indigo-400' : 'bg-transparent border border-white/20'
                )}></div>
                <span className="text-sm font-medium">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {isUsingMock && (
          <div className="mt-4 mb-6 px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <p className="text-xs font-semibold mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              Sandbox Mode (Offline)
            </p>
            <button
              onClick={handleConnectRealDb}
              className="text-[11px] underline hover:text-orange-300 font-medium cursor-pointer text-left"
            >
              Connect Real Database
            </button>
          </div>
        )}

        {user && (
          <div className="mt-auto pt-4 border-t border-white/5">
            <Dropdown
              trigger={
                <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white/[0.02] transition-colors text-left">
                  <Avatar name={user.name} src={user.avatar} size="sm" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium text-white/90 truncate">{user.name}</span>
                    <span className="text-xs text-white/40 truncate">System User</span>
                  </div>
                </button>
              }
              items={userMenuItems}
              onSelect={handleUserMenu}
              showChevron={false}
              align="left"
            />
          </div>
        )}
      </aside>

      <Modal
        isOpen={showCredsWarning}
        onClose={() => setShowCredsWarning(false)}
        title="Supabase Setup Required"
        size="md"
      >
        <div className="flex flex-col items-center text-center space-y-5">
          <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-white/70 leading-relaxed">
              Your real Supabase database credentials are not configured yet. The app is currently running in <strong>Sandbox Mode (Offline)</strong> with simulated mock data so you can test it immediately.
            </p>
            <p className="text-sm text-white/70 leading-relaxed">
              To connect your real, live database:
            </p>
          </div>

          <div className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-left space-y-3">
            <div className="flex gap-3">
              <div className="w-5 h-5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
              <p className="text-xs text-white/60 leading-relaxed">
                Open the <strong>Settings</strong> menu of your AI Studio environment (or your local <code>.env</code> file).
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-5 h-5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
              <p className="text-xs text-white/60 leading-relaxed">
                Configure <code>VITE_SUPABASE_URL</code> to your live Supabase Project URL.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-5 h-5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
              <p className="text-xs text-white/60 leading-relaxed">
                Configure <code>VITE_SUPABASE_ANON_KEY</code> to your live Supabase anon/public key.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setShowCredsWarning(false)}
            >
              Continue in Sandbox Mode
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function NavbarMinimal() {
  return (
    <header className="w-full py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-black text-white text-lg">TF</span>
          </div>
          <span className="font-bold text-2xl text-white/90">TaskFlow</span>
        </Link>
      </div>
    </header>
  );
}

export default Navbar;
