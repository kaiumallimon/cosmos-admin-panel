# Cosmos Admin Panel

A comprehensive Next.js admin dashboard for educational content management, featuring AI-powered question banks, user management, course administration, and intelligent search capabilities. Built with MongoDB, Pinecone vector database, OpenAI embeddings, and JWT authentication.

## 🎯 Key Features

- **Complete User Management**: Role-based authentication (admin/user), user profiles, student data management
- **AI-Powered Question Bank**: Vector search, semantic embeddings, intelligent question retrieval
- **Course Management**: Full CRUD operations for courses, departments, and academic programs
- **Intelligent Search**: Cross-collection search with command palette interface
- **AI Agent Configuration**: Customizable AI agents with tools, configurations, and few-shot examples
- **Analytics Dashboard**: Real-time system analytics, user statistics, and performance metrics
- **System Logging**: Comprehensive admin action tracking and system monitoring
- **Vector Management**: Pinecone integration for semantic search and question embeddings

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 16.0.1 with App Router, TypeScript, ShadCN/UI, Tailwind CSS
- **Backend**: Next.js API Routes, JWT Authentication, MongoDB with Aggregation Pipeline
- **AI/ML**: OpenAI Embeddings (text-embedding-3-small), Pinecone Vector Database
- **UI Components**: Radix UI primitives, Command palette, Responsive design
- **State Management**: Zustand with persistence, React hooks
- **Authentication**: JWT with refresh tokens, role-based access control

### Project Structure

```
cosmos-admin/
├── app/                          # Next.js App Router
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   ├── login/                   # Authentication pages
│   ├── dashboard/               # Admin dashboard
│   │   ├── page.tsx            # Dashboard home
│   │   ├── users/              # User management
│   │   ├── courses/            # Course management
│   │   ├── questions/          # Question bank
│   │   ├── agents/             # AI agent configuration
│   │   ├── system-logs/        # System monitoring
│   │   ├── search/             # Global search
│   │   └── update-embeddings/  # Vector management
│   └── api/                     # API Routes
│       ├── auth/               # Authentication endpoints
│       ├── users/              # User management API
│       ├── courses/            # Course management API
│       ├── questions/          # Question bank API
│       ├── agents/             # AI agent API
│       ├── search/             # Search API
│       ├── dashboard/          # Analytics API
│       └── update-embeddings/  # Vector update API
├── components/                  # Reusable components
│   ├── ui/                     # ShadCN UI components
│   ├── dashboard/              # Dashboard-specific components
│   └── agents/                 # AI agent components
├── lib/                        # Core utilities
│   ├── auth*.ts               # Authentication services
│   ├── mongodb.ts             # Database connection
│   ├── pinecone-service.ts    # Vector database
│   ├── embedding-service.ts   # OpenAI integration
│   ├── *-types.ts            # TypeScript interfaces
│   └── system-log-service.ts  # Logging service
├── hooks/                      # Custom React hooks
├── store/                      # State management
└── public/                     # Static assets
```

## 🗄️ Database Schema

### MongoDB Collections

#### accounts
```typescript
interface Account {
  id: string;
  email: string;
  password: string; // bcrypt hashed
  role: 'admin' | 'user';
  created_at: Date;
  updated_at: Date;
}
```

#### profile
```typescript
interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  gender: string;
  role: 'student' | 'admin';
  student_id: string | null;
  department: string | null;
  batch: string | null;
  program: string | null;
  current_trimester: string | null;
  completed_credits: number;
  cgpa: number | null;
  trimester_credits: number;
  avatar_url: string;
  created_at: Date;
}
```

#### question_parts
```typescript
interface QuestionPart {
  id: number;
  course_title: string;
  short: string; // Course short code
  course_code: string;
  semester_term: string;
  exam_type: 'mid' | 'final';
  question_number: string;
  sub_question: string;
  marks: number;
  total_question_mark: number;
  contribution_percentage: number;
  has_image: boolean;
  image_type: string | null;
  image_url: string | null;
  has_description: boolean;
  description_content: string | null;
  question: string;
  created_at: Date;
  vector_id: string; // Pinecone vector ID
  pdf_url: string | null;
}
```

#### courses
```typescript
interface Course {
  id: string;
  code: string;
  title: string;
  credit: number;
  department: string;
  created_at: Date;
  updated_at: Date;
}
```

#### agents
```typescript
interface Agent {
  id: string;
  name: string;
  display_name: string;
  description: string;
  system_prompt: string;
  question_processing_prompt?: string;
  is_active: boolean;
  created_at: Date;
  updated_at?: Date;
}
```

#### system_logs
```typescript
interface SystemLog {
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
  metadata?: any;
}
```

## 🚀 API Documentation

### Authentication
All API routes (except login/register) require JWT authentication via cookies.

#### POST /api/auth/login
```typescript
// Request
{
  email: string;
  password: string;
}

// Response
{
  success: boolean;
  user: {
    id: string;
    email: string;
    role: string;
    profile?: Profile;
  };
}
```

#### POST /api/auth/refresh
Automatically refreshes expired access tokens.

### User Management

#### GET /api/users
```typescript
// Query parameters
{
  page?: number;
  limit?: number;
  search?: string;
  role?: 'admin' | 'user';
}

// Response
{
  users: UserWithProfile[];
  totalUsers: number;
  totalPages: number;
  currentPage: number;
}
```

#### POST /api/users
```typescript
// Request
{
  email: string;
  full_name: string;
  phone?: string;
  gender?: string;
  role: 'admin' | 'user';
  student_id?: string;
  department?: string;
  batch?: string;
  program?: string;
}

// Response
{
  message: string;
  user: UserWithProfile;
  generatedPassword: string;
}
```

