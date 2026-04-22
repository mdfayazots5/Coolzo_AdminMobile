/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import { UserRole, useAuthStore } from "@/store/auth-store"
import { NavigationConfig, NavItem } from "@/core/config/navigation-config"
import { useRBAC } from "@/core/auth/RBACProvider"
import { authRepository } from "@/core/network/auth-repository"
import { roleRepository, Role } from "@/core/network/role-repository"
import { useSystemUX } from "@/core/system/SystemUXProvider"
import { useLocation, useNavigate, Link } from "react-router-dom"
import { 
  Bell, 
  Search, 
  Menu, 
  WifiOff, 
  LogOut, 
  User, 
  Settings, 
  ChevronRight,
  X,
  Eye,
  ShieldAlert
} from "lucide-react"
import { AdminBottomSheet } from "@/components/shared/Pickers"
import { AdminButton } from "@/components/shared/AdminButton"
import { RoleBadge } from "@/components/shared/Badges"

export function AdminScaffold({ children }: { children: React.ReactNode }) {
  const { user, refreshToken, logout } = useAuthStore()
  const { canView, effectiveRole, isViewingAsRole, viewAsRole, startViewAsRole, exitViewAsRole } = useRBAC()
  const { isOnline, pendingSyncCount } = useSystemUX()
  const location = useLocation()
  const navigate = useNavigate()
  const [isProfileOpen, setIsProfileOpen] = React.useState(false)
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [roles, setRoles] = React.useState<Role[]>([])
  const [selectedRoleId, setSelectedRoleId] = React.useState("")
  const [isLoadingRoles, setIsLoadingRoles] = React.useState(false)
  const [viewAsError, setViewAsError] = React.useState("")
  const [isStartingViewAs, setIsStartingViewAs] = React.useState(false)

  React.useEffect(() => {
    if (!isProfileOpen || user?.role !== UserRole.SUPER_ADMIN || roles.length > 0 || isLoadingRoles) {
      return
    }

    setIsLoadingRoles(true)
    roleRepository.getRoles()
      .then((data) => {
        const availableRoles = data.filter((role) => role.name !== "Super Administrator" && role.name !== "Super Admin")
        setRoles(availableRoles)
        setSelectedRoleId((current) => current || availableRoles[0]?.id || "")
      })
      .catch((error) => {
        console.error("Unable to load roles for view-as-role", error)
        setViewAsError("Unable to load roles right now")
      })
      .finally(() => setIsLoadingRoles(false))
  }, [isLoadingRoles, isProfileOpen, roles.length, user?.role])

  if (!user) return <>{children}</>

  const activeRole = effectiveRole || user.role
  const navItems = (NavigationConfig[activeRole] || []).filter((item) => canView(item.module))

  const handleStartViewAsRole = async () => {
    if (!selectedRoleId) return

    setIsStartingViewAs(true)
    setViewAsError("")

    try {
      await startViewAsRole(selectedRoleId)
      setIsProfileOpen(false)
    } catch (error) {
      console.error("View-as-role failed", error)
      setViewAsError("Unable to start view-as-role mode")
    } finally {
      setIsStartingViewAs(false)
    }
  }

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await authRepository.logout(refreshToken)
      }
    } catch (error) {
      console.error("Remote logout failed", error)
    } finally {
      logout()
    }
  }

  return (
    <div className="min-h-screen bg-brand-white flex flex-col pb-20 md:pb-0 md:pl-20 lg:pl-64">
      {/* Connectivity Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-status-urgent text-white text-[10px] font-bold uppercase tracking-widest py-1.5 flex items-center justify-center gap-2 sticky top-0 z-[60]"
          >
            <WifiOff size={12} />
            Offline Mode — Viewing Cached Data
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isViewingAsRole && viewAsRole && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#f97316] text-white text-[10px] font-bold uppercase tracking-widest py-2 flex items-center justify-center gap-3 sticky top-0 z-[60]"
          >
            <ShieldAlert size={14} />
            Viewing as {viewAsRole.displayName}
            <button
              onClick={() => void exitViewAsRole()}
              className="rounded-full bg-white/20 px-3 py-1 hover:bg-white/30 transition-colors"
            >
              Exit View
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* App Bar */}
      <header className="h-16 bg-brand-surface border-b border-border flex items-center justify-between px-4 md:px-8 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          {navItems.length > 5 && (
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 hover:bg-brand-navy/5 rounded-xl transition-colors"
            >
              <Menu size={24} className="text-brand-navy" />
            </button>
          )}
          <div className="hidden md:flex items-center gap-2">
            <div className="size-8 bg-brand-navy rounded-lg flex items-center justify-center text-brand-gold font-bold text-lg">C</div>
            <span className="font-bold text-brand-navy tracking-tight">COOLZO</span>
          </div>
          <div className="h-6 w-px bg-border mx-2 hidden md:block" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Branch</span>
            <span className="text-xs font-bold text-brand-navy">
              Hyderabad Central {pendingSyncCount > 0 ? `• ${pendingSyncCount} pending sync` : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="p-2 hover:bg-brand-navy/5 rounded-full text-brand-navy transition-colors"
          >
            <Search size={20} />
          </button>
          <button 
            onClick={() => navigate(pendingSyncCount > 0 ? '/system/sync' : '/settings/master/notifications')}
            className="p-2 hover:bg-brand-navy/5 rounded-full text-brand-navy transition-colors relative"
          >
            <Bell size={20} />
            {pendingSyncCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-status-emergency rounded-full border-2 border-brand-surface text-[8px] leading-[12px] text-white font-bold flex items-center justify-center">
                {pendingSyncCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setIsProfileOpen(true)}
            className="size-9 bg-brand-navy/5 rounded-full flex items-center justify-center text-brand-navy font-bold text-sm border border-brand-navy/10 hover:border-brand-gold transition-all"
          >
            {user.name.split(' ').map(n => n[0]).join('')}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-surface border-t border-border h-16 px-2 flex items-center justify-around z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        {navItems.slice(0, 5).map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link 
              key={item.id} 
              to={item.path}
              className={cn(
                "flex items-center justify-center transition-all",
                isActive ? "text-brand-gold" : "text-brand-muted"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-all",
                isActive ? "bg-brand-navy text-brand-gold shadow-md shadow-brand-navy/20" : "hover:bg-brand-navy/5"
              )}>
                {item.icon}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Side Navigation (Desktop) */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-20 lg:w-64 bg-brand-navy z-50 transition-all">
        <SidebarContent navItems={navItems} logout={handleLogout} location={location} />
      </nav>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-[60] md:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-brand-navy z-[70] md:hidden flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="size-8 bg-brand-gold rounded-lg flex items-center justify-center text-brand-navy font-bold text-xl">C</div>
                  <span className="font-bold text-white tracking-widest">COOLZO</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-white/60 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-4">
                <SidebarContent 
                  navItems={navItems} 
                  logout={handleLogout} 
                  location={location} 
                  onItemClick={() => setIsMobileMenuOpen(false)}
                  isMobile
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Profile Quick Panel */}
      <AdminBottomSheet 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)}
        title="Account Profile"
        className="bg-brand-navy text-white"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl">
            <div className="size-16 bg-brand-gold rounded-2xl flex items-center justify-center text-brand-navy text-2xl font-bold shadow-lg">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{user.name}</h3>
              <p className="text-sm text-white/60 mb-1">{user.email}</p>
              <RoleBadge role={user.role} />
            </div>
          </div>

          {user.role === UserRole.SUPER_ADMIN && (
            <div className="space-y-3 rounded-2xl border border-orange-300/30 bg-orange-400/10 p-4">
              <div className="flex items-center gap-2 text-orange-200">
                <Eye size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">View As Role</span>
              </div>
              <p className="text-xs text-white/60">
                Starts a scoped UI permission session for navigation and route guards. Exit restores Super Admin access.
              </p>
              <div className="flex gap-2">
                <select
                  value={selectedRoleId}
                  onChange={(event) => setSelectedRoleId(event.target.value)}
                  disabled={isLoadingRoles || isStartingViewAs}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white outline-none"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id} className="text-brand-navy">
                      {role.name}
                    </option>
                  ))}
                </select>
                <AdminButton
                  type="button"
                  size="sm"
                  onClick={handleStartViewAsRole}
                  isLoading={isStartingViewAs}
                  disabled={!selectedRoleId || isLoadingRoles}
                  className="bg-orange-300 text-brand-navy hover:bg-orange-200"
                >
                  Start
                </AdminButton>
              </div>
              {isViewingAsRole && (
                <AdminButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => void exitViewAsRole()}
                  className="border-orange-300/40 text-orange-100 hover:bg-orange-300/10"
                >
                  Exit View-As Mode
                </AdminButton>
              )}
              {viewAsError && <p className="text-[11px] font-medium text-orange-100">{viewAsError}</p>}
            </div>
          )}

          <div className="space-y-2">
            <button 
              onClick={() => {
                navigate('/profile')
                setIsProfileOpen(false)
              }}
              className="flex items-center justify-between w-full p-4 hover:bg-white/5 rounded-xl transition-all group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg text-brand-gold"><User size={18} /></div>
                <span className="text-sm font-bold text-white">Personal Details</span>
              </div>
              <ChevronRight size={16} className="text-white/40 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => {
                navigate('/settings/master/notifications')
                setIsProfileOpen(false)
              }}
              className="flex items-center justify-between w-full p-4 hover:bg-white/5 rounded-xl transition-all group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg text-brand-gold"><Settings size={18} /></div>
                <span className="text-sm font-bold text-white">Notification Preferences</span>
              </div>
              <ChevronRight size={16} className="text-white/40 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <AdminButton 
            variant="outline"
            fullWidth 
            onClick={async () => {
              await handleLogout()
              setIsProfileOpen(false)
            }}
            className="border-white/20 text-white hover:bg-status-emergency hover:border-status-emergency transition-all"
            iconLeft={<LogOut size={18} />}
          >
            Sign Out Securely
          </AdminButton>
        </div>
      </AdminBottomSheet>

      {/* Global Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-navy/95 backdrop-blur-md z-[100] p-6 flex flex-col items-center"
          >
            <button 
              onClick={() => setIsSearchOpen(false)}
              className="absolute top-6 right-6 p-2 text-white/60 hover:text-white transition-colors"
            >
              <X size={32} />
            </button>

            <div className="w-full max-w-2xl mt-20 space-y-8">
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-gold size-8" />
                <input 
                  autoFocus
                  placeholder="Search SR#, Customer, Technician..."
                  className="w-full bg-white/10 border-b-2 border-brand-gold/30 focus:border-brand-gold py-6 pl-20 pr-8 text-2xl text-white placeholder:text-white/20 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-brand-gold uppercase tracking-[0.2em]">Recent Searches</h4>
                  <div className="space-y-2">
                    {['SR-99281', 'Rajesh Kumar', 'AC Leakage Mumbai'].map((term) => (
                      <button key={term} className="flex items-center gap-3 text-white/60 hover:text-white transition-colors w-full text-left">
                        <Search size={14} />
                        <span className="text-sm font-medium">{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-brand-gold uppercase tracking-[0.2em]">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="p-4 bg-white/5 rounded-xl text-white text-xs font-bold hover:bg-white/10 transition-all text-center">New Request</button>
                    <button className="p-4 bg-white/5 rounded-xl text-white text-xs font-bold hover:bg-white/10 transition-all text-center">Add Customer</button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SidebarContent({ navItems, logout, location, onItemClick, isMobile }: any) {
  return (
    <>
      {!isMobile && (
        <div className="h-16 flex items-center px-6 mb-8">
          <div className="size-8 bg-brand-gold rounded-lg flex items-center justify-center text-brand-navy font-bold text-xl">C</div>
          <span className="ml-3 font-bold text-white tracking-widest hidden lg:block">COOLZO ADMIN</span>
        </div>
      )}

      <div className="flex-1 px-3 space-y-2">
        {navItems.map((item: any) => {
          const isActive = location.pathname === item.path
          return (
            <Link 
              key={item.id} 
              to={item.path}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-4 px-3 py-3 rounded-xl transition-all group",
                isActive 
                  ? "bg-brand-gold text-brand-navy shadow-lg shadow-brand-gold/20" 
                  : "text-brand-muted hover:bg-white/5 hover:text-white"
              )}
            >
              <div className={cn(
                "transition-transform group-hover:scale-110",
                isActive ? "text-brand-navy" : "text-brand-muted"
              )}>
                {item.icon}
              </div>
              <span className={cn(
                "text-sm font-bold uppercase tracking-widest",
                !isMobile && "hidden lg:block"
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>

      <div className="p-4 border-t border-white/5">
        <button 
          onClick={() => logout()}
          className="flex items-center gap-4 w-full px-3 py-3 rounded-xl text-brand-muted hover:bg-status-emergency/10 hover:text-status-emergency transition-all group"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className={cn(
            "text-sm font-bold uppercase tracking-widest",
            !isMobile && "hidden lg:block"
          )}>
            Log Out
          </span>
        </button>
      </div>
    </>
  )
}
