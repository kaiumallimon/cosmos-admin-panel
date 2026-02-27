export interface RoadmapItem {
  name: string;
  description: string;
  resources: string[];
}

export interface RoadmapStage {
  title: string;
  description: string;
  items: RoadmapItem[];
}

export interface RoadmapData {
  id?: string;
  user_id?: string;
  topic: string;
  introduction?: string;
  stages: RoadmapStage[];
  created_at?: string;
  updated_at?: string;
}

export interface D3NodeData {
  name: string;
  type: 'root' | 'stage' | 'item';
  description: string;
  difficulty?: never;
  id?: string;
  stageIndex?: number;
  itemIndex?: number;
  children?: D3NodeData[];
}
