"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2, Pencil, TrendingUp, Award, BookOpen } from "lucide-react";
import { gradeService } from "@/services/grade.service";
import { studentService } from "@/services/student.service";
import { subjectService } from "@/services/subject.service";
import type { Grade, Student, Subject, ExamType } from "@/types";
import { DataTable } from "@/components/ui/data-table";
import { Button, IconButton } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { Input, FormField } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { calcPercentage, formatDate } from "@/lib/utils";

const EXAM_TYPES: ExamType[] = ["MIDTERM", "FINAL", "QUIZ", "ASSIGNMENT", "PROJECT"];

const EXAM_TYPE_COLORS: Record<string, string> = {
  MIDTERM: "badge-blue",
  FINAL: "badge-purple",
  QUIZ: "badge-cyan",
  ASSIGNMENT: "badge-amber",
  PROJECT: "badge-green",
};

const schema = z.object({
  studentId: z.string().min(1, "Student required"),
  subjectId: z.string().min(1, "Subject required"),
  marks: z.number().min(0),
  maxMarks: z.number().min(1),
  examType: z.enum(["MIDTERM", "FINAL", "QUIZ", "ASSIGNMENT", "PROJECT"]),
  examDate: z.string().optional(),
  remarks: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function gradeFromPct(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
}

const gradeConfig: Record<string, { bg: string; text: string; bar: string }> = {
  "A+": { bg: "bg-emerald-100 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", bar: "bg-emerald-500" },
  "A": { bg: "bg-emerald-100 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", bar: "bg-emerald-500" },
  "B+": { bg: "bg-blue-100 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-400", bar: "bg-blue-500" },
  "B": { bg: "bg-blue-100 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-400", bar: "bg-blue-500" },
  "C": { bg: "bg-amber-100 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", bar: "bg-amber-500" },
  "D": { bg: "bg-orange-100 dark:bg-orange-950/30", text: "text-orange-700 dark:text-orange-400", bar: "bg-orange-500" },
  "F": { bg: "bg-red-100 dark:bg-red-950/30", text: "text-red-700 dark:text-red-400", bar: "bg-red-500" },
};

export default function GradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Grade | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);
  const [filterStudent, setFilterStudent] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    let cancelled = false;
    const fetchGrades = async () => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = { page, limit: 10 };
        if (filterStudent) params.studentId = filterStudent;
        if (filterSubject) params.subjectId = filterSubject;
        const res = await gradeService.getAll(params);
        if (!cancelled) {
          const rows = Array.isArray(res) ? res : (res as { data: Grade[] }).data ?? [];
          const pagination = (res as { pagination?: { total: number; pages: number } }).pagination;
          setGrades(rows); setTotal(pagination?.total ?? rows.length); setTotalPages(pagination?.pages ?? 1);
        }
      } catch { if (!cancelled) toast("Failed to load grades", { variant: "destructive" }); }
      finally { if (!cancelled) setLoading(false); }
    };
    fetchGrades();
    return () => { cancelled = true; };
  }, [page, filterStudent, filterSubject, fetchKey]);
  useEffect(() => {
    studentService.getAll({ limit: 200 }).then((r) => setStudents(Array.isArray(r) ? r : (r as { data: Student[] }).data ?? []));
    subjectService.getAll({ limit: 100 }).then((r) => setSubjects(Array.isArray(r) ? r : (r as { data: Subject[] }).data ?? []));
  }, []);

  const openCreate = () => { setEditing(null); reset({}); setModalOpen(true); };
  const openEdit = (g: Grade) => {
    setEditing(g);
    reset({ studentId: g.studentId, subjectId: g.subjectId, marks: g.marks, maxMarks: g.maxMarks, examType: g.examType, examDate: g.examDate?.slice(0, 10) ?? "", remarks: g.remarks ?? "" });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editing) { await gradeService.update(editing.id, data); toast("Grade updated", { variant: "success" }); }
      else { await gradeService.create(data); toast("Grade recorded", { variant: "success" }); }
      setModalOpen(false); setFetchKey((k) => k + 1);
    } catch (e: unknown) {
      toast((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error", { variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try { await gradeService.delete(deleteId); toast("Grade deleted", { variant: "success" }); setFetchKey((k) => k + 1); }
    catch { toast("Failed to delete", { variant: "destructive" }); }
    finally { setDeleteLoading(false); setDeleteId(null); }
  };

  const avgPct = grades.length > 0
    ? Math.round(grades.reduce((sum, g) => sum + calcPercentage(g.marks, g.maxMarks), 0) / grades.length)
    : 0;

  const columns: ColumnDef<Grade>[] = [
    {
      accessorKey: "student", header: "Student",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 text-xs font-bold flex-shrink-0">
            {(row.original.student?.name || "?").charAt(0)}
          </div>
          <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{row.original.student?.name ?? "—"}</span>
        </div>
      ),
    },
    {
      accessorKey: "subject", header: "Subject",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
          <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
          <span>{row.original.subject?.name ?? "—"}</span>
        </div>
      ),
    },
    {
      accessorKey: "examType", header: "Exam",
      cell: ({ row }) => (
        <span className={`badge ${EXAM_TYPE_COLORS[row.original.examType] ?? "badge-gray"}`}>
          {row.original.examType}
        </span>
      ),
    },
    {
      id: "marks", header: "Score",
      cell: ({ row }) => {
        const pct = calcPercentage(row.original.marks, row.original.maxMarks);
        const g = row.original.grade ?? gradeFromPct(pct);
        const cfg = gradeConfig[g] ?? { bg: "bg-zinc-100", text: "text-zinc-600", bar: "bg-zinc-400" };
        return (
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
              {row.original.marks}
              <span className="text-zinc-400 font-normal">/{row.original.maxMarks}</span>
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold ${cfg.bg} ${cfg.text}`}>
              {g}
            </span>
          </div>
        );
      },
    },
    {
      id: "pct", header: "Percentage",
      cell: ({ row }) => {
        const pct = calcPercentage(row.original.marks, row.original.maxMarks);
        const g = row.original.grade ?? gradeFromPct(pct);
        const cfg = gradeConfig[g] ?? { bg: "bg-zinc-100", text: "text-zinc-600", bar: "bg-zinc-400" };
        return (
          <div className="flex items-center gap-2.5 min-w-[100px]">
            <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${cfg.bar}`} style={{ width: `${pct}%` }} />
            </div>
            <span className={`text-xs font-semibold tabular-nums ${cfg.text}`}>{pct}%</span>
          </div>
        );
      },
    },
    {
      accessorKey: "examDate", header: "Date",
      cell: ({ row }) => <span className="text-sm text-zinc-500">{formatDate(row.original.examDate)}</span>,
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
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Grades</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Record and manage student grades</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate} id="add-grade-btn">Record Grade</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Records", value: total, icon: Award, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
          { label: "Class Average", value: `${avgPct}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          { label: "Subjects Tracked", value: new Set(grades.map((g) => g.subjectId)).size, icon: BookOpen, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
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

      {/* Filters */}
      <div className="erp-card p-4 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[180px] max-w-xs">
          <label className="text-xs font-medium text-zinc-400 dark:text-zinc-500 mb-1.5 block uppercase tracking-wide">Filter by Student</label>
          <Select onValueChange={(v) => setFilterStudent(v === "all" ? "" : v)} value={filterStudent || "all"}>
            <SelectTrigger><SelectValue placeholder="All students" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All students</SelectItem>
              {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[180px] max-w-xs">
          <label className="text-xs font-medium text-zinc-400 dark:text-zinc-500 mb-1.5 block uppercase tracking-wide">Filter by Subject</label>
          <Select onValueChange={(v) => setFilterSubject(v === "all" ? "" : v)} value={filterSubject || "all"}>
            <SelectTrigger><SelectValue placeholder="All subjects" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subjects</SelectItem>
              {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="erp-card overflow-hidden">
        <DataTable
          columns={columns}
          data={grades}
          isLoading={loading}
          searchPlaceholder="Search grades…"
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent title={editing ? "Edit Grade" : "Record Grade"}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Student" error={errors.studentId?.message} required className="col-span-2">
                <Select onValueChange={(v) => setValue("studentId", v)} defaultValue={editing?.studentId}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </FormField>
              <FormField label="Subject" error={errors.subjectId?.message} required className="col-span-2">
                <Select onValueChange={(v) => setValue("subjectId", v)} defaultValue={editing?.subjectId}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </FormField>
              <FormField label="Exam Type" error={errors.examType?.message} required>
                <Select onValueChange={(v) => setValue("examType", v as ExamType)} defaultValue={editing?.examType}>
                  <SelectTrigger><SelectValue placeholder="Exam type" /></SelectTrigger>
                  <SelectContent>{EXAM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </FormField>
              <FormField label="Exam Date" error={errors.examDate?.message}>
                <Input {...register("examDate")} type="date" />
              </FormField>
              <FormField label="Marks Obtained" error={errors.marks?.message} required>
                <Input {...register("marks", { valueAsNumber: true })} type="number" min={0} />
              </FormField>
              <FormField label="Max Marks" error={errors.maxMarks?.message} required>
                <Input {...register("maxMarks", { valueAsNumber: true })} type="number" min={1} />
              </FormField>
              <FormField label="Remarks" error={errors.remarks?.message} className="col-span-2">
                <Input {...register("remarks")} placeholder="Optional remarks" />
              </FormField>
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={isSubmitting}>{editing ? "Update" : "Record"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Grade?"
        description="This will permanently delete this grade record."
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
