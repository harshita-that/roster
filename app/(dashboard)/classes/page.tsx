"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, Plus, Users } from "lucide-react";
import { classService } from "@/services/class.service";
import { teacherService } from "@/services/teacher.service";
import type { Class, Teacher } from "@/types";
import { DataTable } from "@/components/ui/data-table";
import { Button, IconButton } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { Input, FormField } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";

const schema = z.object({
  name: z.string().min(1, "Name required"),
  grade: z.number().min(1).max(12),
  section: z.string().min(1, "Section required"),
  academicYear: z.string().min(4, "Year required"),
  teacherId: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Class | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await classService.getAll({ page, limit: 10 });
      const rows = Array.isArray(res) ? res : (res as { data: Class[] }).data ?? [];
      const pagination = (res as { pagination?: { total: number; pages: number } }).pagination;
      setClasses(rows); setTotal(pagination?.total ?? rows.length); setTotalPages(pagination?.pages ?? 1);
    } catch { toast("Failed to load classes", { variant: "destructive" }); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => {
    teacherService.getAll({ limit: 100 }).then((r) => setTeachers(Array.isArray(r) ? r : (r as { data: Teacher[] }).data ?? []));
  }, []);

  const openCreate = () => { setEditing(null); reset({ academicYear: "2024-25" }); setModalOpen(true); };
  const openEdit = (c: Class) => {
    setEditing(c);
    reset({ name: c.name, grade: c.grade, section: c.section, academicYear: c.academicYear, teacherId: c.teacherId ?? "" });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editing) { await classService.update(editing.id, data); toast("Class updated", { variant: "success" }); }
      else { await classService.create(data); toast("Class created", { variant: "success" }); }
      setModalOpen(false); fetch();
    } catch (e: unknown) {
      toast((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error", { variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try { await classService.delete(deleteId); toast("Class deleted", { variant: "success" }); fetch(); }
    catch { toast("Failed to delete", { variant: "destructive" }); }
    finally { setDeleteLoading(false); setDeleteId(null); }
  };

  const columns: ColumnDef<Class>[] = [
    {
      accessorKey: "name", header: "Class Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-sm flex-shrink-0">
            {row.original.grade}
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">Section {row.original.section}</p>
          </div>
        </div>
      ),
    },
    { accessorKey: "grade", header: "Grade" },
    { accessorKey: "section", header: "Section" },
    { accessorKey: "academicYear", header: "Academic Year" },
    { accessorKey: "classTeacher", header: "Class Teacher", cell: ({ row }) => row.original.classTeacher?.name ?? "—" },
    {
      id: "students", header: "Students",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{row.original._count?.students ?? row.original.students?.length ?? 0}</span>
        </div>
      ),
    },
    {
      id: "actions", header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
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
          <h2 className="text-xl font-semibold text-foreground">Classes</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage school classes and sections</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate} id="add-class-btn">Add Class</Button>
      </div>

      <DataTable columns={columns} data={classes} isLoading={loading} searchPlaceholder="Search classes…" total={total} page={page} totalPages={totalPages} onPageChange={setPage} />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent title={editing ? "Edit Class" : "Add Class"}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Class Name" error={errors.name?.message} required className="col-span-2"><Input {...register("name")} placeholder="e.g. Class 10-A" /></FormField>
              <FormField label="Grade" error={errors.grade?.message} required><Input {...register("grade", { valueAsNumber: true })} type="number" min={1} max={12} /></FormField>
              <FormField label="Section" error={errors.section?.message} required><Input {...register("section")} placeholder="A, B, C…" /></FormField>
              <FormField label="Academic Year" error={errors.academicYear?.message} required><Input {...register("academicYear")} placeholder="2024-25" /></FormField>
              <FormField label="Class Teacher" error={errors.teacherId?.message}>
                <Select onValueChange={(v) => setValue("teacherId", v)} defaultValue={editing?.teacherId ?? ""}>
                  <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={isSubmitting}>{editing ? "Update" : "Create"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Delete Class?" description="This will delete the class and all associated records." onConfirm={handleDelete} loading={deleteLoading} />
    </div>
  );
}
