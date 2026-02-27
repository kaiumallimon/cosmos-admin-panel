'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RoadmapChatPanel } from './RoadmapChatPanel';

interface DesktopChatPanelProps {
  roadmapId: string | null;
  autoMessage: { text: string; nodeTitle?: string } | null;
  onAutoMessageSent: () => void;
  onClose: () => void;
}

export function DesktopChatPanel({ roadmapId, autoMessage, onAutoMessageSent, onClose }: DesktopChatPanelProps) {
  const [width, setWidth] = useState(384);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, startWidth: width };
    e.preventDefault();
  }, [width]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const delta = dragRef.current.startX - e.clientX;
      setWidth(Math.min(640, Math.max(280, dragRef.current.startWidth + delta)));
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  return (
    <div
      className="shrink-0 flex flex-col bg-card border border-border rounded-xl overflow-hidden relative select-none"
      style={{ width }}
    >
      {/* Drag handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 z-20 cursor-col-resize group"
        onMouseDown={onDragStart}
      >
        <div className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-transparent group-hover:bg-primary/30 transition-colors" />
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1 h-10 rounded-full bg-border group-hover:bg-primary/60 transition-colors" />
      </div>

      {/* Header */}
      <div className="pl-2 pr-3 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0" />
          <h3 className="text-sm font-semibold truncate">COSMOS AI</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden min-h-0">
        <RoadmapChatPanel
          roadmapId={roadmapId}
          autoMessage={autoMessage}
          onAutoMessageSent={onAutoMessageSent}
        />
      </div>
    </div>
  );
}
