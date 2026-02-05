import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { useLoyalty } from '../hooks/useLoyalty';

import { supabase } from '../supabase';

const ScannerView = () => {
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentVisits, setCurrentVisits] = useState<number | null>(null);
    const [isLoadingCard, setIsLoadingCard] = useState(false);
    const navigate = useNavigate();
    const { registerVisit, removeLastVisit } = useLoyalty();
    const [highlight, setHighlight] = useState(false);

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

    useEffect(() => {
        if (scanResult) return;
        setCurrentVisits(null);

        let scanner: Html5QrcodeScanner | null = null;
        let timer: ReturnType<typeof setTimeout>;

        timer = setTimeout(() => {
            if (!document.getElementById("reader") || scanResult) return;

            scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: 150, aspectRatio: 1.777778, supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA], showTorchButtonIfSupported: true },
                false
            );

            scanner.render(onScanSuccess, onScanFailure);
        }, 100);

        function onScanSuccess(decodedText: string) {
            if (scanner) {
                scanner.clear().catch(() => { });
            }
            setScanResult(decodedText);
        }

        function onScanFailure() { }

        return () => {
            clearTimeout(timer);
            if (scanner) {
                try {
                    scanner.clear().catch(() => { });
                } catch (e) { /* ignore */ }
            }
        };
    }, [scanResult]);

    const handleRegister = async () => {
        if (!scanResult) return;
        setIsProcessing(true);
        const success = await registerVisit(scanResult);
        if (success) {
            setHighlight(true);
            setCurrentVisits(prev => (prev !== null ? prev + 1 : 1));
            setTimeout(() => {
                setHighlight(false);
                setScanResult(null);
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
            setScanResult(null);
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
                        {isProcessing ? 'Procesando...' : '✨ Sellar Tarjeta'}
                    </button>

                    <button
                        onClick={handleDelete}
                        disabled={isProcessing || (currentVisits !== null && currentVisits <= 0)}
                        className="action-btn danger"
                        style={{ padding: '10px' }}
                    >
                        🗑️ Eliminar última
                    </button>
                </div>

                <button onClick={() => setScanResult(null)} style={{ background: 'transparent', color: '#666', border: 'none', marginTop: '10px' }}>Volver a escanear</button>
            </div>
        );
    };

    return (
        <div style={{ padding: '20px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#666' }}>← Salir</button>
                <button onClick={() => navigate('/dashboard')} className="dashboard-link" style={{
                    background: '#cd853f',
                    color: 'white',
                    border: 'none',
                    padding: '8px 15px',
                    borderRadius: '20px',
                    fontSize: '0.9rem'
                }}>📊 Dashboard</button>
            </div>

            <h2>Scanner de Personal</h2>

            {scanResult ? (
                renderScanContent()
            ) : (
                <div id="reader" style={{ width: '100%' }}></div>
            )}
        </div >
    );
};


export default ScannerView;
