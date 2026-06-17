// Color-coded pill showing the viewer's access level on a document.

import type { AccessLevel } from "@/lib/types";

const STYLES: Record<string, string> = {
  owner: "bg-brand-soft text-brand-dark",
  editor: "bg-emerald-50 text-emerald-700",
  viewer: "bg-amber-50 text-amber-700",
};

const LABELS: Record<string, string> = {
  owner: "Owner",
  editor: "Can edit",
  viewer: "View only",
};

export default function AccessBadge({ access }: { access: AccessLevel }) {
  if (!access) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[access] || ""}`}
    >
      {LABELS[access] || access}
    </span>
  );
}
