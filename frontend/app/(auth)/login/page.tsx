"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, GraduationCap, Loader2, AlertCircle } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

const DEMO = [
  { role: "Admin",   email: "admin@schoolerp.com",  pw: "Admin@123",   color: "bg-violet-100 text-violet-700" },
  { role: "Teacher", email: "rajesh@schoolerp.com", pw: "Teacher@123", color: "bg-blue-100 text-blue-700" },
  { role: "Student", email: "aarav@school.com",     pw: "Student@123", color: "bg-emerald-100 text-emerald-700" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormData) => {
    setError("");
    try {
      await login(values.email, values.password);
    } catch (e: unknown) {
      setError(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Invalid credentials. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950">

      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col w-[420px] xl:w-[480px] flex-shrink-0 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-10 justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">School ERP</span>
          </div>

          <div className="space-y-3 mb-10">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
              Manage your school<br />
              <span className="text-indigo-600">smarter, faster.</span>
            </h1>
            <p className="text-zinc-500 text-sm leading-relaxed">
              A complete management platform for students, teachers, attendance, grades, files, and more.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: "🎓", title: "Student Management", desc: "Track enrollment, performance & records" },
              { icon: "👩‍🏫", title: "Teacher Profiles",   desc: "Manage staff and subject assignments" },
              { icon: "📊", title: "Grades & Reports",   desc: "Exam results, progress, analytics" },
              { icon: "✅", title: "Attendance Tracking", desc: "Daily bulk marking with history" },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">
                <span className="text-lg mt-0.5">{f.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{f.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-zinc-400">© {new Date().getFullYear()} School ERP. All rights reserved.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fadeIn">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 justify-center mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">School ERP</span>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Sign in</h2>
            <p className="text-sm text-zinc-500 mt-1">Enter your credentials to access your portal</p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm mb-5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@school.com"
                {...register("email")}
                className="w-full h-9 px-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register("password")}
                  className="w-full h-9 px-3 pr-10 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              id="login-submit"
              className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2 mt-1"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="bg-zinc-50 dark:bg-zinc-800/50 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800">
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Demo credentials</p>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {DEMO.map((c) => (
                <button
                  key={c.role}
                  type="button"
                  onClick={() => { setValue("email", c.email); setValue("password", c.pw); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition text-left"
                >
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.color} flex-shrink-0`}>{c.role}</span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400 flex-1 truncate">{c.email}</span>
                  <span className="text-[10px] font-mono text-zinc-400 flex-shrink-0">{c.pw}</span>
                </button>
              ))}
            </div>
            <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-[10px] text-zinc-400">Click any row to auto-fill credentials</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
