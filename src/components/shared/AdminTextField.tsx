/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { Eye, EyeOff } from "lucide-react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  prefixIcon?: React.ReactNode
  suffixIcon?: React.ReactNode
  isPassword?: boolean
  readOnly?: boolean
}

const AdminTextField = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, prefixIcon, suffixIcon, isPassword, readOnly, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const isTypePassword = type === "password" || isPassword

    const togglePassword = () => setShowPassword(!showPassword)

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
            {label}
          </label>
        ) }
        <div className="relative group">
          {prefixIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted group-focus-within:text-brand-navy transition-colors">
              {prefixIcon}
            </div>
          )}
          <input
            type={showPassword ? "text" : type}
            aria-label={props["aria-label"] || label}
            className={cn(
              "flex h-10 w-full rounded-[8px] border border-input bg-brand-surface px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-navy focus-visible:border-brand-navy disabled:cursor-not-allowed disabled:opacity-50 transition-all",
              prefixIcon && "pl-10",
              (suffixIcon || isTypePassword) && "pr-10",
              error && "border-destructive focus-visible:ring-destructive focus-visible:border-destructive",
              readOnly && "bg-brand-white border-transparent cursor-default focus-visible:ring-0",
              className
            )}
            ref={ref}
            readOnly={readOnly}
            {...props}
          />
          {isTypePassword ? (
            <button
              type="button"
              onClick={togglePassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-navy transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          ) : suffixIcon ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted">
              {suffixIcon}
            </div>
          ) : null}
        </div>
        {error ? (
          <p className="text-[11px] font-medium text-destructive">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-brand-muted">{helperText}</p>
        ) : null}
      </div>
    )
  }
)
AdminTextField.displayName = "AdminTextField"

export { AdminTextField }
