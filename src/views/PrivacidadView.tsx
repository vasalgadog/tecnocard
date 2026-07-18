import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacidadView = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            padding: '20px',
            maxWidth: '1280px',
            margin: '0 auto',
            textAlign: 'left',
            boxSizing: 'border-box',
            fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"
        }}>
            <button
                type="button"
                onClick={() => navigate('/register')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '12px 20px',
                    marginBottom: '20px',
                    background: 'transparent',
                    color: 'var(--card-bg)',
                    border: '2px solid var(--card-bg)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: 'none'
                }}
            >
                ← Volver
            </button>

            <div style={{
                background: 'white',
                padding: '24px',
                borderRadius: '20px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
                color: '#333'
            }}>
                <h2 style={{
                    color: 'var(--card-bg)',
                    marginTop: 0,
                    marginBottom: '15px',
                    fontSize: '22px',
                    fontWeight: 'bold',
                    textAlign: 'center'
                }}>
                    Política de Privacidad
                </h2>
                <p style={{ fontSize: '13px', opacity: 0.7, marginBottom: '20px', textAlign: 'center' }}>
                    Última actualización: Julio 2026
                </p>

                <div style={{ fontSize: '14px', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <strong style={{ display: 'block', marginBottom: '4px', color: '#111' }}>1. Responsable del Tratamiento</strong>
                        <span>Tecnocard (gestor de beneficios de Tecnopan operada por Valentín Salgado [<a href="mailto:valentin.salgadog+tecnocard@gmail.com" style={{ color: '#8b8a8aff' }}>valentin.salgadog+tecnocard@gmail.com</a>]) es el responsable del tratamiento de los datos recopilados a través de esta plataforma digital. </span>
                    </div>

                    <div>
                        <strong style={{ display: 'block', marginBottom: '4px', color: '#111' }}>2. Datos Recopilados</strong>
                        <span>En conformidad con el artículo correspondiente a las fuentes de licitud de la Ley N° 21.719, el tratamiento de tus datos se fundamenta exclusivamente en tu consentimiento expreso, específico e informado, el cual otorgas de manera voluntaria al marcar la casilla de aceptación al momento del registro.</span>
                        <br></br>
                        <span>Bajo el principio de Minimización de Datos, Tecnocard solo recolecta un único dato personal:</span>
                        <ul style={{ paddingLeft: '20px', marginTop: '5px', marginBottom: 0 }}>
                            <li><b>Rol Único Nacional (RUT):</b> Tratado únicamente de forma numérica o textual para indexar tu perfil de cliente. No recolectamos, vinculamos ni almacenamos nombres, correos, datos biométricos ni contraseñas.</li>
                        </ul>
                    </div>

                    <div>
                        <strong style={{ display: 'block', marginBottom: '4px', color: '#111' }}>3. Finalidad del Uso</strong>
                        <span>Tu RUT será tratado de manera exclusiva para las siguientes finalidades explícitas y legítimas, quedando estrictamente prohibido cualquier tratamiento posterior incompatible:</span>
                        <ul style={{ paddingLeft: '20px', marginTop: '5px', marginBottom: 0 }}>
                            <li><b>Gestión del Programa de Fidelización</b>: Permitir al comercio asociado (Tecnopan) registrar tus visitas, acumular sellos o aplicar los beneficios correspondientes a tu cuenta cuando le dictes tu RUT al cajero o este sea leído en la aplicación.</li>
                            <li><b>Autenticación y Consulta Segura</b>: Permitir que tú, como titular del dato, ingreses tu RUT en la aplicación web para consultar de forma directa el estado de tus tarjetas de fidelización activas.</li>
                        </ul>
                    </div>

                    <div>
                        <strong style={{ display: 'block', marginBottom: '4px', color: '#111' }}>4. Medidas de Seguridad y Deber de Confidencialidad</strong>
                        <span>Dando estricto cumplimiento a los estándares de seguridad exigidos por la Ley N° 21.719, Tecnocard implementa medidas técnicas y organizativas proporcionales para garantizar la confidencialidad, integridad y disponibilidad del dato:</span>
                        <ul style={{ paddingLeft: '20px', marginTop: '5px', marginBottom: 0 }}>
                            <li><b>Cifrado en Tránsito</b>: Todo intercambio de datos viaja de forma segura mediante protocolo criptográfico HTTPS.</li>
                            <li><b>Aislamiento y Control de Acceso (RLS)</b>: Los datos se gestionan en servidores seguros utilizando políticas de seguridad a nivel de fila (Row Level Security), impidiendo de manera absoluta que terceros o scripts externos realicen consultas masivas o expongan la base de datos completa.</li>
                            <li><b>Deber de Secreto</b>: Tanto el administrador de Tecnocard como el personal autorizado de los locales comerciales están sujetos a un estricto deber de confidencialidad respecto al RUT de los usuarios.</li>
                        </ul>
                    </div>

                    <div>
                        <strong style={{ display: 'block', marginBottom: '4px', color: '#111' }}>5. Plazo de Retención de los Datos</strong>
                        <span>Tu RUT será conservado en nuestros sistemas únicamente mientras se mantenga activa la relación de fidelización con el o los comercios asociados. Si la cuenta permanece inactiva por un periodo prolongado o si el titular revoca su consentimiento, el dato será bloqueado y eliminado definitivamente de nuestros servidores de forma segura.</span>
                    </div>

                    <div>
                        <strong style={{ display: 'block', marginBottom: '4px', color: '#111' }}>6. Derechos del Titular</strong>
                        <span>La Ley N° 21.719 te garantiza el pleno ejercicio de tus derechos sobre tus datos personales. Puedes solicitar en cualquier momento:</span>
                        <ul style={{ paddingLeft: '20px', marginTop: '5px', marginBottom: 0 }}>
                            <li><b>Acceso y Portabilidad</b>: Conocer y obtener copia de la información tratada.</li>
                            <li><b>Rectificación</b>: Corregir inexactitudes en el RUT ingresado.</li>
                            <li><b>Eliminación</b>: Solicitar el borrado total de tu RUT del sistema, lo cual revocará inmediatamente tu participación en el programa de fidelización y la pérdida de tus beneficios en el local.</li>
                            <li><b>Revocación del Consentimiento</b>: Dejar sin efecto la autorización otorgada para el tratamiento del dato, y con ello, dejar de ser parte del programa.</li>
                        </ul>
                        <span>Para ejercer estos derechos, de forma gratuita y expedita, puedes enviar una solicitud al correo electrónico <a href="mailto:valentin.salgadog+tecnocard@gmail.com" style={{ color: '#8b8a8aff' }}>valentin.salgadog+tecnocard@gmail.com</a> con el asunto "Derechos Ley 21.719 - Tecnocard" y detallando qué derechos deseas ejercer, o comunicarte con algún cajero de la sucursal para iniciar la solicitud, dejando tu RUT y correo electrónico para comunicar la respuesta.</span>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default PrivacidadView;
