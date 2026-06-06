"use client";

import * as React from "react";
import * as AlertDialogPrimitives from "@radix-ui/react-alert-dialog";
import { cn } from "@/lib/utils";

export const AlertDialog = AlertDialogPrimitives.Root;
export const AlertDialogTrigger = AlertDialogPrimitives.Trigger;

export function AlertDialogContent({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitives.Content>) {
  return (
    <AlertDialogPrimitives.Portal>
      <AlertDialogPrimitives.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
      <AlertDialogPrimitives.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-popover border border-border shadow-2xl p-6 focus:outline-none animate-fadeIn",
          className
        )}
        {...props}
      >
        {children}
      </AlertDialogPrimitives.Content>
    </AlertDialogPrimitives.Portal>
  );
}

export const AlertDialogTitle = AlertDialogPrimitives.Title;
export const AlertDialogDescription = AlertDialogPrimitives.Description;
export const AlertDialogCancel = AlertDialogPrimitives.Cancel;
export const AlertDialogAction = AlertDialogPrimitives.Action;

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Delete",
  onConfirm,
  loading,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogTitle className="text-lg font-semibold text-foreground">
          {title}
        </AlertDialogTitle>
        <AlertDialogDescription className="text-sm text-muted-foreground mt-2 mb-6">
          {description}
        </AlertDialogDescription>
        <div className="flex gap-3 justify-end">
          <AlertDialogCancel className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); onConfirm(); }}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition disabled:opacity-60"
          >
            {loading ? "Deleting…" : confirmLabel}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
