import api from "@/lib/axios";
import type { Student, CreateStudentDto, PaginatedResponse, ListParams } from "@/types";

export const studentService = {
  getAll: async (params?: ListParams): Promise<PaginatedResponse<Student>> => {
    const { data } = await api.get("/api/students", { params });
    return data.data ?? data;
  },

  getById: async (id: string): Promise<Student> => {
    const { data } = await api.get(`/api/students/${id}`);
    return data.data ?? data;
  },

  create: async (payload: CreateStudentDto): Promise<Student> => {
    const { data } = await api.post("/api/students", payload);
    return data.data ?? data;
  },

  update: async (id: string, payload: Partial<CreateStudentDto>): Promise<Student> => {
    const { data } = await api.put(`/api/students/${id}`, payload);
    return data.data ?? data;
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
