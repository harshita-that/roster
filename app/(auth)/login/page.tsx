"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, GraduationCap, Loader2 } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormData) => {
    setError("");
    try {
      await login(values.email, values.password);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Invalid credentials. Please try again.";
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">School ERP</span>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Manage your school<br />
            <span className="text-indigo-200">smarter, faster.</span>
          </h1>
          <p className="text-indigo-100 text-lg leading-relaxed">
            A complete school management platform for students, teachers, attendance, grades, and more.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { label: "Students", val: "500+" },
              { label: "Teachers", val: "50+" },
              { label: "Classes", val: "30+" },
              { label: "Subjects", val: "20+" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold">{s.val}</div>
                <div className="text-indigo-200 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-indigo-200 text-sm">
          © {new Date().getFullYear()} School ERP. All rights reserved.
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-8 animate-fadeIn">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">School ERP</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground mt-2">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg px-4 py-3 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@schoolerp.com"
                {...register("email")}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />
              {errors.email && (
                <p className="text-destructive text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register("password")}
                  className="w-full px-4 py-3 pr-11 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              id="login-submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="bg-muted/60 rounded-xl p-4 space-y-1.5 text-sm">
            <p className="font-semibold text-foreground mb-2">Demo credentials:</p>
            {[
              { role: "Admin", email: "admin@schoolerp.com", pw: "Admin@123" },
              { role: "Teacher", email: "rajesh@schoolerp.com", pw: "Teacher@123" },
              { role: "Student", email: "aarav@school.com", pw: "Student@123" },
            ].map((c) => (
              <div key={c.role} className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium text-foreground w-14">{c.role}:</span>
                <span>{c.email}</span>
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{c.pw}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
