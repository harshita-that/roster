"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, Plus, Eye } from "lucide-react";
import { studentService } from "@/services/student.service";
import { classService } from "@/services/class.service";
import type { Student, Class } from "@/types";
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
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  classId: z.string().optional(),
  rollNumber: z.string().optional(),
  password: z.string().min(6, "Min 6 chars").optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentService.getAll({ page, limit: 10, search });
      const rows = Array.isArray(res) ? res : (res as { data: Student[] }).data ?? [];
      const pagination = (res as { pagination?: { total: number; pages: number } }).pagination;
      setStudents(rows);
      setTotal(pagination?.total ?? rows.length);
      setTotalPages(pagination?.pages ?? 1);
    } catch { toast("Failed to load students", { variant: "destructive" }); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  useEffect(() => {
    classService.getAll({ limit: 100 }).then((r) => {
      setClasses(Array.isArray(r) ? r : (r as { data: Class[] }).data ?? []);
    });
  }, []);

  const openCreate = () => { setEditing(null); reset({}); setModalOpen(true); };
  const openEdit = (s: Student) => {
    setEditing(s);
    reset({
      name: s.name, email: s.email, phone: s.phone ?? "",
      gender: s.gender, dateOfBirth: s.dateOfBirth?.slice(0, 10) ?? "",
      address: s.address ?? "", classId: s.classId ?? "",
      rollNumber: s.rollNumber ?? "", password: "",
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, password: data.password || undefined };
      if (editing) {
        await studentService.update(editing.id, payload);
        toast("Student updated", { variant: "success" });
      } else {
        await studentService.create(payload as Parameters<typeof studentService.create>[0]);
        toast("Student created", { variant: "success" });
      }
      setModalOpen(false);
      fetchStudents();
    } catch (e: unknown) {
      toast((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error", { variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await studentService.delete(deleteId);
      toast("Student deleted", { variant: "success" });
      fetchStudents();
    } catch { toast("Failed to delete", { variant: "destructive" }); }
    finally { setDeleteLoading(false); setDeleteId(null); }
  };

  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: "rollNumber",
      header: "Roll No",
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.rollNumber}</span>,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-300 text-xs font-bold flex-shrink-0">
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
    { accessorKey: "gender", header: "Gender", cell: ({ row }) => <GenderBadge gender={row.original.gender} /> },
    {
      accessorKey: "class",
      header: "Class",
      cell: ({ row }) => row.original.class?.name ?? <span className="text-muted-foreground">—</span>,
    },
    { accessorKey: "dateOfBirth", header: "DOB", cell: ({ row }) => formatDate(row.original.dateOfBirth) },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <IconButton onClick={() => setViewStudent(row.original)} title="View"><Eye className="w-4 h-4" /></IconButton>
          <IconButton onClick={() => openEdit(row.original)} title="Edit"><Pencil className="w-4 h-4" /></IconButton>
          <IconButton onClick={() => setDeleteId(row.original.id)} title="Delete" className="hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="w-4 h-4" />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Students</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage all enrolled students</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate} id="add-student-btn">Add Student</Button>
      </div>

      <DataTable
        columns={columns}
        data={students}
        isLoading={loading}
        searchPlaceholder="Search students…"
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent title={editing ? "Edit Student" : "Add Student"} description="Fill in the student details below.">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Full Name" error={errors.name?.message} required className="col-span-2">
                <Input {...register("name")} placeholder="Student name" />
              </FormField>
              <FormField label="Email" error={errors.email?.message} required>
                <Input {...register("email")} type="email" placeholder="email@school.com" />
              </FormField>
              <FormField label="Phone" error={errors.phone?.message}>
                <Input {...register("phone")} placeholder="+91 ..." />
              </FormField>
              <FormField label="Gender" error={errors.gender?.message} required>
                <Select onValueChange={(v) => setValue("gender", v as "MALE" | "FEMALE" | "OTHER")} defaultValue={editing?.gender}>
                  <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Date of Birth" error={errors.dateOfBirth?.message}>
                <Input {...register("dateOfBirth")} type="date" />
              </FormField>
              <FormField label="Roll Number" error={errors.rollNumber?.message}>
                <Input {...register("rollNumber")} placeholder="e.g. 2024001" />
              </FormField>
              <FormField label="Class" error={errors.classId?.message}>
                <Select onValueChange={(v) => setValue("classId", v)} defaultValue={editing?.classId}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Address" error={errors.address?.message} className="col-span-2">
                <Input {...register("address")} placeholder="Full address" />
              </FormField>
              {!editing && (
                <FormField label="Password" error={errors.password?.message} required className="col-span-2">
                  <Input {...register("password")} type="password" placeholder="Min 6 characters" />
                </FormField>
              )}
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={isSubmitting}>{editing ? "Update" : "Create"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={!!viewStudent} onOpenChange={() => setViewStudent(null)}>
        <DialogContent title="Student Details">
          {viewStudent && (
            <div className="space-y-3 mt-2">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-300 text-2xl font-bold">
                  {(viewStudent.name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{viewStudent.name}</h3>
                  <p className="text-sm text-muted-foreground">{viewStudent.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm pt-2">
                {[
                  ["Roll Number", viewStudent.rollNumber],
                  ["Phone", viewStudent.phone ?? "—"],
                  ["Gender", viewStudent.gender],
                  ["Date of Birth", formatDate(viewStudent.dateOfBirth)],
                  ["Class", viewStudent.class?.name ?? "—"],
                  ["Address", viewStudent.address ?? "—"],
                  ["Created", formatDate(viewStudent.createdAt)],
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

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Student?"
        description="This will permanently delete the student and all associated records."
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
