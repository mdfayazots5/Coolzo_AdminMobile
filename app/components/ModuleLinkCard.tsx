import * as React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { SettingsShortcut } from "../domain/models/admin";

export function ModuleLinkCard({ shortcut }: { shortcut: SettingsShortcut }) {
  return (
    <Link
      to={shortcut.path}
      className="flex items-center justify-between rounded-2xl border border-border bg-brand-surface p-4 shadow-sm transition-colors hover:bg-brand-navy/5"
    >
      <div>
        <h3 className="text-sm font-bold text-brand-navy">{shortcut.title}</h3>
        <p className="mt-1 text-xs text-brand-muted">{shortcut.description}</p>
      </div>
      <ChevronRight size={18} className="text-brand-muted" />
    </Link>
  );
}
