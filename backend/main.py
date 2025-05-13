from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from math import sqrt, acos, degrees


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



class Vectores(BaseModel):
    Ax: float
    Ay: float
    Bx: float
    By: float

@app.post("/suma_vectores")
def suma_vectores(v: Vectores):
    return {"Rx": v.Ax + v.Bx, "Ry": v.Ay + v.By}

@app.post("/producto_punto")
def producto_punto(v: Vectores):
    dot = v.Ax * v.Bx + v.Ay * v.By
    return {"Producto Punto": dot}

@app.post("/magnitud_vectores")
def magnitud_vectores(v: Vectores):
    magA = sqrt(v.Ax**2 + v.Ay**2)
    magB = sqrt(v.Bx**2 + v.By**2)
    return {"Magnitud A": magA, "Magnitud B": magB}

@app.post("/angulo_vectores")
def angulo_vectores(v: Vectores):
    dot = v.Ax * v.Bx + v.Ay * v.By
    magA = sqrt(v.Ax**2 + v.Ay**2)
    magB = sqrt(v.Bx**2 + v.By**2)
    if magA == 0 or magB == 0:
        return {"Ángulo": "Indefinido (vector nulo)"}
    cos_theta = dot / (magA * magB)
    cos_theta = max(min(cos_theta, 1), -1)  # Evitar errores de dominio
    angle_deg = degrees(acos(cos_theta))
    return {"Ángulo (grados)": angle_deg}
