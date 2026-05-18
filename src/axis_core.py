import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from src.brain.interpreter import interpret
from src.control.mock_driver import execute
from src.vision.camera_streamer import streamer

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VALID_ACTIONS = [
    "move", "stop", "rotate", "transform",
    "camera", "record", "status", "emergency_stop",
    "set_autonomous", "set_camera_power"
]

active_connections = set()

def validate_command(data: dict) -> dict:
    if "action" not in data:
        return None, {"error": "missing action field"}
    if data["action"] not in VALID_ACTIONS:
        return None, {"error": f"unknown action: {data['action']}"}
    return data, {"status": "ok"}

@app.on_event("startup")
async def startup_event():
    # Start the camera background loop
    asyncio.create_task(streamer.update_loop())
    # Start the command queue broadcaster
    asyncio.create_task(broadcast_autonomous_commands())

@app.on_event("shutdown")
async def shutdown_event():
    streamer.stop()

async def broadcast_autonomous_commands():
    while True:
        cmd = await streamer.command_queue.get()
        # Execute the command on the mock driver
        await asyncio.get_event_loop().run_in_executor(None, execute, cmd)
        
        # Broadcast to all connected websockets
        if active_connections:
            msg = json.dumps({"type": "AUTO_RX", "command": cmd})
            for ws in list(active_connections):
                try:
                    await ws.send_text(msg)
                except:
                    active_connections.remove(ws)

@app.get("/video_feed")
async def video_feed():
    return StreamingResponse(
        streamer.get_stream(), 
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.add(websocket)
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
                        if validated["action"] == "set_autonomous":
                            streamer.set_autonomous(validated.get("enabled", False))
                            response["command"] = validated
                        elif validated["action"] == "set_camera_power":
                            streamer.set_camera_power(validated.get("enabled", True))
                            response["command"] = validated
                        else:
                            await asyncio.get_event_loop().run_in_executor(
                                None, execute, validated
                            )
                            response["command"] = data

            except json.JSONDecodeError:
                response = {"error": "invalid JSON"}

            await websocket.send_text(json.dumps(response))
            print()

    except WebSocketDisconnect:
        active_connections.remove(websocket)
        print("[AXIS] Controller disconnected")