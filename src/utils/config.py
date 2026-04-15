# src/utils/config.py
# Configuration for Perceptual Motion System Capstone

# Camera settings (for laptop webcam testing)
CAMERA_INDEX = 0                    # 0 = default laptop webcam
FRAME_WIDTH = 640
FRAME_HEIGHT = 480
DETECTION_RESOLUTION = (320, 240)   # Lower res for faster detection

# Pan-Tilt simulation angles (for laptop)
MIN_ANGLE = 0
MAX_ANGLE = 180
CENTER_ANGLE = 90

# PID constants (we will tune these later)
KP = 0.15
KI = 0.01
KD = 0.08

# Detection confidence
CONFIDENCE_THRESHOLD = 0.5

# Recording settings
RECORD_ON_DETECTION = True
OUTPUT_VIDEO_FPS = 20