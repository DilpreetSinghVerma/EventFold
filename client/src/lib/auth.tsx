import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "../../../shared/schema";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    logout: () => void;
    startRazorpayCheckout: (plan?: string) => Promise<void>;
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

    const startRazorpayCheckout = async (plan: string = 'monthly') => {
        try {
            const res = await fetch(`/api/billing/subscribe/${plan}`, { method: "POST" });
            const data = await res.json();

            if (data.orderId) {
                // ... (rest of Razorpay options)
                const options = {
                    key: data.key,
                    amount: data.amount,
                    currency: "INR",
                    name: "EventFold Studio",
                    description: `${plan === 'yearly' ? 'Yearly' : 'Monthly'} Elite Subscription`,
                    order_id: data.orderId,
                    handler: function () {
                        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
                        window.location.href = "/dashboard?success=true";
                    },
                    prefill: {
                        name: user?.name,
                        email: user?.email,
                    },
                    theme: {
                        color: "#6366f1",
                    },
                };
                const rzp = new (window as any).Razorpay(options);
                rzp.open();
            }
        } catch (e: any) {
            console.error("Subscription failed", e);
        }
    };

    const buyAlbumCredit = async () => {
        try {
            const res = await fetch("/api/billing/buy-credit", { method: "POST" });
            const data = await res.json();

            if (data.orderId) {
                const options = {
                    key: data.key,
                    amount: data.amount,
                    currency: "INR",
                    name: "EventFold Studio",
                    description: "1 Album Credit",
                    order_id: data.orderId,
                    handler: function () {
                        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
                        window.location.href = "/dashboard?success=true";
                    },
                    prefill: {
                        name: user?.name,
                        email: user?.email,
                    },
                    theme: {
                        color: "#6366f1",
                    },
                };
                const rzp = new (window as any).Razorpay(options);
                rzp.open();
            }
        } catch (e: any) {
            console.error("Credit purchase failed", e);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user: user || null,
                isLoading,
                logout: () => logoutMutation.mutate(),
                startRazorpayCheckout,
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
