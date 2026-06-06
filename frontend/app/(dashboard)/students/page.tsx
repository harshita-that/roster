"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, Plus, Eye, Users, UserCheck, GraduationCap } from "lucide-react";
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

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
];

function getAvatarColor(name: string) {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

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
  const [fetchKey, setFetchKey] = useState(0);

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    let cancelled = false;
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const res = await studentService.getAll({ page, limit: 10, search });
        if (!cancelled) {
          setStudents(res.data);
          setTotal(res.pagination.total);
          setTotalPages(res.pagination.pages);
        }
      } catch { if (!cancelled) toast("Failed to load students", { variant: "destructive" }); }
      finally { if (!cancelled) setLoading(false); }
    };
    fetchStudents();
    return () => { cancelled = true; };
  }, [page, search, fetchKey]);

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
      setFetchKey((k) => k + 1);
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
      setFetchKey((k) => k + 1);
    } catch { toast("Failed to delete", { variant: "destructive" }); }
    finally { setDeleteLoading(false); setDeleteId(null); }
  };

  const maleCount = students.filter((s) => s.gender === "MALE").length;
  const femaleCount = students.filter((s) => s.gender === "FEMALE").length;

  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: "rollNumber",
      header: "Roll No",
      cell: ({ row }) => (
        <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-md">
          {row.original.rollNumber ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Student",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${getAvatarColor(row.original.name)}`}>
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
    { accessorKey: "gender", header: "Gender", cell: ({ row }) => <GenderBadge gender={row.original.gender} /> },
    {
      accessorKey: "class",
      header: "Class",
      cell: ({ row }) => row.original.class?.name
        ? <span className="badge badge-blue">{row.original.class.name}</span>
        : <span className="text-zinc-400">—</span>,
    },
    { accessorKey: "dateOfBirth", header: "DOB", cell: ({ row }) => <span className="text-sm text-zinc-500">{formatDate(row.original.dateOfBirth)}</span> },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <IconButton onClick={() => setViewStudent(row.original)} title="View">
            <Eye className="w-3.5 h-3.5" />
          </IconButton>
          <IconButton onClick={() => openEdit(row.original)} title="Edit">
            <Pencil className="w-3.5 h-3.5" />
          </IconButton>
          <IconButton onClick={() => setDeleteId(row.original.id)} title="Delete" className="hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
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
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Students</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Manage all enrolled students</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate} id="add-student-btn">
          Add Student
        </Button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Students", value: total, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
          { label: "Male", value: maleCount, icon: UserCheck, color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-950/30" },
          { label: "Female", value: femaleCount, icon: GraduationCap, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950/30" },
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
          data={students}
          isLoading={loading}
          searchPlaceholder="Search students…"
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

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
            <div className="flex gap-3 justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
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
            <div className="space-y-5 mt-2">
              <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0 ${getAvatarColor(viewStudent.name)}`}>
                  {(viewStudent.name || "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{viewStudent.name}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{viewStudent.email}</p>
                  <GenderBadge gender={viewStudent.gender} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Roll Number", viewStudent.rollNumber],
                  ["Phone", viewStudent.phone ?? "—"],
                  ["Date of Birth", formatDate(viewStudent.dateOfBirth)],
                  ["Class", viewStudent.class?.name ?? "—"],
                  ["Address", viewStudent.address ?? "—"],
                  ["Created", formatDate(viewStudent.createdAt)],
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
