/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { User } from "@/core/network/user-repository"
import { AdminCard } from "./Cards"
import { RoleBadge, StatusBadge } from "./Badges"
import { Mail, AtSign, Clock3, ChevronRight } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface UserCardProps {
  key?: React.Key;
  user: User;
  onClick?: () => void;
  className?: string;
}

export function UserCard({ user, onClick, className }: UserCardProps) {
  return (
    <AdminCard 
      onClick={onClick}
      className={cn(
        "p-4 hover:border-brand-gold transition-all cursor-pointer group",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="size-12 bg-brand-navy/5 rounded-xl flex items-center justify-center text-brand-navy font-bold text-lg border border-brand-navy/10 group-hover:bg-brand-navy group-hover:text-brand-gold transition-colors">
          {user.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-bold text-brand-navy truncate">{user.name}</h3>
            <StatusBadge status={user.status === 'active' ? 'completed' : 'closed'}>
              {user.status}
            </StatusBadge>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            <RoleBadge role={user.role} label={user.roleLabel} />
            {user.roles.length > 1 && (
              <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider bg-brand-navy/5 px-1.5 py-0.5 rounded">
                +{user.roles.length - 1} more
              </span>
            )}
            {user.mustChangePassword && (
              <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider bg-brand-navy/5 px-1.5 py-0.5 rounded">
                Password reset required
              </span>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-brand-muted">
              <Mail size={12} />
              <span className="text-xs truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-brand-muted">
              <AtSign size={12} />
              <span className="text-xs truncate">{user.userName}</span>
            </div>
            <div className="flex items-center gap-2 text-brand-muted">
              <Clock3 size={12} />
              <span className="text-xs">
                {user.lastLogin ? `Last login ${formatDate(user.lastLogin)}` : `Joined ${formatDate(user.createdAt)}`}
              </span>
            </div>
          </div>
        </div>
        <div className="self-center text-brand-muted group-hover:text-brand-gold transition-colors">
          <ChevronRight size={20} />
        </div>
      </div>
    </AdminCard>
  )
}
