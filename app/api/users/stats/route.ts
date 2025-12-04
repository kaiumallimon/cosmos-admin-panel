import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Account, Profile, UserStatsResponse } from "@/lib/user-types";
import { withAuth } from "@/lib/api-middleware";

async function getUserStats(req: NextRequest) {
    try {
        const { db } = await connectToDatabase();
        const accountsCollection = db.collection<Account>('accounts');
        const profileCollection = db.collection<Profile>('profile');

        // Calculate date ranges
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Execute multiple aggregations in parallel for efficiency
        const [
            totalUsers,
            roleStats,
            departmentStats,
            recentRegistrations,
            dailyStats,
            cgpaStats
        ] = await Promise.all([
            // Total users count
            accountsCollection.countDocuments(),
            
            // Role distribution
            accountsCollection.aggregate([
                {
                    $group: {
                        _id: '$role',
                        count: { $sum: 1 }
                    }
                }
            ]).toArray(),
            
            // Department distribution
            profileCollection.aggregate([
                {
                    $match: {
                        department: { $ne: null, $exists: true }
                    }
                },
                {
                    $group: {
                        _id: '$department',
                        count: { $sum: 1 }
                    }
                }
            ]).toArray(),
            
            // Recent registrations (last 30 days)
            accountsCollection.countDocuments({
                created_at: { $gte: thirtyDaysAgo }
            }),
            
            // Daily registrations (last 7 days)
            accountsCollection.aggregate([
                {
                    $match: {
                        created_at: { $gte: sevenDaysAgo }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$created_at'
                            }
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]).toArray(),
            
            // CGPA statistics
            profileCollection.aggregate([
                {
                    $match: {
                        cgpa: { $ne: null, $exists: true }
                    }
                },
                {
                    $group: {
                        _id: null,
                        averageCgpa: { $avg: '$cgpa' },
                        totalStudentsWithCgpa: { $sum: 1 }
                    }
                }
            ]).toArray()
        ]);

        // Process role distribution
        const roleDistribution = roleStats.reduce((acc: any, stat: any) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {});

        // Process department distribution
        const departmentDistribution = departmentStats.reduce((acc: any, stat: any) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {});

        // Process daily registrations
        const dailyRegistrations = dailyStats.reduce((acc: any, stat: any) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {});

        // Process CGPA stats
        const cgpaData = cgpaStats[0] || { averageCgpa: 0, totalStudentsWithCgpa: 0 };

        const response: UserStatsResponse = {
            data: {
                totalUsers,
                roleDistribution,
                departmentDistribution,
                recentRegistrations,
                dailyRegistrations,
                averageCgpa: parseFloat((cgpaData.averageCgpa || 0).toFixed(2)),
                totalStudentsWithCgpa: cgpaData.totalStudentsWithCgpa || 0
            }
        };

        return NextResponse.json(response);

    } catch (error: any) {
        console.error('Error fetching user stats:', error);
        return NextResponse.json({ 
            error: error.message || 'Failed to fetch user statistics' 
        }, { status: 500 });
    }
}

export const GET = withAuth(getUserStats);