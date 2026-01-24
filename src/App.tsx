import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import HomeView from './views/HomeView';
import ScannerView from './views/ScannerView';
import RegisterView from './views/RegisterView';
import { LoyaltyProvider } from './context/LoyaltyContext';
import { useLoyalty } from './hooks/useLoyalty';

// Component to handle redirection if not logged in
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    const { user } = useLoyalty();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!user && location.pathname !== '/register' && location.pathname !== '/tecnoscan') {
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
        <LoyaltyProvider>
            <Router>
                <AuthGuard>
                    <Routes>
                        <Route path="/" element={<HomeView />} />
                        <Route path="/tecnoscan" element={<ScannerView />} />
                        <Route path="/register" element={<RegisterView />} />
                    </Routes>
                </AuthGuard>
            </Router>
        </LoyaltyProvider>
    );
}

export default App;
