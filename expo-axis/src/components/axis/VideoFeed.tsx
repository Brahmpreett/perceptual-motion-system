import { useEffect, useState } from "react";

interface Props {
  ip: string;
  autoMode?: boolean;
  onToggleAuto?: () => void;
  cameraPower?: boolean;
  onToggleCamera?: () => void;
}

export function VideoFeed({ ip, autoMode = false, onToggleAuto, cameraPower = true, onToggleCamera }: Props) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const src = ip ? `http://${ip}:8000/video_feed` : "";

  return (
    <section
      className="panel scanline fade-in relative flex-1 overflow-hidden"
      aria-label="Camera feed"
    >
      {/* Stream */}
      <div className="absolute inset-0 bg-black flex items-center justify-center">
        {src && cameraPower ? (
          <img
            src={src}
            alt="Robot camera feed"
            className="h-full w-full object-contain opacity-90"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
            }}
          />
        ) : !cameraPower ? (
          <div className="text-alert tracking-[0.5em] text-sm font-mono uppercase">
            CAMERA OFFLINE
          </div>
        ) : null}
      </div>

      {/* Corner brackets */}
      {[
        "top-3 left-3 border-t border-l",
        "top-3 right-3 border-t border-r",
        "bottom-3 left-3 border-b border-l",
        "bottom-3 right-3 border-b border-r",
      ].map((cls) => (
        <span
          key={cls}
          className={`absolute h-5 w-5 ${cls}`}
          style={{ borderColor: "var(--foreground)" }}
          aria-hidden
        />
      ))}

      {/* Crosshair */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative h-32 w-32">
          <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2" style={{ background: "var(--foreground)", opacity: 0.4 }} />
          <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2" style={{ background: "var(--foreground)", opacity: 0.4 }} />
          <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border" style={{ borderColor: "var(--foreground)" }} />
        </div>
      </div>

      {/* REC */}
      <div className="absolute right-4 top-4 flex items-center gap-2 text-[11px] tracking-[0.3em]">
        <span className="blink h-2.5 w-2.5 rounded-full" style={{ background: "var(--alert)" }} aria-hidden />
        <span style={{ color: "var(--alert)" }}>REC</span>
      </div>

      {/* HUD telemetry */}
      <div className="absolute left-4 top-4 flex flex-col gap-1 text-[11px] tracking-[0.2em] text-muted-foreground z-10">
        <span>CAM-01 / 1080p</span>
        <span>FOV 78°</span>
        <div className="flex flex-col gap-2 mt-2 items-start">
          <button 
            onClick={onToggleCamera}
            className="press-scale px-3 py-1.5 text-[10px] uppercase border"
            style={{ 
              color: cameraPower ? "var(--foreground)" : "var(--alert)",
              backgroundColor: "transparent",
              borderColor: cameraPower ? "var(--foreground)" : "var(--alert)"
            }}
          >
            {cameraPower ? "CAM: ON" : "CAM: OFF"}
          </button>

          {cameraPower && (
            <button 
              onClick={onToggleAuto}
              className="press-scale px-3 py-1.5 text-[10px] uppercase border"
              style={{ 
                color: autoMode ? "var(--background)" : "var(--foreground)",
                backgroundColor: autoMode ? "var(--foreground)" : "transparent",
                borderColor: "var(--foreground)"
              }}
            >
              {autoMode ? "AUTO-TRACK: ON" : "AUTO-TRACK: OFF"}
            </button>
          )}
        </div>
      </div>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.35em] text-muted-foreground">
        T+{String(tick).padStart(5, "0")}
      </div>
    </section>
  );
}
