import React from 'react';
import { useLoyalty } from '../hooks/useLoyalty';

interface InfoModalProps {
    onClose: () => void;
}

const InfoModal = ({ onClose }: InfoModalProps) => {
    const { logout, user } = useLoyalty();

    const handleLogout = () => {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            logout();
            onClose();
        }
    };
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>¿Cómo funciona?</h3>
                <p>Para obtenerla, debes haber realizado una compra de $5.000 o más.</p>
                <p>Si compras sobre $1.500, pide a la persona de la caja que escanee el código QR de tu tarjeta digital.</p>
                <p>Cada vez que se escanee, irás acumulado visitas.</p>
                <p>En tu visita número 5, tendrás un <b>descuento del 15% en el total de tu boleta</b>.</p>
                <p>En tu visita número 10, tendrás un <b>descuento del 25% en el total de tu boleta</b>.</p>
                <button onClick={onClose} className="close-btn">Entendido</button>
                {user && (
                    <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                        <button
                            onClick={handleLogout}
                            style={{
                                background: 'transparent',
                                color: '#999',
                                border: '1px solid #ddd',
                                borderRadius: '20px',
                                padding: '8px 16px',
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                            }}
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InfoModal;
