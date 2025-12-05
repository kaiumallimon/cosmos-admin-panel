import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware-with-logging';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/lib/auth-server-only';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'user' | 'question' | 'course' | 'agent' | 'system-log' | 'navigation';
  url?: string;
  metadata?: any;
  relevance?: number;
}

interface SearchResponse {
  results: SearchResult[];
  totalResults: number;
  searchTime: number;
}

// GET /api/search - Dynamic search across all collections
async function searchHandler(req: AuthenticatedRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '150'), 300);
    const type = searchParams.get('type') || ''; // Filter by type

    if (!query || query.length < 2) {
      return NextResponse.json<SearchResponse>({
        results: getNavigationResults(),
        totalResults: 0,
        searchTime: Date.now() - startTime
      });
    }

    const { db } = await connectToDatabase();
    const results: SearchResult[] = [];

    // Create case-insensitive regex for search
    const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    // Search Users (if no specific type or type is 'user')
    if (!type || type === 'user') {
      try {
        const usersPipeline = [
          {
            $lookup: {
              from: 'profile',
              localField: 'id',
              foreignField: 'id',
              as: 'profile'
            }
          },
          {
            $match: {
              $or: [
                { email: { $regex: searchRegex } },
                { 'profile.email': { $regex: searchRegex } },
                { 'profile.full_name': { $regex: searchRegex } },
                { 'profile.student_id': { $regex: searchRegex } },
                { 'profile.department': { $regex: searchRegex } },
                { 'profile.batch': { $regex: searchRegex } },
                { 'profile.program': { $regex: searchRegex } },
                { 'profile.phone': { $regex: searchRegex } }
              ]
            }
          },
          { $limit: 50 }
        ];

        const users = await db.collection('accounts').aggregate(usersPipeline).toArray();
        
        users.forEach(user => {
          const profile = user.profile?.[0];
          results.push({
            id: user.id,
            title: profile?.full_name || user.email,
            description: `${user.email} | ${user.role.charAt(0).toUpperCase() + user.role.slice(1)} - ${profile?.department || 'No department'} ${profile?.student_id ? `(${profile.student_id})` : ''}`,
            type: 'user',
            url: `/dashboard/users/${user.id}`,
            metadata: {
              email: user.email,
              role: user.role,
              department: profile?.department,
              student_id: profile?.student_id,
              batch: profile?.batch,
              phone: profile?.phone,
              program: profile?.program
            }
          });
        });
      } catch (error) {
        console.error('User search error:', error);
      }
    }

    // Search Questions (if no specific type or type is 'question')
    if (!type || type === 'question') {
      try {
        const questionsPipeline = [
          {
            $match: {
              $or: [
                // Direct question text search - primary field
                { question: { $regex: searchRegex } },
                // Course and metadata search  
                { course_title: { $regex: searchRegex } },
                { course_code: { $regex: searchRegex } },
                { semester_term: { $regex: searchRegex } },
                { exam_type: { $regex: searchRegex } },
                // Question details from schema
                { description_content: { $regex: searchRegex } },
                { short: { $regex: searchRegex } },
                { question_number: { $regex: searchRegex } },
                { sub_question: { $regex: searchRegex } }
              ]
            }
          },
          { $limit: 50 }
        ];

        const questions = await db.collection('question_parts').aggregate(questionsPipeline).toArray();
        console.log('Questions found:', questions.length);
        if (questions.length > 0) {
          console.log('Sample question fields:', Object.keys(questions[0]));
          console.log('Sample question:', JSON.stringify(questions[0], null, 2));
        }
        
        questions.forEach(question => {
          // Extract trimester code from semester_term
          let trimesterCode = '';
          
          if (question.semester_term) {
            // First try to find a 3-digit number (like 233, 241, etc.) in semester_term
            const directTrimesterMatch = question.semester_term.match(/\b(\d{3})\b/);
            if (directTrimesterMatch) {
              trimesterCode = directTrimesterMatch[1];
            } else {
              // Fallback: Extract year and season to generate trimester code
              const yearMatch = question.semester_term.match(/(\d{4})/);
              const year = yearMatch ? yearMatch[1] : '2024';
              const season = question.semester_term.toLowerCase();
              
              if (season.includes('fall')) {
                trimesterCode = year.slice(-2) + '1';
              } else if (season.includes('spring')) {
                trimesterCode = year.slice(-2) + '2';
              } else if (season.includes('summer')) {
                trimesterCode = year.slice(-2) + '3';
              } else {
                trimesterCode = year.slice(-2) + '1'; // Default to fall
              }
            }
          }
          
          // Fallback if still no trimester code
          if (!trimesterCode) {
            trimesterCode = '241'; // Default fallback
          }
          
          // Convert exam_type to lowercase for URL
          const examType = question.exam_type?.toLowerCase() === 'final' ? 'final' : 'mid';
          
          // Skip if essential fields are missing
          if (!question.course_code || !question.question_number) {
            console.log('Skipping question due to missing fields:', {
              course_code: question.course_code,
              question_number: question.question_number,
              availableFields: Object.keys(question)
            });
            return;
          }
          
          // Determine which field matched the search
          const searchLower = query.toLowerCase();
          let matchedField = '';
          let displayText = '';
          
          if (question.question && question.question.toLowerCase().includes(searchLower)) {
            matchedField = 'question';
            displayText = question.question;
          } else if (question.description_content && question.description_content.toLowerCase().includes(searchLower)) {
            matchedField = 'description';
            displayText = question.description_content;
          } else {
            // Default to question if available, otherwise description
            if (question.question) {
              matchedField = 'question';
              displayText = question.question;
            } else if (question.description_content) {
              matchedField = 'description';
              displayText = question.description_content;
            } else {
              displayText = question.course_title || 'No question text available';
            }
          }
          
          // Create a preview (first 120 characters)
          const preview = displayText ? displayText.substring(0, 120) + (displayText.length > 120 ? '...' : '') : '';
          const matchIndicator = matchedField ? `[${matchedField.toUpperCase()}]` : '';
          
          const questionResult = {
            id: question.id?.toString() || question._id?.toString() || `q-${Date.now()}-${Math.random()}`,
            title: `${question.short || question.course_code || 'Unknown'} - ${question.semester_term || 'Unknown'} - ${question.question_number}${question.sub_question ? '-' + question.sub_question : ''}`,
            description: `${matchIndicator} ${preview} | ${question.exam_type || 'Unknown'} | ${question.marks || 0} marks | ${trimesterCode}`,
            type: 'question' as const,
            url: `/dashboard/questions/${question.course_code}/${examType}/trimester/${trimesterCode}`,
            metadata: {
              course_code: question.course_code,
              course_title: question.course_title,
              exam_type: question.exam_type,
              marks: question.marks,
              semester_term: question.semester_term,
              has_image: question.has_image,
              has_description: question.has_description,
              trimester_code: trimesterCode,
              question_number: question.question_number,
              sub_question: question.sub_question,
              question: question.question,
              short: question.short,
              description_content: question.description_content,
              matched_field: matchedField,
              full_matched_text: displayText
            }
          };
          
          console.log('Adding question result:', questionResult);
          results.push(questionResult);
        });
      } catch (error) {
        console.error('Questions search error:', error);
      }
    }

    // Search Courses (if no specific type or type is 'course')
    if (!type || type === 'course') {
      try {
        const coursesPipeline = [
          {
            $match: {
              $or: [
                { code: { $regex: searchRegex } },
                { title: { $regex: searchRegex } },
                { department: { $regex: searchRegex } }
              ]
            }
          },
          { $limit: 30 }
        ];

        const courses = await db.collection('courses').aggregate(coursesPipeline).toArray();
        
        courses.forEach(course => {
          results.push({
            id: course.id,
            title: `${course.code} - ${course.title}`,
            description: `${course.department} | ${course.credit} credits`,
            type: 'course',
            url: `/dashboard/courses`,
            metadata: {
              code: course.code,
              title: course.title,
              department: course.department,
              credit: course.credit
            }
          });
        });
      } catch (error) {
        console.error('Courses search error:', error);
      }
    }

    // Search Agents (if no specific type or type is 'agent')
    if (!type || type === 'agent') {
      try {
        const agentsPipeline = [
          {
            $match: {
              $or: [
                { name: { $regex: searchRegex } },
                { display_name: { $regex: searchRegex } },
                { description: { $regex: searchRegex } },
                { system_prompt: { $regex: searchRegex } }
              ]
            }
          },
          { $limit: 20 }
        ];

        const agents = await db.collection('agents').aggregate(agentsPipeline).toArray();
        
        agents.forEach(agent => {
          results.push({
            id: agent.id,
            title: agent.display_name || agent.name,
            description: `AI Agent | ${agent.description} | ${agent.is_active ? 'Active' : 'Inactive'}`,
            type: 'agent',
            url: `/dashboard/agents/${agent.id}/edit`,
            metadata: {
              name: agent.name,
              display_name: agent.display_name,
              is_active: agent.is_active,
              description: agent.description
            }
          });
        });
      } catch (error) {
        console.error('Agents search error:', error);
      }
    }

    // Search System Logs (if no specific type or type is 'system-log')
    if (!type || type === 'system-log') {
      try {
        const logsPipeline = [
          {
            $match: {
              $or: [
                { admin_name: { $regex: searchRegex } },
                { admin_email: { $regex: searchRegex } },
                { description: { $regex: searchRegex } },
                { resource_type: { $regex: searchRegex } },
                { action: { $regex: searchRegex } },
                { method: { $regex: searchRegex } },
                { endpoint: { $regex: searchRegex } }
              ]
            }
          },
          { $sort: { timestamp: -1 } },
          { $limit: 30 }
        ];

        const logs = await db.collection('system_logs').aggregate(logsPipeline).toArray();
        
        logs.forEach(log => {
          results.push({
            id: log.id,
            title: `${log.action} - ${log.resource_type}`,
            description: `${log.description} | By ${log.admin_name} | ${log.success ? 'Success' : 'Failed'}`,
            type: 'system-log',
            url: `/dashboard/system-logs`,
            metadata: {
              admin_name: log.admin_name,
              method: log.method,
              resource_type: log.resource_type,
              success: log.success,
              timestamp: log.timestamp
            }
          });
        });
      } catch (error) {
        console.error('System logs search error:', error);
      }
    }

    // Add navigation results if query matches
    const navigationResults = getNavigationResults().filter(nav => 
      nav.title.toLowerCase().includes(query.toLowerCase()) ||
      nav.description.toLowerCase().includes(query.toLowerCase())
    );
    
    results.push(...navigationResults);

    // Sort results by relevance (title matches first, then description matches)
    results.sort((a, b) => {
      const aInTitle = a.title.toLowerCase().includes(query.toLowerCase());
      const bInTitle = b.title.toLowerCase().includes(query.toLowerCase());
      
      if (aInTitle && !bInTitle) return -1;
      if (!aInTitle && bInTitle) return 1;
      return 0;
    });

    const searchTime = Date.now() - startTime;

    return NextResponse.json<SearchResponse>({
      results: results.slice(0, limit),
      totalResults: results.length,
      searchTime
    });

  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed: ' + error.message },
      { status: 500 }
    );
  }
}

