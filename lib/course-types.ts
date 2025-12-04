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