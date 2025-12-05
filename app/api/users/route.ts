import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Account, Profile, UserWithProfile, CreateUserRequest, UserListResponse } from "@/lib/user-types";
import { v4 as uuidv4 } from 'uuid';
import { withAuth } from "@/lib/api-middleware";
import bcrypt from 'bcryptjs';
import { validateEmailAddress } from "@/lib/email-validator";
import { generateSecurePassword } from "@/lib/token-utils";
import { sendEmail, generateWelcomeEmailHTML } from "@/lib/email-service";

async function getUsers(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100); // Max 100 per page
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role') || '';
        const department = searchParams.get('department') || '';

        // Validate pagination parameters
        if (page < 1 || limit < 1) {
            return NextResponse.json(
                { error: 'Invalid pagination parameters' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();
        const accountsCollection = db.collection<Account>('accounts');
        const profileCollection = db.collection<Profile>('profile');

        // Build aggregation pipeline for efficient search and join
        const pipeline: any[] = [];

        // Match stage for accounts
        const accountMatch: any = {};
        if (role) {
            accountMatch.role = role;
        }
        if (Object.keys(accountMatch).length > 0) {
            pipeline.push({ $match: accountMatch });
        }

        // Lookup profiles
        pipeline.push({
            $lookup: {
                from: 'profile',
                localField: 'id',
                foreignField: 'id',
                as: 'profile'
            }
        });

        // Unwind profile (make it an object instead of array)
        pipeline.push({
            $unwind: {
                path: '$profile',
                preserveNullAndEmptyArrays: true
            }
        });

        // Match stage for profile filters
        const profileMatch: any = {};
        if (department) {
            profileMatch['profile.department'] = department;
        }
        if (search) {
            // Use text search or regex for flexible search
            const searchRegex = { $regex: search, $options: 'i' };
            profileMatch.$or = [
                { email: searchRegex },
                { 'profile.full_name': searchRegex },
                { 'profile.student_id': searchRegex }
            ];
        }
        if (Object.keys(profileMatch).length > 0) {
            pipeline.push({ $match: profileMatch });
        }

        // Sort by creation date (newest first)
        pipeline.push({ $sort: { created_at: -1 } });

        // Facet for pagination and total count
        pipeline.push({
            $facet: {
                users: [
                    { $skip: (page - 1) * limit },
                    { $limit: limit }
                ],
                totalCount: [
                    { $count: 'count' }
                ]
            }
        });

        const [result] = await accountsCollection.aggregate(pipeline).toArray();
        
        const users = result.users || [];
        const total = result.totalCount[0]?.count || 0;
        const totalPages = Math.ceil(total / limit);
        const hasMore = page < totalPages;

        const response: UserListResponse = {
            data: users.map((user: any) => ({
                ...user,
                _id: user._id?.toString(),
                profile: user.profile ? {
                    ...user.profile,
                    _id: user.profile._id?.toString()
                } : undefined
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasMore
            }
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export const GET = withAuth(getUsers);

async function createUser(req: NextRequest) {
    try {
        const body: CreateUserRequest = await req.json();
        const { 
            email,
            full_name,
            role = 'user',
            phone = '',
            gender = '',
            student_id,
            department,
            batch,
            program,
            current_trimester
        } = body;

        if (!email || !full_name) {
            return NextResponse.json({ 
                error: 'Email and full name are required' 
            }, { status: 400 });
        }

        // Validate email using comprehensive validator
        const emailValidation = validateEmailAddress(email);
        if (!emailValidation.isValid) {
            return NextResponse.json({ 
                error: emailValidation.error || 'Invalid email address' 
            }, { status: 400 });
        }

        // Generate secure random password
        const generatedPassword = generateSecurePassword(12);

        const { db } = await connectToDatabase();
        const accountsCollection = db.collection<Account>('accounts');
        const profileCollection = db.collection<Profile>('profile');

        // Check if user already exists
        const existingAccount = await accountsCollection.findOne({ 
            email: { $regex: new RegExp(`^${email}$`, 'i') } 
        });
        if (existingAccount) {
            return NextResponse.json({ 
                error: 'A user with this email already exists' 
            }, { status: 409 });
        }

        // Check if student_id already exists (if provided)
        if (student_id) {
            const existingProfile = await profileCollection.findOne({ student_id });
            if (existingProfile) {
                return NextResponse.json({ 
                    error: 'A user with this student ID already exists' 
                }, { status: 409 });
            }
        }

        // Hash the generated password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(generatedPassword, saltRounds);
        
        const userId = uuidv4();
        const now = new Date();

        // Create account record
        const newAccount: Account = {
            id: userId,
            email: email.toLowerCase(),
            password: hashedPassword,
            role,
            created_at: now,
            updated_at: now
        };

        // Create profile record
        const profileRole = role === 'user' ? 'student' : role;
        const newProfile: Profile = {
            id: userId,
            email: email.toLowerCase(),
            full_name,
            phone: phone || '',
            gender: gender || '',
            role: profileRole,
            student_id: student_id || null,
            department: department || null,
            batch: batch || null,
            program: program || null,
            current_trimester: current_trimester || null,
            completed_credits: 0,
            cgpa: null,
            trimester_credits: 0,
            avatar_url: '',
            created_at: now
        };

        // Use transaction to ensure both records are created or none
        const session = db.client.startSession();
        
        try {
            await session.withTransaction(async () => {
                await accountsCollection.insertOne(newAccount, { session });
                await profileCollection.insertOne(newProfile, { session });
            });
            
            // Send welcome email with credentials
            try {
                const emailHTML = generateWelcomeEmailHTML(email.toLowerCase(), generatedPassword, full_name);
                const emailSent = await sendEmail({
                    to: email.toLowerCase(),
                    subject: 'Welcome to COSMOS-ITS Admin Panel - Your Login Credentials',
                    htmlContent: emailHTML
                });
                
                if (!emailSent) {
                    console.warn('Failed to send welcome email to:', email);
                    // Don't fail the user creation if email fails
                }
            } catch (emailError) {
                console.error('Error sending welcome email:', emailError);
                // Don't fail the user creation if email fails
            }
            
            return NextResponse.json({
                message: 'User created successfully. Login credentials have been sent to the user\'s email address.',
                data: {
                    ...newAccount,
                    _id: newAccount._id?.toString(),
                    password: undefined, // Never return password
                    profile: {
                        ...newProfile,
                        _id: newProfile._id?.toString()
                    }
                }
            }, { status: 201 });
            
        } catch (transactionError: any) {
            console.error('Transaction error:', transactionError);
            
            // Handle duplicate key errors
            if (transactionError.code === 11000) {
                const duplicateField = Object.keys(transactionError.keyPattern || {})[0];
                const fieldMessages: { [key: string]: string } = {
                    email: 'A user with this email already exists',
                    student_id: 'A user with this student ID already exists'
                };
                
                return NextResponse.json({ 
                    error: fieldMessages[duplicateField] || 'Duplicate data detected' 
                }, { status: 409 });
            }
            
            throw transactionError;
        } finally {
            await session.endSession();
        }

    } catch (error: any) {
        console.error('Error creating user:', error);
        return NextResponse.json({ 
            error: error.message || 'Failed to create user' 
        }, { status: 500 });
    }
}

export const POST = withAuth(createUser);