export interface User {
    rut: string;
    id: string; // UUID or derived unique ID
    card_id?: string; // Database ID of the loyalty card
    registeredAt: string;
    visits: number;
    visits_history: VisitHistory[];
}

export interface VisitHistory {
    id: string;
    amount_paid: number;
    scanned_at: string;
}

export interface LoyaltyState {
    user: User | null;
    visits: number;
    visits_history: VisitHistory[];
}

export interface DashboardMetrics {
    total_cards: number;
    visits_today: number;
    levels: {
        "0_4": number;
        "5": number;
        "6_9": number;
        "10": number;
    };
    milestones_today: {
        "5": number;
        "10": number;
    };
}

export interface LoyaltyContextType extends LoyaltyState {
    registerUser: (rut: string) => Promise<void>;
    registerVisit: (code: string) => Promise<boolean>;
    removeLastVisit: (scanResult: string) => Promise<boolean>;
    fetchCardData: () => Promise<void>;
    fetchDashboardMetrics: () => Promise<DashboardMetrics>;
    resetProgress: () => void;
    isSyncing?: boolean;
}

