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

    // 7. GRABADORA DE VOZ
    setupVoiceRecorder();

    // 8. IMPRESIÓN PDF
    setupMedicalNotePrint();
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
        console.log('🔍 Generando vista previa...');
        
        // Verificar que hay contenido
        const editor = document.getElementById('medicalNoteEditor');
        if (!editor) {
            alert('⚠️ Editor no encontrado.');
            return;
        }
        
        // Generar HTML de previsualización sin tocar el original
        const previewHTML = createPreviewHTML();
        
        // Abrir ventana de previsualización
        openPreviewWindow(previewHTML);
        
        console.log('👁️ Vista previa generada');
    }
    
    // Función para capturar imágenes del editor
    function captureImagesFromEditor() {
        const images = [];
        
        try {
            // Capturar imágenes normales
            const imgElements = document.querySelectorAll('#medicalNoteEditor img');
            imgElements.forEach((img, index) => {
                if (img.src) {
                    images.push({
                        type: 'img',
                        index: index,
                        src: img.src,
                        id: `img_${index}`
                    });
                    console.log(`📸 Imagen ${index + 1} capturada`);
                }
            });
            
            // Capturar canvas (imágenes pintadas)
            const canvasElements = document.querySelectorAll('#medicalNoteEditor canvas');
            canvasElements.forEach((canvas, index) => {
                try {
                    if (canvas.width > 0 && canvas.height > 0) {
                        const dataURL = canvas.toDataURL('image/png');
                        images.push({
                            type: 'canvas',
                            index: index,
                            src: dataURL,
                            id: `canvas_${index}`
                        });
                        console.log(`🎨 Canvas ${index + 1} capturado`);
                    }
                } catch (error) {
                    console.warn(`⚠️ No se pudo capturar canvas ${index + 1}:`, error);
                }
            });
            
            console.log(`📋 Total elementos capturados: ${images.length}`);
            return images;
            
        } catch (error) {
            console.error('❌ Error capturando imágenes:', error);
            return [];
        }
    }

    // Función para capturar la firma
    function captureSignatureImage() {
        try {
            const signatureCanvas = document.getElementById('signatureCanvas');
            if (signatureCanvas && window.signatureAPI && window.signatureAPI.isSigned()) {
                const signatureData = signatureCanvas.toDataURL('image/png');
                console.log('✍️ Firma capturada');
                return signatureData;
            }
            console.log('📝 Sin firma para capturar');
            return null;
        } catch (error) {
            console.warn('⚠️ Error capturando firma:', error);
            return null;
        }
    }

    // Función para reemplazar imágenes en el contenido
    function replaceImagesInContent(content, capturedImages) {
        let updatedContent = content;
        
        try {
            // Crear un DOM temporal para procesar
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            
            // Reemplazar imágenes
            const imgs = tempDiv.querySelectorAll('img');
            imgs.forEach((img, index) => {
                const captured = capturedImages.find(c => c.type === 'img' && c.index === index);
                if (captured) {
                    img.src = captured.src;
                    img.style.cssText += ' max-width: 100% !important; height: auto !important;';
                }
            });
            
            // Reemplazar canvas con imágenes
            const canvases = tempDiv.querySelectorAll('canvas');
            canvases.forEach((canvas, index) => {
                const captured = capturedImages.find(c => c.type === 'canvas' && c.index === index);
                if (captured) {
                    const img = document.createElement('img');
                    img.src = captured.src;
                    img.style.cssText = 'max-width: 100% !important; height: auto !important; border: 1px solid #ddd;';
                    canvas.parentNode.replaceChild(img, canvas);
                }
            });
            
            updatedContent = tempDiv.innerHTML;
            console.log('🔄 Contenido actualizado con imágenes capturadas');
            
        } catch (error) {
            console.error('❌ Error reemplazando imágenes:', error);
        }
        
        return updatedContent;
    }
    
    function createPreviewHTML() {
        // Obtener datos básicos de forma segura
        const hospitalName = 'Hospital Central';
        const noteTitle = 'NOTA DE EVOLUCIÓN MÉDICA';
        const patientName = 'Carlos García Mendoza';
        const hc = 'HC-2024-001234';
        const edad = '58 años';
        const sexo = 'Masculino';
        const cama = '101A';
        const servicio = 'Medicina Interna';
        const diagnostico = 'Diabetes Mellitus Tipo 2 + Hipertensión Arterial';
        
        // Obtener contenido del editor SIN modificarlo
        let editorContent = document.getElementById('medicalNoteEditor')?.innerHTML || '<p>Sin contenido</p>';
        
        // CAPTURAR IMÁGENES Y FIRMA de forma segura
        const capturedImages = captureImagesFromEditor();
        const signatureImage = captureSignatureImage();
        
        // Reemplazar referencias en el contenido
        editorContent = replaceImagesInContent(editorContent, capturedImages);
        
        // Crear fecha actual
        const now = new Date();
        const fecha = now.toLocaleDateString('es-ES');
        const hora = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        
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
            margin: 1.5cm;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.3;
            color: #333;
            background: white;
            margin: 0;
            padding: 15px;
            border: 2px solid #2c5aa0;
            min-height: 26cm;
            box-sizing: border-box;
        }
        
        /* Numeración de líneas estilo Word */
        .content-area {
            counter-reset: line-number;
            position: relative;
            padding-left: 35px;
            margin: 15px 0;
        }
        
        .content-area p,
        .content-area div:not(.signature-container),
        .content-area table,
        .content-area ul,
        .content-area hr {
            counter-increment: line-number;
            position: relative;
            margin: 8px 0;
        }
        
        .content-area p::before,
        .content-area div:not(.signature-container)::before,
        .content-area table::before,
        .content-area ul::before,
        .content-area hr::before {
            content: counter(line-number);
            position: absolute;
            left: -30px;
            width: 25px;
            text-align: right;
            color: #999;
            font-size: 9px;
            font-family: monospace;
        }
        
        /* Header */
        .header {
            text-align: center;
            border-bottom: 2px solid #2c5aa0;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        
        .header h1 {
            color: #2c5aa0;
            font-size: 16px;
            margin: 0 0 5px 0;
        }
        
        .header h2 {
            color: #2c5aa0;
            font-size: 14px;
            margin: 8px 0 0 0;
        }
        
        /* Datos del paciente */
        .patient-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 12px;
            padding: 8px;
            background-color: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 3px;
            font-size: 10px;
        }
        
        .patient-info div {
            padding: 2px 0;
        }
        
        .patient-info strong {
            color: #2c5aa0;
        }
        
        .patient-info .full-width {
            grid-column: 1 / -1;
        }
        
        /* Signos vitales */
        .vital-signs {
            background-color: #e8f4fd;
            border: 1px solid #2c5aa0;
            border-radius: 3px;
            padding: 8px;
            margin-bottom: 12px;
            font-size: 10px;
        }
        
        .vital-signs h3 {
            color: #2c5aa0;
            font-size: 11px;
            margin: 0 0 5px 0;
        }
        
        /* Contenido principal - estilos para elementos comunes */
        .main-content img {
            max-width: 100% !important;
            height: auto !important;
            border: 1px solid #ddd;
            margin: 5px 0;
        }
        
        .main-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
        }
        
        .main-content table td {
            border: 1px solid #ddd;
            padding: 6px;
            vertical-align: top;
            font-size: 10px;
        }
        
        .main-content table img {
            max-width: 150px !important;
            height: auto !important;
        }
        
        .main-content ul {
            margin: 8px 0;
            padding-left: 15px;
        }
        
        .main-content hr {
            border: none;
            border-top: 1px solid #2c5aa0;
            margin: 10px 0;
        }
        
        /* Firma */
        .signature-area {
            position: fixed;
            bottom: 30px;
            right: 20px;
            left: 20px;
            border-top: 1px solid #ddd;
            padding-top: 10px;
            background: white;
        }
        
        .signature-container {
            display: flex;
            justify-content: space-between;
            align-items: end;
        }
        
        .doctor-info {
            font-size: 9px;
            color: #666;
        }
        
        .signature-box {
            text-align: center;
            border: 1px solid #ddd;
            padding: 15px;
            background-color: #fafafa;
            min-width: 180px;
        }
        
        .signature-line {
            width: 150px;
            border-bottom: 1px solid #333;
            margin: 20px auto 5px auto;
        }
        
        /* Botones de acción */
        .actions {
            position: fixed;
            top: 15px;
            right: 15px;
            z-index: 1000;
            background: white;
            padding: 8px;
            border-radius: 5px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .actions button {
            margin: 0 3px;
            padding: 6px 12px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
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
            .actions {
                display: none !important;
            }
            
            body {
                border: 2px solid #2c5aa0;
                padding: 10px;
            }
            
            .signature-area {
                position: absolute;
            }
        }
    </style>
</head>
<body>
    <div class="actions">
        <button class="btn-print" onclick="window.print()">🖨️ Imprimir</button>
        <button class="btn-close" onclick="window.close()">❌ Cerrar</button>
    </div>

    <!-- Header -->
    <div class="header">
        <h1>${hospitalName}</h1>
        <div style="font-size: 9px; color: #666;">Av. Hospitales 123 - Telef. 01-2016500</div>
        <h2>${noteTitle}</h2>
        <div style="font-size: 9px; color: #666;">N° NE2024010001 - 01/01/2024</div>
    </div>

    <!-- Datos del paciente -->
    <div class="patient-info">
        <div><strong>PACIENTE:</strong> ${patientName}</div>
        <div><strong>HC:</strong> ${hc}</div>
        <div><strong>EDAD:</strong> ${edad}</div>
        <div><strong>SEXO:</strong> ${sexo}</div>
        <div><strong>CAMA:</strong> ${cama}</div>
        <div><strong>SERVICIO:</strong> ${servicio}</div>
        <div class="full-width"><strong>DIAGNÓSTICO:</strong> ${diagnostico}</div>
    </div>

    <!-- Signos vitales -->
    <div class="vital-signs">
        <h3>📊 SIGNOS VITALES ACTUALES - 14:30</h3>
        <div>PA: 140/90 mmHg &nbsp;&nbsp; FC: 78 lpm &nbsp;&nbsp; FR: 18 rpm &nbsp;&nbsp; T°: 36.8°C &nbsp;&nbsp; SpO2: 98%</div>
    </div>

    <!-- Contenido principal con numeración -->
    <div class="content-area">
        <div class="main-content">
            ${editorContent}
        </div>
    </div>

    <!-- Firma -->
    <div class="signature-area">
        <div class="signature-container">
            <div class="doctor-info">
                <p><strong>Fecha:</strong> ${fecha}</p>
                <p><strong>Hora:</strong> ${hora}</p>
                <p><strong>Médico:</strong> Dr. Alan Cairampoma Carrillo</p>
                <p><strong>CMP:</strong> 12345</p>
                <p><strong>Especialidad:</strong> Medicina Interna</p>
            </div>
            
            <div class="signature-box">
                ${signatureImage ? 
                    `<img src="${signatureImage}" style="max-width: 150px; height: auto; margin: 5px 0;">
                     <div class="signature-line"></div>
                     <div style="font-size: 9px; color: #666;">Firma Digital</div>` :
                    `<div style="height: 40px; color: #999; font-size: 9px; padding-top: 15px;">📝 Sin firma</div>
                     <div class="signature-line"></div>
                     <div style="font-size: 9px; color: #666;">Firma Digital</div>`
                }
            </div>
        </div>
    </div>

    <script>
        window.onload = function() {
            console.log('📄 Vista previa cargada correctamente');
        };
        
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
        try {
            const width = 800;
            const height = 900;
            const left = Math.max(0, (screen.width - width) / 2);
            const top = Math.max(0, (screen.height - height) / 2);
            
            const previewWindow = window.open('', '_blank', 
                `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,toolbar=no,menubar=no,status=no`);
            
            if (!previewWindow) {
                alert('⚠️ El navegador bloqueó la ventana emergente.\n\nPermita ventanas emergentes para esta página.');
                return;
            }
            
            previewWindow.document.write(htmlContent);
            previewWindow.document.close();
            previewWindow.focus();
            
            console.log('✅ Ventana de previsualización abierta');
            
        } catch (error) {
            console.error('❌ Error abriendo ventana de previsualización:', error);
            alert('Error al abrir la vista previa. Verifique que las ventanas emergentes estén permitidas.');
        }
    }
    
    console.log('✅ Sistema de previsualización SEGURA configurado');
}

