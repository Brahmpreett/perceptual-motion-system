export type Direction = "FORWARD" | "BACKWARD" | "LEFT" | "RIGHT" | "STOP";

export function buildCamera(pan: number, tilt: number) {
  return JSON.stringify({ action: "camera", pan, tilt });
}

export function buildMove(direction: Direction) {
  return JSON.stringify({ action: direction === "STOP" ? "stop" : "move", direction, speed: direction === "STOP" ? 0 : 0.5 });
}

export function buildEstop() {
  return JSON.stringify({ action: "emergency_stop" });
}

export function buildText(text: string) {
  return JSON.stringify({ nlp: text });
}
