/**
 * NOTAS MÉDICAS - CÓDIGO COMPLETO Y LIMPIO
 * Alan Cairampoma 2025
 * TODO FUNCIONA: Datos, Alineación, Imágenes movibles
 */

console.log('📋 Cargando notas médicas...');

// ===== FUNCIÓN PRINCIPAL =====
function inicializarNotasMedicas() {
    console.log('🚀 Inicializando...');
    
    // 1. OBTENER DATOS DE LA URL
    var params = new URLSearchParams(window.location.search);
    var nombre = decodeURIComponent(params.get('patientName') || 'Paciente');
    var cama = params.get('bedNumber') || '---';
    var id = params.get('patientId') || 'temp';
    
    console.log('📋 Datos:', nombre, cama);
    
    // 2. LLAMAR A TODAS LAS FUNCIONES
    // 1. CONFIGURACIÓN BÁSICA (primero)
    actualizarCamposPaciente(nombre, cama, id);
    configurarEditor();
    actualizarFechaHora();

    // 2. FORMATO DE TEXTO (segundo)
    setupAlineacion();
    setupTextFormatting();
    setupEditorActions(); // deshacer/rehacer antes que contenido

    // 3. CONTENIDO E IMÁGENES (tercero)
    setupImageUpload();
    setupImageTable();

    // 4. HERRAMIENTAS AVANZADAS (cuarto)
    setupVoiceDictation();
    setupImagePaint(); // después de las imágenes

    // 5. FIRMA DIGITAL (quinto)
    setupDigitalSignature();

    // 6. PREVISUALIZACIÓN (AL FINAL)
    setupMedicalNotePreview(); // siempre último
}

// ===== FUNCIÓN: ACTUALIZAR DATOS DEL PACIENTE =====
function actualizarCamposPaciente(nombre, cama, id) {
    console.log('🔄 Actualizando campos del paciente...');
    
    var tabla = document.querySelector('.patient-data-table');
    if (tabla) {
        var filas = tabla.querySelectorAll('tr');
        
        filas.forEach(function(fila) {
            var celdas = fila.querySelectorAll('td');
            
            // LADO IZQUIERDO DE LA TABLA
            if (celdas[0] && celdas[1]) {
                var etiqueta = celdas[0].textContent.trim();
                if (etiqueta === 'PACIENTE:') {
                    celdas[1].textContent = nombre;
                }
                if (etiqueta === 'HC:') {
                    celdas[1].textContent = id.substring(0, 10);
                }
            }
            
            // LADO DERECHO DE LA TABLA
            if (celdas[2] && celdas[3]) {
                var etiqueta2 = celdas[2].textContent.trim();
                if (etiqueta2 === 'CAMA:') {
                    celdas[3].textContent = cama;
                }
            }
        });
        
        console.log('✅ Tabla actualizada');
    } else {
        console.warn('⚠️ Tabla no encontrada');
    }
}

// ===== FUNCIÓN: CONFIGURAR EDITOR =====
function configurarEditor() {
    var editor = document.getElementById('medicalNoteEditor');
    if (editor) {
        editor.setAttribute('contenteditable', 'true');
        console.log('✅ Editor configurado');
    }
}

// ===== FUNCIÓN: ACTUALIZAR FECHA Y HORA =====
function actualizarFechaHora() {
    var ahora = new Date();
    var fecha = ahora.toLocaleDateString('es-PE');
    var hora = ahora.toLocaleTimeString('es-PE', {hour: '2-digit', minute: '2-digit'});
    
    var elemFecha = document.querySelector('.signature-date');
    var elemHora = document.querySelector('.signature-time');
    
    if (elemFecha) elemFecha.textContent = 'Fecha: ' + fecha;
    if (elemHora) elemHora.textContent = 'Hora: ' + hora;
}

// ===== FUNCIÓN: BOTONES DE ALINEACIÓN =====
function setupAlineacion() {
    console.log('🎯 Configurando botones de alineación...');
    
    var botonesAlign = document.querySelectorAll('.align-btn');
    
    botonesAlign.forEach(function(btn, index) {
        btn.onclick = function() {
            var editor = document.getElementById('medicalNoteEditor');
            if (editor) {
                editor.focus();
                
                // SEGÚN EL BOTÓN QUE SE PRESIONE
                switch(index) {
                    case 0: // PRIMER BOTÓN = IZQUIERDA
                        document.execCommand('justifyLeft');
                        console.log('← Alineado a la izquierda');
                        break;
                    case 1: // SEGUNDO BOTÓN = CENTRO
                        document.execCommand('justifyCenter');
                        console.log('↔ Centrado');
                        break;
                    case 2: // TERCER BOTÓN = DERECHA
                        document.execCommand('justifyRight');
                        console.log('→ Alineado a la derecha');
                        break;
                    case 3: // CUARTO BOTÓN = JUSTIFICADO
                        document.execCommand('justifyFull');
                        console.log('⟷ Justificado');
                        break;
                }
            }
        };
    });
    
    console.log('✅ Alineación configurada');
}

// ===== FUNCIÓN: FORMATO DE TEXTO =====
function setupTextFormatting() {
    // Obtener todos los botones de formato
    const buttons = document.querySelectorAll('.tool-btn');
    
    // Mapeo de títulos a comandos
    const formatCommands = {
        'Negrita': 'bold',
        'Cursiva': 'italic', 
        'Subrayado': 'underline',
        'Lista con viñetas': 'insertUnorderedList'
    };
    
    buttons.forEach(button => {
        const title = button.getAttribute('title');
        const command = formatCommands[title];
        
        if (command) {
            button.addEventListener('click', () => {
                // Ejecutar comando de formato
                document.execCommand(command, false, null);
                
                // Mantener focus en el editor
                const editor = document.getElementById('medicalNoteEditor');
                if (editor) {
                    editor.focus();
                }
                
                // Visual feedback del botón
                button.style.backgroundColor = '#2c5aa0';
                button.style.color = '#fff';
                
                setTimeout(() => {
                    button.style.backgroundColor = '';
                    button.style.color = '';
                }, 200);
            });
        }
        
        // Función especial para línea divisoria
        if (title === 'Insertar línea divisoria') {
            button.addEventListener('click', () => {
                const editor = document.getElementById('medicalNoteEditor');
                if (editor) {
                    const hr = document.createElement('hr');
                    hr.style.margin = '15px 0';
                    hr.style.border = 'none';
                    hr.style.borderTop = '2px solid #2c5aa0';
                    
                    editor.appendChild(hr);
                    
                    // Agregar párrafo después de la línea
                    const newP = document.createElement('p');
                    newP.innerHTML = '<br>';
                    editor.appendChild(newP);
                    
                    // Colocar cursor después de la línea
                    const selection = window.getSelection();
                    const range = document.createRange();
                    range.setStart(newP, 0);
                    range.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    newP.focus();
                }
                
                // Visual feedback
                button.style.backgroundColor = '#2c5aa0';
                button.style.color = '#fff';
                
                setTimeout(() => {
                    button.style.backgroundColor = '';
                    button.style.color = '';
                }, 200);
            });
        }
    });
    
    console.log('✅ Formato de texto y herramientas configuradas');
}

