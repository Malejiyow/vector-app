// script.js

// Formatea un número a notación científica cuando sea necesario
function fmt(n, sig = 3) {
  if (Math.abs(n) < 0.01 || Math.abs(n) > 9999) {
    return n.toExponential(sig - 1);
  }
  return parseFloat(n.toPrecision(sig));
}

// Variables globales
let calculator;
let vectorCount = 0;
const maxVectors = 10;
let currentExpressions = [];
let history = JSON.parse(localStorage.getItem('vectorHistory') || '[]');

// Variables globales para el tutorial
let currentStep = 1;
const totalSteps = 3;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeCalculator();
    setupEventListeners();
    setupTutorial();
    // Agregar dos vectores por defecto
    addVector();
    addVector();
    renderHistory();
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon();
    updateCalculatorTheme();
});

function initializeCalculator() {
    calculator = Desmos.GraphingCalculator(document.getElementById('desmos-calculator'), {
        keypad: false,
        menuBar: false,
        border: false,
        settingsMenu: false,
        zoomButtons: true,
        expressions: false,
        lockViewport: false,
        backgroundColor: 'transparent',
        colors: {
            foreground: '#ffffff',
            background: 'transparent'
        }
    });

    // Configurar vista inicial
    calculator.setMathBounds({
        left: -10,
        right: 10,
        bottom: -10,
        top: 10
    });

    // Mostrar coordenadas en tiempo real
    calculator.observe('mouse', (event) => {
        if (event.type === 'move') {
            const { x, y } = event;
            const formatCoord = n => {
                if (Math.abs(n) < 0.01 || Math.abs(n) > 9999) {
                    return n.toExponential(2);
                }
                return n.toFixed(2);
            };
            document.getElementById('coords-value').textContent = 
                `X: ${formatCoord(x)}, Y: ${formatCoord(y)}`;
        }
    });
}

function setupEventListeners() {
    // Botones de operación
    document.querySelectorAll('.operation-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.operation-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            document.getElementById('calculate-button').disabled = false;
        });
    });

    // Botón de calcular
    document.getElementById('calculate-button').addEventListener('click', calculateOperation);

    // Botón de agregar vector
    document.getElementById('add-vector-button').addEventListener('click', addVector);

    // Botón de limpiar vectores
    document.getElementById('clear-vectors-button').addEventListener('click', clearVectors);

    // Botón de tema
    document.getElementById('theme-switch').addEventListener('click', toggleTheme);

    // Botón de limpiar historial
    const clearHistoryButton = document.getElementById('clear-history');
    if (clearHistoryButton) {
        clearHistoryButton.addEventListener('click', clearHistory);
    }
}

function addVector() {
    if (vectorCount >= maxVectors) {
        alert('Has alcanzado el máximo número de vectores permitidos (10)');
        return;
    }

    const vectorsContainer = document.getElementById('vectors-container');
    const vectorFieldset = document.createElement('fieldset');
    vectorFieldset.className = 'vector-fieldset';
    vectorCount++;

    vectorFieldset.innerHTML = `
        <button type="button" class="remove-vector" title="Eliminar vector">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
        </button>
        <legend>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5l7 7-7 7M5 12h14"/>
            </svg>
            Vector ${vectorCount}
        </legend>
        <div>
            <label for="x${vectorCount}">Componente X:</label>
            <input type="number" id="x${vectorCount}" step="any" required>
        </div>
        <div>
            <label for="y${vectorCount}">Componente Y:</label>
            <input type="number" id="y${vectorCount}" step="any" required>
        </div>
    `;

    vectorsContainer.appendChild(vectorFieldset);

    // Agregar evento para eliminar vector
    vectorFieldset.querySelector('.remove-vector').addEventListener('click', () => {
        vectorFieldset.remove();
        vectorCount--;
        updateVectorNumbers();
    });
}

function clearVectors() {
    const vectorsContainer = document.getElementById('vectors-container');
    vectorsContainer.innerHTML = '';
    vectorCount = 0;
    // Agregar dos vectores por defecto al limpiar
    addVector();
    addVector();
}

