'use client';

import { useState } from 'react';
import { Loader2, MoreVertical, PlusCircle, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { RoadmapData } from './types';

export interface HistoryPanelContentProps {
  filteredHistory: RoadmapData[];
  loadingHistory: boolean;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  sortBy: string;
  setSortBy: (v: any) => void;
  roadmapId: string | null;
  loadThread: (t: RoadmapData) => void;
  onDeleteRoadmap?: (id: string) => Promise<void>;
  onNew?: () => void;
}

export function HistoryPanelContent({
  filteredHistory, loadingHistory, searchQuery, setSearchQuery,
  sortBy, setSortBy, roadmapId, loadThread,
  onDeleteRoadmap, onNew,
}: HistoryPanelContentProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RoadmapData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = (thread: RoadmapData, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteTarget(thread);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget?.id || !onDeleteRoadmap) return;
    setDeleting(true);
    try {
      await onDeleteRoadmap(deleteTarget.id);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      {/* Search + Sort */}
      <div className="px-3 py-2 space-y-2 border-b border-border shrink-0">
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roadmaps…"
            className="text-xs pl-2 pr-6 h-8"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Newest first</SelectItem>
            <SelectItem value="title">By title</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loadingHistory ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : filteredHistory.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            {searchQuery ? 'No matches' : 'No roadmaps yet'}
          </p>
        ) : (
          filteredHistory.map((thread) => {
            const isActive = thread.id === roadmapId;
            const stageCount = thread.stages?.length ?? 0;
            const itemCount = thread.stages?.reduce((t, s) => t + s.items.length, 0) ?? 0;
            return (
              <div key={thread.id} className="relative group/item">
                <div
                  onClick={() => loadThread(thread)}
                  className={`rounded-lg border p-3 pr-8 cursor-pointer transition-colors ${
                    isActive
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <p className={`text-xs font-medium truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                    {thread.topic || 'Untitled'}
                  </p>
                  <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
                    <span>{stageCount} stages · {itemCount} items</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {thread.created_at ? new Date(thread.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                {/* Three-dot delete menu */}
                {onDeleteRoadmap && (
                  <div className="absolute right-2 top-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive cursor-pointer"
                          onClick={(e) => handleDeleteClick(thread, e)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Roadmap</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this roadmap? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="py-2">
              <p className="text-sm font-medium mb-1">Roadmap:</p>
              <p className="text-sm text-muted-foreground truncate">{deleteTarget.topic || 'Untitled'}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Deleting…</> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Desktop side panel wrapper ────────────────────────────────────────────────

interface HistoryPanelProps extends HistoryPanelContentProps {
  onClose: () => void;
}

export function HistoryPanel({ onClose, ...contentProps }: HistoryPanelProps) {
  return (
    <div className="w-72 shrink-0 flex flex-col bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold">History</h3>
        <div className="flex items-center gap-1">
          {contentProps.onNew && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={contentProps.onNew} title="New roadmap">
              <PlusCircle className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <HistoryPanelContent {...contentProps} />
    </div>
  );
}
