import * as React from "react";
import { BellRing, Mail, MessageSquareText, Smartphone } from "lucide-react";
import { notificationService } from "../services/notification-service";
import type { NotificationActivity } from "../domain/models/admin";
import { formatDateTime } from "../utils/format";

const channelIcon: Record<string, React.ReactNode> = {
  email: <Mail size={16} />,
  whatsapp: <MessageSquareText size={16} />,
  sms: <MessageSquareText size={16} />,
  push: <Smartphone size={16} />,
};

export function NotificationsScreen() {
  const [items, setItems] = React.useState<NotificationActivity[]>([]);

  React.useEffect(() => {
    void notificationService.list().then(setItems);
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-3xl bg-brand-navy p-6 text-white shadow-xl">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-gold">Common Module</p>
        <h1 className="mt-2 text-3xl font-bold">Notifications</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/75">
          Central notification activity for admins, operations, support, finance, and field workflows.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-border bg-brand-surface p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-muted">Total</p>
          <p className="mt-2 text-3xl font-bold text-brand-navy">{items.length}</p>
        </div>
        <div className="rounded-3xl border border-border bg-brand-surface p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-muted">Delivered</p>
          <p className="mt-2 text-3xl font-bold text-brand-navy">{items.filter((item) => item.status === "delivered").length}</p>
        </div>
        <div className="rounded-3xl border border-border bg-brand-surface p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-muted">Failed</p>
          <p className="mt-2 text-3xl font-bold text-status-urgent">{items.filter((item) => item.status === "failed").length}</p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-4 rounded-3xl border border-border bg-brand-surface p-5">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-brand-navy/5 p-3 text-brand-navy">
                {channelIcon[item.channel] || <BellRing size={16} />}
              </div>
              <div>
                <h2 className="text-sm font-bold text-brand-navy">{item.triggerEvent}</h2>
                <p className="mt-1 text-sm text-brand-muted">{item.recipient}</p>
                <p className="mt-1 text-xs text-brand-muted">{formatDateTime(item.sentAt)}</p>
              </div>
            </div>
            <span className="rounded-full bg-brand-navy/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-navy">
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

