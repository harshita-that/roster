import api from "@/lib/axios";

export const authService = {
  login: async (email: string, password: string) => {
    const { data } = await api.post("/api/auth/login", { email, password });
    const raw = data.data;
    const u = raw.user;
    const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
    return { token: raw.token, user: { ...u, name } };
  },

  me: async () => {
    const { data } = await api.get("/api/auth/me");
    const raw = data.data;
    const profile = raw.teacher || raw.student || null;
    const name = profile
      ? [profile.firstName, profile.lastName].filter(Boolean).join(" ")
      : raw.email;
    return {
      id: raw.id,
      email: raw.email,
      role: raw.role as "ADMIN" | "TEACHER" | "STUDENT",
      name,
      teacherId: raw.teacher?.id ?? undefined,
      studentId: raw.student?.id ?? undefined,
      profileImage: profile?.profileImage ?? undefined,
      createdAt: raw.createdAt,
    };
  },

  logout: async () => {
    await api.post("/api/auth/logout");
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const { data } = await api.put("/api/auth/change-password", { currentPassword, newPassword });
    return data;
  },
};
