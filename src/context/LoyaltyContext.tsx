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
        if (!user || (!user.id && !user.card_id)) return;

        // Determine filter ID: Prioritize card_id if available, otherwise QR (user.id)
        // Note: 'visits' table usually links via loyalty_card_id
        const filterId = user.card_id || user.id;

        console.log("Subscribing to realtime events for:", filterId);

        const channel = supabase.channel(`loyalty-sync-${filterId}`);

        // Listen to Loyalty Card updates (e.g. visits counter)
        channel
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'loyalty_cards',
                    filter: user.card_id ? `id=eq.${user.card_id}` : `qr_code=eq.${user.id}`,
                },
                (payload) => {
                    console.log("Realtime: Loyalty Card update", payload);
                    fetchCardData().catch(() => { });
                }
            )
            // Listen to Visit updates (INSERT = new scan, UPDATE = modify amount)
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'visits',
                    filter: user.card_id ? `loyalty_card_id=eq.${user.card_id}` : undefined,
                },
                (payload) => {
                    console.log("Realtime: Visit update", payload);
                    fetchCardData().catch(() => { });
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log("Realtime connected");
                }
            });

        return () => {
            console.log("Unsubscribing realtime");
            supabase.removeChannel(channel);
        };
    }, [user?.id, user?.card_id]); // Re-subscribe if identifiers change

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
            card_id: responseData?.card_id, // Ensure this is captured
            registeredAt: new Date().toISOString(),
            visits: responseData?.visits || 0,
            visit_history: responseData?.visit_history || []
        };
        setUser(newUser);
    };

    const registerVisit = async (code: string, amount: number): Promise<boolean> => {
        const { data, error } = await supabase.rpc('register_visit', {
            p_qr_code: code,
            p_amount: amount
        });

        if (error) {
            console.error('Error registering visit:', error);
            return false;
        }

        // Authoritative update from RPC response
        const responseData = Array.isArray(data) ? data[0] : data;
        if (responseData) {
            setUser(prev => prev ? {
                ...prev,
                visits: responseData.visits ?? prev.visits,
                visit_history: responseData.visit_history ?? prev.visit_history
            } : null);
            // SUCCESS: Do NOT fetchCardData here, relying on authoritative data
        } else {
            // Fallback if no data returned
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
                visit_history: responseData.visit_history ?? []
            } : null);
            // SUCCESS: Do NOT fetchCardData
        } else {
            await fetchCardData();
        }
        return true;
    };

    const modifyLastVisit = async (code: string, newAmount: number): Promise<boolean> => {
        const { data, error } = await supabase.rpc('update_last_visit', {
            p_qr_code: code,
            p_amount_paid: newAmount
        });

        if (error) {
            console.error('Error updating last visit:', error);
            return false;
        }

        const responseData = Array.isArray(data) ? data[0] : data;

        // Scenario 1: RPC returns the full User/Card state (has visit_history)
        if (responseData && Array.isArray(responseData.visit_history)) {
            setUser(prev => prev ? {
                ...prev,
                visits: responseData.visits ?? prev.visits,
                visit_history: responseData.visit_history
            } : null);
            return true; // Return immediately, NO FETCH
        }

        // Scenario 2: RPC returns the single Updated Visit (has amount_paid)
        if (responseData && typeof responseData.amount_paid === 'number') {
            setUser(prev => {
                if (!prev) return null;
                const currentHistory = [...(prev.visit_history || [])];

                // Attempt 1: Match by ID
                if (responseData.id) {
                    const idx = currentHistory.findIndex(v => v.id === responseData.id);
                    if (idx !== -1) {
                        currentHistory[idx] = { ...currentHistory[idx], amount_paid: responseData.amount_paid };
                        return { ...prev, visit_history: currentHistory };
                    }
                }

                // Attempt 2: Update the most recent visit
                if (currentHistory.length > 0) {
                    let latestIdx = 0;
                    let latestTime = new Date(currentHistory[0].scanned_at).getTime();

                    for (let i = 1; i < currentHistory.length; i++) {
                        const t = new Date(currentHistory[i].scanned_at).getTime();
                        if (t > latestTime) {
                            latestTime = t;
                            latestIdx = i;
                        }
                    }

                    currentHistory[latestIdx] = {
                        ...currentHistory[latestIdx],
                        amount_paid: responseData.amount_paid
                    };
                    return { ...prev, visit_history: currentHistory };
                }

                return prev;
            });

            // SUCCESS (Best Effort): We updated local state.
            // Do NOT fetchCardData if we are confident we updated it.
            // If we had a valid responseData, we assume success.
            return true;
        }

        // Scenario 3: Unknown or Null response -> Fallback
        await fetchCardData();
        return true;
    };

    const resetProgress = () => {
        setUser(prev => prev ? { ...prev, visits: 0, visit_history: [] } : null);
    };

    return (
        <LoyaltyContext.Provider value={{
            user,
            visits,
            visit_history: visitHistory,
            registerUser,
            registerVisit,
            removeLastVisit,
            modifyLastVisit,
            resetProgress
        }}>
            {children}
        </LoyaltyContext.Provider>
    );
};
