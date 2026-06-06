"use client";

import { useEffect, useState, useRef } from "react";
import { fileService } from "@/services/file.service";
import type { FileRecord } from "@/types";
import { Button, IconButton } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/toaster";
import { Upload, Trash2, Download, FileText, Image, File } from "lucide-react";
import { formatDate, formatFileSize, getMimeIcon } from "@/lib/utils";

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <Image className="w-5 h-5 text-blue-500" />;
  if (mimeType === "application/pdf") return <FileText className="w-5 h-5 text-red-500" />;
  return <File className="w-5 h-5 text-muted-foreground" />;
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchFiles = async () => {
      setLoading(true);
      try {
        const res = await fileService.getAll();
        if (!cancelled) setFiles(Array.isArray(res) ? res : (res as { data: FileRecord[] }).data ?? []);
      } catch { if (!cancelled) toast("Failed to load files", { variant: "destructive" }); }
      finally { if (!cancelled) setLoading(false); }
    };
    fetchFiles();
    return () => { cancelled = true; };
  }, [fetchKey]);

  const handleUpload = async (file: File) => {
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) { toast("File too large (max 5 MB)", { variant: "destructive" }); return; }
    const allowed = ["image/jpeg", "image/png", "image/gif", "application/pdf",
      "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
    if (!allowed.includes(file.type)) { toast("File type not supported", { variant: "destructive" }); return; }
    setUploading(true); setUploadProgress(0);
    try {
      await fileService.upload(file, setUploadProgress);
      toast("File uploaded!", { variant: "success" });
      setFetchKey((k) => k + 1);
    } catch (e: unknown) {
      toast((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Upload failed", { variant: "destructive" });
    } finally { setUploading(false); setUploadProgress(0); }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try { await fileService.delete(deleteId); toast("File deleted", { variant: "success" }); setFetchKey((k) => k + 1); }
    catch { toast("Failed to delete", { variant: "destructive" }); }
    finally { setDeleteLoading(false); setDeleteId(null); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground">File Manager</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Upload and manage school documents</p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`erp-card border-2 border-dashed p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition ${dragging ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : "border-border hover:border-indigo-400 hover:bg-muted/30"}`}
      >
        <input ref={inputRef} type="file" className="hidden" onChange={onInputChange}
          accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx" />
        <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <Upload className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground">
            {uploading ? "Uploading…" : dragging ? "Drop file here" : "Click or drag & drop to upload"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Supports: Images, PDF, Word, Excel — Max 5 MB</p>
        </div>
        {uploading && (
          <div className="w-64 space-y-1">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="text-xs text-center text-muted-foreground">{uploadProgress}%</p>
          </div>
        )}
      </div>

      {/* File list */}
      <div className="erp-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-medium text-foreground text-sm">{files.length} file{files.length !== 1 ? "s" : ""}</h3>
        </div>
        {loading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="w-10 h-10 bg-muted animate-pulse rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-muted animate-pulse rounded w-48" />
                  <div className="h-2.5 bg-muted animate-pulse rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            <Upload className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No files uploaded yet
          </div>
        ) : (
          <div className="divide-y divide-border">
            {files.map((f) => (
              <div key={f.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition group">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 text-lg">
                  {getMimeIcon(f.mimeType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{f.originalName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{formatFileSize(f.size)}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{formatDate(f.createdAt)}</span>
                    {f.uploadedBy && (
                      <>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{f.uploadedBy.name}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <a href={fileService.download(f.id)} target="_blank" rel="noopener noreferrer">
                    <IconButton title="Download"><Download className="w-4 h-4" /></IconButton>
                  </a>
                  <IconButton onClick={() => setDeleteId(f.id)} className="hover:text-destructive hover:bg-destructive/10" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Delete File?" description="This will permanently delete the file." onConfirm={handleDelete} loading={deleteLoading} />
    </div>
  );
}
