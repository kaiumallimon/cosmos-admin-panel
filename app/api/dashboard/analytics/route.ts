import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware-with-logging';
import { getCollection } from '@/lib/mongodb';
import { Account, Profile } from '@/lib/user-types';
import { Course } from '@/lib/course-types';
import { Agent, AgentTool, AgentConfiguration, FewShotExample } from '@/lib/agent-types';
import { SystemLog } from '@/lib/system-log-types';

interface QuestionPart {
  _id?: any;
  id: number;
  course_title: string;
  short: string;
  course_code: string;
  semester_term: string;
  exam_type: string;
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
  vector_id: string;
  pdf_url: string | null;
}

interface DashboardAnalytics {
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
    averageCGPA: number;
    studentsByBatch: Record<string, number>;
    genderDistribution: Record<string, number>;
  };
  courses: {
    departmentDistribution: Record<string, number>;
    creditDistribution: Record<string, number>;
    recentlyAdded: number;
  };
  questions: {
    subjectDistribution: Record<string, number>;
    examTypeDistribution: Record<string, number>;
    semesterDistribution: Record<string, number>;
    imageQuestions: number;
    totalMarks: number;
    questionsWithDescription: number;
  };
  agents: {
    activeAgents: number;
    inactiveAgents: number;
    toolsCount: number;
    configurationsCount: number;
    examplesCount: number;
  };
  system: {
    recentLogs: SystemLog[];
    errorRate: number;
    operationsByType: Record<string, number>;
    adminActivity: Record<string, number>;
    hourlyActivity: Record<string, number>;
  };
  growth: {
    usersLastMonth: number;
    questionsLastMonth: number;
    coursesLastMonth: number;
    operationsLastWeek: number;
  };
}

