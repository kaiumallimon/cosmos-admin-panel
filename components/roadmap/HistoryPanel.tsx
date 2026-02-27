'use client';

import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { RoadmapData } from './types';

interface HistoryPanelContentProps {
  filteredHistory: RoadmapData[];
  loadingHistory: boolean;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  sortBy: string;
  setSortBy: (v: any) => void;
  roadmapId: string | null;
  loadThread: (t: RoadmapData) => void;
}

export function HistoryPanelContent({
  filteredHistory, loadingHistory, searchQuery, setSearchQuery,
  sortBy, setSortBy, roadmapId, loadThread,
}: HistoryPanelContentProps) {
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
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full text-xs bg-muted border border-border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="date">Newest first</option>
          <option value="title">By title</option>
        </select>
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
              <div
                key={thread.id}
                onClick={() => loadThread(thread)}
                className={`rounded-lg border p-3 cursor-pointer transition-colors ${
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
            );
          })
        )}
      </div>
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
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <HistoryPanelContent {...contentProps} />
    </div>
  );
}
