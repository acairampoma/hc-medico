/**
 * Herramientas avanzadas para el visor DICOM
 * Incluye zoom, medición, ajuste de brillo/contraste y rotación
 */

// Variables globales para las herramientas
let currentTool = null;
let zoomLevel = 1;
let rotationAngle = 0;
let brightness = 0;
let contrast = 0;

// Variables para medición
let measurementStartPoint = null;
let measurementEndPoint = null;
let isMeasuring = false;
const pixelSpacing = 0.2; // mm por píxel (valor de ejemplo, debe obtenerse del DICOM)

/**
 * Inicializa las herramientas DICOM cuando el documento está listo
 */
document.addEventListener('DOMContentLoaded', function() {
    initDicomTools();
});

/**
 * Inicializa todas las herramientas DICOM
 */
function initDicomTools() {
    console.log('🔧 Inicializando herramientas DICOM');
    
    // Configurar el contenedor de herramientas con z-index adecuado
    const toolsContainer = document.getElementById('toolsContainer');
    if (toolsContainer) {
        toolsContainer.style.zIndex = '9999';
        console.log('✅ Contenedor de herramientas configurado con z-index: 9999');
    } else {
        console.error('❌ No se encontró el contenedor de herramientas');
    }
    
    // Configurar los controles de herramientas con z-index adecuado
    const toolControls = document.querySelectorAll('.tool-controls');
    toolControls.forEach(control => {
        control.style.zIndex = '10000';
        // Asegurar que los controles sean visibles cuando se activan
        control.style.position = 'absolute';
        control.style.visibility = 'visible';
    });
    console.log(`✅ ${toolControls.length} controles de herramientas configurados con z-index: 10000`);
    
    // Asegurar que los controles de brillo/contraste estén configurados correctamente
    const windowControls = document.getElementById('windowControls');
    if (windowControls) {
        windowControls.style.zIndex = '10000';
        windowControls.style.position = 'absolute';
        windowControls.style.visibility = 'visible';
        console.log('✅ Controles de brillo/contraste configurados correctamente');
    }
}

/**
 * Inicializa el canvas de medición y lo ajusta al tamaño del contenedor de la imagen
 */
