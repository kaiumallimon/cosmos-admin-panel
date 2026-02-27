'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { D3NodeData } from './types';

interface DetailsPanelContentProps {
  selectedNode: D3NodeData;
  completedItems: Set<string>;
  toggleCompletion: (id: string) => void;
}

export function DetailsPanelContent({ selectedNode, completedItems, toggleCompletion }: DetailsPanelContentProps) {
  return (
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
  );
}

// ── Desktop side panel wrapper ────────────────────────────────────────────────

interface DetailsPanelProps extends DetailsPanelContentProps {
  onClose: () => void;
}

export function DetailsPanel({ onClose, ...contentProps }: DetailsPanelProps) {
  return (
    <div className="w-80 shrink-0 flex flex-col bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold">Details</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <DetailsPanelContent {...contentProps} />
    </div>
  );
}
