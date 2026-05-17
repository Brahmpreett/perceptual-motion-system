import type { ConnectionStatus } from "../../hooks/useWebSocket";

interface Props {
  status: ConnectionStatus;
}

const LABELS: Record<ConnectionStatus, string> = {
  CONNECTING: "CONNECTING",
  CONNECTED: "LINK ACTIVE",
  DISCONNECTED: "NO SIGNAL",
};

export function ConnectionBadge({ status }: Props) {
  const color =
    status === "CONNECTED"
      ? "var(--foreground)"
      : status === "CONNECTING"
        ? "#C9A227"
        : "var(--alert)";

  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-2.5 w-2.5"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span
        className="text-[11px] tracking-[0.25em] uppercase"
        style={{ color }}
      >
        {LABELS[status]}
      </span>
    </div>
  );
}
