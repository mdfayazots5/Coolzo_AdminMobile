/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminButton } from "@/components/shared/AdminButton"
import { AdminTextField } from "@/components/shared/AdminTextField"
import { AdminCard } from "@/components/shared/Cards"
import { useAuthStore } from "@/store/auth-store"
import { authRepository } from "@/core/network/auth-repository"
import { resolveDefaultRoute } from "@/core/auth/auth-session"
import { toast } from "sonner"
import { Mail, Lock, ArrowRight } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function LoginScreen() {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [rememberMe, setRememberMe] = React.useState(false)

  const { login, setRequires2FA, setAuthenticating, setUnauthenticated } = useAuthStore()
  const navigate = useNavigate()

  React.useEffect(() => {
    const savedEmail = localStorage.getItem("remembered_email")
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setAuthenticating()

    try {
      const response = await authRepository.login(email, password)

      if (response.requires2FA) {
        setRequires2FA(response.user, response.token || "__pending_2fa__")
        navigate("/verify-otp")
      } else {
        if (rememberMe) {
          localStorage.setItem("remembered_email", email)
        } else {
          localStorage.removeItem("remembered_email")
        }
        login(response.user, response.token, response.refreshToken)
        toast.success(`Welcome back, ${response.user.name}!`)
        navigate(resolveDefaultRoute(response.user.role))
      }
    } catch (error: any) {
      setUnauthenticated()
      toast.error(error.message || "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = email.length > 0 && password.length > 0

  return (
    <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-gold/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-gold/5 rounded-full blur-[120px]" />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-[440px] z-10 flex flex-col"
      >
        <div className="flex flex-col items-center mb-10 text-center w-full">
          <div className="w-16 h-16 bg-brand-gold rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-brand-gold/20">
            <span className="text-brand-navy text-3xl font-bold tracking-tighter">C</span>
          </div>
          <h1 className="text-brand-gold text-2xl font-bold tracking-[0.2em] uppercase">Coolzo</h1>
          <p className="text-brand-muted text-xs mt-1 tracking-widest uppercase">Admin Portal</p>
        </div>

        <AdminCard className="w-full p-6 sm:p-8 border-brand-navy/20 bg-brand-surface/95 backdrop-blur-sm shadow-2xl flex flex-col">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4 w-full">
              <AdminTextField
                label="Email Address"
                placeholder="name@coolzo.com or username"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                prefixIcon={<Mail size={18} />}
              />
              <AdminTextField
                label="Password"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                prefixIcon={<Lock size={18} />}
                isPassword
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-4 rounded border-brand-navy/20 text-brand-gold focus:ring-brand-gold"
                />
                <span className="text-xs text-brand-muted group-hover:text-brand-navy transition-colors">Remember Me</span>
              </label>
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-xs font-bold text-brand-gold uppercase tracking-wider hover:underline"
              >
                Forgot Credentials?
              </button>
            </div>

            <AdminButton
              type="submit"
              fullWidth
              isLoading={isLoading}
              disabled={!isFormValid}
              iconRight={<ArrowRight size={18} />}
              className="h-12 text-sm font-bold uppercase tracking-[0.1em]"
            >
              Secure Login
            </AdminButton>
          </form>
        </AdminCard>

        <p className="text-center mt-8 text-brand-muted/60 text-[10px] uppercase tracking-[0.2em]">
          Protected by Coolzo Enterprise Security
        </p>
      </motion.div>
    </div>
  )
}
