"use client";

import React, { ReactNode } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FrostedHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
  onMobileMenuToggle?: () => void;
}

/**
 * FrostedHeader: Reusable frosted glass header component
 * Props:
 * - title: main header text
 * - subtitle: optional smaller text below title
 * - children: optional extra content (buttons, icons)
 * - className: additional Tailwind classes
 * - onMobileMenuToggle: function to toggle mobile menu (shows menu icon on mobile when provided)
 */
export const FrostedHeader: React.FC<FrostedHeaderProps> = ({ 
  title, 
  subtitle, 
  children, 
  className = "", 
  onMobileMenuToggle 
}) => {
  
  return (
    <div
      className={`sticky top-0 z-20 bg-transparent dark:bg-transparent backdrop-blur-sm border-b border-border/50 p-4 md:p-4 transition-all duration-300 ${className}`}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left side - Mobile menu button + Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Mobile menu button - only visible on mobile when onMobileMenuToggle is provided */}
          {onMobileMenuToggle && (
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2 h-8 w-8"
              onClick={onMobileMenuToggle}
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
          
          {/* Title section */}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        {/* Right side - Additional children */}
        {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
      </div>
    </div>
  );
};
