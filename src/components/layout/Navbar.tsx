import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, LogOut, Menu, Settings, User, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/helpers';
import Avatar from '../ui/Avatar';
import Dropdown from '../ui/Dropdown';

const navLinks = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/boards', label: 'Boards', icon: FolderKanban },
];

export function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-white/60 hover:text-white">
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
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
