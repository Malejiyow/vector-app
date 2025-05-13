document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("vector-form");
  const operationButtons = document.querySelectorAll("#operation-selector button");
  const resultsContainer = document.getElementById("numeric-results");
  let currentOperation = "sum";

  let vectorData = {
    Ax: 0,
    Ay: 0,
    Bx: 0,
    By: 0
  };

  // Guardar la operación seleccionada
  operationButtons.forEach(button => {
    button.addEventListener("click", () => {
      currentOperation = button.dataset.operation;
      ejecutarOperacion();
    });
  });

  // Capturar datos del formulario
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    vectorData = {
      Ax: parseFloat(document.getElementById("ax").value),
      Ay: parseFloat(document.getElementById("ay").value),
      Bx: parseFloat(document.getElementById("bx").value),
      By: parseFloat(document.getElementById("by").value)
    };
    ejecutarOperacion();
  });

  async function ejecutarOperacion() {
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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(vectorData)
      });

      if (!response.ok) throw new Error("Error al conectar con la API");

      const data = await response.json();
      mostrarResultados(data);
    } catch (error) {
      resultsContainer.innerHTML = `<p class="error">❌ ${error.message}</p>`;
    }
  }

  function mostrarResultados(data) {
    resultsContainer.innerHTML = "";
    for (const key in data) {
      const p = document.createElement("p");
      p.textContent = `${key}: ${data[key]}`;
      resultsContainer.appendChild(p);
    }
  }
});
    