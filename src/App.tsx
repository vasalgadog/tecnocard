import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import { LoyaltyProvider } from './context/LoyaltyContext';
import { useLoyalty } from './hooks/useLoyalty';

// Lazy load views for better chunking
const HomeView = React.lazy(() => import('./views/HomeView'));
const ScannerView = React.lazy(() => import('./views/ScannerView'));
const RutSearchView = React.lazy(() => import('./views/RutSearchView'));
const RegisterView = React.lazy(() => import('./views/RegisterView'));
const DashboardView = React.lazy(() => import('./views/DashboardView'));
const LocalAccessView = React.lazy(() => import('./views/LocalAccessView'));
const PrivacidadView = React.lazy(() => import('./views/PrivacidadView'));

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
        const isPublicPath = ['/register', '/privacidad', '/tecnoscan', '/tecnoscan/con-rut', '/dashboard'].includes(location.pathname) || location.pathname.startsWith('/local/');

        if (!user && !isPublicPath) {
            navigate('/register');
        } else if (user && location.pathname === '/register') {
            // If already logged in, go to card
            navigate('/');
        }
    }, [user, navigate, location]);

    return <>{children}</>;
};

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
    prompt(): Promise<void>;
}

function App() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showInstallBtn, setShowInstallBtn] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevenir que el navegador muestre su banner por defecto
            e.preventDefault();
            // Guardamos el evento con el tipado correcto
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowInstallBtn(true);
        };

        const handleAppInstalled = () => {
            setDeferredPrompt(null);
            setShowInstallBtn(false);
            console.log('Tecnocard se instaló con éxito');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = () => {
        if (!deferredPrompt) return;

        // Ejecución SÍNCRONA e inmediata del prompt nativo
        deferredPrompt.prompt();

        // Manejamos la promesa de la elección del usuario DESPUÉS de lanzar el prompt
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('El usuario aceptó la instalación');
            } else {
                console.log('El usuario rechazó la instalación');
            }
            // Limpiamos el estado en ambos casos
            setDeferredPrompt(null);
            setShowInstallBtn(false);
        }).catch((err) => {
            console.error('Error al procesar la instalación:', err);
        });
    };

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
                            <Route path="/privacidad" element={<PrivacidadView />} />
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
            <footer>
                {showInstallBtn && (
                    <div>
                        <p style={{ fontSize: '1rem', fontWeight: 'bold' }}>Instala la app para acceder más rápido!</p>
                        <button
                            onClick={handleInstallClick}
                            style={{
                                background: 'var(--card-bg)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '20px',
                                padding: '6px 16px',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'opacity 0.2s'
                            }}
                        >
                            Instalar App
                        </button>
                    </div>
                )}
                <div>
                    © 2026 <a href="https://valentin.valra.cl" target="_blank" rel="noopener noreferrer">valentin.valra.cl</a> | <Link to="/privacidad">Política de Privacidad</Link>
                </div>
            </footer>
        </Router>
    );
}


export default App;
