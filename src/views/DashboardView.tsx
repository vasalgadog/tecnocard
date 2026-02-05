import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoyalty } from '../hooks/useLoyalty';
import type { DashboardMetrics } from '../types';

const DashboardView = () => {
    const { fetchDashboardMetrics } = useLoyalty();
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const navigate = useNavigate();

    const loadMetrics = async () => {
        setIsLoading(true);
        try {
            const data = await fetchDashboardMetrics();
            setMetrics(data);
            setLastRefresh(new Date());
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadMetrics();
        const interval = setInterval(loadMetrics, 60000); // Auto refresh every 60s
        return () => clearInterval(interval);
    }, []);

    if (isLoading && !metrics) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>📊 Cargando Dashboard...</div>;
    }

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', background: '#f8f9fa', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <button onClick={() => navigate('/tecnoscan')} style={{ background: 'none', border: 'none', color: '#666', fontSize: '1.2rem', cursor: 'pointer' }}>←</button>
                <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Dashboard de Negocio</h1>
                <button onClick={loadMetrics} style={{ background: 'none', border: 'none', color: 'var(--card-bg)', cursor: 'pointer' }}>🔄</button>
            </div>


            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>Total Tarjetas</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{metrics?.total_cards}</div>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>Visitas Hoy</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--card-bg)' }}>{metrics?.visits_today}</div>
                </div>
            </div>

            <section style={{ marginBottom: '30px' }}>
                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Distribución de Clientes</h3>
                <div style={{ display: 'grid', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f9fafb', borderRadius: '8px', borderLeft: '4px solid #666' }}>
                        <span>Nuevos y Activos (0-4 visitas)</span>
                        <strong>{metrics?.levels["0_4"]}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#fef3c7', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                        <span>🎁 Nivel Premio (5 visitas)</span>
                        <strong>{metrics?.levels["5"]}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f9fafb', borderRadius: '8px', borderLeft: '4px solid #666' }}>
                        <span>Avanzados (6-9 visitas)</span>
                        <strong>{metrics?.levels["6_9"]}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#ecfdf5', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                        <span>⭐ Completados (10 visitas)</span>
                        <strong>{metrics?.levels["10"]}</strong>
                    </div>
                </div>
            </section>

            <section>
                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Metas alcanzadas hoy</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div style={{ background: '#fffbeb', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #f59e0b' }}>
                        <div style={{ fontSize: '0.8rem', color: '#92400e' }}>Alcanzaron 15% OFF</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{metrics?.milestones_today["5"]}</div>
                    </div>
                    <div style={{ background: '#ecfdf5', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
                        <div style={{ fontSize: '0.8rem', color: '#065f46' }}>Alcanzaron 25% OFF</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{metrics?.milestones_today["10"]}</div>
                    </div>
                </div>
            </section>

            <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '0.8rem', color: '#999' }}>
                Actualizado: {lastRefresh.toLocaleTimeString()}
            </div>
        </div>
    );
};

export default DashboardView;
