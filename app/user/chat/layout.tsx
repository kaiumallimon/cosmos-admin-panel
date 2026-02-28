'use client';

import { ClientOnlyDialog } from "@/components/client-only-dialog";
import { MobileMenuProvider } from "@/components/mobile-menu-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { signOutAndRedirect } from "@/lib/auth-client";
import { useAuthStore } from "@/store/auth";
import {
  ArrowLeftIcon,
  SearchIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
  MoreVerticalIcon,
  Trash2Icon,
  MessageCirclePlusIcon,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

interface Thread {
  thread_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const THREADS_PER_PAGE = 10;

export default function UserChatLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<Thread | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [commandSearchQuery, setCommandSearchQuery] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Fetch initial threads
  useEffect(() => {
    const fetchThreads = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/chat/threads?skip=0&limit=${THREADS_PER_PAGE}`);
        if (response.ok) {
          const data = await response.json();
          setThreads(data.threads || []);
          setHasMore(data.threads?.length >= THREADS_PER_PAGE);
        } else {
          setThreads([]);
        }
      } catch {
        setThreads([]);
      } finally {
        setLoading(false);
      }
    };
    fetchThreads();
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const skip = threads.length;
      const response = await fetch(`/api/chat/threads?skip=${skip}&limit=${THREADS_PER_PAGE}`);
      if (response.ok) {
        const data = await response.json();
        const newThreads = data.threads || [];
        setThreads(prev => [...prev, ...newThreads]);
        setHasMore(newThreads.length >= THREADS_PER_PAGE);
      }
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }, [threads.length, loadingMore, hasMore]);

  const handleNewChat = () => {
    router.push('/user/chat');
    setMobileMenuOpen(false);
  };

  const filteredThreads = threads.filter(t =>
    t.title?.toLowerCase().includes(commandSearchQuery.toLowerCase())
  );

  const handleDeleteClick = (thread: Thread, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setThreadToDelete(thread);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!threadToDelete) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/chat/threads/${threadToDelete.thread_id}`, { method: 'DELETE' });
      if (response.ok) {
        setThreads(prev => prev.filter(t => t.thread_id !== threadToDelete.thread_id));
        if (pathname === `/user/chat/${threadToDelete.thread_id}`) {
          router.push('/user/chat');
        }
      }
    } catch {
      // ignore
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setThreadToDelete(null);
    }
  };

  const SidebarContentComponent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Sidebar Header */}
      <div className="sticky top-0 z-10 backdrop-blur-sm bg-background/60 border-b border-border/50 p-4 shrink-0">
        <div className="flex items-center gap-2 min-w-0 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white shadow-md shrink-0">
            C
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold leading-none truncate">COSMOS</span>
            <span className="text-xs text-muted-foreground truncate">Agentic Chat</span>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            onClick={() => { handleNewChat(); if (onLinkClick) onLinkClick(); }}
            className="w-full justify-start gap-2"
            variant="ghost"
          >
            <MessageCirclePlusIcon className="h-4 w-4" />
            <span>New chat</span>
          </Button>
          <Button
            onClick={() => setSearchOpen(true)}
            className="w-full justify-start gap-2"
            variant="ghost"
          >
            <SearchIcon className="h-4 w-4" />
            <span>Search chats</span>
          </Button>
        </div>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 scrollbar-hide">
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
          ) : threads.length > 0 ? (
            <div className="space-y-1">
              {threads.map((thread) => (
                <div key={thread.thread_id} className="relative group/item">
                  <div
                    onClick={() => {
                      sessionStorage.setItem('threadTitle', thread.title || 'Untitled Chat');
                      router.push(`/user/chat/${thread.thread_id}`);
                      if (onLinkClick) onLinkClick();
                    }}
                    className={`block px-3 py-2 pr-10 rounded-md text-sm transition-all duration-200 hover:bg-primary/30 cursor-pointer ${
                      pathname === `/user/chat/${thread.thread_id}` ? 'bg-primary/20 font-medium' : ''
                    }`}
                  >
                    <div className="truncate">{thread.title || 'Untitled Chat'}</div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {new Date(thread.updated_at || thread.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        >
                          <MoreVerticalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive cursor-pointer"
                          onClick={(e) => handleDeleteClick(thread, e)}
                        >
                          <Trash2Icon className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">No chats yet</div>
          )}

          {/* Load more button */}
          {!loading && hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="mt-1 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <><Loader2 className="h-3 w-3 animate-spin" />Loading…</>
              ) : (
                'Load more'
              )}
            </button>
          )}
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
                    theme === 'light' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
                  onClick={() => setTheme('light')}
                >
                  <SunIcon className="h-3 w-3" />
                </button>
                <button
                  className={`h-6 w-6 p-0 shrink-0 rounded-sm flex items-center justify-center transition-colors ${
                    theme === 'dark' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
                  onClick={() => setTheme('dark')}
                >
                  <MoonIcon className="h-3 w-3" />
                </button>
                <button
                  className={`h-6 w-6 p-0 shrink-0 rounded-sm flex items-center justify-center transition-colors ${
                    theme === 'system' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
                  onClick={() => setTheme('system')}
                >
                  <MonitorIcon className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Back to Dashboard */}
        <Button
          className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-white"
          onClick={() => router.push('/user')}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Button>
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

        {/* Mobile Sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-64">
            <SheetHeader className="sr-only">
              <SheetTitle>Chat Navigation Menu</SheetTitle>
              <SheetDescription>Main navigation menu for the chat route</SheetDescription>
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

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Thread</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chat thread? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {threadToDelete && (
            <div className="py-4">
              <p className="text-sm font-medium mb-1">Thread:</p>
              <p className="text-sm text-muted-foreground truncate">
                {threadToDelete.title || 'Untitled Chat'}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search Dialog */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput
          placeholder="Search threads..."
          value={commandSearchQuery}
          onValueChange={setCommandSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No threads found.</CommandEmpty>
          <CommandGroup heading="Threads">
            {filteredThreads.map((thread) => (
              <CommandItem
                key={thread.thread_id}
                value={thread.title || 'Untitled Chat'}
                onSelect={() => {
                  sessionStorage.setItem('threadTitle', thread.title || 'Untitled Chat');
                  router.push(`/user/chat/${thread.thread_id}`);
                  setSearchOpen(false);
                  setCommandSearchQuery('');
                }}
                className="cursor-pointer"
              >
                <div className="flex flex-col w-full">
                  <span className="font-medium truncate">{thread.title || 'Untitled Chat'}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(thread.updated_at || thread.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </SidebarProvider>
  );
}
