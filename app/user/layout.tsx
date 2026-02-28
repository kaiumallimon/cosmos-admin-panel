'use client';

import { MobileMenuProvider } from "@/components/mobile-menu-context";
import { ClientOnlyDialog } from "@/components/client-only-dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/auth";
import { signOutAndRedirect } from "@/lib/auth-client";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  HomeIcon,
  MessageCircleIcon,
  MapIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
  LogOutIcon,
  UserIcon,
  ChevronDownIcon,
  MenuIcon,
  BarChart2Icon,
  BookOpenIcon,
  ClipboardListIcon,
  Trophy,
  SparklesIcon,
  TrendingUpIcon,
  CalculatorIcon,
  CalendarDaysIcon,
  HistoryIcon,
} from "lucide-react";
import { IconNotification } from "@tabler/icons-react";


export const metadata = {
  title: "COSMOS-ITS - Student Portal",
  description: "Access your personalized dashboard, AI assistant, performance insights, and official notices in the COSMOS-ITS student portal.",
};


export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserAuthenticated, initializeAuth } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [checking, setChecking] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Auth guard for user role
  useEffect(() => {
    let active = true;
    const checkAuth = async () => {
      try {
        await initializeAuth();
        if (active) {
          if (!isUserAuthenticated()) {
            router.replace('/');
          } else {
            setChecking(false);
          }
        }
      } catch {
        if (active) router.replace('/');
      }
    };
    checkAuth();
    return () => { active = false; };
  }, [initializeAuth, isUserAuthenticated, router]);

  if (checking) {
    return (
      <div data-user-panel className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary" />
      </div>
    );
  }

  // When inside chat sub-route, let /user/chat/layout.tsx control the full layout
  if (pathname.startsWith('/user/chat')) {
    return (
      <div data-user-panel className="fixed inset-0">
        {children}
      </div>
    );
  }

  // Roadmap gets full-screen layout too
  if (pathname.startsWith('/user/roadmap')) {
    return (
      <div data-user-panel className="fixed inset-0">
        {children}
      </div>
    );
  }

  const SidebarContentComponent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border/40 p-4 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white shadow-md shrink-0">
            C
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold leading-none truncate">COSMOS</span>
            <span className="text-xs text-muted-foreground truncate">Student Portal</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 scrollbar-hide">
        <div className="mt-3">
          <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider px-2 mb-2 truncate">
            Overview
          </div>
          <Link
            href="/user"
            onClick={onLinkClick}
            className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${pathname === '/user' ? 'bg-primary text-primary-foreground font-semibold' : ''
              }`}
          >
            <HomeIcon className="h-4 w-4 shrink-0" />
            <span className="font-medium truncate">Dashboard</span>
          </Link>
        </div>

        <div className="my-4 h-px bg-border" />

        <div>
          <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider px-2 mb-2 truncate">
            AI Assistant
          </div>
          <Link
            href="/user/chat"
            onClick={onLinkClick}
            className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${pathname.startsWith('/user/chat') ? 'bg-primary text-primary-foreground font-semibold' : ''
              }`}
          >
            <MessageCircleIcon className="h-4 w-4 shrink-0" />
            <span className="font-medium truncate">Chat</span>
          </Link>

          <Link
            href="/user/roadmap"
            onClick={onLinkClick}
            className={` mt-1 flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${pathname.startsWith('/user/roadmap') ? 'bg-primary text-primary-foreground font-semibold' : ''
              }`}
          >
            <MapIcon className="h-4 w-4 shrink-0" />
            <span className="font-medium truncate">Roadmap</span>
          </Link>
        </div>

        <div className="my-4 h-px bg-border" />

        <div>
          <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider px-2 mb-2 truncate">
            Performance
          </div>

          {([
            { href: '/user/performance', label: 'Overview', icon: TrendingUpIcon, exact: true },
            { href: '/user/performance/courses', label: 'My Courses', icon: BookOpenIcon, exact: false },
            { href: '/user/performance/quiz', label: 'Quiz', icon: Trophy, exact: false },
            { href: '/user/performance/quiz/history', label: 'Quiz History', icon: HistoryIcon, exact: false },
            { href: '/user/performance/predict', label: 'Grade Prediction', icon: SparklesIcon, exact: false },
          ] as const).map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact
              ? pathname === href
              : pathname.startsWith(href) &&
              !(href === '/user/performance/quiz' && pathname.startsWith('/user/performance/quiz/history'));
            return (
              <Link
                key={href}
                href={href}
                onClick={onLinkClick}
                className={`mt-1 flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${isActive ? 'bg-primary text-primary-foreground font-semibold' : ''
                  }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="font-medium truncate">{label}</span>
              </Link>
            );
          })}
        </div>

        <div className="my-4 h-px bg-border" />

        <div>
          <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider px-2 mb-2 truncate">
            Tools
          </div>
          <Link
            href="/user/cgpa"
            onClick={onLinkClick}
            className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${pathname.startsWith('/user/cgpa') ? 'bg-primary text-primary-foreground font-semibold' : ''
              }`}
          >
            <CalculatorIcon className="h-4 w-4 shrink-0" />
            <span className="font-medium truncate">CGPA Calculator</span>
          </Link>
          <Link
            href="/user/routines"
            onClick={onLinkClick}
            className={`mt-1 flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${pathname.startsWith('/user/routines') ? 'bg-primary text-primary-foreground font-semibold' : ''
              }`}
          >
            <CalendarDaysIcon className="h-4 w-4 shrink-0" />
            <span className="font-medium truncate">Exam & Class Routines</span>
          </Link>
        </div>




        <div className="my-4 h-px bg-border" />

        <div>
          <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider px-2 mb-2 truncate">
            Official
          </div>
          <Link
            href="/user/notices"
            onClick={onLinkClick}
            className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${pathname.startsWith('/user/notices') ? 'bg-primary text-primary-foreground font-semibold' : ''
              }`}
          >
            <IconNotification className="h-4 w-4 shrink-0" />
            <span className="font-medium truncate">Notices</span>
          </Link>
        </div>
      </div>



      {/* Footer */}
      <div className="border-t border-border/40 p-4 shrink-0 overflow-hidden">
        {/* Theme Toggle */}
        <div className="mb-3 overflow-hidden">
          <div className="flex items-center justify-between min-w-0">
            <span className="text-xs font-medium text-muted-foreground truncate">Theme</span>
            {mounted && (
              <div className="flex items-center rounded-md border p-1 shrink-0">
                <button
                  className={`h-6 w-6 p-0 shrink-0 rounded-sm flex items-center justify-center transition-colors ${theme === 'light' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  onClick={() => setTheme('light')}
                >
                  <SunIcon className="h-3 w-3" />
                </button>
                <button
                  className={`h-6 w-6 p-0 shrink-0 rounded-sm flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  onClick={() => setTheme('dark')}
                >
                  <MoonIcon className="h-3 w-3" />
                </button>
                <button
                  className={`h-6 w-6 p-0 shrink-0 rounded-sm flex items-center justify-center transition-colors ${theme === 'system' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  onClick={() => setTheme('system')}
                >
                  <MonitorIcon className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* User Profile */}
        <ClientOnlyDialog
          trigger={
            <button className="w-full flex items-center justify-start gap-3 p-3 rounded-md hover:bg-primary/30 transition-colors overflow-hidden border-0 bg-transparent cursor-pointer">
              <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                {user.profile?.avatar_url ? (
                  <img
                    src={user.profile.avatar_url}
                    alt="Avatar"
                    className="h-8 w-8 rounded-full ring-2 ring-border shrink-0"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium shrink-0 ring-2 ring-border">
                    {(user.profile?.full_name?.charAt(0) || user.email.charAt(0)).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col items-start min-w-0 overflow-hidden">
                  <span className="text-sm font-medium truncate max-w-full">
                    {user.profile?.full_name || 'Student'}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-full">
                    {user.email}
                  </span>
                </div>
              </div>
              <ChevronDownIcon className="h-4 w-4 shrink-0" />
            </button>
          }
          title={
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Account Menu
            </div>
          }
          description="Manage your account settings and preferences."
        >
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="destructive"
              onClick={() => signOutAndRedirect('/')}
              className="w-full gap-2"
            >
              <LogOutIcon className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </ClientOnlyDialog>
      </div>
    </div>
  );

  return (
    <SidebarProvider defaultOpen={true}>
      <div data-user-panel className="flex h-screen w-screen bg-background overflow-hidden fixed inset-0">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex w-64 border-r border-border/40 bg-card overflow-hidden">
          <SidebarContentComponent />
        </div>

        {/* Mobile Drawer */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-64">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
              <SheetDescription>Main navigation menu for the student portal</SheetDescription>
            </SheetHeader>
            <SidebarContentComponent onLinkClick={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/20">
            <MobileMenuProvider toggleMobileMenu={() => setMobileMenuOpen(true)}>
              {children}
            </MobileMenuProvider>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}