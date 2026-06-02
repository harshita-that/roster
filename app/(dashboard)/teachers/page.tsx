"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, Plus, Eye } from "lucide-react";
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

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await teacherService.getAll({ page, limit: 10 });
      const rows = Array.isArray(res) ? res : (res as { data: Teacher[] }).data ?? [];
      const pagination = (res as { pagination?: { total: number; pages: number } }).pagination;
      setTeachers(rows);
      setTotal(pagination?.total ?? rows.length);
      setTotalPages(pagination?.pages ?? 1);
    } catch { toast("Failed to load teachers", { variant: "destructive" }); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

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
      setModalOpen(false); fetchTeachers();
    } catch (e: unknown) {
      toast((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error", { variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try { await teacherService.delete(deleteId); toast("Teacher deleted", { variant: "success" }); fetchTeachers(); }
    catch { toast("Failed to delete", { variant: "destructive" }); }
    finally { setDeleteLoading(false); setDeleteId(null); }
  };

  const columns: ColumnDef<Teacher>[] = [
    {
      accessorKey: "name", header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-700 dark:text-cyan-300 text-xs font-bold flex-shrink-0">
            {(row.original.name || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    { accessorKey: "phone", header: "Phone", cell: ({ row }) => row.original.phone ?? "—" },
    { accessorKey: "gender", header: "Gender", cell: ({ row }) => row.original.gender ? <GenderBadge gender={row.original.gender} /> : "—" },
    { accessorKey: "qualification", header: "Qualification", cell: ({ row }) => row.original.qualification ?? "—" },
    { accessorKey: "experience", header: "Experience", cell: ({ row }) => row.original.experience ? `${row.original.experience} yrs` : "—" },
    {
      id: "actions", header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <IconButton onClick={() => setViewTeacher(row.original)}><Eye className="w-4 h-4" /></IconButton>
          <IconButton onClick={() => openEdit(row.original)}><Pencil className="w-4 h-4" /></IconButton>
          <IconButton onClick={() => setDeleteId(row.original.id)} className="hover:text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></IconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Teachers</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage teaching staff</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate} id="add-teacher-btn">Add Teacher</Button>
      </div>

      <DataTable columns={columns} data={teachers} isLoading={loading} searchPlaceholder="Search teachers…" total={total} page={page} totalPages={totalPages} onPageChange={setPage} />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent title={editing ? "Edit Teacher" : "Add Teacher"}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Full Name" error={errors.name?.message} required className="col-span-2"><Input {...register("name")} placeholder="Teacher name" /></FormField>
              <FormField label="Email" error={errors.email?.message} required><Input {...register("email")} type="email" /></FormField>
              <FormField label="Phone" error={errors.phone?.message}><Input {...register("phone")} /></FormField>
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
              <FormField label="Qualification" error={errors.qualification?.message}><Input {...register("qualification")} placeholder="e.g. M.Ed" /></FormField>
              <FormField label="Experience (years)" error={errors.experience?.message}><Input {...register("experience", { valueAsNumber: true })} type="number" min={0} /></FormField>
              {!editing && (
                <FormField label="Password" error={errors.password?.message} required className="col-span-2"><Input {...register("password")} type="password" /></FormField>
              )}
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={isSubmitting}>{editing ? "Update" : "Create"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewTeacher} onOpenChange={() => setViewTeacher(null)}>
        <DialogContent title="Teacher Details">
          {viewTeacher && (
            <div className="space-y-3 mt-2">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-700 dark:text-cyan-300 text-2xl font-bold">
                  {(viewTeacher.name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{viewTeacher.name}</h3>
                  <p className="text-sm text-muted-foreground">{viewTeacher.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm pt-2">
                {[
                  ["Phone", viewTeacher.phone ?? "—"],
                  ["Gender", viewTeacher.gender ?? "—"],
                  ["Qualification", viewTeacher.qualification ?? "—"],
                  ["Experience", viewTeacher.experience ? `${viewTeacher.experience} years` : "—"],
                  ["Subjects", viewTeacher.subjects?.map(s => s.name).join(", ") ?? "—"],
                  ["Joined", formatDate(viewTeacher.createdAt)],
                ].map(([k, v]) => (
                  <div key={k} className="bg-muted/40 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-0.5">{k}</p>
                    <p className="font-medium text-foreground">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Delete Teacher?" description="This will permanently delete the teacher record." onConfirm={handleDelete} loading={deleteLoading} />
    </div>
  );
}
