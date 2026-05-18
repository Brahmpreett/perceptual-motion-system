import cv2
import asyncio
import time
import json
from src.vision.detector import PersonDetector
from src.vision.tracker import TargetTracker

class CameraStreamer:
    def __init__(self):
        self.cap = None
        self.detector = None
        self.tracker = None
        self.autonomous_mode = False
        
        # We share this queue with axis_core to send commands to the motor/websocket
        self.command_queue = asyncio.Queue()
        
        self.frame_bytes = None
        self.running = False
        self.last_command_time = 0
        
        # Deadzones for autonomous logic
        self.PAN_DEADZONE = 50
        self.TILT_DEADZONE = 40
        self.TARGET_AREA_MIN = 0.15 # Move forward if smaller than 15% of frame
        self.TARGET_AREA_MAX = 0.40 # Move backward if larger than 40% of frame

    def start_camera(self):
        self.cap = cv2.VideoCapture(0)
        # Try to set 720p or 480p for performance
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        
        width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        self.detector = PersonDetector(confidence_threshold=0.55)
        self.tracker = TargetTracker(frame_width=width, frame_height=height)
        self.is_streaming = True

    def stop_camera(self):
        self.is_streaming = False
        if self.cap:
            self.cap.release()
            self.cap = None

    def set_camera_power(self, power_on: bool):
        if power_on and not getattr(self, 'is_streaming', False):
            self.start_camera()
        elif not power_on and getattr(self, 'is_streaming', False):
            self.stop_camera()

    def stop(self):
        self.running = False
        self.stop_camera()

    def set_autonomous(self, enabled: bool):
        self.autonomous_mode = enabled
        if not enabled:
            # If turning off, ensure robot stops
            self.command_queue.put_nowait({"action": "stop", "direction": "STOP", "speed": 0})

    def _generate_autonomous_commands(self, telemetry):
        now = time.time()
        # Throttle commands to 5Hz to avoid flooding motor driver
        if now - self.last_command_time < 0.2:
            return

        if not telemetry["locked"]:
            # Target lost - enter scan mode
            # For safety, just stop
            self.command_queue.put_nowait({"action": "stop", "direction": "STOP", "speed": 0})
            self.last_command_time = now
            return

        offset_x = telemetry["offset_x"]
        offset_y = telemetry["offset_y"]
        area = telemetry["area_ratio"]

        pan_speed = 0.0
        tilt_speed = 0.0

        if offset_x > self.PAN_DEADZONE:
            pan_speed = round(min(0.6, abs(offset_x) / 300.0), 2)
        elif offset_x < -self.PAN_DEADZONE:
            pan_speed = round(-min(0.6, abs(offset_x) / 300.0), 2)

        if offset_y > self.TILT_DEADZONE:
            tilt_speed = round(-min(0.6, abs(offset_y) / 300.0), 2)  # Negative is up
        elif offset_y < -self.TILT_DEADZONE:
            tilt_speed = round(min(0.6, abs(offset_y) / 300.0), 2)   # Positive is down

        if pan_speed != 0 or tilt_speed != 0:
            cam_cmd = {"action": "camera", "pan": pan_speed, "tilt": tilt_speed}
            self.command_queue.put_nowait(cam_cmd)
        else:
            self.command_queue.put_nowait({"action": "camera", "pan": 0.0, "tilt": 0.0})

        self.last_command_time = now

    def _draw_hud(self, frame, telemetry, fps):
        h, w = frame.shape[:2]
        cx, cy = w // 2, h // 2

        # Draw crosshair
        cv2.line(frame, (cx, 0), (cx, h), (0, 255, 0) if telemetry["locked"] else (100, 100, 100), 1)
        cv2.line(frame, (0, cy), (w, cy), (0, 255, 0) if telemetry["locked"] else (100, 100, 100), 1)

        # Draw HUD text
        cv2.putText(frame, f"FPS: {fps}", (10, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        
        mode_text = "AUTO: ON" if self.autonomous_mode else "AUTO: OFF"
        color = (0, 255, 255) if self.autonomous_mode else (200, 200, 200)
        cv2.putText(frame, mode_text, (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

        if telemetry["locked"]:
            tx, ty = telemetry["target_x"], telemetry["target_y"]
            tw, th = telemetry["target_w"], telemetry["target_h"]
            
            # Draw bounding box
            cv2.rectangle(frame, (tx - tw//2, ty - th//2), (tx + tw//2, ty + th//2), (0, 255, 0), 2)
            
            # Draw tracking line from center to target
            cv2.line(frame, (cx, cy), (tx, ty), (0, 255, 255), 1)
            cv2.circle(frame, (tx, ty), 4, (0, 0, 255), -1)
            
            cv2.putText(frame, "TARGET LOCKED", (tx - tw//2, ty - th//2 - 10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        else:
            if self.autonomous_mode:
                cv2.putText(frame, "TARGET LOST - SCANNING", (cx - 100, cy - 20), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

    async def update_loop(self):
        self.running = True
        self.start_camera()
        prev_time = time.time()
        
        # Use asyncio.sleep to yield to other tasks
        while self.running:
            if not getattr(self, 'is_streaming', False):
                await asyncio.sleep(0.5)
                continue
            ret, frame = self.cap.read()
            if not ret:
                await asyncio.sleep(0.1)
                continue
                
            curr_time = time.time()
            fps = int(1 / (curr_time - prev_time + 0.001))
            prev_time = curr_time

            # Downsample for faster detection if needed, or run directly
            boxes = self.detector.detect(frame)
            telemetry = self.tracker.update(boxes)
            
            if self.autonomous_mode:
                self._generate_autonomous_commands(telemetry)

            # Draw HUD
            self._draw_hud(frame, telemetry, fps)

            # Encode frame to JPEG
            ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
            if ret:
                self.frame_bytes = buffer.tobytes()

            await asyncio.sleep(0.01) # Yield to event loop

    async def get_stream(self):
        # Initial blank frame just to keep stream alive
        blank = b'--frame\r\nContent-Type: image/jpeg\r\n\r\n\r\n'
        while self.running:
            if not getattr(self, 'is_streaming', False):
                await asyncio.sleep(0.5)
                # Keep stream connection alive but send blank/empty or just wait
                # yielding empty frame or holding connection works for multipart
                continue

            if self.frame_bytes:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + self.frame_bytes + b'\r\n')
            await asyncio.sleep(0.03) # Limit stream to ~30fps

streamer = CameraStreamer()
