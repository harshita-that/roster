"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2, Pencil } from "lucide-react";
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

const gradeColors: Record<string, string> = {
  "A+": "text-emerald-600 bg-emerald-100",
  A: "text-emerald-600 bg-emerald-100",
  "B+": "text-blue-600 bg-blue-100",
  B: "text-blue-600 bg-blue-100",
  C: "text-yellow-600 bg-yellow-100",
  D: "text-orange-600 bg-orange-100",
  F: "text-red-600 bg-red-100",
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
  const [filterStudent, setFilterStudent] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (filterStudent) params.studentId = filterStudent;
      if (filterSubject) params.subjectId = filterSubject;
      const res = await gradeService.getAll(params);
      const rows = Array.isArray(res) ? res : (res as { data: Grade[] }).data ?? [];
      const pagination = (res as { pagination?: { total: number; pages: number } }).pagination;
      setGrades(rows); setTotal(pagination?.total ?? rows.length); setTotalPages(pagination?.pages ?? 1);
    } catch { toast("Failed to load grades", { variant: "destructive" }); }
    finally { setLoading(false); }
  }, [page, filterStudent, filterSubject]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => {
    studentService.getAll({ limit: 200 }).then(r => setStudents(Array.isArray(r) ? r : (r as { data: Student[] }).data ?? []));
    subjectService.getAll({ limit: 100 }).then(r => setSubjects(Array.isArray(r) ? r : (r as { data: Subject[] }).data ?? []));
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
      setModalOpen(false); fetch();
    } catch (e: unknown) {
      toast((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error", { variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try { await gradeService.delete(deleteId); toast("Grade deleted", { variant: "success" }); fetch(); }
    catch { toast("Failed to delete", { variant: "destructive" }); }
    finally { setDeleteLoading(false); setDeleteId(null); }
  };

  const columns: ColumnDef<Grade>[] = [
    { accessorKey: "student", header: "Student", cell: ({ row }) => <span className="font-medium text-sm">{row.original.student?.name ?? "—"}</span> },
    { accessorKey: "subject", header: "Subject", cell: ({ row }) => row.original.subject?.name ?? "—" },
    { accessorKey: "examType", header: "Exam", cell: ({ row }) => <span className="text-xs bg-muted px-2 py-1 rounded font-medium">{row.original.examType}</span> },
    {
      id: "marks", header: "Marks",
      cell: ({ row }) => {
        const pct = calcPercentage(row.original.marks, row.original.maxMarks);
        const g = row.original.grade ?? gradeFromPct(pct);
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{row.original.marks}/{row.original.maxMarks}</span>
            <span className={`badge text-xs ${gradeColors[g] ?? "bg-muted text-foreground"}`}>{g}</span>
          </div>
        );
      },
    },
    {
      id: "pct", header: "Percentage",
      cell: ({ row }) => {
        const pct = calcPercentage(row.original.marks, row.original.maxMarks);
        return (
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{pct}%</span>
          </div>
        );
      },
    },
    { accessorKey: "examDate", header: "Date", cell: ({ row }) => formatDate(row.original.examDate) },
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
          <h2 className="text-xl font-semibold text-foreground">Grades</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Record and manage student grades</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate} id="add-grade-btn">Record Grade</Button>
      </div>

      {/* Filters */}
      <div className="erp-card p-4 flex flex-wrap gap-4">
        <div className="w-52">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Filter by Student</label>
          <Select onValueChange={(v) => setFilterStudent(v === "all" ? "" : v)} value={filterStudent || "all"}>
            <SelectTrigger><SelectValue placeholder="All students" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All students</SelectItem>
              {students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-52">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Filter by Subject</label>
          <Select onValueChange={(v) => setFilterSubject(v === "all" ? "" : v)} value={filterSubject || "all"}>
            <SelectTrigger><SelectValue placeholder="All subjects" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subjects</SelectItem>
              {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable columns={columns} data={grades} isLoading={loading} searchPlaceholder="Search grades…" total={total} page={page} totalPages={totalPages} onPageChange={setPage} />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent title={editing ? "Edit Grade" : "Record Grade"}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Student" error={errors.studentId?.message} required className="col-span-2">
                <Select onValueChange={(v) => setValue("studentId", v)} defaultValue={editing?.studentId}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </FormField>
              <FormField label="Subject" error={errors.subjectId?.message} required className="col-span-2">
                <Select onValueChange={(v) => setValue("subjectId", v)} defaultValue={editing?.subjectId}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </FormField>
              <FormField label="Exam Type" error={errors.examType?.message} required>
                <Select onValueChange={(v) => setValue("examType", v as ExamType)} defaultValue={editing?.examType}>
                  <SelectTrigger><SelectValue placeholder="Exam type" /></SelectTrigger>
                  <SelectContent>{EXAM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </FormField>
              <FormField label="Exam Date" error={errors.examDate?.message}><Input {...register("examDate")} type="date" /></FormField>
              <FormField label="Marks Obtained" error={errors.marks?.message} required><Input {...register("marks", { valueAsNumber: true })} type="number" min={0} /></FormField>
              <FormField label="Max Marks" error={errors.maxMarks?.message} required><Input {...register("maxMarks", { valueAsNumber: true })} type="number" min={1} /></FormField>
              <FormField label="Remarks" error={errors.remarks?.message} className="col-span-2"><Input {...register("remarks")} placeholder="Optional remarks" /></FormField>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={isSubmitting}>{editing ? "Update" : "Record"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Delete Grade?" description="This will permanently delete this grade record." onConfirm={handleDelete} loading={deleteLoading} />
    </div>
  );
}
