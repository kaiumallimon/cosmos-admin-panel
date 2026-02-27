'use client';

import * as d3 from 'd3';
import { Bot, CheckCircle2, HistoryIcon, Map, Maximize2, MessageSquare, SlidersHorizontal, ZoomIn, ZoomOut } from 'lucide-react';
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
    const scale = Math.min(cW / (bounds.width + 100), cH / (bounds.height + 100)) * 0.88;
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
    <>
      <svg ref={svgRef} className="w-full h-full" style={{ userSelect: 'none' }} />

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-10">
        <Button
          variant="outline"
          size="icon"
          className="w-8 h-8 bg-card/90 backdrop-blur-sm shadow-sm"
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
          className="w-8 h-8 bg-card/90 backdrop-blur-sm shadow-sm"
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
          className="w-8 h-8 bg-card/90 backdrop-blur-sm shadow-sm"
          title="Fit to screen"
          onClick={fitToScreen}
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Hint pill (desktop) */}
      <Badge variant="outline" className="hidden md:flex absolute top-3 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm pointer-events-none font-normal text-muted-foreground">
        Click node · Drag to pan · Scroll to zoom
      </Badge>

      {/* Mobile FABs */}
      {isMobile && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full bg-card/95 backdrop-blur-sm shadow-lg gap-1.5 active:scale-95"
            onClick={() => setShowHistoryPanel(true)}
          >
            <HistoryIcon className="h-3.5 w-3.5" />
            History
          </Button>
          {selectedNode && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full bg-card/95 backdrop-blur-sm shadow-lg gap-1.5 active:scale-95"
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
        </div>
      )}
    </>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: Map,           label: 'Visual Map' },
  { icon: Bot,           label: 'AI Chat' },
  { icon: CheckCircle2,  label: 'Track Progress' },
] as const;

function EmptyState({ userName, onTopicSelect }: { userName?: string; onTopicSelect: (t: string) => void }) {
  const QUICK_TOPICS = ['Data Structures', 'Machine Learning', 'System Design', 'React', 'Docker'];

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12">
      {/* Glow orb */}
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl scale-150" />
        <div className="relative h-20 w-20 rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
          <Map className="h-10 w-10 text-primary" strokeWidth={1.3} />
        </div>
      </div>

      <h2 className="text-xl font-bold mb-2 text-center">
        {userName ? `Hey, ${userName.split(' ')[0]}!` : 'Learning Roadmap'}
      </h2>
      <p className="text-sm text-muted-foreground text-center max-w-xs mb-8 leading-relaxed">
        Generate a personalized AI-powered learning roadmap for any topic. Click on nodes to explore and track your progress.
      </p>

      {/* Feature grid */}
      <div className="grid grid-cols-3 gap-3 max-w-xs w-full mb-8">
        {FEATURES.map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/40 p-3 text-center">
            <Icon className="h-5 w-5 text-primary" />
            <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Quick-start chips */}
      <p className="text-xs text-muted-foreground mb-2">Try one of these:</p>
      <div className="flex flex-wrap justify-center gap-2 max-w-sm">
        {QUICK_TOPICS.map((topic) => (
          <Button
            key={topic}
            variant="outline"
            size="sm"
            className="rounded-full h-auto px-3 py-1.5 text-xs text-muted-foreground hover:text-primary"
            onClick={() => onTopicSelect(topic)}
          >
            {topic}
          </Button>
        ))}
      </div>
    </div>
  );
}
