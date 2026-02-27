'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { ArrowLeftIcon, HistoryIcon, Loader2, Mic, MicOff, RefreshCwIcon, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RoadmapChatPanel } from '@/components/roadmap/RoadmapChatPanel';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { useTheme } from 'next-themes';

// ─────────────────────── Types ───────────────────────────────────────────────

interface RoadmapItem {
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeCommitment?: string;
  status?: string;
}

interface RoadmapStage {
  title: string;
  description: string;
  items: RoadmapItem[];
}

interface RoadmapData {
  id?: string;
  topic: string;
  introduction?: string;
  stages: RoadmapStage[];
}

interface RoadmapThread {
  thread_id: string;
  title: string;
  created_at: string;
  roadmap: RoadmapData;
  chat_history?: any[];
  progress?: {
    total_items: number;
    completed_items: number;
    overall_progress_percentage: number;
  };
}

interface D3NodeData {
  name: string;
  type: 'root' | 'stage' | 'item';
  description: string;
  difficulty?: string;
  id?: string;
  stageIndex?: number;
  itemIndex?: number;
  children?: D3NodeData[];
}

// ─────────────────────── Page ────────────────────────────────────────────────

export default function RoadmapPage() {
  const { user } = useAuthStore();
  const { resolvedTheme } = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Roadmap state
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<D3NodeData | null>(null);

  // Panels
  const [showDetails, setShowDetails] = useState(true);
  const [showChatbot, setShowChatbot] = useState(true);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  // History
  const [chatHistory, setChatHistory] = useState<RoadmapThread[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'progress' | 'title'>('date');

  // Voice input
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // ── Speech recognition ─────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const r = new SR();
      r.continuous = false;
      r.interimResults = false;
      r.lang = 'en-US';
      r.onresult = (e: any) => { setQuery(e.results[0][0].transcript); setIsListening(false); };
      r.onerror = () => { setIsListening(false); setError('Speech recognition failed.'); };
      r.onend = () => setIsListening(false);
      setRecognition(r);
    }
    fetchChatHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && query.trim()) generateRoadmap();
    }
  };

  const toggleVoice = () => {
    if (!recognition) { setError('Speech recognition not supported.'); return; }
    if (isListening) { recognition.stop(); setIsListening(false); }
    else { setError(null); recognition.start(); setIsListening(true); }
  };

  // ── Fetch history ──────────────────────────────────────────────────────────
  const fetchChatHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/roadmap/threads');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setChatHistory(data.threads || []);
    } catch {
      setChatHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadThread = (thread: RoadmapThread) => {
    setRoadmapData(thread.roadmap);
    setThreadId(thread.thread_id);
    setQuery(thread.title || '');
    setSelectedNode(null);
    if (thread.roadmap?.stages) {
      const completed = new Set<string>();
      thread.roadmap.stages.forEach((stage, si) => {
        stage.items.forEach((item, ii) => {
          if (item.status === 'completed') completed.add(`${si}-${ii}`);
        });
      });
      setCompletedItems(completed);
    }
  };

  // ── Generate roadmap ───────────────────────────────────────────────────────
  const generateRoadmap = async () => {
    if (!query.trim()) { setError('Please enter a topic.'); return; }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: query.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.id) setThreadId(data.id);
      if (data.stages) {
        setRoadmapData(data);
        setCompletedItems(new Set());
        setSelectedNode(null);
      }
      if (showHistoryPanel) setTimeout(fetchChatHistory, 2000);
    } catch {
      setError('Failed to generate roadmap. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); generateRoadmap(); };

  const toggleCompletion = useCallback((id: string) => {
    setCompletedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // ── D3 Rendering (roadmap.sh-style) ───────────────────────────────────────
  useEffect(() => {
    if (!roadmapData?.stages?.length || !svgRef.current) return;

    const dark = resolvedTheme === 'dark';

    // ── Palette ────────────────────────────────────────────────────────────
    const palette = {
      spine:       dark ? '#60a5fa' : '#3b82f6',
      stageFill:   dark ? '#92400e' : '#fbbf24',
      stageStroke: dark ? '#b45309' : '#f59e0b',
      stageText:   dark ? '#fef3c7' : '#1c1917',
      itemFill:    dark ? '#1c1917' : '#fef9c3',
      itemStroke:  dark ? '#44403c' : '#fde68a',
      itemText:    dark ? '#e7e5e4' : '#1c1917',
      doneFill:    dark ? '#14532d' : '#dcfce7',
      doneStroke:  dark ? '#166534' : '#86efac',
      doneText:    dark ? '#86efac' : '#15803d',
      dot:         dark ? '#60a5fa' : '#3b82f6',
      topicText:   '#f97316',
    };

    // ── Layout constants ───────────────────────────────────────────────────
    const SVG_W      = 1200;
    const CX         = SVG_W / 2;   // center x
    const STAGE_W    = 210;
    const STAGE_H    = 50;
    const STAGE_R    = 8;
    const ITEM_W     = 210;
    const ITEM_H     = 40;
    const ITEM_R     = 6;
    const ITEM_GAP_X = 320;         // center of items from CX
    const ITEM_SPACING = 52;        // vertical gap between items
    const STAGE_PAD  = 80;          // extra padding between stage blocks
    const TOP_PAD    = 90;

    // ── Calculate stage Y positions ────────────────────────────────────────
    const stages = roadmapData.stages;
    const stageYs: number[] = [];
    let curY = TOP_PAD;

    stages.forEach((stage, i) => {
      const fan = ((stage.items.length - 1) / 2) * ITEM_SPACING;
      if (i === 0) {
        curY += fan;
      } else {
        const prevFan = ((stages[i - 1].items.length - 1) / 2) * ITEM_SPACING;
        curY += prevFan + STAGE_PAD + fan;
      }
      stageYs.push(curY);
    });
    const lastFan = ((stages[stages.length - 1].items.length - 1) / 2) * ITEM_SPACING;
    const SVG_H = stageYs[stageYs.length - 1] + lastFan + TOP_PAD;

    // ── SVG setup ──────────────────────────────────────────────────────────
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', SVG_W).attr('height', SVG_H);

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.08, 4])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom as any);

    // ── Spine line ─────────────────────────────────────────────────────────
    g.append('line')
      .attr('x1', CX).attr('y1', stageYs[0] - STAGE_H / 2 - 30)
      .attr('x2', CX).attr('y2', stageYs[stageYs.length - 1] + STAGE_H / 2 + 30)
      .attr('stroke', palette.spine)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,4')
      .attr('opacity', 0.55);

    // ── Topic title ────────────────────────────────────────────────────────
    g.append('text')
      .attr('x', CX).attr('y', stageYs[0] - STAGE_H / 2 - 44)
      .attr('text-anchor', 'middle')
      .attr('font-size', '18px').attr('font-weight', '700')
      .attr('letter-spacing', '0.5')
      .attr('fill', palette.topicText)
      .text(roadmapData.topic);

    // ── SVG text-wrap helper ───────────────────────────────────────────────
    function svgWrapText(
      el: d3.Selection<SVGTextElement, unknown, null, undefined>,
      text: string,
      maxW: number,
      lineH: number,
      maxLines = 2,
    ) {
      const words = text.split(/\s+/);
      let line: string[] = [];
      let lineNum = 0;
      el.text('');
      let tspan = el.append('tspan').attr('x', 0).attr('dy', '0em');

      for (const word of words) {
        line.push(word);
        tspan.text(line.join(' '));
        const node = tspan.node() as SVGTSpanElement | null;
        if (node && node.getComputedTextLength() > maxW && line.length > 1) {
          line.pop();
          tspan.text(line.join(' '));
          line = [word];
          lineNum++;
          if (lineNum >= maxLines) {
            // truncate last line
            let t = tspan.text();
            if (t.length > 24) tspan.text(t.substring(0, 22) + '…');
            break;
          }
          tspan = el.append('tspan').attr('x', 0).attr('dy', `${lineH}em`);
          tspan.text(word);
        }
      }
    }

    // ── Render each stage ─────────────────────────────────────────────────
    stages.forEach((stage, si) => {
      const stageY = stageYs[si];
      const side   = si % 2 === 0 ? 1 : -1;   // +1 = items right, -1 = items left
      const itemCX = CX + side * ITEM_GAP_X;
      const stageEdgeX  = CX + side * STAGE_W / 2;
      const itemEdgeX   = itemCX - side * ITEM_W / 2;

      // ── Stage node ───────────────────────────────────────────────────
      const stageG = g.append('g')
        .attr('transform', `translate(${CX},${stageY})`)
        .style('cursor', 'pointer');

      stageG.append('rect')
        .attr('x', -STAGE_W / 2).attr('y', -STAGE_H / 2)
        .attr('width', STAGE_W).attr('height', STAGE_H)
        .attr('rx', STAGE_R)
        .attr('fill', palette.stageFill)
        .attr('stroke', palette.stageStroke)
        .attr('stroke-width', 1.5)
        .attr('filter', 'drop-shadow(0 2px 6px rgba(0,0,0,0.18))');

      // Stage label — multi-line
      const stageTxt = stageG.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '13px').attr('font-weight', '700')
        .attr('fill', palette.stageText)
        .attr('pointer-events', 'none');

      const stageWords = stage.title.split(/\s+/);
      let stageLine: string[] = [];
      let stageLines: string[] = [];
      const stageTmpSpan = stageTxt.append('tspan').attr('x', 0).attr('dy', '0em');
      for (const w of stageWords) {
        stageLine.push(w);
        stageTmpSpan.text(stageLine.join(' '));
        const sn = stageTmpSpan.node() as SVGTSpanElement | null;
        if (sn && sn.getComputedTextLength() > STAGE_W - 24 && stageLine.length > 1) {
          stageLine.pop();
          stageLines.push(stageLine.join(' '));
          stageLine = [w];
        }
      }
      if (stageLine.length) stageLines.push(stageLine.join(' '));
      stageTxt.select('tspan').remove();
      stageTxt.text('');
      const stageLH = 1.2;
      const stageOffsetY = -((stageLines.length - 1) * stageLH) / 2;
      stageLines.forEach((l, li) => {
        stageTxt.append('tspan')
          .attr('x', 0)
          .attr('dy', li === 0 ? `${stageOffsetY}em` : `${stageLH}em`)
          .text(l);
      });

      stageG.on('click', () => {
        setSelectedNode({ name: stage.title, type: 'stage', description: stage.description, stageIndex: si });
        setShowDetails(true);
        setShowChatbot(true);
      });

      // ── Items ─────────────────────────────────────────────────────────
      stage.items.forEach((item, ii) => {
        const offsetY = (ii - (stage.items.length - 1) / 2) * ITEM_SPACING;
        const itemY   = stageY + offsetY;
        const nodeId  = `${si}-${ii}`;
        const done    = completedItems.has(nodeId);

        // Bezier connector
        const midX = (stageEdgeX + itemEdgeX) / 2;
        g.append('path')
          .attr('d', `M ${stageEdgeX},${stageY} C ${midX},${stageY} ${midX},${itemY} ${itemEdgeX},${itemY}`)
          .attr('fill', 'none')
          .attr('stroke', palette.spine)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '4,3')
          .attr('opacity', 0.55);

        // Dot at stage edge
        g.append('circle')
          .attr('cx', stageEdgeX).attr('cy', stageY)
          .attr('r', 3)
          .attr('fill', palette.dot)
          .attr('opacity', 0.8);

        // Dot at item edge
        g.append('circle')
          .attr('cx', itemEdgeX).attr('cy', itemY)
          .attr('r', 3)
          .attr('fill', palette.dot)
          .attr('opacity', 0.8);

        // Item node
        const itemG = g.append('g')
          .attr('transform', `translate(${itemCX},${itemY})`)
          .style('cursor', 'pointer');

        itemG.on('click', () => {
          const nodeData: D3NodeData = {
            name: item.name, type: 'item', description: item.description,
            difficulty: item.difficulty, id: nodeId, stageIndex: si, itemIndex: ii,
          };
          setSelectedNode(nodeData);
          setShowDetails(true);
          setShowChatbot(true);
          toggleCompletion(nodeId);
        });

        itemG.append('rect')
          .attr('x', -ITEM_W / 2).attr('y', -ITEM_H / 2)
          .attr('width', ITEM_W).attr('height', ITEM_H)
          .attr('rx', ITEM_R)
          .attr('fill', done ? palette.doneFill : palette.itemFill)
          .attr('stroke', done ? palette.doneStroke : palette.itemStroke)
          .attr('stroke-width', 1.5)
          .attr('filter', 'drop-shadow(0 1px 4px rgba(0,0,0,0.10))');

        // Done badge
        if (done) {
          itemG.append('text')
            .attr('x', -ITEM_W / 2 + 11).attr('y', 1)
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '10px')
            .attr('fill', palette.doneText)
            .text('✓');
        }

        const itemTxt = itemG.append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('font-size', '11px')
          .attr('font-weight', '500')
          .attr('fill', done ? palette.doneText : palette.itemText)
          .attr('pointer-events', 'none');

        svgWrapText(itemTxt as any, item.name, ITEM_W - (done ? 32 : 20), 1.15, 2);

        // Difficulty dot
        const diffColor =
          item.difficulty === 'Easy' ? '#22c55e' :
          item.difficulty === 'Hard' ? '#ef4444' : '#f59e0b';
        itemG.append('circle')
          .attr('cx', ITEM_W / 2 - 10).attr('cy', 0)
          .attr('r', 4)
          .attr('fill', diffColor)
          .attr('opacity', 0.8);
      });
    });

    // ── Auto-fit ───────────────────────────────────────────────────────────
    const containerEl = svgRef.current!.parentElement!;
    const cW = containerEl.clientWidth  || 800;
    const cH = containerEl.clientHeight || 600;
    const bounds = (g.node() as SVGGElement).getBBox();
    const scale  = Math.min(cW / (bounds.width + 80), cH / (bounds.height + 80)) * 0.9;
    const tx = cW / 2 - (bounds.x + bounds.width  / 2) * scale;
    const ty = cH / 2 - (bounds.y + bounds.height / 2) * scale;
    svg.call(
      zoom.transform as any,
      d3.zoomIdentity.translate(tx, ty).scale(scale),
    );
  }, [roadmapData, completedItems, toggleCompletion, resolvedTheme]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalItems = roadmapData?.stages?.reduce((t, s) => t + s.items.length, 0) ?? 0;
  const completedCount = completedItems.size;
  const progressPct = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  // ── History filtering/sorting ──────────────────────────────────────────────
  const filteredHistory = useMemo(() => {
    let list = chatHistory;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) => t.title?.toLowerCase().includes(q) || t.roadmap?.topic?.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'date') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'progress') return (b.progress?.overall_progress_percentage ?? 0) - (a.progress?.overall_progress_percentage ?? 0);
      return (a.title || '').localeCompare(b.title || '');
    });
  }, [chatHistory, searchQuery, sortBy]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden fixed inset-0">
      {/* Top Nav */}
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

        {/* Progress bar (when roadmap loaded) */}
        {roadmapData && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{completedCount}/{totalItems} completed</span>
              <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="font-medium text-primary">{progressPct}%</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setShowHistoryPanel((v) => !v)}
            >
              <HistoryIcon className="h-3.5 w-3.5" />
              History
            </Button>
          </div>
        )}

        {!roadmapData && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setShowHistoryPanel((v) => !v)}
          >
            <HistoryIcon className="h-3.5 w-3.5" />
            History
          </Button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 flex gap-3 overflow-hidden p-3 min-h-0">

        {/* History Panel */}
        {showHistoryPanel && (
          <div className="w-72 shrink-0 flex flex-col bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
              <h3 className="text-sm font-semibold">History</h3>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowHistoryPanel(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

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
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full text-xs bg-muted border border-border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="date">Newest first</option>
                <option value="progress">By progress</option>
                <option value="title">By title</option>
              </select>
            </div>

            {/* Thread list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loadingHistory ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
              ) : filteredHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  {searchQuery ? 'No matches' : 'No roadmaps yet'}
                </p>
              ) : (
                filteredHistory.map((thread) => {
                  const pct = thread.progress?.overall_progress_percentage ?? 0;
                  const isActive = thread.thread_id === threadId;
                  return (
                    <div
                      key={thread.thread_id}
                      onClick={() => loadThread(thread)}
                      className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                        isActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <p className={`text-xs font-medium truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                        {thread.title || 'Untitled'}
                      </p>
                      <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
                        <span>{thread.progress?.completed_items ?? 0}/{thread.progress?.total_items ?? 0} items</span>
                        <span className="text-primary font-medium">{pct.toFixed(0)}%</span>
                      </div>
                      <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {thread.created_at ? new Date(thread.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Details Panel */}
        {selectedNode && showDetails && (
          <div className="w-80 shrink-0 flex flex-col bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
              <h3 className="text-sm font-semibold">Details</h3>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowDetails(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <h4 className="text-base font-semibold mb-3 leading-tight">{selectedNode.name}</h4>

              {selectedNode.type === 'item' && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedNode.difficulty && (
                    <Badge
                      variant="outline"
                      className={
                        selectedNode.difficulty === 'Easy'
                          ? 'border-green-500/40 text-green-600 bg-green-50 dark:bg-green-950/40'
                          : selectedNode.difficulty === 'Medium'
                          ? 'border-yellow-500/40 text-yellow-600 bg-yellow-50 dark:bg-yellow-950/40'
                          : 'border-red-500/40 text-red-600 bg-red-50 dark:bg-red-950/40'
                      }
                    >
                      {selectedNode.difficulty}
                    </Badge>
                  )}
                  {selectedNode.id && completedItems.has(selectedNode.id) && (
                    <Badge variant="outline" className="border-green-500/40 text-green-600 bg-green-50 dark:bg-green-950/40">
                      ✓ Completed
                    </Badge>
                  )}
                </div>
              )}

              <div className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-lg p-3 border border-border">
                {selectedNode.description.split('\n').map((line, i) => (
                  <p key={i} className="mb-1.5 last:mb-0">{line}</p>
                ))}
              </div>

              {selectedNode.type === 'item' && selectedNode.id && (
                <Button
                  className="mt-4 w-full"
                  variant={completedItems.has(selectedNode.id) ? 'outline' : 'default'}
                  onClick={() => selectedNode.id && toggleCompletion(selectedNode.id)}
                >
                  {completedItems.has(selectedNode.id) ? '↩ Mark Incomplete' : '✓ Mark Complete'}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* SVG Visualization */}
        <div className="flex-1 min-w-0 rounded-xl border border-border bg-card overflow-hidden relative">
          {roadmapData ? (
            <>
              <svg ref={svgRef} className="w-full h-full" style={{ userSelect: 'none' }} />
              <div className="absolute top-3 right-3 px-3 py-2 bg-card/90 backdrop-blur-sm border border-border rounded-lg text-xs text-muted-foreground">
                Click a node to see details — or drag/scroll to navigate
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-sm px-6">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
                  <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold mb-2">
                  Hello{user.profile?.full_name ? `, ${user.profile.full_name.split(' ')[0]}` : ''}!
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Enter any topic below to generate a personalized learning roadmap powered by AI.
                </p>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-muted-foreground text-left">
                  <span className="font-semibold text-primary">Tip:</span> Click on any node to see details and mark items as complete. Use the chatbot to ask follow-up questions.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chatbot Panel */}
        {selectedNode && showChatbot && (
          <div className="w-96 shrink-0 flex flex-col bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
              <h3 className="text-sm font-semibold">COSMOS AI</h3>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowChatbot(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden min-h-0">
              <RoadmapChatPanel topic={selectedNode.name} threadId={threadId} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Input Bar */}
      <div className="shrink-0 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="max-w-3xl mx-auto p-4">
          {error && (
            <div className="mb-3 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive flex items-center gap-1.5">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="relative flex items-end gap-2 rounded-2xl border bg-background p-2">
              {/* History toggle */}
              <Button
                type="button"
                variant={showHistoryPanel ? 'default' : 'ghost'}
                size="icon"
                className="shrink-0 rounded-xl h-9 w-9 self-end"
                onClick={() => setShowHistoryPanel((v) => !v)}
                title="Toggle history"
              >
                <HistoryIcon className="h-4 w-4" />
              </Button>

              {/* Textarea */}
              <Textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter a learning topic (e.g. Data Structures, Python, DBMS)…"
                className="min-h-11 max-h-[200px] flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                disabled={isLoading}
              />

              {/* Voice button */}
              <button
                type="button"
                onClick={toggleVoice}
                disabled={isLoading}
                className={`shrink-0 self-end mb-1 p-1.5 rounded-lg transition-colors ${
                  isListening
                    ? 'text-destructive animate-pulse'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={isListening ? 'Stop listening' : 'Voice input'}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              {/* Reset */}
              {roadmapData && (
                <button
                  type="button"
                  className="shrink-0 self-end mb-1 p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  title="Reset roadmap"
                  onClick={() => {
                    setRoadmapData(null);
                    setQuery('');
                    setSelectedNode(null);
                    setCompletedItems(new Set());
                    setError(null);
                    setThreadId(null);
                  }}
                >
                  <RefreshCwIcon className="h-4 w-4" />
                </button>
              )}

              {/* Submit */}
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !query.trim()}
                className="shrink-0 rounded-xl self-end"
                title="Generate roadmap"
              >
                {isLoading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-2">
            Press Enter to generate · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