function updateVectorNumbers() {
    const vectors = document.querySelectorAll('.vector-fieldset');
    vectors.forEach((vector, index) => {
        const legend = vector.querySelector('legend');
        legend.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5l7 7-7 7M5 12h14"/>
            </svg>
            Vector ${index + 1}
        `;
        vector.querySelectorAll('input').forEach(input => {
            const id = input.id;
            input.id = id.replace(/\d+/, index + 1);
        });
    });
}

function getVectors() {
    const vectors = [];
    document.querySelectorAll('.vector-fieldset').forEach(fieldset => {
        const x = parseFloat(fieldset.querySelector('input[id^="x"]').value) || 0;
        const y = parseFloat(fieldset.querySelector('input[id^="y"]').value) || 0;
        vectors.push({ x, y });
    });
    return vectors;
}

async function calculateOperation() {
    const vectors = getVectors();
    if (vectors.length < 2) {
        alert('Se necesitan al menos 2 vectores para realizar operaciones');
        return;
    }

    const activeOperation = document.querySelector('.operation-button.active');
    if (!activeOperation) {
        alert('Por favor, selecciona una operación');
        return;
    }

    const operation = activeOperation.dataset.operation;
    let result;
    const loader = document.getElementById('global-loader');
    try {
        loader.style.display = 'flex';
        if (operation === 'sum') {
            const response = await fetch('/suma_lista', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vectores: vectors })
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.detail || 'Error en la suma');
            result = { x: data.result.Rx, y: data.result.Ry };
        } else if (operation === 'dot') {
            const v = vectors.slice(0, 2);
            const response = await fetch('/producto_punto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Ax: v[0].x, Ay: v[0].y, Bx: v[1].x, By: v[1].y })
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.detail || 'Error en el producto escalar');
            result = data.result.producto_punto;
        } else if (operation === 'magnitude') {
            const v = vectors.slice(0, 2);
            const response = await fetch('/magnitud_vectores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Ax: v[0].x, Ay: v[0].y, Bx: v[1].x, By: v[1].y })
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.detail || 'Error en la magnitud');
            result = [
                { x: v[0].x, y: v[0].y, magnitude: data.result.magnitud_A },
                { x: v[1].x, y: v[1].y, magnitude: data.result.magnitud_B }
            ];
        } else if (operation === 'angle') {
            const v = vectors.slice(0, 2);
            const response = await fetch('/angulo_vectores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Ax: v[0].x, Ay: v[0].y, Bx: v[1].x, By: v[1].y })
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.detail || 'Error en el ángulo');
            result = data.result.angulo_grados;
        }
        displayResult(result, operation);
        updateGraph(vectors, result, operation);
    } catch (error) {
        alert('Error: ' + (error.message || error));
    } finally {
        loader.style.display = 'none';
    }
}

function displayResult(result, operation) {
    // Limpiar resultados anteriores
    document.querySelectorAll('.result-content').forEach(el => el.innerHTML = '');
    document.querySelectorAll('.result-card').forEach(card => card.style.display = 'none');

    switch (operation) {
        case 'sum':
            const magnitude = Math.sqrt(result.x * result.x + result.y * result.y);
            const direction = Math.atan2(result.y, result.x) * 180 / Math.PI;
            
            document.getElementById('vector-result-content').innerHTML = `
                <div class="result-value">(${result.x.toFixed(2)}, ${result.y.toFixed(2)})</div>
            `;
            document.querySelector('.vector-result').style.display = 'block';
            
            document.getElementById('magnitude-result-content').innerHTML = `
                <div class="result-value">${magnitude.toFixed(2)}</div>
            `;
            document.querySelector('.magnitude-result').style.display = 'block';
            
            document.getElementById('angle-result-content').innerHTML = `
                <div class="result-value">${direction.toFixed(2)}°</div>
            `;
            document.querySelector('.angle-result').style.display = 'block';
            break;

        case 'dot':
            document.getElementById('dot-result-content').innerHTML = `
                <div class="result-value">${result.toFixed(2)}</div>
            `;
            document.querySelector('.dot-result').style.display = 'block';
            break;

        case 'magnitude':
            result.forEach((vec, i) => {
                document.getElementById('magnitude-result-content').innerHTML += `
                    <div class="result-value">Vector ${i + 1}: ${vec.magnitude.toFixed(2)}</div>
                `;
            });
            document.querySelector('.magnitude-result').style.display = 'block';
            break;

        case 'angle':
            document.getElementById('angle-result-content').innerHTML = `
                <div class="result-value">${result.toFixed(2)}°</div>
            `;
            document.querySelector('.angle-result').style.display = 'block';
            break;
    }

    // Agregar al historial
    addToHistory(operation, result);
}

function addToHistory(operation, result) {
    const timestamp = new Date().toLocaleTimeString();
    const vectors = getVectors();
    let historyEntry = {
        timestamp,
        operation,
        vectors: vectors.map(v => ({ x: v.x, y: v.y })),
        result
    };

    history.unshift(historyEntry);
    if (history.length > 10) history.pop(); // Mantener solo los últimos 10
    localStorage.setItem('vectorHistory', JSON.stringify(history));
    renderHistory();
}

function updateGraph(vectors, result, operation) {
    try {
        // Limpiar expresiones anteriores
        currentExpressions.forEach(id => {
            try {
                calculator.removeExpression({ id });
            } catch (e) {
                console.warn('Error al eliminar expresión:', e);
            }
        });
        currentExpressions = [];

        // Dibujar vectores de entrada
        vectors.forEach((vector, index) => {
            const color = index === 0 ? '#4fd1c5' : (index === 1 ? '#81e6d9' : '#f6e05e');
            drawVector(vector, `vector${index + 1}`, color);
        });

        if (operation === 'sum') {
            drawVector(result, 'result', '#f687b3', 'Resultante');
            // Línea punteada del paralelogramo (de la punta de A a la punta de R)
            if (vectors.length >= 2) {
                const A = vectors[0];
                const B = vectors[1];
                calculator.setExpression({
                    id: 'paralelogramo',
                    latex: `\\left(${A.x} + t*${B.x}, ${A.y} + t*${B.y}\\right)`,
                    parametricDomain: { min: 0, max: 1 },
                    color: '#f6e05e',
                    lineStyle: 'dashed',
                    lineWidth: 2
                });
                currentExpressions.push('paralelogramo');
            }
        } else if (operation === 'angle') {
            drawAngleArc(vectors[0], vectors[1], result);
        } else if (operation === 'dot') {
            // Producto escalar: dibujar ángulo y mostrar fórmula
            if (vectors.length >= 2) {
                // Dibujar arco del ángulo
                const v1 = vectors[0];
                const v2 = vectors[1];
                // Calcular ángulo
                const dot = v1.x * v2.x + v1.y * v2.y;
                const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
                const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
                let theta = 0;
                if (mag1 > 0 && mag2 > 0) {
                    theta = Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);
                }
                drawAngleArc(v1, v2, theta);
                // Mostrar fórmula y resultado
                const latex = `A \\cdot B = |A||B| \\cos(\\theta) = ${fmt(mag1)} \\times ${fmt(mag2)} \\times \\cos(${theta.toFixed(2)}^\\circ) = ${result.toFixed(2)}`;
                calculator.setExpression({
                    id: 'dot_formula',
                    latex: `y = 0`,
                    label: latex,
                    showLabel: true,
                    color: '#f687b3',
                    dragMode: Desmos.DragModes.NONE
                });
                currentExpressions.push('dot_formula');
            }
        }

        // Ajustar vista
        adjustViewport(vectors, result, operation);

    } catch (error) {
        console.error('Error al actualizar gráfico:', error);
    }
}

function drawVector(vector, id, color, labelName = null) {
    try {
        // Limpiar expresiones anteriores para este vector
        ['_body', '_head1', '_head2', '_label'].forEach(suffix => {
            try {
                calculator.removeExpression({ id: `${id}${suffix}` });
            } catch (e) {
                console.warn(`Error al eliminar expresión ${id}${suffix}:`, e);
            }
        });

        // Cuerpo de la flecha (línea principal)
        const bodyExpression = {
            id: `${id}_body`,
            latex: `(t*${vector.x}, t*${vector.y})`,
            parametricDomain: { min: 0, max: 1 },
            color: color,
            lineStyle: 'solid',
            lineWidth: 3
        };
        calculator.setExpression(bodyExpression);
        currentExpressions.push(`${id}_body`);

        // Calcular la cabeza de la flecha
        const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        if (magnitude > 0.0001) {
            const headLength = Math.max(0.3, magnitude * 0.15);
            const angle = Math.atan2(vector.y, vector.x);
            
            // Puntos para la cabeza de la flecha
            const headAngle1 = angle + Math.PI - Math.PI/6;
            const headAngle2 = angle + Math.PI + Math.PI/6;
            
            const hx1 = vector.x + headLength * Math.cos(headAngle1);
            const hy1 = vector.y + headLength * Math.sin(headAngle1);
            const hx2 = vector.x + headLength * Math.cos(headAngle2);
            const hy2 = vector.y + headLength * Math.sin(headAngle2);

            // Líneas de la cabeza
            const head1Expression = {
                id: `${id}_head1`,
                latex: `(${vector.x} + t*(${hx1 - vector.x}), ${vector.y} + t*(${hy1 - vector.y}))`,
                parametricDomain: { min: 0, max: 1 },
                color: color,
                lineStyle: 'solid',
                lineWidth: 3
            };
            calculator.setExpression(head1Expression);
            currentExpressions.push(`${id}_head1`);

            const head2Expression = {
                id: `${id}_head2`,
                latex: `(${vector.x} + t*(${hx2 - vector.x}), ${vector.y} + t*(${hy2 - vector.y}))`,
                parametricDomain: { min: 0, max: 1 },
                color: color,
                lineStyle: 'solid',
                lineWidth: 3
            };
            calculator.setExpression(head2Expression);
            currentExpressions.push(`${id}_head2`);
        }

        // Etiqueta del vector
        // El nombre será A, B, C... o "Resultante" si es el vector suma
        let label = labelName;
        if (!label) {
            // Si es vector1, vector2, etc.
            const match = id.match(/vector(\d+)/);
            if (match) {
                const idx = parseInt(match[1], 10);
                label = String.fromCharCode(65 + idx - 1); // A, B, C...
            } else if (id === 'result') {
                label = 'Resultante';
            } else {
                label = id;
            }
        }
        // Mostrar componentes
        const labelText = `${label} (${vector.x.toFixed(2)}, ${vector.y.toFixed(2)})`;
        calculator.setExpression({
            id: `${id}_label`,
            latex: `(${vector.x/2}, ${vector.y/2})`,
            color: color,
            label: labelText,
            showLabel: true,
            dragMode: Desmos.DragModes.NONE
        });
        currentExpressions.push(`${id}_label`);
    } catch (error) {
        console.error('Error al dibujar vector:', error);
    }
}

function adjustViewport(vectors, result, operation) {
    try {
        const points = [
            [0, 0],
            ...vectors.map(v => [v.x, v.y])
        ];

        if (operation === 'sum') {
            points.push([result.x, result.y]);
        }

        // Calcular límites
        const xCoords = points.map(p => p[0]);
        const yCoords = points.map(p => p[1]);
        const xMin = Math.min(...xCoords);
        const xMax = Math.max(...xCoords);
        const yMin = Math.min(...yCoords);
        const yMax = Math.max(...yCoords);

        // Agregar margen
        const margin = Math.max(
            Math.abs(xMax - xMin),
            Math.abs(yMax - yMin)
        ) * 0.2;

        // Ajustar vista
        calculator.setMathBounds({
            left: xMin - margin,
            right: xMax + margin,
            bottom: yMin - margin,
            top: yMax + margin
        });
    } catch (error) {
        console.error('Error al ajustar viewport:', error);
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon();
    updateCalculatorTheme();
}

function updateThemeIcon() {
    const themeSwitch = document.getElementById('theme-switch');
    const svg = themeSwitch.querySelector('svg');
    const currentTheme = document.documentElement.getAttribute('data-theme');
    
    if (currentTheme === 'dark') {
        svg.innerHTML = '<path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>';
    } else {
        svg.innerHTML = '<path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>';
    }
}

function updateCalculatorTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    calculator.setBackgroundColor(currentTheme === 'dark' ? 'transparent' : '#ffffff');
  }

  function renderHistory() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;

    historyList.innerHTML = history.map(entry => {
        let resultText = '';
        switch (entry.operation) {
            case 'sum':
                resultText = `Vector: (${entry.result.x.toFixed(2)}, ${entry.result.y.toFixed(2)})`;
                break;
            case 'dot':
                resultText = `Producto: ${entry.result.toFixed(2)}`;
                break;
            case 'magnitude':
                resultText = `Magnitudes: ${entry.result.map(v => v.magnitude.toFixed(2)).join(', ')}`;
                break;
            case 'angle':
                resultText = `Ángulo: ${entry.result.toFixed(2)}°`;
                break;
        }

        return `
            <li class="animate__animated animate__fadeIn">
                <div class="history-time">${entry.timestamp}</div>
                <div class="history-operation">${entry.operation.toUpperCase()}</div>
                <div class="history-result">${resultText}</div>
      </li>
        `;
    }).join('');
  }

  function clearHistory() {
    history = [];
    localStorage.removeItem('vectorHistory');
    renderHistory();
  }

function setupTutorial() {
    const tutorialModal = document.getElementById('tutorial-modal');
    const prevButton = document.getElementById('prev-step');
    const nextButton = document.getElementById('next-step');
    const dismissButton = document.getElementById('dismiss-tutorial');
    const closeButton = document.getElementById('close-tutorial');
    const reopenButton = document.getElementById('reopen-tutorial');

    // Mostrar el tutorial cada vez que se carga la página
    tutorialModal.style.display = 'flex';

    // Navegación del tutorial
    prevButton.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateTutorialStep();
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentStep < totalSteps) {
            currentStep++;
            updateTutorialStep();
        }
    });

    dismissButton.addEventListener('click', () => {
        tutorialModal.style.display = 'none';
    });

    closeButton.addEventListener('click', () => {
        tutorialModal.style.display = 'none';
    });

    reopenButton.addEventListener('click', () => {
        currentStep = 1;
        updateTutorialStep();
        tutorialModal.style.display = 'flex';
        tutorialModal.classList.remove('animate__fadeOut');
        tutorialModal.classList.add('animate__fadeIn');
    });
}

function updateTutorialStep() {
    // Actualizar pasos
    document.querySelectorAll('.tutorial-step').forEach(step => {
        step.classList.remove('active');
        if (parseInt(step.dataset.step) === currentStep) {
            step.classList.add('active');
        }
    });

    // Actualizar botones
    const prevButton = document.getElementById('prev-step');
    const nextButton = document.getElementById('next-step');
    const dismissButton = document.getElementById('dismiss-tutorial');

    prevButton.disabled = currentStep === 1;
    if (currentStep === totalSteps) {
        nextButton.style.display = 'none';
        dismissButton.style.display = 'block';
    } else {
        nextButton.style.display = 'block';
        dismissButton.style.display = 'none';
    }
}

/**
 * Dibuja los arcos de ángulo entre dos vectores, asegurando que el arco esté siempre entre ellos,
 * partiendo del origen y siguiendo el sentido correcto. Las etiquetas se posicionan en el centro del sector.
 */
function drawAngleArc(v1, v2, angleMenor) {
    // Ángulos respecto al eje X
    const theta1 = Math.atan2(v1.y, v1.x);
    const theta2 = Math.atan2(v2.y, v2.x);
    // Calcular diferencia y normalizar
    let delta = theta2 - theta1;
    while (delta < 0) delta += 2 * Math.PI;
    // Menor y mayor ángulo
    const menor = delta <= Math.PI ? delta : 2 * Math.PI - delta;
    const mayor = 2 * Math.PI - menor;
    // Sentidos
    let startMenor = theta1;
    let endMenor = theta1 + menor;
    let startMayor = theta1 + menor;
    let endMayor = theta1 + 2 * Math.PI;
    // Radio fijo proporcional al menor vector
    const r = Math.max(1, Math.min(
        Math.sqrt(v1.x * v1.x + v1.y * v1.y),
        Math.sqrt(v2.x * v2.x + v2.y * v2.y)
    ) * 0.3);
    // Arco menor (agudo)
    calculator.setExpression({
        id: 'angle_arc_menor',
        latex: `\\left(${r} \\cos(t), ${r} \\sin(t)\\right)`,
        parametricDomain: { min: startMenor, max: endMenor },
        color: '#f687b3',
        lineStyle: 'solid',
        lineWidth: 3
    });
    currentExpressions.push('angle_arc_menor');
    // Etiqueta menor
    const labelAngleMenor = startMenor + menor / 2;
    const labelRadiusMenor = r * 1.18;
    calculator.setExpression({
        id: 'angle_label_menor',
        latex: `\\left(${labelRadiusMenor} \\cos(${labelAngleMenor}), ${labelRadiusMenor} \\sin(${labelAngleMenor})\\right)`,
        color: '#f687b3',
        label: `${(menor * 180 / Math.PI).toFixed(2)}°`,
        showLabel: true,
        dragMode: Desmos.DragModes.NONE
    });
    currentExpressions.push('angle_label_menor');
    // Arco mayor (obtuso)
    calculator.setExpression({
        id: 'angle_arc_mayor',
        latex: `\\left(${r * 0.85} \\cos(t), ${r * 0.85} \\sin(t)\\right)`,
        parametricDomain: { min: endMenor, max: endMayor },
        color: '#81e6d9',
        lineStyle: 'dashed',
        lineWidth: 2,
        opacity: 0.5
    });
    currentExpressions.push('angle_arc_mayor');
    // Etiqueta mayor
    const labelAngleMayor = endMenor + (mayor / 2);
    const labelRadiusMayor = r * 0.95;
    calculator.setExpression({
        id: 'angle_label_mayor',
        latex: `\\left(${labelRadiusMayor} \\cos(${labelAngleMayor}), ${labelRadiusMayor} \\sin(${labelAngleMayor})\\right)`,
        color: '#81e6d9',
        label: `${(mayor * 180 / Math.PI).toFixed(2)}°`,
        showLabel: true,
        dragMode: Desmos.DragModes.NONE
    });
    currentExpressions.push('angle_label_mayor');
}