import * as React from "react";
import { ModuleLinkCard } from "../components/ModuleLinkCard";
import { SETTINGS_SHORTCUTS } from "../modules/settings-shortcuts";
import { useAuthStore } from "../store/session-store";

export function SettingsHomeScreen() {
  const user = useAuthStore((state) => state.user);
  const visible = SETTINGS_SHORTCUTS.filter((shortcut) => {
    if (!shortcut.roles?.length) {
      return true;
    }

    return user ? shortcut.roles.includes(user.role) : false;
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-3xl bg-brand-navy p-6 text-white shadow-xl">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-gold">Common Module</p>
        <h1 className="mt-2 text-3xl font-bold">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/75">
          Shared admin controls for configuration, notifications, workflow, pricing, and access management.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((shortcut) => (
          <React.Fragment key={shortcut.id}>
            <ModuleLinkCard shortcut={shortcut} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
