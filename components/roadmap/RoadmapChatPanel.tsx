'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  node_title?: string | null;
  created_at?: string;
}

export interface RoadmapChatPanelProps {
  roadmapId: string | null;
  autoMessage: { text: string; nodeTitle?: string } | null;
  onAutoMessageSent: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RoadmapChatPanel({ roadmapId, autoMessage, onAutoMessageSent }: RoadmapChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastAutoMessage = useRef<string | null>(null);
  const lastRoadmapId = useRef<string | null>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  // ── Load chat history when roadmapId changes ──────────────────────────────
  useEffect(() => {
    if (!roadmapId || roadmapId === lastRoadmapId.current) return;
    lastRoadmapId.current = roadmapId;
    lastAutoMessage.current = null; // reset so new node clicks fire

    setMessages([]);
    setLoadingHistory(true);

    fetch(`/api/roadmap/${roadmapId}/chat`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.messages)) {
          setMessages(
            data.messages.map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              node_title: m.node_title,
              created_at: m.created_at,
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [roadmapId]);

  // ── Send a message ────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string, nodeTitle?: string, isAuto = false) => {
      if (!text.trim() || !roadmapId || loading) return;

      const userMsg: ChatMessage = { role: 'user', content: text.trim(), node_title: nodeTitle };
      setMessages((prev) => [...prev, userMsg]);
      if (!isAuto) setInput('');
      setLoading(true);

      try {
        const body: Record<string, any> = { message: text.trim() };
        if (nodeTitle) body.node_title = nodeTitle;

        const res = await fetch(`/api/roadmap/${roadmapId}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.assistant_message) {
          setMessages((prev) => [
            ...prev,
            {
              id: data.assistant_message.id,
              role: 'assistant',
              content: data.assistant_message.content,
              node_title: data.assistant_message.node_title,
            },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: '⚠ Failed to get a response. Please try again.' },
        ]);
      } finally {
        setLoading(false);
        if (isAuto) onAutoMessageSent();
      }
    },
    [roadmapId, loading, onAutoMessageSent]
  );

  // ── Auto-message trigger (node click) ─────────────────────────────────────
  useEffect(() => {
    if (!autoMessage || !roadmapId) return;
    const key = `${roadmapId}::${autoMessage.text}::${autoMessage.nodeTitle ?? ''}`;
    if (lastAutoMessage.current === key) return;
    lastAutoMessage.current = key;
    sendMessage(autoMessage.text, autoMessage.nodeTitle, true);
  }, [autoMessage, roadmapId, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && input.trim()) sendMessage(input);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (!roadmapId) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-xs text-muted-foreground text-center">
          Generate a roadmap, then click any node to chat about it.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {loadingHistory ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center px-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-xs text-muted-foreground">Click any node on the map to get an AI explanation, or type a question below.</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[88%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm'
                }`}
              >
                {msg.node_title && msg.role === 'user' && (
                  <div className="text-[10px] opacity-70 mb-0.5 font-medium">📍 {msg.node_title}</div>
                )}
                {msg.role === 'assistant' ? (
                  <div className="prose prose-xs dark:prose-invert max-w-none text-xs [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <span>{msg.content}</span>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2 flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border/60 p-2">
        <div className="flex items-end gap-1.5 rounded-xl border bg-background px-2 py-1.5">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this topic…"
            className="min-h-8 max-h-[150px] flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-xs p-0"
            disabled={loading}
          />
          <Button
            size="icon"
            className="h-7 w-7 shrink-0 rounded-lg"
            disabled={loading || !input.trim()}
            onClick={() => sendMessage(input)}
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
