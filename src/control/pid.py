# src/control/pid.py
class PIDController:
    def __init__(self, kp=0.18, ki=0.005, kd=0.12):
        self.kp = kp
        self.ki = ki
        self.kd = kd
        self.prev_error = 0
        self.integral = 0

    def compute(self, error, dt=0.033):  # ~30 FPS
        self.integral += error * dt
        derivative = (error - self.prev_error) / dt
        output = self.kp * error + self.ki * self.integral + self.kd * derivative
        self.prev_error = error
        return output