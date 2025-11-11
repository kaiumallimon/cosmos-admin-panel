"use client";

import React from "react";
import { signOutAndRedirect } from "@/lib/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarProvider,
    SidebarRail,
    SidebarSeparator,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { PanelLeftIcon, HomeIcon, UsersIcon, SettingsIcon } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <SidebarProvider className="min-h-screen bg-background">
            <div className="flex h-screen w-full">
                <Sidebar side="left" variant="sidebar" collapsible="icon">
                    <div className="flex h-full flex-col overflow-hidden px-3 py-4">
                        <SidebarHeader className="p-2 overflow-hidden">
                            <div className="flex items-center w-full overflow-hidden">
                                <Link href="/dashboard" className="flex items-center gap-2 min-w-0 overflow-hidden">
                                    <div className="h-8 w-8 rounded-md bg-orange-500 flex items-center justify-center text-white font-bold shrink-0">C</div>
                                    {/* hide text when collapsed to icon-only rail */}
                                    <span className="font-semibold group-data-[collapsible=icon]:hidden truncate">COSMOS</span>
                                </Link>
                            </div>
                        </SidebarHeader>

                        <SidebarContent className="px-3 py-5 overflow-hidden">
                            <SidebarGroup>
                                <SidebarGroupLabel>General</SidebarGroupLabel>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild tooltip="Home" isActive={pathname === "/dashboard"}>
                                            <Link href="/dashboard" className="flex items-center gap-2">
                                                <HomeIcon className="size-4" /> <span>Home</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild tooltip="Users" isActive={pathname === "/dashboard/users"}>
                                            <Link href="/dashboard/users" className="flex items-center gap-2">
                                                <UsersIcon className="size-4" /> <span>Users</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroup>

                            <SidebarSeparator />

                            <SidebarGroup>
                                <SidebarGroupLabel>Settings</SidebarGroupLabel>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild tooltip="Settings" isActive={pathname === "/dashboard/settings"}>
                                            <Link href="/dashboard/settings" className="flex items-center gap-2">
                                                <SettingsIcon className="size-4" /> <span>Settings</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroup>
                        </SidebarContent>

                        <div className="mt-auto">
                            <SidebarFooter className="overflow-hidden px-2 py-4">
                                <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 overflow-hidden w-full">
                                    <div className="flex-1 text-sm group-data-[collapsible=icon]:hidden min-w-0">
                                        <div className="font-medium truncate">Admin</div>
                                        <div className="text-xs text-muted-foreground truncate">Signed in</div>
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-medium group-data-[collapsible=icon]:mx-auto shrink-0">
                                        N
                                    </div>
                                </div>
                                <div className="flex w-full mt-2 px-2">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="w-full">
                                                Logout
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Sign out</DialogTitle>
                                                <DialogDescription>
                                                    Are you sure you want to sign out?
                                                </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button variant="secondary">Cancel</Button>
                                                </DialogClose>
                                                <Button
                                                    variant="destructive"
                                                    onClick={() => signOutAndRedirect("/")}
                                                >
                                                    Sign out
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </SidebarFooter>
                        </div>
                    </div>
                </Sidebar>

                <SidebarInset className="flex-1 bg-surface/50">


                    <section className="m-4">
                        {children}
                    </section>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
