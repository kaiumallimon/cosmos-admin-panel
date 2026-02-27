'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

interface RoadmapChatPanelProps {
  topic: string;
  threadId: string | null;
}

export function RoadmapChatPanel({ topic, threadId }: RoadmapChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);
  const currentTopic = useRef<string | null>(null);
  const currentThreadId = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, streamingMessage]);

  // Fetch chat history for a given thread
  const fetchChatHistory = useCallback(async (threadIdToFetch: string) => {
    if (!threadIdToFetch) return;
    setLoadingHistory(true);
    try {
      const response = await fetch('/api/roadmap/threads');
      if (!response.ok) throw new Error('Failed to fetch threads');
      const data = await response.json();
      const thread = data.threads?.find((t: any) => t.thread_id === threadIdToFetch);
      if (thread?.chat_history) {
        const historyMessages: Message[] = thread.chat_history.map((msg: any) => ({
          sender: msg.type === 'human' ? 'user' : 'bot',
          text: msg.content,
        }));
        setMessages(historyMessages);
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (text: string, isInitial = false) => {
      if (!text.trim()) return;
      if (!threadId) {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: 'No thread available. Please generate a roadmap first.' },
        ]);
        return;
      }

      if (!isInitial) {
        setMessages((prev) => [...prev, { sender: 'user', text }]);
      }
      setInput('');
      setLoading(true);
      setStreamingMessage('');

      try {
        const response = await fetch('/api/roadmap/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ thread_id: threadId, question: text.trim() }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let currentEvent: string | null = null;
        let botResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;

            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim();
              continue;
            }

            if (line.startsWith('data: ')) {
              let jsonStr = line.slice(6).trim();
              if (!jsonStr) continue;

              // Strip embedded "event:" line sometimes included in data
              if (jsonStr.startsWith('event: ')) {
                currentEvent = jsonStr.slice(7).trim();
                continue;
              }
              // Strip duplicate "data:" prefix
              if (jsonStr.startsWith('data: ')) jsonStr = jsonStr.slice(6).trim();

              try {
                const parsed = JSON.parse(jsonStr);
                if (currentEvent === 'explanation' && parsed.content) {
                  botResponse = parsed.content;
                  setStreamingMessage(botResponse);
                }
              } catch {
                // not JSON — ignore
              }
            }
          }
        }

        setStreamingMessage('');
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: botResponse || 'No response received.' },
        ]);
      } catch {
        setStreamingMessage('');
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: 'Error: Could not get a response. Please try again.' },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [threadId]
  );

  // When topic/threadId changes — load history or auto-send initial question
  useEffect(() => {
    // New thread loaded from history
    if (threadId && currentThreadId.current !== threadId) {
      currentThreadId.current = threadId;
      currentTopic.current = topic;
      hasInitialized.current = true;
      fetchChatHistory(threadId);
      return;
    }

    // New roadmap generated (no previous threadId)
    if (topic && threadId && !currentThreadId.current) {
      if (currentTopic.current !== topic) {
        hasInitialized.current = false;
        currentTopic.current = topic;
      }
      currentThreadId.current = threadId;
      if (!hasInitialized.current) {
        hasInitialized.current = true;
        const initialQ = `Please explain: ${topic}`;
        setMessages([{ sender: 'user', text: initialQ }]);
        sendMessage(initialQ, true);
      }
    }
  }, [topic, threadId, sendMessage, fetchChatHistory]);

  const markdownComponents = {
    code({ inline, className, children, ...props }: any) {
      const code = String(children).replace(/\n$/, '');
      if (inline) return <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary" {...props}>{code}</code>;
      return (
        <pre className="bg-muted rounded-lg p-3 overflow-x-auto my-2 text-xs">
          <code className="font-mono">{code}</code>
        </pre>
      );
    },
    p({ children }: any) { return <p className="mb-2 leading-relaxed text-sm">{children}</p>; },
    h3({ children }: any) { return <h3 className="text-sm font-bold mt-3 mb-1.5 text-primary">{children}</h3>; },
    h4({ children }: any) { return <h4 className="text-xs font-semibold mt-2 mb-1 text-primary/80">{children}</h4>; },
    ul({ children }: any) { return <ul className="list-disc ml-4 space-y-0.5 mb-2 text-sm">{children}</ul>; },
    ol({ children }: any) { return <ol className="list-decimal ml-4 space-y-0.5 mb-2 text-sm">{children}</ol>; },
    li({ children }: any) { return <li className="text-sm">{children}</li>; },
    strong({ children }: any) { return <strong className="font-semibold text-foreground">{children}</strong>; },
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loadingHistory && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Loading history…</span>
          </div>
        )}

        {!loadingHistory && messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground text-center px-4">
            {threadId ? 'Ask anything about this topic.' : 'Generate a roadmap to start chatting.'}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[90%] px-3 py-2 rounded-xl text-sm ${
                msg.sender === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground border border-border'
              }`}
            >
              {msg.sender === 'bot' ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {msg.text}
                </ReactMarkdown>
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {streamingMessage && (
          <div className="flex justify-start">
            <div className="max-w-[90%] px-3 py-2 rounded-xl text-sm bg-muted text-foreground border border-border">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {streamingMessage}
              </ReactMarkdown>
              <span className="inline-block w-1 h-3 ml-0.5 bg-primary animate-pulse" />
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {loading && !streamingMessage && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-xl bg-muted border border-border flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Thinking…
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 flex gap-2 shrink-0">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder={threadId ? 'Ask about this topic…' : 'Generate a roadmap first…'}
          disabled={!threadId || loading}
          className="text-sm"
        />
        <Button
          size="sm"
          onClick={() => sendMessage(input)}
          disabled={!threadId || loading || !input.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {!threadId && (
        <p className="text-xs text-muted-foreground px-3 pb-2">
          Generate a roadmap above to start chatting.
        </p>
      )}
    </div>
  );
}
