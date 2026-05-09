import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from src.brain.interpreter import interpret
from src.control.mock_driver import execute

app = FastAPI()

VALID_ACTIONS = [
    "move", "stop", "rotate", "transform",
    "camera", "record", "status", "emergency_stop"
]

def validate_command(data: dict) -> dict:
    if "action" not in data:
        return None, {"error": "missing action field"}
    if data["action"] not in VALID_ACTIONS:
        return None, {"error": f"unknown action: {data['action']}"}
    return data, {"status": "ok"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("\n[AXIS] Controller connected")
    print("[AXIS] Awaiting commands...\n")

    try:
        while True:
            raw = await websocket.receive_text()

            try:
                data = json.loads(raw)

                if "nlp" in data:
                    user_input = data["nlp"]
                    print(f"[BRAIN] Input: \"{user_input}\"")

                    command = interpret(user_input)
                    print(f"[BRAIN] Interpreted: {command}")

                    validated, response = validate_command(command)

                    if validated:
                        await asyncio.get_event_loop().run_in_executor(
                            None, execute, validated
                        )
                        response["nlp_input"] = user_input
                        response["command"] = command
                    else:
                        print(f"[BRAIN] Validation failed: {response}")

                else:
                    validated, response = validate_command(data)
                    if validated:
                        await asyncio.get_event_loop().run_in_executor(
                            None, execute, validated
                        )
                        response["command"] = data

            except json.JSONDecodeError:
                response = {"error": "invalid JSON"}

            await websocket.send_text(json.dumps(response))
            print()

    except WebSocketDisconnect:
        print("[AXIS] Controller disconnected")