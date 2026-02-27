'use client';

import { ArrowLeftIcon, HistoryIcon, MessageSquare, PlusCircle, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
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
    <div className="shrink-0 border-b  bg-card/95 backdrop-blur-md px-3 sm:px-4 h-16 flex items-center justify-between z-20 ">

      {/* ── Left: back + brand ─────────────────────────────────── */}
      <div className="flex items-center gap-2 min-w-0">
        <Link href="/user">
          <Button variant="ghost" size="sm" className="h-8 gap-1 shrink-0 text-muted-foreground hover:text-foreground">
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs">Dashboard</span>
          </Button>
        </Link>

        <div className="h-4 w-px bg-border/60 hidden sm:block shrink-0" />

        {/* Brand badge */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-6 w-6 rounded-md bg-linear-to-br from-primary to-primary/70 flex items-center justify-center shrink-0 shadow-sm">
            <Route className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={2} />
          </div>
          <div className="hidden sm:flex flex-col min-w-0">
            <span className="text-xs font-bold leading-none text-foreground">Learning Roadmap</span>
            {roadmapData ? (
              <span className="text-[10px] text-muted-foreground truncate max-w-40 leading-tight mt-0.5">
                {roadmapData.topic}
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">AI-powered</span>
            )}
          </div>
          <span className="sm:hidden text-sm font-semibold">Roadmap</span>
        </div>

        {/* Mobile: compact progress badge */}
        {roadmapData && (
          <span className="sm:hidden ml-1 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full shrink-0">
            {progressPct}%
          </span>
        )}
      </div>

      {/* ── Right: progress + actions ──────────────────────────── */}
      <div className="flex items-center gap-1.5 shrink-0">

        {/* Desktop progress bar */}
        {roadmapData && (
          <motion.div
            className="hidden sm:flex items-center gap-2 mr-2"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Pill progress */}
            <div className="flex items-center gap-1.5 bg-muted/60 border border-border/50 rounded-full px-3 py-1">
              <span className="text-xs text-muted-foreground">{completedCount}/{totalItems}</span>
              <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
              <span className="text-xs font-bold text-primary min-w-10">{progressPct}%</span>
            </div>
          </motion.div>
        )}

        {/* New Roadmap */}
        {roadmapData && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={onNew}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New</span>
          </Button>
        )}

        {/* AI Chat toggle */}
        {roadmapId && (
          <Button
            variant={showChatbot ? 'default' : 'ghost'}
            size="sm"
            className={`h-8 gap-1.5 text-xs ${!showChatbot ? 'text-muted-foreground hover:text-foreground' : ''}`}
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
          className={`h-8 gap-1.5 text-xs ${!showHistoryPanel ? 'text-muted-foreground hover:text-foreground' : ''}`}
          onClick={() => setShowHistoryPanel((v) => !v)}
        >
          <HistoryIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">History</span>
        </Button>
      </div>
    </div>
  );
}
