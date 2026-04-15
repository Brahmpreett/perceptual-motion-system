# src/main.py
import cv2
from pathlib import Path
from datetime import datetime
import pygame

# Absolute imports (recommended for capstone)
from src.utils.config import *
from src.vision.detector import PersonDetector
from src.control.pid import PIDController
from src.control.servo_simulator import ServoSimulator


def main():
    # Create output directory
    Path("data/recordings").mkdir(parents=True, exist_ok=True)

    cap = cv2.VideoCapture(CAMERA_INDEX)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, FRAME_WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT)

    detector = PersonDetector()
    pid_pan = PIDController(KP, KI, KD)
    pid_tilt = PIDController(KP, KI, KD)
    simulator = ServoSimulator()

    # Video writer setup
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = None
    recording = False
    video_writer = None

    print("=== Perceptual Motion System Started ===")
    print("Move in front of the camera. Press 'q' to quit.\n")

    fps_start_time = datetime.now()
    frame_count = 0
    last_fps_print = datetime.now()

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Detection on downscaled frame for speed
            small_frame = cv2.resize(frame, None, fx=DETECTION_SCALE, fy=DETECTION_SCALE)
            persons = detector.detect(small_frame)

            current_pan = PAN_CENTER
            current_tilt = TILT_CENTER

            if persons:
                # Take the largest detected person
                x, y, w, h = max(persons, key=lambda b: b[2] * b[3])
                cx = x + w // 2
                cy = y + h // 2

                # Error from center
                err_x = cx - (small_frame.shape[1] // 2)
                err_y = cy - (small_frame.shape[0] // 2)

                # PID control
                pan_delta = pid_pan.compute(err_x)
                tilt_delta = pid_tilt.compute(err_y)

                current_pan = PAN_CENTER + pan_delta * 0.8
                current_tilt = TILT_CENTER + tilt_delta * 0.6

                # Draw tracking visuals on main frame
                scale = 1 / DETECTION_SCALE
                cv2.rectangle(frame,
                              (int(x * scale), int(y * scale)),
                              (int((x + w) * scale), int((y + h) * scale)),
                              (0, 255, 0), 3)
                cv2.circle(frame, (int(cx * scale), int(cy * scale)), 8, (0, 0, 255), -1)

                # Start recording on first detection
                if RECORD_ON_DETECTION and not recording:
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    video_path = f"data/recordings/motion_{timestamp}.mp4"
                    out = cv2.VideoWriter(video_path, fourcc, OUTPUT_FPS, (FRAME_WIDTH, FRAME_HEIGHT))
                    recording = True
                    print(f"🎥 Recording started: {video_path}")

            # Update and draw simulator (visual pan-tilt response)
            simulator.update(current_pan, current_tilt)
            simulator.draw(frame)   # simulator will show small feed if implemented

            # Write frame if recording
            if recording and out is not None:
                out.write(frame)

            # Show live feed
            cv2.imshow("Perceptual Motion System - Live Feed", frame)
            
            frame_count += 1
            if frame_count % 30 == 0:
                elapsed = (datetime.now() - fps_start_time).total_seconds()
                if elapsed > 0:
                    fps = frame_count / elapsed
                    print(f"FPS: {fps:.1f}")

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    finally:
        # Clean shutdown
        cap.release()
        if out is not None:
            out.release()
            print("Recording saved successfully.")
        cv2.destroyAllWindows()
        pygame.quit()
        print("System shutdown complete.")


if __name__ == "__main__":
    main()