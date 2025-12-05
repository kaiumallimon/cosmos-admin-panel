// Script to set up system log indexes

const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(); // Use default database from connection string
  
  return { db, client };
}

async function createSystemLogIndexes() {
  try {
    console.log('Setting up system log indexes...');
    
    const { db, client } = await connectToDatabase();
    
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
      
      // Text index for searching
      systemLogsCollection.createIndex(
        { 
          description: 'text',
          admin_name: 'text',
          admin_email: 'text',
          endpoint: 'text'
        },
        { name: 'search_text_index' }
      )
    ]);

    console.log('✓ System logs indexes created successfully');
    await client.close();
    
  } catch (error) {
    console.error('❌ Error creating system logs indexes:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createSystemLogIndexes();
}

module.exports = { createSystemLogIndexes };