"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, Plus, Eye, Users, Briefcase, BookOpen } from "lucide-react";
import { teacherService } from "@/services/teacher.service";
import type { Teacher } from "@/types";
import { DataTable } from "@/components/ui/data-table";
import { Button, IconButton } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { Input, FormField } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GenderBadge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import { formatDate } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  qualification: z.string().optional(),
  experience: z.number().min(0).optional(),
  password: z.string().min(6, "Min 6 chars").optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

const AVATAR_COLORS = [
  "bg-teal-100 text-teal-700",
  "bg-cyan-100 text-cyan-700",
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-fuchsia-100 text-fuchsia-700",
  "bg-emerald-100 text-emerald-700",
];

function getAvatarColor(name: string) {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [viewTeacher, setViewTeacher] = useState<Teacher | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const doFetch = async () => {
      setLoading(true);
      try {
        const res = await teacherService.getAll({ page, limit: 10, search: "" });
        if (!cancelled) {
          setTeachers(res.data);
          setTotal(res.pagination.total);
          setTotalPages(res.pagination.pages);
        }
      } catch {
        if (!cancelled) toast("Failed to load teachers", { variant: "destructive" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    doFetch();
    return () => { cancelled = true; };
  }, [page, fetchKey]);

  const openCreate = () => { setEditing(null); reset({}); setModalOpen(true); };
  const openEdit = (t: Teacher) => {
    setEditing(t);
    reset({ name: t.name, email: t.email, phone: t.phone ?? "", gender: t.gender, qualification: t.qualification ?? "", experience: t.experience ?? 0, password: "" });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, password: data.password || undefined };
      if (editing) { await teacherService.update(editing.id, payload); toast("Teacher updated", { variant: "success" }); }
      else { await teacherService.create(payload as Parameters<typeof teacherService.create>[0]); toast("Teacher created", { variant: "success" }); }
      setModalOpen(false); setFetchKey((k) => k + 1);
    } catch (e: unknown) {
      toast((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error", { variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try { await teacherService.delete(deleteId); toast("Teacher deleted", { variant: "success" }); setFetchKey((k) => k + 1); }
    catch { toast("Failed to delete", { variant: "destructive" }); }
    finally { setDeleteLoading(false); setDeleteId(null); }
  };

  const avgExperience = teachers.length > 0
    ? Math.round(teachers.reduce((sum, t) => sum + (t.experience ?? 0), 0) / teachers.length)
    : 0;

  const columns: ColumnDef<Teacher>[] = [
    {
      accessorKey: "name", header: "Teacher",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarColor(row.original.name)}`}>
            {(row.original.name || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm leading-tight">{row.original.name}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    { accessorKey: "phone", header: "Phone", cell: ({ row }) => <span className="text-sm text-zinc-600 dark:text-zinc-400">{row.original.phone ?? "—"}</span> },
    { accessorKey: "gender", header: "Gender", cell: ({ row }) => row.original.gender ? <GenderBadge gender={row.original.gender} /> : <span className="text-zinc-400">—</span> },
    {
      accessorKey: "qualification", header: "Qualification",
      cell: ({ row }) => row.original.qualification
        ? <span className="badge badge-purple">{row.original.qualification}</span>
        : <span className="text-zinc-400">—</span>,
    },
    {
      accessorKey: "experience", header: "Experience",
      cell: ({ row }) => row.original.experience
        ? <span className="badge badge-cyan">{row.original.experience} yrs</span>
        : <span className="text-zinc-400">—</span>,
    },
    {
      id: "actions", header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <IconButton onClick={() => setViewTeacher(row.original)}><Eye className="w-3.5 h-3.5" /></IconButton>
          <IconButton onClick={() => openEdit(row.original)}><Pencil className="w-3.5 h-3.5" /></IconButton>
          <IconButton onClick={() => setDeleteId(row.original.id)} className="hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 className="w-3.5 h-3.5" /></IconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Teachers</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Manage teaching staff</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate} id="add-teacher-btn">Add Teacher</Button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Teachers", value: total, icon: Users, color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-950/30" },
          { label: "Avg. Experience", value: `${avgExperience} yrs`, icon: Briefcase, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
          { label: "Subjects Covered", value: teachers.reduce((acc, t) => acc + (t.subjects?.length ?? 0), 0), icon: BookOpen, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
        ].map((stat) => (
          <div key={stat.label} className="erp-card p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 leading-none">{stat.value}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="erp-card overflow-hidden">
        <DataTable
          columns={columns}
          data={teachers}
          isLoading={loading}
          searchPlaceholder="Search teachers…"
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent title={editing ? "Edit Teacher" : "Add Teacher"}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Full Name" error={errors.name?.message} required className="col-span-2">
                <Input {...register("name")} placeholder="Teacher name" />
              </FormField>
              <FormField label="Email" error={errors.email?.message} required>
                <Input {...register("email")} type="email" />
              </FormField>
              <FormField label="Phone" error={errors.phone?.message}>
                <Input {...register("phone")} />
              </FormField>
              <FormField label="Gender" error={errors.gender?.message}>
                <Select onValueChange={(v) => setValue("gender", v as "MALE" | "FEMALE" | "OTHER")} defaultValue={editing?.gender}>
                  <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Qualification" error={errors.qualification?.message}>
                <Input {...register("qualification")} placeholder="e.g. M.Ed" />
              </FormField>
              <FormField label="Experience (years)" error={errors.experience?.message}>
                <Input {...register("experience", { valueAsNumber: true })} type="number" min={0} />
              </FormField>
              {!editing && (
                <FormField label="Password" error={errors.password?.message} required className="col-span-2">
                  <Input {...register("password")} type="password" />
                </FormField>
              )}
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={isSubmitting}>{editing ? "Update" : "Create"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={!!viewTeacher} onOpenChange={() => setViewTeacher(null)}>
        <DialogContent title="Teacher Details">
          {viewTeacher && (
            <div className="space-y-5 mt-2">
              <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0 ${getAvatarColor(viewTeacher.name)}`}>
                  {(viewTeacher.name || "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{viewTeacher.name}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{viewTeacher.email}</p>
                  {viewTeacher.gender && <GenderBadge gender={viewTeacher.gender} />}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Phone", viewTeacher.phone ?? "—"],
                  ["Qualification", viewTeacher.qualification ?? "—"],
                  ["Experience", viewTeacher.experience ? `${viewTeacher.experience} years` : "—"],
                  ["Subjects", viewTeacher.subjects?.map((s) => s.name).join(", ") ?? "—"],
                  ["Joined", formatDate(viewTeacher.createdAt)],
                ].map(([k, v]) => (
                  <div key={k} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 border border-zinc-100 dark:border-zinc-800">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1 font-medium uppercase tracking-wide">{k}</p>
                    <p className="font-medium text-zinc-800 dark:text-zinc-200">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Teacher?"
        description="This will permanently delete the teacher record."
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
