import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

const RutSearchView = () => {
    const [rutInput, setRutInput] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const navigate = useNavigate();

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
            setRutInput(formatted);
        }
    };

    const handleSearch = async () => {
        if (!rutInput.trim()) return;

        if (!validateRut(rutInput)) {
            alert('RUT inválido. Ejemplo: 12.345.678-9');
            return;
        }

        setIsSearching(true);
        try {
            const clean = rutInput.replace(/[^0-9kK]/g, '').toUpperCase();
            const cleanWithDash = clean.slice(0, -1) + '-' + clean.slice(-1);

            const { data, error } = await supabase.rpc('get_visits_by_rut', {
                p_rut: cleanWithDash
            });

            if (error || !data || (Array.isArray(data) && data.length === 0)) {
                alert("RUT no encontrado o sin tarjeta asociada.");
            } else {
                const card = Array.isArray(data) ? data[0] : data;
                if (card && card.qr_code) {
                    // Navigate back to scanner with the resolved QR code
                    navigate('/tecnoscan', { state: { resolvedQrCode: card.qr_code } });
                } else {
                    alert("Error: Tarjeta encontrada pero sin código QR válido.");
                }
            }
        } catch (e) {
            console.error("Search error", e);
            alert("Error de conexión al buscar RUT.");
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div style={{
            background: '#e5e7eb',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '20px 0'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '340px',
                background: 'white',
                borderRadius: '20px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
            }}>
                {/* Topbar */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '15px 20px',
                    borderBottom: '1px solid #f0f0f0'
                }}>
                    <button onClick={() => navigate('/tecnoscan')} className="nav-link-btn">
                        ← Volver al scanner
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '20px', textAlign: 'center', height: '450px' }}>
                    <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem' }}>
                        Buscar Cliente
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <input
                            type="text"
                            placeholder="Ej. 12.345.678-9"
                            value={rutInput}
                            onChange={handleRutChange}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            disabled={isSearching}
                            style={{
                                padding: '12px',
                                fontSize: '1rem',
                                borderRadius: '8px',
                                border: '1px solid #ddd'
                            }}
                        />
                        <button
                            onClick={handleSearch}
                            disabled={isSearching || !rutInput.trim()}
                            className="action-btn primary"
                        >
                            {isSearching ? 'Buscando...' : '🔍 Buscar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RutSearchView;
