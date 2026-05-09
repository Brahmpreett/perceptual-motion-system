import time

def execute(command: dict):
    action = command.get("action")

    if action == "move":
        direction = command.get("direction", "forward")
        speed = command.get("speed", 0.5)
        power = int(speed * 100)

        if direction == "forward":
            print(f"[MOTORS] LEFT: {power}% forward | RIGHT: {power}% forward")
        elif direction == "backward":
            print(f"[MOTORS] LEFT: {power}% backward | RIGHT: {power}% backward")
        elif direction == "left":
            print(f"[MOTORS] LEFT: {power}% backward | RIGHT: {power}% forward")
        elif direction == "right":
            print(f"[MOTORS] LEFT: {power}% forward | RIGHT: {power}% backward")

    elif action == "stop":
        print("[MOTORS] ALL STOP")

    elif action == "rotate":
        direction = command.get("direction", "right")
        degrees = command.get("degrees", 90)
        duration = round(degrees / 90 * 0.8, 2)
        print(f"[MOTORS] ROTATE {direction.upper()} {degrees}° — estimated {duration}s")

    elif action == "transform":
        mode = command.get("mode", "folded")
        print(f"[SERVO] MAST {'DEPLOYING — extending to 4ft' if mode == 'deployed' else 'FOLDING — retracting to compact'}")
        time.sleep(1)
        print(f"[SERVO] Transform complete — mode: {mode.upper()}")

    elif action == "camera":
        tilt = command.get("tilt", "center")
        angle = command.get("angle", 0)
        if tilt == "center":
            print("[CAMERA] TILT — centering")
        else:
            print(f"[CAMERA] TILT {tilt.upper()} {angle}°")

    elif action == "record":
        state = command.get("state", "stop")
        print(f"[RECORDER] Recording {'STARTED' if state == 'start' else 'STOPPED'}")

    elif action == "status":
        print("[SYSTEM] Status: online | Battery: 100% | Mode: folded")

    elif action == "emergency_stop":
        print("[EMERGENCY] ALL SYSTEMS HALT")

    else:
        print(f"[ERROR] Unknown action: {action}")


if __name__ == "__main__":
    test_commands = [
        {"action": "move", "direction": "forward", "speed": 0.6},
        {"action": "move", "direction": "left", "speed": 0.3},
        {"action": "rotate", "direction": "right", "degrees": 90},
        {"action": "transform", "mode": "deployed"},
        {"action": "camera", "tilt": "up", "angle": 15},
        {"action": "record", "state": "start"},
        {"action": "emergency_stop"},
    ]

    for cmd in test_commands:
        print(f"\nCommand: {cmd}")
        execute(cmd)