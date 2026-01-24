import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import type { LoyaltyContextType, User } from '../types';
import { supabase } from '../supabase';

export const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

export const LoyaltyProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem('tecnocard_user');
        return stored ? JSON.parse(stored) : null;
    });

    const [visits, setVisits] = useState<number>(() => {
        const stored = localStorage.getItem('tecnocard_visits');
        return stored ? parseInt(stored, 10) : 0;
    });

    const [visitHistory, setVisitHistory] = useState<any[]>(() => { // using any[] locally, typed in context
        const stored = localStorage.getItem('tecnocard_history');
        return stored ? JSON.parse(stored) : [];
    });

    useEffect(() => {
        if (user) localStorage.setItem('tecnocard_user', JSON.stringify(user));
    }, [user]);

    useEffect(() => {
        localStorage.setItem('tecnocard_visits', visits.toString());
    }, [visits]);

    useEffect(() => {
        localStorage.setItem('tecnocard_history', JSON.stringify(visitHistory));
    }, [visitHistory]);

    const fetchCardData = async () => {
        if (!user || !user.id) return;

        console.log("Fetching latest card state for QR:", user.id);
        const { data, error } = await supabase
            .rpc('get_or_create_customer_card', {
                p_qr_code: user.id,
                p_rut: user.rut
            });

        if (error) {
            console.error('Error fetching card state:', error);
            return;
        }

        const responseData = Array.isArray(data) ? data[0] : data;
        if (responseData) {
            console.log("Syncing state with backend:", responseData);
            setVisits(responseData.visits || 0);
            if (responseData.visit_history && Array.isArray(responseData.visit_history)) {
                const history = responseData.visit_history;
                setVisitHistory(history);
                setUser(prev => prev ? { ...prev, visit_history: history } : null);
            }
        }
    };

    useEffect(() => {
        if (!user || !user.id) return;

        console.log("Subscribing to realtime updates for QR:", user.id);
        const channel = supabase
            .channel('loyalty_cards_subscription')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'loyalty_cards',
                    filter: `qr_code=eq.${user.id}`,
                },
                async () => {
                    console.log('Realtime card update received. Syncing...');
                    await fetchCardData(); // Pull both visits and history to ensure consistency
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    const registerUser = async (rut: string) => {
        const id = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2) + Date.now().toString(36);

        const { data, error } = await supabase
            .rpc('get_or_create_customer_card', {
                p_qr_code: id,
                p_rut: rut
            });

        if (error) {
            console.error('Supabase RPC Error:', error);
            throw error;
        }

        console.log('Supabase RPC Data:', data);

        // Handle potential array response from RPC
        const responseData = Array.isArray(data) ? data[0] : data;

        // Data format: { card_id, qr_code, visits, visit_history }
        if (responseData) {
            setVisits(responseData.visits || 0);
            if (responseData.visit_history && Array.isArray(responseData.visit_history)) {
                setVisitHistory(responseData.visit_history);
            }
        }

        // Use returned QR code if available, otherwise use the generated one
        // This ensures if user exists, we use their existing QR
        const finalQrCode = (responseData && responseData.qr_code) ? responseData.qr_code : id;

        console.log("Using QR Code:", finalQrCode, "Source:", responseData?.qr_code ? "Backend" : "Generated");

        const newUser: User = {
            rut,
            id: finalQrCode,
            card_id: responseData && responseData.card_id ? responseData.card_id : undefined,
            registeredAt: new Date().toISOString(),
            visit_history: responseData && responseData.visit_history ? responseData.visit_history : []
        };
        setUser(newUser);
    };

    // Real-time subscription for new visits
    useEffect(() => {
        if (!user || !user.card_id) return;

        console.log("Subscribing to realtime visits for Card ID:", user.card_id);
        const channel = supabase
            .channel('visits-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'visits',
                    filter: `loyalty_card_id=eq.${user.card_id}`,
                },
                (payload) => {
                    console.log('Realtime visit insert received:', payload);
                    const newVisit = payload.new as any;

                    // Standardize field name if necessary (scanned_at is the new standard)
                    if (!newVisit.scanned_at && newVisit.created_at) {
                        newVisit.scanned_at = newVisit.created_at;
                    }

                    // Update visit history state
                    setVisitHistory(prev => {
                        // Avoid duplicates if we already added it optimistically
                        if (prev.some(v => v.id === newVisit.id)) return prev;

                        const updatedHistory = [newVisit, ...prev];

                        // Update user object as well for LoyaltyCard persistence and display
                        setUser(currentUser => {
                            if (!currentUser) return null;
                            const updatedUser = {
                                ...currentUser,
                                visit_history: updatedHistory
                            };
                            return updatedUser;
                        });

                        return updatedHistory;
                    });

                    // Update visits count
                    setVisits(prev => {
                        const newVal = prev + 1;
                        return newVal > 10 ? 10 : newVal;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.card_id]);

    const registerVisit = async (code: string, amount: number): Promise<boolean> => {
        console.log("Registering visit with code:", code, "amount:", amount);

        const { data, error } = await supabase
            .rpc('register_visit', {
                p_qr_code: code,
                p_amount: amount
            });

        if (error) {
            console.error('Supabase RPC Error (register_visit):', error);
            return false;
        }

        console.log('Supabase RPC Data (register_visit):', data);

        // Optimistic update
        setVisits(prev => {
            const newVal = prev + 1;
            if (newVal > 10) return 10;
            return newVal;
        });

        // Optimistic history update - Critical for UI "Completado" fix
        const newVisit: any = { // typed as any locally or VisitHistory
            id: 'temp-' + Date.now(),
            amount_paid: amount,
            scanned_at: new Date().toISOString()
        };

        setVisitHistory(prev => {
            const newHistory = [newVisit, ...prev]; // Add to top
            // Also update user state to sync with LoyaltyCard expectations
            if (user) {
                const updatedUser = { ...user, visit_history: newHistory };
                setUser(updatedUser);
            }
            return newHistory;
        });

        return true;
    };

    const resetProgress = () => {
        setVisits(0);
    }

    return (
        <LoyaltyContext.Provider value={{ user, visits, visit_history: visitHistory, registerUser, registerVisit, resetProgress }}>
            {children}
        </LoyaltyContext.Provider>
    );
};
