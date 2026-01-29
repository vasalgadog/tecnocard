import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { useLoyalty } from '../hooks/useLoyalty';

import { supabase } from '../supabase';

const ScannerView = () => {
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [amount, setAmount] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastVisit, setLastVisit] = useState<{ amount: number; date: string } | null>(null);
    const [isLoadingVisit, setIsLoadingVisit] = useState(false);
    const navigate = useNavigate();
    const { registerVisit, removeLastVisit, modifyLastVisit } = useLoyalty();
    const [action, setAction] = useState<'menu' | 'register' | 'modify' | 'remove'>('menu');

    useEffect(() => {
        if (action === 'modify' && scanResult) {
            setLastVisit(null); // Clear previous
            setIsLoadingVisit(true);

            // Fetch last visit
            const fetchLastVisit = async () => {
                try {
                    // Optimized: RPC now accepts QR code directly
                    const { data, error } = await supabase.rpc('get_last_visit_by_card', {
                        p_qr_code: scanResult
                    });

                    if (error) {
                        console.error(error);
                    } else {
                        const visitData = Array.isArray(data) ? data[0] : data;
                        if (visitData && visitData.amount_paid) {
                            setLastVisit({
                                amount: visitData.amount_paid,
                                date: visitData.scanned_at || new Date().toISOString()
                            });
                        }
                    }
                } catch (e) {
                    console.error("Error fetching last visit", e);
                } finally {
                    setIsLoadingVisit(false);
                }
            };
            fetchLastVisit();
        }
    }, [action, scanResult]);

    useEffect(() => {
        if (scanResult) return;
        setAction('menu'); // Reset action on new scan
        setLastVisit(null);
        setIsLoadingVisit(false);
        // ... existing scanner simple-setup ...
        let scanner: Html5QrcodeScanner | null = null;
        let timer: ReturnType<typeof setTimeout>;

        timer = setTimeout(() => {
            if (!document.getElementById("reader") || scanResult) return;

            scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            );

            scanner.render(onScanSuccess, onScanFailure);
        }, 100);

        function onScanSuccess(decodedText: string, _decodedResult: any) {
            if (scanner) {
                scanner.clear();
            }
            setScanResult(decodedText);
        }

        function onScanFailure(_error: any) { }

        return () => {
            clearTimeout(timer);
            if (scanner) {
                try {
                    scanner.clear().catch(error => {
                        console.error("Failed to clear html5-qrcode scanner. ", error);
                    });
                } catch (e) { /* ignore */ }
            }
        };
    }, [scanResult]);

    const handleAction = async () => {
        if (!scanResult) return;
        setIsProcessing(true);

        try {
            let success = false;
            if (action === 'register') {
                success = await registerVisit(scanResult, parseInt(amount, 10));
            } else if (action === 'modify') {
                success = await modifyLastVisit(scanResult, parseInt(amount, 10));
            } else if (action === 'remove') {
                success = await removeLastVisit(scanResult);
            }

            if (success) {
                setTimeout(() => {
                    setScanResult(null);
                    setAmount('');
                    setAction('menu');
                    setIsProcessing(false);
                    setLastVisit(null);
                    alert("Acción realizada exitosamente");
                }, 800);
            } else {
                setIsProcessing(false);
                alert("Error al realizar la acción");
            }
        } catch (e) {
            setIsProcessing(false);
            console.error(e);
        }
    };

    const renderActionContent = () => {
        if (action === 'menu') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                    <button onClick={() => setAction('register')} className="action-btn primary">✨ Registrar visita</button>
                    <button onClick={() => setAction('modify')} className="action-btn secondary">✏️ Modificar última</button>
                    <button onClick={() => setAction('remove')} className="action-btn danger">🗑️ Eliminar última</button>
                    <button onClick={() => setScanResult(null)} style={{ background: 'transparent', color: '#666', border: 'none', marginTop: '10px' }}>Volver a escanear</button>
                </div>
            );
        }

        return (
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleAction();
                }}
                className="success-message"
                style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
            >
                <h3>{action === 'register' ? 'Nueva Visita' : action === 'modify' ? 'Modificar Última' : 'Confirmar Eliminación'}</h3>

                {action === 'modify' && (
                    <>
                        {isLoadingVisit && (
                            <div style={{ color: '#666', fontStyle: 'italic', padding: '10px' }}>
                                ⏳ Buscando último registro...
                            </div>
                        )}
                        {!isLoadingVisit && lastVisit && (
                            <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '6px', fontSize: '0.9em', color: '#854d0e' }}>
                                <div><strong>Último registro detectado:</strong></div>
                                <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>${lastVisit.amount.toLocaleString()}</div>
                                <div>{new Date(lastVisit.date).toLocaleString()}</div>
                            </div>
                        )}
                    </>
                )}

                {action !== 'remove' && (
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Valor ($):</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Ingrese monto (ej: 5000)"
                            style={{ padding: '12px', width: '100%', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc' }}
                            autoFocus
                        />
                    </div>
                )}

                {action === 'remove' && <p>¿Estás seguro que deseas eliminar la última visita registrada?</p>}

                <button
                    type="submit"
                    disabled={(action !== 'remove' && !amount) || isProcessing}
                    style={{ padding: '14px', background: action === 'remove' ? '#ef4444' : 'var(--card-bg)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    {isProcessing ? 'Procesando...' : 'Confirmar'}
                </button>
                <button type="button" onClick={() => setAction('menu')} style={{ background: 'none', border: 'none', color: '#666' }}>Cancelar</button>
            </form>
        );
    };

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Escanear Código QR</h2>
            {scanResult ? (
                renderActionContent()
            ) : (
                <div id="reader" style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}></div>
            )}
            {!scanResult && (
                <>
                    <br />
                    <button onClick={() => navigate('/')}>Cancelar / Volver</button>
                </>
            )}
        </div>
    );
};

export default ScannerView;