// Helper function to get navigation/page results
function getNavigationResults(): SearchResult[] {
  return [
    {
      id: 'nav-dashboard',
      title: 'Dashboard',
      description: 'View system overview, analytics, and recent activity',
      type: 'navigation',
      url: '/dashboard'
    },
    {
      id: 'nav-users',
      title: 'Manage Users',
      description: 'View, create, edit, and manage user accounts',
      type: 'navigation',
      url: '/dashboard/users'
    },
    {
      id: 'nav-questions',
      title: 'Question Bank',
      description: 'Browse and manage exam questions',
      type: 'navigation',
      url: '/dashboard/questions'
    },
    {
      id: 'nav-add-question',
      title: 'Add Questions',
      description: 'Add new questions to the question bank',
      type: 'navigation',
      url: '/dashboard/add-question'
    },
    {
      id: 'nav-courses',
      title: 'Course Management',
      description: 'Manage courses, departments, and academic programs',
      type: 'navigation',
      url: '/dashboard/courses'
    },
    {
      id: 'nav-agents',
      title: 'AI Agents',
      description: 'Configure and manage AI agents',
      type: 'navigation',
      url: '/dashboard/agents'
    },
    {
      id: 'nav-create-agent',
      title: 'Create Agent',
      description: 'Create new AI agents with custom configurations',
      type: 'navigation',
      url: '/dashboard/create-agent'
    },
    {
      id: 'nav-upload',
      title: 'Upload Content',
      description: 'Bulk upload questions and course materials',
      type: 'navigation',
      url: '/dashboard/upload'
    },
    {
      id: 'nav-system-logs',
      title: 'System Logs',
      description: 'View system activity logs and admin actions',
      type: 'navigation',
      url: '/dashboard/system-logs'
    },
    {
      id: 'nav-update-embeddings',
      title: 'Update Embeddings',
      description: 'Refresh search index and vector embeddings',
      type: 'navigation',
      url: '/dashboard/update-embeddings'
    },
    {
      id: 'nav-search',
      title: 'Global Search',
      description: 'Search across users, questions, courses, and more',
      type: 'navigation',
      url: '/dashboard/search'
    },
    {
      id: 'nav-help',
      title: 'Help & Documentation',
      description: 'Get help and view system documentation',
      type: 'navigation',
      url: '/dashboard/help'
    }
  ];
}

export const GET = withAuth(searchHandler);