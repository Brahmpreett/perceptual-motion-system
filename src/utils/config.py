# src/utils/config.py
"""
Optimized Configuration for Perceptual Motion System Capstone
"""

# Camera settings
CAMERA_INDEX = 0
FRAME_WIDTH = 640
FRAME_HEIGHT = 480
DETECTION_SCALE = 0.5               # Keep 0.5 for speed

# Pan-Tilt limits
PAN_MIN = 0
PAN_MAX = 180
TILT_MIN = 30
TILT_MAX = 150
PAN_CENTER = 90
TILT_CENTER = 90

# Tuned PID gains (based on your 20+ FPS run)
KP = 0.25
KI = 0.006
KD = 0.18

# Detection
CONFIDENCE_THRESHOLD = 0.55
PERSON_CLASS_ID = 15

# Recording
RECORD_ON_DETECTION = True
OUTPUT_FPS = 20
VIDEO_OUTPUT_DIR = "data/recordings"

# Performance
SHOW_FPS = True