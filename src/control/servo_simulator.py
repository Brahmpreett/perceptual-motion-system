# src/control/servo_simulator.py
import cv2
import pygame
import math

class ServoSimulator:
    def __init__(self, width=800, height=600):
        pygame.init()
        self.screen = pygame.display.set_mode((width, height))
        pygame.display.set_caption("Perceptual Motion System - Pan-Tilt Simulator")
        self.clock = pygame.time.Clock()
        
        self.pan_angle = 90
        self.tilt_angle = 90
        self.center_x = width // 2
        self.center_y = height // 2

    def update(self, pan_angle, tilt_angle):
        self.pan_angle = max(0, min(180, pan_angle))
        self.tilt_angle = max(30, min(150, tilt_angle))

    def draw(self, frame=None):
        self.screen.fill((20, 20, 40))
        
        # Draw base
        pygame.draw.rect(self.screen, (100, 100, 120), (self.center_x-80, self.center_y+100, 160, 30))
        
        # Draw pan-tilt arm
        arm_length = 120
        pan_rad = math.radians(self.pan_angle - 90)
        tilt_rad = math.radians(self.tilt_angle - 90)
        
        end_x = self.center_x + int(arm_length * math.cos(pan_rad))
        end_y = self.center_y - int(arm_length * math.sin(tilt_rad))
        
        pygame.draw.line(self.screen, (200, 200, 255), (self.center_x, self.center_y), (end_x, end_y), 12)
        pygame.draw.circle(self.screen, (255, 80, 80), (end_x, end_y), 25)  # camera head
        
        # Draw current angles
        font = pygame.font.SysFont(None, 28)
        text = font.render(f"Pan: {self.pan_angle:.1f}°   Tilt: {self.tilt_angle:.1f}°", True, (255, 255, 255))
        self.screen.blit(text, (20, 20))
        
        if frame is not None:
            # Optional: show small camera feed
            small = cv2.resize(frame, (160, 120))
            small = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)
            surf = pygame.surfarray.make_surface(small)
            self.screen.blit(surf, (self.center_x + 200, 50))
        
        pygame.display.flip()
        self.clock.tick(30)