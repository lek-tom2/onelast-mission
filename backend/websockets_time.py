from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict, Any
import asyncio
import json
import time
import math
from datetime import datetime, timedelta

app_ws = APIRouter()

class AsteroidSimulator:
    def __init__(self, orbital_data: Dict[str, Any]):
        self.orbital_data = orbital_data
        self.mu = 1.32712440018e20  # Standard gravitational parameter (m^3/s^2)
        self.au_to_m = 1.496e11  # 1 AU in meters
        
    def _convert_to_float(self, value):
        """Safely convert string values to float"""
        if isinstance(value, str):
            # Remove any whitespace and convert
            return float(value.strip())
        return float(value)
        
    def calculate_position(self, target_time: datetime) -> Dict[str, float]:
        """Calculate asteroid position at given time using orbital elements"""
        try:
            # Convert target time to Julian Date
            jd = self._datetime_to_julian(target_time)
            
            # Get orbital elements and convert to float
            a = self._convert_to_float(self.orbital_data['semi_major_axis']) * self.au_to_m
            e = self._convert_to_float(self.orbital_data['eccentricity'])
            i = math.radians(self._convert_to_float(self.orbital_data['inclination']))
            omega = math.radians(self._convert_to_float(self.orbital_data['ascending_node_longitude']))
            w = math.radians(self._convert_to_float(self.orbital_data['perihelion_argument']))
            T = self._convert_to_float(self.orbital_data['orbital_period'])
            
            # Calculate mean anomaly
            epoch_jd = 2461000.5  # Given epoch
            n = 2 * math.pi / (T * 86400)  # mean motion (rad/s)
            M = n * ((jd - epoch_jd) * 86400)  # mean anomaly
            
            # Solve Kepler's equation for eccentric anomaly
            E = self._solve_kepler(M, e)
            
            # Calculate true anomaly
            nu = 2 * math.atan2(math.sqrt(1 + e) * math.sin(E/2), math.sqrt(1 - e) * math.cos(E/2))
            
            # Calculate distance from central body
            r = a * (1 - e * math.cos(E))
            
            # Calculate position in orbital plane
            x_orb = r * math.cos(nu)
            y_orb = r * math.sin(nu)
            
            # Transform to ecliptic coordinates
            x_ecl = (x_orb * (math.cos(w) * math.cos(omega) - math.sin(w) * math.cos(i) * math.sin(omega)) -
                    y_orb * (math.sin(w) * math.cos(omega) + math.cos(w) * math.cos(i) * math.sin(omega)))
            y_ecl = (x_orb * (math.cos(w) * math.sin(omega) + math.sin(w) * math.cos(i) * math.cos(omega)) +
                    y_orb * (math.cos(w) * math.cos(i) * math.cos(omega) - math.sin(w) * math.sin(omega)))
            z_ecl = (x_orb * math.sin(w) + y_orb * math.cos(w)) * math.sin(i)
            
            # Convert to AU
            x_au = x_ecl / self.au_to_m
            y_au = y_ecl / self.au_to_m
            z_au = z_ecl / self.au_to_m
            
            return {
                'x': x_au,
                'y': y_au,
                'z': z_au,
                'distance_from_sun': r / self.au_to_m
            }
        except Exception as e:
            print(f"Error calculating position: {e}")
            # Return a default position in case of error
            return {
                'x': 0.0,
                'y': 0.0,
                'z': 0.0,
                'distance_from_sun': 1.0
            }
    
    def calculate_predicted_trajectory(self, start_time: datetime, steps: int = 50, step_days: int = 10) -> List[Dict[str, Any]]:
        """Calculate predicted trajectory points"""
        trajectory = []
        for step in range(steps):
            point_time = start_time + timedelta(days=step * step_days)
            try:
                position = self.calculate_position(point_time)
                trajectory.append({
                    'time': point_time.isoformat(),
                    'position': position,
                    'step': step
                })
            except Exception as e:
                print(f"Error calculating trajectory point {step}: {e}")
                continue
        return trajectory
    
    def _datetime_to_julian(self, dt: datetime) -> float:
        """Convert datetime to Julian Date"""
        # More accurate Julian Date calculation
        a = (14 - dt.month) // 12
        y = dt.year + 4800 - a
        m = dt.month + 12 * a - 3
        
        jd = (dt.day + 
              (153 * m + 2) // 5 + 
              365 * y + 
              y // 4 - 
              y // 100 + 
              y // 400 - 
              32045)
        jd += (dt.hour - 12) / 24.0 + dt.minute / 1440.0 + dt.second / 86400.0
        
        return jd
    
    def _solve_kepler(self, M: float, e: float, tolerance: float = 1e-12) -> float:
        """Solve Kepler's equation for eccentric anomaly using Newton's method"""
        # Normalize mean anomaly to [0, 2π)
        M = M % (2 * math.pi)
        
        E = M  # Initial guess
        for _ in range(50):  # Maximum iterations
            delta_E = (E - e * math.sin(E) - M) / (1 - e * math.cos(E))
            E -= delta_E
            if abs(delta_E) < tolerance:
                break
        return E

class TimeFlowManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.is_time_running = False
        self.time_speed = 1.0  # 1x real time
        self.base_time = datetime.now()
        self.base_real_time = time.time()
        
        # Initialize asteroid simulator with provided orbital data
        orbital_data = {
            "orbit_id": "17",
            "orbit_determination_date": "2025-09-26 06:51:54",
            "first_observation_date": "2008-09-21",
            "last_observation_date": "2025-09-25",
            "data_arc_in_days": 6213,
            "observations_used": 90,
            "orbit_uncertainty": "0",
            "minimum_orbit_intersection": ".0448952",
            "jupiter_tisserand_invariant": "6.296",
            "epoch_osculation": "2461000.5",
            "eccentricity": ".479246673866332",
            "semi_major_axis": ".9285116827289324",
            "inclination": "21.13952185099964",
            "ascending_node_longitude": "5.01672948424095",
            "orbital_period": "326.7980719532893",
            "perihelion_distance": ".4835255471350606",
            "perihelion_argument": "135.0294993466535",
            "aphelion_distance": "1.373497818322804",
            "perihelion_time": "2461028.290110242613",
            "mean_anomaly": "329.3864788505526",
            "mean_motion": "1.101597686449804",
            "equinox": "J2000"
        }
        
        self.asteroid_simulator = AsteroidSimulator(orbital_data)
        
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        
        # Send current state to new connection
        current_time = self.get_current_time()
        try:
            asteroid_position = self.asteroid_simulator.calculate_position(current_time)
            predicted_trajectory = self.asteroid_simulator.calculate_predicted_trajectory(current_time)
            
            await self._send_to_websocket(websocket, {
                "type": "initial_state",
                "is_running": self.is_time_running,
                "time_speed": self.time_speed,
                "current_time": current_time.isoformat(),
                "asteroid_position": asteroid_position,
                "predicted_trajectory": predicted_trajectory
            })
        except Exception as e:
            print(f"Error in connect: {e}")
            await self._send_to_websocket(websocket, {
                "type": "error",
                "message": f"Initialization error: {str(e)}"
            })
        
        print(f"New time controller connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"Time controller disconnected. Total: {len(self.active_connections)}")

    async def _send_to_websocket(self, websocket: WebSocket, message: dict):
        try:
            await websocket.send_text(json.dumps(message, default=str))
        except:
            self.disconnect(websocket)

    async def broadcast(self, message: dict):
        """Broadcast to all connected clients"""
        if not self.active_connections:
            return
            
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message, default=str))
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
    
    try:
        if command == "start":
            time_manager.start_time()
            current_time = time_manager.get_current_time()
            asteroid_position = time_manager.asteroid_simulator.calculate_position(current_time)
            predicted_trajectory = time_manager.asteroid_simulator.calculate_predicted_trajectory(current_time)
            
            await time_manager._send_to_websocket(websocket, {
                "type": "command_success",
                "command": "start",
                "message": "Time started",
                "current_time": current_time.isoformat(),
                "asteroid_position": asteroid_position,
                "predicted_trajectory": predicted_trajectory
            })
            
        elif command == "stop":
            time_manager.stop_time()
            current_time = time_manager.get_current_time()
            asteroid_position = time_manager.asteroid_simulator.calculate_position(current_time)
            
            await time_manager._send_to_websocket(websocket, {
                "type": "command_success", 
                "command": "stop",
                "message": "Time stopped",
                "current_time": current_time.isoformat(),
                "asteroid_position": asteroid_position
            })
            
        elif command == "set_speed":
            speed = message.get("speed", 1.0)
            time_manager.set_time_speed(speed)
            current_time = time_manager.get_current_time()
            asteroid_position = time_manager.asteroid_simulator.calculate_position(current_time)
            
            await time_manager._send_to_websocket(websocket, {
                "type": "command_success",
                "command": "set_speed",
                "speed": speed,
                "message": f"Time speed set to {speed}x",
                "current_time": current_time.isoformat(),
                "asteroid_position": asteroid_position
            })
            
        elif command == "set_time":
            time_str = message.get("time")
            if time_str:
                new_time = datetime.fromisoformat(time_str.replace('Z', '+00:00'))
                time_manager.set_time(new_time)
                asteroid_position = time_manager.asteroid_simulator.calculate_position(new_time)
                predicted_trajectory = time_manager.asteroid_simulator.calculate_predicted_trajectory(new_time)
                
                await time_manager._send_to_websocket(websocket, {
                    "type": "command_success",
                    "command": "set_time",
                    "time": new_time.isoformat(),
                    "message": f"Time set to {new_time}",
                    "asteroid_position": asteroid_position,
                    "predicted_trajectory": predicted_trajectory
                })
                
        elif command == "fast_forward":
            hours = message.get("hours", 1)
            time_manager.fast_forward(hours)
            current_time = time_manager.get_current_time()
            asteroid_position = time_manager.asteroid_simulator.calculate_position(current_time)
            predicted_trajectory = time_manager.asteroid_simulator.calculate_predicted_trajectory(current_time)
            
            await time_manager._send_to_websocket(websocket, {
                "type": "command_success",
                "command": "fast_forward", 
                "hours": hours,
                "message": f"Fast forwarded {hours} hours",
                "current_time": current_time.isoformat(),
                "asteroid_position": asteroid_position,
                "predicted_trajectory": predicted_trajectory
            })
            
        elif command == "get_state":
            current_time = time_manager.get_current_time()
            asteroid_position = time_manager.asteroid_simulator.calculate_position(current_time)
            predicted_trajectory = time_manager.asteroid_simulator.calculate_predicted_trajectory(current_time)
            
            await time_manager._send_to_websocket(websocket, {
                "type": "time_state",
                "is_running": time_manager.is_time_running,
                "time_speed": time_manager.time_speed,
                "current_time": current_time.isoformat(),
                "asteroid_position": asteroid_position,
                "predicted_trajectory": predicted_trajectory
            })
            
        elif command == "request_update":
            # Send time update when explicitly requested
            current_time = time_manager.get_current_time()
            asteroid_position = time_manager.asteroid_simulator.calculate_position(current_time)
            predicted_trajectory = time_manager.asteroid_simulator.calculate_predicted_trajectory(current_time)
            
            await time_manager._send_to_websocket(websocket, {
                "type": "time_update",
                "current_time": current_time.isoformat(),
                "is_running": time_manager.is_time_running,
                "time_speed": time_manager.time_speed,
                "asteroid_position": asteroid_position,
                "predicted_trajectory": predicted_trajectory
            })
            
        else:
            await time_manager._send_to_websocket(websocket, {
                "type": "error",
                "message": f"Unknown command: {command}"
            })
    except Exception as e:
        await time_manager._send_to_websocket(websocket, {
            "type": "error",
            "message": f"Error processing command '{command}': {str(e)}"
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
    current_time = time_manager.get_current_time()
    asteroid_position = time_manager.asteroid_simulator.calculate_position(current_time)
    
    return {
        "current_time": current_time.isoformat(),
        "is_running": time_manager.is_time_running,
        "time_speed": time_manager.time_speed,
        "asteroid_position": asteroid_position
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
