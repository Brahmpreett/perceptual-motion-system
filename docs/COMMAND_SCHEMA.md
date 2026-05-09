# AXIS Command Schema v1.0

All commands are JSON objects sent over WebSocket.
Every command must have an `action` field.

---

## Movement

```json
{ "action": "move", "direction": "forward", "speed": 0.6 }
{ "action": "move", "direction": "backward", "speed": 0.4 }
{ "action": "move", "direction": "left", "speed": 0.5 }
{ "action": "move", "direction": "right", "speed": 0.5 }
{ "action": "stop" }
```

## Rotation

```json
{ "action": "rotate", "direction": "left", "degrees": 90 }
{ "action": "rotate", "direction": "right", "degrees": 45 }
```

## Transform (fold/unfold)

```json
{ "action": "transform", "mode": "folded" }
{ "action": "transform", "mode": "deployed" }
```

## Camera

```json
{ "action": "camera", "tilt": "up", "angle": 15 }
{ "action": "camera", "tilt": "down", "angle": 10 }
{ "action": "camera", "tilt": "center" }
```

## Recording

```json
{ "action": "record", "state": "start" }
{ "action": "record", "state": "stop" }
```

## System

```json
{ "action": "status" }
{ "action": "emergency_stop" }
```

---

## Speed scale
0.1 = very slow, 0.5 = medium, 1.0 = full speed

## Rules
- `speed` is always 0.1 to 1.0
- `degrees` is always 0 to 360
- `angle` is always 0 to 45
- Unknown actions must be rejected with `{ "error": "unknown action" }`