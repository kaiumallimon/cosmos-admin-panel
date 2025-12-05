import { ObjectId } from 'mongodb';

// Base MongoDB document interface
interface BaseDocument {
  _id?: ObjectId;
  created_at: Date;
  updated_at?: Date;
}

// Agent interface based on the schema
export interface Agent extends BaseDocument {
  id: string;
  name: string;
  display_name: string;
  description: string;
  system_prompt: string;
  question_processing_prompt?: string | null;
  is_active: boolean;
}

// Agent Tools interface
export interface AgentTool extends BaseDocument {
  id: string;
  agent_id: string;
  tool_name: string;
  tool_description: string;
  is_enabled: boolean;
}

// Agent Configuration interface
export interface AgentConfiguration extends BaseDocument {
  id: string;
  agent_id: string;
  config_key: string;
  config_value: {
    type: string;
    value: number;
  };
  description: string;
}

// Few Shot Example interface with complex expected_output
export interface FewShotExample extends BaseDocument {
  id: string;
  agent_name: string;
  description: string;
  example_type: string;
  user_query: string;
  expected_output: {
    agent?: string;
    confidence?: number;
    contribution_percentage?: number;
    course_code?: string;
    course_title?: string;
    description_content?: string;
    exam_type?: string;
    has_description?: boolean;
    has_image?: boolean;
    image_type?: string;
    image_url?: string;
    marks?: number;
    pdf_url?: string;
    question?: string;
    question_number?: string;
    semester_term?: string;
    short?: string;
    sub_question?: string;
    total_question_mark?: number;
  };
  is_active: boolean;
}

// Extended Agent interface with related data (for API responses)
export interface AgentWithRelations extends Agent {
  agent_tools?: AgentTool[];
  agent_configurations?: AgentConfiguration[];
  few_shot_examples?: FewShotExample[];
}

// API request/response types
export interface CreateAgentRequest {
  name: string;
  display_name: string;
  description: string;
  system_prompt: string;
  question_processing_prompt?: string | null;
  is_active?: boolean;
}

export interface UpdateAgentRequest {
  name?: string;
  display_name?: string;
  description?: string;
  system_prompt?: string;
  question_processing_prompt?: string | null;
  is_active?: boolean;
  agent_tools?: Partial<AgentTool>[];
  few_shot_examples?: Partial<FewShotExample>[];
}

export interface CreateAgentToolRequest {
  agent_id: string;
  tool_name: string;
  tool_description: string;
  is_enabled?: boolean;
}

export interface UpdateAgentToolRequest {
  tool_name?: string;
  tool_description?: string;
  is_enabled?: boolean;
}

export interface CreateAgentConfigurationRequest {
  agent_id: string;
  config_key: string;
  config_value: {
    type: string;
    value: number;
  };
  description: string;
}

export interface UpdateAgentConfigurationRequest {
  config_key?: string;
  config_value?: {
    type: string;
    value: number;
  };
  description?: string;
}

export interface CreateFewShotExampleRequest {
  agent_name: string;
  description: string;
  example_type: string;
  user_query: string;
  expected_output: FewShotExample['expected_output'];
  is_active?: boolean;
}

export interface UpdateFewShotExampleRequest {
  agent_name?: string;
  description?: string;
  example_type?: string;
  user_query?: string;
  expected_output?: FewShotExample['expected_output'];
  is_active?: boolean;
}