'use client';

import { MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle,
} from '@/components/ui/drawer';
import { RoadmapChatPanel } from './RoadmapChatPanel';
import { HistoryPanelContent } from './HistoryPanel';
import { DetailsPanelContent } from './DetailsPanel';
import type { D3NodeData, RoadmapData } from './types';

interface MobileDrawersProps {
  // History
  showHistoryPanel: boolean;
  setShowHistoryPanel: React.Dispatch<React.SetStateAction<boolean>>;
  filteredHistory: RoadmapData[];
  loadingHistory: boolean;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  sortBy: string;
  setSortBy: (v: any) => void;
  roadmapId: string | null;
  loadThread: (t: RoadmapData) => void;

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
  showDetails, setShowDetails,
  selectedNode, completedItems, toggleCompletion,
  showChatbot, setShowChatbot,
  autoMessage, onAutoMessageSent,
}: MobileDrawersProps) {
  return (
    <>
      {/* History Drawer */}
      <Drawer open={showHistoryPanel} onOpenChange={setShowHistoryPanel} direction="bottom">
        <DrawerContent className="h-[80vh] flex flex-col">
          <DrawerHeader className="flex-row items-center justify-between pb-2 shrink-0">
            <DrawerTitle>History</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7"><X className="h-4 w-4" /></Button>
            </DrawerClose>
          </DrawerHeader>
          <HistoryPanelContent
            filteredHistory={filteredHistory}
            loadingHistory={loadingHistory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortBy={sortBy}
            setSortBy={setSortBy}
            roadmapId={roadmapId}
            loadThread={loadThread}
          />
        </DrawerContent>
      </Drawer>

      {/* Details Drawer */}
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

      {/* AI Chat Drawer */}
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