// ===== FUNCIÓN: ACCIONES DEL EDITOR =====
function setupEditorActions() {
    // Obtener botones por título
    const buttons = document.querySelectorAll('.tool-btn');
    
    buttons.forEach(button => {
        const title = button.getAttribute('title');
        
        switch(title) {
            case 'Deshacer':
                button.addEventListener('click', () => {
                    document.execCommand('undo', false, null);
                    
                    // Mantener focus en el editor
                    const editor = document.getElementById('medicalNoteEditor');
                    if (editor) {
                        editor.focus();
                    }
                    
                    // Visual feedback
                    showButtonFeedback(button);
                });
                break;
                
            case 'Rehacer':
                button.addEventListener('click', () => {
                    document.execCommand('redo', false, null);
                    
                    // Mantener focus en el editor
                    const editor = document.getElementById('medicalNoteEditor');
                    if (editor) {
                        editor.focus();
                    }
                    
                    // Visual feedback
                    showButtonFeedback(button);
                });
                break;
                
            case 'Limpiar todo':
                button.addEventListener('click', () => {
                    if (confirm('¿Está seguro de limpiar toda la nota médica?\n\nEsta acción no se puede deshacer.')) {
                        const editor = document.getElementById('medicalNoteEditor');
                        if (editor) {
                            editor.innerHTML = '';
                            editor.focus();
                        }
                        
                        // Visual feedback especial para limpiar
                        showButtonFeedback(button, '#e74c3c');
                    }
                });
                break;
        }
    });
    
    // Función para feedback visual de botones
    function showButtonFeedback(button, color = '#2c5aa0') {
        const originalBg = button.style.backgroundColor;
        const originalColor = button.style.color;
        
        button.style.backgroundColor = color;
        button.style.color = '#fff';
        
        setTimeout(() => {
            button.style.backgroundColor = originalBg;
            button.style.color = originalColor;
        }, 200);
    }
    
    console.log('✅ Acciones del editor configuradas');
}

// ===== FUNCIÓN: CARGAR Y MOVER IMÁGENES =====
function setupImageUpload() {
    console.log('📷 Configurando imágenes movibles y redimensionables...');
    
    var imageInput = document.getElementById('imageInput');
    var editor = document.getElementById('medicalNoteEditor');
    var draggedImage = null;
    
    if (imageInput) {
        imageInput.onchange = function(e) {
            var file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                console.log('📸 Cargando:', file.name);
                
                var reader = new FileReader();
                reader.onload = function(event) {
                    createMovableImage(event.target.result, editor);
                    
                    // LIMPIAR INPUT DESPUÉS DE CARGAR
                    imageInput.value = '';
                    console.log('🔄 Input limpiado para próxima carga');
                };
                reader.readAsDataURL(file);
            }
        };
    }
    
    // 🔥 CREAR IMAGEN MOVIBLE Y REDIMENSIONABLE
    function createMovableImage(src, editor) {
        var container = document.createElement('div');
        container.style.display = 'inline-block';
        container.style.position = 'relative';
        container.style.margin = '5px';
        
        var img = document.createElement('img');
        img.src = src;
        img.style.maxWidth = '200px';
        img.style.height = 'auto';
        img.style.border = '1px solid #ccc';
        img.style.cursor = 'move';
        img.draggable = true;
        img.style.display = 'block';
        
        // 🔥 CONTROLES DE REDIMENSIÓN
        var resizeHandle = document.createElement('div');
        resizeHandle.style.position = 'absolute';
        resizeHandle.style.bottom = '0';
        resizeHandle.style.right = '0';
        resizeHandle.style.width = '15px';
        resizeHandle.style.height = '15px';
        resizeHandle.style.backgroundColor = '#2c5aa0';
        resizeHandle.style.cursor = 'se-resize';
        resizeHandle.style.border = '1px solid #fff';
        resizeHandle.innerHTML = '↘';
        resizeHandle.style.textAlign = 'center';
        resizeHandle.style.color = '#fff';
        resizeHandle.style.fontSize = '10px';
        resizeHandle.style.lineHeight = '13px';
        
        // 🔥 EVENTO DE REDIMENSIÓN
        var isResizing = false;
        var startX, startY, startWidth, startHeight;
        
        resizeHandle.addEventListener('mousedown', function(e) {
            e.preventDefault();
            e.stopPropagation();
            isResizing = true;
            
            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseInt(window.getComputedStyle(img).width, 10);
            startHeight = parseInt(window.getComputedStyle(img).height, 10);
            
            console.log('🔄 Iniciando redimensión...');
            
            document.addEventListener('mousemove', doResize);
            document.addEventListener('mouseup', stopResize);
        });
        
        function doResize(e) {
            if (!isResizing) return;
            
            var newWidth = startWidth + (e.clientX - startX);
            var newHeight = startHeight + (e.clientY - startY);
            
            // Límites mínimo y máximo
            newWidth = Math.max(50, Math.min(600, newWidth));
            
            img.style.width = newWidth + 'px';
            img.style.height = 'auto'; // Mantener proporción
            
            console.log('📏 Nuevo tamaño:', newWidth + 'px');
        }
        
        function stopResize() {
            isResizing = false;
            document.removeEventListener('mousemove', doResize);
            document.removeEventListener('mouseup', stopResize);
            console.log('✅ Redimensión completada');
        }
        
        // 🔥 EVENTOS DE ARRASTRE (mismos de antes)
        img.addEventListener('dragstart', function(e) {
            draggedImage = container;
            container.style.opacity = '0.5';
            console.log('🖱️ Arrastrando imagen...');
        });
        
        img.addEventListener('dragend', function(e) {
            container.style.opacity = '1';
            draggedImage = null;
        });
        
        // Ensamblar imagen con controles
        container.appendChild(img);
        container.appendChild(resizeHandle);
        editor.appendChild(container);
        
        console.log('✅ Imagen creada - Arrastra para mover, esquina para redimensionar');
    }
    
    // 🔥 RESTO DEL CÓDIGO DE DROP (igual que antes)
    editor.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });
    
    editor.addEventListener('drop', function(e) {
        e.preventDefault();
        
        if (draggedImage) {
            var range = document.caretRangeFromPoint(e.clientX, e.clientY);
            
            if (range) {
                draggedImage.remove();
                range.insertNode(draggedImage);
                console.log('📍 Imagen movida a nueva posición');
            }
        }
    });

    // BORRAR CON TECLA DELETE
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Delete') {
                var containers = editor.querySelectorAll('div[style*="relative"]');
                containers.forEach(function(container) {
                    if (container.style.outline.includes('blue')) {
                        if (confirm('¿Borrar imagen seleccionada?')) {
                            container.remove();
                            console.log('⌨️ Imagen borrada con Delete');
                        }
                    }
                });
            }
        });

        // SELECCIONAR CON CLICK
        editor.addEventListener('click', function(e) {
            if (e.target.tagName === 'IMG') {
                // Quitar selección anterior
                var containers = editor.querySelectorAll('div[style*="relative"]');
                containers.forEach(function(c) { c.style.outline = ''; });
                
                // Seleccionar actual
                e.target.parentNode.style.outline = '2px solid blue';
                console.log('🖱️ Imagen seleccionada');
            }
        });
    
    console.log('✅ Sistema completo: mover + redimensionar');
}

