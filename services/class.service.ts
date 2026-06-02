import api from "@/lib/axios";
import type { Class, CreateClassDto, PaginatedResponse, ListParams } from "@/types";

export const classService = {
  getAll: async (params?: ListParams): Promise<PaginatedResponse<Class>> => {
    const { data } = await api.get("/api/classes", { params });
    return data.data ?? data;
  },

  getById: async (id: string): Promise<Class> => {
    const { data } = await api.get(`/api/classes/${id}`);
    return data.data ?? data;
  },

  create: async (payload: CreateClassDto): Promise<Class> => {
    const { data } = await api.post("/api/classes", payload);
    return data.data ?? data;
  },

  update: async (id: string, payload: Partial<CreateClassDto>): Promise<Class> => {
    const { data } = await api.put(`/api/classes/${id}`, payload);
    return data.data ?? data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/classes/${id}`);
  },

  assignSubjects: async (id: string, subjectIds: string[]): Promise<void> => {
    await api.post(`/api/classes/${id}/subjects`, { subjectIds });
  },
};
