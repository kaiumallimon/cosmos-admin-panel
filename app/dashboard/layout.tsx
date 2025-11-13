"use client";

import React from "react";
import { signOutAndRedirect } from "@/lib/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    SidebarProvider,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ClientOnlyDialog } from "@/components/client-only-dialog";
import { 
    HomeIcon, 
    UsersIcon, 
    SettingsIcon,
    BarChart3Icon,
    HelpCircleIcon,
    SearchIcon,
    ChevronDownIcon,
    LogOutIcon,
    UserIcon,
    SunIcon,
    MoonIcon,
    MonitorIcon,
    BookOpenIcon,
    UploadIcon,
    FileIcon,
    FileTextIcon,
    PlusIcon
} from "lucide-react";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useAuthStore } from "@/store/auth";
import { MobileMenuProvider } from "@/components/mobile-menu-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user } = useAuthStore();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Sidebar content component to reuse in both desktop and mobile
    const SidebarContentComponent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
        <div className="flex h-full flex-col overflow-hidden">
            {/* Header */}
            <div className="border-b border-border/40 p-4 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-orange-500 to-red-500 text-sm font-bold text-white shadow-md shrink-0">
                        C
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold leading-none truncate">COSMOS</span>
                        <span className="text-xs text-muted-foreground truncate">Admin Panel</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-2 overflow-hidden">
                {/* Main Navigation */}
                <div className="overflow-hidden">
                    <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider px-2 mb-2 truncate">
                        Overview
                    </div>
                    <div className="overflow-hidden">
                        <div className=" overflow-hidden">
                            <Link 
                                href="/dashboard" 
                                onClick={onLinkClick}
                                className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${
                                    pathname === "/dashboard" ? "bg-primary text-primary-foreground font-semibold" : ""
                                }`}
                            >
                                <HomeIcon className="h-4 w-4 shrink-0" />
                                <span className="font-medium truncate">Dashboard</span>
                            </Link>
                        </div>
                        <div className="mt-1 overflow-hidden">
                            <Link 
                                href="/dashboard/analytics" 
                                onClick={onLinkClick}
                                className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${
                                    pathname === "/dashboard/analytics" ? "bg-primary text-primary-foreground font-semibold" : ""
                                }`}
                            >
                                <BarChart3Icon className="h-4 w-4 shrink-0" />
                                <span className="font-medium truncate">Analytics</span>
                            </Link>
                        </div>
                        <div className="mt-1 overflow-hidden">
                            <Link 
                                href="/dashboard/search" 
                                onClick={onLinkClick}
                                className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${
                                    pathname === "/dashboard/search" ? "bg-primary text-primary-foreground font-semibold" : ""
                                }`}
                            >
                                <SearchIcon className="h-4 w-4 shrink-0" />
                                <span className="font-medium truncate">Search</span>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="my-4 h-px bg-border"></div>

                {/* Learning Management */}
                <div className="overflow-hidden">
                    <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider px-2 mb-2 truncate">
                        Training
                    </div>
                    <div className="overflow-hidden">
                        <div className="overflow-hidden">
                            <Link 
                                href="/dashboard/add-question" 
                                onClick={onLinkClick}
                                className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${
                                    pathname === "/dashboard/add-question" ? "bg-primary text-primary-foreground font-semibold" : ""
                                }`}
                            >
                                <PlusIcon className="h-4 w-4 shrink-0" />
                                <span className="font-medium truncate">Add Question</span>
                            </Link>
                        </div>

                        <div className="mt-1 overflow-hidden">
                            <Link 
                                href="/dashboard/questions" 
                                onClick={onLinkClick}
                                className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${
                                    pathname === "/dashboard/questions" || pathname.startsWith("/dashboard/questions/") ? "bg-primary text-primary-foreground font-semibold" : ""
                                }`}
                            >
                                <HelpCircleIcon className="h-4 w-4 shrink-0" />
                                <span className="font-medium truncate">Questions</span>
                            </Link>
                        </div>

                        <div className="mt-1 overflow-hidden">
                            <Link 
                                href="/dashboard/upload" 
                                onClick={onLinkClick}
                                className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${
                                    pathname === "/dashboard/upload" ? "bg-primary text-primary-foreground font-semibold" : ""
                                }`}
                            >
                                <UploadIcon className="h-4 w-4 shrink-0" />
                                <span className="font-medium truncate">Upload Content</span>
                            </Link>
                        </div>

                        <div className="mt-1 overflow-hidden">
                            <Link 
                                href="/dashboard/contents" 
                                onClick={onLinkClick}
                                className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${
                                    pathname === "/dashboard/contents" ? "bg-primary text-primary-foreground font-semibold" : ""
                                }`}
                            >
                                <FileTextIcon className="h-4 w-4 shrink-0" />
                                <span className="font-medium truncate">Contents</span>
                            </Link>
                        </div>

                        
                    </div>
                </div>

                <div className="my-4 h-px bg-border"></div>

                {/* Management Section */}
                <div className="overflow-hidden">
                    <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider px-2 mb-2 truncate">
                        User Management
                    </div>
                    <div className="overflow-hidden">
                        <div className="overflow-hidden">
                            <Link 
                                href="/dashboard/users" 
                                onClick={onLinkClick}
                                className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${
                                    pathname === "/dashboard/users" || pathname.startsWith("/dashboard/users/") ? "bg-primary text-primary-foreground font-semibold" : ""
                                }`}
                            >
                                <UsersIcon className="h-4 w-4 shrink-0" />
                                <span className="font-medium truncate">Users</span>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="my-4 h-px bg-border"></div>

                {/* System Section */}
                <div className="overflow-hidden">
                    <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider px-2 mb-2 truncate">
                        System
                    </div>
                    <div className="overflow-hidden">
                        <div className="overflow-hidden">
                            <Link 
                                href="/dashboard/settings" 
                                onClick={onLinkClick}
                                className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${
                                    pathname === "/dashboard/settings" ? "bg-primary text-primary-foreground font-semibold" : ""
                                }`}
                            >
                                <SettingsIcon className="h-4 w-4 shrink-0" />
                                <span className="font-medium truncate">Settings</span>
                            </Link>
                        </div>
                        <div className="mt-1 overflow-hidden">
                            <Link 
                                href="/dashboard/help" 
                                onClick={onLinkClick}
                                className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${
                                    pathname === "/dashboard/help" ? "bg-primary text-primary-foreground font-semibold" : ""
                                }`}
                            >
                                <HelpCircleIcon className="h-4 w-4 shrink-0" />
                                <span className="font-medium truncate">Help</span>
                            </Link>
                        </div>
                    </div>
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
                                    className={`h-6 w-6 p-0 shrink-0 rounded-sm flex items-center justify-center transition-colors ${
                                        theme === "light" 
                                            ? "bg-primary text-primary-foreground" 
                                            : "hover:bg-accent hover:text-accent-foreground"
                                    }`}
                                    onClick={() => setTheme("light")}
                                >
                                    <SunIcon className="h-3 w-3" />
                                </button>
                                <button
                                    className={`h-6 w-6 p-0 shrink-0 rounded-sm flex items-center justify-center transition-colors ${
                                        theme === "dark" 
                                            ? "bg-primary text-primary-foreground" 
                                            : "hover:bg-accent hover:text-accent-foreground"
                                    }`}
                                    onClick={() => setTheme("dark")}
                                >
                                    <MoonIcon className="h-3 w-3" />
                                </button>
                                <button
                                    className={`h-6 w-6 p-0 shrink-0 rounded-sm flex items-center justify-center transition-colors ${
                                        theme === "system" 
                                            ? "bg-primary text-primary-foreground" 
                                            : "hover:bg-accent hover:text-accent-foreground"
                                    }`}
                                    onClick={() => setTheme("system")}
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
                                    <div className="h-8 w-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium shrink-0 ring-2 ring-border">
                                        {(user.profile?.full_name?.charAt(0) || user.email.charAt(0)).toUpperCase()}
                                    </div>
                                )}
                                <div className="flex flex-col items-start min-w-0 overflow-hidden">
                                    <span className="text-sm font-medium truncate max-w-full">
                                        {user.profile?.full_name || 'User'}
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
                            onClick={() => signOutAndRedirect("/")}
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
            <div className="flex h-screen w-screen bg-background overflow-hidden fixed inset-0">
            {/* Desktop Sidebar - Hidden on mobile */}
            <div className="hidden md:flex w-64 border-r border-border/40 bg-card overflow-hidden">
                <SidebarContentComponent />
            </div>

            {/* Mobile Drawer */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetContent side="left" className="p-0 w-64">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Navigation Menu</SheetTitle>
                        <SheetDescription>
                            Main navigation menu for the application
                        </SheetDescription>
                    </SheetHeader>
                    <SidebarContentComponent onLinkClick={() => setMobileMenuOpen(false)} />
                </SheetContent>
            </Sheet>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Main Content */}
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
