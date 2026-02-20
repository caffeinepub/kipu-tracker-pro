import { ReactNode } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import ThemeToggle from './ThemeToggle';
import { LayoutDashboard, FileSpreadsheet, BarChart3, Shield } from 'lucide-react';

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-chart-1 to-chart-5">
                                <LayoutDashboard className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-chart-1 to-chart-5 bg-clip-text text-transparent">
                                    Kipu Tracker Pro
                                </h1>
                            </div>
                        </Link>

                        <nav className="hidden md:flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate({ to: '/' })}
                                className="gap-2"
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                Dashboard
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate({ to: '/batch-entry' })}
                                className="gap-2"
                            >
                                <FileSpreadsheet className="h-4 w-4" />
                                Batch Entry
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate({ to: '/analytics' })}
                                className="gap-2"
                            >
                                <BarChart3 className="h-4 w-4" />
                                Analytics
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate({ to: '/admin' })}
                                className="gap-2"
                            >
                                <Shield className="h-4 w-4" />
                                Admin
                            </Button>
                        </nav>
                    </div>

                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main className="container py-8">{children}</main>

            <footer className="border-t border-border/40 py-6 mt-16">
                <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <p>© {new Date().getFullYear()} Kipu Tracker Pro. All rights reserved.</p>
                    <p>
                        Built with ❤️ using{' '}
                        <a
                            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                                window.location.hostname
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-chart-1 hover:underline"
                        >
                            caffeine.ai
                        </a>
                    </p>
                </div>
            </footer>
        </div>
    );
}
