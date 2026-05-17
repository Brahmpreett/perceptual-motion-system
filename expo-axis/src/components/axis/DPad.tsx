import type { Direction } from "../../constants/commands";

interface Props {
  onMove: (dir: Direction) => void;
  onStop: () => void;
  onEstop: () => void;
}

function PadButton({
  label,
  glyph,
  onDown,
  onUp,
  className = "",
}: {
  label: string;
  glyph: string;
  onDown: () => void;
  onUp: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => {
        (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
        onDown();
      }}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={(e) => {
        if (e.buttons) onUp();
      }}
      className={`press-scale flex items-center justify-center border bg-card text-foreground hover:bg-secondary active:bg-foreground active:text-background ${className}`}
      style={{ borderColor: "var(--border)" }}
    >
      <span className="flex flex-col items-center gap-0.5">
        <span className="text-2xl leading-none">{glyph}</span>
        <span className="text-[9px] tracking-[0.3em]">{label}</span>
      </span>
    </button>
  );
}

export function DPad({ onMove, onStop, onEstop }: Props) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full items-center justify-between">
        <span className="panel-label">DRIVE</span>
        <span className="text-[10px] tracking-widest text-muted-foreground">HOLD TO MOVE</span>
      </div>
      <div className="grid grid-cols-3 grid-rows-3 gap-2" style={{ width: 200, height: 200 }}>
        <span />
        <PadButton label="FWD" glyph="▲" onDown={() => onMove("FORWARD")} onUp={onStop} />
        <span />
        <PadButton label="LEFT" glyph="◄" onDown={() => onMove("LEFT")} onUp={onStop} />
        <div className="flex items-center justify-center border" style={{ borderColor: "var(--border)" }}>
          <span className="text-[10px] tracking-[0.3em] text-muted-foreground">AXIS</span>
        </div>
        <PadButton label="RIGHT" glyph="►" onDown={() => onMove("RIGHT")} onUp={onStop} />
        <span />
        <PadButton label="BKWD" glyph="▼" onDown={() => onMove("BACKWARD")} onUp={onStop} />
        <span />
      </div>

      <button
        type="button"
        onClick={onEstop}
        className="press-scale mt-2 w-full border-2 px-4 py-3 text-center text-sm tracking-[0.35em] uppercase"
        style={{
          borderColor: "var(--alert)",
          background: "color-mix(in oklab, var(--alert) 18%, transparent)",
          color: "var(--alert-foreground)",
        }}
        aria-label="Emergency stop"
      >
        ◼ EMERGENCY STOP
      </button>
    </div>
  );
}