// ===== NUEVA FUNCIÓN: TABLA IMAGEN + TEXTO =====
function setupImageTable() {
    const tableBtn = document.getElementById('imageTableBtn');
    if (!tableBtn) return;
    
    tableBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file?.type.startsWith('image/')) return;
            
            const position = prompt('¿Dónde quiere la imagen?\n\n1 = Izquierda\n2 = Derecha');
            if (position !== '1' && position !== '2') return;
            
            const reader = new FileReader();
            reader.onload = (event) => createImageTextTable(event.target.result, position);
            reader.readAsDataURL(file);
        });
        
        input.click();
    });
    
    function createImageTextTable(imageSrc, position) {
        // Contenedor
        const container = document.createElement('div');
        Object.assign(container.style, {
            margin: '20px 0',
            border: '2px solid #2c5aa0',
            borderRadius: '5px',
            overflow: 'hidden',
            position: 'relative'
        });
        
        // Tabla
        const table = document.createElement('table');
        Object.assign(table.style, {
            width: '100%',
            borderCollapse: 'collapse',
            minHeight: '200px'
        });
        
        const row = document.createElement('tr');
        
        // Celda imagen
        const imageCell = document.createElement('td');
        Object.assign(imageCell.style, {
            width: '200px',
            padding: '10px',
            verticalAlign: 'top',
            backgroundColor: '#f8f9fa'
        });
        
        const img = document.createElement('img');
        Object.assign(img.style, {
            width: '100%',
            height: 'auto',
            maxHeight: '180px',
            cursor: 'nw-resize',
            transition: 'all 0.2s ease'
        });
        img.src = imageSrc;
        
        // Hacer imagen redimensionable con doble clic
        img.addEventListener('dblclick', () => {
            const newSize = prompt('Tamaño de imagen (px):\n\nActual: 180px\nEjemplo: 250, 300, 150', '180');
            if (newSize && !isNaN(newSize)) {
                img.style.maxHeight = newSize + 'px';
                imageCell.style.width = Math.min(parseInt(newSize) + 20, 400) + 'px';
            }
        });
        
        imageCell.appendChild(img);
        
        // Celda texto
        const textCell = document.createElement('td');
        Object.assign(textCell.style, {
            padding: '15px',
            verticalAlign: 'top',
            backgroundColor: '#ffffff',
            minHeight: '180px',
            outline: 'none'
        });
        textCell.contentEditable = true;
        textCell.innerHTML = '<p style="margin:0; color:#333; font-size:14px;">Escriba aquí el texto...</p>';
        
        textCell.addEventListener('focus', () => {
            if (textCell.innerHTML.includes('Escriba aquí el texto...')) {
                textCell.innerHTML = '<p style="margin:0; color:#333; font-size:14px;"><br></p>';
            }
        });
        
        // Mejorar edición de texto
        textCell.addEventListener('keydown', (e) => {
            // Permitir salir de la tabla con Tab
            if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                const editor = document.getElementById('medicalNoteEditor');
                const newP = document.createElement('p');
                newP.innerHTML = '<br>';
                editor.appendChild(newP);
                
                // Colocar cursor después de la tabla
                const selection = window.getSelection();
                const range = document.createRange();
                range.setStart(newP, 0);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
                newP.focus();
            }
        });
        
        // Botón eliminar
        const deleteBtn = document.createElement('div');
        Object.assign(deleteBtn.style, {
            position: 'absolute',
            top: '5px',
            right: '5px',
            width: '25px',
            height: '25px',
            backgroundColor: '#e74c3c',
            color: '#fff',
            cursor: 'pointer',
            textAlign: 'center',
            lineHeight: '23px',
            fontSize: '14px',
            borderRadius: '50%'
        });
        deleteBtn.innerHTML = '×';
        
        deleteBtn.addEventListener('click', () => {
            if (confirm('¿Borrar tabla?')) {
                container.remove();
            }
        });
        
        // Agregar celdas según posición
        if (position === '1') {
            row.append(imageCell, textCell);
        } else {
            row.append(textCell, imageCell);
        }
        
        // Ensamblar
        table.appendChild(row);
        container.append(table, deleteBtn);
        
        // Insertar en el editor médico
        const editor = document.getElementById('medicalNoteEditor');
        if (editor) {
            editor.appendChild(container);
            
            // Agregar espacio después de la tabla para poder escribir
            const spacer = document.createElement('p');
            spacer.innerHTML = '<br>';
            spacer.style.minHeight = '20px';
            editor.appendChild(spacer);
        }
        
        setTimeout(() => textCell.focus(), 100);
    }
}

