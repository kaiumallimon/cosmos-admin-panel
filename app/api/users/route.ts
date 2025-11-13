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

        // Apply filters
        if (search) {
            query = query.or(`email.ilike.%${search}%,profile.full_name.ilike.%${search}%,profile.student_id.ilike.%${search}%`);
        }

        if (role) {
            query = query.eq('role', role);
        }

        if (department) {
            query = query.eq('profile.department', department);
        }

        // Get total count for pagination
        const { count, error: countError } = await supabaseAdmin
            .from('accounts')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            return NextResponse.json({ error: countError.message }, { status: 500 });
        }

        // Get paginated data
        const { data, error } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const totalPages = Math.ceil((count || 0) / limit);
        const hasMore = page < totalPages;

        return NextResponse.json({
            data,
            pagination: {
                page,
                limit,
                total: count || 0,
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