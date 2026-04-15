# Perceptual Motion System

**Real-Time Human Motion Perception & Intelligent Pan-Tilt Tracking System**

A robust embedded computer vision project that detects human presence in real time, intelligently tracks movement using PID control, and automatically records high-quality video — built as a **capstone project** with practical applications in smart lecture capture, assistive monitoring, and human-robot interaction.


## ✨ Key Features

- **Real-Time Person Detection** using MobileNet-SSD (COCO-trained)
- **Smooth Pan-Tilt Tracking** with dual PID controllers for natural, jitter-free motion
- **Automatic Video Recording** — starts/stops intelligently on human presence
- **Live Dual Visualization**:
  - OpenCV live feed with bounding box & centroid overlay
  - Pygame-based pan-tilt simulator showing virtual camera head movement
- **High Performance** — Stable 19–21 FPS on laptop (optimized for Raspberry Pi 4 2GB)
- **Modular & Clean Architecture** ready for hardware deployment

## 🎯 Real-World Applications (Why This is Not Just a Toy)

- **Smart Lecture / Event Recording** — Automatically follows and records the speaker
- **Elderly Care / Assistive System** — Maintains visual contact and logs activity
- **Security & Surveillance Prototype** — Motion-triggered recording with tracking
- **Research Platform** for Human-Robot Interaction and Computer Vision studies
- **Telepresence** — Keeps remote participants visually centered

## 🛠️ Technology Stack

- **Language**: Python 3
- **Computer Vision**: OpenCV + MobileNet-SSD (DNN)
- **Control**: Custom PID Controller with tunable gains
- **Simulation**: Pygame for real-time pan-tilt visualization
- **Hardware Target**: Raspberry Pi 4 (2GB) + Pi Camera V2 + SG90 servos + pan-tilt bracket
- **Development Workflow**: VS Code + Git + Virtual Environment

## 📊 Performance Metrics (Laptop Development Phase)

| Metric                    | Value              | Status     |
|---------------------------|--------------------|------------|
| Average FPS               | 19–21 FPS          | Excellent  |
| Detection Confidence      | ≥ 0.55             | Stable     |
| Tracking Smoothness       | PID-tuned          | Smooth     |
| Recording Quality         | 640×480 @ 20 FPS   | Reliable   |
| System Response Latency   | Low                | Real-time  |

## 🚀 Quick Start (Development on Laptop)

1. Clone the repository:
   ```bash
   git clone https://github.com/Brahmpreett/perceptual-motion-system.git
   cd perceptual-motion-system
2. Create and activate virtual environment:Bashpython -m venv venv
    venv\Scripts\activate     # Windows
   # source venv/bin/activate # macOS/Linux
3. Install dependencies:Bashpip install -r requirements.txt
4. Download model files into models/ folder:
   deploy.prototxt
   mobilenet_iter_73000.caffemodel

5. Run the system:Bashpython src/main.py

Press q to quit. Move in front of the camera and watch the system track you intelligently!
📁 Project Structure
textperceptual-motion-system/
├── src/
│   ├── main.py                 # Main application loop
│   ├── vision/
│   │   └── detector.py         # Person detection logic
│   ├── control/
│   │   ├── pid.py              # PID controller
│   │   └── servo_simulator.py  # Visual pan-tilt simulation
│   └── utils/
│       └── config.py           # All tunable parameters
├── models/                     # MobileNet-SSD model files
├── data/recordings/            # Auto-generated videos
├── hardware/                   # Wiring notes & Pi deployment
├── docs/                       # Architecture & reports
└── README.md
🔮 Future Enhancements (Phase 2)

Kalman Filter for motion prediction (even smoother tracking)
Text overlays on recorded video (angles, FPS, timestamps)
Raspberry Pi deployment with real servo control via GPIO
Telegram alerts on motion detection
Gesture recognition using MediaPipe
Wheeled mobile base for true "following robot" behavior

👥 Team Members (Capstone Group)

Brahmpreet Singh – Team Lead & System Architect

Sagnik Mukherjee – AI & Motion Intelligence

Jaspinder Singh – Hardware & Integration

Sukhjot Singh – Prototyping & Deployment

Prathamjit Singh – Documentation & Research

Project Guide: Dr. Debabrata Ghosh and Dr. Shashikant	

Built with passion for intelligent systems
Perceptual Motion System – Making machines perceive and respond to human motion intelligently
