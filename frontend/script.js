document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("vector-form");
  const operationButtons = document.querySelectorAll("#operation-selector button");
  const resultsContainer = document.getElementById("numeric-results");
  const historyList = document.getElementById("history-list"); 
  const clearBtn = document.getElementById("clear-history");  // <-- nuevo



  let currentOperation = "sum";
  let vectorData = {};
  let history = []; // Array para almacenar el historial

 clearBtn.addEventListener("click", () => {
    // Vaciar el array y el storage
    history = [];
    localStorage.removeItem("vectorHistory");
    // Volver a renderizar (se quedará vacío)
    renderHistory();
  });


  // Cargar historial desde localStorage si existe
  if (localStorage.getItem("vectorHistory")) {
    history = JSON.parse(localStorage.getItem("vectorHistory"));
    renderHistory();
  }

  // Selección de operación
  operationButtons.forEach(button => {
    button.addEventListener("click", () => {
      currentOperation = button.dataset.operation;
      // Podemos opcionalmente marcar el botón activo
      executeOperation();
    });
  });

  // Envío del formulario
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    vectorData = {
      Ax: parseFloat(document.getElementById("ax").value),
      Ay: parseFloat(document.getElementById("ay").value),
      Bx: parseFloat(document.getElementById("bx").value),
      By: parseFloat(document.getElementById("by").value)
    };
    executeOperation();
  });

  async function executeOperation() {
    const endpointMap = {
      sum: "/suma_vectores",
      dot: "/producto_punto",
      magnitude: "/magnitud_vectores",
      angle: "/angulo_vectores"
    };
    const url = `http://127.0.0.1:8000${endpointMap[currentOperation]}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vectorData)
      });
      if (!response.ok) throw new Error("Error al conectar con la API");
      const data = await response.json();
      showResults(data);
      addToHistory(currentOperation, vectorData, data);
    } catch (error) {
      resultsContainer.innerHTML = `<p class="error">❌ ${error.message}</p>`;
    }
  }

  function showResults(data) {
    resultsContainer.innerHTML = "";
    for (const key in data) {
      const p = document.createElement("p");
      p.textContent = `${key}: ${data[key]}`;
      resultsContainer.appendChild(p);
    }
  }

  function addToHistory(op, inputs, outputs) {
    const timestamp = new Date().toLocaleTimeString();
    const entry = { op, inputs, outputs, timestamp };
    history.unshift(entry);        // Añadimos al inicio
    if (history.length > 10) {     // Opcional: mantener solo últimas 10
      history.pop();
    }
    localStorage.setItem("vectorHistory", JSON.stringify(history));
    renderHistory();
  }

  function renderHistory() {
    historyList.innerHTML = "";
    history.forEach(entry => {
      const li = document.createElement("li");
      // Personaliza aquí el formato de cada entrada
      li.innerHTML = `
        <strong>[${entry.timestamp}] ${entry.op.toUpperCase()}</strong><br>
        A=( ${entry.inputs.Ax}, ${entry.inputs.Ay} ), 
        B=( ${entry.inputs.Bx}, ${entry.inputs.By} )<br>
        Resultado: ${Object.entries(entry.outputs)
          .map(([k,v]) => `${k}: ${v}`)
          .join(", ")}
      `;
      historyList.appendChild(li);
    });
  }
});

