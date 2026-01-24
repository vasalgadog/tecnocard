import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import type { LoyaltyContextType, User } from '../types';
import { supabase } from '../supabase';

export const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

export const LoyaltyProvider = ({ children }: { children: ReactNode }) => {
    // Single consolidated user state
    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem('tecnocard_user');
        if (!stored) return null;
        try {
            const data = JSON.parse(stored);
            // Cleanup legacy keys if they exist
            localStorage.removeItem('tecnocard_visits');
            localStorage.removeItem('tecnocard_history');
            return data;
        } catch {
            return null;
        }
    });

    // Derived states
    const visits = user?.visits ?? 0;
    const visitHistory = user?.visit_history ?? [];

    // Persist user state
    useEffect(() => {
        if (user) {
            localStorage.setItem('tecnocard_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('tecnocard_user');
        }
    }, [user]);

    // Helper for UUID generation with fallback
    const generateUUID = () => {
        try {
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                return crypto.randomUUID();
            }
        } catch (e) { /* fallback */ }

        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const fetchCardData = async () => {
        if (!user || !user.id) return;

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
                    visit_history: responseData.visit_history || []
                } : null);
            }
        } catch (e: any) {
            if (e.name !== 'AbortError' && !e.message?.includes('aborted')) {
                console.error('Fetch card data exception:', e);
            }
        }
    };

    // Consolidated real-time subscription
    useEffect(() => {
        if (!user || !user.id) return;

        const channel = supabase
            .channel(`loyalty-updates-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'loyalty_cards',
                    filter: `qr_code=eq.${user.id}`,
                },
                () => {
                    fetchCardData().catch(() => { });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    const registerUser = async (rut: string) => {
        const id = generateUUID();

        const { data, error } = await supabase
            .rpc('get_or_create_customer_card', {
                p_qr_code: id,
                p_rut: rut
            });

        if (error) throw error;

        const responseData = Array.isArray(data) ? data[0] : data;

        const finalId = responseData?.qr_code || id;

        const newUser: User = {
            rut,
            id: finalId,
            card_id: responseData?.card_id,
            registeredAt: new Date().toISOString(),
            visits: responseData?.visits || 0,
            visit_history: responseData?.visit_history || []
        };
        setUser(newUser);
    };

    const registerVisit = async (code: string, amount: number): Promise<boolean> => {
        const { error } = await supabase.rpc('register_visit', {
            p_qr_code: code,
            p_amount: amount
        });

        if (error) return false;

        // Optimistic update
        setUser(prev => {
            if (!prev) return null;

            const newHistoryItem = {
                id: 'temp-' + Date.now(),
                amount_paid: amount,
                scanned_at: new Date().toISOString()
            };

            const currentHistory = Array.isArray(prev.visit_history) ? prev.visit_history : [];
            const newHistory = [newHistoryItem, ...currentHistory];
            const newVisits = Math.min((prev.visits || 0) + 1, 10);

            return {
                ...prev,
                visits: newVisits,
                visit_history: newHistory
            };
        });

        return true;
    };

    const resetProgress = () => {
        setUser(prev => prev ? { ...prev, visits: 0, visit_history: [] } : null);
    };

    return (
        <LoyaltyContext.Provider value={{ user, visits, visit_history: visitHistory, registerUser, registerVisit, resetProgress }}>
            {children}
        </LoyaltyContext.Provider>
    );
};
