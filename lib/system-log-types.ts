// System log types and interfaces

export interface SystemLog {
  _id?: any;
  id: string;
  timestamp: Date;
  admin_id: string;
  admin_email: string;
  admin_name: string;
  method: 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  resource_type: string;
  resource_id?: string;
  action: string;
  description: string;
  request_data?: any;
  response_status: number;
  ip_address: string;
  user_agent: string;
  duration_ms: number;
  success: boolean;
  error_message?: string;
  metadata?: {
    before?: any;
    after?: any;
    affected_count?: number;
    [key: string]: any;
  };
}

export interface SystemLogSummary {
  total_logs: number;
  today_logs: number;
  success_rate: number;
  most_active_admin: {
    admin_email: string;
    admin_name: string;
    log_count: number;
  };
  recent_activities: SystemLog[];
  action_distribution: Record<string, number>;
  resource_distribution: Record<string, number>;
  hourly_activity: Record<string, number>;
}

export interface SystemLogFilters {
  admin_id?: string;
  method?: 'POST' | 'PUT' | 'DELETE';
  resource_type?: string;
  action?: string;
  success?: boolean;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface SystemLogListResponse {
  success: boolean;
  data: SystemLog[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
  filters: SystemLogFilters;
}

// Helper functions for creating log entries
export const createLogEntry = (
  admin: { id: string; email: string; name?: string },
  method: 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  resource_type: string,
  action: string,
  description: string,
  options: {
    resource_id?: string;
    request_data?: any;
    response_status: number;
    ip_address: string;
    user_agent: string;
    duration_ms: number;
    success: boolean;
    error_message?: string;
    metadata?: any;
  }
): Omit<SystemLog, '_id' | 'id' | 'timestamp'> => ({
  admin_id: admin.id,
  admin_email: admin.email,
  admin_name: admin.name || admin.email,
  method,
  endpoint,
  resource_type,
  resource_id: options.resource_id,
  action,
  description,
  request_data: options.request_data,
  response_status: options.response_status,
  ip_address: options.ip_address,
  user_agent: options.user_agent,
  duration_ms: options.duration_ms,
  success: options.success,
  error_message: options.error_message,
  metadata: options.metadata
});

// Action mappings for different resources
export const ACTION_MAPPINGS = {
  // User management
  'users': {
    'POST': 'CREATE_USER',
    'PUT': 'UPDATE_USER',
    'DELETE': 'DELETE_USER'
  },
  'users/password-reset': {
    'POST': 'INITIATE_PASSWORD_RESET'
  },
  'users/reset-password': {
    'POST': 'RESET_PASSWORD'
  },
  
  // Agent management
  'agents': {
    'POST': 'CREATE_AGENT',
    'PUT': 'UPDATE_AGENT',
    'DELETE': 'DELETE_AGENT'
  },
  'agent-tools': {
    'POST': 'CREATE_AGENT_TOOL',
    'PUT': 'UPDATE_AGENT_TOOL',
    'DELETE': 'DELETE_AGENT_TOOL'
  },
  'agent-configurations': {
    'POST': 'CREATE_AGENT_CONFIG',
    'PUT': 'UPDATE_AGENT_CONFIG',
    'DELETE': 'DELETE_AGENT_CONFIG'
  },
  'few-shot-examples': {
    'POST': 'CREATE_EXAMPLE',
    'PUT': 'UPDATE_EXAMPLE',
    'DELETE': 'DELETE_EXAMPLE'
  },
  
  // Question management
  'questions': {
    'POST': 'CREATE_QUESTION',
    'PUT': 'UPDATE_QUESTION',
    'DELETE': 'DELETE_QUESTION'
  },
  'questions/upload': {
    'POST': 'UPLOAD_QUESTIONS'
  },
  
  // Course management
  'courses': {
    'POST': 'CREATE_COURSE',
    'PUT': 'UPDATE_COURSE',
    'DELETE': 'DELETE_COURSE'
  },
  
  // System operations
  'update-embeddings': {
    'POST': 'UPDATE_EMBEDDINGS'
  },
  'cdn/upload': {
    'POST': 'UPLOAD_FILE'
  }
} as const;

// Helper function to get action from endpoint
export const getActionFromEndpoint = (method: 'POST' | 'PUT' | 'DELETE', endpoint: string): string => {
  // Clean endpoint (remove /api/ prefix and parameters)
  const cleanEndpoint = endpoint.replace(/^\/api\//, '').split('/')[0];
  
  // Handle special cases
  if (endpoint.includes('/password-reset') || endpoint.includes('/initiate-password-reset')) {
    return 'INITIATE_PASSWORD_RESET';
  }
  if (endpoint.includes('/reset-password')) {
    return 'RESET_PASSWORD';
  }
  if (endpoint.includes('/upload')) {
    return 'UPLOAD_FILE';
  }
  
  const mapping = ACTION_MAPPINGS[cleanEndpoint as keyof typeof ACTION_MAPPINGS];
  return (mapping as any)?.[method] || `${method}_${cleanEndpoint.toUpperCase()}`;
};

// Helper function to get resource type from endpoint
export const getResourceTypeFromEndpoint = (endpoint: string): string => {
  const cleanEndpoint = endpoint.replace(/^\/api\//, '').split('/')[0];
  return cleanEndpoint.toUpperCase().replace('-', '_');
};