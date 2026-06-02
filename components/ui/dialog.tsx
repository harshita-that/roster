"use client";

import * as React from "react";
import * as DialogPrimitives from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitives.Root;
export const DialogTrigger = DialogPrimitives.Trigger;

export function DialogContent({
  children,
  className,
  title,
  description,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitives.Content> & {
  title?: string;
  description?: string;
}) {
  return (
    <DialogPrimitives.Portal>
      <DialogPrimitives.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-fadeIn" />
      <DialogPrimitives.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-popover border border-border shadow-2xl p-6 focus:outline-none data-[state=open]:animate-fadeIn",
          className
        )}
        {...props}
      >
        {(title || description) && (
          <div className="mb-5">
            {title && (
              <DialogPrimitives.Title className="text-lg font-semibold text-foreground">
                {title}
              </DialogPrimitives.Title>
            )}
            {description && (
              <DialogPrimitives.Description className="text-sm text-muted-foreground mt-1">
                {description}
              </DialogPrimitives.Description>
            )}
          </div>
        )}
        {children}
        <DialogPrimitives.Close className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition">
          <X className="w-4 h-4" />
        </DialogPrimitives.Close>
      </DialogPrimitives.Content>
    </DialogPrimitives.Portal>
  );
}
