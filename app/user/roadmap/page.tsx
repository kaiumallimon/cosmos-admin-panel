'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { ArrowLeftIcon, HistoryIcon, Loader2, MessageSquare, Mic, MicOff, PlusCircle, RefreshCwIcon, Send, X } from 'lucide-react';
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
  resources: string[];
}

interface RoadmapStage {
  title: string;
  description: string;
  items: RoadmapItem[];
}

interface RoadmapData {
  id?: string;
  user_id?: string;
  topic: string;
  introduction?: string;
  stages: RoadmapStage[];
  created_at?: string;
  updated_at?: string;
}

interface D3NodeData {
  name: string;
  type: 'root' | 'stage' | 'item';
  description: string;
  difficulty?: never;
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
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Roadmap state
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roadmapId, setRoadmapId] = useState<string | null>(null);
  const [autoMessage, setAutoMessage] = useState<{ text: string; nodeTitle?: string } | null>(null);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<D3NodeData | null>(null);

  // Panels
  const [showDetails, setShowDetails] = useState(true);
  const [showChatbot, setShowChatbot] = useState(true);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  // History
  const [chatHistory, setChatHistory] = useState<RoadmapData[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');

  // Chat panel resize
  const [chatPanelWidth, setChatPanelWidth] = useState(384);
  const chatDragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const onChatDragStart = useCallback((e: React.MouseEvent) => {
    chatDragRef.current = { startX: e.clientX, startWidth: chatPanelWidth };
    e.preventDefault();
  }, [chatPanelWidth]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!chatDragRef.current) return;
      const delta = chatDragRef.current.startX - e.clientX;
      const next = Math.min(640, Math.max(280, chatDragRef.current.startWidth + delta));
      setChatPanelWidth(next);
    };
    const onMouseUp = () => { chatDragRef.current = null; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

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
      // API returns RoadmapData[] directly
      setChatHistory(Array.isArray(data) ? data : []);
    } catch {
      setChatHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadThread = (thread: RoadmapData) => {
    setRoadmapData(thread);
    setRoadmapId(thread.id ?? null);
    setQuery(thread.topic || '');
    setSelectedNode(null);
    setCompletedItems(new Set());
    setAutoMessage(null);
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
      if (data.id) setRoadmapId(data.id);
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
      spine:        dark ? '#60a5fa' : '#3b82f6',
      stageFill:    dark ? '#1c1a0e' : '#fffbeb',
      stageStroke:  dark ? '#d97706' : '#f59e0b',
      stageAccent:  dark ? '#d97706' : '#f59e0b',
      stageText:    dark ? '#fde68a' : '#1c1917',
      itemFill:     dark ? '#111110' : '#ffffff',
      itemStroke:   dark ? '#44403c' : '#e5e7eb',
      itemText:     dark ? '#e7e5e4' : '#1c1917',
      itemSubText:  dark ? '#a8a29e' : '#78716c',
      doneFill:     dark ? '#052e16' : '#f0fdf4',
      doneStroke:   dark ? '#166534' : '#86efac',
      doneText:     dark ? '#86efac' : '#15803d',
      dot:          dark ? '#60a5fa' : '#3b82f6',
      topicText:    '#f97316',
      canvasBg:     dark ? '#0a0a0a' : '#f8fafc',
    };

    // ── Layout constants ───────────────────────────────────────────────────
    const SVG_W       = 1260;
    const CX          = SVG_W / 2;
    const STAGE_W     = 220;
    const STAGE_H     = 52;
    const STAGE_R     = 10;
    const ITEM_W      = 220;
    const ITEM_H      = 44;
    const ITEM_R      = 8;
    const ITEM_GAP_X  = 340;
    const ITEM_SPACING = 58;
    const STAGE_PAD   = 90;
    const TOP_PAD     = 100;

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
    svg.attr('width', SVG_W).attr('height', SVG_H)
       .style('background', palette.canvasBg)
       .style('transition', 'background 0.3s');

    // Defs: drop-shadow filters
    const defs = svg.append('defs');
    defs.append('filter').attr('id', 'shadow-stage')
      .append('feDropShadow')
      .attr('dx', 0).attr('dy', 3).attr('stdDeviation', 6)
      .attr('flood-color', dark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.12)');
    defs.append('filter').attr('id', 'shadow-item')
      .append('feDropShadow')
      .attr('dx', 0).attr('dy', 2).attr('stdDeviation', 4)
      .attr('flood-color', dark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.08)');

    const g = svg.append('g');

    // ── Zoom (wide range, smooth) ──────────────────────────────────────────
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.04, 8])
      .interpolate(d3.interpolateZoom)
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    zoomRef.current = zoom;
    svg.call(zoom as any).on('dblclick.zoom', null);

    // ── Spine line ─────────────────────────────────────────────────────────
    const spineTop = stageYs[0] - STAGE_H / 2 - 32;
    const spineBot = stageYs[stageYs.length - 1] + STAGE_H / 2 + 32;

    // Glow spine (thick, soft)
    g.append('line')
      .attr('x1', CX).attr('y1', spineTop)
      .attr('x2', CX).attr('y2', spineBot)
      .attr('stroke', palette.spine)
      .attr('stroke-width', 6)
      .attr('opacity', 0.07);

    // Main spine
    g.append('line')
      .attr('x1', CX).attr('y1', spineTop)
      .attr('x2', CX).attr('y2', spineBot)
      .attr('stroke', palette.spine)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '6,4')
      .attr('opacity', 0.45);

    // ── Topic title ────────────────────────────────────────────────────────
    const titleY = spineTop - 16;
    // Pill background
    const titleG = g.append('g').attr('transform', `translate(${CX},${titleY})`);
    titleG.append('rect')
      .attr('x', -110).attr('y', -16)
      .attr('width', 220).attr('height', 32)
      .attr('rx', 16)
      .attr('fill', dark ? 'rgba(249,115,22,0.15)' : 'rgba(249,115,22,0.10)')
      .attr('stroke', 'rgba(249,115,22,0.35)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '5,3');
    titleG.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '14px').attr('font-weight', '700')
      .attr('letter-spacing', '0.8')
      .attr('fill', palette.topicText)
      .text(roadmapData.topic.length > 26 ? roadmapData.topic.substring(0, 24) + '…' : roadmapData.topic);

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
            const t = tspan.text();
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
      const stageY      = stageYs[si];
      const side        = si % 2 === 0 ? 1 : -1;
      const itemCX      = CX + side * ITEM_GAP_X;
      const stageEdgeX  = CX + side * (STAGE_W / 2);
      const itemEdgeX   = itemCX - side * (ITEM_W / 2);

      // Section label above stage group
      g.append('text')
        .attr('x', CX)
        .attr('y', stageY - STAGE_H / 2 - 10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('font-weight', '500')
        .attr('letter-spacing', '1.5')
        .attr('fill', palette.spine)
        .attr('opacity', 0.5)
        .attr('text-transform', 'uppercase')
        .text(`STAGE ${si + 1}`);

      // ── Stage node ───────────────────────────────────────────────────────
      const stageG = g.append('g')
        .attr('transform', `translate(${CX},${stageY})`)
        .style('cursor', 'pointer')
        .style('transition', 'transform 0.2s');

      stageG.append('rect')
        .attr('x', -STAGE_W / 2).attr('y', -STAGE_H / 2)
        .attr('width', STAGE_W).attr('height', STAGE_H)
        .attr('rx', STAGE_R)
        .attr('fill', palette.stageFill)
        .attr('stroke', palette.stageStroke)
        .attr('stroke-width', 1.8)
        .attr('stroke-dasharray', '7,3')
        .attr('filter', 'url(#shadow-stage)');

      // Left accent bar
      stageG.append('rect')
        .attr('x', -STAGE_W / 2).attr('y', -STAGE_H / 2)
        .attr('width', 5).attr('height', STAGE_H)
        .attr('rx', STAGE_R)
        .attr('fill', palette.stageAccent)
        .attr('opacity', 0.9);

      // Stage label
      const stageTxt = stageG.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '13px').attr('font-weight', '700')
        .attr('fill', palette.stageText)
        .attr('pointer-events', 'none');

      const stageWords = stage.title.split(/\s+/);
      let stageLine: string[] = [];
      const stageLines: string[] = [];
      const stageTmpSpan = stageTxt.append('tspan').attr('x', 0).attr('dy', '0em');
      for (const w of stageWords) {
        stageLine.push(w);
        stageTmpSpan.text(stageLine.join(' '));
        const sn = stageTmpSpan.node() as SVGTSpanElement | null;
        if (sn && sn.getComputedTextLength() > STAGE_W - 28 && stageLine.length > 1) {
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
          .attr('x', 4)
          .attr('dy', li === 0 ? `${stageOffsetY}em` : `${stageLH}em`)
          .text(l);
      });

      // Hover
      stageG
        .on('mouseenter', function() {
          d3.select(this).raise()
            .select('rect')
            .transition().duration(150)
            .attr('stroke-width', 2.5)
            .attr('filter', `drop-shadow(0 4px 14px ${dark ? 'rgba(217,119,6,0.45)' : 'rgba(245,158,11,0.4)'}`);
        })
        .on('mouseleave', function() {
          d3.select(this)
            .select('rect')
            .transition().duration(150)
            .attr('stroke-width', 1.8)
            .attr('filter', 'url(#shadow-stage)');
        })
        .on('click', () => {
          setSelectedNode({ name: stage.title, type: 'stage', description: stage.description, stageIndex: si });
          setShowDetails(true);
          setShowChatbot(true);
          setAutoMessage({ text: `Tell me about "${stage.title}" in the context of ${roadmapData?.topic ?? 'this topic'}.`, nodeTitle: stage.title });
        });

      // ── Items ─────────────────────────────────────────────────────────────
      stage.items.forEach((item, ii) => {
        const offsetY = (ii - (stage.items.length - 1) / 2) * ITEM_SPACING;
        const itemY   = stageY + offsetY;
        const nodeId  = `${si}-${ii}`;
        const done    = completedItems.has(nodeId);

        const diffColor = '#6366f1'; // indigo accent (no difficulty in API)

        // Bezier connector
        const midX = (stageEdgeX + itemEdgeX) / 2;
        g.append('path')
          .attr('d', `M ${stageEdgeX},${stageY} C ${midX},${stageY} ${midX},${itemY} ${itemEdgeX},${itemY}`)
          .attr('fill', 'none')
          .attr('stroke', palette.spine)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '4,3')
          .attr('opacity', 0.4);

        // End-point dots
        g.append('circle').attr('cx', stageEdgeX).attr('cy', stageY)
          .attr('r', 3.5).attr('fill', palette.spine).attr('opacity', 0.6);
        g.append('circle').attr('cx', itemEdgeX).attr('cy', itemY)
          .attr('r', 3.5).attr('fill', palette.spine).attr('opacity', 0.6);

        // Item group
        const itemG = g.append('g')
          .attr('transform', `translate(${itemCX},${itemY})`)
          .style('cursor', 'pointer');

        // Main rect — dashed border
        itemG.append('rect')
          .attr('x', -ITEM_W / 2).attr('y', -ITEM_H / 2)
          .attr('width', ITEM_W).attr('height', ITEM_H)
          .attr('rx', ITEM_R)
          .attr('fill', done ? palette.doneFill : palette.itemFill)
          .attr('stroke', done ? palette.doneStroke : palette.itemStroke)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '6,3')
          .attr('filter', 'url(#shadow-item)');

        // Left difficulty accent strip
        itemG.append('rect')
          .attr('x', -ITEM_W / 2).attr('y', -ITEM_H / 2)
          .attr('width', 4).attr('height', ITEM_H)
          .attr('rx', ITEM_R)
          .attr('fill', done ? '#22c55e' : diffColor)
          .attr('opacity', 0.85);

        // Check icon for done
        if (done) {
          itemG.append('text')
            .attr('x', -ITEM_W / 2 + 14).attr('y', 1)
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '11px')
            .attr('fill', palette.doneText)
            .text('✓');
        }

        // Item name
        const itemTxt = itemG.append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('font-size', '11px').attr('font-weight', '500')
          .attr('fill', done ? palette.doneText : palette.itemText)
          .attr('pointer-events', 'none');
        svgWrapText(itemTxt as any, item.name, ITEM_W - (done ? 44 : 28), 1.15, 2);

        // Difficulty dot (right edge)
        itemG.append('circle')
          .attr('cx', ITEM_W / 2 - 11).attr('cy', 0)
          .attr('r', 4.5)
          .attr('fill', diffColor)
          .attr('opacity', done ? 0.4 : 0.85);

        // Hover
        itemG
          .on('mouseenter', function() {
            d3.select(this).raise();
            d3.select(this).select('rect')
              .transition().duration(130)
              .attr('stroke-width', 2.2)
              .attr('filter', `drop-shadow(0 3px 12px ${dark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.18)'}`);
          })
          .on('mouseleave', function() {
            d3.select(this).select('rect')
              .transition().duration(130)
              .attr('stroke-width', 1.5)
              .attr('filter', 'url(#shadow-item)');
          })
          .on('click', () => {
            const nodeData: D3NodeData = {
              name: item.name, type: 'item', description: item.description,
              id: nodeId, stageIndex: si, itemIndex: ii,
            };
            setSelectedNode(nodeData);
            setShowDetails(true);
            setShowChatbot(true);
            setAutoMessage({ text: `Explain "${item.name}" in detail.`, nodeTitle: item.name });
            toggleCompletion(nodeId);
          });
      });
    });

    // ── Entrance fade-in ───────────────────────────────────────────────────
    g.attr('opacity', 0);
    g.transition().duration(500).ease(d3.easeCubicOut).attr('opacity', 1);

    // ── Auto-fit (smooth) ─────────────────────────────────────────────────
    const containerEl = svgRef.current!.parentElement!;
    const cW = containerEl.clientWidth  || 800;
    const cH = containerEl.clientHeight || 600;
    const bounds = (g.node() as SVGGElement).getBBox();
    const scale  = Math.min(cW / (bounds.width + 100), cH / (bounds.height + 100)) * 0.88;
    const tx = cW / 2 - (bounds.x + bounds.width  / 2) * scale;
    const ty = cH / 2 - (bounds.y + bounds.height / 2) * scale;

    svg.transition().duration(650).ease(d3.easeCubicInOut).call(
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
      list = list.filter((t) => t.topic?.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'date') return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
      return (a.topic || '').localeCompare(b.topic || '');
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

        <div className="flex items-center gap-2">
          {/* Progress (only when roadmap loaded) */}
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

          {/* New Roadmap */}
          {roadmapData && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => {
                setRoadmapData(null);
                setRoadmapId(null);
                setQuery('');
                setSelectedNode(null);
                setCompletedItems(new Set());
                setError(null);
                setAutoMessage(null);
                setTimeout(() => textareaRef.current?.focus(), 50);
              }}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              New
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
                  const isActive = thread.id === roadmapId;
                  const stageCount = thread.stages?.length ?? 0;
                  const itemCount = thread.stages?.reduce((t, s) => t + s.items.length, 0) ?? 0;
                  return (
                    <div
                      key={thread.id}
                      onClick={() => loadThread(thread)}
                      className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                        isActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'
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

              {selectedNode.type === 'item' && selectedNode.id && completedItems.has(selectedNode.id) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="border-green-500/40 text-green-600 bg-green-50 dark:bg-green-950/40">
                    ✓ Completed
                  </Badge>
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

              {/* Zoom controls */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-10">
                <button
                  onClick={() => {
                    if (!svgRef.current || !zoomRef.current) return;
                    d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy as any, 1.4);
                  }}
                  className="w-8 h-8 rounded-lg border border-border bg-card/90 backdrop-blur-sm text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all flex items-center justify-center text-base font-bold shadow-sm"
                  title="Zoom in"
                >+</button>
                <button
                  onClick={() => {
                    if (!svgRef.current || !zoomRef.current) return;
                    d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy as any, 0.7);
                  }}
                  className="w-8 h-8 rounded-lg border border-border bg-card/90 backdrop-blur-sm text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all flex items-center justify-center text-base font-bold shadow-sm"
                  title="Zoom out"
                >−</button>
                <button
                  onClick={() => {
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
                    svg.transition().duration(450).call(zoomRef.current.transform as any, d3.zoomIdentity.translate(tx, ty).scale(scale));
                  }}
                  className="w-8 h-8 rounded-lg border border-border bg-card/90 backdrop-blur-sm text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all flex items-center justify-center shadow-sm"
                  title="Fit to screen"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M3 3h6M3 3v6M21 3h-6M21 3v6M3 21h6M3 21v-6M21 21h-6M21 21v-6"/>
                  </svg>
                </button>
              </div>

              {/* Hint */}
              <div className="absolute top-3 right-3 px-2.5 py-1.5 bg-card/90 backdrop-blur-sm border border-border rounded-lg text-xs text-muted-foreground pointer-events-none">
                Click node · Drag to pan · Scroll to zoom
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

        {/* Chatbot Panel — resizable via drag handle on left edge */}
        {showChatbot && (
          <div
            className="shrink-0 flex flex-col bg-card border border-border rounded-xl overflow-hidden relative select-none"
            style={{ width: chatPanelWidth }}
          >
            {/* ─ Drag handle ─ */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1.5 z-20 cursor-col-resize group"
              onMouseDown={onChatDragStart}
            >
              <div className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-transparent group-hover:bg-primary/30 transition-colors" />
              <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1 h-10 rounded-full bg-border group-hover:bg-primary/60 transition-colors" />
            </div>

            <div className="pl-2 pr-3 py-3 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0" />
                <h3 className="text-sm font-semibold truncate">COSMOS AI</h3>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setShowChatbot(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden min-h-0">
              <RoadmapChatPanel
                roadmapId={roadmapId}
                autoMessage={autoMessage}
                onAutoMessageSent={() => setAutoMessage(null)}
              />
            </div>
          </div>
        )}

        {/* Floating open-chat button when panel is closed and a roadmap is loaded */}
        {!showChatbot && roadmapId && (
          <button
            onClick={() => setShowChatbot(true)}
            className="shrink-0 self-center flex flex-col items-center gap-1 w-8 py-3 rounded-xl border border-border bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-muted-foreground shadow-sm"
            title="Open AI Chat"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-[9px] font-medium [writing-mode:vertical-rl] rotate-180 leading-none">AI Chat</span>
          </button>
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

              {/* Reset — keep as subtle icon in the bar */}
              {roadmapData && (
                <button
                  type="button"
                  className="shrink-0 self-end mb-1 p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                  title="Clear and start new"
                  onClick={() => {
                    setRoadmapData(null);
                    setQuery('');
                    setSelectedNode(null);
                    setCompletedItems(new Set());
                    setError(null);
                    setRoadmapId(null);
                    setAutoMessage(null);
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
