"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input, FormField } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { getInitials, formatDate } from "@/lib/utils";
import { LogOut, ShieldCheck, User, Moon, KeyRound } from "lucide-react";

const pwSchema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  newPassword: z.string().min(6, "Min 6 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
type PwForm = z.infer<typeof pwSchema>;

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PwForm>({ resolver: zodResolver(pwSchema) });

  const onChangePw = async (data: PwForm) => {
    try {
      await authService.changePassword(data.currentPassword, data.newPassword);
      toast("Password changed successfully!", { variant: "success" });
      reset();
    } catch (e: unknown) {
      toast((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to change password", { variant: "destructive" });
    }
  };

  const tabs = [
    { id: "profile" as const, label: "Profile",  icon: User },
    { id: "security" as const, label: "Security", icon: ShieldCheck },
  ];

  return (
    <div className="max-w-2xl space-y-6 animate-fadeIn">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Manage your account preferences</p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-zinc-800 p-1 rounded-xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? "bg-zinc-700 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Profile Tab ── */}
      {activeTab === "profile" && (
        <div className="erp-card overflow-hidden">
          {/* Profile hero */}
          <div className="px-6 py-5 bg-zinc-800/60 border-b border-zinc-800">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-sm">
                {getInitials(user?.name)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-zinc-100 truncate">{user?.name}</h3>
                <p className="text-sm text-zinc-400 truncate">{user?.email}</p>
                <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-900/40 text-indigo-300 capitalize">
                  {user?.role?.toLowerCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Profile details grid */}
          <div className="p-6">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Account Details</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["User ID", user?.id?.slice(0, 8) + "…"],
                ["Role", user?.role],
                ["Email", user?.email],
                ["Member Since", formatDate(user?.createdAt)],
              ].map(([k, v]) => (
                <div key={k} className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-1 font-medium uppercase tracking-wide">{k}</p>
                  <p className="font-medium text-zinc-200 text-sm break-all">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Theme info */}
          <div className="px-6 py-4 border-t border-zinc-800">
            <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
              <div className="w-8 h-8 rounded-lg bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                <Moon className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-300">Dark Mode</p>
                <p className="text-xs text-zinc-500 mt-0.5">This app uses dark mode exclusively</p>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-800/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-200">Sign out</p>
                <p className="text-xs text-zinc-500 mt-0.5">You will be redirected to the login page</p>
              </div>
              <Button
                variant="destructive"
                icon={<LogOut className="w-4 h-4" />}
                onClick={logout}
                id="settings-logout-btn"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Security Tab ── */}
      {activeTab === "security" && (
        <div className="erp-card overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950/30 flex items-center justify-center flex-shrink-0">
                <KeyRound className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-100 text-sm">Change Password</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Use a strong, unique password for your account</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit(onChangePw)} className="space-y-4">
              <FormField label="Current Password" error={errors.currentPassword?.message} required>
                <Input {...register("currentPassword")} type="password" placeholder="Your current password" />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="New Password" error={errors.newPassword?.message} required>
                  <Input {...register("newPassword")} type="password" placeholder="Min 6 characters" />
                </FormField>
                <FormField label="Confirm New Password" error={errors.confirmPassword?.message} required>
                  <Input {...register("confirmPassword")} type="password" placeholder="Repeat new password" />
                </FormField>
              </div>
              <div className="pt-2">
                <Button type="submit" loading={isSubmitting} id="change-password-btn">Update Password</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
