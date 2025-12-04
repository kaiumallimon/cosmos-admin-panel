// MongoDB indexes for courses collection to optimize query performance

import { connectToDatabase } from './mongodb';

export async function createCourseIndexes() {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('courses');

    // Create indexes for efficient queries
    await Promise.all([
      // Unique index on course code (case-insensitive)
      collection.createIndex(
        { code: 1 }, 
        { 
          unique: true, 
          collation: { locale: 'en', strength: 2 },
          name: 'code_unique'
        }
      ),
      
      // Index on id field for fast lookups
      collection.createIndex(
        { id: 1 }, 
        { 
          unique: true,
          name: 'id_unique'
        }
      ),
      
      // Index on department for filtering
      collection.createIndex(
        { department: 1 },
        { name: 'department_index' }
      ),
      
      // Compound index for department and creation date
      collection.createIndex(
        { department: 1, created_at: -1 },
        { name: 'department_created_at_index' }
      ),
      
      // Text index for search functionality
      collection.createIndex(
        { 
          title: 'text', 
          code: 'text', 
          department: 'text' 
        },
        { 
          name: 'course_search_index',
          weights: {
            title: 10,
            code: 8,
            department: 5
          }
        }
      ),
      
      // Index on creation date for sorting
      collection.createIndex(
        { created_at: -1 },
        { name: 'created_at_desc_index' }
      )
    ]);

    console.log('Course collection indexes created successfully');
  } catch (error) {
    console.error('Error creating course indexes:', error);
    throw error;
  }
}