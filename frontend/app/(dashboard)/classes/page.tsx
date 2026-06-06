"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, Plus, Users, GraduationCap, LayoutGrid, LayoutList } from "lucide-react";
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

const GRADE_COLORS = [
  "bg-rose-100 text-rose-700",
  "bg-orange-100 text-orange-700",
  "bg-amber-100 text-amber-700",
  "bg-lime-100 text-lime-700",
  "bg-emerald-100 text-emerald-700",
  "bg-teal-100 text-teal-700",
  "bg-cyan-100 text-cyan-700",
  "bg-sky-100 text-sky-700",
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-purple-100 text-purple-700",
  "bg-fuchsia-100 text-fuchsia-700",
];

function getGradeColor(grade: number) {
  return GRADE_COLORS[(grade - 1) % GRADE_COLORS.length];
}

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
  const [fetchKey, setFetchKey] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    let cancelled = false;
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const res = await classService.getAll({ page, limit: 10 });
        if (!cancelled) {
          const rows = Array.isArray(res) ? res : (res as { data: Class[] }).data ?? [];
          const pagination = (res as { pagination?: { total: number; pages: number } }).pagination;
          setClasses(rows); setTotal(pagination?.total ?? rows.length); setTotalPages(pagination?.pages ?? 1);
        }
      } catch { if (!cancelled) toast("Failed to load classes", { variant: "destructive" }); }
      finally { if (!cancelled) setLoading(false); }
    };
    fetchClasses();
    return () => { cancelled = true; };
  }, [page, fetchKey]);
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
      setModalOpen(false); setFetchKey((k) => k + 1);
    } catch (e: unknown) {
      toast((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error", { variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try { await classService.delete(deleteId); toast("Class deleted", { variant: "success" }); setFetchKey((k) => k + 1); }
    catch { toast("Failed to delete", { variant: "destructive" }); }
    finally { setDeleteLoading(false); setDeleteId(null); }
  };

  const columns: ColumnDef<Class>[] = [
    {
      accessorKey: "name", header: "Class Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${getGradeColor(row.original.grade)}`}>
            {row.original.grade}
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">{row.original.name}</p>
            <p className="text-xs text-zinc-500">Section {row.original.section}</p>
          </div>
        </div>
      ),
    },
    { accessorKey: "grade", header: "Grade", cell: ({ row }) => <span className={`badge ${getGradeColor(row.original.grade)}`}>Grade {row.original.grade}</span> },
    { accessorKey: "section", header: "Section", cell: ({ row }) => <span className="badge badge-gray">{row.original.section}</span> },
    { accessorKey: "academicYear", header: "Academic Year", cell: ({ row }) => <span className="text-sm text-zinc-600 dark:text-zinc-400">{row.original.academicYear}</span> },
    { accessorKey: "classTeacher", header: "Class Teacher", cell: ({ row }) => row.original.classTeacher?.name ?? <span className="text-zinc-400">—</span> },
    {
      id: "students", header: "Students",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Users className="w-3.5 h-3.5 text-zinc-400" />
          <span>{row.original._count?.students ?? row.original.students?.length ?? 0}</span>
        </div>
      ),
    },
    {
      id: "actions", header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Classes</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Manage school classes and sections</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 gap-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition ${viewMode === "grid" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition ${viewMode === "list" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
              title="List view"
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
          <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate} id="add-class-btn">Add Class</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Classes", value: total, icon: GraduationCap, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          { label: "Total Students", value: classes.reduce((acc, c) => acc + (c._count?.students ?? c.students?.length ?? 0), 0), icon: Users, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
          { label: "Active Teachers", value: new Set(classes.map((c) => c.teacherId).filter(Boolean)).size, icon: Users, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
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

      {/* Grid view */}
      {viewMode === "grid" && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div key={cls.id} className="erp-card p-5 group hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 ${getGradeColor(cls.grade)}`}>
                    {cls.grade}
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base leading-tight">{cls.name}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Section {cls.section} · {cls.academicYear}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <IconButton onClick={() => openEdit(cls)} title="Edit"><Pencil className="w-3.5 h-3.5" /></IconButton>
                  <IconButton onClick={() => setDeleteId(cls.id)} className="hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" title="Delete"><Trash2 className="w-3.5 h-3.5" /></IconButton>
                </div>
              </div>
              <div className="space-y-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">Class Teacher</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">{cls.classTeacher?.name ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">Students</span>
                  <div className="flex items-center gap-1 font-medium text-zinc-800 dark:text-zinc-200">
                    <Users className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{cls._count?.students ?? cls.students?.length ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {classes.length === 0 && (
            <div className="col-span-3 text-center py-16 text-zinc-500 dark:text-zinc-400">
              <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No classes found. Add your first class.</p>
            </div>
          )}
        </div>
      )}

      {/* List view */}
      {viewMode === "list" && (
        <div className="erp-card overflow-hidden">
          <DataTable
            columns={columns}
            data={classes}
            isLoading={loading}
            searchPlaceholder="Search classes…"
            total={total}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent title={editing ? "Edit Class" : "Add Class"}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Class Name" error={errors.name?.message} required className="col-span-2">
                <Input {...register("name")} placeholder="e.g. Class 10-A" />
              </FormField>
              <FormField label="Grade" error={errors.grade?.message} required>
                <Input {...register("grade", { valueAsNumber: true })} type="number" min={1} max={12} />
              </FormField>
              <FormField label="Section" error={errors.section?.message} required>
                <Input {...register("section")} placeholder="A, B, C…" />
              </FormField>
              <FormField label="Academic Year" error={errors.academicYear?.message} required>
                <Input {...register("academicYear")} placeholder="2024-25" />
              </FormField>
              <FormField label="Class Teacher" error={errors.teacherId?.message}>
                <Select onValueChange={(v) => setValue("teacherId", v)} defaultValue={editing?.teacherId ?? ""}>
                  <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
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
        title="Delete Class?"
        description="This will delete the class and all associated records."
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
