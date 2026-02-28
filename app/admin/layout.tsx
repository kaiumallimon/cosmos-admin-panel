"use client";

import React, { useEffect, useState } from "react";
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
    PlusIcon,
    Code2Icon,
    Activity,
    MessageCircle,
    TagIcon,
    Timer
} from "lucide-react";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useAuthStore } from "@/store/auth";
import { MobileMenuProvider } from "@/components/mobile-menu-context";
import { IconRobot } from "@tabler/icons-react";
import { signOutAndRedirect } from "@/lib/auth-client";


export const metadata = {
    title: "COSMOS-ITS - Admin Panel",
    description: "COSMOS-ITS Admin Panel provides comprehensive tools for managing courses, questions, agents, and system settings in the COSMOS-ITS university tutoring system.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user } = useAuthStore();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
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

            {/* Content - Scrollable Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 scrollbar-hide">
                {/* Main Navigation */}
                <div className="mt-3">
                    <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider px-2 mb-2 truncate">
                        Overview
                    </div>
                    <div>
                        <div>
                            <Link
                                href="/admin"
                                onClick={onLinkClick}
                                className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${pathname === "/admin" ? "bg-primary text-primary-foreground font-semibold" : ""
                                    }`}
                            >
                                <HomeIcon className="h-4 w-4 shrink-0" />
                                <span className="font-medium truncate">Dashboard</span>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="my-4 h-px bg-border"></div>

                {/* Learning Management */}
                <div>
                    <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider px-2 mb-2 truncate">
                        Training
                    </div>
                    <div>
                        <div>
                            <Link
                                href="/admin/add-question"
                                onClick={onLinkClick}
                                className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${pathname === "/admin/add-question" ? "bg-primary text-primary-foreground font-semibold" : ""
                                    }`}
                            >
                                <PlusIcon className="h-4 w-4 shrink-0" />
                                <span className="font-medium truncate">Add Question</span>
                            </Link>
                        </div>

                        <div className="mt-1">
                            <Link
                                href="/admin/questions"
                                onClick={onLinkClick}
                                className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${pathname === "/admin/questions" || pathname.startsWith("/admin/questions/") ? "bg-primary text-primary-foreground font-semibold" : ""
                                    }`}
                            >
                                <HelpCircleIcon className="h-4 w-4 shrink-0" />
                                <span className="font-medium truncate">Questions</span>
                            </Link>
                        </div>

                        <div className="mt-1">
                            <Link
                                href="/admin/upload"
                                onClick={onLinkClick}
                                className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${pathname === "/admin/upload" ? "bg-primary text-primary-foreground font-semibold" : ""
                                    }`}
                            >
                                <UploadIcon className="h-4 w-4 shrink-0" />
                                <span className="font-medium truncate">Upload Content</span>
                            </Link>
                        </div>

                        <div className="mt-1">
                            <Link
                                href="/admin/contents"
                                onClick={onLinkClick}
                                className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${pathname === "/admin/contents" ? "bg-primary text-primary-foreground font-semibold" : ""
                                    }`}
                            >
                                <FileTextIcon className="h-4 w-4 shrink-0" />
                                <span className="font-medium truncate">Contents</span>
                            </Link>
                        </div>

                         <div className="mt-1">
                            <Link
                                href="/admin/update-embeddings"
                                onClick={onLinkClick}
                                className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${pathname === "/admin/update-embeddings" || pathname.startsWith("/admin/update-embeddings/") ? "bg-primary text-primary-foreground font-semibold" : ""
                                    }`}
                            >
                                <Code2Icon className="h-4 w-4 shrink-0" />
                                <span className="font-medium truncate">Update Embeddings</span>
                            </Link>
                        </div>


                    </div>
                </div>

                <div className="my-4 h-px bg-border"></div>

                {/* Agent Management Section */}

                <div>
                    <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider px-2 mb-2 truncate">
                        Agent Management
                    </div>
                    <div>
                        <div>
                            <Link
                                href="/admin/create-agent"
                                onClick={onLinkClick}
                                className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${pathname === "/admin/create-agent" ? "bg-primary text-primary-foreground font-semibold" : ""
                                    }`}
                            >
                                <PlusIcon className="h-4 w-4 shrink-0" />
                                <span className="font-medium truncate">Create Agent</span>
                            </Link>
                        </div>
                    </div>
                    <div className="mt-1">
                        <div>
                            <Link
                                href="/admin/agents"
                                onClick={onLinkClick}
                                className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${pathname === "/admin/agents" || pathname.startsWith("/admin/agents/") ? "bg-primary text-primary-foreground font-semibold" : ""
                                    }`}
                            >
                                <IconRobot className="h-4 w-4 shrink-0" />
                                <span className="font-medium truncate">Agents</span>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="my-4 h-px bg-border"></div>
                {/* Chat Section */}
                <div>
                    <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider px-2 mb-2 truncate">
                        Agent Management
                    </div>
                    <div>
                        <div>
                            <Link
                                href="/chat"
                                onClick={onLinkClick}
                                className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${pathname === "/chat" ? "bg-primary text-primary-foreground font-semibold" : ""
                                    }`}
                            >
                                <MessageCircle className="h-4 w-4 shrink-0" />
                                <span className="font-medium truncate">Chat</span>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="my-4 h-px bg-border"></div>

                {/* Course Management Section */}

                <div>
                    <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider px-2 mb-2 truncate">
                        Course Management
                    </div>
                    <div>
                        <div>
                            <Link
                                href="/admin/courses"
                                onClick={onLinkClick}
                                className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${pathname === "/admin/courses" || pathname.startsWith("/admin/courses/") ? "bg-primary text-primary-foreground font-semibold" : ""
                                    }`}
                            >
                                <BookOpenIcon className="h-4 w-4 shrink-0" />
                                <span className="font-medium truncate">Courses</span>
                            </Link>
                        </div>
                        <div className="mt-1">
                            <Link
                                href="/admin/topics"
                                onClick={onLinkClick}
                                className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${pathname === "/admin/topics" || pathname.startsWith("/admin/topics/") ? "bg-primary text-primary-foreground font-semibold" : ""
                                    }`}
                            >
                                <TagIcon className="h-4 w-4 shrink-0" />
                                <span className="font-medium truncate">Topics</span>
                            </Link>
                        </div>

                        <div className="mt-1">
                            <Link
                                href="/admin/trimesters"
                                onClick={onLinkClick}
                                className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${pathname === "/admin/trimesters" || pathname.startsWith("/admin/trimesters/") ? "bg-primary text-primary-foreground font-semibold" : ""
                                    }`}
                            >
                                <Timer className="h-4 w-4 shrink-0" />
                                <span className="font-medium truncate">Trimesters</span>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="my-4 h-px bg-border"></div>

                {/* Management Section */}
                <div>
                    <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider px-2 mb-2 truncate">
                        User Management
                    </div>
                    <div>
                        <div>
                            <Link
                                href="/admin/users"
                                onClick={onLinkClick}
                                className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${pathname === "/admin/users" || pathname.startsWith("/admin/users/") ? "bg-primary text-primary-foreground font-semibold" : ""
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
                <div>
                    <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider px-2 mb-2 truncate">
                        System
                    </div>
                    <div>
                        <div>
                            <Link
                                href="/admin/system-logs"
                                onClick={onLinkClick}
                                className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${pathname === "/admin/system-logs" ? "bg-primary text-primary-foreground font-semibold" : ""
                                    }`}
                            >
                                <Activity className="h-4 w-4 shrink-0" />
                                <span className="font-medium truncate">System Logs</span>
                            </Link>
                        </div>
                        <div className="mt-1">
                            <Link
                                href="/admin/help"
                                onClick={onLinkClick}
                                className={`flex items-center gap-3 min-w-0 overflow-hidden rounded-md p-2 text-sm transition-all duration-200 hover:bg-primary/30 ${pathname === "/admin/help" ? "bg-primary text-primary-foreground font-semibold" : ""
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
                                    className={`h-6 w-6 p-0 shrink-0 rounded-sm flex items-center justify-center transition-colors ${theme === "light"
                                            ? "bg-primary text-primary-foreground"
                                            : "hover:bg-accent hover:text-accent-foreground"
                                        }`}
                                    onClick={() => setTheme("light")}
                                >
                                    <SunIcon className="h-3 w-3" />
                                </button>
                                <button
                                    className={`h-6 w-6 p-0 shrink-0 rounded-sm flex items-center justify-center transition-colors ${theme === "dark"
                                            ? "bg-primary text-primary-foreground"
                                            : "hover:bg-accent hover:text-accent-foreground"
                                        }`}
                                    onClick={() => setTheme("dark")}
                                >
                                    <MoonIcon className="h-3 w-3" />
                                </button>
                                <button
                                    className={`h-6 w-6 p-0 shrink-0 rounded-sm flex items-center justify-center transition-colors ${theme === "system"
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
