"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const router = useRouter();

    // Get auth data from store
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const initializeAuth = useAuthStore((s) => s.initializeAuth);

    const [checking, setChecking] = useState(true);

    useEffect(() => {
        let mounted = true;

        const checkAuth = async () => {
            try {
                // Initialize auth once
                if (initializeAuth) {
                    await initializeAuth();
                }

                // If user is not authenticated, redirect to login
                if (mounted) {
                    if (!isAuthenticated) {
                        router.replace("/login");
                    } else {
                        setChecking(false);
                    }
                }
            } catch (error) {
                console.warn("ProtectedRoute: auth check failed", error);
                if (mounted) router.replace("/login");
            }
        };

        checkAuth();

        return () => {
            mounted = false;
        };
    }, [initializeAuth, isAuthenticated, router]);

    if (checking) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background/80">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500 mx-auto mb-4"></div>
            </div>

        );
    }


    return <>{children}</>;
}
