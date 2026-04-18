/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { AdminButton } from "@/components/shared/AdminButton"
import { AdminTextField } from "@/components/shared/AdminTextField"
import { AdminCard } from "@/components/shared/Cards"
import { authRepository } from "@/core/network/auth-repository"
import { toast } from "sonner"
import { Lock, ArrowLeft, CheckCircle2 } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"

export default function ResetPasswordScreen() {
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = searchParams.get("token")

  React.useEffect(() => {
    if (!token) {
      toast.error("Invalid or missing reset token")
      navigate("/login")
    }
  }, [token, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setIsLoading(true)
    try {
      await authRepository.resetPassword(token!, password)
      setIsSuccess(true)
      toast.success("Password reset successfully")
      setTimeout(() => navigate("/login"), 3000)
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password")
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrength = () => {
    if (password.length === 0) return 0
    if (password.length < 6) return 1
    if (password.length < 10) return 2
    return 3
  }

  const strengthLabels = ["Empty", "Weak", "Fair", "Strong"]
  const strengthColors = ["bg-border", "bg-status-urgent", "bg-brand-gold", "bg-status-completed"]

  return (
    <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-gold/5 rounded-full blur-[120px]" />
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md z-10"
      >
        <AdminCard className="p-8 border-brand-navy/20 bg-brand-surface/95 backdrop-blur-sm">
          {isSuccess ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-status-completed/10 rounded-full flex items-center justify-center mx-auto mb-6 text-status-completed">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-xl font-bold text-brand-navy mb-2">Password Reset!</h2>
              <p className="text-sm text-brand-muted mb-8">
                Your password has been successfully updated. Redirecting you to login...
              </p>
              <div className="w-full h-1 bg-brand-navy/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3 }}
                  className="h-full bg-status-completed"
                />
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-brand-navy mb-2">Reset Password</h2>
              <p className="text-sm text-brand-muted mb-8">
                Create a new secure password for your Coolzo Admin account.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <AdminTextField
                    label="New Password"
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    prefixIcon={<Lock size={18} />}
                    isPassword
                    required
                  />
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3].map((s) => (
                      <div 
                        key={s} 
                        className={cn(
                          "flex-1 rounded-full transition-colors",
                          s <= getPasswordStrength() ? strengthColors[getPasswordStrength()] : "bg-brand-navy/5"
                        )} 
                      />
                    ))}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                    Strength: <span className={cn(
                      getPasswordStrength() === 1 && "text-status-urgent",
                      getPasswordStrength() === 2 && "text-brand-gold",
                      getPasswordStrength() === 3 && "text-status-completed"
                    )}>{strengthLabels[getPasswordStrength()]}</span>
                  </p>
                </div>

                <AdminTextField
                  label="Confirm New Password"
                  placeholder="••••••••"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  prefixIcon={<Lock size={18} />}
                  isPassword
                  required
                />

                <AdminButton
                  type="submit"
                  fullWidth
                  isLoading={isLoading}
                  disabled={!password || password !== confirmPassword}
                  className="h-12 text-sm font-bold uppercase tracking-[0.1em]"
                >
                  Reset Password
                </AdminButton>
              </form>
            </>
          )}
        </AdminCard>
      </motion.div>
    </div>
  )
}
