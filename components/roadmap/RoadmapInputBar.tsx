'use client';

import { Loader2, Mic, MicOff, RefreshCwIcon, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { RoadmapData } from './types';

interface RoadmapInputBarProps {
  query: string;
  setQuery: (v: string) => void;
  isLoading: boolean;
  error: string | null;
  roadmapData: RoadmapData | null;
  isListening: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  handleSubmit: (e: React.FormEvent) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  toggleVoice: () => void;
  onReset: () => void;
}

export function RoadmapInputBar({
  query, setQuery, isLoading, error, roadmapData,
  isListening, textareaRef, handleSubmit, handleKeyDown,
  toggleVoice, onReset,
}: RoadmapInputBarProps) {
  return (
    <div className="shrink-0 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="max-w-3xl mx-auto p-4">
        {error && (
          <div className="mb-3 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive flex items-center gap-1.5">
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="relative flex items-end gap-2 rounded-2xl border bg-background p-2">
            <Textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a learning topic (e.g. Data Structures, Python, DBMS)…"
              className="min-h-11 max-h-[200px] flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
              disabled={isLoading}
            />

            {/* Voice */}
            <button
              type="button"
              onClick={toggleVoice}
              disabled={isLoading}
              className={`shrink-0 self-end mb-1 p-1.5 rounded-lg transition-colors ${
                isListening ? 'text-destructive animate-pulse' : 'text-muted-foreground hover:text-foreground'
              }`}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            {/* Reset */}
            {roadmapData && (
              <button
                type="button"
                className="shrink-0 self-end mb-1 p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                title="Clear and start new"
                onClick={onReset}
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
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-2">
          Press Enter to generate · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
