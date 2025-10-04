from fastapi import FastAPI
from fastapi.responses import JSONResponse
import uvicorn
from dotenv import load_dotenv
import os
import requests

load_dotenv()
api_key = os.getenv('API_KEY')

app = FastAPI()

async def neo_all(start_date: str, end_date: str):
    req = requests.get(f"https://api.nasa.gov/neo/rest/v1/feed?start_date={start_date}&end_date={end_date}&api_key={api_key}")
    data = req.json()
    
    return data

async def neo_one(neo_id: int):
    req = requests.get(f"https://api.nasa.gov/neo/rest/v1/neo/{neo_id}?api_key={api_key}")
    data = req.json()

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
        data = await neo_one(i)
        neo_params[data['name']] = data['orbital_data']

    return JSONResponse(content=neo_params)

if __name__ == "__main__":
    uvicorn.run("main:app", reload=True, host="127.0.0.1", port=8000, log_level="info")
