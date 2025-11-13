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

        // Check if user already exists in accounts table
        const { data: existingAccounts } = await supabaseAdmin
            .from('accounts')
            .select('id, email')
            .eq('email', email);

        if (existingAccounts && existingAccounts.length > 0) {
            return NextResponse.json({ 
                error: 'A user with this email already exists' 
            }, { status: 409 });
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
            console.error('Auth creation error:', authError);
            
            // Handle specific auth errors
            if (authError.message.includes('already_registered')) {
                return NextResponse.json({ 
                    error: 'A user with this email already exists in the authentication system' 
                }, { status: 409 });
            }
            
            return NextResponse.json({ 
                error: `Failed to create user account: ${authError.message}` 
            }, { status: 400 });
        }

        if (!authData.user) {
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
        }

        // Create account record using upsert to handle any potential conflicts
        const { data: accountData, error: accountError } = await supabaseAdmin
            .from('accounts')
            .upsert({
                id: authData.user.id,
                email,
                role,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (accountError) {
            console.error('Account creation error:', accountError);
            
            // Clean up auth user if account creation fails
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            
            return NextResponse.json({ 
                error: `Failed to create account: ${accountError.message}` 
            }, { status: 500 });
        }

        // Create profile record with correct role mapping
        const profileRole = role === 'user' ? 'student' : role; // Map 'user' to 'student' for profile table
        
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('profile')
            .insert({
                id: authData.user.id,
                email,
                full_name,
                phone,
                gender,
                role: profileRole,
                student_id,
                department,
                batch,
                program,
                current_trimester
            })
            .select()
            .single();

        if (profileError) {
            console.error('Profile creation error:', profileError);
            
            // Clean up account and auth user if profile creation fails
            await supabaseAdmin.from('accounts').delete().eq('id', authData.user.id);
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            
            // Handle specific database errors
            if (profileError.message.includes('duplicate key') || profileError.code === '23505') {
                return NextResponse.json({ 
                    error: 'A profile with this information already exists' 
                }, { status: 409 });
            }
            
            return NextResponse.json({ 
                error: `Failed to create user profile: ${profileError.message}` 
            }, { status: 500 });
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