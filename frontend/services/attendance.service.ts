import api from "@/lib/axios";
import type { AttendanceRecord, BulkAttendanceDto, ListParams } from "@/types";

export const attendanceService = {
  getAll: async (params?: ListParams): Promise<{ data: AttendanceRecord[]; pagination: unknown }> => {
    const { data } = await api.get("/api/attendance", { params });
    return data.data ?? data;
  },

  markBulk: async (payload: BulkAttendanceDto): Promise<void> => {
    await api.post("/api/attendance", payload);
  },

  update: async (id: string, payload: { status: string; remarks?: string }): Promise<AttendanceRecord> => {
    const { data } = await api.put(`/api/attendance/${id}`, payload);
    return data.data ?? data;
  },

  getSummary: async (params?: ListParams) => {
    const { data } = await api.get("/api/attendance/summary", { params });
    return data.data ?? data;
  },
};
