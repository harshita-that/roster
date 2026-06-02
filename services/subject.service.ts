import api from "@/lib/axios";
import type { Subject, CreateSubjectDto, PaginatedResponse, ListParams } from "@/types";

export const subjectService = {
  getAll: async (params?: ListParams): Promise<PaginatedResponse<Subject>> => {
    const { data } = await api.get("/api/subjects", { params });
    return data.data ?? data;
  },

  create: async (payload: CreateSubjectDto): Promise<Subject> => {
    const { data } = await api.post("/api/subjects", payload);
    return data.data ?? data;
  },

  update: async (id: string, payload: Partial<CreateSubjectDto>): Promise<Subject> => {
    const { data } = await api.put(`/api/subjects/${id}`, payload);
    return data.data ?? data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/subjects/${id}`);
  },
};
