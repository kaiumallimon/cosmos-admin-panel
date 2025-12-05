"use client";

import React, { ReactNode } from "react";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlobalSearch from "@/components/global-search";

interface FrostedHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
  onMobileMenuToggle?: () => void;
  showSearch?: boolean;
}

/**
 * FrostedHeader: Reusable frosted glass header component
 * Props:
 * - title: main header text
 * - subtitle: optional smaller text below title
 * - children: optional extra content (buttons, icons)
 * - className: additional Tailwind classes
 * - onMobileMenuToggle: function to toggle mobile menu (shows menu icon on mobile when provided)
 * - showSearch: whether to show the global search bar (default: true)
 */
export const FrostedHeader: React.FC<FrostedHeaderProps> = ({ 
  title, 
  subtitle, 
  children, 
  className = "", 
  onMobileMenuToggle,
  showSearch = true,
}) => {
  
  return (
    <div
      className={`sticky top-0 z-20 bg-transparent dark:bg-transparent backdrop-blur-sm border-b border-border/50 p-4 md:p-4 transition-all duration-300 ${className}`}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left side - Mobile menu button + Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1 lg:flex-initial lg:min-w-0">
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
          <div className="min-w-0">
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
        
        {/* Center - Search (hidden on mobile, visible on larger screens) */}
        {showSearch && (
          <div className="hidden lg:flex flex-1 justify-center max-w-md">
            <GlobalSearch className="w-full" />
          </div>
        )}
        
        {/* Right side - Search (mobile) + Additional children */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile search - only visible on small screens */}
          {showSearch && (
            <div className="lg:hidden">
              <GlobalSearch 
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 h-8 w-8"
                    aria-label="Search"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                }
                className="w-8 h-8"
              />
            </div>
          )}
          
          {/* Additional children */}
          {children && <>{children}</>}
        </div>
      </div>
    </div>
  );
};
