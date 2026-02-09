import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLoyalty } from '../hooks/useLoyalty';

import { supabase } from '../supabase';

const ScannerView = () => {
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentVisits, setCurrentVisits] = useState<number | null>(null);
    const [isLoadingCard, setIsLoadingCard] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { registerVisit, removeLastVisit } = useLoyalty();
    const [highlight, setHighlight] = useState(false);

    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    // Check for resolved QR code from RUT search
    useEffect(() => {
        const state = location.state as { resolvedQrCode?: string } | null;
        if (state?.resolvedQrCode) {
            setScanResult(state.resolvedQrCode);
            // Clear the state to prevent re-triggering
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    // Fetch card status on scan
    useEffect(() => {
        if (scanResult) {
            setIsLoadingCard(true);
            const fetchStatus = async () => {
                try {
                    const { data, error } = await supabase.rpc('get_visits_by_card', {
                        p_qr_code: scanResult
                    });
                    if (!error && data) {
                        const card = Array.isArray(data) ? data[0] : data;
                        setCurrentVisits(card.visits ?? 0);
                    }
                } catch (e) {
                    console.error("Error fetching card", e);
                } finally {
                    setIsLoadingCard(false);
                }
            };
            fetchStatus();
        }
    }, [scanResult]);

    // Scanner lifecycle - mount on entry, unmount on exit
    useEffect(() => {
        // Don't initialize scanner if we already have a scan result
        if (scanResult) {
            setCurrentVisits(null);
            return;
        }

        // Initialize scanner
        let timer: ReturnType<typeof setTimeout>;

        timer = setTimeout(() => {
            const readerElement = document.getElementById("reader");
            if (!readerElement || scannerRef.current) return;

            scannerRef.current = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: 250, aspectRatio: 1.777778, supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA], showTorchButtonIfSupported: true },
                false
            );

            scannerRef.current.render(onScanSuccess, onScanFailure);
        }, 100);

        function onScanSuccess(decodedText: string) {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(() => { });
                scannerRef.current = null;
            }
            setScanResult(decodedText);
        }

        function onScanFailure() { }

        return () => {
            clearTimeout(timer);
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear().catch(() => { });
                } catch (e) { /* ignore */ }
                scannerRef.current = null;
            }
        };
    }, [scanResult]);

    const resetScanner = () => {
        setScanResult(null);
    };

    const handleRegister = async () => {
        if (!scanResult) return;
        setIsProcessing(true);
        const success = await registerVisit(scanResult);
        if (success) {
            setHighlight(true);
            setCurrentVisits(prev => (prev !== null ? prev + 1 : 1));
            alert("Visita registrada con éxito");
            setTimeout(() => {
                setHighlight(false);
                resetScanner();
                setIsProcessing(false);
            }, 1500);
        } else {
            setIsProcessing(false);
            alert("Error al registrar visita o límite alcanzado");
        }
    };

    const handleDelete = async () => {
        if (!scanResult) return;
        if (!window.confirm("¿Estás seguro que deseas eliminar la última visita?")) return;

        setIsProcessing(true);
        const success = await removeLastVisit(scanResult);
        if (success) {
            setCurrentVisits(prev => (prev !== null ? Math.max(0, prev - 1) : 0));
            alert("Visita eliminada");
            // Don't auto-close on delete, user might want to verify
        } else {
            alert("Error al eliminar visita");
        }
        setIsProcessing(false);
    };

    const renderScanContent = () => {
        if (isLoadingCard) {
            return <div className="loading">Cargando datos de la tarjeta...</div>;
        }

        return (
            <div className="action-menu" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                <div className={`visit-status-card ${highlight ? 'highlight-update' : ''}`} style={{
                    padding: '20px',
                    background: highlight ? '#fef3c7' : '#f3f4f6',
                    borderRadius: '12px',
                    transition: 'all 0.3s ease'
                }}>
                    <h3 style={{ margin: 0 }}>Visitas: <span style={{ color: 'var(--card-bg)', fontSize: '1.5em' }}>{currentVisits ?? 0}</span> / 10</h3>
                </div>

                <div style={{ display: 'grid', gap: '10px' }}>
                    <button
                        onClick={handleRegister}
                        disabled={isProcessing || (currentVisits !== null && currentVisits >= 10)}
                        className="action-btn primary"
                        style={{ padding: '15px', fontSize: '1.1rem' }}
                    >
                        {isProcessing ? 'Procesando...' : '✨ Registrar Visita'}
                    </button>

                    <button
                        onClick={handleDelete}
                        disabled={isProcessing || (currentVisits !== null && currentVisits <= 0)}
                        className="action-btn danger"
                        style={{ padding: '10px' }}
                    >
                        🗑️ Eliminar última visita
                    </button>
                </div>

                <button onClick={resetScanner} style={{ background: 'transparent', color: '#666', border: 'none', marginTop: '10px' }}>Volver a escanear</button>
            </div>
        );
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
                    {scanResult ? (
                        <button onClick={resetScanner} className="nav-link-btn">← Volver al scanner</button>
                    ) : (
                        <button onClick={() => navigate('/')} className="nav-link-btn">← Salir</button>
                    )}

                    {!scanResult && (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <button onClick={() => navigate('/tecnoscan/con-rut')} className="scan-mode-btn">
                                ⌨️ Con RUT
                            </button>
                            <button onClick={() => navigate('/dashboard')} style={{
                                background: '#cd853f',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}>
                                📊 Dashboard
                            </button>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div style={{ padding: '20px', textAlign: 'center', height: '450px' }}>
                    <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem' }}>
                        {scanResult ? 'Gestionar Visitas' : 'Escanear tarjeta'}
                    </h2>

                    {scanResult ? (
                        renderScanContent()
                    ) : (
                        <div id="reader" style={{ width: '100%' }}></div>
                    )}
                </div>
            </div>
        </div>
    );
};


export default ScannerView;
