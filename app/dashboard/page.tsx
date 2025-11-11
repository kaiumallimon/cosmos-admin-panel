"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { signOutAndRedirect } from "@/lib/auth";

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOutAndRedirect('/');
    } catch (e) {
      console.error('Dashboard: sign out failed', e);
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="p-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button variant="outline" size="sm" onClick={handleSignOut} loading={loading}>
            {loading ? 'Signing out...' : 'Sign Out'}
          </Button>
        </div>
        <p>Welcome to the admin dashboard!</p>
      </div>
    </ProtectedRoute>
  );
}