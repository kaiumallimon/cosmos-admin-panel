import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Account, Profile, UpdateUserRequest } from "@/lib/user-types";
import { withAuth } from "@/lib/api-middleware";

async function getUser(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { db } = await connectToDatabase();
        const accountsCollection = db.collection<Account>('accounts');

        // Use aggregation to join with profile
        const pipeline = [
            { $match: { id } },
            {
                $lookup: {
                    from: 'profile',
                    localField: 'id',
                    foreignField: 'id',
                    as: 'profile'
                }
            },
            {
                $unwind: {
                    path: '$profile',
                    preserveNullAndEmptyArrays: true
                }
            }
        ];

        const [user] = await accountsCollection.aggregate(pipeline).toArray();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Remove password from response
        const { password, ...userWithoutPassword } = user;

        return NextResponse.json({ 
            data: {
                ...userWithoutPassword,
                _id: user._id?.toString(),
                profile: user.profile ? {
                    ...user.profile,
                    _id: user.profile._id?.toString()
                } : undefined
            }
        });

    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
}

export const GET = withAuth(getUser);

async function updateUser(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body: UpdateUserRequest = await req.json();
        const { 
            email,
            role,
            full_name,
            phone,
            gender,
            student_id,
            department,
            batch,
            program,
            current_trimester,
            completed_credits,
            cgpa,
            trimester_credits
        } = body;

        const { db } = await connectToDatabase();
        const accountsCollection = db.collection<Account>('accounts');
        const profileCollection = db.collection<Profile>('profile');

        // Check if user exists
        const existingUser = await accountsCollection.findOne({ id });
        if (!existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check for email conflicts (if email is being changed)
        if (email && email.toLowerCase() !== existingUser.email.toLowerCase()) {
            const emailExists = await accountsCollection.findOne({ 
                email: { $regex: new RegExp(`^${email}$`, 'i') },
                id: { $ne: id }
            });
            if (emailExists) {
                return NextResponse.json({ 
                    error: 'A user with this email already exists' 
                }, { status: 409 });
            }
        }

        // Check for student_id conflicts (if student_id is being changed)
        if (student_id) {
            const studentIdExists = await profileCollection.findOne({ 
                student_id,
                id: { $ne: id }
            });
            if (studentIdExists) {
                return NextResponse.json({ 
                    error: 'A user with this student ID already exists' 
                }, { status: 409 });
            }
        }

        const now = new Date();
        const session = db.client.startSession();

        try {
            await session.withTransaction(async () => {
                // Update account if account-related fields are provided
                if (email !== undefined || role !== undefined) {
                    const accountUpdate: any = { updated_at: now };
                    if (email !== undefined) accountUpdate.email = email.toLowerCase();
                    if (role !== undefined) accountUpdate.role = role;
                    
                    await accountsCollection.updateOne(
                        { id },
                        { $set: accountUpdate },
                        { session }
                    );
                }

                // Update profile if profile-related fields are provided
                const profileUpdate: any = {};
                if (email !== undefined) profileUpdate.email = email.toLowerCase();
                if (full_name !== undefined) profileUpdate.full_name = full_name;
                if (phone !== undefined) profileUpdate.phone = phone;
                if (gender !== undefined) profileUpdate.gender = gender;
                if (role !== undefined) profileUpdate.role = role === 'user' ? 'student' : role;
                if (student_id !== undefined) profileUpdate.student_id = student_id;
                if (department !== undefined) profileUpdate.department = department;
                if (batch !== undefined) profileUpdate.batch = batch;
                if (program !== undefined) profileUpdate.program = program;
                if (current_trimester !== undefined) profileUpdate.current_trimester = current_trimester;
                if (completed_credits !== undefined) profileUpdate.completed_credits = completed_credits;
                if (cgpa !== undefined) profileUpdate.cgpa = cgpa;
                if (trimester_credits !== undefined) profileUpdate.trimester_credits = trimester_credits;

                if (Object.keys(profileUpdate).length > 0) {
                    await profileCollection.updateOne(
                        { id },
                        { $set: profileUpdate },
                        { session }
                    );
                }
            });

            // Fetch updated user data
            const pipeline = [
                { $match: { id } },
                {
                    $lookup: {
                        from: 'profile',
                        localField: 'id',
                        foreignField: 'id',
                        as: 'profile'
                    }
                },
                {
                    $unwind: {
                        path: '$profile',
                        preserveNullAndEmptyArrays: true
                    }
                }
            ];

            const [updatedUser] = await accountsCollection.aggregate(pipeline).toArray();
            
            // Remove password from response
            const { password, ...userWithoutPassword } = updatedUser;

            return NextResponse.json({
                message: 'User updated successfully',
                data: {
                    ...userWithoutPassword,
                    _id: updatedUser._id?.toString(),
                    profile: updatedUser.profile ? {
                        ...updatedUser.profile,
                        _id: updatedUser.profile._id?.toString()
                    } : undefined
                }
            });

        } catch (transactionError: any) {
            console.error('Transaction error:', transactionError);
            
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
        console.error('Error updating user:', error);
        return NextResponse.json({ 
            error: error.message || 'Failed to update user' 
        }, { status: 500 });
    }
}

export const PUT = withAuth(updateUser);

async function deleteUser(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { db } = await connectToDatabase();
        const accountsCollection = db.collection<Account>('accounts');
        const profileCollection = db.collection<Profile>('profile');

        // Check if user exists
        const existingUser = await accountsCollection.findOne({ id });
        if (!existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Use transaction to delete from both collections
        const session = db.client.startSession();
        
        try {
            await session.withTransaction(async () => {
                await profileCollection.deleteOne({ id }, { session });
                await accountsCollection.deleteOne({ id }, { session });
            });

            return NextResponse.json({
                message: 'User deleted successfully'
            });
            
        } finally {
            await session.endSession();
        }

    } catch (error: any) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ 
            error: error.message || 'Failed to delete user' 
        }, { status: 500 });
    }
}

export const DELETE = withAuth(deleteUser);