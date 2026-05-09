from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from src.brain.interpreter import interpret
import json

app = FastAPI()

VALID_ACTIONS = [
    "move", "stop", "rotate", "transform",
    "camera", "record", "status", "emergency_stop"
]

def validate_command(data: dict) -> dict:
    if "action" not in data:
        return {"error": "missing action field"}
    if data["action"] not in VALID_ACTIONS:
        return {"error": f"unknown action: {data['action']}"}
    return {"status": "ok", "received": data}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("App connected")
    try:
        while True:
            raw = await websocket.receive_text()
            print(f"Received: {raw}")

            try:
                data = json.loads(raw)

                if "nlp" in data:
                    print(f"NLP command: {data['nlp']}")
                    command = interpret(data["nlp"])
                    print(f"Brain output: {command}")
                    response = validate_command(command)
                    response["nlp_input"] = data["nlp"]
                    response["interpreted"] = command
                else:
                    response = validate_command(data)

            except json.JSONDecodeError:
                response = {"error": "invalid JSON"}

            await websocket.send_text(json.dumps(response))
            print(f"Sent: {response}")

    except WebSocketDisconnect:
        print("App disconnected")