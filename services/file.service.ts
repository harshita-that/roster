import api from "@/lib/axios";
import type { FileRecord, ListParams } from "@/types";

export const fileService = {
  getAll: async (params?: ListParams): Promise<{ data: FileRecord[] }> => {
    const { data } = await api.get("/api/files", { params });
    return data.data ?? data;
  },

  upload: async (
    file: File,
    onProgress?: (pct: number) => void
  ): Promise<FileRecord> => {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post("/api/files/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
    return data.data ?? data;
  },

  download: (id: string): string => {
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    return `${base}/api/files/${id}/download`;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/files/${id}`);
  },
};
