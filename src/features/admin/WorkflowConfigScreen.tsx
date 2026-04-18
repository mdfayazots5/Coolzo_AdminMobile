/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { SectionHeader } from "@/components/shared/Layout"
import { AdminCard } from "@/components/shared/Cards"
import { ConfigValueWidget } from "@/components/shared/ConfigWidgets"
import { StatusBadge } from "@/components/shared/Badges"
import { ShieldCheck, Clock, Bell, AlertTriangle } from "lucide-react"

export default function WorkflowConfigScreen() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Workflow & SLA</h1>
        <p className="text-sm text-brand-muted">Configure job statuses, escalation rules, and SLA targets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SLA Targets */}
        <div className="space-y-6">
          <SectionHeader title="SLA Targets" icon={<ShieldCheck size={18} />} />
          <div className="grid grid-cols-1 gap-4">
            <ConfigValueWidget 
              label="Emergency Response Time" 
              value="2 Hours" 
              onEdit={() => {}}
              prefix={<Clock size={18} className="text-status-emergency" />}
            />
            <ConfigValueWidget 
              label="Urgent Response Time" 
              value="6 Hours" 
              onEdit={() => {}}
              prefix={<Clock size={18} className="text-status-urgent" />}
            />
            <ConfigValueWidget 
              label="Standard Response Time" 
              value="24 Hours" 
              onEdit={() => {}}
              prefix={<Clock size={18} className="text-status-completed" />}
            />
          </div>

          <SectionHeader title="Auto-Escalation Rules" icon={<Bell size={18} />} />
          <AdminCard className="p-6 space-y-4">
            <div className="flex items-start gap-4 p-4 bg-status-emergency/5 rounded-xl border border-status-emergency/10">
              <AlertTriangle size={20} className="text-status-emergency shrink-0" />
              <div>
                <p className="text-sm font-bold text-brand-navy">Critical Escalation</p>
                <p className="text-xs text-brand-muted leading-relaxed">
                  If an Emergency SR is unassigned for more than <span className="font-bold text-brand-navy">30 minutes</span>, notify Operations Manager and Super Admin immediately.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-status-urgent/5 rounded-xl border border-status-urgent/10">
              <Bell size={20} className="text-status-urgent shrink-0" />
              <div>
                <p className="text-sm font-bold text-brand-navy">Standard Escalation</p>
                <p className="text-xs text-brand-muted leading-relaxed">
                  If a Standard SR is past its SLA for more than <span className="font-bold text-brand-navy">4 hours</span>, auto-assign to the Branch Manager for review.
                </p>
              </div>
            </div>
          </AdminCard>
        </div>

        {/* Job Statuses */}
        <div className="space-y-6">
          <SectionHeader title="Job Status Workflow" icon={<History size={18} />} />
          <AdminCard className="p-6">
            <div className="space-y-6">
              {[
                { status: 'pending', label: 'Pending Assignment', color: 'urgent', next: ['assigned', 'cancelled'] },
                { status: 'assigned', label: 'Technician Assigned', color: 'processing', next: ['on-site', 're-assigned'] },
                { status: 'on-site', label: 'Work In Progress', color: 'processing', next: ['completed', 'on-hold'] },
                { status: 'completed', label: 'Service Completed', color: 'completed', next: ['closed'] },
                { status: 'closed', label: 'Closed & Billed', color: 'closed', next: [] },
              ].map((item, i) => (
                <div key={item.status} className="relative">
                  <div className="flex items-center gap-4">
                    <div className="size-10 bg-brand-navy/5 rounded-full flex items-center justify-center text-brand-navy font-bold text-xs border border-brand-navy/10">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-brand-navy">{item.label}</p>
                        <StatusBadge status={item.color as any}>{item.status}</StatusBadge>
                      </div>
                      <p className="text-[10px] text-brand-muted uppercase tracking-widest">
                        Next: {item.next.join(', ') || 'None'}
                      </p>
                    </div>
                  </div>
                  {i < 4 && (
                    <div className="absolute left-5 top-10 w-px h-6 bg-border" />
                  )}
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}

import { History } from "lucide-react"
