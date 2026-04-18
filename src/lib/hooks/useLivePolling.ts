/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';

/**
 * A hook that triggers a callback every N seconds.
 * Used for real-time dashboard auto-refresh.
 */
export function useLivePolling(callback: () => void, intervalMs: number = 60000) {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const tick = () => {
      savedCallback.current();
      setLastUpdated(new Date());
    };

    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  const manualRefresh = () => {
    savedCallback.current();
    setLastUpdated(new Date());
  };

  return { lastUpdated, manualRefresh };
}
