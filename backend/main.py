from fastapi import FastAPI 
from pydantic import  BaseModel

app = FastAPI()

class vectores(BaseModel):
    Ax : float 
    Ay : float 
    Bx : float
    By : float


@app.post("/suma_vectores")
def suma_vectores(vectores: vectores):
    resultado_x = vectores.Ax + vectores.Bx
    resultado_y = vectores.Ay + vectores.By
    return {"Rx": resultado_x, "Ry": resultado_y}





