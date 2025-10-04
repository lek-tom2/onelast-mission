from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import asyncio
import json
import time
from datetime import datetime, timedelta

app_ws = APIRouter()

class TimeFlowManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.is_time_running = False
        self.time_speed = 1.0  # 1x real time
        self.base_time = datetime.now()
        self.base_real_time = time.time()
        self._broadcast_task = None
        
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        
        # Send current state to new connection
        await self._send_to_websocket(websocket, {
            "type": "time_state",
            "is_running": self.is_time_running,
            "time_speed": self.time_speed,
            "current_time": self.get_current_time().isoformat()
        })
        
        print(f"New time controller connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"Time controller disconnected. Total: {len(self.active_connections)}")

    async def _send_to_websocket(self, websocket: WebSocket, message: dict):
        try:
            await websocket.send_text(json.dumps(message))
        except:
            self.disconnect(websocket)

    async def broadcast(self, message: dict):
        """Broadcast to all connected clients"""
        if not self.active_connections:
            return
            
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except:
                disconnected.append(connection)
        
        for connection in disconnected:
            self.disconnect(connection)

    # Time control methods
    def get_current_time(self) -> datetime:
        """Get current simulated time"""
        if not self.is_time_running:
            return self.base_time
            
        real_elapsed = time.time() - self.base_real_time
        simulated_elapsed = real_elapsed * self.time_speed
        return self.base_time + timedelta(seconds=simulated_elapsed)

    def start_time(self):
        """Start/resume time flow"""
        if not self.is_time_running:
            self.base_time = self.get_current_time()
            self.base_real_time = time.time()
            self.is_time_running = True
            print("Time started")

    def stop_time(self):
        """Pause time flow"""
        if self.is_time_running:
            self.base_time = self.get_current_time()
            self.is_time_running = False
            print("Time stopped")

    def set_time_speed(self, speed: float):
        """Set time speed multiplier"""
        if speed < 0:
            speed = 0
            
        # Capture current time before changing speed
        current_time = self.get_current_time()
        self.time_speed = speed
        self.base_time = current_time
        self.base_real_time = time.time()
        print(f"Time speed set to: {speed}x")

    def set_time(self, new_time: datetime):
        """Manually set the current time"""
        self.base_time = new_time
        self.base_real_time = time.time()
        print(f"Time set to: {new_time}")

    def fast_forward(self, hours: int = 1):
        """Fast forward time by specified hours"""
        current_time = self.get_current_time()
        new_time = current_time + timedelta(hours=hours)
        self.set_time(new_time)
        print(f"Fast forwarded {hours} hours")

# Global time manager instance
time_manager = TimeFlowManager()

async def _handle_time_command(message: dict, websocket: WebSocket):
    """Handle time control commands from WebSocket clients"""
    command = message.get("command")
    
    if command == "start":
        time_manager.start_time()
        await time_manager._send_to_websocket(websocket, {
            "type": "command_success",
            "command": "start",
            "message": "Time started"
        })
        
    elif command == "stop":
        time_manager.stop_time()
        await time_manager._send_to_websocket(websocket, {
            "type": "command_success", 
            "command": "stop",
            "message": "Time stopped"
        })
        
    elif command == "set_speed":
        speed = message.get("speed", 1.0)
        time_manager.set_time_speed(speed)
        await time_manager._send_to_websocket(websocket, {
            "type": "command_success",
            "command": "set_speed",
            "speed": speed,
            "message": f"Time speed set to {speed}x"
        })
        
    elif command == "set_time":
        time_str = message.get("time")
        if time_str:
            new_time = datetime.fromisoformat(time_str)
            time_manager.set_time(new_time)
            await time_manager._send_to_websocket(websocket, {
                "type": "command_success",
                "command": "set_time",
                "time": new_time.isoformat(),
                "message": f"Time set to {new_time}"
            })
            
    elif command == "fast_forward":
        hours = message.get("hours", 1)
        time_manager.fast_forward(hours)
        await time_manager._send_to_websocket(websocket, {
            "type": "command_success",
            "command": "fast_forward", 
            "hours": hours,
            "message": f"Fast forwarded {hours} hours"
        })
        
    elif command == "get_state":
        await time_manager._send_to_websocket(websocket, {
            "type": "time_state",
            "is_running": time_manager.is_time_running,
            "time_speed": time_manager.time_speed,
            "current_time": time_manager.get_current_time().isoformat()
        })
        
    elif command == "request_update":
        # Send time update when explicitly requested
        await time_manager._send_to_websocket(websocket, {
            "type": "time_update",
            "current_time": time_manager.get_current_time().isoformat(),
            "is_running": time_manager.is_time_running,
            "time_speed": time_manager.time_speed
        })
        
    else:
        await time_manager._send_to_websocket(websocket, {
            "type": "error",
            "message": f"Unknown command: {command}"
        })

# WebSocket endpoint for time control
@app_ws.websocket("/ws")
async def websocket_time_endpoint(websocket: WebSocket):
    await time_manager.connect(websocket)
    
    try:
        while True:
            # Wait for commands from client
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                await _handle_time_command(message, websocket)
                
            except json.JSONDecodeError:
                await time_manager._send_to_websocket(websocket, {
                    "type": "error",
                    "message": "Invalid JSON"
                })
            except Exception as e:
                await time_manager._send_to_websocket(websocket, {
                    "type": "error", 
                    "message": str(e)
                })
                
    except WebSocketDisconnect:
        time_manager.disconnect(websocket)

# HTTP endpoints for external control
@app_ws.get("/current")
async def get_current_time():
    return {
        "current_time": time_manager.get_current_time().isoformat(),
        "is_running": time_manager.is_time_running,
        "time_speed": time_manager.time_speed
    }

@app_ws.post("/start")
async def start_time():
    time_manager.start_time()
    return {"status": "started"}

@app_ws.post("/stop")
async def stop_time():
    time_manager.stop_time()
    return {"status": "stopped"}

@app_ws.post("/speed/{speed}")
async def set_speed(speed: float):
    time_manager.set_time_speed(speed)
    return {"status": "speed_set", "speed": speed}
