'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import * as d3 from 'd3';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';

import type { D3NodeData, RoadmapData } from '@/components/roadmap/types';
import { useRoadmapD3 } from '@/components/roadmap/useRoadmapD3';
import { RoadmapTopNav } from '@/components/roadmap/RoadmapTopNav';
import { RoadmapCanvas } from '@/components/roadmap/RoadmapCanvas';
import { HistoryPanel } from '@/components/roadmap/HistoryPanel';
import { DetailsPanel } from '@/components/roadmap/DetailsPanel';
import { DesktopChatPanel } from '@/components/roadmap/DesktopChatPanel';
import { MobileDrawers } from '@/components/roadmap/MobileDrawers';
import { RoadmapInputBar } from '@/components/roadmap/RoadmapInputBar';

export default function RoadmapPage() {
  const { user } = useAuthStore();
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Roadmap state ──────────────────────────────────────────────────────────
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roadmapId, setRoadmapId] = useState<string | null>(null);
  const [autoMessage, setAutoMessage] = useState<{ text: string; nodeTitle?: string } | null>(null);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<D3NodeData | null>(null);

  // ── Panel visibility ───────────────────────────────────────────────────────
  const [showDetails, setShowDetails] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  // ── History ────────────────────────────────────────────────────────────────
  const [chatHistory, setChatHistory] = useState<RoadmapData[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');

  // ── Voice ──────────────────────────────────────────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // ── URL sync helpers ───────────────────────────────────────────────────────
  const pushRoadmapId = useCallback((id: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set('id', id); else params.delete('id');
    router.replace(`/user/roadmap?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // ── Load roadmap by ID ─────────────────────────────────────────────────────
  const loadRoadmapById = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/roadmap/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.stages) {
        setRoadmapData(data);
        setRoadmapId(data.id ?? id);
        setQuery(data.topic ?? '');
        setCompletedItems(new Set());
        setSelectedNode(null);
      }
    } catch { /* silently ignore */ }
  }, []);

  // ── Hydrate from URL on first render ──────────────────────────────────────
  const didHydrate = useRef(false);
  useEffect(() => {
    if (didHydrate.current) return;
    didHydrate.current = true;
    const idFromUrl = searchParams.get('id');
    if (idFromUrl) loadRoadmapById(idFromUrl);
  }, [searchParams, loadRoadmapById]);

  // ── Init speech recognition + fetch history on mount ──────────────────────
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

  // ── Auto-resize textarea ───────────────────────────────────────────────────
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [query]);

  // ── D3 rendering (delegated to hook) ──────────────────────────────────────
  const toggleCompletion = useCallback((id: string) => {
    setCompletedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  useRoadmapD3({
    roadmapData, completedItems, toggleCompletion, resolvedTheme,
    svgRef, zoomRef, isMobile,
    setSelectedNode, setShowDetails, setShowChatbot, setAutoMessage,
  });

  // ── History ────────────────────────────────────────────────────────────────
  const fetchChatHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/roadmap/threads');
      if (!res.ok) throw new Error();
      const data = await res.json();
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
    setShowHistoryPanel(false);
    pushRoadmapId(thread.id ?? null);
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
      if (data.id) { setRoadmapId(data.id); pushRoadmapId(data.id); }
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

  const handleReset = () => {
    setRoadmapData(null);
    setQuery('');
    setSelectedNode(null);
    setCompletedItems(new Set());
    setError(null);
    setRoadmapId(null);
    setAutoMessage(null);
    pushRoadmapId(null);
  };

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalItems     = roadmapData?.stages?.reduce((t, s) => t + s.items.length, 0) ?? 0;
  const completedCount = completedItems.size;
  const progressPct    = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  const filteredHistory = useMemo(() => {
    let list = chatHistory;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) => t.topic?.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) =>
      sortBy === 'date'
        ? new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
        : (a.topic || '').localeCompare(b.topic || ''),
    );
  }, [chatHistory, searchQuery, sortBy]);

  // ── Shared history props ───────────────────────────────────────────────────
  const historyContentProps = {
    filteredHistory, loadingHistory, searchQuery, setSearchQuery,
    sortBy, setSortBy, roadmapId, loadThread,
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden fixed inset-0">

      <RoadmapTopNav
        roadmapData={roadmapData}
        completedCount={completedCount}
        totalItems={totalItems}
        progressPct={progressPct}
        showChatbot={showChatbot}
        setShowChatbot={setShowChatbot}
        showHistoryPanel={showHistoryPanel}
        setShowHistoryPanel={setShowHistoryPanel}
        roadmapId={roadmapId}
        onNew={() => {
          handleReset();
          setTimeout(() => textareaRef.current?.focus(), 50);
        }}
      />

      {/* Body */}
      <div className="flex-1 flex gap-3 overflow-hidden p-3 min-h-0">

        {/* History panel (desktop) */}
        {showHistoryPanel && !isMobile && (
          <HistoryPanel onClose={() => setShowHistoryPanel(false)} {...historyContentProps} />
        )}

        {/* Details panel (desktop) */}
        {selectedNode && showDetails && !isMobile && (
          <DetailsPanel
            selectedNode={selectedNode}
            completedItems={completedItems}
            toggleCompletion={toggleCompletion}
            onClose={() => setShowDetails(false)}
          />
        )}

        {/* SVG Canvas */}
        <div className="flex-1 min-w-0 rounded-xl border border-border bg-card overflow-hidden relative">
          <RoadmapCanvas
            roadmapData={roadmapData}
            svgRef={svgRef}
            zoomRef={zoomRef}
            isMobile={isMobile}
            roadmapId={roadmapId}
            selectedNode={selectedNode}
            userName={user?.profile?.full_name ?? undefined}
            setShowHistoryPanel={setShowHistoryPanel}
            setShowDetails={setShowDetails}
            setShowChatbot={setShowChatbot}
            onTopicSelect={(topic) => {
              setQuery(topic);
              setTimeout(() => textareaRef.current?.focus(), 50);
            }}
          />
        </div>

        {/* AI Chat panel (desktop) */}
        {showChatbot && !isMobile && (
          <DesktopChatPanel
            roadmapId={roadmapId}
            autoMessage={autoMessage}
            onAutoMessageSent={() => setAutoMessage(null)}
            onClose={() => setShowChatbot(false)}
          />
        )}

        {/* Collapsed chat tab (desktop) */}
        {!showChatbot && roadmapId && !isMobile && (
          <Button
            variant="outline"
            onClick={() => setShowChatbot(true)}
            className="shrink-0 self-center flex flex-col items-center gap-1 w-8 h-auto py-3 rounded-xl bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary text-muted-foreground shadow-sm"
            title="Open AI Chat"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-[9px] font-medium [writing-mode:vertical-rl] rotate-180 leading-none">AI Chat</span>
          </Button>
        )}
      </div>

      {/* Mobile Drawers (only mounted on mobile) */}
      {isMobile && (
        <MobileDrawers
          showHistoryPanel={showHistoryPanel}
          setShowHistoryPanel={setShowHistoryPanel}
          {...historyContentProps}
          showDetails={showDetails}
          setShowDetails={setShowDetails}
          selectedNode={selectedNode}
          completedItems={completedItems}
          toggleCompletion={toggleCompletion}
          showChatbot={showChatbot}
          setShowChatbot={setShowChatbot}
          autoMessage={autoMessage}
          onAutoMessageSent={() => setAutoMessage(null)}
        />
      )}

      <RoadmapInputBar
        query={query}
        setQuery={setQuery}
        isLoading={isLoading}
        error={error}
        roadmapData={roadmapData}
        isListening={isListening}
        textareaRef={textareaRef}
        handleSubmit={handleSubmit}
        handleKeyDown={handleKeyDown}
        toggleVoice={toggleVoice}
        onReset={handleReset}
      />
    </div>
  );
}
