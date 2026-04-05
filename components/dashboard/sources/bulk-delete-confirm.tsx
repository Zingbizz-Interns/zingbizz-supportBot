"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BulkDeleteConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: () => void;
}

export function BulkDeleteConfirm({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
}: BulkDeleteConfirmProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-3xl border border-[#E6E2DA] bg-white p-8 max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-2xl font-semibold text-[#2D3A31]">
            Delete sources
          </AlertDialogTitle>
          <AlertDialogDescription className="font-sans text-sm text-[#8C9A84]">
            Permanently remove {selectedCount} source{selectedCount !== 1 ? "s" : ""} and their training data. This action cannot be reversed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 gap-3 sm:gap-2">
          <AlertDialogCancel className="rounded-full">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-full bg-[#C27B66] hover:bg-[#b16c58] text-white"
          >
            Confirm Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
