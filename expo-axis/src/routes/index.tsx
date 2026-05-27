import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Header } from "../components/axis/Header";
import { VideoFeed } from "../components/axis/VideoFeed";
import { Joystick } from "../components/axis/Joystick";
import { DPad } from "../components/axis/DPad";
import { CommandBar } from "../components/axis/CommandBar";
import { TerminalLog, type LogEntry } from "../components/axis/TerminalLog";
import { useWebSocket } from "../hooks/useWebSocket";
import {
  buildCamera,
  buildEstop,
  buildMove,
  buildText,
  type Direction,
} from "../constants/commands";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "AXIS // ROBOTICS CONTROL" },
      {
        name: "description",
        content:
          "AXIS — stealth cockpit HUD for remote robot operations. Live camera feed, joystick pan/tilt, D-pad drive, NLP command terminal.",
      },
      { property: "og:title", content: "AXIS // ROBOTICS CONTROL" },
      {
        property: "og:description",
        content: "Remote robot control HUD — live feed, joystick, drive controls, NLP command bus.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

function Dashboard() {
  const [ip, setIp] = useState<string>(() => {
    if (typeof window === "undefined") return "192.168.1.10";
    return localStorage.getItem("axis.ip") || "192.168.1.10";
  });
  const [autoMode, setAutoMode] = useState(false);
  const [cameraPower, setCameraPower] = useState(true);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("axis.ip", ip);
  }, [ip]);

  const { sendMessage, connectionStatus, lastSent, lastReceived } = useWebSocket(ip);

  // Log everything we try to send
  const [log, setLog] = useState<LogEntry[]>([]);
  const idRef = useRef(0);
  useEffect(() => {
    if (!lastSent) return;
    idRef.current += 1;
    const id = idRef.current;
    setLog((prev) =>
      [
        ...prev,
        {
          id,
          ts: lastSent.ts,
          payload: lastSent.payload,
          ok: connectionStatus === "CONNECTED",
          type: "TX" as const,
        },
      ].slice(-200),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSent]);

  useEffect(() => {
    if (!lastReceived) return;
    idRef.current += 1;
    const id = idRef.current;
    
    let type: LogEntry["type"] = "RX";
    try {
       const parsed = JSON.parse(lastReceived.payload);
       if (parsed.type === "AUTO_RX") type = "AUTO_RX";
    } catch {
      type = "RX";
    }

    setLog((prev) =>
      [
        ...prev,
        {
          id,
          ts: lastReceived.ts,
          payload: lastReceived.payload,
          ok: true,
          type,
        },
      ].slice(-200),
    );
  }, [lastReceived]);

  // Throttled joystick emission
  const lastCamRef = useRef(0);
  const pendingCamRef = useRef<{ pan: number; tilt: number } | null>(null);
  const camTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushCam = useCallback(() => {
    const p = pendingCamRef.current;
    if (!p) return;
    pendingCamRef.current = null;
    lastCamRef.current = Date.now();
    sendMessage(buildCamera(p.pan, p.tilt));
  }, [sendMessage]);

  const onCamera = useCallback(
    (pan: number, tilt: number) => {
      pendingCamRef.current = { pan, tilt };
      const now = Date.now();
      const elapsed = now - lastCamRef.current;
      if (elapsed >= 50) {
        if (camTimerRef.current) {
          clearTimeout(camTimerRef.current);
          camTimerRef.current = null;
        }
        flushCam();
      } else if (!camTimerRef.current) {
        camTimerRef.current = setTimeout(() => {
          camTimerRef.current = null;
          flushCam();
        }, 50 - elapsed);
      }
    },
    [flushCam],
  );

  const onMove = useCallback(
    (dir: Direction) => {
      sendMessage(buildMove(dir));
    },
    [sendMessage],
  );
  const onStop = useCallback(() => sendMessage(buildMove("STOP")), [sendMessage]);
  const onEstop = useCallback(() => sendMessage(buildEstop()), [sendMessage]);
  const onText = useCallback(
    (t: string) => sendMessage(buildText(t)),
    [sendMessage],
  );

  const onToggleAuto = useCallback(() => {
    setAutoMode((prev) => {
      const next = !prev;
      sendMessage(JSON.stringify({ action: "set_autonomous", enabled: next }));
      return next;
    });
  }, [sendMessage]);

  const onToggleCamera = useCallback(() => {
    setCameraPower((prev) => {
      const next = !prev;
      sendMessage(JSON.stringify({ action: "set_camera_power", enabled: next }));
      if (!next && autoMode) {
        // Turn off auto mode if camera turns off
        setAutoMode(false);
        sendMessage(JSON.stringify({ action: "set_autonomous", enabled: false }));
      }
      return next;
    });
  }, [sendMessage, autoMode]);

  return (
    <main className="min-h-screen w-full p-3 lg:p-4 flex flex-col gap-3 lg:gap-4">
      <Header ip={ip} onIpChange={setIp} status={connectionStatus} />

      <div className="grid flex-1 gap-3 lg:gap-4 grid-cols-1 lg:grid-cols-[260px_1fr_260px]">
        {/* LEFT: D-Pad + E-stop */}
        <aside className="panel fade-in flex flex-col gap-4 p-4">
          <DPad onMove={onMove} onStop={onStop} onEstop={onEstop} />
        </aside>

        {/* CENTER: Video */}
        <div className="flex flex-col gap-3 lg:gap-4 min-h-[320px] lg:min-h-0">
          <VideoFeed 
            ip={ip} 
            autoMode={autoMode} 
            onToggleAuto={onToggleAuto}
            cameraPower={cameraPower}
            onToggleCamera={onToggleCamera} 
          />
        </div>

        {/* RIGHT: Joystick */}
        <aside className="panel fade-in flex flex-col items-center justify-between gap-4 p-4">
          <Joystick onChange={onCamera} />
          <div className="w-full grid grid-cols-2 gap-2 text-[10px] tracking-widest text-muted-foreground">
            <div className="border p-2" style={{ borderColor: "var(--border)" }}>
              <div className="panel-label">MODE</div>
              <div className="text-foreground mt-1">{autoMode ? "AUTO" : "MANUAL"}</div>
            </div>
            <div className="border p-2" style={{ borderColor: "var(--border)" }}>
              <div className="panel-label">GIMBAL</div>
              <div className="text-foreground mt-1">ARMED</div>
            </div>
          </div>
        </aside>
      </div>

      {/* BOTTOM: command + log */}
      <div className="grid gap-3 lg:gap-4 grid-cols-1 xl:grid-cols-[1fr_420px]">
        <CommandBar onSend={onText} />
        <TerminalLog entries={log} />
      </div>
    </main>
  );
}
