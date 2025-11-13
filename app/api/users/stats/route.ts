import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
    try {
        // Get total users count
        const { count: totalUsers, error: totalUsersError } = await supabaseAdmin
            .from('accounts')
            .select('*', { count: 'exact', head: true });

        if (totalUsersError) {
            return NextResponse.json({ error: totalUsersError.message }, { status: 500 });
        }

        // Get users by role
        const { data: roleData, error: roleStatsError } = await supabaseAdmin
            .from('accounts')
            .select('role');

        if (roleStatsError) {
            return NextResponse.json({ error: 'Failed to fetch role stats' }, { status: 500 });
        }

        const roleStats = roleData?.reduce((acc: any, user: any) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {});

        // Get users by department (for students)
        const { data: departmentData, error: departmentStatsError } = await supabaseAdmin
            .from('profile')
            .select('department')
            .not('department', 'is', null);

        if (departmentStatsError) {
            return NextResponse.json({ error: 'Failed to fetch department stats' }, { status: 500 });
        }

        const departmentStats = departmentData?.reduce((acc: any, profile: any) => {
            if (profile.department) {
                acc[profile.department] = (acc[profile.department] || 0) + 1;
            }
            return acc;
        }, {});

        // Get recent registrations (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { count: recentRegistrations, error: recentError } = await supabaseAdmin
            .from('accounts')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', thirtyDaysAgo.toISOString());

        if (recentError) {
            return NextResponse.json({ error: 'Failed to fetch recent registrations' }, { status: 500 });
        }

        // Get users created per day for the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: dailyStats, error: dailyStatsError } = await supabaseAdmin
            .from('accounts')
            .select('created_at')
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at');

        if (dailyStatsError) {
            return NextResponse.json({ error: 'Failed to fetch daily stats' }, { status: 500 });
        }

        // Process daily stats
        const dailyRegistrations = dailyStats?.reduce((acc: any, user: any) => {
            const date = new Date(user.created_at).toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});

        // Get average CGPA
        const { data: cgpaData, error: cgpaError } = await supabaseAdmin
            .from('profile')
            .select('cgpa')
            .not('cgpa', 'is', null);

        if (cgpaError) {
            return NextResponse.json({ error: 'Failed to fetch CGPA data' }, { status: 500 });
        }

        const validCgpas = cgpaData?.filter((p: any) => p.cgpa !== null).map((p: any) => parseFloat(p.cgpa)) || [];
        const averageCgpa = validCgpas.length > 0 
            ? (validCgpas.reduce((sum: number, cgpa: number) => sum + cgpa, 0) / validCgpas.length).toFixed(2)
            : '0.00';

        return NextResponse.json({
            data: {
                totalUsers: totalUsers || 0,
                roleDistribution: roleStats || {},
                departmentDistribution: departmentStats || {},
                recentRegistrations: recentRegistrations || 0,
                dailyRegistrations: dailyRegistrations || {},
                averageCgpa: parseFloat(averageCgpa),
                totalStudentsWithCgpa: validCgpas.length
            }
        });

    } catch (error) {
        console.error('Error fetching user stats:', error);
        return NextResponse.json({ error: 'Failed to fetch user statistics' }, { status: 500 });
    }
}