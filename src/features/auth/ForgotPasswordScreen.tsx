/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminButton } from "@/components/shared/AdminButton"
import { AdminTextField } from "@/components/shared/AdminTextField"
import { AdminCard } from "@/components/shared/Cards"
import { authRepository } from "@/core/network/auth-repository"
import { toast } from "sonner"
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function ForgotPasswordScreen() {
  const [email, setEmail] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSubmitted, setIsSubmitted] = React.useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await authRepository.forgotPassword(email)
      setIsSubmitted(true)
      toast.success("Reset link sent successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset link")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-gold/5 rounded-full blur-[120px]" />
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md z-10"
      >
        <button 
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 text-brand-muted hover:text-brand-gold transition-colors mb-8 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-wider">Back to Login</span>
        </button>

        <AdminCard className="p-8 border-brand-navy/20 bg-brand-surface/95 backdrop-blur-sm">
          {isSubmitted ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-status-completed/10 rounded-full flex items-center justify-center mx-auto mb-6 text-status-completed">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-xl font-bold text-brand-navy mb-2">Check Your Email</h2>
              <p className="text-sm text-brand-muted mb-8 leading-relaxed">
                We've sent a password reset link to <span className="font-bold text-brand-navy">{email}</span>. Please check your inbox and follow the instructions.
              </p>
              <AdminButton
                fullWidth
                variant="secondary"
                onClick={() => navigate("/login")}
                className="h-12 text-sm font-bold uppercase tracking-[0.1em]"
              >
                Return to Login
              </AdminButton>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-brand-navy mb-2">Forgot Password?</h2>
              <p className="text-sm text-brand-muted mb-8">
                Enter your registered email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <AdminTextField
                  label="Email Address"
                  placeholder="name@coolzo.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  prefixIcon={<Mail size={18} />}
                  required
                />

                <AdminButton
                  type="submit"
                  fullWidth
                  isLoading={isLoading}
                  disabled={!email}
                  className="h-12 text-sm font-bold uppercase tracking-[0.1em]"
                >
                  Send Reset Link
                </AdminButton>
              </form>
            </>
          )}
        </AdminCard>
      </motion.div>
    </div>
  )
}
