// MongoDB indexes for user collections to optimize query performance

import { connectToDatabase } from './mongodb';

export async function createUserIndexes() {
  try {
    const { db } = await connectToDatabase();
    
    // Accounts collection indexes
    const accountsCollection = db.collection('accounts');
    await Promise.all([
      // Unique index on email
      accountsCollection.createIndex(
        { email: 1 }, 
        { 
          unique: true, 
          collation: { locale: 'en', strength: 2 },
          name: 'email_unique'
        }
      ),
      
      // Unique index on id
      accountsCollection.createIndex(
        { id: 1 }, 
        { 
          unique: true,
          name: 'id_unique'
        }
      ),
      
      // Index on role for filtering
      accountsCollection.createIndex(
        { role: 1 },
        { name: 'role_index' }
      ),
      
      // Index on creation date for sorting and recent registrations
      accountsCollection.createIndex(
        { created_at: -1 },
        { name: 'created_at_desc_index' }
      ),
      
      // Compound index for role and creation date
      accountsCollection.createIndex(
        { role: 1, created_at: -1 },
        { name: 'role_created_at_index' }
      )
    ]);

    // Profile collection indexes
    const profileCollection = db.collection('profile');
    await Promise.all([
      // Unique index on email
      profileCollection.createIndex(
        { email: 1 }, 
        { 
          unique: true, 
          collation: { locale: 'en', strength: 2 },
          name: 'email_unique'
        }
      ),
      
      // Unique index on id
      profileCollection.createIndex(
        { id: 1 }, 
        { 
          unique: true,
          name: 'id_unique'
        }
      ),
      
      // Unique index on student_id (sparse since it can be null)
      profileCollection.createIndex(
        { student_id: 1 }, 
        { 
          unique: true,
          sparse: true,
          name: 'student_id_unique'
        }
      ),
      
      // Index on department for filtering
      profileCollection.createIndex(
        { department: 1 },
        { name: 'department_index' }
      ),
      
      // Index on role for filtering
      profileCollection.createIndex(
        { role: 1 },
        { name: 'role_index' }
      ),
      
      // Index on batch for filtering
      profileCollection.createIndex(
        { batch: 1 },
        { name: 'batch_index' }
      ),
      
      // Index on program for filtering
      profileCollection.createIndex(
        { program: 1 },
        { name: 'program_index' }
      ),
      
      // Index on CGPA for statistics
      profileCollection.createIndex(
        { cgpa: 1 },
        { 
          sparse: true,
          name: 'cgpa_index' 
        }
      ),
      
      // Text index for search functionality
      profileCollection.createIndex(
        { 
          full_name: 'text', 
          email: 'text', 
          student_id: 'text',
          department: 'text'
        },
        { 
          name: 'profile_search_index',
          weights: {
            full_name: 10,
            email: 8,
            student_id: 6,
            department: 4
          }
        }
      ),
      
      // Compound index for department and batch
      profileCollection.createIndex(
        { department: 1, batch: 1 },
        { name: 'department_batch_index' }
      ),
      
      // Index on creation date
      profileCollection.createIndex(
        { created_at: -1 },
        { name: 'created_at_desc_index' }
      )
    ]);

    console.log('User collection indexes created successfully');
  } catch (error) {
    console.error('Error creating user indexes:', error);
    throw error;
  }
}