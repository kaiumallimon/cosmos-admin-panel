import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role') || '';
        const department = searchParams.get('department') || '';

        // Calculate offset for pagination
        const offset = (page - 1) * limit;

        // Build the query
        let query = supabaseAdmin
            .from('accounts')
            .select(`
                *,
                profile:profile(*)
            `);

        // Apply non-search filters to query
        if (role) {
            query = query.eq('role', role);
        }

        // Apply department filter if provided
        if (department) {
            query = query.eq('profile.department', department);
        }

        // Build count query - we'll filter the results after getting them for search
        let countQuery = supabaseAdmin
            .from('accounts')
            .select('*', { count: 'exact', head: true });

        // Apply non-search filters to count query
        if (role) {
            countQuery = countQuery.eq('role', role);
        }

        if (department) {
            countQuery = countQuery.eq('profile.department', department);
        }

        // Get all data first, then filter and paginate in memory for search
        const { data: allData, error: dataError } = await query
            .order('created_at', { ascending: false });

        if (dataError) {
            return NextResponse.json({ error: dataError.message }, { status: 500 });
        }

        let filteredData = allData || [];

        // Apply search filter in memory for profile fields
        if (search) {
            const searchTerm = search.toLowerCase();
            filteredData = filteredData.filter(user => {
                const emailMatch = user.email?.toLowerCase().includes(searchTerm);
                const nameMatch = user.profile?.full_name?.toLowerCase().includes(searchTerm);
                const studentIdMatch = user.profile?.student_id?.toLowerCase().includes(searchTerm);
                return emailMatch || nameMatch || studentIdMatch;
            });
        }

        // Calculate pagination on filtered data
        const total = filteredData.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = offset;
        const endIndex = startIndex + limit;
        const paginatedData = filteredData.slice(startIndex, endIndex);
        const hasMore = page < totalPages;

        return NextResponse.json({
            data: paginatedData,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasMore
            }
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { 
            email, 
            password,
            full_name,
            role = 'user',
            phone,
            gender,
            student_id,
            department,
            batch,
            program,
            current_trimester
        } = body;

        if (!email || !password || !full_name) {
            return NextResponse.json({ 
                error: 'Email, password, and full name are required' 
            }, { status: 400 });
        }

        // Create user in Supabase Auth (without email confirmation)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Skip email confirmation
            user_metadata: {
                full_name
            }
        });

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        if (!authData.user) {
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
        }

        // Create account record
        const { data: accountData, error: accountError } = await supabaseAdmin
            .from('accounts')
            .insert({
                id: authData.user.id,
                email,
                role
            })
            .select()
            .single();

        if (accountError) {
            // If account creation fails, delete the auth user
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            return NextResponse.json({ error: accountError.message }, { status: 500 });
        }

        // Create profile record
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('profile')
            .insert({
                id: authData.user.id,
                email,
                full_name,
                phone,
                gender,
                role,
                student_id,
                department,
                batch,
                program,
                current_trimester
            })
            .select()
            .single();

        if (profileError) {
            // If profile creation fails, delete the account and auth user
            await supabaseAdmin.from('accounts').delete().eq('id', authData.user.id);
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        return NextResponse.json({
            message: 'User created successfully',
            data: {
                ...accountData,
                profile: profileData
            }
        });

    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}