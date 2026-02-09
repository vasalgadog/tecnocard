import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { LoyaltyProvider } from './context/LoyaltyContext';
import { useLoyalty } from './hooks/useLoyalty';

// Lazy load views for better chunking
const HomeView = React.lazy(() => import('./views/HomeView'));
const ScannerView = React.lazy(() => import('./views/ScannerView'));
const RutSearchView = React.lazy(() => import('./views/RutSearchView'));
const RegisterView = React.lazy(() => import('./views/RegisterView'));
const DashboardView = React.lazy(() => import('./views/DashboardView'));
const LocalAccessView = React.lazy(() => import('./views/LocalAccessView'));

// Import route guard
import ScannerProtectedRoute from './components/ScannerProtectedRoute';

// Component to handle redirection if not logged in
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    const { user } = useLoyalty();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Paths that don't require "user" (customer session)
        // Scanner routes are handled by ScannerProtectedRoute
        const isPublicPath = ['/register', '/tecnoscan', '/tecnoscan/con-rut', '/dashboard'].includes(location.pathname) || location.pathname.startsWith('/local/');

        if (!user && !isPublicPath) {
            navigate('/register');
        } else if (user && location.pathname === '/register') {
            // If already logged in, go to card
            navigate('/');
        }
    }, [user, navigate, location]);

    return <>{children}</>;
};

function App() {
    return (
        <Router basename="/tecnocard/">
            <LoyaltyProvider>
                <AuthGuard>
                    <React.Suspense fallback={
                        <div style={{
                            padding: '20px',
                            textAlign: 'center',
                            minHeight: '670px', // Reserve height for LoyaltyCard to prevent CLS
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            Cargando...
                        </div>
                    }>
                        <Routes>
                            <Route path="/" element={<HomeView />} />
                            <Route path="/tecnoscan" element={
                                <ScannerProtectedRoute>
                                    <ScannerView />
                                </ScannerProtectedRoute>
                            } />
                            <Route path="/tecnoscan/con-rut" element={
                                <ScannerProtectedRoute>
                                    <RutSearchView />
                                </ScannerProtectedRoute>
                            } />
                            <Route path="/register" element={<RegisterView />} />
                            <Route path="/dashboard" element={
                                <ScannerProtectedRoute>
                                    <DashboardView />
                                </ScannerProtectedRoute>
                            } />
                            <Route path="/local/:localToken" element={<LocalAccessView />} />
                        </Routes>
                    </React.Suspense>
                </AuthGuard>
            </LoyaltyProvider>
        </Router>
    );
}


export default App;
