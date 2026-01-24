import React from 'react';

interface InfoModalProps {
    onClose: () => void;
}

const InfoModal = ({ onClose }: InfoModalProps) => {
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
                <br /><br />
            </div>
        </div>
    );
};

export default InfoModal;
