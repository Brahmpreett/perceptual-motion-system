import asyncio
import websockets
import json

async def test():
    uri = "ws://127.0.0.1:8765/ws"

    async with websockets.connect(uri) as ws:

        commands = [
            {"nlp": "go forward slowly"},
            {"nlp": "turn right 90 degrees"},
            {"nlp": "unfold and stand up"},
            {"nlp": "tilt the camera up"},
            {"nlp": "start recording"},
            {"nlp": "stop everything"},
            {"nlp": "fold back down"},
            {"nlp": "emergency stop now"},
        ]

        for cmd in commands:
            await ws.send(json.dumps(cmd))
            response = json.loads(await ws.recv())
            print(f"Input:    {cmd['nlp']}")
            print(f"Command:  {response.get('command')}")
            print(f"Status:   {response.get('status')}")
            print("-" * 40)

asyncio.run(test())