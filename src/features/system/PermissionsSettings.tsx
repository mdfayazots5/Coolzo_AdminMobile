/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { motion } from "motion/react"
import { AdminCard } from "@/components/shared/Cards"
import { SectionHeader, InlineLoader } from "@/components/shared/Layout"
import { systemRepository, DevicePermission } from "@/core/network/system-repository"
import { 
  Shield, 
  MapPin, 
  Camera, 
  Bell, 
  Database, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  ChevronRight
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function PermissionsSettings() {
  const [permissions, setPermissions] = React.useState<DevicePermission[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const data = await systemRepository.getPermissions();
        setPermissions(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPermissions();
  }, [])

  const handleToggle = (id: string) => {
    toast.info("Opening system settings...");
    // In a real app, this would use a native bridge or browser API
  }

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">App Permissions</h1>
        <p className="text-sm text-brand-muted">Manage device access and privacy settings</p>
      </div>

      <AdminCard className="p-8">
        <div className="flex items-center gap-4 mb-8 p-6 bg-brand-navy/5 rounded-[32px]">
          <div className="size-12 bg-brand-navy text-brand-gold rounded-2xl flex items-center justify-center">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-brand-navy">Privacy & Security</h2>
            <p className="text-xs text-brand-muted">Coolzo requires certain permissions to function correctly for your role. We only access data when necessary.</p>
          </div>
        </div>

        <div className="space-y-4">
          {permissions.map((perm) => (
            <div 
              key={perm.id}
              className="flex items-center justify-between p-6 bg-white border border-border rounded-[32px] hover:border-brand-gold transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "size-12 rounded-2xl flex items-center justify-center shrink-0",
                  perm.status === 'granted' ? "bg-status-completed/10 text-status-completed" : "bg-brand-muted/10 text-brand-muted"
                )}>
                  <PermissionIcon id={perm.id} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-brand-navy">{perm.name}</h3>
                    {perm.isRequired && (
                      <span className="px-2 py-0.5 bg-status-emergency/10 text-status-emergency text-[8px] font-bold uppercase rounded-full">Required</span>
                    )}
                  </div>
                  <p className="text-xs text-brand-muted max-w-md">{perm.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest block mb-1",
                    perm.status === 'granted' ? "text-status-completed" : "text-status-emergency"
                  )}>
                    {perm.status === 'granted' ? 'Granted' : 'Denied'}
                  </span>
                  <button 
                    onClick={() => handleToggle(perm.id)}
                    className="text-xs font-bold text-brand-gold hover:underline flex items-center gap-1"
                  >
                    Change <ExternalLink size={12} />
                  </button>
                </div>
                <ChevronRight size={20} className="text-brand-muted group-hover:text-brand-gold transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard className="p-8 bg-brand-navy text-white">
        <div className="flex items-center gap-6">
          <div className="size-16 bg-white/10 rounded-[24px] flex items-center justify-center text-brand-gold">
            <AlertCircle size={32} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">Having trouble?</h2>
            <p className="text-sm text-white/60">If permissions are granted but features aren't working, try restarting the app or clearing cache.</p>
          </div>
          <AdminButton 
            className="bg-brand-gold text-brand-navy hover:bg-white"
            onClick={() => alert("Troubleshooting Guide:\n1. Check if System Settings > Coolzo has permissions enabled.\n2. Ensure your device clock is synchronized.\n3. Try logging out and back in to refresh the security token.")}
          >
            Troubleshoot
          </AdminButton>
        </div>
      </AdminCard>
    </div>
  )
}

function PermissionIcon({ id }: { id: string }) {
  switch (id) {
    case 'loc': return <MapPin size={24} />;
    case 'cam': return <Camera size={24} />;
    case 'notif': return <Bell size={24} />;
    case 'storage': return <Database size={24} />;
    default: return <Shield size={24} />;
  }
}