// ===== FUNCIÓN: CONFIGURAR GRABADORA DE VOZ =====
function setupVoiceRecorder() {
    // Verificar soporte del navegador
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('⚠️ Grabación de audio no soportada en este navegador');
        const recorderBtn = document.getElementById('voiceRecorderBtn');
        if (recorderBtn) {
            recorderBtn.disabled = true;
            recorderBtn.title = 'Grabación no disponible en este navegador';
        }
        return;
    }

    // Variables del grabador
    let mediaRecorder = null;
    let audioChunks = [];
    let isRecording = false;
    let recordingStartTime = null;
    let timerInterval = null;
    let audioStream = null;

    // Elementos DOM
    const recorderBtn = document.getElementById('voiceRecorderBtn');
    const recordIcon = document.getElementById('recordIcon');
    
    if (!recorderBtn || !recordIcon) {
        console.error('❌ Elementos de grabadora no encontrados');
        return;
    }

    // Evento principal del botón
    recorderBtn.addEventListener('click', toggleRecording);

    async function toggleRecording() {
        if (isRecording) {
            stopRecording();
        } else {
            await startRecording();
        }
    }

    async function startRecording() {
        try {
            console.log('🎤 Solicitando permisos de micrófono...');
            
            // Solicitar acceso al micrófono
            audioStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                } 
            });

            // Crear MediaRecorder
            mediaRecorder = new MediaRecorder(audioStream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
            });

            // Configurar eventos
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = handleRecordingStop;

            // Iniciar grabación
            audioChunks = [];
            mediaRecorder.start();
            isRecording = true;
            recordingStartTime = Date.now();

            // Actualizar UI
            updateRecorderUI(true);
            
            // Iniciar timer
            startTimer();

            console.log('🔴 Grabación iniciada');

        } catch (error) {
            console.error('❌ Error al iniciar grabación:', error);
            
            if (error.name === 'NotAllowedError') {
                alert('⚠️ Permiso de micrófono denegado.\n\nPor favor, permite el acceso al micrófono y recarga la página.');
            } else {
                alert('❌ Error al acceder al micrófono: ' + error.message);
            }
        }
    }

    function stopRecording() {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            isRecording = false;

            // Detener stream
            if (audioStream) {
                audioStream.getTracks().forEach(track => track.stop());
                audioStream = null;
            }

            // Actualizar UI
            updateRecorderUI(false);
            
            // Detener timer
            stopTimer();

            console.log('⏹️ Grabación detenida');
        }
    }

    function handleRecordingStop() {
        // Crear blob de audio
        const audioBlob = new Blob(audioChunks, { 
            type: mediaRecorder.mimeType || 'audio/webm' 
        });

        // Calcular duración
        const duration = Math.round((Date.now() - recordingStartTime) / 1000);
        
        console.log(`📼 Grabación completada: ${duration} segundos`);

        // Mostrar opciones de reproducción/descarga
        showAudioPlayer(audioBlob, duration);
    }

    function updateRecorderUI(recording) {
        if (recording) {
            // Estado grabando
            recorderBtn.style.backgroundColor = '#e74c3c';
            recorderBtn.style.color = '#fff';
            recorderBtn.title = 'Detener grabación';
            recordIcon.className = 'fas fa-stop';
            recorderBtn.innerHTML = '<i class="fas fa-stop"></i> Grabando...';
        } else {
            // Estado normal
            recorderBtn.style.backgroundColor = '';
            recorderBtn.style.color = '';
            recorderBtn.title = 'Grabadora de voz';
            recordIcon.className = 'fas fa-record-vinyl';
            recorderBtn.innerHTML = '<i class="fas fa-record-vinyl"></i> Grabar';
        }
    }

    function startTimer() {
        const timerDisplay = createTimerDisplay();
        
        timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        // Remover display del timer
        const timerDisplay = document.getElementById('recordingTimer');
        if (timerDisplay) {
            timerDisplay.remove();
        }
    }

    function createTimerDisplay() {
        // Remover timer existente
        const existingTimer = document.getElementById('recordingTimer');
        if (existingTimer) existingTimer.remove();

        // Crear nuevo timer
        const timerDisplay = document.createElement('div');
        timerDisplay.id = 'recordingTimer';
        Object.assign(timerDisplay.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#e74c3c',
            color: '#fff',
            padding: '8px 15px',
            borderRadius: '20px',
            fontFamily: 'monospace',
            fontSize: '14px',
            fontWeight: 'bold',
            zIndex: '1000',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        });
        timerDisplay.textContent = '00:00';
        
        document.body.appendChild(timerDisplay);
        return timerDisplay;
    }

    function showAudioPlayer(audioBlob, duration) {
        // Crear URL del audio
        const audioURL = URL.createObjectURL(audioBlob);
        
        // Crear modal de reproducción
        const modal = document.createElement('div');
        Object.assign(modal.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '2000'
        });

        const playerContainer = document.createElement('div');
        Object.assign(playerContainer.style, {
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            textAlign: 'center',
            minWidth: '300px'
        });

        playerContainer.innerHTML = `
            <h3 style="color: #2c5aa0; margin-bottom: 15px;">
                🎤 Grabación Completada
            </h3>
            <p style="color: #666; margin-bottom: 15px;">
                Duración: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}
            </p>
            <audio controls style="width: 100%; margin-bottom: 15px;">
                <source src="${audioURL}" type="${audioBlob.type}">
                Tu navegador no soporta audio HTML5.
            </audio>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="downloadAudio" style="
                    padding: 8px 15px;
                    background-color: #27ae60;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 12px;
                ">
                    📥 Descargar
                </button>
                <button id="deleteAudio" style="
                    padding: 8px 15px;
                    background-color: #e74c3c;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 12px;
                ">
                    🗑️ Descartar
                </button>
                <button id="closePlayer" style="
                    padding: 8px 15px;
                    background-color: #95a5a6;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 12px;
                ">
                    ❌ Cerrar
                </button>
            </div>
        `;

        modal.appendChild(playerContainer);
        document.body.appendChild(modal);

        // Eventos de los botones
        document.getElementById('downloadAudio').addEventListener('click', () => {
            downloadAudio(audioBlob, duration);
        });

        document.getElementById('deleteAudio').addEventListener('click', () => {
            URL.revokeObjectURL(audioURL);
            modal.remove();
        });

        document.getElementById('closePlayer').addEventListener('click', () => {
            modal.remove();
        });

        // Cerrar con ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                modal.remove();
            }
        });
    }

    function downloadAudio(audioBlob, duration) {
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `grabacion-medica-${timestamp}.webm`;

        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(audioBlob);
        downloadLink.download = filename;
        downloadLink.style.display = 'none';
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        console.log(`💾 Audio descargado: ${filename}`);
    }

    // Atajos de teclado
    document.addEventListener('keydown', (e) => {
        // Ctrl + Shift + R para grabar/detener
        if (e.ctrlKey && e.shiftKey && e.key === 'R') {
            e.preventDefault();
            recorderBtn.click();
        }
    });

    console.log('✅ Grabadora de voz configurada');
    console.log('ℹ️ Atajo: Ctrl + Shift + R');
}

