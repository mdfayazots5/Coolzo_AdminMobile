/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { cn } from "@/lib/utils"
import { PermissionAction, PermissionSet } from "@/core/auth/rbac-engine"
import { Check, X } from "lucide-react"

interface PermissionMatrixWidgetProps {
  permissions: PermissionSet;
  onChange?: (permissions: PermissionSet) => void;
  isReadOnly?: boolean;
}

const MODULES = [
  'dashboard',
  'service-requests',
  'scheduling',
  'jobs',
  'inventory',
  'billing',
  'finance',
  'team',
  'customers',
  'marketing',
  'reports',
  'settings'
];

const ACTIONS: PermissionAction[] = ['view', 'create', 'edit', 'delete', 'approve', 'export'];

export function PermissionMatrixWidget({ permissions, onChange, isReadOnly = false }: PermissionMatrixWidgetProps) {
  const togglePermission = (module: string, action: PermissionAction) => {
    if (isReadOnly || !onChange) return;

    const currentModulePerms = permissions[module] || [];
    let newModulePerms: PermissionAction[];

    if (currentModulePerms.includes(action)) {
      newModulePerms = currentModulePerms.filter(a => a !== action);
    } else {
      newModulePerms = [...currentModulePerms, action];
    }

    onChange({
      ...permissions,
      [module]: newModulePerms
    });
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-brand-navy/5">
            <th className="p-4 text-[11px] font-bold uppercase tracking-widest text-brand-navy border-b border-border">Module</th>
            {ACTIONS.map(action => (
              <th key={action} className="p-4 text-[11px] font-bold uppercase tracking-widest text-brand-navy text-center border-b border-border">
                {action}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MODULES.map(module => (
            <tr key={module} className="hover:bg-brand-navy/[0.02] transition-colors">
              <td className="p-4 text-sm font-bold text-brand-navy border-b border-border capitalize">
                {module.replace('-', ' ')}
              </td>
              {ACTIONS.map(action => {
                const hasPermission = permissions[module]?.includes(action);
                return (
                  <td 
                    key={action} 
                    className="p-4 border-b border-border text-center"
                  >
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => togglePermission(module, action)}
                      className={cn(
                        "size-8 rounded-lg flex items-center justify-center mx-auto transition-all",
                        hasPermission 
                          ? "bg-status-completed/10 text-status-completed" 
                          : "bg-brand-navy/5 text-brand-muted/30 hover:bg-brand-navy/10",
                        isReadOnly && "cursor-default"
                      )}
                    >
                      {hasPermission ? <Check size={16} /> : <X size={14} />}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
