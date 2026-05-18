import os
from pathlib import Path
from typing import List, Tuple
from ultralytics import YOLO
import numpy as np

class PersonDetector:
    def __init__(self, confidence_threshold: float = 0.5):
        self.confidence_threshold = confidence_threshold
        
        project_root = Path(__file__).resolve().parents[2]
        model_dir = project_root / "models"
        model_dir.mkdir(parents=True, exist_ok=True)
        model_path = model_dir / "yolov8n.pt"

        # YOLO will automatically download the weights to the path if they don't exist in the current directory.
        # To strictly enforce our path, we initialize it passing the absolute path.
        self.model = YOLO(str(model_path))

    def detect(self, frame: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        Detect persons in the provided frame using YOLOv8.
        Returns list of (x, y, w, h) boxes.
        """
        if frame is None:
            return []

        # Run inference (classes=0 filters only 'person')
        results = self.model.predict(
            source=frame, 
            conf=self.confidence_threshold, 
            classes=[0], 
            verbose=False,
            device='cpu' # Using CPU to ensure compatibility across all PC hardware
        )

        boxes_list = []
        for result in results:
            boxes = result.boxes
            for box in boxes:
                # get box coordinates in (left, top, right, bottom) format
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
                w = x2 - x1
                h = y2 - y1
                boxes_list.append((x1, y1, w, h))

        return boxes_list