import api from "@/lib/axios";
import type { Student, CreateStudentDto, ListParams } from "@/types";
import { normalizeStudent, parsePaginated } from "@/lib/normalizers";

export const studentService = {
  getAll: async (params?: ListParams) => {
    const { data } = await api.get("/api/students", { params });
    return parsePaginated<Student>(data, normalizeStudent);
  },

  getById: async (id: string): Promise<Student> => {
    const { data } = await api.get(`/api/students/${id}`);
    const raw = data.data ?? data;
    return normalizeStudent(raw) as unknown as Student;
  },

  create: async (payload: CreateStudentDto): Promise<Student> => {
    const { data } = await api.post("/api/students", payload);
    return normalizeStudent(data.data ?? data) as unknown as Student;
  },

  update: async (id: string, payload: Partial<CreateStudentDto>): Promise<Student> => {
    const { data } = await api.put(`/api/students/${id}`, payload);
    return normalizeStudent(data.data ?? data) as unknown as Student;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/students/${id}`);
  },

  getAttendance: async (id: string, params?: ListParams) => {
    const { data } = await api.get(`/api/students/${id}/attendance`, { params });
    return data.data ?? data;
  },

  getGrades: async (id: string, params?: ListParams) => {
    const { data } = await api.get(`/api/students/${id}/grades`, { params });
    return data.data ?? data;
  },
};
