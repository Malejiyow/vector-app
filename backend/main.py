# main.py

import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from math import sqrt, acos, degrees

# 1. Instancia de FastAPI
app = FastAPI()

# 2. Habilitar CORS para llamadas AJAX desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # Ajusta esto a tu dominio/puerto si lo deseas
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Definir modelo Pydantic para los vectores
class Vectores(BaseModel):
    Ax: float
    Ay: float
    Bx: float
    By: float

# 4. Montar archivos estáticos en /static
#    Evita montar en "/", para que no interfiera con las rutas POST de la API
app.mount(
    "/static",
    StaticFiles(directory=os.path.join(os.path.dirname(__file__), "../frontend")),
    name="static"
)

# 5. Ruta raíz que sirve el index.html
@app.get("/", include_in_schema=False)
def read_index():
    index_path = os.path.join(os.path.dirname(__file__), "../frontend/index.html")
    return FileResponse(index_path)

# 6. Endpoints de la API

@app.post("/suma_vectores")
def suma_vectores(v: Vectores):
    """Suma componente a componente: A + B."""
    return {
        "Rx": v.Ax + v.Bx,
        "Ry": v.Ay + v.By
    }

@app.post("/producto_punto")
def producto_punto(v: Vectores):
    """Producto punto (escalar) entre A y B."""
    dot = v.Ax * v.Bx + v.Ay * v.By
    return {"Producto Punto": dot}

@app.post("/magnitud_vectores")
def magnitud_vectores(v: Vectores):
    """Calcula las magnitudes de A y B."""
    magA = sqrt(v.Ax**2 + v.Ay**2)
    magB = sqrt(v.Bx**2 + v.By**2)
    return {
        "Magnitud A": magA,
        "Magnitud B": magB
    }

@app.post("/angulo_vectores")
def angulo_vectores(v: Vectores):
    """Ángulo entre A y B en grados (maneja vector nulo)."""
    dot = v.Ax * v.Bx + v.Ay * v.By
    magA = sqrt(v.Ax**2 + v.Ay**2)
    magB = sqrt(v.Bx**2 + v.By**2)
    if magA == 0 or magB == 0:
        return {"Ángulo": "Indefinido (vector nulo)"}
    cos_theta = dot / (magA * magB)
    cos_theta = max(min(cos_theta, 1), -1)  # Corregir errores de redondeo
    angle_deg = degrees(acos(cos_theta))
    return {"Ángulo (grados)": angle_deg}

