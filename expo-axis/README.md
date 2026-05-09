# AXIS Expo Controller

React Native Expo Go app for AXIS, an autonomous robotic camera platform. The app connects to a Raspberry Pi 4 FastAPI WebSocket server at:

```text
ws://[robot-ip]:8765/ws
```

## Run

```sh
npm install
npm start
```

Open the project in Expo Go, enter the robot IP address on the connection screen, then connect.

## Features

- Connection screen with robot IP input, connect/disconnect action, and green/red status indicator.
- Control screen with live camera feed placeholder, battery and connection status, emergency stop, record toggle, transform toggle, status command, speed slider, NLP command bar, and two joysticks.
- Left joystick streams movement commands while held and sends `{"action":"stop"}` on release.
- Right joystick maps horizontal input to rotate commands and vertical input to camera tilt commands.
- Settings screen for robot IP, video quality, and control sensitivity.
- Zustand-backed app state and reconnecting WebSocket transport.
- NativeWind dark theme with custom React Native joystick and slider controls.

## Command Mapping

- Movement: `{"action":"move","direction":"forward/backward/left/right","speed":0.1-1.0}`
- Stop: `{"action":"stop"}`
- Rotate: `{"action":"rotate","direction":"left/right","degrees":0-360}`
- Camera tilt: `{"action":"camera","tilt":"up/down/center","angle":0-45}`
- Record: `{"action":"record","state":"start/stop"}`
- Transform: `{"action":"transform","mode":"folded/deployed"}`
- NLP: `{"nlp":"plain english command here"}`
- Emergency stop: `{"action":"emergency_stop"}`
- Status: `{"action":"status"}`
