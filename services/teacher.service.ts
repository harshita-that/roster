import api from "@/lib/axios";
import type { Teacher, CreateTeacherDto, PaginatedResponse, ListParams } from "@/types";

export const teacherService = {
  getAll: async (params?: ListParams): Promise<PaginatedResponse<Teacher>> => {
    const { data } = await api.get("/api/teachers", { params });
    return data.data ?? data;
  },

  getById: async (id: string): Promise<Teacher> => {
    const { data } = await api.get(`/api/teachers/${id}`);
    return data.data ?? data;
  },

  create: async (payload: CreateTeacherDto): Promise<Teacher> => {
    const { data } = await api.post("/api/teachers", payload);
    return data.data ?? data;
  },

  update: async (id: string, payload: Partial<CreateTeacherDto>): Promise<Teacher> => {
    const { data } = await api.put(`/api/teachers/${id}`, payload);
    return data.data ?? data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/teachers/${id}`);
  },

  assignSubjects: async (id: string, subjectIds: string[]): Promise<void> => {
    await api.post(`/api/teachers/${id}/subjects`, { subjectIds });
  },
};
