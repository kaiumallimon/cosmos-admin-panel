'use client';

import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, CheckCircle2, HistoryIcon, Map, Maximize2, MessageSquare, SlidersHorizontal, Sparkles, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { D3NodeData, RoadmapData } from './types';

interface RoadmapCanvasProps {
  roadmapData: RoadmapData | null;
  svgRef: React.RefObject<SVGSVGElement | null>;
  zoomRef: React.RefObject<d3.ZoomBehavior<SVGSVGElement, unknown> | null>;
  isMobile: boolean;
  roadmapId: string | null;
  selectedNode: D3NodeData | null;
  userName?: string;
  setShowHistoryPanel: (v: boolean) => void;
  setShowDetails: (v: boolean) => void;
  setShowChatbot: (v: boolean) => void;
  onTopicSelect: (topic: string) => void;
}

export function RoadmapCanvas({
  roadmapData, svgRef, zoomRef, isMobile, roadmapId, selectedNode,
  userName, setShowHistoryPanel, setShowDetails, setShowChatbot, onTopicSelect,
}: RoadmapCanvasProps) {
  const fitToScreen = () => {
    if (!svgRef.current || !zoomRef.current || !roadmapData) return;
    const svg = d3.select(svgRef.current);
    const g = svg.select<SVGGElement>('g');
    const containerEl = svgRef.current.parentElement!;
    const cW = containerEl.clientWidth || 800;
    const cH = containerEl.clientHeight || 600;
    const bounds = (g.node() as SVGGElement).getBBox();
    const scale = Math.min(cW / (bounds.width + 120), cH / (bounds.height + 120)) * 0.88;
    const tx = cW / 2 - (bounds.x + bounds.width / 2) * scale;
    const ty = cH / 2 - (bounds.y + bounds.height / 2) * scale;
    svg.transition().duration(450).call(
      zoomRef.current.transform as any,
      d3.zoomIdentity.translate(tx, ty).scale(scale),
    );
  };

  if (!roadmapData) {
    return <EmptyState userName={userName} onTopicSelect={onTopicSelect} />;
  }

  return (
    <AnimatePresence>
      <motion.div
        key="canvas"
        className="w-full h-full relative"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <svg ref={svgRef} className="w-full h-full" style={{ userSelect: 'none' }} />

        {/* Zoom controls */}
        <motion.div
          className="absolute bottom-4 right-4 flex flex-col gap-1 z-10"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 bg-card/90 backdrop-blur-sm shadow-md border-border/60 hover:border-primary/50 hover:bg-primary/5"
            title="Zoom in"
            onClick={() => {
              if (!svgRef.current || !zoomRef.current) return;
              d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy as any, 1.4);
            }}
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 bg-card/90 backdrop-blur-sm shadow-md border-border/60 hover:border-primary/50 hover:bg-primary/5"
            title="Zoom out"
            onClick={() => {
              if (!svgRef.current || !zoomRef.current) return;
              d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy as any, 0.7);
            }}
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 bg-card/90 backdrop-blur-sm shadow-md border-border/60 hover:border-primary/50 hover:bg-primary/5"
            title="Fit to screen"
            onClick={fitToScreen}
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </motion.div>

        {/* Hint pill (desktop) */}
        <motion.div
          className="hidden md:flex absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <Badge variant="outline" className="bg-card/90 backdrop-blur-sm font-normal text-muted-foreground text-xs gap-1.5 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-pulse" />
            Click node · Drag to pan · Scroll to zoom
          </Badge>
        </motion.div>

        {/* Mobile FABs */}
        {isMobile && (
          <motion.div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <Button
              variant="outline"
              size="sm"
              className="rounded-full bg-card/95 backdrop-blur-sm shadow-lg gap-1.5 active:scale-95 border-border/60"
              onClick={() => setShowHistoryPanel(true)}
            >
              <HistoryIcon className="h-3.5 w-3.5" />
              History
            </Button>
            {selectedNode && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full bg-card/95 backdrop-blur-sm shadow-lg gap-1.5 active:scale-95 border-border/60"
                onClick={() => setShowDetails(true)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Details
              </Button>
            )}
            {roadmapId && (
              <Button
                size="sm"
                className="rounded-full shadow-lg gap-1.5 active:scale-95"
                onClick={() => setShowChatbot(true)}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                AI Chat
              </Button>
            )}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: Map,          label: 'Visual Map',      color: 'text-blue-500',   bg: 'bg-blue-500/10 border-blue-500/20' },
  { icon: Bot,          label: 'AI Chat',          color: 'text-violet-500', bg: 'bg-violet-500/10 border-violet-500/20' },
  { icon: CheckCircle2, label: 'Track Progress',   color: 'text-emerald-500',bg: 'bg-emerald-500/10 border-emerald-500/20' },
] as const;

function EmptyState({ userName, onTopicSelect }: { userName?: string; onTopicSelect: (t: string) => void }) {
  const QUICK_TOPICS = ['Data Structures', 'Machine Learning', 'System Design', 'React', 'Docker'];

  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full px-6 py-12"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Glow orb */}
      <motion.div
        className="relative mb-8"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
      >
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl scale-150" />
        <div className="relative h-20 w-20 rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-xl">
          <Map className="h-10 w-10 text-primary" strokeWidth={1.3} />
        </div>
        <motion.div
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="h-2.5 w-2.5 text-primary" />
        </motion.div>
      </motion.div>

      <motion.h2
        className="text-xl font-bold mb-2 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {userName ? `Hey, ${userName.split(' ')[0]}! 👋` : 'Learning Roadmap'}
      </motion.h2>
      <motion.p
        className="text-sm text-muted-foreground text-center max-w-xs mb-8 leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        Generate a personalized AI-powered learning roadmap for any topic. Click on nodes to explore and track your progress.
      </motion.p>

      {/* Feature grid */}
      <motion.div
        className="grid grid-cols-3 gap-3 max-w-xs w-full mb-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {FEATURES.map(({ icon: Icon, label, color, bg }, idx) => (
          <motion.div
            key={label}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center ${bg}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 + idx * 0.07 }}
          >
            <Icon className={`h-5 w-5 ${color}`} />
            <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick-start chips */}
      <motion.p
        className="text-xs text-muted-foreground mb-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Try one of these:
      </motion.p>
      <motion.div
        className="flex flex-wrap justify-center gap-2 max-w-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
      >
        {QUICK_TOPICS.map((topic, idx) => (
          <motion.div
            key={topic}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.57 + idx * 0.06 }}
          >
            <Button
              variant="outline"
              size="sm"
              className="rounded-full h-auto px-3 py-1.5 text-xs text-muted-foreground hover:text-primary hover:border-primary/50"
              onClick={() => onTopicSelect(topic)}
            >
              {topic}
            </Button>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
