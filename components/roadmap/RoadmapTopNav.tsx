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
    <div className="shrink-0 border-b border-border/60 bg-card/80 backdrop-blur-sm px-4 h-12 flex items-center justify-between z-20">
      <div className="flex items-center gap-3">
        <Link href="/user">
          <Button variant="ghost" size="sm" className="h-8 gap-1.5">
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            <span className="text-xs">Dashboard</span>
          </Button>
        </Link>
        <div className="h-4 w-px bg-border" />
        <span className="text-sm font-semibold">Learning Roadmap</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Progress bar */}
        {roadmapData && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mr-1">
            <span>{completedCount}/{totalItems} completed</span>
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
            AI Chat
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
          History
        </Button>
      </div>
    </div>
  );
}
