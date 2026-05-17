import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  onChange: (pan: number, tilt: number) => void;
  size?: number;
}

/**
 * Drag-based virtual joystick. Outputs pan/tilt in [-1, 1].
 * Pan = X (right positive), Tilt = Y (up positive).
 * Parent throttles WebSocket emission via onChange callback.
 */
export function Joystick({ onChange, size = 200 }: Props) {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const dragging = useRef(false);
  const radius = size / 2 - 24;

  const update = useCallback(
    (clientX: number, clientY: number) => {
      const el = baseRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > radius) {
        dx = (dx / dist) * radius;
        dy = (dy / dist) * radius;
      }
      setPos({ x: dx, y: dy });
      onChange(dx / radius, -dy / radius);
    },
    [onChange, radius],
  );

  const release = useCallback(() => {
    dragging.current = false;
    setActive(false);
    setPos({ x: 0, y: 0 });
    onChange(0, 0);
  }, [onChange]);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (dragging.current) update(e.clientX, e.clientY);
    };
    const up = () => {
      if (dragging.current) release();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [update, release]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    setActive(true);
    update(e.clientX, e.clientY);
  };

  const panVal = (pos.x / radius).toFixed(2);
  const tiltVal = (-pos.y / radius).toFixed(2);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between">
        <span className="panel-label">CAM PAN/TILT</span>
        <span className="text-[10px] tracking-widest text-muted-foreground">
          X {panVal} · Y {tiltVal}
        </span>
      </div>
      <div
        ref={baseRef}
        onPointerDown={onPointerDown}
        className="relative rounded-full border touch-none select-none"
        style={{
          width: size,
          height: size,
          borderColor: "var(--border)",
          background:
            "radial-gradient(circle at center, color-mix(in oklab, var(--card) 90%, transparent) 0%, #000 100%)",
        }}
        role="application"
        aria-label="Camera joystick"
      >
        {/* axes */}
        <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2" style={{ background: "var(--border)" }} />
        <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2" style={{ background: "var(--border)" }} />
        <span
          className="absolute left-1/2 top-1/2 rounded-full border"
          style={{
            width: radius * 2,
            height: radius * 2,
            transform: "translate(-50%, -50%)",
            borderColor: "var(--border)",
          }}
        />
        {/* handle */}
        <span
          className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full border"
          style={{
            transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
            background: "var(--foreground)",
            borderColor: "var(--foreground)",
            transition: active ? "none" : "transform 220ms cubic-bezier(.2,.9,.3,1.2)",
          }}
        />
      </div>
    </div>
  );
}
