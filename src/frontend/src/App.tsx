import { createRouter, RouterProvider, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import BatchEntry from './pages/BatchEntry';
import Analytics from './pages/Analytics';
import AdminDashboard from './pages/AdminDashboard';

const rootRoute = createRootRoute({
    component: () => <Outlet />
});

const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: 'layout',
    component: () => (
        <Layout>
            <Outlet />
        </Layout>
    )
});

const dashboardRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/',
    component: Dashboard
});

const batchEntryRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/batch-entry',
    component: BatchEntry
});

const analyticsRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/analytics',
    component: Analytics
});

const adminRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/admin',
    component: AdminDashboard
});

const routeTree = rootRoute.addChildren([
    layoutRoute.addChildren([dashboardRoute, batchEntryRoute, analyticsRoute, adminRoute])
]);

const router = createRouter({ routeTree, defaultPreload: 'intent' });

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}

export default function App() {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <RouterProvider router={router} />
            <Toaster />
        </ThemeProvider>
    );
}
