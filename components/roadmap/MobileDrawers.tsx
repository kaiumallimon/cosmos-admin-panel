'use client';

import { MessageSquare, PlusCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle,
} from '@/components/ui/drawer';
import { RoadmapChatPanel } from './RoadmapChatPanel';
import { HistoryPanelContent, type HistoryPanelContentProps } from './HistoryPanel';
import { DetailsPanelContent } from './DetailsPanel';
import type { D3NodeData } from './types';

interface MobileDrawersProps extends HistoryPanelContentProps {
  // History sheet
  showHistoryPanel: boolean;
  setShowHistoryPanel: React.Dispatch<React.SetStateAction<boolean>>;

  // Details
  showDetails: boolean;
  setShowDetails: React.Dispatch<React.SetStateAction<boolean>>;
  selectedNode: D3NodeData | null;
  completedItems: Set<string>;
  toggleCompletion: (id: string) => void;

  // Chat
  showChatbot: boolean;
  setShowChatbot: React.Dispatch<React.SetStateAction<boolean>>;
  autoMessage: { text: string; nodeTitle?: string } | null;
  onAutoMessageSent: () => void;
}

export function MobileDrawers({
  showHistoryPanel, setShowHistoryPanel,
  filteredHistory, loadingHistory, searchQuery, setSearchQuery,
  sortBy, setSortBy, roadmapId, loadThread,
  onDeleteRoadmap, onNew,
  showDetails, setShowDetails,
  selectedNode, completedItems, toggleCompletion,
  showChatbot, setShowChatbot,
  autoMessage, onAutoMessageSent,
}: MobileDrawersProps) {
  return (
    <>
      {/* ── History Sheet (left slide-in, chat-menu style) ─────────────────── */}
      <Sheet open={showHistoryPanel} onOpenChange={setShowHistoryPanel}>
        <SheetContent side="left" className="p-0 w-72 flex flex-col">
          <SheetHeader className="sr-only">
            <SheetTitle>Roadmap History</SheetTitle>
            <SheetDescription>Browse and manage your saved learning roadmaps</SheetDescription>
          </SheetHeader>

          {/* Sidebar header */}
          <div className="border-b border-border/40 p-4 shrink-0">
            <div className="flex items-center gap-2 min-w-0 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#007AFF] text-sm font-bold text-white shadow-md shrink-0">
                C
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold leading-none truncate">COSMOS</span>
                <span className="text-xs text-muted-foreground truncate">Learning Roadmap</span>
              </div>
            </div>

            {onNew && (
              <Button
                onClick={() => { onNew(); setShowHistoryPanel(false); }}
                className="w-full justify-start gap-2"
                variant="ghost"
              >
                <PlusCircle className="h-4 w-4" />
                New Roadmap
              </Button>
            )}
          </div>

          {/* Roadmap list with search + sort via HistoryPanelContent */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="px-3 pt-2 pb-1 shrink-0">
              <p className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider px-1">
                Your roadmaps
              </p>
            </div>
            <HistoryPanelContent
              filteredHistory={filteredHistory}
              loadingHistory={loadingHistory}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sortBy={sortBy}
              setSortBy={setSortBy}
              roadmapId={roadmapId}
              loadThread={(t) => { loadThread(t); setShowHistoryPanel(false); }}
              onDeleteRoadmap={onDeleteRoadmap}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Details Drawer ─────────────────────────────────────────────────── */}
      <Drawer
        open={!!selectedNode && showDetails}
        onOpenChange={(v) => !v && setShowDetails(false)}
        direction="bottom"
      >
        <DrawerContent className="h-[70vh] flex flex-col">
          <DrawerHeader className="flex-row items-center justify-between pb-2 shrink-0">
            <DrawerTitle>Details</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7"><X className="h-4 w-4" /></Button>
            </DrawerClose>
          </DrawerHeader>
          {selectedNode && (
            <DetailsPanelContent
              selectedNode={selectedNode}
              completedItems={completedItems}
              toggleCompletion={toggleCompletion}
            />
          )}
        </DrawerContent>
      </Drawer>

      {/* ── AI Chat Drawer ─────────────────────────────────────────────────── */}
      <Drawer open={showChatbot} onOpenChange={setShowChatbot} direction="bottom">
        <DrawerContent className="h-[85vh] flex flex-col">
          <DrawerHeader className="flex-row items-center justify-between pb-2 shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <DrawerTitle>COSMOS AI</DrawerTitle>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7"><X className="h-4 w-4" /></Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden min-h-0">
            <RoadmapChatPanel
              roadmapId={roadmapId}
              autoMessage={autoMessage}
              onAutoMessageSent={onAutoMessageSent}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
