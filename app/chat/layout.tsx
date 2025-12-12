'use client';

import { ClientOnlyDialog } from "@/components/client-only-dialog";
import { MobileMenuProvider } from "@/components/mobile-menu-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { signOutAndRedirect } from "@/lib/auth-client";
import { useAuthStore } from "@/store/auth";
import { ArrowLeftIcon, MessageSquarePlusIcon, SearchIcon, SunIcon, MoonIcon, MonitorIcon } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Thread {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch threads from API
  useEffect(() => {
    const fetchThreads = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/chat/threads');
        if (response.ok) {
          const data = await response.json();
          setThreads(data.threads || data || []);
        } else {
          console.error('Failed to fetch threads');
          setThreads([]);
        }
      } catch (error) {
        console.error('Error fetching threads:', error);
        setThreads([]);
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, []);

  const filteredThreads = threads.filter(thread =>
    thread.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const SidebarContentComponent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Sidebar Header */}
      <div className="border-b border-border/40 p-4 shrink-0">
        <div className="flex items-center gap-2 min-w-0 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-orange-500 to-red-500 text-sm font-bold text-white shadow-md shrink-0">
            C
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold leading-none truncate">COSMOS</span>
            <span className="text-xs text-muted-foreground truncate">Agentic Chat</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            onClick={onLinkClick}
            className="w-full justify-start gap-2"
            variant="outline"
          >
            <MessageSquarePlusIcon className="h-4 w-4" />
            <span>New chat</span>
          </Button>

          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search chats"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Scrollable Contents area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 scrollbar-hide">
        {/* Your chats section */}
        <div>
          <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider px-2 mb-2 truncate">
            Your chats
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="px-2 py-2">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </div>
          ) : filteredThreads.length > 0 ? (
            <div className="space-y-1">
              {filteredThreads.map((thread) => (
                <div key={thread.id}>
                  <Link
                    href={`/chat/${thread.id}`}
                    onClick={onLinkClick}
                    className={`block px-3 py-2 rounded-md text-sm transition-all duration-200 hover:bg-primary/30 group ${
                      pathname === `/chat/${thread.id}` ? "bg-primary/20 font-medium" : ""
                    }`}
                  >
                    <div className="truncate">
                      {thread.title || 'Untitled Chat'}
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {new Date(thread.updated_at || thread.created_at).toLocaleDateString()}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              {searchQuery ? 'No chats found' : 'No chats yet'}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Footer */}
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

        {/* Back Button */}
        <Button
          className="w-full justify-start gap-2 bg-red-500 hover:bg-red-500/75 text-white"
          onClick={() => {
            if (onLinkClick) onLinkClick();
            router.back();
          }}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Button>
      </div>
    </div>
  );

  return (
    <SidebarProvider defaultOpen={true}>
      {/* Sidebar for larger screens */}
      <div className="flex h-screen w-screen bg-background overflow-hidden fixed inset-0">
        <div className="hidden md:flex w-64 border-r border-border/40 bg-card overflow-hidden">
          <SidebarContentComponent />
        </div>


        {/* Mobile Menu Sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-64">
            <SheetHeader className="sr-only">
              <SheetTitle>Chat Navigation Menu</SheetTitle>
              <SheetDescription>
                Main navigation menu for the chat route
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
