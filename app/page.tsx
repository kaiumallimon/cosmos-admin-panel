'use client';

import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth } = useAuthStore();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        setInitializing(true);
        console.log('Starting auth check...');
        
        // Initialize auth state (check with API)
        await initializeAuth();
        
        // Small delay to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Get current user state after initialization
        const currentUser = useAuthStore.getState().user;
        console.log('Current user after init:', currentUser);
        
        // Check authentication status and redirect
        if (currentUser.isAuthenticated && currentUser.role === 'admin') {
          console.log('User is authenticated admin, redirecting to dashboard');
          router.push('/dashboard');
        } else {
          console.log('User is not authenticated or not admin, redirecting to login');
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        router.push('/login');
      } finally {
        setInitializing(false);
      }
    };

    checkAuthAndRedirect();
  }, [router, initializeAuth]);

  // Show a loading spinner while initializing and redirecting
  return (
    <div className="fixed overflow-hidden w-full h-full bg-background">
      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {initializing ? 'Checking authentication...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    </div>
  );
}
