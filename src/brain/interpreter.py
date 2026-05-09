import json
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """
You are the navigation brain of AXIS, an autonomous robotic camera platform.

Your only job is to convert a user's plain English instruction into a single valid JSON command.

Valid command schema:

Movement:
{"action": "move", "direction": "forward", "speed": 0.6}
{"action": "move", "direction": "backward", "speed": 0.4}
{"action": "move", "direction": "left", "speed": 0.5}
{"action": "move", "direction": "right", "speed": 0.5}
{"action": "stop"}

Rotation:
{"action": "rotate", "direction": "left", "degrees": 90}
{"action": "rotate", "direction": "right", "degrees": 45}

Transform:
{"action": "transform", "mode": "folded"}
{"action": "transform", "mode": "deployed"}

Camera:
{"action": "camera", "tilt": "up", "angle": 15}
{"action": "camera", "tilt": "down", "angle": 10}
{"action": "camera", "tilt": "center"}

Recording:
{"action": "record", "state": "start"}
{"action": "record", "state": "stop"}

System:
{"action": "status"}
{"action": "emergency_stop"}

Speed scale: 0.1 = very slow, 0.5 = medium, 1.0 = full speed
Degrees: 0 to 360
Angle: 0 to 45

Rules:
- Respond with ONLY the JSON object. No explanation, no extra text.
- If the instruction is unclear, default to {"action": "stop"}
- If the user says something dangerous, respond with {"action": "emergency_stop"}
- Infer speed from words like "slowly", "fast", "gently", "quickly"
- Infer direction from natural language like "go ahead", "back up", "turn right"
"""

def interpret(command: str) -> dict:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=100,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": command}
        ]
    )

    raw = response.choices[0].message.content.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"error": "brain returned invalid JSON", "raw": raw}


if __name__ == "__main__":
    test_phrases = [
        "go forward slowly",
        "back up a little",
        "turn right 90 degrees",
        "start recording",
        "stop everything now",
        "unfold and stand up",
        "tilt the camera up a bit",
        "go towards the door quickly",
        "gently move to the left",
        "fold back down",
    ]

    for phrase in test_phrases:
        result = interpret(phrase)
        print(f"Input:  {phrase}")
        print(f"Output: {result}")
        print("-" * 40)