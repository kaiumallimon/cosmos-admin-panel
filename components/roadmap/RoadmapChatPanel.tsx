'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Components } from 'react-markdown';

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

// ─── Custom markdown components (no @tailwindcss/typography needed) ──────────

const markdownComponents: Components = {
  p:          ({ children }) => <p className="mb-2 last:mb-0 leading-[1.65] text-[13px]">{children}</p>,
  h1:         ({ children }) => <h1 className="text-sm font-bold mt-3 mb-1.5 text-foreground">{children}</h1>,
  h2:         ({ children }) => <h2 className="text-sm font-bold mt-3 mb-1.5 text-foreground">{children}</h2>,
  h3:         ({ children }) => <h3 className="text-xs font-semibold mt-2.5 mb-1 text-foreground/90">{children}</h3>,
  h4:         ({ children }) => <h4 className="text-xs font-semibold mt-2 mb-1 text-foreground/80">{children}</h4>,
  ul:         ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-0.5 text-[13px]">{children}</ul>,
  ol:         ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-0.5 text-[13px]">{children}</ol>,
  li:         ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong:     ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em:         ({ children }) => <em className="italic text-foreground/80">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary/40 pl-3 my-2 text-muted-foreground italic text-[13px]">
      {children}
    </blockquote>
  ),
  a:          ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="text-primary underline underline-offset-2 hover:opacity-80">
      {children}
    </a>
  ),
  code:       ({ children, className }) => {
    const isBlock = className?.startsWith('language-');
    if (isBlock) {
      return (
        <pre className="bg-muted border border-border rounded-lg px-3 py-2.5 my-2 overflow-x-auto text-[11px] font-mono leading-relaxed">
          <code>{String(children).replace(/\n$/, '')}</code>
        </pre>
      );
    }
    return (
      <code className="bg-muted border border-border rounded px-1.5 py-0.5 text-[11px] font-mono text-primary">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <>{children}</>,
  hr:  () => <hr className="border-border my-3" />,
};

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
    lastAutoMessage.current = null;

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

      const userMsg: ChatMessage = { role: 'user', content: text.trim(), node_title: nodeTitle ?? null };
      setMessages((prev) => [...prev, userMsg]);
      if (!isAuto) setInput('');
      setLoading(true);

      try {
        const body: Record<string, unknown> = { message: text.trim() };
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
      <div className="flex-1 overflow-y-auto p-3 space-y-4 min-h-0">
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
            <div key={msg.id ?? i} className={`flex flex-col gap-0.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {/* Node tag — shown above both user and assistant messages when present */}
              {msg.node_title && msg.role === 'user' && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 mb-0.5 max-w-[88%]">
                  <svg className="h-2.5 w-2.5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span className="text-[10px] font-medium text-primary truncate">{msg.node_title}</span>
                </div>
              )}

              <div
                className={`max-w-[88%] rounded-2xl px-3 py-2.5 leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm text-[13px]'
                    : 'bg-muted border border-border/60 text-foreground rounded-tl-sm'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                )}
              </div>
            </div>
          ))
        )}

        {/* Thinking indicator */}
        {loading && (
          <div className="flex items-start">
            <div className="bg-muted border border-border/60 rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-2">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border/60 p-2">
        <div className="flex items-end gap-1.5 rounded-xl border border-border bg-background px-2 py-1.5 focus-within:border-primary/50 transition-colors">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this topic…"
            className="min-h-8 max-h-[150px] flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-[13px] p-0 leading-relaxed"
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
        <p className="text-[10px] text-muted-foreground mt-1 px-1">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
