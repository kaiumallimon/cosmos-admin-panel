// TypeScript interfaces for MongoDB user collections

export interface Account {
  _id?: string;
  id: string;
  email: string;
  password: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

export interface Profile {
  _id?: string;
  id: string;
  email: string;
  full_name: string;
  phone: string;
  gender: string;
  role: string;
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

export interface UserWithProfile {
  _id?: string;
  id: string;
  email: string;
  role: string;
  created_at: Date;
  updated_at: Date;
  profile?: Profile;
}

export interface CreateUserRequest {
  email: string;
  full_name: string;
  role?: string;
  phone?: string;
  gender?: string;
  student_id?: string;
  department?: string;
  batch?: string;
  program?: string;
  current_trimester?: string;
}

export interface UpdateUserRequest {
  email?: string;
  role?: string;
  full_name?: string;
  phone?: string;
  gender?: string;
  student_id?: string;
  department?: string;
  batch?: string;
  program?: string;
  current_trimester?: string;
  completed_credits?: number;
  cgpa?: number;
  trimester_credits?: number;
}

export interface UserListResponse {
  data: UserWithProfile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface UserStatsResponse {
  data: {
    totalUsers: number;
    roleDistribution: { [role: string]: number };
    departmentDistribution: { [department: string]: number };
    recentRegistrations: number;
    dailyRegistrations: { [date: string]: number };
    averageCgpa: number;
    totalStudentsWithCgpa: number;
  };
}

export interface ResetPasswordRequest {
  newPassword: string;
}