// ===== FUNCIÓN: PINTAR IMÁGEN =====
function setupImagePaint() {
    const paintBtn = document.getElementById('imagePaintBtn');
    if (!paintBtn) return;
    
    let paintMode = false;
    let selectedColor = '#e74c3c';
    let brushSize = 3;
    let currentTool = 'brush'; // brush, circle, square, eraser
    let canvasHistory = []; // Para deshacer
    
    // Toggle modo pintura
    paintBtn.addEventListener('click', () => {
        paintMode = !paintMode;
        
        if (paintMode) {
            activatePaintMode();
        } else {
            deactivatePaintMode();
        }
    });
    
    function activatePaintMode() {
        // Cambiar apariencia del botón
        paintBtn.style.backgroundColor = '#e74c3c';
        paintBtn.style.color = '#fff';
        paintBtn.title = 'Modo pintura ACTIVO - Clic en imagen para pintar';
        
        // Crear paleta flotante
        createFloatingPalette();
        
        // Cambiar cursor de las imágenes
        updateImagesCursor();
        
        // Agregar eventos a imágenes existentes
        addPaintEventsToImages();
        
        console.log('🎨 Modo pintura ACTIVADO');
    }
    
    function deactivatePaintMode() {
        // Restaurar botón
        paintBtn.style.backgroundColor = '';
        paintBtn.style.color = '';
        paintBtn.title = 'Activar modo pintura';
        
        // Remover paleta
        const palette = document.getElementById('floatingPalette');
        if (palette) palette.remove();
        
        // Restaurar cursores de imágenes
        const images = document.querySelectorAll('#medicalNoteEditor img');
        images.forEach(img => {
            img.style.cursor = '';
        });
        
        // DESACTIVAR CANVAS ACTIVOS (SIN BORRAR CONTENIDO)
        const canvases = document.querySelectorAll('#medicalNoteEditor canvas');
        canvases.forEach(canvas => {
            // Cambiar cursor a normal
            canvas.style.cursor = 'default';
            canvas.style.border = '1px solid #ddd';
            
            // Remover event listeners específicos SIN clonar
            canvas.removeEventListener('mousedown', canvas._startDrawing);
            canvas.removeEventListener('mousemove', canvas._draw);
            canvas.removeEventListener('mouseup', canvas._stopDrawing);
            canvas.removeEventListener('mouseout', canvas._stopDrawing);
            canvas.removeEventListener('touchstart', canvas._handleTouch);
            canvas.removeEventListener('touchmove', canvas._handleTouch);
            canvas.removeEventListener('touchend', canvas._stopDrawing);
        });
        
        // Limpiar referencias globales
        window.currentCanvas = null;
        window.currentCanvasCtx = null;
        
        console.log('🎨 Modo pintura DESACTIVADO - Canvas preservados');
    }
    
    function createFloatingPalette() {
        // Remover paleta existente
        const existingPalette = document.getElementById('floatingPalette');
        if (existingPalette) existingPalette.remove();
        
        const palette = document.createElement('div');
        palette.id = 'floatingPalette';
        Object.assign(palette.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#fff',
            border: '2px solid #2c5aa0',
            borderRadius: '10px',
            padding: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: '1000',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            minWidth: '140px'
        });
        
        // Título
        const title = document.createElement('div');
        title.textContent = '🎨 Paleta';
        Object.assign(title.style, {
            fontSize: '12px',
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#2c5aa0',
            marginBottom: '5px'
        });
        palette.appendChild(title);
        
        // Colores médicos
        const colors = [
            { color: '#e74c3c', name: 'Rojo', emoji: '🔴' },
            { color: '#3498db', name: 'Azul', emoji: '🔵' },
            { color: '#27ae60', name: 'Verde', emoji: '🟢' },
            { color: '#f39c12', name: 'Amarillo', emoji: '🟡' },
            { color: '#9b59b6', name: 'Morado', emoji: '🟣' },
            { color: '#2c3e50', name: 'Negro', emoji: '⚫' }
        ];
        
        const colorContainer = document.createElement('div');
        colorContainer.style.display = 'grid';
        colorContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
        colorContainer.style.gap = '5px';
        
        colors.forEach(colorObj => {
            const colorBtn = document.createElement('button');
            Object.assign(colorBtn.style, {
                width: '30px',
                height: '30px',
                backgroundColor: colorObj.color,
                border: '2px solid #ddd',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '12px'
            });
            
            colorBtn.title = colorObj.name;
            colorBtn.textContent = colorObj.emoji;
            
            colorBtn.addEventListener('click', () => {
                selectedColor = colorObj.color;
                // Resaltar seleccionado
                colorContainer.querySelectorAll('button').forEach(btn => {
                    btn.style.boxShadow = '';
                });
                colorBtn.style.boxShadow = '0 0 0 2px #2c5aa0';
            });
            
            colorContainer.appendChild(colorBtn);
        });
        
        palette.appendChild(colorContainer);
        
        // Selector de grosor
        const sizeContainer = document.createElement('div');
        sizeContainer.style.textAlign = 'center';
        
        const sizeLabel = document.createElement('div');
        sizeLabel.textContent = 'Grosor';
        sizeLabel.style.fontSize = '10px';
        sizeLabel.style.color = '#666';
        
        const sizeSlider = document.createElement('input');
        sizeSlider.type = 'range';
        sizeSlider.min = '2';
        sizeSlider.max = '15';
        sizeSlider.value = '3';
        Object.assign(sizeSlider.style, {
            width: '100%',
            marginTop: '3px'
        });
        
        sizeSlider.addEventListener('input', (e) => {
            brushSize = parseInt(e.target.value);
        });
        
        sizeContainer.appendChild(sizeLabel);
        sizeContainer.appendChild(sizeSlider);
        palette.appendChild(sizeContainer);
        
        // Herramientas y formas
        const toolsContainer = document.createElement('div');
        toolsContainer.style.display = 'grid';
        toolsContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
        toolsContainer.style.gap = '5px';
        toolsContainer.style.marginTop = '5px';
        
        // Botón pincel libre
        const brushTool = document.createElement('button');
        brushTool.innerHTML = '🖌️';
        brushTool.title = 'Pincel libre';
        Object.assign(brushTool.style, {
            width: '30px',
            height: '30px',
            backgroundColor: '#2c5aa0',
            color: '#fff',
            border: '1px solid #ddd',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '12px'
        });
        
        // Botón círculo
        const circleTool = document.createElement('button');
        circleTool.innerHTML = '⭕';
        circleTool.title = 'Círculo';
        Object.assign(circleTool.style, {
            width: '30px',
            height: '30px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #ddd',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '12px'
        });
        
        // Botón cuadrado
        const squareTool = document.createElement('button');
        squareTool.innerHTML = '🟩';
        squareTool.title = 'Cuadrado';
        Object.assign(squareTool.style, {
            width: '30px',
            height: '30px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #ddd',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '12px'
        });
        
        // Botón goma
        const eraser = document.createElement('button');
        eraser.innerHTML = '🧽';
        eraser.title = 'Goma';
        Object.assign(eraser.style, {
            width: '30px',
            height: '30px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #ddd',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '12px'
        });
        
        toolsContainer.appendChild(brushTool);
        toolsContainer.appendChild(circleTool);
        toolsContainer.appendChild(squareTool);
        toolsContainer.appendChild(eraser);
        
        palette.appendChild(toolsContainer);
        
        // Botón deshacer
        const undoBtn = document.createElement('button');
        undoBtn.innerHTML = '↶ Deshacer';
        Object.assign(undoBtn.style, {
            padding: '5px',
            backgroundColor: '#3498db',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '10px',
            marginTop: '5px'
        });
        
        palette.appendChild(undoBtn);
        
        // Eventos de herramientas
        brushTool.addEventListener('click', () => {
            currentTool = 'brush';
            updateToolSelection(toolsContainer, brushTool);
        });
        
        circleTool.addEventListener('click', () => {
            currentTool = 'circle';
            updateToolSelection(toolsContainer, circleTool);
        });
        
        squareTool.addEventListener('click', () => {
            currentTool = 'square';
            updateToolSelection(toolsContainer, squareTool);
        });
        
        eraser.addEventListener('click', () => {
            currentTool = 'eraser';
            updateToolSelection(toolsContainer, eraser);
        });
        
        // Evento deshacer
        undoBtn.addEventListener('click', () => {
            if (canvasHistory.length > 0) {
                const lastState = canvasHistory.pop();
                if (window.currentCanvas && window.currentCanvasCtx) {
                    window.currentCanvasCtx.putImageData(lastState, 0, 0);
                }
            }
        });
        
        function updateToolSelection(container, selectedBtn) {
            container.querySelectorAll('button').forEach(btn => {
                btn.style.backgroundColor = '#f8f9fa';
                btn.style.color = '#000';
            });
            selectedBtn.style.backgroundColor = '#2c5aa0';
            selectedBtn.style.color = '#fff';
        }
        
        document.body.appendChild(palette);
        
        // Seleccionar primer color y herramienta por defecto
        colorContainer.children[0].click();
        brushTool.click();
    }
    
    function updateImagesCursor() {
        const images = document.querySelectorAll('#medicalNoteEditor img');
        const canvases = document.querySelectorAll('#medicalNoteEditor canvas');
        
        images.forEach(img => {
            if (paintMode) {
                img.style.cursor = 'crosshair';
            } else {
                img.style.cursor = '';
            }
        });
        
        // También actualizar cursores de canvas existentes
        canvases.forEach(canvas => {
            if (paintMode) {
                canvas.style.cursor = 'crosshair';
                canvas.style.border = '2px solid #e74c3c';
            } else {
                canvas.style.cursor = 'default';
                canvas.style.border = '1px solid #ddd';
            }
        });
    }
    
    function addPaintEventsToImages() {
        const images = document.querySelectorAll('#medicalNoteEditor img');
        
        images.forEach(img => {
            // Remover eventos previos
            img.removeEventListener('click', handleImageClick);
            
            if (paintMode) {
                img.addEventListener('click', handleImageClick);
            }
        });
    }
    
    function handleImageClick(e) {
        if (!paintMode) return;
        
        const img = e.target;
        convertImageToCanvas(img);
    }
    
    function convertImageToCanvas(img) {
        // Crear canvas del mismo tamaño que la imagen
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Configurar canvas
        canvas.width = img.offsetWidth;
        canvas.height = img.offsetHeight;
        
        Object.assign(canvas.style, {
            maxWidth: '100%',
            height: 'auto',
            cursor: 'crosshair',
            border: '2px solid #e74c3c'
        });
        
        // Dibujar imagen en canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Configurar pincel
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Guardar referencia global para deshacer
        window.currentCanvas = canvas;
        window.currentCanvasCtx = ctx;
        
        // Guardar estado inicial
        saveCanvasState(ctx);
        
        // Variables de dibujo
        let isDrawing = false;
        let startX, startY;
        
        // Eventos de dibujo
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);
        
        // Touch para tablets
        canvas.addEventListener('touchstart', handleTouch);
        canvas.addEventListener('touchmove', handleTouch);
        canvas.addEventListener('touchend', stopDrawing);
        
        // Guardar referencias de funciones para poder removerlas después
        canvas._startDrawing = startDrawing;
        canvas._draw = draw;
        canvas._stopDrawing = stopDrawing;
        canvas._handleTouch = handleTouch;
        
        function startDrawing(e) {
            isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;
            
            if (currentTool === 'brush' || currentTool === 'eraser') {
                draw(e);
            }
        }
        
        function draw(e) {
            if (!isDrawing) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (currentTool === 'brush') {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = selectedColor;
                ctx.lineWidth = brushSize;
                ctx.lineTo(x, y);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x, y);
            } else if (currentTool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.lineWidth = brushSize * 2;
                ctx.lineTo(x, y);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x, y);
            }
        }
        
        function stopDrawing(e) {
            if (!isDrawing) return;
            isDrawing = false;
            
            if (currentTool === 'circle' || currentTool === 'square') {
                const rect = canvas.getBoundingClientRect();
                const endX = e.clientX - rect.left;
                const endY = e.clientY - rect.top;
                
                drawShape(startX, startY, endX, endY);
            }
            
            ctx.beginPath();
            saveCanvasState(ctx);
        }
        
        function drawShape(x1, y1, x2, y2) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = selectedColor;
            ctx.fillStyle = selectedColor;
            ctx.lineWidth = brushSize;
            
            const width = x2 - x1;
            const height = y2 - y1;
            
            if (currentTool === 'circle') {
                const centerX = x1 + width / 2;
                const centerY = y1 + height / 2;
                const radius = Math.sqrt(width * width + height * height) / 2;
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                ctx.stroke();
            } else if (currentTool === 'square') {
                ctx.beginPath();
                ctx.rect(x1, y1, width, height);
                ctx.stroke();
            }
        }
        
        function saveCanvasState(ctx) {
            if (canvasHistory.length >= 10) {
                canvasHistory.shift(); // Mantener máximo 10 estados
            }
            canvasHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        }
        
        function handleTouch(e) {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                             e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            canvas.dispatchEvent(mouseEvent);
        }
        
        // Reemplazar imagen con canvas
        img.parentNode.replaceChild(canvas, img);
        
        // Agregar párrafo después del canvas para poder hacer Enter
        const nextElement = canvas.nextSibling;
        if (!nextElement || nextElement.nodeType !== Node.TEXT_NODE) {
            const spacer = document.createElement('p');
            spacer.innerHTML = '<br>';
            spacer.style.minHeight = '20px';
            canvas.parentNode.insertBefore(spacer, canvas.nextSibling);
        }
        
        console.log('🖼️ Imagen convertida a canvas para pintar');
    }
    
    // Observer para nuevas imágenes
    const observer = new MutationObserver(() => {
        if (paintMode) {
            updateImagesCursor();
            addPaintEventsToImages();
        }
    });
    
    const editor = document.getElementById('medicalNoteEditor');
    if (editor) {
        observer.observe(editor, { childList: true, subtree: true });
    }
    
    console.log('✅ Sistema de pintura sobre imágenes configurado');
}

