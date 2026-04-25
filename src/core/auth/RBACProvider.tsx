/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import { UserRole, useAuthStore } from "@/store/auth-store"
import { RBACEngine, PermissionAction, PermissionSet } from "./rbac-engine"
import { authRepository } from "../network/auth-repository"
import { ViewAsRoleSession, buildPermissionSet, mapBackendRole } from "./auth-session"
import { LocalStorage, StorageKey } from "../storage/local-storage"
import { logPermissionDeniedAttempt } from "./permission-audit"

interface RBACContextType {
  engine: RBACEngine;
  dataScope: string;
  effectiveRole: UserRole | null;
  isPermissionsReady: boolean;
  isViewingAsRole: boolean;
  viewAsRole: ViewAsRoleSession | null;
  refreshPermissions: () => Promise<void>;
  startViewAsRole: (roleId: string) => Promise<void>;
  exitViewAsRole: () => Promise<void>;
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
  const [permissionSet, setPermissionSet] = React.useState<PermissionSet>(() => LocalStorage.get<PermissionSet>(StorageKey.PERMISSION_SET) || {});
  const [dataScope, setDataScope] = React.useState(() => LocalStorage.get<string>(StorageKey.PERMISSION_SCOPE) || 'All');
  const [viewAsRole, setViewAsRole] = React.useState<ViewAsRoleSession | null>(() => LocalStorage.get<ViewAsRoleSession>(StorageKey.VIEW_AS_ROLE));
  const [isPermissionsReady, setIsPermissionsReady] = React.useState(() => Boolean(LocalStorage.get<PermissionSet>(StorageKey.PERMISSION_SET)));

  const persistPermissionState = React.useCallback((nextPermissionSet: PermissionSet, nextDataScope: string) => {
    setPermissionSet(nextPermissionSet);
    setDataScope(nextDataScope);
    LocalStorage.set(StorageKey.PERMISSION_SET, nextPermissionSet);
    LocalStorage.set(StorageKey.PERMISSION_SCOPE, nextDataScope);
    LocalStorage.set(StorageKey.PERMISSION_LOADED_AT, Date.now());
    setIsPermissionsReady(true);
  }, []);

  const loadCurrentUserPermissions = React.useCallback(async () => {
    if (!user) {
      setPermissionSet({});
      setDataScope('All');
      setIsPermissionsReady(true);
      LocalStorage.remove(StorageKey.PERMISSION_SET);
      LocalStorage.remove(StorageKey.PERMISSION_SCOPE);
      LocalStorage.remove(StorageKey.PERMISSION_LOADED_AT);
      return;
    }

    try {
      const snapshot = await authRepository.getPermissionSnapshot(user);
      persistPermissionState(snapshot.permissionSet, snapshot.dataScope);
    } catch (error) {
      const fallback = buildPermissionSet(user.permissions || [], user.role);
      persistPermissionState(fallback, 'All');
    }
  }, [persistPermissionState, user]);

  const refreshPermissions = React.useCallback(async () => {
    if (viewAsRole) {
      persistPermissionState(viewAsRole.permissionSet, viewAsRole.dataScope);
      return;
    }

    setIsPermissionsReady(false);
    await loadCurrentUserPermissions();
  }, [loadCurrentUserPermissions, persistPermissionState, viewAsRole]);

  const startViewAsRole = React.useCallback(async (roleId: string) => {
    if (!user || user.role !== UserRole.SUPER_ADMIN) {
      throw new Error("Only Super Admin users can start view-as-role sessions");
    }

    const session = await authRepository.viewAsRole(roleId);
    setViewAsRole(session);
    LocalStorage.set(StorageKey.VIEW_AS_ROLE, session);
    persistPermissionState(session.permissionSet, session.dataScope);
  }, [persistPermissionState, user]);

  const exitViewAsRole = React.useCallback(async () => {
    LocalStorage.remove(StorageKey.VIEW_AS_ROLE);
    setViewAsRole(null);
    await loadCurrentUserPermissions();
  }, [loadCurrentUserPermissions]);

  React.useEffect(() => {
    void refreshPermissions();
  }, [refreshPermissions]);

  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible' || !user) {
        return;
      }

      const lastLoadedAt = LocalStorage.get<number>(StorageKey.PERMISSION_LOADED_AT) || 0;
      if (Date.now() - lastLoadedAt > 30 * 60 * 1000) {
        void refreshPermissions();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshPermissions, user]);

  const effectiveRole = viewAsRole ? mapBackendRole(viewAsRole.roleName) : user?.role || null;

  const engine = React.useMemo(() => {
    return new RBACEngine(effectiveRole, permissionSet);
  }, [effectiveRole, permissionSet]);

  const value = {
    engine,
    dataScope,
    effectiveRole,
    isPermissionsReady,
    isViewingAsRole: Boolean(viewAsRole),
    viewAsRole,
    refreshPermissions,
    startViewAsRole,
    exitViewAsRole,
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
    logPermissionDeniedAttempt({
      module,
      action,
      route: window.location.pathname,
    });
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}