#### GET /api/users/[id]
#### PUT /api/users/[id]
#### DELETE /api/users/[id]

### Question Management

#### GET /api/questions
```typescript
// Query parameters
{
  page?: number;
  limit?: number;
  search?: string;
  course_code?: string;
  exam_type?: 'mid' | 'final';
  semester_term?: string;
}

// Response
{
  questions: QuestionPart[];
  totalQuestions: number;
  totalPages: number;
  currentPage: number;
}
```

#### POST /api/questions/upload
```typescript
// Request
{
  course_title: string;
  short: string;
  course_code: string;
  semester_term: string;
  exam_type: 'mid' | 'final';
  question_number: string;
  sub_question: string;
  marks: number;
  total_question_mark: number;
  has_description: boolean;
  description_content?: string;
  question: string;
  has_image: boolean;
  image_url?: string;
}

// Response
{
  success: true;
  message: string;
  data: {
    id: number;
    vector_id: string;
    course_code: string;
    namespace: string;
    vector_dimensions: number;
  };
}
```

#### GET /api/questions/[id]
#### PUT /api/questions/[id]
#### DELETE /api/questions/[id]

### Course Management

#### GET /api/courses
```typescript
// Response
{
  courses: Course[];
  totalCourses: number;
  totalDepartments: number;
}
```

#### POST /api/courses
```typescript
// Request
{
  code: string;
  title: string;
  credit: number;
  department: string;
}
```

### AI Agent Management

#### GET /api/agents
```typescript
// Response
{
  agents: Agent[];
  totalAgents: number;
  activeAgents: number;
}
```

#### POST /api/agents
```typescript
// Request
{
  name: string;
  display_name: string;
  description: string;
  system_prompt: string;
  question_processing_prompt?: string;
  is_active: boolean;
}
```

#### GET /api/agent-tools?agent_id=[id]
#### POST /api/agent-tools
#### GET /api/agent-configurations?agent_id=[id]
#### POST /api/agent-configurations

### Search

#### GET /api/search
```typescript
// Query parameters
{
  q: string; // Search query
  limit?: number;
}

// Response
{
  results: SearchResult[];
  totalResults: number;
  searchTime: number;
}

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'user' | 'question' | 'course' | 'agent' | 'navigation';
  url?: string;
  metadata?: any;
}
```

### Vector Management

#### POST /api/update-embeddings
Updates embeddings for all questions in the database.

#### POST /api/update-embeddings/[id]?course_code=[code]
Updates embeddings for questions in a specific course.

### Analytics

#### GET /api/dashboard/analytics
```typescript
// Response
{
  overview: {
    totalUsers: number;
    totalCourses: number;
    totalQuestions: number;
    totalAgents: number;
    systemOperations: number;
    successRate: number;
  };
  users: {
    roleDistribution: Record<string, number>;
    departmentDistribution: Record<string, number>;
    recentRegistrations: number;
    // ... more user analytics
  };
  // ... other analytics sections
}
```

### System Logs

#### GET /api/system-logs
```typescript
// Query parameters
{
  page?: number;
  limit?: number;
  admin_id?: string;
  resource_type?: string;
  method?: string;
  success?: boolean;
  start_date?: string;
  end_date?: string;
}
```

## 🔧 Environment Variables

### Required

```env
# Database
MONGODB_URI=mongodb://your-mongodb-connection-string
MONGODB_DB=cosmos-admin

# Authentication
JWT_SECRET=your-jwt-secret-key
```

### Optional (for full functionality)

```env
# AI/Vector Search
OPENAI_API_KEY=your-openai-api-key
PINECONE_API_KEY=your-pinecone-api-key

# Email (for user notifications)
EMAIL_HOST=your-email-host
EMAIL_PORT=587
EMAIL_USER=your-email-user
EMAIL_PASSWORD=your-email-password
```

## 📦 Installation & Setup

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Available scripts (from `package.json`):

- `dev` — Run the Next.js development server (`next dev`).
- `build` — Build the application for production (`next build`).
- `start` — Run the production server (`next start`).
- `lint` — Run ESLint.

Open `http://localhost:3000` to view the app.

**Note**: To use the chat functionality, ensure your backend service is running on `http://127.0.0.1:8000`. If the backend service is not available, the chat features will show appropriate error messages.

### Backend Service Requirements

**Important**: This admin panel requires a FastAPI backend service running on `http://127.0.0.1:8000` for chat functionality. 

If you see "Chat service is currently unavailable" errors:

1. Ensure your FastAPI backend service is running on port 8000
2. The backend should expose endpoints like:
   - `GET /api/v1/chats/` - for chat threads
   - `GET /api/v1/chats/{threadId}` - for chat history
   - `POST /api/v1/chats/structured` - for sending messages

To start the backend service (if you have the Python backend code):
```bash
# Navigate to your backend directory
cd path/to/your/backend

# Start the FastAPI server
uvicorn src.main:app --reload --host 127.0.0.1 --port 8000
```

If the backend service is not available, the chat features will show appropriate error messages and allow users to retry once the service is restored.

## Deployment

- This project is compatible with Vercel and other Node.js hosts that support Next.js. Deploy the built output or use the provider's Next.js integration.
- Ensure environment variables (Supabase keys, etc.) are configured in your deployment platform.

## Development Notes

- The application uses the Next.js App Router; server components and client components are used where appropriate.
- UI primitives live in `components/ui/` and the app uses Radix primitives and small utilities for styling.
- API handlers live inside `app/api/` and are used by frontend pages and the dashboard.
- Use `lib/supabaseClient.ts` to access Supabase from both server and client code.
