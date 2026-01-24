import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { useLoyalty } from '../hooks/useLoyalty';

const ScannerView = () => {
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [amount, setAmount] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const navigate = useNavigate();
    const { registerVisit } = useLoyalty();

    useEffect(() => {
        if (scanResult) return;

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

    const handleRegister = async () => {
        if (!scanResult || !amount) return;
        setIsProcessing(true);
        const amountNum = parseInt(amount, 10);

        try {
            await registerVisit(scanResult, amountNum);
            setTimeout(() => {
                setScanResult(null);
                setAmount('');
                setIsProcessing(false);
                alert("Visita registrada exitosamente");
            }, 1000);
        } catch (e) {
            setIsProcessing(false);
            console.error(e);
        }
    };

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Escanear Código QR</h2>
            {scanResult ? (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleRegister();
                    }}
                    className="success-message"
                    style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
                >
                    <h3>Código Detectado</h3>
                    <p style={{ opacity: 0.7, wordBreak: 'break-all' }}>{scanResult}</p>

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

                    <button
                        type="submit"
                        disabled={!amount || isProcessing}
                        style={{ padding: '14px', background: 'var(--card-bg)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        {isProcessing ? 'Registrando...' : 'Confirmar Visita'}
                    </button>
                </form>
            ) : (
                <div id="reader" style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}></div>
            )}
            <br />
            <button onClick={() => navigate('/')}>Cancelar / Volver</button>
        </div>
    );
};

export default ScannerView;