async function getDashboardAnalytics(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    const [
      accountsCollection,
      profilesCollection,
      coursesCollection,
      questionsCollection,
      agentsCollection,
      agentToolsCollection,
      agentConfigsCollection,
      fewShotExamplesCollection,
      systemLogsCollection
    ] = await Promise.all([
      getCollection<Account>('accounts'),
      getCollection<Profile>('profiles'),
      getCollection<Course>('courses'),
      getCollection<QuestionPart>('question_parts'),
      getCollection<Agent>('agents'),
      getCollection<AgentTool>('agent_tools'),
      getCollection<AgentConfiguration>('agent_configurations'),
      getCollection<FewShotExample>('few_shot_examples'),
      getCollection<SystemLog>('system_logs')
    ]);

    // Date calculations for recent data
    const now = new Date();
    const lastMonth = new Date(now.setMonth(now.getMonth() - 1));
    const lastWeek = new Date(now.setDate(now.getDate() - 7));

    // Overview Statistics
    const [totalUsers, totalCourses, totalQuestions, totalAgents] = await Promise.all([
      accountsCollection.countDocuments(),
      coursesCollection.countDocuments(),
      questionsCollection.countDocuments(),
      agentsCollection.countDocuments()
    ]);

    // System logs analysis
    const systemLogs = await systemLogsCollection
      .find({})
      .sort({ timestamp: -1 })
      .limit(1000)
      .toArray();

    const recentLogs = systemLogs.slice(0, 10);
    const totalOperations = systemLogs.length;
    const successfulOps = systemLogs.filter(log => log.success).length;
    const successRate = totalOperations > 0 ? Math.round((successfulOps / totalOperations) * 100) : 100;

    // User analytics
    const allProfiles = await profilesCollection.find({}).toArray();
    const allAccounts = await accountsCollection.find({}).toArray();

    const roleDistribution = allAccounts.reduce((acc, account) => {
      acc[account.role] = (acc[account.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const departmentDistribution = allProfiles.reduce((acc, profile) => {
      const dept = profile.department || 'Not Specified';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const studentsByBatch = allProfiles.reduce((acc, profile) => {
      if (profile.batch) {
        acc[profile.batch] = (acc[profile.batch] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const genderDistribution = allProfiles.reduce((acc, profile) => {
      const gender = profile.gender || 'Not Specified';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageCGPA = allProfiles.length > 0 
      ? allProfiles
          .filter(p => p.cgpa !== null && p.cgpa !== undefined)
          .reduce((sum, p) => sum + (p.cgpa || 0), 0) / allProfiles.filter(p => p.cgpa).length
      : 0;

    const recentRegistrations = await accountsCollection.countDocuments({
      created_at: { $gte: lastMonth }
    });

    // Course analytics
    const allCourses = await coursesCollection.find({}).toArray();
    const courseDepartmentDist = allCourses.reduce((acc, course) => {
      acc[course.department] = (acc[course.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const creditDistribution = allCourses.reduce((acc, course) => {
      const credit = course.credit.toString();
      acc[credit] = (acc[credit] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentCourses = await coursesCollection.countDocuments({
      created_at: { $gte: lastMonth }
    });

    // Question analytics
    const allQuestions = await questionsCollection.find({}).toArray();
    
    const subjectDistribution = allQuestions.reduce((acc, q) => {
      acc[q.course_code] = (acc[q.course_code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const examTypeDistribution = allQuestions.reduce((acc, q) => {
      acc[q.exam_type] = (acc[q.exam_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const semesterDistribution = allQuestions.reduce((acc, q) => {
      acc[q.semester_term] = (acc[q.semester_term] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const imageQuestions = allQuestions.filter(q => q.has_image).length;
    const questionsWithDescription = allQuestions.filter(q => q.has_description).length;
    const totalMarks = allQuestions.reduce((sum, q) => sum + q.marks, 0);

    const recentQuestions = await questionsCollection.countDocuments({
      created_at: { $gte: lastMonth }
    });

    // Agent analytics
    const [activeAgents, inactiveAgents, toolsCount, configurationsCount, examplesCount] = await Promise.all([
      agentsCollection.countDocuments({ is_active: true }),
      agentsCollection.countDocuments({ is_active: false }),
      agentToolsCollection.countDocuments(),
      agentConfigsCollection.countDocuments(),
      fewShotExamplesCollection.countDocuments()
    ]);

    // System analytics
    const operationsByType = systemLogs.reduce((acc, log) => {
      acc[log.method] = (acc[log.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const adminActivity = systemLogs.reduce((acc, log) => {
      acc[log.admin_name] = (acc[log.admin_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const hourlyActivity = systemLogs.reduce((acc, log) => {
      const hour = new Date(log.timestamp).getHours().toString();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const operationsLastWeek = await systemLogsCollection.countDocuments({
      timestamp: { $gte: lastWeek }
    });

    const analytics: DashboardAnalytics = {
      overview: {
        totalUsers,
        totalCourses,
        totalQuestions,
        totalAgents,
        systemOperations: totalOperations,
        successRate
      },
      users: {
        roleDistribution,
        departmentDistribution,
        recentRegistrations,
        averageCGPA: Math.round(averageCGPA * 100) / 100,
        studentsByBatch,
        genderDistribution
      },
      courses: {
        departmentDistribution: courseDepartmentDist,
        creditDistribution,
        recentlyAdded: recentCourses
      },
      questions: {
        subjectDistribution,
        examTypeDistribution,
        semesterDistribution,
        imageQuestions,
        totalMarks,
        questionsWithDescription
      },
      agents: {
        activeAgents,
        inactiveAgents,
        toolsCount,
        configurationsCount,
        examplesCount
      },
      system: {
        recentLogs,
        errorRate: 100 - successRate,
        operationsByType,
        adminActivity,
        hourlyActivity
      },
      growth: {
        usersLastMonth: recentRegistrations,
        questionsLastMonth: recentQuestions,
        coursesLastMonth: recentCourses,
        operationsLastWeek
      }
    };

    return NextResponse.json({
      success: true,
      data: analytics
    });

  } catch (error: any) {
    console.error('Dashboard analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard analytics' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getDashboardAnalytics);