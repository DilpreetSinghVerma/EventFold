import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "../../../shared/schema";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    logout: () => void;
    startStripeCheckout: () => Promise<void>;
    buyAlbumCredit: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();

    const { data: user, isLoading, error } = useQuery<User>({
        queryKey: ["/api/auth/me"],
    });

    const logoutMutation = useMutation({
        mutationFn: async () => {
            await fetch("/api/auth/logout", { method: "POST" });
        },
        onSuccess: () => {
            queryClient.setQueryData(["/api/auth/me"], null);
            window.location.href = "/";
        },
    });

    const startStripeCheckout = async () => {
        try {
            const res = await fetch("/api/create-checkout-session", { method: "POST" });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (e) {
            console.error("Checkout failed", e);
        }
    };

    const buyAlbumCredit = async () => {
        try {
            const res = await fetch("/api/billing/buy-credit", { method: "POST" });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (e) {
            console.error("Credit purchase failed", e);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user: user || null,
                isLoading,
                logout: () => logoutMutation.mutate(),
                startStripeCheckout,
                buyAlbumCredit,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
