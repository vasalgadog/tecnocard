import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoyalty } from '../hooks/useLoyalty';
import InfoModal from '../components/InfoModal';

const RegisterView = () => {
    const [rut, setRut] = useState('');
    const [error, setError] = useState('');
    const [showInfo, setShowInfo] = useState(false);
    const [logoClicks, setLogoClicks] = useState(0);
    const navigate = useNavigate();
    const { registerUser } = useLoyalty();

    const handleLogoClick = () => {
        const cleanRut = rut.replace(/[^0-9kK]/g, '');
        if (cleanRut !== '60351112') {
            setLogoClicks(0);
            return;
        }

        const newCount = logoClicks + 1;
        if (newCount >= 8) {
            navigate('/tecnoscan');
        } else {
            setLogoClicks(newCount);
        }
    };

    const formatRut = (raw: string) => {
        let value = raw.replace(/[^0-9kK]/g, '').toUpperCase();
        if (value.length < 2) return value;
        const dv = value.slice(-1);
        const body = value.slice(0, -1);
        const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return `${formattedBody}-${dv}`;
    };

    const validateRut = (rutFull: string) => {
        const cleanRut = rutFull.replace(/[^0-9kK]/g, '').toUpperCase();
        if (cleanRut.length < 8 || cleanRut.length > 10) return false;

        const body = cleanRut.slice(0, -1);
        const dv = cleanRut.slice(-1);
        let sum = 0;
        let mul = 2;
        for (let i = body.length - 1; i >= 0; i--) {
            sum += parseInt(body.charAt(i)) * mul;
            mul = (mul + 1) % 8 || 2;
        }
        const res = 11 - (sum % 11);
        const dvr = res === 11 ? '0' : res === 10 ? 'K' : res.toString();
        return dvr === dv;
    };

    const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatRut(e.target.value);
        if (formatted.length <= 12) { // 12.345.678-9 is 12 chars
            setRut(formatted);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateRut(rut)) {
            setError('RUT inválido. Ejemplo: 12.345.678-9');
            return;
        }
        setError('');

        try {
            const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
            const cleanWithDash = clean.slice(0, -1) + '-' + clean.slice(-1);
            await registerUser(cleanWithDash);
            alert('¡Registro exitoso! Bienvenido.');
            navigate('/');
        } catch (err: any) {
            console.error(err);
            setError('Error al registrar usuario: ' + (err.message || 'Intente nuevamente'));
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
            <img
                src="./img/logo.png"
                alt="Tecnopan Logo"
                className="logo"
                onClick={handleLogoClick}
                style={{ cursor: 'default', userSelect: 'none' }}
            />
            <h2>Crea o ingresa a tu Tarjeta</h2>
            <p style={{ opacity: 0.7 }}>Ingresa tu RUT para crear o acceder a tu tarjeta digital.</p>
            <br />
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label style={{ display: 'block', textAlign: 'left', marginBottom: '5px' }}>RUT:</label>
                    <input
                        type="text"
                        value={rut}
                        onChange={handleRutChange}
                        placeholder="12.345.678-9"
                        style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc' }}
                        autoFocus
                    />
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit" style={{ padding: '14px', background: 'var(--card-bg)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold' }}>
                    Ir a la tarjeta
                </button>
            </form>
            <button
                type="button"
                onClick={() => setShowInfo(true)}
                style={{
                    display: 'block',
                    justifyContent: 'center',
                    marginTop: '5px',
                    background: 'transparent',
                    color: 'var(--card-bg)',
                    border: '1px solid var(--card-bg)',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    width: '100%'
                }}
            >
                ¿Cómo funciona?
            </button>

            {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
        </div>
    );
};

export default RegisterView;
