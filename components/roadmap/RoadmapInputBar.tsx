'use client';

import { AlertTriangle, Lock, Loader2, Mic, MicOff, RefreshCwIcon, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'motion/react';
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
  const isLocked = !!roadmapData;

  return (
    <div className="shrink-0 border-t border-border/50 bg-background/95 backdrop-blur-md">
      <div className="max-w-3xl mx-auto p-4">
        <AnimatePresence mode="wait">
          {error && !isLocked && (
            <motion.div
              key="error"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive flex items-center gap-1.5"
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
            </motion.div>
          )}

          {isLocked && (
            <motion.div
              key="locked"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="px-3 py-2 bg-muted/60 border border-border/50 rounded-lg text-xs text-muted-foreground flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                <span>
                  Showing: <span className="font-semibold text-foreground">{roadmapData.topic}</span>
                  {' '}— input locked while a roadmap is active.
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                onClick={onReset}
              >
                <RefreshCwIcon className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit}>
          <div className={`relative flex items-end gap-2 rounded-2xl border bg-background p-2 transition-colors duration-200 ${
            isLocked ? 'opacity-60 border-border/40 bg-muted/30 pointer-events-none select-none' : 'border-border hover:border-primary/40 focus-within:border-primary/60'
          }`}>
            <Textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a learning topic (e.g. Data Structures, Python, DBMS)…"
              className="min-h-11 max-h-[200px] flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
              disabled={isLoading || isLocked}
              tabIndex={isLocked ? -1 : 0}
            />

            {/* Voice */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleVoice}
              disabled={isLoading || isLocked}
              tabIndex={isLocked ? -1 : 0}
              className={`shrink-0 self-end mb-1 h-8 w-8 ${
                isListening ? 'text-destructive animate-pulse' : 'text-muted-foreground hover:text-foreground'
              }`}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>

            {/* Submit */}
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !query.trim() || isLocked}
              tabIndex={isLocked ? -1 : 0}
              className="shrink-0 rounded-xl self-end"
              title="Generate roadmap"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </form>

        {!isLocked && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Press Enter to generate · Shift+Enter for new line
          </p>
        )}
      </div>
    </div>
  );
}
