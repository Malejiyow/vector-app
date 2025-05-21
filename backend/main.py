# main.py

import os
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import List
from math import sqrt, acos, degrees
from pathlib import Path

# 1. Instancia de FastAPI
app = FastAPI(title="Vector App API", description="Operaciones vectoriales en ℝ²", version="1.1")

# 2. Habilitar CORS para llamadas AJAX desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Modelos Pydantic
class Vectores(BaseModel):
    Ax: float = Field(..., description="Componente X del vector A")
    Ay: float = Field(..., description="Componente Y del vector A")
    Bx: float = Field(..., description="Componente X del vector B")
    By: float = Field(..., description="Componente Y del vector B")

class Vector2D(BaseModel):
    x: float = Field(..., description="Componente X del vector")
    y: float = Field(..., description="Componente Y del vector")

class ListaVectores(BaseModel):
    vectores: List[Vector2D] = Field(..., description="Lista de vectores a sumar")

# 4. Obtener la ruta base del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

# 5. Montar archivos estáticos
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

# 6. Ruta raíz que sirve el index.html
@app.get("/", include_in_schema=False)
def read_index():
    return FileResponse(str(FRONTEND_DIR / "index.html"))

# 7. Endpoint de salud
@app.get("/health", tags=["Utilidad"])
def health():
    return {"status": "ok"}

# 8. Endpoints de la API
@app.post("/api/suma_vectores", tags=["Operaciones"], summary="Suma de dos vectores")
def suma_vectores(v: Vectores):
    try:
        Rx = v.Ax + v.Bx
        Ry = v.Ay + v.By
        return {"success": True, "result": {"Rx": Rx, "Ry": Ry}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en suma: {str(e)}")

@app.post("/api/suma_lista", tags=["Operaciones"], summary="Suma de una lista de vectores")
def suma_lista(data: ListaVectores):
    try:
        Rx = sum(vec.x for vec in data.vectores)
        Ry = sum(vec.y for vec in data.vectores)
        return {"success": True, "result": {"Rx": Rx, "Ry": Ry}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en suma de lista: {str(e)}")

@app.post("/api/producto_punto", tags=["Operaciones"], summary="Producto escalar entre dos vectores")
def producto_punto(v: Vectores):
    try:
        dot = v.Ax * v.Bx + v.Ay * v.By
        return {"success": True, "result": {"producto_punto": dot}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en producto punto: {str(e)}")

@app.post("/api/magnitud_vectores", tags=["Operaciones"], summary="Magnitud de dos vectores")
def magnitud_vectores(v: Vectores):
    try:
        magA = sqrt(v.Ax**2 + v.Ay**2)
        magB = sqrt(v.Bx**2 + v.By**2)
        return {"success": True, "result": {"magnitud_A": magA, "magnitud_B": magB}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en magnitud: {str(e)}")

@app.post("/api/angulo_vectores", tags=["Operaciones"], summary="Ángulo entre dos vectores en grados")
def angulo_vectores(v: Vectores):
    try:
        dot = v.Ax * v.Bx + v.Ay * v.By
        magA = sqrt(v.Ax**2 + v.Ay**2)
        magB = sqrt(v.Bx**2 + v.By**2)
        if magA == 0 or magB == 0:
            return {"success": False, "result": None, "detail": "Ángulo indefinido (vector nulo)"}
        cos_theta = dot / (magA * magB)
        cos_theta = max(min(cos_theta, 1), -1)  # Corregir errores de redondeo
        angle_deg = degrees(acos(cos_theta))
        return {"success": True, "result": {"angulo_grados": angle_deg}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error en ángulo: {str(e)}")

