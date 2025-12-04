'use client';

import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated); 

  // Redirect based on authentication status
  useEffect(() => {
    try {
      if (isAuthenticated()) {
        // If user is authenticated, redirect to dashboard
        router.push('/dashboard');
      } else {
        // If user is not authenticated, redirect to login page
        router.push('/login');
      }
    } catch (e) {
      // If there's an error checking auth, default to login
      console.warn('Auth redirect check failed', e);
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Show a loading spinner while redirecting
  return (
    <div className="fixed overflow-hidden w-full h-full bg-background">
      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    </div>
  );
}
