import { ReactNode } from 'react';
import { NavbarMinimal } from './Navbar';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-[100dvh] bg-[#080808] flex flex-col">
      <NavbarMinimal />
      <main className="flex-1 flex flex-col px-4 sm:px-6 md:px-8 py-8 md:py-12 overflow-y-auto">
        <div className="w-full max-w-md mx-auto my-auto shrink-0">
          <div className="bg-[#111111] rounded-[2rem] shadow-xl border border-white/5 p-6 sm:p-8">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white/90 mb-2">{title}</h1>
                {subtitle && (
                  <p className="text-white/40 text-sm">{subtitle}</p>
                )}
              </div>
              {children}
            </div>
        </div>
      </main>
    </div>
  );
}

export default AuthLayout;
