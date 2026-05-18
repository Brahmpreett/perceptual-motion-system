import math
from typing import List, Tuple, Optional, Dict, Any

class TargetTracker:
    def __init__(self, frame_width: int, frame_height: int):
        self.frame_width = frame_width
        self.frame_height = frame_height
        self.frame_center_x = frame_width // 2
        self.frame_center_y = frame_height // 2
        
        self.locked = False
        self.target_x = 0
        self.target_y = 0
        self.target_w = 0
        self.target_h = 0
        
        self.lost_frames = 0
        self.MAX_LOST_FRAMES = 15 # Allow 0.5s of occlusion before losing lock

        # Exponential Moving Average for smooth tracking
        self.alpha = 0.6 

    def _calculate_distance(self, x1, y1, x2, y2) -> float:
        return math.hypot(x2 - x1, y2 - y1)

    def update(self, boxes: List[Tuple[int, int, int, int]]) -> Dict[str, Any]:
        """
        Updates the tracker with new detections.
        Returns telemetry data.
        """
        if not boxes:
            self.lost_frames += 1
            if self.lost_frames > self.MAX_LOST_FRAMES:
                self.locked = False
            return self.get_telemetry()

        best_box = None

        if not self.locked:
            # If not locked, lock onto the largest bounding box (closest person)
            max_area = 0
            for (x, y, w, h) in boxes:
                area = w * h
                if area > max_area:
                    max_area = area
                    best_box = (x, y, w, h)
        else:
            # If locked, find the box closest to our current tracked position
            min_dist = float('inf')
            for (x, y, w, h) in boxes:
                cx = x + w // 2
                cy = y + h // 2
                dist = self._calculate_distance(self.target_x, self.target_y, cx, cy)
                # Ensure the person didn't teleport (sanity check)
                if dist < min_dist and dist < min(self.frame_width, self.frame_height) * 0.4:
                    min_dist = dist
                    best_box = (x, y, w, h)
            
            # If we lost the tracked person but others exist, fallback to largest
            if best_box is None:
                max_area = 0
                for (x, y, w, h) in boxes:
                    area = w * h
                    if area > max_area:
                        max_area = area
                        best_box = (x, y, w, h)

        if best_box:
            x, y, w, h = best_box
            cx = x + w // 2
            cy = y + h // 2
            
            if not self.locked:
                self.target_x = cx
                self.target_y = cy
                self.target_w = w
                self.target_h = h
                self.locked = True
            else:
                # Smooth the coordinates
                self.target_x = int(self.alpha * cx + (1 - self.alpha) * self.target_x)
                self.target_y = int(self.alpha * cy + (1 - self.alpha) * self.target_y)
                self.target_w = int(self.alpha * w + (1 - self.alpha) * self.target_w)
                self.target_h = int(self.alpha * h + (1 - self.alpha) * self.target_h)
            
            self.lost_frames = 0
        else:
            self.lost_frames += 1
            if self.lost_frames > self.MAX_LOST_FRAMES:
                self.locked = False

        return self.get_telemetry()

    def get_telemetry(self) -> Dict[str, Any]:
        return {
            "locked": self.locked,
            "target_x": self.target_x,
            "target_y": self.target_y,
            "target_w": self.target_w,
            "target_h": self.target_h,
            "frame_center_x": self.frame_center_x,
            "frame_center_y": self.frame_center_y,
            "offset_x": self.target_x - self.frame_center_x if self.locked else 0,
            "offset_y": self.target_y - self.frame_center_y if self.locked else 0,
            "area_ratio": (self.target_w * self.target_h) / (self.frame_width * self.frame_height) if self.locked else 0
        }