// ===== FUNCIÓN: DICTADO POR VOZ =====
function setupVoiceDictation() {
    // Verificar soporte del navegador
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('⚠️ Dictado por voz no soportado en este navegador');
        const micBtn = document.getElementById('microphoneBtn');
        if (micBtn) {
            micBtn.disabled = true;
            micBtn.title = 'Dictado no disponible en este navegador';
        }
        return;
    }

    // Crear instancia de reconocimiento
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Configuración del reconocimiento
    recognition.continuous = true;        // Escucha continua
    recognition.interimResults = true;    // Resultados parciales
    recognition.lang = 'es-ES';          // Español
    recognition.maxAlternatives = 1;      // Una alternativa
    
    // Variables de estado
    let isListening = false;
    let finalTranscript = '';
    let interimTranscript = '';
    
    // Obtener elementos
    const micBtn = document.getElementById('microphoneBtn');
    const micIcon = document.getElementById('micIcon');
    const editor = document.getElementById('medicalNoteEditor');
    
    if (!micBtn || !micIcon || !editor) {
        console.error('❌ Elementos del micrófono no encontrados');
        return;
    }

    // Función para insertar texto en el editor
    function insertTextAtCursor(text) {
        const selection = window.getSelection();
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(text));
            range.collapse(false);
        } else {
            // Si no hay selección, agregar al final
            const textNode = document.createTextNode(text);
            editor.appendChild(textNode);
        }
        
        editor.focus();
    }

    // Función para actualizar UI del botón
    function updateMicButton(listening) {
        if (listening) {
            micBtn.style.backgroundColor = '#e74c3c';
            micBtn.style.color = '#fff';
            micIcon.className = 'fas fa-microphone-slash';
            micBtn.title = 'Detener dictado (clic para parar)';
        } else {
            micBtn.style.backgroundColor = '';
            micBtn.style.color = '';
            micIcon.className = 'fas fa-microphone';
            micBtn.title = 'Dictado por voz';
        }
    }

    // Evento clic del botón
    micBtn.addEventListener('click', () => {
        if (isListening) {
            // Detener dictado
            recognition.stop();
        } else {
            // Iniciar dictado
            finalTranscript = '';
            interimTranscript = '';
            editor.focus();
            recognition.start();
        }
    });

    // Eventos del reconocimiento
    recognition.onstart = () => {
        isListening = true;
        updateMicButton(true);
        console.log('🎤 Dictado iniciado');
    };

    recognition.onend = () => {
        isListening = false;
        updateMicButton(false);
        console.log('🎤 Dictado detenido');
    };

    recognition.onerror = (event) => {
        console.error('❌ Error en dictado:', event.error);
        isListening = false;
        updateMicButton(false);
        
        // Mostrar error al usuario
        if (event.error === 'not-allowed') {
            alert('⚠️ Permiso de micrófono denegado.\n\nPor favor, permite el acceso al micrófono y recarga la página.');
        } else if (event.error === 'no-speech') {
            console.log('ℹ️ No se detectó voz, reintentando...');
        }
    };

    recognition.onresult = (event) => {
        interimTranscript = '';
        finalTranscript = '';

        // Procesar resultados
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }

        // Insertar texto final
        if (finalTranscript) {
            insertTextAtCursor(finalTranscript);
            finalTranscript = '';
        }

        console.log('🗣️ Texto reconocido:', finalTranscript || interimTranscript);
    };

    // Atajos de teclado
    document.addEventListener('keydown', (e) => {
        // Ctrl + Shift + M para activar/desactivar micrófono
        if (e.ctrlKey && e.shiftKey && e.key === 'M') {
            e.preventDefault();
            micBtn.click();
        }
    });

    console.log('✅ Dictado por voz configurado');
    console.log('ℹ️ Atajo: Ctrl + Shift + M');
}