function initMeasurementCanvas() {
    const canvas = document.getElementById('measureCanvas');
    if (!canvas) {
        console.error('❌ Canvas de medición no encontrado');
        return;
    }
    
    const imageViewer = document.getElementById('imageViewer');
    if (!imageViewer) {
        console.error('❌ Contenedor de imagen no encontrado');
        return;
    }
    
    // Ajustar tamaño del canvas al contenedor de la imagen
    function resizeCanvas() {
        const rect = imageViewer.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        console.log(`📷 Canvas de medición ajustado a ${canvas.width}x${canvas.height}`);
        
        // Si hay una medición activa, redibujarla
        if (measurementStartPoint && measurementEndPoint) {
            drawMeasurementLine();
        }
    }
    
    // Ajustar tamaño inicial
    resizeCanvas();
    
    // Ajustar tamaño cuando cambie el tamaño de la ventana
    window.addEventListener('resize', resizeCanvas);
    
    // Configurar eventos táctiles para dispositivos móviles
    canvas.addEventListener('touchstart', function(e) {
        if (currentTool !== 'measure') return;
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        measurementStartPoint = {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
        isMeasuring = true;
    });
    
    canvas.addEventListener('touchmove', function(e) {
        if (!isMeasuring || currentTool !== 'measure') return;
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        measurementEndPoint = {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
        drawMeasurementLine();
        updateMeasurementInfo();
    });
    
    canvas.addEventListener('touchend', function(e) {
        if (currentTool !== 'measure') return;
        e.preventDefault();
        endMeasurement();
    });
    
    console.log('📷 Canvas de medición inicializado correctamente');
}

/**
 * Activa o desactiva una herramienta específica
 * @param {string} toolName - Nombre de la herramienta a activar (zoom, measure, window, rotate)
 */
function toggleTool(toolName) {
    console.log(`🔧 Activando herramienta: ${toolName}`);
    
    // Desactivar herramienta actual si existe
    if (currentTool) {
        try {
            const currentToolBtn = document.getElementById(`${currentTool}Tool`);
            if (currentToolBtn) {
                currentToolBtn.classList.remove('active');
            }
            
            const currentToolControls = document.getElementById(`${currentTool}Controls`);
            if (currentToolControls) {
                currentToolControls.style.display = 'none';
                currentToolControls.classList.remove('visible'); // Eliminar clase visible
                console.log(`✅ Ocultando controles de herramienta ${currentTool}`);
            }
            
            // Manejo específico para cada tipo de herramienta
            if (currentTool === 'measure') {
                const measureContainer = document.getElementById('measurementContainer');
                if (measureContainer) {
                    measureContainer.style.display = 'none';
                }
                
                const canvas = document.getElementById('measureCanvas');
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            } else if (currentTool === 'window') {
                // Limpiar controles de brillo/contraste
                const windowControls = document.getElementById('windowControls');
                if (windowControls) {
                    windowControls.style.display = 'none';
                    windowControls.classList.remove('visible');
                    console.log('✅ Controles de brillo/contraste ocultados');
                }
            }
        } catch (error) {
            console.error(`Error al desactivar herramienta ${currentTool}:`, error);
        }
    }
    
    // Si seleccionamos la misma herramienta, la desactivamos
    if (currentTool === toolName) {
        console.log(`🛡️ Desactivando herramienta: ${toolName}`);
        currentTool = null;
        return;
    }
    
    // Activar nueva herramienta
    currentTool = toolName;
    
    try {
        // Activar botón de herramienta
        const toolBtn = document.getElementById(`${toolName}Tool`);
        if (toolBtn) {
            toolBtn.classList.add('active');
            console.log(`✅ Botón de herramienta ${toolName} activado`);
        } else {
            console.error(`❌ Botón de herramienta ${toolName} no encontrado`);
        }
        
        // Mostrar controles de herramienta
        const toolControls = document.getElementById(`${toolName}Controls`);
        if (toolControls) {
            // Asegurarse de que los controles estén visibles y por encima de la imagen
            toolControls.style.display = 'block';
            toolControls.style.zIndex = '10000'; // Asegurar un z-index alto
            console.log(`✅ Controles de herramienta ${toolName} mostrados con z-index: ${toolControls.style.zIndex}`);
            
            // Asegurarse de que el contenedor de herramientas esté visible
            const toolsContainer = document.getElementById('toolsContainer');
            if (toolsContainer) {
                toolsContainer.style.zIndex = '9999';
                console.log(`✅ Contenedor de herramientas visible con z-index: ${toolsContainer.style.zIndex}`);
            }
        } else {
            console.error(`❌ Controles de herramienta ${toolName} no encontrados`);
        }
        
        // Configuración específica para cada herramienta
        if (toolName === 'measure') {
            setupMeasurementTool();
        } else if (toolName === 'zoom') {
            updateZoomDisplay();
        } else if (toolName === 'window') {
            // Asegurar que los controles de brillo/contraste estén visibles
            const windowControls = document.getElementById('windowControls');
            if (windowControls) {
                windowControls.style.display = 'block';
                windowControls.style.zIndex = '10000';
                windowControls.style.position = 'absolute';
                windowControls.style.visibility = 'visible';
                windowControls.classList.add('visible'); // Añadir clase visible para estilos CSS
                console.log(`✅ Controles de brillo/contraste mostrados con z-index: ${windowControls.style.zIndex}`);
            }
            
            const brightnessSlider = document.getElementById('brightnessSlider');
            const contrastSlider = document.getElementById('contrastSlider');
            
            if (brightnessSlider) {
                brightnessSlider.value = brightness;
                console.log(`✅ Slider de brillo configurado a: ${brightness}`);
            } else {
                console.error('❌ Slider de brillo no encontrado');
            }
            
            if (contrastSlider) {
                contrastSlider.value = contrast;
                console.log(`✅ Slider de contraste configurado a: ${contrast}`);
            } else {
                console.error('❌ Slider de contraste no encontrado');
            }
            
            // Aplicar los valores actuales de brillo/contraste
            applyWindowLevel();
            
            // Forzar la visibilidad después de un breve retraso
            setTimeout(() => {
                if (windowControls) {
                    windowControls.style.display = 'block';
                    windowControls.style.visibility = 'visible';
                    console.log('✅ Visibilidad de controles de brillo/contraste forzada');
                }
            }, 100);
        } else if (toolName === 'rotate') {
            updateRotationDisplay();
        }
    } catch (error) {
        console.error(`Error al activar herramienta ${toolName}:`, error);
    }
}

// === ZOOM ===
/**
 * Ajusta el nivel de zoom
 * @param {number} delta - Cantidad a ajustar el zoom (positivo para acercar, negativo para alejar)
 */
function adjustZoom(delta) {
    zoomLevel = Math.max(0.1, Math.min(5, zoomLevel + delta));
    applyZoom();
    updateZoomDisplay();
}

/**
 * Restablece el zoom al nivel original (1:1)
 */
function resetZoom() {
    zoomLevel = 1;
    applyZoom();
    updateZoomDisplay();
}

/**
 * Aplica el nivel de zoom actual a la imagen
 */
function applyZoom() {
    const image = document.getElementById('dicomImage');
    if (image) {
        console.log(`🔍 Aplicando zoom: ${zoomLevel}x, rotación: ${rotationAngle}°`);
        image.style.transform = `scale(${zoomLevel}) rotate(${rotationAngle}deg)`;
        image.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        image.style.transformOrigin = 'center center';
    } else {
        console.error('❌ No se encontró la imagen para aplicar zoom');
    }
}

/**
 * Actualiza el indicador de nivel de zoom
 */
function updateZoomDisplay() {
    document.getElementById('zoomLevel').textContent = `${Math.round(zoomLevel * 100)}%`;
}

// === MEDICIÓN ===
/**
 * Configura la herramienta de medición
 */
function setupMeasurementTool() {
    console.log('📏 Configurando herramienta de medición');
    
    const container = document.getElementById('measurementContainer');
    if (!container) {
        console.error('❌ Contenedor de medición no encontrado');
        return;
    }
    
    // Mostrar el contenedor de medición
    container.style.display = 'block';
    
    // Inicializar el canvas de medición
    initMeasurementCanvas();
    
    const canvas = document.getElementById('measureCanvas');
    if (!canvas) {
        console.error('❌ Canvas de medición no encontrado después de inicialización');
        return;
    }
    
    // Limpiar canvas por si acaso
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Resetear puntos de medición
    measurementStartPoint = null;
    measurementEndPoint = null;
    isMeasuring = false;
    
    // Configurar eventos de ratón
    canvas.addEventListener('mousedown', startMeasurement);
    canvas.addEventListener('mousemove', updateMeasurement);
    canvas.addEventListener('mouseup', endMeasurement);
    
    // Asegurarnos de que el evento mouseup se detecte incluso si el cursor sale del canvas
    document.addEventListener('mouseup', function(e) {
        if (isMeasuring && currentTool === 'measure') {
            endMeasurement(e);
        }
    });
    
    // Mostrar información de medición
    const infoElement = document.getElementById('measurementInfo');
    if (infoElement) {
        infoElement.innerHTML = '<span>Haga clic y arrastre para medir</span>';
        infoElement.classList.add('show');
    }
    
    console.log('✅ Herramienta de medición configurada correctamente');
}

/**
 * Inicia la medición cuando se hace clic en el canvas
 * @param {MouseEvent} e - Evento del mouse
 */
function startMeasurement(e) {
    if (currentTool !== 'measure') return;
    
    const canvas = document.getElementById('measureCanvas');
    const rect = canvas.getBoundingClientRect();
    
    measurementStartPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
    
    isMeasuring = true;
}

/**
 * Actualiza la medición mientras se mueve el mouse
 * @param {MouseEvent} e - Evento del mouse
 */
function updateMeasurement(e) {
    if (!isMeasuring || currentTool !== 'measure') return;
    
    const canvas = document.getElementById('measureCanvas');
    const rect = canvas.getBoundingClientRect();
    
    measurementEndPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
    
    drawMeasurementLine();
    updateMeasurementInfo();
}

/**
 * Finaliza la medición cuando se suelta el clic
 */
function endMeasurement() {
    if (currentTool !== 'measure') return;
    
    isMeasuring = false;
    
    // Mostrar información de medición final
    if (measurementStartPoint && measurementEndPoint) {
        updateMeasurementInfo(true);
    }
}

/**
 * Resetea la herramienta de medición
 */
function resetMeasurement() {
    console.log('📏 Reseteando herramienta de medición');
    
    // Resetear variables
    measurementStartPoint = null;
    measurementEndPoint = null;
    isMeasuring = false;
    
    // Ocultar contenedor de medición
    const container = document.getElementById('measurementContainer');
    if (container) {
        container.style.display = 'none';
    }
    
    // Limpiar canvas
    const canvas = document.getElementById('measureCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Ocultar información de medición
    const infoElement = document.getElementById('measurementInfo');
    if (infoElement) {
        infoElement.classList.remove('show');
    }
    
    console.log('✅ Herramienta de medición reseteada correctamente');
}

/**
 * Dibuja la línea de medición en el canvas
 */
function drawMeasurementLine() {
    if (!measurementStartPoint || !measurementEndPoint) return;
    
    const canvas = document.getElementById('measureCanvas');
    if (!canvas) {
        console.error('❌ Canvas de medición no encontrado');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar línea principal
    ctx.beginPath();
    ctx.moveTo(measurementStartPoint.x, measurementStartPoint.y);
    ctx.lineTo(measurementEndPoint.x, measurementEndPoint.y);
    ctx.strokeStyle = '#4299e1'; // Azul más brillante
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Dibujar línea de contorno para mejor visibilidad
    ctx.beginPath();
    ctx.moveTo(measurementStartPoint.x, measurementStartPoint.y);
    ctx.lineTo(measurementEndPoint.x, measurementEndPoint.y);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 4;
    ctx.setLineDash([5, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Dibujar puntos en los extremos
    // Punto inicial (más grande y con borde)
    ctx.fillStyle = '#4299e1';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    
    // Punto inicial
    ctx.beginPath();
    ctx.arc(measurementStartPoint.x, measurementStartPoint.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Punto final
    ctx.beginPath();
    ctx.arc(measurementEndPoint.x, measurementEndPoint.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Dibujar flechas en los extremos para indicar la dirección de medición
    drawArrow(ctx, measurementStartPoint, measurementEndPoint);
}

/**
 * Dibuja flechas en los extremos de la línea de medición
 * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
 * @param {Object} start - Punto inicial
 * @param {Object} end - Punto final
 */
function drawArrow(ctx, start, end) {
    const headLength = 10; // Longitud de la punta de la flecha
    const headAngle = Math.PI / 6; // Ángulo de la punta (30 grados)
    
    // Calcular el ángulo de la línea
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    
    // Dibujar la punta de la flecha en el punto final
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
        end.x - headLength * Math.cos(angle - headAngle),
        end.y - headLength * Math.sin(angle - headAngle)
    );
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
        end.x - headLength * Math.cos(angle + headAngle),
        end.y - headLength * Math.sin(angle + headAngle)
    );
    ctx.strokeStyle = '#4299e1';
    ctx.lineWidth = 2;
    ctx.stroke();
}

/**
 * Actualiza la información de medición
 * @param {boolean} isFinal - Indica si es la medición final
 */
function updateMeasurementInfo(isFinal = false) {
    if (!measurementStartPoint || !measurementEndPoint) return;
    
    const dx = measurementEndPoint.x - measurementStartPoint.x;
    const dy = measurementEndPoint.y - measurementStartPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Convertir a mm usando el pixelSpacing
    const distanceInMm = distance * pixelSpacing;
    
    const infoElement = document.getElementById('measurementInfo');
    
    // Mostrar la distancia con 1 decimal
    if (isFinal) {
        infoElement.innerHTML = `<span>Distancia: <strong>${distanceInMm.toFixed(1)} mm</strong></span>`;
    } else {
        infoElement.innerHTML = `<span>${distanceInMm.toFixed(1)} mm</span>`;
    }
    
    // La información se muestra en una posición fija en la parte inferior
    // No necesitamos cambiar la posición, ya que está definida en CSS
    infoElement.style.opacity = '1';
    
    if (isFinal) {
        infoElement.classList.add('show');
    } else {
        infoElement.classList.remove('show');
    }
    
    console.log(`📏 Medición: ${distanceInMm.toFixed(1)} mm`);
}

// === BRILLO/CONTRASTE ===
/**
 * Ajusta el brillo de la imagen
 * @param {number} value - Valor de brillo (-100 a 100)
 */
function adjustBrightness(value) {
    brightness = parseInt(value);
    applyWindowLevel();
}

/**
 * Ajusta el contraste de la imagen
 * @param {number} value - Valor de contraste (-100 a 100)
 */
function adjustContrast(value) {
    contrast = parseInt(value);
    applyWindowLevel();
}

/**
 * Restablece los valores de brillo y contraste
 */
function resetWindowLevel() {
    console.log('↻ Reseteando brillo y contraste a valores predeterminados');
    
    brightness = 0;
    contrast = 0;
    
    const brightnessSlider = document.getElementById('brightnessSlider');
    const contrastSlider = document.getElementById('contrastSlider');
    
    if (brightnessSlider) {
        brightnessSlider.value = 0;
        console.log('✅ Slider de brillo reseteado a 0');
    } else {
        console.error('❌ No se encontró el slider de brillo');
    }
    
    if (contrastSlider) {
        contrastSlider.value = 0;
        console.log('✅ Slider de contraste reseteado a 0');
    } else {
        console.error('❌ No se encontró el slider de contraste');
    }
    
    // Asegurarse de que los controles estén visibles si la herramienta está activa
    if (currentTool === 'window') {
        const windowControls = document.getElementById('windowControls');
        if (windowControls) {
            windowControls.style.display = 'block';
            windowControls.style.zIndex = '10000';
        }
    }
    
    applyWindowLevel();
    console.log('✅ Brillo y contraste reseteados correctamente');
}

/**
 * Aplica los ajustes de brillo y contraste a la imagen
 */
function applyWindowLevel() {
    const image = document.getElementById('dicomImage');
    if (image) {
        console.log(`🌙 Aplicando brillo: ${brightness}, contraste: ${contrast}`);
        
        // Aplicar filtros CSS para brillo y contraste
        const brightnessValue = 1 + brightness/100;
        const contrastValue = 1 + contrast/100;
        image.style.filter = `brightness(${brightnessValue}) contrast(${contrastValue})`;
        image.style.transition = 'filter 0.3s ease';
        
        // Actualizar los sliders si están visibles
        if (currentTool === 'window') {
            const brightnessSlider = document.getElementById('brightnessSlider');
            const contrastSlider = document.getElementById('contrastSlider');
            
            if (brightnessSlider && brightnessSlider.value != brightness) {
                brightnessSlider.value = brightness;
            }
            
            if (contrastSlider && contrastSlider.value != contrast) {
                contrastSlider.value = contrast;
            }
            
            // Asegurarse de que los controles estén visibles
            const windowControls = document.getElementById('windowControls');
            if (windowControls) {
                windowControls.style.display = 'block';
                windowControls.style.zIndex = '10000'; // Asegurar un z-index alto
                windowControls.style.position = 'absolute';
                windowControls.style.visibility = 'visible';
                windowControls.classList.add('visible'); // Añadir clase visible para estilos CSS
                
                // Asegurar que los controles estén correctamente posicionados
                const toolsContainer = document.getElementById('toolsContainer');
                if (toolsContainer) {
                    toolsContainer.style.zIndex = '9999';
                }
                
                // Forzar la visibilidad después de un breve retraso
                setTimeout(() => {
                    windowControls.style.display = 'block';
                    windowControls.style.visibility = 'visible';
                    windowControls.classList.add('visible'); // Añadir clase visible para estilos CSS
                }, 50);
            }
        }
    } else {
        console.error('❌ No se encontró la imagen para aplicar brillo/contraste');
    }
}

// === ROTACIÓN ===
/**
 * Rota la imagen un número específico de grados
 * @param {number} degrees - Grados a rotar
 */
function rotateImage(degrees) {
    // Actualizar el ángulo de rotación
    rotationAngle = (rotationAngle + degrees) % 360;
    
    console.log(`🛠 Rotando imagen ${degrees}°, nuevo ángulo: ${rotationAngle}°`);
    
    // Obtener la imagen y verificar que existe
    const image = document.getElementById('dicomImage');
    if (!image) {
        console.error('❌ No se encontró la imagen para rotar');
        return;
    }
    
    // Aplicar la rotación
    applyRotation();
    
    // Forzar un reflow para asegurar que la rotación se aplique
    void image.offsetWidth;
    
    // Actualizar el display
    updateRotationDisplay();
}

/**
 * Restablece la rotación a 0 grados
 */
function resetRotation() {
    rotationAngle = 0;
    applyRotation();
    updateRotationDisplay();
}

/**
 * Aplica la rotación actual a la imagen
 */
function applyRotation() {
    const image = document.getElementById('dicomImage');
    if (image) {
        console.log(`🔄 Aplicando rotación: ${rotationAngle}°, zoom: ${zoomLevel}x`);
        
        // Asegurarse de que la imagen tenga los estilos necesarios para la rotación
        image.style.display = 'block';
        image.style.margin = '0 auto';
        
        // Aplicar transformación con rotación y zoom
        image.style.transform = `scale(${zoomLevel}) rotate(${rotationAngle}deg)`;
        image.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        image.style.transformOrigin = 'center center';
        
        // Asegurarse de que el contenedor tenga suficiente espacio para la imagen rotada
        const container = document.getElementById('imageViewer');
        if (container) {
            container.style.overflow = 'hidden';
            container.style.position = 'relative';
            container.style.display = 'flex';
            container.style.justifyContent = 'center';
            container.style.alignItems = 'center';
        }
        
        // Actualizar el valor de rotación en la interfaz
        updateRotationDisplay();
        
        console.log(`✅ Rotación aplicada: ${rotationAngle}°`);
    } else {
        console.error('❌ No se encontró la imagen para aplicar rotación');
    }
}

/**
 * Actualiza el indicador de ángulo de rotación
 */
function updateRotationDisplay() {
    const rotationValueElement = document.getElementById('rotationValue');
    if (rotationValueElement) {
        // Normalizar el ángulo para que siempre esté entre 0 y 359 grados
        const normalizedAngle = ((rotationAngle % 360) + 360) % 360;
        rotationValueElement.textContent = `${normalizedAngle}°`;
        console.log(`📊 Valor de rotación actualizado: ${normalizedAngle}°`);
    } else {
        console.warn('⚠️ No se encontró el elemento para mostrar el valor de rotación');
    }
}

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar herramientas
    const measureCanvas = document.getElementById('measureCanvas');
    if (measureCanvas) {
        const ctx = measureCanvas.getContext('2d');
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
    }
    
    // Asegurarse de que los controles estén ocultos inicialmente
    const zoomControls = document.getElementById('zoomControls');
    const measurementContainer = document.getElementById('measurementContainer');
    const windowControls = document.getElementById('windowControls');
    const rotateControls = document.getElementById('rotateControls');
    
    if (zoomControls) zoomControls.style.display = 'none';
    if (measurementContainer) measurementContainer.style.display = 'none';
    if (windowControls) windowControls.style.display = 'none';
    if (rotateControls) rotateControls.style.display = 'none';
});
