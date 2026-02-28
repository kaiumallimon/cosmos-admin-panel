// TypeScript interfaces for MongoDB courses collection

export interface Course {
  _id?: string;
  id: string;
  code: string;
  title: string;
  credit: number;
  department: string;
  created_at: Date;
  updated_at: Date;
}

export interface CourseCreateRequest {
  code: string;
  title: string;
  credit: number;
  department: string;
}

export interface CourseUpdateRequest {
  code?: string;
  title?: string;
  credit?: number;
  department?: string;
}

export interface CourseResponse {
  courses: Course[];
  totalCourses: number;
  totalDepartments: number;
}

export interface CourseStats {
  totalCourses: number;
  totalDepartments: number;
  departmentCounts: { [department: string]: number };
}

// ─── Trimester Types ──────────────────────────────────────────────────────────

export interface Trimester {
  _id?: string;
  id: string;
  trimester: string; // e.g. "251", "252", "261"
  created_at: Date;
  updated_at: Date;
}

export interface TrimesterCreateRequest {
  trimester: string;
}

export interface TrimesterUpdateRequest {
  trimester: string;
}

export interface TrimesterResponse {
  trimesters: Trimester[];
  total: number;
}