/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AdminButton } from "./AdminButton"
import { AlertTriangle } from "lucide-react"

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "primary" | "destructive"
  isLoading?: boolean
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  isLoading
}: ConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-[16px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {variant === "destructive" && (
              <div className="p-2 bg-destructive/10 rounded-full text-destructive">
                <AlertTriangle size={20} />
              </div>
            )}
            <DialogTitle className="text-xl font-bold text-brand-navy">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-brand-muted leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 flex gap-3 sm:justify-end">
          <AdminButton variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </AdminButton>
          <AdminButton 
            variant={variant === "destructive" ? "destructive" : "primary"} 
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </AdminButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
