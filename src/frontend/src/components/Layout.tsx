import React, { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { Clock, BarChart3, FileText, Shield, Timer, RefreshCw, RotateCcw, Coffee } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface LayoutProps {
  children: React.ReactNode;
}

export type TimeEntryMode = 'auto' | 'manual';

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [mode, setMode] = useState<TimeEntryMode>('auto');

  const isActive = (path: string) => location.pathname === path;

  const toggleMode = () => {
    setMode(prev => prev === 'auto' ? 'manual' : 'auto');
  };

  // Clone children and pass mode props
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { mode, setMode } as any);
    }
    return child;
  });

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-gray-100">
      <header className="sticky top-0 z-50 bg-[#1a1f2e]/95 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2 text-xl font-bold text-blue-400">
                <Clock className="w-6 h-6" />
                TimeTracker
              </Link>
              
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  to="/"
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isActive('/') 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Dashboard
                  </div>
                </Link>
                
                <Link
                  to="/batch-entry"
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isActive('/batch-entry')
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Batch Entry
                  </div>
                </Link>
                
                <Link
                  to="/analytics"
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isActive('/analytics')
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Analytics
                  </div>
                </Link>
                
                <Link
                  to="/admin"
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isActive('/admin')
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Admin
                  </div>
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleMode}
                className="btn-mode flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                title={`Switch to ${mode === 'auto' ? 'manual' : 'auto'} mode`}
              >
                <Timer className="w-4 h-4" />
                {mode === 'auto' ? 'Auto' : 'Manual'}
              </button>
              
              <button
                className="btn-sync flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                title="Sync data"
              >
                <RefreshCw className="w-4 h-4" />
                Sync
              </button>
              
              <button
                className="btn-reset flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                title="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              
              <button
                className="btn-break-header flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                title="Take a break"
              >
                <Coffee className="w-4 h-4" />
                Break
              </button>
              
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {childrenWithProps}
      </main>

      <footer className="mt-auto py-6 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
          <p>
            © {new Date().getFullYear()} Built with ❤️ using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
