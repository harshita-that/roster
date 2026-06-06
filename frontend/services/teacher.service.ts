import api from "@/lib/axios";
import type { Teacher, CreateTeacherDto, ListParams } from "@/types";
import { normalizeTeacher, parsePaginated } from "@/lib/normalizers";

export const teacherService = {
  getAll: async (params?: ListParams) => {
    const { data } = await api.get("/api/teachers", { params });
    return parsePaginated<Teacher>(data, normalizeTeacher);
  },

  getById: async (id: string): Promise<Teacher> => {
    const { data } = await api.get(`/api/teachers/${id}`);
    return normalizeTeacher(data.data ?? data) as unknown as Teacher;
  },

  create: async (payload: CreateTeacherDto): Promise<Teacher> => {
    const { data } = await api.post("/api/teachers", payload);
    return normalizeTeacher(data.data ?? data) as unknown as Teacher;
  },

  update: async (id: string, payload: Partial<CreateTeacherDto>): Promise<Teacher> => {
    const { data } = await api.put(`/api/teachers/${id}`, payload);
    return normalizeTeacher(data.data ?? data) as unknown as Teacher;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/teachers/${id}`);
  },

  assignSubjects: async (id: string, subjectIds: string[]): Promise<void> => {
    await api.post(`/api/teachers/${id}/subjects`, { subjectIds });
  },
};
