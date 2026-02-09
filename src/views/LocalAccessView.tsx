import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const LocalAccessView = () => {
    const { localToken } = useParams();
    const navigate = useNavigate();



    useEffect(() => {
        if (localToken) {
            // Persist token to local storage for registration flow
            localStorage.setItem('tecnocard_local_token', localToken);

            // Initial redirect to register view
            // Using replace to avoid history stack issues
            navigate('/register', { replace: true });
        } else {
            // Fallback if no token provided in URL
            navigate('/register', { replace: true });
        }
    }, [localToken, navigate]);

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            padding: '20px',
            textAlign: 'center'
        }}>
            <h3>Procesando acceso local...</h3>
            <p>Por favor espera un momento.</p>
        </div>
    );
};

export default LocalAccessView;
