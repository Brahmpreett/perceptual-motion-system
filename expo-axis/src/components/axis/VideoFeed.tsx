import { useEffect, useMemo, useState } from "react";

interface Props {
  ip: string;
  autoMode?: boolean;
  onToggleAuto?: () => void;
  cameraPower?: boolean;
  onToggleCamera?: () => void;
}

type StreamStatus = "loading" | "online" | "offline";

export function VideoFeed({
  ip,
  autoMode = false,
  onToggleAuto,
  cameraPower = true,
  onToggleCamera,
}: Props) {
  const [tick, setTick] = useState(0);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>("loading");
  const [endpointIndex, setEndpointIndex] = useState(0);
  const [streamNonce, setStreamNonce] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const streamEndpoints = useMemo(
    () => [
      `http://${ip}:8765/video_feed`,
      `http://${ip}:8765/video`,
      `http://${ip}:8765/stream.mjpg`,
    ],
    [ip],
  );

  const streamSrc = ip && cameraPower ? `${streamEndpoints[endpointIndex]}?t=${streamNonce}` : "";

  useEffect(() => {
    setEndpointIndex(0);
    setStreamStatus(cameraPower && ip ? "loading" : "offline");
    setStreamNonce(Date.now());
  }, [cameraPower, ip]);

  const tryNextStreamEndpoint = () => {
    if (endpointIndex < streamEndpoints.length - 1) {
      setEndpointIndex((current) => current + 1);
      setStreamStatus("loading");
      setStreamNonce(Date.now());
      return;
    }

    setStreamStatus("offline");
  };

  useEffect(() => {
    if (!cameraPower || !ip || streamStatus !== "loading") {
      return undefined;
    }

    const id = setTimeout(tryNextStreamEndpoint, 2500);
    return () => clearTimeout(id);
  }, [cameraPower, endpointIndex, ip, streamStatus, streamEndpoints.length]);

  return (
    <section
      className="panel scanline fade-in relative flex-1 overflow-hidden"
      aria-label="Camera feed"
    >
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        {streamSrc && cameraPower && streamStatus !== "offline" ? (
          <>
            <img
              key={streamSrc}
              src={streamSrc}
              alt="Robot camera feed"
              className={`h-full w-full object-contain transition-opacity duration-200 ${
                streamStatus === "online" ? "opacity-90" : "opacity-0"
              }`}
              onLoad={() => setStreamStatus("online")}
              onError={tryNextStreamEndpoint}
            />

            {streamStatus === "loading" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="h-12 w-20 border border-foreground/50" />
                <div className="text-xs uppercase tracking-[0.45em] text-muted-foreground">
                  Opening camera stream
                </div>
                <div className="max-w-md text-[10px] leading-5 tracking-[0.2em] text-muted-foreground">
                  {streamEndpoints[endpointIndex]}
                </div>
              </div>
            ) : null}
          </>
        ) : cameraPower && streamStatus === "offline" ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="h-12 w-20 border border-foreground/50" />
            <div className="text-xs uppercase tracking-[0.45em] text-muted-foreground">
              Stream unavailable
            </div>
            <div className="max-w-md text-[10px] leading-5 tracking-[0.2em] text-muted-foreground">
              AXIS is listening for /video_feed, /video, or /stream.mjpg on port 8765.
            </div>
          </div>
        ) : !cameraPower ? (
          <div className="text-sm uppercase tracking-[0.5em] text-alert">Camera offline</div>
        ) : (
          <div className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
            Enter robot host
          </div>
        )}
      </div>

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

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative h-32 w-32">
          <span
            className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2"
            style={{ background: "var(--foreground)", opacity: 0.4 }}
          />
          <span
            className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2"
            style={{ background: "var(--foreground)", opacity: 0.4 }}
          />
          <span
            className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{ borderColor: "var(--foreground)" }}
          />
        </div>
      </div>

      {cameraPower && streamStatus === "online" ? (
        <div className="absolute right-4 top-4 flex items-center gap-2 text-[11px] tracking-[0.3em]">
          <span
            className="blink h-2.5 w-2.5 rounded-full"
            style={{ background: "var(--alert)" }}
            aria-hidden
          />
          <span style={{ color: "var(--alert)" }}>LIVE</span>
        </div>
      ) : null}

      <div className="absolute left-4 top-4 z-10 flex flex-col gap-1 text-[11px] tracking-[0.2em] text-muted-foreground">
        <span>CAM-01 / 1080p</span>
        <span>FOV 78 deg</span>
        <span>{cameraPower ? streamStatus.toUpperCase() : "POWER OFF"}</span>
        <div className="mt-2 flex flex-col items-start gap-2">
          <button
            onClick={onToggleCamera}
            aria-pressed={cameraPower}
            className="press-scale border px-3 py-1.5 text-[10px] uppercase"
            style={{
              color: cameraPower ? "var(--foreground)" : "var(--alert)",
              backgroundColor: "transparent",
              borderColor: cameraPower ? "var(--foreground)" : "var(--alert)",
            }}
          >
            {cameraPower ? "CAM: ON" : "CAM: OFF"}
          </button>

          {cameraPower && (
            <button
              onClick={onToggleAuto}
              className="press-scale border px-3 py-1.5 text-[10px] uppercase"
              style={{
                color: autoMode ? "var(--background)" : "var(--foreground)",
                backgroundColor: autoMode ? "var(--foreground)" : "transparent",
                borderColor: "var(--foreground)",
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
