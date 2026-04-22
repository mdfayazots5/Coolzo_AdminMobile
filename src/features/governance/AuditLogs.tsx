/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { AdminCard } from "@/components/shared/Cards"
import { InlineLoader } from "@/components/shared/Layout"
import { governanceRepository, AuditLog, DataAccessLog } from "@/core/network/governance-repository"
import { 
  Search, 
  Download, 
  User, 
  Clock, 
  Database, 
  ChevronDown, 
  ChevronUp,
  Eye
} from "lucide-react"
import { AdminButton } from "@/components/shared/AdminButton"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function AuditLogs() {
  const [logs, setLogs] = React.useState<AuditLog[]>([])
  const [dataAccessLogs, setDataAccessLogs] = React.useState<DataAccessLog[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [expandedLog, setExpandedLog] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [actionFilter, setActionFilter] = React.useState<string>("all")

  React.useEffect(() => {
    const fetchLogs = async () => {
      try {
        const [auditData, accessData] = await Promise.all([
          governanceRepository.getAuditLogs({}),
          governanceRepository.getDataAccessLogs(),
        ])
        setLogs(auditData);
        setDataAccessLogs(accessData);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLogs();
  }, [])

  const filteredLogs = logs.filter(l => 
    (actionFilter === "all" || l.action === actionFilter) &&
    (
      l.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      l.entityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.entityType.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const filteredDataAccessLogs = dataAccessLogs.filter((log) =>
    log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.entityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.piiField.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.entityType.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) return <InlineLoader className="h-screen" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">System Audit Logs</h1>
          <p className="text-sm text-brand-muted">Append-only record of all administrative actions</p>
        </div>
        <div className="flex gap-2">
          <AdminButton 
            variant="outline" 
            icon={<Download size={18} />}
            onClick={() => {
              toast.success("Preparing CSV Export...");
              setTimeout(() => toast.success("Audit Log CSV ready for download"), 2000);
            }}
          >
            Export for Compliance
          </AdminButton>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input 
            type="text" 
            placeholder="Search by User, Entity ID or Action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-2xl text-sm focus:ring-2 focus:ring-brand-gold outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
            className="rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold"
          >
            <option value="all">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="login">Login</option>
            <option value="export">Export</option>
          </select>
        </div>
      </div>

      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-border bg-brand-navy/[0.02]">
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Timestamp</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">User</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Action</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Entity</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Details</th>
                <th className="p-6 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr 
                    className="group hover:bg-brand-navy/[0.01] transition-colors cursor-pointer"
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-brand-muted" />
                        <span className="text-xs font-bold text-brand-navy">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-brand-muted" />
                        <div>
                          <p className="text-xs font-bold text-brand-navy">{log.userName}</p>
                          <p className="text-[8px] text-brand-muted uppercase tracking-widest">{log.userRole}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <Database size={14} className="text-brand-muted" />
                        <div>
                          <p className="text-xs font-bold text-brand-navy">{log.entityType}</p>
                          <p className="text-[8px] text-brand-muted uppercase tracking-widest">{log.entityId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <p className="text-xs text-brand-navy line-clamp-1">{log.details}</p>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[10px] font-mono text-brand-muted">{log.ipAddress}</span>
                        {expandedLog === log.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </td>
                  </tr>
                  {expandedLog === log.id && log.diff && (
                    <tr className="bg-brand-navy/[0.03]">
                      <td colSpan={6} className="p-8">
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-3">Before Change</p>
                            <pre className="p-4 bg-white rounded-2xl text-[10px] font-mono text-brand-navy overflow-auto max-h-40">
                              {JSON.stringify(log.diff.before, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-3">After Change</p>
                            <pre className="p-4 bg-white rounded-2xl text-[10px] font-mono text-brand-navy overflow-auto max-h-40">
                              {JSON.stringify(log.diff.after, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>

      <AdminCard className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-brand-navy">Sensitive Data Access</h2>
            <p className="text-xs text-brand-muted">Read-only visibility into PII access audit events.</p>
          </div>
          <div className="size-12 rounded-2xl bg-brand-navy/5 flex items-center justify-center text-brand-navy">
            <Eye size={20} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-brand-navy/[0.02] text-left">
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-brand-muted">Timestamp</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-brand-muted">User</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-brand-muted">Entity</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-brand-muted">PII Field</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-brand-muted text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDataAccessLogs.map((log) => (
                <tr key={log.id}>
                  <td className="p-4 text-xs text-brand-navy">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-4">
                    <p className="text-xs font-semibold text-brand-navy">{log.userName}</p>
                    <p className="text-[10px] uppercase tracking-widest text-brand-muted">{log.userRole}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-xs font-semibold text-brand-navy">{log.entityType}</p>
                    <p className="text-[10px] uppercase tracking-widest text-brand-muted">{log.entityId}</p>
                  </td>
                  <td className="p-4 text-xs text-brand-navy">{log.piiField}</td>
                  <td className="p-4 text-right text-[10px] font-mono text-brand-muted">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  )
}

function ActionBadge({ action }: { action: string }) {
  const config: any = {
    create: "bg-status-completed/10 text-status-completed",
    update: "bg-brand-gold/10 text-brand-gold",
    delete: "bg-status-emergency/10 text-status-emergency",
    login: "bg-brand-navy/10 text-brand-navy",
    export: "bg-brand-navy text-white"
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", config[action])}>
      {action}
    </span>
  )
}
