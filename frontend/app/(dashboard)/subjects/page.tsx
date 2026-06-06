"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, Plus, BookOpen, Hash, Star } from "lucide-react";
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
  const [fetchKey, setFetchKey] = useState(0);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    let cancelled = false;
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const res = await subjectService.getAll({ page, limit: 10 });
        if (!cancelled) {
          const rows = Array.isArray(res) ? res : (res as { data: Subject[] }).data ?? [];
          const pagination = (res as { pagination?: { total: number; pages: number } }).pagination;
          setSubjects(rows); setTotal(pagination?.total ?? rows.length); setTotalPages(pagination?.pages ?? 1);
        }
      } catch { if (!cancelled) toast("Failed to load subjects", { variant: "destructive" }); }
      finally { if (!cancelled) setLoading(false); }
    };
    fetchSubjects();
    return () => { cancelled = true; };
  }, [page, fetchKey]);

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
      setModalOpen(false); setFetchKey((k) => k + 1);
    } catch (e: unknown) {
      toast((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error", { variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try { await subjectService.delete(deleteId); toast("Subject deleted", { variant: "success" }); setFetchKey((k) => k + 1); }
    catch { toast("Failed to delete", { variant: "destructive" }); }
    finally { setDeleteLoading(false); setDeleteId(null); }
  };

  const totalCredits = subjects.reduce((sum, s) => sum + (s.credits ?? 0), 0);

  const columns: ColumnDef<Subject>[] = [
    {
      accessorKey: "name", header: "Subject",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">{row.original.name}</p>
        </div>
      ),
    },
    {
      accessorKey: "code", header: "Code",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 font-mono text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <Hash className="w-3 h-3" />{row.original.code}
        </span>
      ),
    },
    {
      accessorKey: "description", header: "Description",
      cell: ({ row }) => (
        <span className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1">
          {row.original.description ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "credits", header: "Credits",
      cell: ({ row }) => row.original.credits !== undefined && row.original.credits !== null
        ? (
          <span className="inline-flex items-center gap-1 badge badge-amber">
            <Star className="w-3 h-3" />
            {row.original.credits} cr
          </span>
        )
        : <span className="text-zinc-400">—</span>,
    },
    {
      accessorKey: "createdAt", header: "Created",
      cell: ({ row }) => <span className="text-sm text-zinc-500">{formatDate(row.original.createdAt)}</span>,
    },
    {
      id: "actions", header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <IconButton onClick={() => openEdit(row.original)}><Pencil className="w-3.5 h-3.5" /></IconButton>
          <IconButton onClick={() => setDeleteId(row.original.id)} className="hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
            <Trash2 className="w-3.5 h-3.5" />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Subjects</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Manage curriculum subjects</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate} id="add-subject-btn">Add Subject</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Subjects", value: total, icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
          { label: "Total Credits", value: totalCredits, icon: Star, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
          { label: "Avg Credits / Subject", value: total > 0 ? (totalCredits / total).toFixed(1) : "—", icon: Hash, color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-950/30" },
        ].map((stat) => (
          <div key={stat.label} className="erp-card p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
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
          data={subjects}
          isLoading={loading}
          searchPlaceholder="Search subjects…"
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent title={editing ? "Edit Subject" : "Add Subject"}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <FormField label="Subject Name" error={errors.name?.message} required>
              <Input {...register("name")} placeholder="e.g. Mathematics" />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Subject Code" error={errors.code?.message} required>
                <Input {...register("code")} placeholder="e.g. MATH101" className="font-mono" />
              </FormField>
              <FormField label="Credits" error={errors.credits?.message}>
                <Input {...register("credits", { valueAsNumber: true })} type="number" min={0} />
              </FormField>
            </div>
            <FormField label="Description" error={errors.description?.message}>
              <Textarea {...register("description")} placeholder="Brief description…" rows={3} />
            </FormField>
            <div className="flex gap-3 justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={isSubmitting}>{editing ? "Update" : "Create"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Subject?"
        description="This will permanently delete this subject."
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
