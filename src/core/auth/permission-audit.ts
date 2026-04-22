export interface PermissionDeniedEventDetail {
  module: string;
  action: string;
  route?: string;
}

type AnalyticsWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
};

export const logPermissionDeniedAttempt = ({
  module,
  action,
  route,
}: PermissionDeniedEventDetail) => {
  const detail = {
    module,
    action,
    route,
    timestamp: new Date().toISOString(),
  };

  const analyticsWindow = window as AnalyticsWindow;
  analyticsWindow.dataLayer?.push({
    event: 'permission_denied',
    ...detail,
  });
  window.dispatchEvent(new CustomEvent('coolzo:permission-denied', { detail }));
  console.warn(`Permission denied for ${module}.${action}${route ? ` on ${route}` : ''}`);
};
