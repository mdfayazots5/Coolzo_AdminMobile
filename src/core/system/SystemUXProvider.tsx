/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { systemRepository } from "../network/system-repository";
import { LocalStorage, StorageKey } from "../storage/local-storage";

interface SystemUXContextValue {
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  lastSyncAt: string | null;
  refreshQueueState: () => Promise<void>;
  setSyncing: (value: boolean) => void;
  recordSyncCompleted: () => void;
}

const SystemUXContext = React.createContext<SystemUXContextValue | null>(null);

export function SystemUXProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [pendingSyncCount, setPendingSyncCount] = React.useState(0);
  const [lastSyncAt, setLastSyncAt] = React.useState<string | null>(
    LocalStorage.get<string>(StorageKey.SYSTEM_LAST_SYNC_AT)
  );

  const refreshQueueState = React.useCallback(async () => {
    const count = await systemRepository.getPendingSyncCount();
    setPendingSyncCount(count);
    setLastSyncAt(LocalStorage.get<string>(StorageKey.SYSTEM_LAST_SYNC_AT));
  }, []);

  const recordSyncCompleted = React.useCallback(() => {
    const value = new Date().toISOString();
    LocalStorage.set(StorageKey.SYSTEM_LAST_SYNC_AT, value);
    setLastSyncAt(value);
    void refreshQueueState();
  }, [refreshQueueState]);

  React.useEffect(() => {
    void refreshQueueState();
  }, [refreshQueueState]);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleStorage = () => {
      void refreshQueueState();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refreshQueueState]);

  return (
    <SystemUXContext.Provider
      value={{
        isOnline,
        isSyncing,
        pendingSyncCount,
        lastSyncAt,
        refreshQueueState,
        setSyncing: setIsSyncing,
        recordSyncCompleted,
      }}
    >
      {children}
    </SystemUXContext.Provider>
  );
}

export function useSystemUX() {
  const context = React.useContext(SystemUXContext);
  if (!context) {
    throw new Error("useSystemUX must be used within SystemUXProvider");
  }
  return context;
}
