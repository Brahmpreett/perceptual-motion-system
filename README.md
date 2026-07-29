# AXIS

### Autonomous Voice-Controlled Transformable Intelligent System

> *A modular autonomous robotic platform that can perceive, navigate, interact, and continuously evolve through AI.*

![Python](https://img.shields.io/badge/Python-3.11-blue)
![ROS2](https://img.shields.io/badge/ROS2-Humble-22314E)
![OpenCV](https://img.shields.io/badge/OpenCV-Computer%20Vision-green)
![YOLO](https://img.shields.io/badge/YOLO-Detection-red)
![LLM](https://img.shields.io/badge/LLM-Agent-orange)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## Overview

AXIS is an attempt to build a **general-purpose AI robotics platform** rather than another task-specific robot.

The long-term vision is to create a robot capable of understanding natural language, perceiving the physical world, making autonomous decisions, and interacting with humans through speech.

Instead of tightly coupling every feature, AXIS follows a modular architecture where perception, planning, control, navigation, reasoning, and communication operate as independent systems connected by shared intelligence.

The project is designed as a long-term engineering journey—from a simple voice-controlled crawler to a highly capable autonomous robotic platform.

---

## Vision

Current AI understands the digital world.

Current robots understand only tiny portions of the physical world.

AXIS aims to bridge those two domains.

The goal isn't simply to build another robot.

The goal is to build a system capable of

* Seeing
* Listening
* Speaking
* Moving
* Understanding
* Learning
* Making decisions
* Executing actions autonomously

---

## Core Capabilities

### Voice Intelligence

* Natural language conversations
* Wake-word activation
* Offline command execution
* LLM-based reasoning
* Multi-step task planning

---

### Computer Vision

* Real-time object detection
* Face recognition
* Hand gesture recognition
* Scene understanding
* Object tracking

---

### Autonomous Navigation

* SLAM
* Obstacle avoidance
* Path planning
* Mapping
* Localization

---

### Robotics Control

* Differential drive control
* Servo manipulation
* Camera gimbal control
* Motor control
* Sensor fusion

---

### AI Agent

Instead of executing isolated commands, AXIS is designed around an AI agent that reasons before acting.

Example:

> "Find my backpack, bring the camera closer, and tell me whether my laptop is on the table."

The agent decomposes the request into multiple robotic actions before execution.

---

## Architecture

```
                   Voice Input
                        │
                Speech Recognition
                        │
                 Language Model
                        │
         Task Planning & Decision Engine
        ┌───────────────┼───────────────┐
        │               │               │
 Computer Vision   Navigation     Motion Control
        │               │               │
        └───────────────┼───────────────┘
                        │
                  Physical Robot
```

---

## Project Roadmap

### Phase 0

Blueprint

* System architecture
* Component research
* Hardware selection
* Software stack
* Simulation

---

### Phase 1

Crawler

* Differential drive robot
* Camera streaming
* Voice control
* Manual navigation

---

### Phase 2

Perception

* Object detection
* Face recognition
* Gesture recognition
* Vision pipeline

---

### Phase 3

Autonomy

* SLAM
* Mapping
* Localization
* Autonomous navigation

---

### Phase 4

AI Agent

* Task decomposition
* Memory
* Tool calling
* Reasoning
* Planning

---

### Phase 5

General Intelligence

* Multi-modal understanding
* Long-term memory
* Learning from interaction
* Autonomous mission execution

---

## Tech Stack

### Robotics

* ROS2
* Arduino
* ESP32
* Raspberry Pi
* STM32

### AI

* OpenAI API
* Local LLMs
* Whisper
* YOLO
* OpenCV
* MediaPipe

### Backend

* Python
* FastAPI
* WebSockets

### Frontend

* React
* Tailwind CSS

### Infrastructure

* Docker
* GitHub Actions
* Linux

---

## Repository Structure

```
AXIS/

├── hardware/
│   ├── chassis/
│   ├── electronics/
│   └── CAD/
│
├── firmware/
│
├── robot/
│   ├── perception/
│   ├── navigation/
│   ├── planning/
│   ├── control/
│   ├── speech/
│   └── ai_agent/
│
├── backend/
│
├── frontend/
│
├── simulation/
│
├── docs/
│
└── README.md
```

---

## Guiding Principles

* Modular over monolithic
* Local-first whenever possible
* AI assists, robotics executes
* Every subsystem should be independently replaceable
* Build for scalability instead of quick demos

---

## Long-Term Goals

* Autonomous indoor navigation
* Multi-modal AI interaction
* Human-following
* Vision-language reasoning
* Robotic manipulation
* Edge AI deployment
* Multi-robot collaboration
* Continuous learning

---

## Why AXIS?

Most robotics projects demonstrate a single capability.

* A robot that follows a line.
* A robot that detects objects.
* A robot that responds to voice commands.

AXIS combines these capabilities into one continuously evolving platform where perception, reasoning, and physical execution work together.

The objective is not to create isolated demonstrations, but to build a foundation for increasingly capable autonomous robots.

---

## Status

Active Development

Current milestone:

* System architecture finalized
* Hardware planning completed
* Software stack defined
* Beginning implementation of the first autonomous crawler platform

---

## Author

**Brahmpreet Singh**

Electronics & Computer Engineering
Robotics • Physical AI • Full-Stack Development

*"The future of AI isn't confined to screens. It moves, perceives, and interacts with the physical world."*

