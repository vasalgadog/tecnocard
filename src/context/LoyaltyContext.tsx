import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import type { LoyaltyContextType, User, DashboardMetrics } from '../types';
import { supabase } from '../supabase';

import { useNavigate } from 'react-router-dom';
import { generateUUID } from '../utils/helpers';

export const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

export const LoyaltyProvider = ({ children }: { children: ReactNode }) => {
    const DATA_VERSION = 'v5';
    const [isSyncing, setIsSyncing] = useState(false);
    const [localToken, setLocalToken] = useState<string | null>(null);
    const navigate = useNavigate();

    // Capture localToken from URL on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('localToken');
            if (token) {
                // Save token
                setLocalToken(token);
                // Clean URL using navigate replace to avoid history stack buildup
                navigate('/register', { replace: true });
            }
        }
    }, [navigate]);

    // Single consolidated user state
    const [user, setUser] = useState<User | null>(() => {
        const storedVersion = localStorage.getItem('tecnocard_version');

        // Version Check: Hard Reset if version mismatch
        if (storedVersion !== DATA_VERSION) {
            console.warn(`Data version mismatch (${storedVersion} vs ${DATA_VERSION}). Clearing cache.`);
            localStorage.removeItem('tecnocard_user');
            // specific keys related to app state
            localStorage.removeItem('tecnocard_visits');
            localStorage.removeItem('tecnocard_history');

            localStorage.setItem('tecnocard_version', DATA_VERSION);
            return null;
        }

        const stored = localStorage.getItem('tecnocard_user');
        if (!stored) return null;
        try {
            return JSON.parse(stored);
        } catch {
            return null;
        }
    });

    // Derived states
    const visits = user?.visits ?? 0;
    const visitHistory = user?.visits_history ?? [];

    // Persist user state
    useEffect(() => {
        if (user) {
            localStorage.setItem('tecnocard_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('tecnocard_user');
        }
    }, [user]);

    const fetchCardData = async () => {
        if (!user || !user.id) return;

        setIsSyncing(true);
        try {
            const { data, error } = await supabase
                .rpc('get_or_create_customer_card', {
                    p_qr_code: user.id,
                    p_rut: user.rut
                });

            if (error) {
                if (error.name !== 'AbortError' && !error.message?.includes('aborted')) {
                    console.error('Error fetching card state:', error);
                }
                return;
            }

            const responseData = Array.isArray(data) ? data[0] : data;
            if (responseData) {
                setUser(prev => prev ? {
                    ...prev,
                    visits: responseData.visits || 0,
                    visits_history: responseData.visits_history || []
                } : null);
            } else {
                // Strict Sync: Backend returned success but NO data -> User deleted?
                // Clear local state to reflect backend reality
                console.warn("Backend returned empty card data. Clearing local user state.");
                setUser(null);
            }
        } catch (e: any) {
            if (e.name !== 'AbortError' && !e.message?.includes('aborted')) {
                console.error('Fetch card data exception:', e);
            }
        } finally {
            setIsSyncing(false);
        }
    };

    // Validate session on mount to prevent stale data persistence
    useEffect(() => {
        // Only fetch if we have a user from localStorage but haven't validated it yet
        if (user) {
            fetchCardData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Consolidated real-time subscription
    useEffect(() => {
        if (!user?.card_id) return;

        const channel = supabase
            .channel(`loyalty-sync-${user.card_id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'visits',
                    filter: `loyalty_card_id=eq.${user.card_id}`,
                },
                () => {
                    fetchCardData().catch(() => { });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.card_id]);
    // Re-subscribe if identifiers change

    const registerUser = async (rut: string) => {
        const id = generateUUID();

        const { data, error } = await supabase
            .rpc('get_or_create_customer_card', {
                p_qr_code: id,
                p_rut: rut,
                p_local_token: localToken || null
            });

        if (error) throw error;

        const responseData = Array.isArray(data) ? data[0] : data;

        const finalId = responseData?.qr_code || id;

        const newUser: User = {
            rut,
            id: finalId,
            card_id: responseData?.card_id, // Ensure this is captured
            registeredAt: new Date().toISOString(),
            visits: responseData?.visits || 0,
            visits_history: responseData?.visits_history || []
        };
        setUser(newUser);
    };

    const registerVisit = async (code: string): Promise<boolean> => {
        const { data, error } = await supabase.rpc('register_visit', {
            p_qr_code: code
        });

        if (error) {
            console.error('Error registering visit:', error);
            // Handle specifically the 10 visits error if possible, but the RPC usually returns error message
            return false;
        }

        const responseData = Array.isArray(data) ? data[0] : data;
        if (responseData) {
            setUser(prev => prev ? {
                ...prev,
                visits: responseData.visits ?? prev.visits,
                visits_history: responseData.visits_history ?? prev.visits_history
            } : null);
        } else {
            await fetchCardData();
        }

        return true;
    };

    const removeLastVisit = async (code: string): Promise<boolean> => {
        const { data, error } = await supabase.rpc('delete_last_visit', {
            p_qr_code: code
        });

        if (error) {
            console.error('Error deleting last visit:', error);
            return false;
        }

        const responseData = Array.isArray(data) ? data[0] : data;
        if (responseData) {
            setUser(prev => prev ? {
                ...prev,
                visits: responseData.visits ?? 0,
                visits_history: responseData.visits_history ?? []
            } : null);
        } else {
            await fetchCardData();
        }
        return true;
    };

    const fetchDashboardMetrics = async (): Promise<DashboardMetrics> => {
        const { data, error } = await supabase.rpc('get_dashboard_stats');

        if (error) {
            console.error('Error fetching dashboard stats:', error);
            throw error;
        }

        return data as DashboardMetrics;
    };

    const resetProgress = () => {
        setUser(prev => prev ? { ...prev, visits: 0, visits_history: [] } : null);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('tecnocard_user');
        localStorage.removeItem('tecnocard_visits'); // Clean legacy if any
        localStorage.removeItem('tecnocard_history'); // Clean legacy if any
        navigate('/register');
    };

    return (
        <LoyaltyContext.Provider value={{
            user,
            visits,
            visits_history: visitHistory,
            registerUser,
            registerVisit,
            removeLastVisit,
            fetchCardData,
            fetchDashboardMetrics,
            isSyncing,
            resetProgress,
            logout
        }}>
            {children}
        </LoyaltyContext.Provider>
    );
};