// ===== FUNCIÓN: IMPRESIÓN PDF =====
function setupMedicalNotePrint() {
    const printBtn = document.querySelector('.btn-print-note');
    
    if (!printBtn) {
        console.error('❌ Botón de impresión no encontrado');
        return;
    }
    
    printBtn.addEventListener('click', generatePrintView);
    
    function generatePrintView() {
        console.log('🖨️ Generando vista de impresión...');
        
        // Verificar que hay contenido
        const editor = document.getElementById('medicalNoteEditor');
        if (!editor) {
            alert('⚠️ Editor no encontrado.');
            return;
        }
        
        // Verificar que esté firmado
        if (window.validateMedicalNote && !window.validateMedicalNote()) {
            return; // validateMedicalNote ya muestra el alert
        }
        
        // Generar HTML optimizado para impresión
        const printHTML = createPrintHTML();
        
        // Abrir ventana de impresión
        openPrintWindow(printHTML);
        
        console.log('📄 Vista de impresión generada');
    }
    
    function createPrintHTML() {
        // Obtener datos de la nota médica
        const hospitalName = 'Hospital Central';
        const noteTitle = 'NOTA DE EVOLUCIÓN MÉDICA';
        const patientName = 'Carlos García Mendoza';
        const hc = 'HC-2024-001234';
        const edad = '58 años';
        const sexo = 'Masculino';
        const cama = '101A';
        const servicio = 'Medicina Interna';
        const diagnostico = 'Diabetes Mellitus Tipo 2 + Hipertensión Arterial';
        
        // Capturar todo el contenido visual
        const contentData = captureAllContent();
        
        // Crear fecha y hora actual
        const now = new Date();
        const fecha = now.toLocaleDateString('es-ES');
        const hora = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        
        return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nota Médica - ${patientName}</title>
    <style>
        @page {
            size: A4;
            margin: 1.5cm 1cm;
        }
        
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Times New Roman', serif;
            font-size: 11px;
            line-height: 1.4;
            color: #000;
            background: white;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .page-container {
            width: 100%;
            min-height: 100vh;
            border: 2px solid #2c5aa0;
            padding: 15px;
            position: relative;
        }
        
        /* Header */
        .header {
            text-align: center;
            border-bottom: 2px solid #2c5aa0;
            padding-bottom: 10px;
            margin-bottom: 15px;
            page-break-inside: avoid;
        }
        
        .header h1 {
            color: #2c5aa0;
            font-size: 16px;
            margin: 0 0 2px 0;
            font-weight: bold;
            line-height: 1.2;
        }
        
        .header .hospital-info {
            font-size: 8px;
            color: #666;
            margin: 2px 0 8px 0;
            line-height: 1.1;
        }
        
        .header h2 {
            color: #2c5aa0;
            font-size: 14px;
            margin: 5px 0 2px 0;
            font-weight: bold;
            line-height: 1.2;
        }
        
        .header .note-info {
            font-size: 8px;
            color: #666;
            margin: 2px 0 0 0;
            line-height: 1.1;
        }
        
        /* Datos del paciente */
        .patient-section {
            display: table;
            width: 100%;
            margin-bottom: 12px;
            border: 1px solid #ddd;
            background-color: #f9f9f9;
        }
        
        .patient-row {
            display: table-row;
        }
        
        .patient-cell {
            display: table-cell;
            padding: 4px 8px;
            border-bottom: 1px solid #eee;
            font-size: 10px;
            vertical-align: top;
        }
        
        .patient-cell:nth-child(even) {
            border-left: 1px solid #eee;
        }
        
        .patient-cell strong {
            color: #2c5aa0;
            font-weight: bold;
        }
        
        .patient-full {
            display: table-row;
        }
        
        .patient-full .patient-cell {
            display: table-cell;
            width: 100%;
        }
        
        /* Signos vitales */
        .vital-signs {
            background-color: #e8f4fd;
            border: 1px solid #2c5aa0;
            border-radius: 3px;
            padding: 8px;
            margin-bottom: 12px;
            font-size: 10px;
        }
        
        .vital-signs h3 {
            color: #2c5aa0;
            font-size: 11px;
            margin: 0 0 5px 0;
            font-weight: bold;
        }
        
        /* Contenido principal con numeración */
        .content-section {
            counter-reset: line-number;
            position: relative;
            margin: 12px 0;
            min-height: 300px;
        }
        
        .line-numbered {
            counter-increment: line-number;
            position: relative;
            margin: 6px 0 6px 30px;
            padding-left: 5px;
        }
        
        .line-numbered::before {
            content: counter(line-number);
            position: absolute;
            left: -35px;
            width: 25px;
            text-align: right;
            color: #999;
            font-size: 8px;
            font-family: 'Courier New', monospace;
            font-weight: normal;
        }
        
        /* Estilos para el contenido */
        .main-content img {
            max-width: 100% !important;
            height: auto !important;
            border: 1px solid #ddd;
            margin: 3px 0;
            page-break-inside: avoid;
        }
        
        .main-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 6px 0;
            page-break-inside: avoid;
        }
        
        .main-content table td {
            border: 1px solid #ddd;
            padding: 4px 6px;
            vertical-align: top;
            font-size: 10px;
        }
        
        .main-content table img {
            max-width: 150px !important;
            height: auto !important;
            margin: 0;
        }
        
        .main-content ul {
            margin: 6px 0;
            padding-left: 15px;
        }
        
        .main-content ul li {
            margin: 2px 0;
        }
        
        .main-content hr {
            border: none;
            border-top: 1px solid #2c5aa0;
            margin: 8px 0;
        }
        
        .main-content p {
            margin: 4px 0;
        }
        
        .main-content strong {
            font-weight: bold;
        }
        
        .main-content em {
            font-style: italic;
        }
        
        .main-content u {
            text-decoration: underline;
        }
        
        /* Firma */
        .signature-section {
            position: absolute;
            bottom: 20px;
            left: 15px;
            right: 15px;
            border-top: 1px solid #ddd;
            padding-top: 10px;
            display: table;
            width: calc(100% - 30px);
        }
        
        .signature-info {
            display: table-cell;
            vertical-align: bottom;
            font-size: 9px;
            color: #666;
            width: 60%;
        }
        
        .signature-box {
            display: table-cell;
            vertical-align: bottom;
            text-align: center;
            border: 1px solid #ddd;
            padding: 8px;
            background-color: #fafafa;
            width: 40%;
        }
        
        .signature-image {
            max-width: 180px;
            height: auto;
            margin: 0 auto 5px auto;
            display: block;
        }
        
        .signature-line {
            width: 150px;
            border-bottom: 1px solid #333;
            margin: 15px auto 3px auto;
            height: 1px;
        }
        
        .signature-label {
            font-size: 8px;
            color: #666;
            margin-top: 3px;
        }
        
        /* Estilos de impresión */
        @media print {
            body {
                margin: 0 !important;
                padding: 0 !important;
            }
            
            .page-container {
                border: 2px solid #2c5aa0 !important;
                min-height: 100vh;
            }
            
            .main-content img,
            .signature-image {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            .no-print {
                display: none !important;
            }
            
            .page-break {
                page-break-before: always;
            }
        }
        
        /* Botones de acción */
        .print-actions {
            position: fixed;
            top: 15px;
            right: 15px;
            z-index: 1000;
            background: white;
            padding: 8px;
            border-radius: 5px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        
        .print-actions button {
            margin: 0 3px;
            padding: 6px 12px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
        }
        
        .btn-print-pdf {
            background-color: #e74c3c;
            color: white;
        }
        
        .btn-print-paper {
            background-color: #3498db;
            color: white;
        }
        
        .btn-close-print {
            background-color: #95a5a6;
            color: white;
        }
        
        @media print {
            .print-actions {
                display: none !important;
            }
        }
    </style>
</head>
<body>
    <div class="print-actions no-print">
        <button class="btn-print-pdf" onclick="window.print()">
            📄 Imprimir PDF
        </button>
        <button class="btn-print-paper" onclick="window.print()">
            🖨️ Impresora
        </button>
        <button class="btn-close-print" onclick="window.close()">
            ❌ Cerrar
        </button>
    </div>

    <div class="page-container">
        <!-- Header -->
        <div class="header">
            <h1>${hospitalName}</h1>
            <div class="hospital-info">Av. Hospitales 123 - Telef. 01-2016500</div>
            <h2>${noteTitle}</h2>
            <div class="note-info">N° NE2024010001 - ${fecha}</div>
        </div>

        <!-- Datos del paciente -->
        <div class="patient-section">
            <div class="patient-row">
                <div class="patient-cell"><strong>PACIENTE:</strong> ${patientName}</div>
                <div class="patient-cell"><strong>HC:</strong> ${hc}</div>
            </div>
            <div class="patient-row">
                <div class="patient-cell"><strong>EDAD:</strong> ${edad}</div>
                <div class="patient-cell"><strong>SEXO:</strong> ${sexo}</div>
            </div>
            <div class="patient-row">
                <div class="patient-cell"><strong>CAMA:</strong> ${cama}</div>
                <div class="patient-cell"><strong>SERVICIO:</strong> ${servicio}</div>
            </div>
            <div class="patient-full">
                <div class="patient-cell" style="width: 100%;"><strong>DIAGNÓSTICO:</strong> ${diagnostico}</div>
            </div>
        </div>

        <!-- Signos vitales -->
        <div class="vital-signs">
            <h3>📊 SIGNOS VITALES ACTUALES - 14:30</h3>
            <div>PA: 140/90 mmHg &nbsp;&nbsp; FC: 78 lpm &nbsp;&nbsp; FR: 18 rpm &nbsp;&nbsp; T°: 36.8°C &nbsp;&nbsp; SpO2: 98%</div>
        </div>

        <!-- Contenido principal con numeración -->
        <div class="content-section">
            ${contentData.content}
        </div>

        <!-- Firma -->
        <div class="signature-section">
            <div class="signature-info">
                <div><strong>Fecha:</strong> ${fecha}</div>
                <div><strong>Hora:</strong> ${hora}</div>
                <div><strong>Médico:</strong> Dr. Alan Cairampoma Carrillo</div>
                <div><strong>CMP:</strong> 12345</div>
                <div><strong>Especialidad:</strong> Medicina Interna</div>
            </div>
            
            <div class="signature-box">
                ${contentData.signature ? 
                    `<img src="${contentData.signature}" class="signature-image" alt="Firma Digital">
                     <div class="signature-line"></div>
                     <div class="signature-label">Firma Digital</div>` :
                    `<div style="height: 40px; line-height: 40px; color: #999;">Sin firma</div>
                     <div class="signature-line"></div>
                     <div class="signature-label">Firma Digital</div>`
                }
            </div>
        </div>
    </div>

    <script>
        window.onload = function() {
            console.log('📄 Vista de impresión cargada');
            
            // Auto-focus para imprimir
            setTimeout(() => {
                // window.print(); // Descomenta para auto-imprimir
            }, 1000);
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
    
    function captureAllContent() {
        const result = { content: '', signature: null };
        
        try {
            // Capturar contenido del editor
            const editor = document.getElementById('medicalNoteEditor');
            if (editor) {
                let editorHTML = editor.innerHTML;
                
                // Procesar contenido para impresión
                result.content = processContentForPrint(editorHTML);
            }
            
            // Capturar firma
            result.signature = captureSignatureForPrint();
            
            console.log('📸 Contenido capturado para impresión');
            
        } catch (error) {
            console.error('❌ Error capturando contenido:', error);
            result.content = '<div class="line-numbered">Error al cargar contenido</div>';
        }
        
        return result;
    }
    
    function processContentForPrint(html) {
        try {
            // Crear DOM temporal
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            
            // Convertir canvas a imágenes
            const canvases = tempDiv.querySelectorAll('canvas');
            canvases.forEach((canvas, index) => {
                try {
                    // Buscar canvas original
                    const originalCanvases = document.querySelectorAll('#medicalNoteEditor canvas');
                    const originalCanvas = originalCanvases[index];
                    
                    if (originalCanvas && originalCanvas.width > 0 && originalCanvas.height > 0) {
                        const img = document.createElement('img');
                        img.src = originalCanvas.toDataURL('image/png');
                        img.className = 'printed-canvas';
                        canvas.parentNode.replaceChild(img, canvas);
                        console.log(`🖼️ Canvas ${index + 1} convertido para impresión`);
                    }
                } catch (error) {
                    console.warn(`⚠️ Error procesando canvas ${index + 1}:`, error);
                }
            });
            
            // Agregar numeración de líneas a elementos principales
            const elements = tempDiv.querySelectorAll('p, div:not(table div), table, ul, hr');
            elements.forEach(element => {
                if (!element.closest('table') || element.tagName === 'TABLE') {
                    element.classList.add('line-numbered');
                }
            });
            
            // Si no hay elementos, crear uno por defecto
            if (elements.length === 0) {
                tempDiv.innerHTML = '<div class="line-numbered">Sin contenido</div>';
            }
            
            return tempDiv.innerHTML;
            
        } catch (error) {
            console.error('❌ Error procesando contenido:', error);
            return '<div class="line-numbered">Error al procesar contenido</div>';
        }
    }
    
    function captureSignatureForPrint() {
        try {
            const signatureCanvas = document.getElementById('signatureCanvas');
            if (signatureCanvas && window.signatureAPI && window.signatureAPI.isSigned()) {
                const signatureData = signatureCanvas.toDataURL('image/png');
                console.log('✍️ Firma capturada para impresión');
                return signatureData;
            }
            console.log('📝 Sin firma para imprimir');
            return null;
        } catch (error) {
            console.warn('⚠️ Error capturando firma para impresión:', error);
            return null;
        }
    }
    
    function openPrintWindow(htmlContent) {
        try {
            const printWindow = window.open('', '_blank', 'width=900,height=1100,scrollbars=yes,resizable=yes');
            
            if (!printWindow) {
                alert('⚠️ El navegador bloqueó la ventana emergente.\n\nPermita ventanas emergentes para esta página.');
                return;
            }
            
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            printWindow.focus();
            
            console.log('🖨️ Ventana de impresión abierta');
            
        } catch (error) {
            console.error('❌ Error abriendo ventana de impresión:', error);
            alert('Error al abrir la vista de impresión.');
        }
    }
    
    console.log('✅ Sistema de impresión PDF configurado');
}

// ===== AUTO-EJECUTAR CUANDO CARGUE LA PÁGINA =====
document.addEventListener('DOMContentLoaded', inicializarNotasMedicas);

console.log('✅ notamedica.js cargado correctamente');