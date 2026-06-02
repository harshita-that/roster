"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/auth.service";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input, FormField } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { getInitials, formatDate } from "@/lib/utils";
import { Sun, Moon, LogOut, ShieldCheck, User, Palette } from "lucide-react";

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
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "appearance">("profile");

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
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "security" as const, label: "Security", icon: ShieldCheck },
    { id: "appearance" as const, label: "Appearance", icon: Palette },
  ];

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="erp-card p-6 space-y-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {getInitials(user?.name)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{user?.name}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 capitalize">
                {user?.role?.toLowerCase()}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            {[
              ["User ID", user?.id?.slice(0, 8) + "…"],
              ["Role", user?.role],
              ["Email", user?.email],
              ["Member Since", formatDate(user?.createdAt)],
            ].map(([k, v]) => (
              <div key={k} className="bg-muted/40 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-0.5">{k}</p>
                <p className="font-medium text-foreground text-sm break-all">{v}</p>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-border">
            <Button variant="destructive" icon={<LogOut className="w-4 h-4" />} onClick={logout} id="settings-logout-btn">
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className="erp-card p-6">
          <h3 className="font-semibold text-foreground mb-1">Change Password</h3>
          <p className="text-sm text-muted-foreground mb-5">Update your account password. We recommend using a strong, unique password.</p>
          <form onSubmit={handleSubmit(onChangePw)} className="space-y-4">
            <FormField label="Current Password" error={errors.currentPassword?.message} required>
              <Input {...register("currentPassword")} type="password" placeholder="Your current password" />
            </FormField>
            <FormField label="New Password" error={errors.newPassword?.message} required>
              <Input {...register("newPassword")} type="password" placeholder="Min 6 characters" />
            </FormField>
            <FormField label="Confirm New Password" error={errors.confirmPassword?.message} required>
              <Input {...register("confirmPassword")} type="password" placeholder="Repeat new password" />
            </FormField>
            <Button type="submit" loading={isSubmitting} id="change-password-btn">Update Password</Button>
          </form>
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === "appearance" && (
        <div className="erp-card p-6 space-y-5">
          <div>
            <h3 className="font-semibold text-foreground mb-1">Theme</h3>
            <p className="text-sm text-muted-foreground mb-4">Choose your preferred color scheme.</p>
            <div className="flex gap-3">
              {[
                { id: "light", label: "Light", icon: Sun },
                { id: "dark", label: "Dark", icon: Moon },
              ].map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTheme(id)}
                  className={`flex-1 flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition ${theme === id ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : "border-border hover:border-indigo-300"}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme === id ? "bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-sm font-medium ${theme === id ? "text-indigo-600 dark:text-indigo-300" : "text-foreground"}`}>{label}</span>
                  {theme === id && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-medium text-foreground mb-2">Current theme</h4>
            <p className="text-sm text-muted-foreground capitalize">{theme} mode is active</p>
          </div>
        </div>
      )}
    </div>
  );
}
