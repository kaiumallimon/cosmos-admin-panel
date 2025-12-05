// System logging service for tracking admin actions

import { getCollection } from './mongodb';
import { v4 as uuidv4 } from 'uuid';
import { 
  SystemLog, 
  createLogEntry, 
  getActionFromEndpoint, 
  getResourceTypeFromEndpoint 
} from './system-log-types';
import { User } from './auth-server-only';

export class SystemLogService {
  
  /**
   * Log an admin action with detailed information
   */
  static async logAction(
    admin: User,
    method: 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    options: {
      resource_id?: string;
      request_data?: any;
      response_status: number;
      ip_address: string;
      user_agent: string;
      duration_ms: number;
      success: boolean;
      error_message?: string;
      before_data?: any;
      after_data?: any;
      affected_count?: number;
      custom_description?: string;
      custom_action?: string;
      custom_resource_type?: string;
    }
  ): Promise<void> {
    try {
      const systemLogsCollection = await getCollection<SystemLog>('system_logs');
      
      const resource_type = options.custom_resource_type || getResourceTypeFromEndpoint(endpoint);
      const action = options.custom_action || getActionFromEndpoint(method, endpoint);
      
      // Generate description
      const description = options.custom_description || 
        this.generateDescription(action, resource_type, options.resource_id, admin.email);
      
      // Create log entry
      const logEntry: SystemLog = {
        id: uuidv4(),
        timestamp: new Date(),
        ...createLogEntry(
          {
            id: admin.id,
            email: admin.email,
            name: admin.profile?.full_name || admin.email
          },
          method,
          endpoint,
          resource_type,
          action,
          description,
          {
            ...options,
            metadata: {
              before: options.before_data,
              after: options.after_data,
              affected_count: options.affected_count,
              ...options
            }
          }
        )
      };
      
      // Insert log entry
      await systemLogsCollection.insertOne(logEntry);
      
    } catch (error) {
      console.error('Failed to log system action:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }
  
  /**
   * Generate a human-readable description for the action
   */
  private static generateDescription(
    action: string, 
    resource_type: string, 
    resource_id?: string,
    admin_email?: string
  ): string {
    const resource = resource_type.toLowerCase().replace('_', ' ');
    const id_part = resource_id ? ` (ID: ${resource_id})` : '';
    
    switch (action) {
      case 'CREATE_USER':
        return `Created a new user${id_part}`;
      case 'UPDATE_USER':
        return `Updated user information${id_part}`;
      case 'DELETE_USER':
        return `Deleted user${id_part}`;
      case 'INITIATE_PASSWORD_RESET':
        return `Initiated password reset for user${id_part}`;
      case 'RESET_PASSWORD':
        return `Reset password for user${id_part}`;
        
      case 'CREATE_AGENT':
        return `Created a new AI agent${id_part}`;
      case 'UPDATE_AGENT':
        return `Updated AI agent${id_part}`;
      case 'DELETE_AGENT':
        return `Deleted AI agent${id_part}`;
        
      case 'CREATE_QUESTION':
        return `Created a new question${id_part}`;
      case 'UPDATE_QUESTION':
        return `Updated question${id_part}`;
      case 'DELETE_QUESTION':
        return `Deleted question${id_part}`;
      case 'UPLOAD_QUESTIONS':
        return `Uploaded questions to the system`;
        
      case 'CREATE_COURSE':
        return `Created a new course${id_part}`;
      case 'UPDATE_COURSE':
        return `Updated course information${id_part}`;
      case 'DELETE_COURSE':
        return `Deleted course${id_part}`;
        
      case 'UPDATE_EMBEDDINGS':
        return `Updated embeddings for questions`;
      case 'UPLOAD_FILE':
        return `Uploaded a file to CDN${id_part}`;
        
      default:
        return `Performed ${action.toLowerCase().replace('_', ' ')} on ${resource}${id_part}`;
    }
  }
  
  /**
   * Get recent system logs with filters and pagination
   */
  static async getSystemLogs(
    page: number = 1,
    limit: number = 50,
    filters: {
      admin_id?: string;
      method?: 'POST' | 'PUT' | 'DELETE';
      resource_type?: string;
      action?: string;
      success?: boolean;
      date_from?: Date;
      date_to?: Date;
      search?: string;
    } = {}
  ): Promise<{
    logs: SystemLog[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const systemLogsCollection = await getCollection<SystemLog>('system_logs');
      
      // Build query
      const query: any = {};
      
      if (filters.admin_id) query.admin_id = filters.admin_id;
      if (filters.method) query.method = filters.method;
      if (filters.resource_type) query.resource_type = filters.resource_type;
      if (filters.action) query.action = filters.action;
      if (filters.success !== undefined) query.success = filters.success;
      
      if (filters.date_from || filters.date_to) {
        query.timestamp = {};
        if (filters.date_from) query.timestamp.$gte = filters.date_from;
        if (filters.date_to) query.timestamp.$lte = filters.date_to;
      }
      
      if (filters.search) {
        query.$text = { $search: filters.search };
      }
      
      // Get total count
      const total = await systemLogsCollection.countDocuments(query);
      
      // Get logs with pagination
      const logs = await systemLogsCollection
        .find(query)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();
      
      return {
        logs,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
      
    } catch (error) {
      console.error('Failed to get system logs:', error);
      return { logs: [], total: 0, page, totalPages: 0 };
    }
  }
  
  /**
   * Get system log statistics
   */
  static async getSystemLogStats(days: number = 30): Promise<{
    total_logs: number;
    today_logs: number;
    success_rate: number;
    most_active_admin: { admin_email: string; admin_name: string; log_count: number } | null;
    action_distribution: Record<string, number>;
    resource_distribution: Record<string, number>;
    hourly_activity: Record<string, number>;
  }> {
    try {
      const systemLogsCollection = await getCollection<SystemLog>('system_logs');
      
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Aggregate statistics
      const [totalResult, todayResult, successResult, adminResult, actionResult, resourceResult, hourlyResult] = await Promise.all([
        // Total logs in period
        systemLogsCollection.countDocuments({
          timestamp: { $gte: dateFrom }
        }),
        
        // Today's logs
        systemLogsCollection.countDocuments({
          timestamp: { $gte: today }
        }),
        
        // Success rate
        systemLogsCollection.aggregate([
          { $match: { timestamp: { $gte: dateFrom } } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              successful: { $sum: { $cond: ['$success', 1, 0] } }
            }
          }
        ]).toArray(),
        
        // Most active admin
        systemLogsCollection.aggregate([
          { $match: { timestamp: { $gte: dateFrom } } },
          {
            $group: {
              _id: { admin_id: '$admin_id', admin_email: '$admin_email', admin_name: '$admin_name' },
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 1 }
        ]).toArray(),
        
        // Action distribution
        systemLogsCollection.aggregate([
          { $match: { timestamp: { $gte: dateFrom } } },
          { $group: { _id: '$action', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]).toArray(),
        
        // Resource distribution
        systemLogsCollection.aggregate([
          { $match: { timestamp: { $gte: dateFrom } } },
          { $group: { _id: '$resource_type', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]).toArray(),
        
        // Hourly activity
        systemLogsCollection.aggregate([
          { $match: { timestamp: { $gte: dateFrom } } },
          {
            $group: {
              _id: { $hour: '$timestamp' },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]).toArray()
      ]);
      
      const successRate = successResult[0] 
        ? (successResult[0].successful / successResult[0].total) * 100 
        : 0;
      
      const mostActiveAdmin = adminResult[0] 
        ? {
            admin_email: adminResult[0]._id.admin_email,
            admin_name: adminResult[0]._id.admin_name,
            log_count: adminResult[0].count
          }
        : null;
      
      const actionDistribution = actionResult.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>);
      
      const resourceDistribution = resourceResult.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>);
      
      const hourlyActivity = hourlyResult.reduce((acc, item) => {
        acc[`${item._id}:00`] = item.count;
        return acc;
      }, {} as Record<string, number>);
      
      return {
        total_logs: totalResult,
        today_logs: todayResult,
        success_rate: Math.round(successRate * 100) / 100,
        most_active_admin: mostActiveAdmin,
        action_distribution: actionDistribution,
        resource_distribution: resourceDistribution,
        hourly_activity: hourlyActivity
      };
      
    } catch (error) {
      console.error('Failed to get system log stats:', error);
      return {
        total_logs: 0,
        today_logs: 0,
        success_rate: 0,
        most_active_admin: null,
        action_distribution: {},
        resource_distribution: {},
        hourly_activity: {}
      };
    }
  }
}

/**
 * Middleware helper to extract request metadata
 */
export function extractRequestMetadata(req: any): {
  ip_address: string;
  user_agent: string;
} {
  const ip_address = req.headers['x-forwarded-for'] || 
                    req.headers['x-real-ip'] || 
                    req.connection?.remoteAddress || 
                    req.socket?.remoteAddress ||
                    req.ip ||
                    '127.0.0.1';
                    
  const user_agent = req.headers['user-agent'] || 'Unknown';
  
  return {
    ip_address: Array.isArray(ip_address) ? ip_address[0] : ip_address,
    user_agent
  };
}