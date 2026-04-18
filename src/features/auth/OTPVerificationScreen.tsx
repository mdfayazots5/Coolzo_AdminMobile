/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminButton } from "@/components/shared/AdminButton"
import { AdminCard } from "@/components/shared/Cards"
import { useAuthStore } from "@/store/auth-store"
import { authRepository } from "@/core/network/auth-repository"
import { toast } from "sonner"
import { ShieldCheck, ArrowLeft, RefreshCw } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function OTPVerificationScreen() {
  const [otp, setOtp] = React.useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = React.useState(false)
  const [countdown, setCountdown] = React.useState(30)
  const inputs = React.useRef<(HTMLInputElement | null)[]>([])

  const { user, token, login } = useAuthStore()
  const navigate = useNavigate()

  React.useEffect(() => {
    if (!user || !token) {
      navigate("/login")
    }
  }, [user, token, navigate])

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1]
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      inputs.current[index + 1]?.focus()
    }

    if (newOtp.every(digit => digit !== "") && index === 5) {
      handleVerify(newOtp.join(""))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async (code: string) => {
    setIsLoading(true)
    try {
      const response = await authRepository.verifyOTP(user?.email || '', code)
      login(response.user, response.token, response.refreshToken)
      toast.success("Identity verified successfully")
      navigate("/dashboard")
    } catch (error: any) {
      toast.error("Invalid verification code")
      setOtp(["", "", "", "", "", ""])
      inputs.current[0]?.focus()
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

        <AdminCard className="p-8 border-brand-navy/20 bg-brand-surface/95 backdrop-blur-sm text-center">
          <div className="w-16 h-16 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-gold">
            <ShieldCheck size={32} />
          </div>
          
          <h2 className="text-xl font-bold text-brand-navy mb-2">Two-Step Verification</h2>
          <p className="text-sm text-brand-muted mb-8">
            A 6-digit verification code has been sent to your registered device. Please enter it below.
          </p>

          <div className="flex justify-between gap-2 mb-8">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputs.current[index] = el}
                type="text"
                inputMode="numeric"
                value={digit}
                onChange={e => handleChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                className="w-12 h-14 bg-brand-navy/5 border border-brand-navy/10 rounded-lg text-center text-xl font-bold text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition-all"
              />
            ))}
          </div>

          <div className="space-y-6">
            <AdminButton
              fullWidth
              isLoading={isLoading}
              disabled={otp.some(digit => !digit)}
              onClick={() => handleVerify(otp.join(""))}
              className="h-12 text-sm font-bold uppercase tracking-[0.1em]"
            >
              Verify Identity
            </AdminButton>

            <div className="flex flex-col items-center gap-2">
              {countdown > 0 ? (
                <p className="text-xs text-brand-muted">
                  Resend code in <span className="font-bold text-brand-navy">{countdown}s</span>
                </p>
              ) : (
                <button 
                  onClick={() => setCountdown(30)}
                  className="flex items-center gap-2 text-xs font-bold text-brand-gold uppercase tracking-wider hover:underline"
                >
                  <RefreshCw size={14} />
                  Resend Verification Code
                </button>
              )}
            </div>
          </div>
        </AdminCard>
      </motion.div>
    </div>
  )
}
