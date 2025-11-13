'use client';

import { FrostedHeader } from "@/components/custom/frosted-header";
import ShowLottieAnimation from "@/components/custom/lottie-animations";
import { useMobileMenu } from "@/components/mobile-menu-context";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function DashboardHome() {
  const { toggleMobileMenu } = useMobileMenu();
  return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex flex-col">
          <FrostedHeader 
            title="Create New Agent" 
            subtitle="Set up a new agent to start managing tasks efficiently." 
            onMobileMenuToggle={toggleMobileMenu}
          />
  
          {/* Center the animation */}
          <div className="flex-1 flex justify-center items-center">
            <ShowLottieAnimation animationPath="/coming_soon.json" />
          </div>
        </div>
      </ProtectedRoute>
    );
}

