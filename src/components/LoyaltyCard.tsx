import React, { useState, useEffect } from 'react';
import { useLoyalty } from '../hooks/useLoyalty';
import QRCode from 'react-qr-code';
import InfoModal from './InfoModal';

const LoyaltyCard = () => {
    const { visits, user, visits_history } = useLoyalty();
    const [showInfo, setShowInfo] = useState(false);
    const prevVisits = React.useRef(visits);
    const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
    const qrRef = React.useRef<HTMLDivElement>(null);

    // Convert SVG QR code to a PNG Data URL to prevent forced dark mode color inversion
    useEffect(() => {
        const convertSvgToPng = () => {
            const svgEl = qrRef.current?.querySelector('svg');
            if (!svgEl) return;

            try {
                const svgString = new XMLSerializer().serializeToString(svgEl);
                const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(svgBlob);

                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const scale = 4; // Use scale to keep the image sharp
                    const size = 150 * scale;
                    const padding = 6 * scale; // Quiet zone margin to ensure readability
                    const qrSize = size - (padding * 2);

                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, size, size);
                        ctx.drawImage(img, padding, padding, qrSize, qrSize);
                        try {
                            const pngUrl = canvas.toDataURL('image/png');
                            setQrImageUrl(pngUrl);
                        } catch (err) {
                            console.error("Failed to generate PNG from QR code SVG", err);
                        }
                    }
                    URL.revokeObjectURL(url);
                };
                img.onerror = (err) => {
                    console.error("Image load error during QR conversion", err);
                    URL.revokeObjectURL(url);
                };
                img.src = url;
            } catch (e) {
                console.error("Error serializing SVG or generating blob", e);
            }
        };

        // Small delay to ensure the SVG template is fully rendered in the DOM
        const timer = setTimeout(convertSvgToPng, 150);
        return () => clearTimeout(timer);
    }, [user?.id]);

    // Initialize ref on mount to current visits to avoid invalid "new visit" detection
    useEffect(() => {
        prevVisits.current = visits;
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            const target = document.getElementById('target-step');
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 300); // Small delay to ensure render is complete
        return () => clearTimeout(timer);
    }, [visits]);

    // Request notification permission and handle notifications
    useEffect(() => {
        try {
            const WinNotif = (window as any).Notification;
            if (WinNotif && WinNotif.permission === 'default' && typeof WinNotif.requestPermission === 'function') {
                WinNotif.requestPermission().catch(() => { });
            }
        } catch (e) {
            console.warn("Notification permission request failed or rejected by browser.");
        }
    }, []);

    useEffect(() => {
        // Only trigger if visits count INCREASED
        const currentVisits = Number(visits);
        const previousVisits = Number(prevVisits.current);

        if (currentVisits > previousVisits) {
            // Milestone alerts (wrapped in setTimeout to avoid blocking render/notifications)
            setTimeout(() => {
                switch (currentVisits) {
                    case 4:
                        alert('¡Ánimo! Tu próxima visita incluye un 15% OFF.');
                        break;
                    case 5:
                        alert('¡Felicidades! Has completado 5 visitas. ¡Disfruta tu 15% OFF!');
                        break;
                    case 9:
                        alert('¡Ya casi! Tu próxima visita incluye un 25% OFF.');
                        break;
                    case 10:
                        alert('¡Increíble! Has completado 10 visitas. ¡Reclama tu 25% OFF!');
                        break;
                }
            }, 100);

            // Web Notifications (PWA compatible)
            try {
                const WinNotif = (window as any).Notification;
                if ('serviceWorker' in navigator && WinNotif && WinNotif.permission === 'granted') {
                    let body = `¡Visita #${currentVisits} registrada!`;

                    if (currentVisits === 4) {
                        body += ' ¡Tu próxima visita incluye un 15% OFF!';
                    } else if (currentVisits === 5) {
                        body = '¡Has ganado 15% OFF en tu compra!';
                    } else if (currentVisits === 9) {
                        body += ' ¡Tu próxima visita incluye un 25% OFF!';
                    } else if (currentVisits === 10) {
                        body = '¡Has ganado 25% OFF! ¡Gracias por tu preferencia!';
                    }

                    navigator.serviceWorker.ready.then(registration => {
                        registration.showNotification('Tecnopan', {
                            body,
                            icon: './img/logo.png',
                            badge: './img/logo.png',
                            vibrate: [200, 100, 200]
                        } as any).catch(err => console.warn("ServiceWorker showNotification failed:", err));
                    });
                }
            } catch (e) {
                console.warn("Notification system unavailable or threw error:", e);
            }
        }

        // Update ref after processing
        prevVisits.current = visits;
    }, [visits]);

    // Memoize sorted history to ensure consistency and avoid re-sorting on every render/map call
    const sortedHistory = React.useMemo(() => {
        if (!visits_history) return [];
        return [...visits_history].sort((a, b) =>
            new Date(a.scanned_at).getTime() - new Date(b.scanned_at).getTime()
        );
    }, [visits_history]);

    // Simplified state: highlights only for new visits (handled by visit count ref)
    const [highlightedVisitId, setHighlightedVisitId] = useState<string | null>(null);

    // Track new visits to highlight them
    useEffect(() => {
        if (visits > prevVisits.current && sortedHistory.length > 0) {
            const lastRecord = sortedHistory[sortedHistory.length - 1];
            if (lastRecord && lastRecord.id) {
                setHighlightedVisitId(lastRecord.id);
                setTimeout(() => setHighlightedVisitId(null), 2000);
            }
        }
    }, [visits, sortedHistory]);


    // Helper to get formatted date
    const getHistoryText = (idx: number) => {
        const record = sortedHistory[idx];
        if (!record) return '';

        return new Date(record.scanned_at).toLocaleDateString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <>
            <div className="loyalty-card">
                <div className="card-header">
                    <div className="header-box">
                        <button onClick={() => setShowInfo(true)} className="info-btn" title="Ayuda">?</button>
                        <div style={{ position: 'relative' }}>
                            <img src="./img/logo.png" alt="Tecnopan Logo" className="logo" />
                        </div>
                        <div className="qr-box">
                            <div className="qr-white-bg">
                                {qrImageUrl ? (
                                    <img
                                        src={qrImageUrl}
                                        alt="QR Code"
                                        style={{ width: "90px", height: "90px", display: "block" }}
                                    />
                                ) : (
                                    <div style={{ width: "90px", height: "90px", display: "flex", alignItems: "center", justifyContent: "center", color: "#333", fontSize: "10px" }}>
                                        Cargando...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <p className="greeting">
                        ¡Hola! Visítanos para obtener más sellos.
                    </p>
                </div>

                <div className="scroll-area" id="scroll-container">
                    <div className="stepper">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((step) => {
                            const isCompleted = step <= visits;
                            const isCurrent = step === visits + 1;
                            const status = isCompleted ? 'completed' : isCurrent ? 'current' : '';
                            const isMilestone = step === 5 || step === 10;

                            // Check highlight
                            const record = isCompleted ? sortedHistory[step - 1] : null;
                            const isHighlighted = record && record.id === highlightedVisitId;
                            const highlightClass = isHighlighted ? 'highlight-update' : '';

                            if (isMilestone) {
                                return (
                                    <div className={`step-item milestone ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${highlightClass}`} id={isCurrent ? "target-step" : ""} key={step}>
                                        {isCurrent && <div className="step-highlight"></div>}
                                        <div className="circle">{step === 5 ? '🎁' : '⭐'}</div>
                                        <div className="content">
                                            <div className="label">Visita {step}</div>
                                            {isCompleted ? (
                                                <>
                                                    <span className="reward-text claimed">{step === 5 ? '15%' : '25%'} OFF RECLAMADO</span>
                                                    <span className="date-text">{getHistoryText(step - 1)}</span>
                                                </>
                                            ) : (
                                                <span className="reward-text">{step === 5 ? 'Premio: 15% OFF' : 'META: 25% OFF'}</span>
                                            )}
                                            {isCurrent && <span className="current-badge">Próxima visita</span>}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div className={`step-item ${status} ${highlightClass}`} id={status === 'current' ? "target-step" : ""} key={step}>
                                    {status === 'current' && <div className="step-highlight"></div>}
                                    <div className="circle-container">
                                        <div className="circle">{status === 'completed' ? '✓' : step}</div>
                                    </div>
                                    <div className="content">
                                        <div className="label">Visita {step}</div>
                                        {isCompleted && <span className="date-text">{getHistoryText(step - 1)}</span>}
                                        {isCurrent && <span className="current-badge">Próxima visita</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
            </div>

            {/* Hidden offscreen QR Code template used to generate the PNG image */}
            <div ref={qrRef} style={{ position: 'absolute', left: '-9999px', top: '-9999px', visibility: 'hidden' }} aria-hidden="true">
                <QRCode
                    value={user ? user.id : 'DEMO'}
                    size={90}
                    viewBox="0 0 256 256"
                />
            </div>
        </>
    );
};

export default LoyaltyCard;
