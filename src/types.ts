export interface User {
    rut: string;
    id: string; // UUID or derived unique ID
    card_id?: string; // Database ID of the loyalty card
    registeredAt: string;
    visits: number;
    visit_history: VisitHistory[];
}

export interface VisitHistory {
    id: string;
    amount_paid: number;
    scanned_at: string;
}

export interface LoyaltyState {
    user: User | null;
    visits: number;
    visit_history: VisitHistory[];
}

export interface LoyaltyContextType extends LoyaltyState {
    registerUser: (rut: string) => Promise<void>;
    registerVisit: (code: string, amount: number) => Promise<boolean>;
    resetProgress: () => void;
}
