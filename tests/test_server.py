import asyncio
import websockets
import json

async def test():
    uri = "ws://127.0.0.1:8765/ws"

    async with websockets.connect(uri) as ws:

        tests = [
            {"action": "move", "direction": "forward", "speed": 0.6},
            {"action": "stop"},
            {"nlp": "go forward slowly"},
            {"nlp": "start recording"},
            {"nlp": "unfold and stand up"},
            {"nlp": "back up quickly"},
        ]

        for command in tests:
            await ws.send(json.dumps(command))
            response = await ws.recv()
            print(f"Sent:     {command}")
            print(f"Response: {json.loads(response)}")
            print("-" * 40)

asyncio.run(test())