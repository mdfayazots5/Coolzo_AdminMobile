/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { useAuthStore } from "@/store/auth-store"
import { RBACEngine, PermissionAction } from "./rbac-engine"

interface RBACContextType {
  engine: RBACEngine;
  can: (module: string, action: PermissionAction) => boolean;
  canView: (module: string) => boolean;
  canCreate: (module: string) => boolean;
  canEdit: (module: string) => boolean;
  canDelete: (module: string) => boolean;
  canApprove: (module: string) => boolean;
  canExport: (module: string) => boolean;
}

const RBACContext = React.createContext<RBACContextType | null>(null);

export function RBACProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  
  const engine = React.useMemo(() => {
    // In a real app, permissions would come from user profile or a separate fetch
    const defaultPerms = user ? RBACEngine.getDefaultPermissions(user.role) : {};
    return new RBACEngine(user?.role || null, defaultPerms);
  }, [user]);

  const value = {
    engine,
    can: (m: string, a: PermissionAction) => engine.can(m, a),
    canView: (m: string) => engine.canView(m),
    canCreate: (m: string) => engine.canCreate(m),
    canEdit: (m: string) => engine.canEdit(m),
    canDelete: (m: string) => engine.canDelete(m),
    canApprove: (m: string) => engine.canApprove(m),
    canExport: (m: string) => engine.canExport(m),
  };

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC() {
  const context = React.useContext(RBACContext);
  if (!context) {
    throw new Error("useRBAC must be used within an RBACProvider");
  }
  return context;
}

export function PermissionGate({ 
  module, 
  action = 'view', 
  children, 
  fallback = null 
}: { 
  module: string; 
  action?: PermissionAction; 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  const { can } = useRBAC();
  
  if (!can(module, action)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}
