// ─── Auth ────────────────────────────────────────────────────────────────────
export type Role = "ADMIN" | "TEACHER" | "STUDENT";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ─── Student ─────────────────────────────────────────────────────────────────
export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface Student {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  phone?: string;
  gender: Gender;
  dateOfBirth?: string;
  address?: string;
  photo?: string;
  classId?: string;
  class?: Class;
  userId?: string;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentDto {
  name: string;
  email: string;
  phone?: string;
  gender: Gender;
  dateOfBirth?: string;
  address?: string;
  classId?: string;
  rollNumber?: string;
  password?: string;
}

// ─── Teacher ─────────────────────────────────────────────────────────────────
export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone?: string;
  gender?: Gender;
  qualification?: string;
  experience?: number;
  photo?: string;
  subjects?: Subject[];
  userId?: string;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeacherDto {
  name: string;
  email: string;
  phone?: string;
  gender?: Gender;
  qualification?: string;
  experience?: number;
  password?: string;
}

// ─── Class ───────────────────────────────────────────────────────────────────
export interface Class {
  id: string;
  name: string;
  grade: number;
  section: string;
  academicYear: string;
  teacherId?: string;
  classTeacher?: Teacher;
  students?: Student[];
  subjects?: Subject[];
  _count?: { students: number };
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassDto {
  name: string;
  grade: number;
  section: string;
  academicYear: string;
  teacherId?: string;
}

// ─── Subject ─────────────────────────────────────────────────────────────────
export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  credits?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubjectDto {
  name: string;
  code: string;
  description?: string;
  credits?: number;
}

// ─── Attendance ───────────────────────────────────────────────────────────────
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

export interface AttendanceRecord {
  id: string;
  studentId: string;
  student?: Student;
  classId: string;
  class?: Class;
  date: string;
  status: AttendanceStatus;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BulkAttendanceDto {
  classId: string;
  date: string;
  records: { studentId: string; status: AttendanceStatus; remarks?: string }[];
}

// ─── Grade ───────────────────────────────────────────────────────────────────
export type ExamType = "MIDTERM" | "FINAL" | "QUIZ" | "ASSIGNMENT" | "PROJECT";

export interface Grade {
  id: string;
  studentId: string;
  student?: Student;
  subjectId: string;
  subject?: Subject;
  classId?: string;
  marks: number;
  maxMarks: number;
  grade?: string;
  examType: ExamType;
  examDate?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGradeDto {
  studentId: string;
  subjectId: string;
  classId?: string;
  marks: number;
  maxMarks: number;
  examType: ExamType;
  examDate?: string;
  remarks?: string;
}

// ─── File ────────────────────────────────────────────────────────────────────
export interface FileRecord {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedBy?: User;
  createdAt: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  attendancePercentage: number;
  attendanceTrend: { date: string; present: number; absent: number; late: number }[];
  gradeDistribution: { grade: string; count: number }[];
  recentActivities?: Activity[];
}

export interface Activity {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
}

// ─── API Responses ────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ─── Query Params ─────────────────────────────────────────────────────────────
export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: string | number | undefined;
}