// ===== FUNCIÓN: FIRMA DIGITAL =====
function setupDigitalSignature() {
    const canvas = document.getElementById('signatureCanvas');
    const clearBtn = document.querySelector('.btn-clear-signature');
    const statusElement = document.getElementById('signatureStatus');
    
    if (!canvas || !clearBtn || !statusElement) {
        console.error('❌ Elementos de firma no encontrados');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let signatureData = [];
    
    // Configuración inicial del canvas
    setupCanvas();
    
    function setupCanvas() {
        // Configurar canvas para firma
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#2c3e50';
        
        // Fondo blanco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Estilo del canvas
        Object.assign(canvas.style, {
            border: '2px dashed #bdc3c7',
            borderRadius: '5px',
            cursor: 'crosshair',
            backgroundColor: '#ffffff',
            touchAction: 'none' // Prevenir scroll en móviles
        });
        
        // Agregar texto guía
        drawPlaceholder();
    }
    
    function drawPlaceholder() {
        ctx.save();
        ctx.fillStyle = '#95a5a6';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('✍️ Firme aquí con el mouse o dedo', canvas.width / 2, canvas.height / 2);
        ctx.restore();
    }
    
    // Eventos del mouse
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Eventos touch para tablets/móviles
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('touchend', stopDrawing);
    
    function startDrawing(e) {
        isDrawing = true;
        [lastX, lastY] = getCoordinates(e);
        
        // Limpiar placeholder al empezar a firmar
        if (signatureData.length === 0) {
            clearCanvas(false);
        }
        
        // Guardar punto inicial
        signatureData.push({ x: lastX, y: lastY, drawing: true });
    }
    
    function draw(e) {
        if (!isDrawing) return;
        
        const [currentX, currentY] = getCoordinates(e);
        
        // Dibujar línea
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
        
        // Guardar punto
        signatureData.push({ x: currentX, y: currentY, drawing: true });
        
        [lastX, lastY] = [currentX, currentY];
    }
    
    function stopDrawing() {
        if (!isDrawing) return;
        isDrawing = false;
        
        // Marcar fin de trazo
        signatureData.push({ drawing: false });
        
        // Actualizar estado si hay firma
        if (signatureData.length > 1) {
            updateSignatureStatus('signed');
        }
    }
    
    function getCoordinates(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        if (e.touches && e.touches[0]) {
            // Touch event
            return [
                (e.touches[0].clientX - rect.left) * scaleX,
                (e.touches[0].clientY - rect.top) * scaleY
            ];
        } else {
            // Mouse event
            return [
                (e.clientX - rect.left) * scaleX,
                (e.clientY - rect.top) * scaleY
            ];
        }
    }
    
    function handleTouch(e) {
        e.preventDefault(); // Prevenir scroll
        
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                         e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }
    
    function clearCanvas(showPlaceholder = true) {
        // Limpiar canvas
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Restablecer datos
        signatureData = [];
        
        // Mostrar placeholder si se requiere
        if (showPlaceholder) {
            drawPlaceholder();
        }
        
        // Actualizar estado
        updateSignatureStatus('pending');
    }
    
    function updateSignatureStatus(status) {
        const now = new Date();
        const dateStr = now.toLocaleDateString('es-ES');
        const timeStr = now.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Actualizar fecha y hora en tiempo real
        const dateElement = document.querySelector('.signature-datetime p:first-child');
        const timeElement = document.querySelector('.signature-datetime p:last-child');
        
        if (dateElement) dateElement.innerHTML = `<strong>FECHA:</strong> ${dateStr}`;
        if (timeElement) timeElement.innerHTML = `<strong>HORA:</strong> ${timeStr}`;
        
        if (status === 'signed') {
            statusElement.innerHTML = `
                <span class="status-signed" style="color: #27ae60; font-weight: bold;">
                    ✅ Firmado el ${dateStr} a las ${timeStr}
                </span>
            `;
            
            // Cambiar borde del canvas
            canvas.style.border = '2px solid #27ae60';
            
            console.log('✍️ Documento firmado digitalmente');
        } else {
            statusElement.innerHTML = `
                <span class="status-pending" style="color: #e67e22; font-weight: bold;">
                    📝 Pendiente de firma
                </span>
            `;
            
            // Restablecer borde
            canvas.style.border = '2px dashed #bdc3c7';
        }
    }
    
    // Evento del botón limpiar
    clearBtn.addEventListener('click', () => {
        if (signatureData.length > 0) {
            if (confirm('¿Está seguro de limpiar la firma?\n\nEsta acción no se puede deshacer.')) {
                clearCanvas(true);
                console.log('🧹 Firma limpiada');
            }
        }
    });
    
    // Funciones públicas para integración
    window.signatureAPI = {
        // Obtener datos de la firma
        getSignatureData: function() {
            if (signatureData.length === 0) {
                return null;
            }
            
            return {
                imageData: canvas.toDataURL('image/png'),
                vectorData: signatureData,
                timestamp: new Date().toISOString(),
                doctor: {
                    name: document.querySelector('.doctor-info p:first-child')?.textContent?.replace('MÉDICO: ', '') || '',
                    cmp: document.querySelector('.doctor-info p:nth-child(2)')?.textContent?.replace('CMP: ', '') || '',
                    specialty: document.querySelector('.doctor-info p:last-child')?.textContent?.replace('ESPECIALIDAD: ', '') || ''
                }
            };
        },
        
        // Verificar si está firmado
        isSigned: function() {
            return signatureData.length > 1;
        },
        
        // Limpiar firma programáticamente
        clearSignature: function() {
            clearCanvas(true);
        },
        
        // Cargar firma existente (para edición)
        loadSignature: function(vectorData) {
            if (!vectorData || !Array.isArray(vectorData)) return;
            
            clearCanvas(false);
            signatureData = [...vectorData];
            
            // Redibujar firma
            let isCurrentlyDrawing = false;
            let lastPoint = null;
            
            signatureData.forEach(point => {
                if (point.drawing) {
                    if (!isCurrentlyDrawing) {
                        isCurrentlyDrawing = true;
                        lastPoint = point;
                    } else if (lastPoint) {
                        ctx.beginPath();
                        ctx.moveTo(lastPoint.x, lastPoint.y);
                        ctx.lineTo(point.x, point.y);
                        ctx.stroke();
                        lastPoint = point;
                    }
                } else {
                    isCurrentlyDrawing = false;
                    lastPoint = null;
                }
            });
            
            updateSignatureStatus('signed');
        }
    };
    
    // Validación antes de envío/guardado
    function validateSignature() {
        if (!window.signatureAPI.isSigned()) {
            alert('⚠️ La nota médica debe estar firmada antes de guardar.');
            return false;
        }
        return true;
    }
    
    // Hacer validación disponible globalmente
    window.validateMedicalNote = validateSignature;
    
    console.log('✅ Sistema de firma digital configurado');
    console.log('📋 API disponible en window.signatureAPI');
}

// ===== FUNCIÓN: CONFIGURAR PREVISUALIZACIÓN =====
function setupMedicalNotePreview() {
    const previewBtn = document.querySelector('.btn-preview-note');
    
    if (!previewBtn) {
        console.error('❌ Botón de previsualización no encontrado');
        return;
    }
    
    previewBtn.addEventListener('click', generatePreview);
    
    function generatePreview() {
        // Verificar que hay contenido
        const editor = document.getElementById('medicalNoteEditor');
        if (!editor || editor.innerHTML.trim() === '') {
            alert('⚠️ No hay contenido para previsualizar.\n\nEscriba algo en la nota médica primero.');
            return;
        }
        
        // Recopilar todos los datos
        const previewData = collectMedicalNoteData();
        
        // Generar HTML de previsualización
        const previewHTML = generatePreviewHTML(previewData);
        
        // Abrir ventana de previsualización
        openPreviewWindow(previewHTML);
        
        console.log('👁️ Vista previa generada');
    }
    
    function collectMedicalNoteData() {
        // Datos del header
        const hospitalName = document.querySelector('.header h3')?.textContent || 'Hospital Central';
        const hospitalInfo = document.querySelector('.header p')?.textContent || '';
        const noteTitle = document.querySelector('.header h2')?.textContent || 'NOTA DE EVOLUCIÓN MÉDICA';
        const noteNumber = document.querySelector('.header p:last-child')?.textContent || '';
        
        // Datos del paciente
        const patientData = {
            nombre: getTableValue('PACIENTE:'),
            edad: getTableValue('EDAD:'),
            cama: getTableValue('CAMA:'),
            diagnostico: getTableValue('DIAGNÓSTICO:'),
            hc: getTableValue('HC:'),
            sexo: getTableValue('SEXO:'),
            servicio: getTableValue('SERVICIO:')
        };
        
        // Signos vitales
        const signosVitales = document.querySelector('.signos-vitales')?.textContent || '';
        
        // Contenido del editor
        let editorContent = document.getElementById('medicalNoteEditor')?.innerHTML || '';
        
        // CONVERTIR CANVAS A IMÁGENES para que se vean en previsualización
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = editorContent;
        
        const canvases = tempDiv.querySelectorAll('canvas');
        canvases.forEach(canvas => {
            const img = document.createElement('img');
            img.src = canvas.toDataURL('image/png');
            img.style.maxWidth = canvas.style.maxWidth || '100%';
            img.style.height = 'auto';
            img.style.border = '1px solid #ddd';
            canvas.parentNode.replaceChild(img, canvas);
        });
        
        editorContent = tempDiv.innerHTML;
        
        // Datos de firma
        const signatureData = window.signatureAPI ? window.signatureAPI.getSignatureData() : null;
        
        return {
            hospital: { name: hospitalName, info: hospitalInfo },
            noteTitle,
            noteNumber,
            patient: patientData,
            signosVitales,
            content: editorContent,
            signature: signatureData,
            timestamp: new Date()
        };
    }
    
    function getTableValue(label) {
        const rows = document.querySelectorAll('tr');
        for (let row of rows) {
            const cells = row.querySelectorAll('td');
            for (let i = 0; i < cells.length; i++) {
                if (cells[i].textContent.includes(label) && cells[i + 1]) {
                    return cells[i + 1].textContent.trim();
                }
            }
        }
        return '';
    }
    
    function generatePreviewHTML(data) {
        return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vista Previa - Nota Médica</title>
    <style>
        @page {
            size: A4;
            margin: 2cm 1.5cm;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: white;
            margin: 0;
            padding: 15px;
            max-width: 21cm;
            min-height: 29.7cm;
            position: relative;
            border: 2px solid #2c5aa0;
            box-sizing: border-box;
        }
        
        /* Numeración de líneas */
        .content-with-lines {
            counter-reset: line-number;
            position: relative;
            padding-left: 40px;
        }
        
        .content-with-lines p,
        .content-with-lines div,
        .content-with-lines table,
        .content-with-lines ul,
        .content-with-lines hr {
            counter-increment: line-number;
            position: relative;
        }
        
        .content-with-lines p::before,
        .content-with-lines div::before,
        .content-with-lines table::before,
        .content-with-lines ul::before,
        .content-with-lines hr::before {
            content: counter(line-number);
            position: absolute;
            left: -35px;
            width: 30px;
            text-align: right;
            color: #999;
            font-size: 10px;
            font-weight: normal;
        }
        
        /* Header */
        .preview-header {
            text-align: center;
            border-bottom: 2px solid #2c5aa0;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        
        .preview-header h1 {
            color: #2c5aa0;
            font-size: 18px;
            margin: 0 0 5px 0;
            font-weight: bold;
        }
        
        .preview-header .hospital-info {
            font-size: 10px;
            color: #666;
            margin: 5px 0;
        }
        
        .preview-header h2 {
            color: #2c5aa0;
            font-size: 16px;
            margin: 10px 0 5px 0;
        }
        
        .preview-header .note-number {
            font-size: 10px;
            color: #666;
        }
        
        /* Datos del paciente */
        .patient-data {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
            padding: 10px;
            background-color: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        
        .patient-data div {
            font-size: 11px;
        }
        
        .patient-data strong {
            color: #2c5aa0;
        }
        
        /* Signos vitales */
        .vital-signs {
            background-color: #e8f4fd;
            border: 1px solid #2c5aa0;
            border-radius: 5px;
            padding: 10px;
            margin-bottom: 15px;
            font-size: 11px;
        }
        
        .vital-signs h3 {
            color: #2c5aa0;
            font-size: 12px;
            margin: 0 0 8px 0;
        }
        
        /* Contenido principal */
        .main-content {
            min-height: 200px;
            margin-bottom: 20px;
        }
        
        .main-content img,
        .main-content canvas {
            max-width: 100% !important;
            height: auto !important;
            margin: 5px 0 !important;
            border: 1px solid #ddd !important;
            display: block !important;
        }
        
        .main-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            border: 1px solid #ddd;
        }
        
        .main-content table td {
            border: 1px solid #ddd;
            padding: 8px;
            vertical-align: top;
        }
        
        .main-content table img,
        .main-content table canvas {
            max-width: 180px !important;
            height: auto !important;
            margin: 0 !important;
        }
        
        .main-content ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        
        .main-content hr {
            border: none;
            border-top: 2px solid #2c5aa0;
            margin: 15px 0;
        }
        
        /* Firma */
        .signature-section {
            position: absolute;
            bottom: 20px;
            right: 15px;
            left: 15px;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
        
        .signature-container {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 20px;
            align-items: end;
        }
        
        .signature-info {
            font-size: 10px;
            color: #666;
        }
        
        .signature-image {
            text-align: center;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 10px;
            background-color: #fafafa;
        }
        
        .signature-image img {
            max-width: 200px;
            height: auto;
        }
        
        .signature-line {
            width: 200px;
            border-bottom: 1px solid #333;
            margin: 10px auto 5px auto;
        }
        
        /* Páginas */
        .page-break {
            page-break-before: always;
        }
        
        /* Botones de acción */
        .preview-actions {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: white;
            padding: 10px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .preview-actions button {
            margin: 0 5px;
            padding: 8px 15px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .btn-print {
            background-color: #27ae60;
            color: white;
        }
        
        .btn-close {
            background-color: #e74c3c;
            color: white;
        }
        
        @media print {
            .preview-actions {
                display: none;
            }
            
            body {
                padding: 10px;
                margin: 0;
                border: 2px solid #2c5aa0;
                box-sizing: border-box;
            }
            
            .main-content img,
            .main-content canvas {
                max-width: 100% !important;
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="preview-actions">
        <button class="btn-print" onclick="window.print()">
            🖨️ Imprimir
        </button>
        <button class="btn-close" onclick="window.close()">
            ❌ Cerrar
        </button>
    </div>

    <!-- Header -->
    <div class="preview-header">
        <h1>${data.hospital.name}</h1>
        <div class="hospital-info">${data.hospital.info}</div>
        <h2>${data.noteTitle}</h2>
        <div class="note-number">${data.noteNumber}</div>
    </div>

    <!-- Datos del paciente -->
    <div class="patient-data">
        <div><strong>PACIENTE:</strong> ${data.patient.nombre}</div>
        <div><strong>HC:</strong> ${data.patient.hc}</div>
        <div><strong>EDAD:</strong> ${data.patient.edad}</div>
        <div><strong>SEXO:</strong> ${data.patient.sexo}</div>
        <div><strong>CAMA:</strong> ${data.patient.cama}</div>
        <div><strong>SERVICIO:</strong> ${data.patient.servicio}</div>
        <div style="grid-column: 1 / -1;"><strong>DIAGNÓSTICO:</strong> ${data.patient.diagnostico}</div>
    </div>

    <!-- Signos vitales -->
    <div class="vital-signs">
        <h3>📊 SIGNOS VITALES ACTUALES</h3>
        <div>${data.signosVitales}</div>
    </div>

    <!-- Contenido principal con numeración -->
    <div class="main-content content-with-lines">
        ${data.content}
    </div>

    <!-- Firma -->
    <div class="signature-section">
        <div class="signature-container">
            <div class="signature-info">
                <p><strong>Fecha:</strong> ${data.timestamp.toLocaleDateString('es-ES')}</p>
                <p><strong>Hora:</strong> ${data.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                <p><strong>Médico:</strong> ${data.signature?.doctor?.name || 'Dr. Alan Cairampoma Carrillo'}</p>
                <p><strong>CMP:</strong> ${data.signature?.doctor?.cmp || '12345'}</p>
                <p><strong>Especialidad:</strong> ${data.signature?.doctor?.specialty || 'Medicina Interna'}</p>
            </div>
            
            <div class="signature-image">
                ${data.signature ? 
                    `<img src="${data.signature.imageData}" alt="Firma Digital">
                     <div class="signature-line"></div>
                     <div style="font-size: 10px; color: #666;">Firma Digital</div>` :
                    `<div style="height: 60px; display: flex; align-items: center; justify-content: center; color: #999;">
                        📝 Sin firma
                     </div>`
                }
            </div>
        </div>
    </div>

    <script>
        // Auto-focus para imprimir
        window.onload = function() {
            console.log('📄 Vista previa cargada');
        };
        
        // Atajos de teclado
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                window.print();
            }
            if (e.key === 'Escape') {
                window.close();
            }
        });
    </script>
</body>
</html>`;
    }
    
    function openPreviewWindow(htmlContent) {
        const previewWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
        
        if (!previewWindow) {
            alert('⚠️ El navegador bloqueó la ventana emergente.\n\nPermita ventanas emergentes para esta página.');
            return;
        }
        
        previewWindow.document.write(htmlContent);
        previewWindow.document.close();
        
        // Focus en la nueva ventana
        previewWindow.focus();
    }
    
    console.log('✅ Sistema de previsualización configurado');
}

// Función auxiliar para obtener firma
function getSignatureDataForPreview() {
    if (window.signatureAPI && window.signatureAPI.isSigned()) {
        return window.signatureAPI.getSignatureData();
    }
    return null;
}

// ===== AUTO-EJECUTAR CUANDO CARGUE LA PÁGINA =====
document.addEventListener('DOMContentLoaded', inicializarNotasMedicas);

console.log('✅ notamedica.js cargado correctamente');