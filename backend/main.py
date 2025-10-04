from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import os
import requests
from fastapi.middleware.cors import CORSMiddleware
from websockets_time import app_ws
import json

load_dotenv()
api_key = os.getenv('API_KEY')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def neo_all(start_date: str, end_date: str):
    req = requests.get(f"https://api.nasa.gov/neo/rest/v1/feed?start_date={start_date}&end_date={end_date}&api_key={api_key}")
    data = req.json()
    
    # Use absolute path from current directory
    base_dir = os.path.join(os.getcwd(), 'neo_all')
    os.makedirs(base_dir, exist_ok=True)
    
    file_path = os.path.join(base_dir, f'{start_date}_{end_date}.json')
    
    with open(file_path, "w") as f:
        json.dump(data, f, indent=2)
    
    print(f"File successfully written to: {file_path}")
    return data

async def neo_one(neo_id: int):
    print(f"Current working directory: {os.getcwd()}")
    
    req = requests.get(f"https://api.nasa.gov/neo/rest/v1/neo/{neo_id}?api_key={api_key}")
    data = req.json()
    
    base_dir = os.path.join(os.getcwd(), 'neo_one')
    os.makedirs(base_dir, exist_ok=True)
    
    file_path = os.path.join(base_dir, f'{neo_id}.json')
    
    with open(file_path, "w") as f:
        json.dump(data, f, indent=2)
    
    print(f"File successfully written to: {file_path}")
    return data

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/neo_data_all/")
async def get_neo_all(start_date: str, end_date: str):
    data = await neo_all(start_date=start_date, end_date=end_date)
    
    return JSONResponse(content=data)

@app.get("/neo_data_one/{neo_id}")
async def get_neo_one(neo_id: int):
    data = await neo_one(neo_id=neo_id)

    return JSONResponse(content=data)

@app.get("/neo_data_per_object/")
async def get_neo_per_obj(start_date: str, end_date: str):
    try:
        neo_data = await neo_all(start_date=start_date, end_date=end_date)
        neo = neo_data["near_earth_objects"]
        arr_neo = []
        for key in neo:
            for elem in neo[key]:
                arr_neo.append(elem)
        
        neo_ids = []
        
        for elem in arr_neo:
            neo_ids.append(elem['id'])
        
        neo_params = {}
        for i in neo_ids:
            try:
                data = await neo_one(i)
                # The NASA API response has orbital data directly in the response
                orbital_info = {
                    "orbit_id": data.get('orbit_id', ''),
                    "orbit_determination_date": data.get('orbit_determination_date', ''),
                    "first_observation_date": data.get('first_observation_date', ''),
                    "last_observation_date": data.get('last_observation_date', ''),
                    "data_arc_in_days": data.get('data_arc_in_days', 0),
                    "observations_used": data.get('observations_used', 0),
                    "orbit_uncertainty": data.get('orbit_uncertainty', ''),
                    "minimum_orbit_intersection": data.get('minimum_orbit_intersection', ''),
                    "jupiter_tisserand_invariant": data.get('jupiter_tisserand_invariant', ''),
                    "epoch_osculation": data.get('epoch_osculation', ''),
                    "eccentricity": data.get('eccentricity', ''),
                    "semi_major_axis": data.get('semi_major_axis', ''),
                    "inclination": data.get('inclination', ''),
                    "ascending_node_longitude": data.get('ascending_node_longitude', ''),
                    "orbital_period": data.get('orbital_period', ''),
                    "perihelion_distance": data.get('perihelion_distance', ''),
                    "perihelion_argument": data.get('perihelion_argument', ''),
                    "aphelion_distance": data.get('aphelion_distance', ''),
                    "perihelion_time": data.get('perihelion_time', ''),
                    "mean_anomaly": data.get('mean_anomaly', ''),
                    "mean_motion": data.get('mean_motion', ''),
                    "equinox": data.get('equinox', ''),
                    "orbit_class": data.get('orbit_class', {})
                }
                
                neo_params[data['name']] = orbital_info
            except Exception as e:
                print(f"Error processing NEO ID {i}: {str(e)}")
                continue
        
        return JSONResponse(content=neo_params)
    
    except Exception as e:
        print(f"Error in get_neo_per_obj: {str(e)}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

app.include_router(app_ws, prefix='/time')

if __name__ == "__main__":
    uvicorn.run("main:app", reload=True, host="127.0.0.1", port=8000, log_level="info")
