'use client';

import { ArrowLeftIcon, HistoryIcon, MessageSquare, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { RoadmapData } from './types';

interface RoadmapTopNavProps {
  roadmapData: RoadmapData | null;
  completedCount: number;
  totalItems: number;
  progressPct: number;
  showChatbot: boolean;
  setShowChatbot: React.Dispatch<React.SetStateAction<boolean>>;
  showHistoryPanel: boolean;
  setShowHistoryPanel: React.Dispatch<React.SetStateAction<boolean>>;
  roadmapId: string | null;
  onNew: () => void;
}

export function RoadmapTopNav({
  roadmapData, completedCount, totalItems, progressPct,
  showChatbot, setShowChatbot, showHistoryPanel, setShowHistoryPanel,
  roadmapId, onNew,
}: RoadmapTopNavProps) {
  return (
    <div className="shrink-0 border-b border-border/60 bg-card/80 backdrop-blur-sm px-3 sm:px-4 h-12 flex items-center justify-between z-20">

      {/* Left – back + title */}
      <div className="flex items-center gap-2 min-w-0">
        <Link href="/user">
          <Button variant="ghost" size="sm" className="h-8 gap-1 shrink-0">
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs">Dashboard</span>
          </Button>
        </Link>
        <div className="h-4 w-px bg-border hidden sm:block shrink-0" />
        <span className="text-sm font-semibold truncate max-w-[120px] sm:max-w-none">
          <span className="hidden sm:inline">Learning Roadmap</span>
          <span className="sm:hidden">Roadmap</span>
        </span>

        {/* Compact progress badge (mobile only, when roadmap loaded) */}
        {roadmapData && (
          <span className="sm:hidden ml-1 text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">
            {progressPct}%
          </span>
        )}
      </div>

      {/* Right – actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Progress bar (desktop only) */}
        {roadmapData && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground mr-2">
            <span>{completedCount}/{totalItems}</span>
            <div className="w-28 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="font-medium text-primary">{progressPct}%</span>
          </div>
        )}

        {/* New */}
        {roadmapData && (
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={onNew}>
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New</span>
          </Button>
        )}

        {/* AI Chat toggle */}
        {roadmapId && (
          <Button
            variant={showChatbot ? 'default' : 'ghost'}
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setShowChatbot((v) => !v)}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">AI Chat</span>
          </Button>
        )}

        {/* History */}
        <Button
          variant={showHistoryPanel ? 'default' : 'ghost'}
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => setShowHistoryPanel((v) => !v)}
        >
          <HistoryIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">History</span>
        </Button>
      </div>
    </div>
  );
}
