// script.js

// Formatea un número a notación científica cuando sea necesario
function fmt(n, sig = 3) {
  if (Math.abs(n) < 0.01 || Math.abs(n) > 9999) {
    return n.toExponential(sig - 1);
  }
  return parseFloat(n.toPrecision(sig));
}

document.addEventListener("DOMContentLoaded", () => {
  // ---------------------------
  // Configuración D3 y elementos
  // ---------------------------
  const svg = d3.select("#vector-svg");
  const width = 800;
  const height = 600;
  let currentTransform = d3.zoomIdentity;
  
  // Grupos SVG con GPU acceleration
  const zoomGroup = svg.append("g")
    .style("transform-origin", "center")
    .style("will-change", "transform");
  const gridGroup = zoomGroup.append("g")
    .attr("class", "grid-group")
    .style("will-change", "transform");
  const axesGroup = zoomGroup.append("g")
    .attr("class", "axes-group")
    .style("will-change", "transform");
  const vectorsGroup = zoomGroup.append("g")
    .attr("class", "vectors-group")
    .style("will-change", "transform");
  const labelsGroup = zoomGroup.append("g")
    .attr("class", "labels-group")
    .style("will-change", "transform");
  const markersGroup = svg.append("defs");

  // Configuración inicial del SVG
  svg.attr("viewBox", `0 0 ${width} ${height}`)
     .attr("preserveAspectRatio", "xMidYMid meet")
     .style("background", "rgba(0, 0, 0, 0.2)");

  // Marcador de flecha mejorado
  markersGroup.append("marker")
    .attr("id", "arrowhead")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 9)
    .attr("refY", 0)
    .attr("markerWidth", 8)
    .attr("markerHeight", 8)
    .attr("orient", "auto-start-reverse")
    .append("path")
      .attr("d", "M0,-5L10,0L0,5L2,0Z")
      .attr("fill", "#4fd1c5");

  // ---------------------------
  // Sistema de Zoom y Pan Mejorado
  // ---------------------------
  const zoom = d3.zoom()
    .scaleExtent([0.2, 50]) // Limitamos el zoom a un rango más práctico
    .on("zoom", (event) => {
      currentTransform = event.transform;
      
      // Aplicar transformación con GPU acceleration
      zoomGroup.style("transform", `translate(${event.transform.x}px, ${event.transform.y}px) scale(${event.transform.k})`);
      
      // Actualizar elementos con throttling
      if (!zoom.updateTimer) {
        zoom.updateTimer = setTimeout(() => {
          requestAnimationFrame(() => {
            updateGrid(event.transform);
            updateAxes(event.transform);
            updateVectorLabels();
            zoom.updateTimer = null;
          });
        }, 16);
      }
    });

  svg.call(zoom)
     .call(zoom.transform, d3.zoomIdentity.translate(width/2, height/2).scale(1));

  // ---------------------------
  // Funciones del Plano Cartesiano Mejoradas
  // ---------------------------
  function updateGrid(transform) {
    const scale = transform.k;
    const gridSize = calculateGridSize(scale);
    const extent = Math.min(1000, Math.ceil(800 / scale)); // Limitamos el tamaño máximo de la cuadrícula
    
    // Crear array de líneas con step adaptativo
    const lines = d3.range(-extent, extent + gridSize, gridSize).filter(d => 
      Math.abs(d) <= extent // Filtrar líneas fuera del rango
    );
    
    // Líneas verticales
    const verticalLines = gridGroup.selectAll(".grid-line-vertical")
      .data(lines);

    verticalLines.enter()
      .append("line")
      .merge(verticalLines)
      .attr("class", d => `grid-line grid-line-vertical ${d === 0 ? 'grid-line-main' : ''}`)
      .attr("x1", d => d)
      .attr("x2", d => d)
      .attr("y1", -extent)
      .attr("y2", extent)
      .attr("opacity", d => {
        if (d === 0) return 0.8;
        if (d % (gridSize * 5) === 0) return 0.4;
        return 0.2;
      });

    verticalLines.exit().remove();

    // Líneas horizontales
    const horizontalLines = gridGroup.selectAll(".grid-line-horizontal")
      .data(lines);

    horizontalLines.enter()
      .append("line")
      .merge(horizontalLines)
      .attr("class", d => `grid-line grid-line-horizontal ${d === 0 ? 'grid-line-main' : ''}`)
      .attr("y1", d => d)
      .attr("y2", d => d)
      .attr("x1", -extent)
      .attr("x2", extent)
      .attr("opacity", d => {
        if (d === 0) return 0.8;
        if (d % (gridSize * 5) === 0) return 0.4;
        return 0.2;
      });

    horizontalLines.exit().remove();
  }

  function calculateGridSize(scale) {
    // Ajustar la densidad de la cuadrícula según el zoom
    if (scale < 0.5) return 50;
    if (scale < 2) return 20;
    if (scale < 5) return 10;
    if (scale < 10) return 5;
    return 2;
  }

  function updateAxes(transform) {
    const scale = transform.k;
    const range = Math.min(1000, Math.ceil(500 / scale)); // Limitamos el rango de los ejes
    
    // Función para formatear números en notación científica
    const formatNumber = d => {
      if (Math.abs(d) === 0) return "0";
      if (Math.abs(d) < 0.01 || Math.abs(d) > 9999) {
        return d.toExponential(1);
      }
      return d.toFixed(Math.max(0, Math.min(2, Math.floor(Math.log10(scale)))));
    };

    // Configurar ejes con menos ticks en zoom lejano
    const tickCount = Math.min(10, Math.max(5, Math.floor(width/(100/scale))));
    
    const xAxis = d3.axisBottom(d3.scaleLinear()
      .domain([-range, range])
      .range([-range, range]))
      .ticks(tickCount)
      .tickFormat(formatNumber)
      .tickSize(6);

    const yAxis = d3.axisLeft(d3.scaleLinear()
      .domain([-range, range])
      .range([-range, range]))
      .ticks(tickCount)
      .tickFormat(formatNumber)
      .tickSize(6);

    // Limpiar y redibujar ejes
    axesGroup.selectAll("*").remove();
    
    const xAxisGroup = axesGroup.append("g")
      .attr("class", "axis axis-x")
      .call(xAxis);

    const yAxisGroup = axesGroup.append("g")
      .attr("class", "axis axis-y")
      .call(yAxis);

    // Ajustar estilos
    axesGroup.selectAll(".axis line")
      .attr("stroke", "#4fd1c5")
      .attr("stroke-width", 1)
      .attr("vector-effect", "non-scaling-stroke");

    axesGroup.selectAll(".axis text")
      .attr("fill", "#4fd1c5")
      .attr("font-size", `${Math.min(12, 12/scale)}px`)
      .attr("text-shadow", "0 0 4px rgba(79, 209, 197, 0.5)");
  }

  // ---------------------------
  // Interfaz de Usuario
  // ---------------------------
  // Elementos DOM
  const tutorialModal = document.getElementById('tutorial-modal');
  const dismissBtn = document.getElementById('dismiss-tutorial');
  const form = document.getElementById("vector-form");
  const opButtons = document.querySelectorAll('.operations-group button');
  const calcBtn = document.getElementById('submit-vectors');
  const warning = document.getElementById('operation-warning');
  const resultsDiv = document.getElementById("numeric-results");
  const historyList = document.getElementById("history-list");
  const clearBtn = document.getElementById("clear-history");
  const coordsDisplay = document.getElementById("coordinates-display");

  // Estado de la aplicación
  let currentOperation = null;
  let history = [];

  // Inicialización
  initApp();

  function initApp() {
    // Cargar historial
    if (localStorage.getItem("vectorHistory")) {
      history = JSON.parse(localStorage.getItem("vectorHistory"));
      renderHistory();
    }

    // Event listeners
    dismissBtn.addEventListener('click', dismissTutorial);
    clearBtn.addEventListener("click", clearHistory);
    calcBtn.addEventListener('click', handleCalculate);
    
    opButtons.forEach(btn => {
      btn.addEventListener('click', () => selectOperation(btn));
    });

    // Mostrar coordenadas en tiempo real
    svg.on("mousemove", updateCoordinateDisplay);
  }

  // ---------------------------
  // Manejo de Operaciones
  // ---------------------------
  function selectOperation(btn) {
    opButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentOperation = btn.dataset.operation;
    calcBtn.disabled = false;
    warning.style.display = 'none';
    
    // Manejar reset de zoom
    if (currentOperation === "zoom-reset") {
      resetZoom();
      btn.classList.remove('active');
      calcBtn.disabled = true;
      warning.style.display = 'block';
    }
  }

  function handleCalculate(e) {
    e.preventDefault();
    if (!currentOperation || currentOperation === "zoom-reset") return;
    
    const vectorData = getVectorData();
    if (vectorData) executeOperation(vectorData);
  }

  function getVectorData() {
    const ax = parseFloat(document.getElementById("ax").value);
    const ay = parseFloat(document.getElementById("ay").value);
    const bx = parseFloat(document.getElementById("bx").value);
    const by = parseFloat(document.getElementById("by").value);

    if (isNaN(ax) || isNaN(ay) || isNaN(bx) || isNaN(by)) {
      resultsDiv.innerHTML = '<p class="error">❌ Ingresa valores numéricos válidos</p>';
      return null;
    }

    return { Ax: ax, Ay: ay, Bx: bx, By: by };
  }

  async function executeOperation(vectorData) {
    const endpointMap = {
      sum: "/suma_vectores",
      dot: "/producto_punto",
      magnitude: "/magnitud_vectores",
      angle: "/angulo_vectores"
    };
    
    try {
      const res = await fetch(`http://127.0.0.1:8000${endpointMap[currentOperation]}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vectorData)
      });
      
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      
      const data = await res.json();
      showResults(data);
      addToHistory(currentOperation, vectorData, data);
      drawVectors(currentOperation, vectorData, data);
    } catch (err) {
      resultsDiv.innerHTML = `<p class="error">❌ ${err.message}</p>`;
    }
  }

  // ---------------------------
  // Visualización de Vectores
  // ---------------------------
  function drawVectors(operation, inputs, outputs) {
    // Limpiar elementos anteriores con animación de desvanecimiento
    vectorsGroup.selectAll("*")
      .transition()
      .duration(400)
      .attr("opacity", 0)
      .remove();

    labelsGroup.selectAll("*")
      .transition()
      .duration(400)
      .attr("opacity", 0)
      .remove();

    // Configurar vectores base
    const vectors = [
      { x: inputs.Ax, y: inputs.Ay, color: "#4fd1c5", label: "A" },
      { x: inputs.Bx, y: inputs.By, color: "#81e6d9", label: "B" }
    ];

    // Añadir vector resultante para suma
    if (operation === "sum") {
      vectors.push({ 
        x: outputs.x, 
        y: outputs.y, 
        color: "#f687b3", 
        label: "A + B",
        isResult: true 
      });
    }

    // Dibujar todos los vectores con animaciones secuenciales
    vectors.forEach((vec, i) => {
      setTimeout(() => {
        drawVector(vec, 0);
        
        // Dibujar líneas auxiliares y paralelogramo para suma
        if (operation === "sum" && !vec.isResult) {
          drawAuxiliaryLine(vec, outputs);
        }
      }, i * 200);
    });

    // Ajustar vista automáticamente con animación suave
    setTimeout(() => {
      adjustViewport(vectors);
    }, vectors.length * 200);
  }

  function drawVector(vec, delay = 0) {
    // Línea del vector con animación suave
    const vector = vectorsGroup.append("line")
      .attr("class", "vector")
      .attr("stroke", vec.color)
      .attr("stroke-width", 2)
      .attr("x1", 0).attr("y1", 0)
      .attr("x2", 0).attr("y2", 0)
      .attr("marker-end", "url(#arrowhead)")
      .style("filter", "drop-shadow(0 0 2px rgba(79, 209, 197, 0.5))")
      .style("will-change", "transform");

    // Animación suave con easing
    vector.transition()
      .duration(800)
      .delay(delay)
      .ease(d3.easeElastic)
      .attr("x2", vec.x)
      .attr("y2", vec.y);

    // Etiqueta del vector
    addVectorLabel(vec);
  }

  function addVectorLabel(vec) {
    const labelGroup = labelsGroup.append("g")
      .attr("class", "vector-label-group")
      .style("will-change", "transform");

    // Fondo de la etiqueta para mejor legibilidad
    const label = labelGroup.append("text")
      .attr("class", "vector-label")
      .attr("fill", vec.color)
      .text(`${vec.label} (${fmt(vec.x, 2)}, ${fmt(vec.y, 2)})`);

    // Calcular dimensiones del texto
    const bbox = label.node().getBBox();
    
    // Añadir fondo semi-transparente
    labelGroup.insert("rect", "text")
      .attr("class", "label-background")
      .attr("x", bbox.x - 4)
      .attr("y", bbox.y - 2)
      .attr("width", bbox.width + 8)
      .attr("height", bbox.height + 4)
      .attr("fill", "rgba(0, 0, 0, 0.7)")
      .attr("rx", 3)
      .attr("ry", 3);

    // Posicionar etiqueta evitando solapamientos
    const labelPos = calculateOptimalLabelPosition(vec, bbox);
    labelGroup.attr("transform", `translate(${labelPos.x}, ${labelPos.y})`);
  }

  function calculateOptimalLabelPosition(vec, bbox) {
    const positions = [
      { x: vec.x + 10, y: vec.y - 10 },
      { x: vec.x + 10, y: vec.y + 20 },
      { x: vec.x - bbox.width - 10, y: vec.y - 10 },
      { x: vec.x - bbox.width - 10, y: vec.y + 20 }
    ];

    // Encontrar la mejor posición que no se solape con otras etiquetas
    const existingLabels = labelsGroup.selectAll(".vector-label-group").nodes();
    
    for (const pos of positions) {
      let overlap = false;
      
      for (const existing of existingLabels) {
        const existingBBox = existing.getBBox();
        const existingTransform = d3.select(existing).attr("transform");
        const [existingX, existingY] = existingTransform
          ? existingTransform.match(/translate\(([^)]+)\)/)[1].split(",").map(Number)
          : [0, 0];

        // Verificar solapamiento
        if (!(pos.x + bbox.width < existingX ||
              pos.x > existingX + existingBBox.width ||
              pos.y + bbox.height < existingY ||
              pos.y > existingY + existingBBox.height)) {
          overlap = true;
          break;
        }
      }

      if (!overlap) return pos;
    }

    // Si todas las posiciones se solapan, retornar la primera
    return positions[0];
  }

  function drawAuxiliaryLine(vec, result) {
    // Línea auxiliar con animación
    const auxiliaryLine = vectorsGroup.append("line")
      .attr("class", "aux-line")
      .attr("stroke", vec.color)
      .attr("stroke-dasharray", "5,2")
      .attr("stroke-opacity", 0.6)
      .attr("x1", vec.x)
      .attr("y1", vec.y)
      .attr("x2", vec.x)
      .attr("y2", vec.y);

    // Paralelogramo semi-transparente
    const parallelogram = vectorsGroup.append("path")
      .attr("class", "parallelogram")
      .attr("fill", vec.color)
      .attr("fill-opacity", 0.1)
      .attr("stroke", vec.color)
      .attr("stroke-opacity", 0.3)
      .attr("d", `M 0,0 L ${vec.x},${vec.y} L ${result.x},${result.y} L ${result.x - vec.x},${result.y - vec.y} Z`)
      .attr("opacity", 0);

    // Animación de la línea auxiliar
    auxiliaryLine.transition()
      .duration(800)
      .attr("x2", result.x)
      .attr("y2", result.y);

    // Animación del paralelogramo
    parallelogram.transition()
      .duration(800)
      .delay(400)
      .attr("opacity", 1);
  }

  function adjustViewport(vectors) {
    const allPoints = [...vectors, {x: 0, y: 0}];
    const padding = 1.3; // 30% de padding
    
    // Calcular extensión de los datos
    const xExtent = d3.extent(allPoints, d => d.x);
    const yExtent = d3.extent(allPoints, d => d.y);
    
    // Calcular nueva escala y transformación
    const xRange = xExtent[1] - xExtent[0];
    const yRange = yExtent[1] - yExtent[0];
    
    const scale = 0.9 / Math.max(
      xRange / (width * 0.8),
      yRange / (height * 0.8)
    );
    
    const newTransform = d3.zoomIdentity
      .translate(width/2, height/2)
      .scale(scale);

    svg.transition()
      .duration(800)
      .call(zoom.transform, newTransform);
  }

  function updateVectorLabels() {
    labelsGroup.selectAll(".vector-label-group")
      .each(function() {
        const group = d3.select(this);
        const scale = 1 / currentTransform.k;
        
        // Escalar el grupo completo
        group.style("transform", `scale(${scale})`);
        
        // Actualizar la opacidad basada en el zoom
        const opacity = currentTransform.k < 0.5 ? 0 : 1;
        group.style("opacity", opacity);
      });
  }

  // ---------------------------
  // Funciones de Interfaz
  // ---------------------------
  function updateCoordinateDisplay(event) {
    const [x, y] = d3.pointer(event);
    const inverted = currentTransform.invert([x, y]);
    const formatCoord = n => {
      if (Math.abs(n) < 0.01 || Math.abs(n) > 9999) {
        return n.toExponential(2);
      }
      return n.toFixed(2);
    };
    coordsDisplay.textContent = `X: ${formatCoord(inverted[0])}, Y: ${formatCoord(inverted[1])}`;
  }

  function showResults(data) {
    resultsDiv.innerHTML = Object.entries(data)
      .map(([key, value]) => `
        <div class="result-item">
          <h3>${key.replace(/_/g, ' ')}</h3>
          <p>${fmt(value)}</p>
        </div>
      `).join("");
  }

  function resetZoom() {
    svg.transition()
      .duration(800)
      .call(zoom.transform, d3.zoomIdentity.translate(width/2, height/2).scale(1));
  }

  function dismissTutorial() {
    tutorialModal.classList.replace('animate__fadeIn', 'animate__fadeOut');
    setTimeout(() => tutorialModal.style.display = 'none', 500);
  }

  // ---------------------------
  // Manejo del Historial
  // ---------------------------
  function addToHistory(op, inputs, outputs) {
    const entry = {
      op,
      inputs,
      outputs,
      timestamp: new Date().toLocaleTimeString()
    };
    
    history.unshift(entry);
    if (history.length > 10) history.pop();
    localStorage.setItem("vectorHistory", JSON.stringify(history));
    renderHistory();
  }

  function renderHistory() {
    historyList.innerHTML = history.map(entry => `
      <li>
        <strong>[${entry.timestamp}] ${entry.op.toUpperCase()}</strong><br>
        A=(${fmt(entry.inputs.Ax)}, ${fmt(entry.inputs.Ay)}), 
        B=(${fmt(entry.inputs.Bx)}, ${fmt(entry.inputs.By)})<br>
        ${Object.entries(entry.outputs).map(([k, v]) => 
          `${k.replace(/_/g, ' ')}: ${fmt(v)}`).join(", ")}
      </li>
    `).join("");
  }

  function clearHistory() {
    history = [];
    localStorage.removeItem("vectorHistory");
    renderHistory();
  }
});