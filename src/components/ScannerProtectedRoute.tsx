import React from 'react';
import { Navigate } from 'react-router-dom';

interface ScannerProtectedRouteProps {
    children: React.ReactNode;
}

const ScannerProtectedRoute = ({ children }: ScannerProtectedRouteProps) => {
    const isScannerUser = localStorage.getItem('scanner_user') === 'true';

    if (!isScannerUser) {
        return <Navigate to="/register" replace />;
    }

    return <>{children}</>;
};

export default ScannerProtectedRoute;
