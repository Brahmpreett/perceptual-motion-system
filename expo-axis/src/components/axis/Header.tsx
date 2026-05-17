import { useEffect, useState } from "react";
import { ConnectionBadge } from "./ConnectionBadge";
import type { ConnectionStatus } from "../../hooks/useWebSocket";

interface Props {
  ip: string;
  onIpChange: (ip: string) => void;
  status: ConnectionStatus;
}

export function Header({ ip, onIpChange, status }: Props) {
  const [draft, setDraft] = useState(ip);
  useEffect(() => setDraft(ip), [ip]);

  const commit = () => {
    const next = draft.trim();
    if (next && next !== ip) onIpChange(next);
  };

  const [clock, setClock] = useState("");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(
        `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}:${d.getUTCSeconds().toString().padStart(2, "0")} UTC`,
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="panel fade-in flex items-center justify-between gap-4 px-4 py-2.5">
      <div className="flex items-center gap-3">
        <div
          className="h-4 w-4"
          style={{
            background:
              "linear-gradient(135deg, var(--foreground) 0 50%, transparent 50% 100%)",
          }}
          aria-hidden
        />
        <h1 className="text-sm tracking-[0.35em] uppercase">
          AXIS <span className="text-muted-foreground">//</span> ROBOTICS CONTROL
        </h1>
        <span className="hidden md:inline panel-label ml-2">v1.0 / OPS</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden sm:inline text-[11px] text-muted-foreground tracking-[0.2em]">
          {clock}
        </span>
        <label className="flex items-center gap-2">
          <span className="panel-label">HOST</span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            spellCheck={false}
            className="w-44 bg-transparent border border-border px-2 py-1 text-xs tracking-wider text-foreground outline-none focus:border-foreground"
            placeholder="192.168.1.10"
            aria-label="Robot IP address"
          />
        </label>
        <ConnectionBadge status={status} />
      </div>
    </header>
  );
}
