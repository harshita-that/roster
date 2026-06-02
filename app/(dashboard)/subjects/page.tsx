"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, Plus, BookOpen } from "lucide-react";
import { subjectService } from "@/services/subject.service";
import type { Subject } from "@/types";
import { DataTable } from "@/components/ui/data-table";
import { Button, IconButton } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { Input, Textarea, FormField } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { formatDate } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Name required"),
  code: z.string().min(2, "Code required"),
  description: z.string().optional(),
  credits: z.number().min(0).optional(),
});
type FormData = z.infer<typeof schema>;

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await subjectService.getAll({ page, limit: 10 });
      const rows = Array.isArray(res) ? res : (res as { data: Subject[] }).data ?? [];
      const pagination = (res as { pagination?: { total: number; pages: number } }).pagination;
      setSubjects(rows); setTotal(pagination?.total ?? rows.length); setTotalPages(pagination?.pages ?? 1);
    } catch { toast("Failed to load subjects", { variant: "destructive" }); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  const openCreate = () => { setEditing(null); reset({}); setModalOpen(true); };
  const openEdit = (s: Subject) => {
    setEditing(s);
    reset({ name: s.name, code: s.code, description: s.description ?? "", credits: s.credits ?? 0 });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editing) { await subjectService.update(editing.id, data); toast("Subject updated", { variant: "success" }); }
      else { await subjectService.create(data); toast("Subject created", { variant: "success" }); }
      setModalOpen(false); fetch();
    } catch (e: unknown) {
      toast((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error", { variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try { await subjectService.delete(deleteId); toast("Subject deleted", { variant: "success" }); fetch(); }
    catch { toast("Failed to delete", { variant: "destructive" }); }
    finally { setDeleteLoading(false); setDeleteId(null); }
  };

  const columns: ColumnDef<Subject>[] = [
    {
      accessorKey: "name", header: "Subject",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-700 dark:text-purple-300 flex-shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <p className="font-medium text-foreground text-sm">{row.original.name}</p>
        </div>
      ),
    },
    {
      accessorKey: "code", header: "Code",
      cell: ({ row }) => <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{row.original.code}</span>,
    },
    { accessorKey: "description", header: "Description", cell: ({ row }) => <span className="text-muted-foreground text-sm line-clamp-1">{row.original.description ?? "—"}</span> },
    { accessorKey: "credits", header: "Credits", cell: ({ row }) => row.original.credits ?? "—" },
    { accessorKey: "createdAt", header: "Created", cell: ({ row }) => formatDate(row.original.createdAt) },
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
          <h2 className="text-xl font-semibold text-foreground">Subjects</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage curriculum subjects</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate} id="add-subject-btn">Add Subject</Button>
      </div>

      <DataTable columns={columns} data={subjects} isLoading={loading} searchPlaceholder="Search subjects…" total={total} page={page} totalPages={totalPages} onPageChange={setPage} />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent title={editing ? "Edit Subject" : "Add Subject"}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <FormField label="Subject Name" error={errors.name?.message} required><Input {...register("name")} placeholder="e.g. Mathematics" /></FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Subject Code" error={errors.code?.message} required><Input {...register("code")} placeholder="e.g. MATH101" /></FormField>
              <FormField label="Credits" error={errors.credits?.message}><Input {...register("credits", { valueAsNumber: true })} type="number" min={0} /></FormField>
            </div>
            <FormField label="Description" error={errors.description?.message}><Textarea {...register("description")} placeholder="Brief description…" rows={3} /></FormField>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={isSubmitting}>{editing ? "Update" : "Create"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Delete Subject?" description="This will permanently delete this subject." onConfirm={handleDelete} loading={deleteLoading} />
    </div>
  );
}
