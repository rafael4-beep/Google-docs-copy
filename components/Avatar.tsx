// Small circular avatar showing a user's initials in their assigned color.

type AvatarUser = { name?: string; color?: string } | null | undefined;

function initials(name?: string): string {
  return String(name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

export default function Avatar({ user, size = 36 }: { user: AvatarUser; size?: number }) {
  const dimension = { width: size, height: size, fontSize: size * 0.4 };
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-semibold text-white select-none shrink-0"
      style={{ ...dimension, backgroundColor: user?.color || "#5b5bf0" }}
      title={user?.name}
    >
      {initials(user?.name)}
    </span>
  );
}
