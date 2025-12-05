// MongoDB indexes for system logs collection to optimize query performance

import { connectToDatabase } from './mongodb';

export async function createSystemLogIndexes() {
  try {
    const { db } = await connectToDatabase();
    
    // System logs collection indexes
    const systemLogsCollection = db.collection('system_logs');
    await Promise.all([
      // Compound index for filtering by admin and timestamp
      systemLogsCollection.createIndex(
        { admin_id: 1, timestamp: -1 },
        { name: 'admin_timestamp_index' }
      ),
      
      // Index on timestamp for chronological queries
      systemLogsCollection.createIndex(
        { timestamp: -1 },
        { name: 'timestamp_desc_index' }
      ),
      
      // Index on method for filtering by HTTP method
      systemLogsCollection.createIndex(
        { method: 1 },
        { name: 'method_index' }
      ),
      
      // Index on resource_type for filtering by resource
      systemLogsCollection.createIndex(
        { resource_type: 1 },
        { name: 'resource_type_index' }
      ),
      
      // Index on action for filtering by action type
      systemLogsCollection.createIndex(
        { action: 1 },
        { name: 'action_index' }
      ),
      
      // Index on success for filtering by success/failure
      systemLogsCollection.createIndex(
        { success: 1 },
        { name: 'success_index' }
      ),
      
      // Compound index for admin email and timestamp
      systemLogsCollection.createIndex(
        { admin_email: 1, timestamp: -1 },
        { name: 'admin_email_timestamp_index' }
      ),
      
      // Compound index for resource type and timestamp
      systemLogsCollection.createIndex(
        { resource_type: 1, timestamp: -1 },
        { name: 'resource_timestamp_index' }
      ),
      
      // Compound index for method and success status
      systemLogsCollection.createIndex(
        { method: 1, success: 1, timestamp: -1 },
        { name: 'method_success_timestamp_index' }
      ),
      
      // Text index for searching in descriptions and admin names
      systemLogsCollection.createIndex(
        { 
          description: 'text',
          admin_name: 'text',
          admin_email: 'text',
          endpoint: 'text'
        },
        { name: 'search_text_index' }
      ),
      
      // Index on endpoint for API-specific queries
      systemLogsCollection.createIndex(
        { endpoint: 1 },
        { name: 'endpoint_index' }
      ),
      
      // Compound index for date range queries with resource type
      systemLogsCollection.createIndex(
        { resource_type: 1, timestamp: -1, success: 1 },
        { name: 'resource_date_success_index' }
      ),
      
      // TTL index to automatically delete old logs after 1 year (optional)
      systemLogsCollection.createIndex(
        { timestamp: 1 },
        { 
          name: 'ttl_index',
          expireAfterSeconds: 365 * 24 * 60 * 60 // 1 year in seconds
        }
      )
    ]);

    console.log('✓ System logs indexes created successfully');
    
  } catch (error) {
    console.error('Error creating system logs indexes:', error);
    throw error;
  }
}

// Function to get system log collection with proper typing
export async function getSystemLogCollection() {
  const { db } = await connectToDatabase();
  return db.collection('system_logs');
}