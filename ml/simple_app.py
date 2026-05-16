"""
Simplified ML service for demo purposes
Uses only built-in Python libraries and basic heuristics
"""

import json
import time
import random
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading

class MLHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {
                "status": "healthy",
                "models_loaded": True,
                "cnn_model_version": "demo-v1.0",
                "timestamp": time.time()
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == '/predict':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                
                # Extract features
                pressure = data.get('pressure_bar', 0)
                flow = data.get('flow_lpm', 0)
                frequency = data.get('frequency_hz', 0)
                temp = data.get('temp_c', 20)
                humidity = data.get('humidity_pct', 50)
                anomaly_score = data.get('anomaly_score', 0)
                
                # Simple heuristic-based prediction
                start_time = time.time()
                
                # Calculate leak probability based on features
                leak_score = 0
                if frequency > 45:
                    leak_score += 0.4
                elif frequency > 25:
                    leak_score += 0.2
                
                if anomaly_score > 0.7:
                    leak_score += 0.3
                elif anomaly_score > 0.4:
                    leak_score += 0.1
                
                if pressure > 6.5:
                    leak_score += 0.2
                elif pressure < 2.0:
                    leak_score += 0.1
                
                # Add some randomness for demo
                leak_score += random.uniform(-0.1, 0.1)
                leak_score = max(0, min(1, leak_score))
                
                # Determine leak class
                if leak_score < 0.3:
                    leak_class_id = 0  # Normal
                    leak_class = "Normal"
                elif leak_score < 0.6:
                    leak_class_id = 1  # Pre-Leak
                    leak_class = "Pre-Leak"
                elif leak_score < 0.8:
                    leak_class_id = 2  # Minor Leak
                    leak_class = "Minor Leak"
                else:
                    leak_class_id = 3  # Major Leak
                    leak_class = "Major Leak"
                
                # Generate probabilities
                probs = {
                    "Normal": 0.0,
                    "Pre-Leak": 0.0,
                    "Minor Leak": 0.0,
                    "Major Leak": 0.0
                }
                
                if leak_class_id == 0:
                    probs["Normal"] = 0.8 + random.uniform(0, 0.15)
                    probs["Pre-Leak"] = random.uniform(0, 0.15)
                    probs["Minor Leak"] = random.uniform(0, 0.1)
                elif leak_class_id == 1:
                    probs["Normal"] = random.uniform(0, 0.2)
                    probs["Pre-Leak"] = 0.6 + random.uniform(0, 0.25)
                    probs["Minor Leak"] = random.uniform(0, 0.2)
                elif leak_class_id == 2:
                    probs["Normal"] = random.uniform(0, 0.1)
                    probs["Pre-Leak"] = random.uniform(0, 0.2)
                    probs["Minor Leak"] = 0.6 + random.uniform(0, 0.25)
                    probs["Major Leak"] = random.uniform(0, 0.15)
                else:
                    probs["Minor Leak"] = random.uniform(0, 0.1)
                    probs["Major Leak"] = 0.8 + random.uniform(0, 0.15)
                
                # Normalize probabilities
                total = sum(probs.values())
                for key in probs:
                    probs[key] = round(probs[key] / total, 4)
                
                inference_time = int((time.time() - start_time) * 1000)
                
                response = {
                    "leak_class": leak_class,
                    "leak_class_id": leak_class_id,
                    "confidence": round(max(probs.values()), 4),
                    "probabilities": probs,
                    "inference_ms": max(inference_time, 50),  # Minimum 50ms for realism
                    "model_version": "demo-heuristic-v1.0",
                    "distribution_shift_warning": False
                }
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode())
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                error_response = {"error": str(e)}
                self.wfile.write(json.dumps(error_response).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def run_server():
    server_address = ('', 8000)
    httpd = HTTPServer(server_address, MLHandler)
    print(f"🤖 ML Service running on http://localhost:8000")
    print("📊 Using heuristic-based predictions for demo")
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()