// script.js

// Formatea un número a `sig` cifras significativas (por defecto 3)
function fmt(n, sig = 3) {
  return Number.parseFloat(n).toPrecision(sig);
}

document.addEventListener("DOMContentLoaded", () => {
  // ----- Tutorial Modal -----
  const tutorialModal = document.getElementById('tutorial-modal');
  const dismissBtn    = document.getElementById('dismiss-tutorial');
  dismissBtn.addEventListener('click', () => {
    tutorialModal.classList.replace('animate__fadeIn', 'animate__fadeOut');
    setTimeout(() => tutorialModal.style.display = 'none', 500);
  });

  // ----- Elementos principales -----
  const form        = document.getElementById("vector-form");
  const opButtons   = document.querySelectorAll('.operations-group button');
  const calcBtn     = document.getElementById('submit-vectors');
  const warning     = document.getElementById('operation-warning');
  const resultsDiv  = document.getElementById("numeric-results");
  const historyList = document.getElementById("history-list");
  const clearBtn    = document.getElementById("clear-history");

  let currentOperation = null;
  let history = [];

  // Estado inicial
  calcBtn.disabled = true;
  warning.style.display = 'block';
  if (localStorage.getItem("vectorHistory")) {
    history = JSON.parse(localStorage.getItem("vectorHistory"));
    renderHistory();
  }

  // Limpia historial
  clearBtn.addEventListener("click", () => {
    history = [];
    localStorage.removeItem("vectorHistory");
    renderHistory();
  });

  // Selección única de operación
  opButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      opButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentOperation = btn.dataset.operation;
      calcBtn.disabled = false;
      warning.style.display = 'none';
    });
  });

  // Click en Calcular
  calcBtn.addEventListener('click', e => {
    e.preventDefault();
    if (!currentOperation) {
      warning.style.display = 'block';
      return;
    }
    const vectorData = {
      Ax: parseFloat(document.getElementById("ax").value),
      Ay: parseFloat(document.getElementById("ay").value),
      Bx: parseFloat(document.getElementById("bx").value),
      By: parseFloat(document.getElementById("by").value)
    };
    executeOperation(vectorData);
  });

  // Llamada a la API y luego dibuja
  async function executeOperation(vectorData) {
    const endpointMap = {
      sum:       "/suma_vectores",
      dot:       "/producto_punto",
      magnitude: "/magnitud_vectores",
      angle:     "/angulo_vectores"
    };
    const url = `http://127.0.0.1:8000${endpointMap[currentOperation]}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vectorData)
      });
      if (!res.ok) throw new Error("Error al conectar con la API");
      const data = await res.json();
      showResults(data);
      addToHistory(currentOperation, vectorData, data);
      drawGraph(currentOperation, vectorData, data);
    } catch (err) {
      resultsDiv.innerHTML = `<p class="error">❌ ${err.message}</p>`;
    }
  }

  // Muestra resultados redondeados
  function showResults(data) {
    resultsDiv.innerHTML = "";
    Object.entries(data).forEach(([key, value]) => {
      const p = document.createElement("p");
      const displayValue = (typeof value === 'number') ? fmt(value, 3) : value;
      p.textContent = `${key}: ${displayValue}`;
      resultsDiv.appendChild(p);
    });
  }

  // Historial
  function addToHistory(op, inputs, outputs) {
    const timestamp = new Date().toLocaleTimeString();
    history.unshift({ op, inputs, outputs, timestamp });
    if (history.length > 10) history.pop();
    localStorage.setItem("vectorHistory", JSON.stringify(history));
    renderHistory();
  }
  function renderHistory() {
    historyList.innerHTML = "";
    history.forEach(entry => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>[${entry.timestamp}] ${entry.op.toUpperCase()}</strong><br>
        A=( ${fmt(entry.inputs.Ax)}, ${fmt(entry.inputs.Ay)} ), 
        B=( ${fmt(entry.inputs.Bx)}, ${fmt(entry.inputs.By)} )<br>
        Resultado: ${Object.entries(entry.outputs)
          .map(([k, v]) => `${k}: ${fmt(v)}`)
          .join(", ")}
      `;
      historyList.appendChild(li);
    });
  }

  // ----- GraphRenderer con D3.js -----
  function drawGraph(operation, inputs, outputs) {
    const svg = d3.select("#vector-svg");
    const width  = +svg.attr("width");
    const height = +svg.attr("height");
    const pad = 40;

    // Limpiar
    svg.selectAll("*").remove();

    // Marcador de flecha
    svg.append("defs").append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10).attr("refY", 0)
      .attr("markerWidth", 6).attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#000");

    // Dominio
    let xs = [0, inputs.Ax, inputs.Bx],
        ys = [0, inputs.Ay, inputs.By];
    if (operation === "sum") {
      xs.push(outputs.x); ys.push(outputs.y);
    }
    const xExt = d3.extent(xs), yExt = d3.extent(ys);
    const xDom = [xExt[0] - 1, xExt[1] + 1],
          yDom = [yExt[0] - 1, yExt[1] + 1];

    const xScale = d3.scaleLinear().domain(xDom).range([pad, width - pad]);
    const yScale = d3.scaleLinear().domain(yDom).range([height - pad, pad]);

    // Ejes
    svg.append("line")
      .attr("x1", xScale(xDom[0])).attr("y1", yScale(0))
      .attr("x2", xScale(xDom[1])).attr("y2", yScale(0))
      .attr("stroke", "#777");
    svg.append("line")
      .attr("x1", xScale(0)).attr("y1", yScale(yDom[0]))
      .attr("x2", xScale(0)).attr("y2", yScale(yDom[1]))
      .attr("stroke", "#777");

    // Animador genérico
    function animateVector(vec, color, delay = 0) {
      const line = svg.append("line")
        .attr("x1", xScale(0)).attr("y1", yScale(0))
        .attr("x2", xScale(0)).attr("y2", yScale(0))
        .attr("stroke", color)
        .attr("stroke-width", 3)
        .attr("marker-end", "url(#arrow)");

      line.transition()
          .delay(delay)
          .duration(800)
          .attr("x2", xScale(vec.x))
          .attr("y2", yScale(vec.y));

      svg.append("text")
        .attr("fill", color)
        .attr("font-size", "0.8em")
        .attr("x", xScale(0)).attr("y", yScale(0))
        .transition()
          .delay(delay + 800)
          .attr("x", xScale(vec.x) + Math.sign(vec.x)*8)
          .attr("y", yScale(vec.y) - Math.sign(vec.y)*8)
          .text(`(${vec.x}, ${vec.y})`);
    }

    // Dibujo según operación
    if (operation === "sum") {
      animateVector({x: inputs.Ax, y: inputs.Ay}, "#1f77b4", 0);
      animateVector({x: inputs.Bx, y: inputs.By}, "#2ca02c", 400);
      animateVector({x: outputs.x, y: outputs.y}, "#9467bd", 1000);

      // Paralelogramo
      svg.append("line")
        .attr("stroke", "#9467bd").attr("stroke-dasharray", "5,5")
        .attr("x1", xScale(inputs.Ax)).attr("y1", yScale(inputs.Ay))
        .attr("x2", xScale(inputs.Ax + inputs.Bx)).attr("y2", yScale(inputs.Ay + inputs.By));
      svg.append("line")
        .attr("stroke", "#9467bd").attr("stroke-dasharray", "5,5")
        .attr("x1", xScale(inputs.Bx)).attr("y1", yScale(inputs.By))
        .attr("x2", xScale(inputs.Ax + inputs.Bx)).attr("y2", yScale(inputs.Ay + inputs.By));
    }
    // Puedes añadir más casos para dot, magnitude y angle...
  }
});