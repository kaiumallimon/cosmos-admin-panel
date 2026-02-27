'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { ArrowLeftIcon, HistoryIcon, Loader2, Mic, MicOff, RefreshCwIcon, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RoadmapChatPanel } from '@/components/roadmap/RoadmapChatPanel';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';

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
  const svgRef = useRef<SVGSVGElement>(null);

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

  // ── D3 Rendering ───────────────────────────────────────────────────────────
  const transformData = (data: RoadmapData): D3NodeData | null => {
    if (!data?.stages?.length) return null;
    return {
      name: data.topic,
      type: 'root',
      description: data.introduction || '',
      children: data.stages.map((stage, si) => ({
        name: stage.title,
        type: 'stage',
        description: stage.description,
        stageIndex: si,
        children: stage.items.map((item, ii) => ({
          name: item.name,
          type: 'item',
          description: item.description,
          difficulty: item.difficulty,
          id: `${si}-${ii}`,
          stageIndex: si,
          itemIndex: ii,
        })),
      })),
    };
  };

  const getItemFill = (difficulty?: string) => {
    if (difficulty === 'Easy') return '#22c55e';
    if (difficulty === 'Medium') return '#f59e0b';
    if (difficulty === 'Hard') return '#ef4444';
    return '#6366f1';
  };

  useEffect(() => {
    if (!roadmapData?.stages?.length || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const WIDTH = 1400;
    const HEIGHT = 1800;
    svg.attr('width', WIDTH).attr('height', HEIGHT);

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.08, 4])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom as any);

    const treeData = transformData(roadmapData);
    if (!treeData) return;

    const root = d3.hierarchy<D3NodeData>(treeData);
    const treeLayout = d3.tree<D3NodeData>().size([WIDTH - 200, 500]);
    treeLayout(root);

    // Zigzag items left/right
    root.descendants().forEach((d) => {
      if (d.data.type === 'item' && d.data.itemIndex !== undefined) {
        (d as any).y = (d as any).y + (d.data.itemIndex % 2 === 0 ? 20 : -500);
      }
    });

    // Center spinal line through stage nodes
    const stageNodes = root.descendants().filter((d) => d.data.type === 'stage');
    if (stageNodes.length) {
      const topX = d3.min(stageNodes, (d) => (d as any).x) as number;
      const botX = d3.max(stageNodes, (d) => (d as any).x) as number;
      const centerY = d3.mean(stageNodes, (d) => (d as any).y) as number;
      g.append('line')
        .attr('x1', centerY).attr('y1', topX - 150)
        .attr('x2', centerY).attr('y2', botX)
        .attr('stroke', '#6366f1').attr('stroke-width', 2);
      g.append('text')
        .attr('x', centerY).attr('y', topX - 165)
        .attr('text-anchor', 'middle')
        .attr('font-size', '17px').attr('font-weight', 'bold').attr('fill', '#f97316')
        .text(roadmapData.topic);
    }

    // Links (skip root)
    g.selectAll('.link')
      .data(root.links().filter((d) => d.source.data.type !== 'root'))
      .enter().append('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal<any, any>().x((d) => d.y).y((d) => d.x))
      .attr('fill', 'none')
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', 4)
      .attr('opacity', 0.7);

    // Nodes (skip root)
    const nodes = g.selectAll('.node')
      .data(root.descendants().filter((d) => d.data.type !== 'root'))
      .enter().append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${(d as any).y},${(d as any).x})`)
      .style('cursor', 'pointer');

    nodes.on('click', (_event, d) => {
      setSelectedNode(d.data);
      setShowDetails(true);
      setShowChatbot(true);
      if (d.data.type === 'item' && d.data.id) toggleCompletion(d.data.id);
    });

    // Measure text dimensions via temporary invisible elements
    const textDims = new Map<any, { width: number; height: number; lines: string[]; lineH: number; fontSize: number }>();
    const tempGroup = g.append('g').attr('visibility', 'hidden');

    root.descendants().filter((d) => d.data.type !== 'root').forEach((d) => {
      const el = tempGroup.append('text')
        .attr('font-size', d.data.type === 'stage' ? '12px' : '10px')
        .attr('font-weight', d.data.type === 'stage' ? '600' : 'normal');

      const maxWidth = d.data.type === 'stage' ? 150 : 140;
      const words = d.data.name.split(/\s+/);
      let line: string[] = [];
      const lines: string[] = [];

      words.forEach((word) => {
        line.push(word);
        el.text(line.join(' '));
        const node = el.node();
        if (node && node.getComputedTextLength() > maxWidth && line.length > 1) {
          line.pop();
          lines.push(line.join(' '));
          line = [word];
        }
      });
      if (line.length) lines.push(line.join(' '));

      const fontSize = d.data.type === 'stage' ? 12 : 10;
      let maxLen = 0;
      lines.forEach((l) => {
        el.text(l);
        const n = el.node();
        if (n) maxLen = Math.max(maxLen, n.getComputedTextLength());
      });

      textDims.set(d, { width: maxLen + 20, height: lines.length * fontSize * 1.3 + 12, lines, lineH: 1.2, fontSize });
      el.remove();
    });
    tempGroup.remove();

    // Render node rectangles
    nodes.append('rect')
      .attr('rx', 5).attr('ry', 5)
      .attr('x', (d) => -(textDims.get(d)?.width ?? 60) / 2)
      .attr('y', (d) => {
        const dims = textDims.get(d);
        if (!dims) return -15;
        return -dims.fontSize + dims.fontSize * 0.2 - 6;
      })
      .attr('width', (d) => textDims.get(d)?.width ?? 60)
      .attr('height', (d) => textDims.get(d)?.height ?? 24)
      .attr('fill', (d) => d.data.type === 'stage' ? '#6366f1' : getItemFill(d.data.difficulty))
      .attr('stroke', 'rgba(0,0,0,0.15)')
      .attr('stroke-width', 1);

    // Completion checkmark overlay
    nodes.filter((d) => d.data.type === 'item' && !!d.data.id && completedItems.has(d.data.id))
      .append('text')
      .attr('text-anchor', 'middle').attr('dy', '-0.2em')
      .attr('font-size', '10px').attr('fill', 'rgba(255,255,255,0.7)')
      .text('✓');

    // Render text labels
    nodes.append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', (d) => d.data.type === 'stage' ? '12px' : '10px')
      .attr('font-weight', (d) => d.data.type === 'stage' ? '600' : 'normal')
      .attr('fill', 'white')
      .each(function (d) {
        const el = d3.select(this);
        const dims = textDims.get(d);
        if (!dims) { el.text(d.data.name); return; }
        dims.lines.forEach((lineText, i) => {
          if (i === 0) el.text(lineText);
          else el.append('tspan').attr('x', 0).attr('dy', `${dims.lineH}em`).text(lineText);
        });
      });

    // Auto-fit
    const bounds = (g.node() as SVGGElement).getBBox();
    const scale = Math.min(WIDTH / bounds.width, HEIGHT / bounds.height) * 0.75;
    svg.call(
      zoom.transform as any,
      d3.zoomIdentity
        .translate(WIDTH / 2 - bounds.width * scale / 2, HEIGHT / 2 - bounds.height * scale / 2)
        .scale(scale)
    );
  }, [roadmapData, completedItems, toggleCompletion]);

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
      <div className="shrink-0 border-t border-border/60 bg-card/80 backdrop-blur-sm px-4 py-3 z-20">
        <div className="max-w-2xl mx-auto">
          {error && (
            <div className="mb-2 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive flex items-center gap-1.5">
              <span>⚠</span> {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            {/* History toggle (mobile & as shortcut) */}
            <Button
              type="button"
              variant={showHistoryPanel ? 'default' : 'outline'}
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => setShowHistoryPanel((v) => !v)}
              title="Toggle history"
            >
              <HistoryIcon className="h-4 w-4" />
            </Button>

            <div className="flex-1 relative">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter a learning topic (e.g. Data Structures, Python, DBMS)…"
                disabled={isLoading}
                className="pr-10 text-sm"
              />
              {/* Voice button */}
              <button
                type="button"
                onClick={toggleVoice}
                disabled={isLoading}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
                  isListening
                    ? 'text-destructive animate-pulse'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={isListening ? 'Stop listening' : 'Voice input'}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            </div>

            <Button type="submit" disabled={isLoading || !query.trim()} className="shrink-0">
              {isLoading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating…</>
              ) : (
                <><Send className="h-4 w-4 mr-2" />Generate</>
              )}
            </Button>

            {roadmapData && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 h-9 w-9"
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
              </Button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
