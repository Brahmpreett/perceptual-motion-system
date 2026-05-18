import { useEffect, useRef } from "react";

export interface LogEntry {
  id: number;
  ts: number;
  payload: string;
  ok: boolean;
  type: "TX" | "RX" | "AUTO_RX";
}

interface Props {
  entries: LogEntry[];
}

function fmt(ts: number) {
  const d = new Date(ts);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  const ss = d.getSeconds().toString().padStart(2, "0");
  const ms = d.getMilliseconds().toString().padStart(3, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
}

export function TerminalLog({ entries }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries]);

  return (
    <div className="panel fade-in flex flex-col" style={{ height: 160 }}>
      <div className="flex items-center justify-between px-3 py-1.5" style={{ borderBottom: "1px solid var(--border)" }}>
        <span className="panel-label">COMMS LOG</span>
        <span className="text-[10px] tracking-widest text-muted-foreground">
          {entries.length} PACKETS
        </span>
      </div>
      <div ref={ref} className="flex-1 overflow-y-auto px-3 py-2 text-[11px] leading-relaxed">
        {entries.length === 0 ? (
          <div className="text-muted-foreground">// awaiting transmission</div>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="flex gap-3">
              <span className="text-muted-foreground">{fmt(e.ts)}</span>
              <span style={{ color: e.type === "RX" ? "var(--muted-foreground)" : e.type === "AUTO_RX" ? "#00ffff" : e.ok ? "var(--foreground)" : "var(--alert)" }}>
                {e.type === "RX" ? "RX" : e.type === "AUTO_RX" ? "AUTO" : e.ok ? "TX" : "DROP"}
              </span>
              <span className="truncate">{e.payload}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
