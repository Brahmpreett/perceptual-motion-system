from pathlib import Path
from typing import List, Tuple
import cv2
import numpy as np

class PersonDetector:
    def __init__(self, confidence_threshold: float = 0.5):
        self.confidence_threshold = confidence_threshold

        project_root = Path(__file__).resolve().parents[2]
        model_dir = project_root / "models"
        proto_path = model_dir / "deploy.prototxt"
        model_path = model_dir / "mobilenet_iter_73000.caffemodel"

        if proto_path.exists() and model_path.exists():
            # Use Caffe/MobileNet-SSD
            self.use_dnn = True
            self.net = cv2.dnn.readNetFromCaffe(str(proto_path), str(model_path))
        else:
            # Fallback to HOG person detector (works without external files)
            self.use_dnn = False
            self.hog = cv2.HOGDescriptor()
            self.hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
            # Informative - no exception so program can continue
            print("Warning: Caffe model files not found in 'models/'. Falling back to HOG detector.")

    def detect(self, frame: np.ndarray) -> List[Tuple[int,int,int,int]]:
        """
        Detect persons in the provided frame.
        Returns list of (x, y, w, h) boxes in the same coordinate space as `frame`.
        """
        if frame is None:
            return []

        h, w = frame.shape[:2]

        if self.use_dnn:
            # Prepare blob and run forward pass
            blob = cv2.dnn.blobFromImage(frame, 0.007843, (300, 300), 127.5)
            self.net.setInput(blob)
            detections = self.net.forward()
            boxes = []
            for i in range(detections.shape[2]):
                confidence = float(detections[0, 0, i, 2])
                if confidence > self.confidence_threshold:
                    class_id = int(detections[0, 0, i, 1])
                    if class_id == 15:  # person class in MobileNet-SSD
                        box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
                        x1, y1, x2, y2 = box.astype(int)
                        # clamp and convert to (x,y,w,h)
                        x1, y1 = max(0, x1), max(0, y1)
                        x2, y2 = min(w-1, x2), min(h-1, y2)
                        boxes.append((x1, y1, x2 - x1, y2 - y1))
            return boxes
        else:
            # HOG detector - returns rectangles directly
            rects, weights = self.hog.detectMultiScale(frame, winStride=(4,4), padding=(8,8), scale=1.05)
            boxes = []
            for (x, y, rw, rh) in rects:
                boxes.append((int(x), int(y), int(rw), int(rh)))
            return boxes