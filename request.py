import requests

# URL del endpoint
url = "http://127.0.0.1:8000/suma_vectores"

# Payload (datos que se envían en el cuerpo de la solicitud POST)
payload = {
    "Ax": 3.0,
    "Ay": 4.5,
    "Bx": 1.5,
    "By": 2.5
}

# Enviar la solicitud POST
response = requests.post(url, json=payload)

# Mostrar la respuesta del servidor
print("Código de estado:", response.status_code)
print("Respuesta JSON:", response.json())
