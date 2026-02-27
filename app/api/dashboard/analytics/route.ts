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

/** Convert a MongoDB $group aggregation result to a plain Record<string, number> */
function toRecord(agg: Array<{ _id: string | null; count: number }>): Record<string, number> {
  return agg.reduce((acc, item) => {
    acc[item._id ?? 'Unknown'] = item.count;
    return acc;
  }, {} as Record<string, number>);
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

    // Fix: create independent date objects so mutations don't bleed into each other
    const now = new Date();
    const lastMonthDate = new Date(now);
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    const lastWeekDate = new Date(now);
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);

    // Run ALL queries in parallel with MongoDB aggregation pipelines instead of
    // fetching full collections into memory.
    const [
      totalUsers,
      totalCourses,
      totalQuestions,
      totalAgents,

      roleDistributionAgg,
      departmentDistributionAgg,
      studentsByBatchAgg,
      genderDistributionAgg,
      cgpaAgg,
      recentRegistrations,

      courseDeptAgg,
      creditAgg,
      recentCourses,

      subjectAgg,
      examTypeAgg,
      semesterAgg,
      imageQuestionsCount,
      questionsWithDescCount,
      totalMarksAgg,
      recentQuestions,

      activeAgents,
      inactiveAgents,
      toolsCount,
      configurationsCount,
      examplesCount,

      recentLogs,
      totalOperations,
      successfulOps,
      operationsLastWeek,
      operationsByTypeAgg,
      adminActivityAgg,
      hourlyActivityAgg,
    ] = await Promise.all([
      // --- Overview counts ---
      accountsCollection.countDocuments(),
      coursesCollection.countDocuments(),
      questionsCollection.countDocuments(),
      agentsCollection.countDocuments(),

      // --- User distributions ---
      accountsCollection.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]).toArray(),
      profilesCollection.aggregate<{ _id: string; count: number }>([
        { $group: { _id: { $ifNull: ['$department', 'Not Specified'] }, count: { $sum: 1 } } },
      ]).toArray(),
      profilesCollection.aggregate<{ _id: string; count: number }>([
        { $match: { batch: { $exists: true, $ne: null } } },
        { $group: { _id: '$batch', count: { $sum: 1 } } },
      ]).toArray(),
      profilesCollection.aggregate<{ _id: string; count: number }>([
        { $group: { _id: { $ifNull: ['$gender', 'Not Specified'] }, count: { $sum: 1 } } },
      ]).toArray(),
      profilesCollection.aggregate<{ _id: null; avg: number }>([
        { $match: { cgpa: { $ne: null, $exists: true } } },
        { $group: { _id: null, avg: { $avg: '$cgpa' } } },
      ]).toArray(),
      accountsCollection.countDocuments({ created_at: { $gte: lastMonthDate } }),

      // --- Course distributions ---
      coursesCollection.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$department', count: { $sum: 1 } } },
      ]).toArray(),
      coursesCollection.aggregate<{ _id: string; count: number }>([
        { $group: { _id: { $toString: '$credit' }, count: { $sum: 1 } } },
      ]).toArray(),
      coursesCollection.countDocuments({ created_at: { $gte: lastMonthDate } }),

      // --- Question distributions ---
      questionsCollection.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$course_code', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]).toArray(),
      questionsCollection.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$exam_type', count: { $sum: 1 } } },
      ]).toArray(),
      questionsCollection.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$semester_term', count: { $sum: 1 } } },
      ]).toArray(),
      questionsCollection.countDocuments({ has_image: true }),
      questionsCollection.countDocuments({ has_description: true }),
      questionsCollection.aggregate<{ _id: null; total: number }>([
        { $group: { _id: null, total: { $sum: '$marks' } } },
      ]).toArray(),
      questionsCollection.countDocuments({ created_at: { $gte: lastMonthDate } }),

      // --- Agent counts ---
      agentsCollection.countDocuments({ is_active: true }),
      agentsCollection.countDocuments({ is_active: false }),
      agentToolsCollection.countDocuments(),
      agentConfigsCollection.countDocuments(),
      fewShotExamplesCollection.countDocuments(),

      // --- System logs (only fetch the 10 we actually display) ---
      systemLogsCollection.find({}).sort({ timestamp: -1 }).limit(10).toArray(),
      systemLogsCollection.countDocuments(),
      systemLogsCollection.countDocuments({ success: true }),
      systemLogsCollection.countDocuments({ timestamp: { $gte: lastWeekDate } }),
      systemLogsCollection.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$method', count: { $sum: 1 } } },
      ]).toArray(),
      systemLogsCollection.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$admin_name', count: { $sum: 1 } } },
      ]).toArray(),
      systemLogsCollection.aggregate<{ _id: string; count: number }>([
        { $group: { _id: { $toString: { $hour: { $toDate: '$timestamp' } } }, count: { $sum: 1 } } },
      ]).toArray(),
    ]);

    const successRate = totalOperations > 0
      ? Math.round((successfulOps / totalOperations) * 100)
      : 100;

    const averageCGPA = cgpaAgg.length > 0
      ? Math.round((cgpaAgg[0].avg ?? 0) * 100) / 100
      : 0;

    const totalMarks = totalMarksAgg.length > 0 ? (totalMarksAgg[0].total ?? 0) : 0;

    const analytics: DashboardAnalytics = {
      overview: {
        totalUsers,
        totalCourses,
        totalQuestions,
        totalAgents,
        systemOperations: totalOperations,
        successRate,
      },
      users: {
        roleDistribution: toRecord(roleDistributionAgg),
        departmentDistribution: toRecord(departmentDistributionAgg),
        recentRegistrations,
        averageCGPA,
        studentsByBatch: toRecord(studentsByBatchAgg),
        genderDistribution: toRecord(genderDistributionAgg),
      },
      courses: {
        departmentDistribution: toRecord(courseDeptAgg),
        creditDistribution: toRecord(creditAgg),
        recentlyAdded: recentCourses,
      },
      questions: {
        subjectDistribution: toRecord(subjectAgg),
        examTypeDistribution: toRecord(examTypeAgg),
        semesterDistribution: toRecord(semesterAgg),
        imageQuestions: imageQuestionsCount,
        totalMarks,
        questionsWithDescription: questionsWithDescCount,
      },
      agents: {
        activeAgents,
        inactiveAgents,
        toolsCount,
        configurationsCount,
        examplesCount,
      },
      system: {
        recentLogs,
        errorRate: 100 - successRate,
        operationsByType: toRecord(operationsByTypeAgg),
        adminActivity: toRecord(adminActivityAgg),
        hourlyActivity: toRecord(hourlyActivityAgg),
      },
      growth: {
        usersLastMonth: recentRegistrations,
        questionsLastMonth: recentQuestions,
        coursesLastMonth: recentCourses,
        operationsLastWeek,
      },
    };

    const response = NextResponse.json({ success: true, data: analytics });
    // Cache for 60 s on the client; serve stale for up to 5 min while revalidating
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=300');
    return response;

  } catch (error: any) {
    console.error('Dashboard analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard analytics' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getDashboardAnalytics);