export type Direction = "FORWARD" | "BACKWARD" | "LEFT" | "RIGHT" | "STOP";

export function buildCamera(pan: number, tilt: number) {
  return JSON.stringify({ command: "camera", pan, tilt });
}

export function buildMove(direction: Direction) {
  return JSON.stringify({ command: "move", direction, speed: direction === "STOP" ? 0 : 0.5 });
}

export function buildEstop() {
  return JSON.stringify({ command: "estop" });
}

export function buildText(text: string) {
  return JSON.stringify({ command: "nlp", nlp: text });
}
