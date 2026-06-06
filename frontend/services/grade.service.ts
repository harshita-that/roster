import api from "@/lib/axios";
import type { Grade, CreateGradeDto, PaginatedResponse, ListParams } from "@/types";

export const gradeService = {
  getAll: async (params?: ListParams): Promise<PaginatedResponse<Grade>> => {
    const { data } = await api.get("/api/grades", { params });
    return data.data ?? data;
  },

  getReport: async (params?: ListParams) => {
    const { data } = await api.get("/api/grades/report", { params });
    return data.data ?? data;
  },

  create: async (payload: CreateGradeDto): Promise<Grade> => {
    const { data } = await api.post("/api/grades", payload);
    return data.data ?? data;
  },

  update: async (id: string, payload: Partial<CreateGradeDto>): Promise<Grade> => {
    const { data } = await api.put(`/api/grades/${id}`, payload);
    return data.data ?? data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/grades/${id}`);
  },
};
