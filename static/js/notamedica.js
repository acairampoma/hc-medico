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
    
    // 9. LOCAL STORAGE
    setupLocalStorage();

    // 10. BOTÓN TEST
    setupTestButton();

    // 11. BOTÓN GUARDAR
    setupSaveButton();

    // 12. BOTÓN VER NOTAS
    setupVerNotas();

    // 13. BOTÓN NUEVA NOTA
    setupNuevoEditor();

    // 14. CARGAR DATOS DE FIRMA
    setupCargarDatosFirma();

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
    
    console.log('🔍 Canvas encontrado:', canvas);
    console.log('📏 Dimensiones canvas:', canvas.width, 'x', canvas.height);
    
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let signatureData = [];
    
    // FORZAR configuración del canvas
    canvas.width = 400;
    canvas.height = 150;
    
    // Configuración inicial del canvas
    setupCanvas();
    
    function setupCanvas() {
        console.log('⚙️ Configurando canvas...');
        
        // REDIMENSIONAR CANVAS - más pequeño y compacto
        canvas.width = 300;  // era 400
        canvas.height = 100; // era 150
        
        // Ajustar estilos del canvas también
        canvas.style.cssText = `
            border: 2px dashed #bdc3c7 !important;
            border-radius: 5px !important;
            cursor: crosshair !important;
            background-color: #ffffff !important;
            touch-action: none !important;
            user-select: none !important;
            position: relative !important;
            z-index: 10 !important;
            display: block !important;
            max-width: 100% !important;
            height: auto !important;
        `;
        
        // Limpiar eventos previos
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('mouseup', stopDrawing);
        canvas.removeEventListener('mouseout', stopDrawing);
        
        // Configurar canvas para firma
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#2c3e50';
        
        // Fondo blanco FORZADO
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Agregar texto guía más pequeño
        drawPlaceholder();
        
        console.log(`✅ Canvas redimensionado a ${canvas.width}x${canvas.height}`);
    }
    
    function drawPlaceholder() {
        ctx.save();
        ctx.fillStyle = '#95a5a6';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('✍️ MANTÉN PRESIONADO y arrastra para firmar', canvas.width / 2, canvas.height / 2 - 5);
        ctx.fillText('(Firma compacta)', canvas.width / 2, canvas.height / 2 + 8);
        ctx.restore();
    }
    
    // Eventos del mouse CON DEBUGGING
    canvas.addEventListener('mousedown', function(e) {
        console.log('🖱️ MOUSEDOWN detectado en:', e.clientX, e.clientY);
        startDrawing(e);
    });
    
    canvas.addEventListener('mousemove', function(e) {
        if (isDrawing) {
            console.log('🖱️ MOUSEMOVE dibujando:', e.clientX, e.clientY);
        }
        draw(e);
    });
    
    canvas.addEventListener('mouseup', function(e) {
        console.log('🖱️ MOUSEUP detectado');
        stopDrawing();
    });
    
    canvas.addEventListener('mouseout', function(e) {
        console.log('🖱️ MOUSEOUT detectado');
        stopDrawing();
    });
    
    
    
    // Eventos touch para tablets/móviles
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('touchend', stopDrawing);
    
    function startDrawing(e) {
        console.log('🖋️ START DRAWING llamado');
        e.preventDefault();
        e.stopPropagation();
        
        isDrawing = true;
        [lastX, lastY] = getCoordinates(e);
        
        console.log('📍 Coordenadas iniciales:', lastX, lastY);
        
        // Cambiar cursor para indicar que está dibujando
        canvas.style.cursor = 'grabbing';
        
        // Limpiar placeholder al empezar a firmar
        if (signatureData.length === 0) {
            clearCanvas(false);
            console.log('🧹 Placeholder limpiado');
        }
        
        // Dibujar punto iniciala
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.arc(lastX, lastY, 0.5, 0, 2 * Math.PI);
        ctx.fill();
        
        // Guardar punto inicial
        signatureData.push({ x: lastX, y: lastY, drawing: true });
        
        console.log('🖋️ Firma iniciada en:', lastX, lastY);
    }
    
    function draw(e) {
        if (!isDrawing) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const [currentX, currentY] = getCoordinates(e);
        
        console.log('✏️ Dibujando línea de', lastX, lastY, 'a', currentX, currentY);
        
        // Dibujar línea MÁS VISIBLE
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 3;
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
        
        // Restaurar cursor
        canvas.style.cursor = 'crosshair';
        
        // Marcar fin de trazo
        signatureData.push({ drawing: false });
        
        // Actualizar estado si hay firma
        if (signatureData.length > 1) {
            updateSignatureStatus('signed');
            console.log('✅ Trazo completado');
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


// ===== FUNCIÓN PRINCIPAL =====
function setupLocalStorage() {
    console.log('📦 Cargando datos del paciente...');
    
    const data = getPatientData();
    if (!data) return;
    
    updatePatientHeader(data);
    console.log('✅ Datos cargados');
}

// ===== OBTENER DATOS DEL PACIENTE =====
function getPatientData() {
    console.log('📦 Obteniendo datos del paciente...');
    
    try {
        const stored = localStorage.getItem('currentPatientData');
        if (!stored) {
            console.warn('⚠️ No hay currentPatientData en localStorage');
            return null;
        }
        
        const parsed = JSON.parse(stored);
        console.log('📋 Datos encontrados:', parsed);
        
        // DETECTAR ESTRUCTURA: Medical Rounds vs API
        if (parsed.source === "medical_rounds") {
            console.log('📦 Usando datos de Medical Rounds');
            return parsed; // Estructura directa de medical rounds
        }
        
        // Si tiene estructura de respuesta API, extraer data
        if (parsed.data && parsed.data.patient_data) {
            console.log('📦 Usando datos de API response');
            return parsed.data.patient_data;
        }
        
        // Si es directamente patient_data
        if (parsed.patient_data) {
            console.log('📦 Usando patient_data directo');
            return parsed.patient_data;
        }
        
        // Si es el objeto directo con campos conocidos
        if (parsed.firstName || parsed.fullName || parsed.patientId) {
            console.log('📦 Usando datos directos (estructura plana)');
            return parsed;
        }
        
        console.warn('⚠️ Estructura de datos no reconocida');
        return parsed; // Intentar usar tal como está
        
    } catch (error) {
        console.error('❌ Error leyendo localStorage:', error);
        return null;
    }
}

// ===== ACTUALIZAR CABECERA DEL PACIENTE =====
function updatePatientHeader(data) {
    // Detectar estructura de datos
    let nombre, edad, sexo, servicio, diagnostico, hc;
    
    if (data.source === "medical_rounds") {
        // Estructura de Medical Rounds
        nombre = data.fullName || `${data.firstName} ${data.lastName}`;
        edad = data.age ? `${data.age} años` : null;
        sexo = data.gender;
        hc = data.medicalRecord || data.patientId;
        servicio = data.attendingPhysician || data.specialty || 'Medicina Interna';
        diagnostico = data.primaryDiagnosis;
        
    } else if (data.personal_info) {
        // Estructura nueva (API)
        nombre = data.personal_info.fullname || `${data.personal_info.first_name} ${data.personal_info.last_name}`;
        edad = data.personal_info.age ? `${data.personal_info.age} años` : null;
        sexo = data.personal_info.gender;
        hc = data.personal_info.medical_record;
        servicio = data.medical_info?.attending_physician || 'Medicina Interna';
        diagnostico = data.medical_info?.primary_diagnosis;
        
    } else {
        // Estructura genérica (fallback)
        nombre = data.fullName || data.fullname || `${data.firstName} ${data.lastName}`;
        edad = data.age ? `${data.age} años` : null;
        sexo = data.gender;
        hc = data.medicalRecord || data.patientId;
        servicio = data.attendingPhysician || data.specialty || 'Medicina Interna';
        diagnostico = data.primaryDiagnosis;
    }
    
    const updates = {
        'PACIENTE:': nombre,
        'HC:': hc,
        'EDAD:': edad,
        'SEXO:': sexo,
        'SERVICIO:': servicio,
        'DIAGNÓSTICO:': diagnostico
    };
    
    console.log('📋 Actualizando con:', updates);
    
    document.querySelectorAll('.patient-data-table td').forEach(cell => {
        const label = cell.textContent.trim();
        if (updates[label] && updates[label] !== null) {
            const valueCell = cell.nextElementSibling;
            if (valueCell) {
                valueCell.textContent = updates[label];
                console.log(`✅ ${label} → ${updates[label]}`);
            }
        }
    });
}


// ===== FUNCIÓN PRINCIPAL: SETUP BOTÓN TEST =====
function setupTestButton() {
    const testBtn = document.getElementById('testJsonBtn');
    if (testBtn) {
        testBtn.addEventListener('click', mostrarJsonTest);
        console.log('✅ Botón Test configurado');
    }
}

// ===== FUNCIONES DE APOYO =====
function mostrarJsonTest() {
    const jsonData = recolectarDatosNota();
    const jsonString = JSON.stringify(jsonData, null, 2);
    
    // Mostrar en alert por ahora (después podemos hacer modal)
    alert('JSON PARA SERVICIO:\n\n' + jsonString);
    
    // También en consola para fácil copia
    console.log('📋 JSON COMPLETO:');
    console.log(jsonData);
    console.log('📋 JSON STRING:');
    console.log(jsonString);
}

function recolectarDatosNota() {
    console.log('📋 Recolectando datos de la nota...');
    
    const patientData = getPatientData(); // Ya tenemos esta función
    const ahora = new Date();
    
    // MAPEAR DATOS CON PRIORIDAD: API > Medical Rounds > Fallback
    let hospitalizacionId, numeroCuenta, pacienteId, medicoId, especialidadId;
    
    if (patientData?.patient_data?.hospitalizacion_id) {
        // PRIORIDAD 1: Datos del API (más completos y reales)
        hospitalizacionId = patientData.patient_data.hospitalizacion_id;
        numeroCuenta = patientData.patient_data.numero_cuenta;
        pacienteId = patientData.patient_data.paciente_id;
        medicoId = patientData.patient_data.medico_tratante_id || 105;
        especialidadId = patientData.patient_data.especialidad_id;
        
        console.log('🎯 Usando datos del API (REALES):');
        console.log('  - hospitalizacion_id:', hospitalizacionId);
        console.log('  - numero_cuenta:', numeroCuenta);
        console.log('  - paciente_id:', pacienteId);
        console.log('  - especialidad_id:', especialidadId);
        
    } else if (patientData?.hospitalizacionId || patientData?.hospitalizacion_id) {
        // PRIORIDAD 2: Datos directos de Medical Rounds
        hospitalizacionId = patientData.hospitalizacionId || patientData.hospitalizacion_id;
        numeroCuenta = patientData.numeroCuenta || patientData.numero_cuenta;
        pacienteId = patientData.pacienteId || patientData.paciente_id;
        medicoId = patientData.medico_tratante_id || 105;
        especialidadId = patientData.especialidad_id;
        
        console.log('📋 Usando datos de Medical Rounds:');
        console.log('  - hospitalizacion_id:', hospitalizacionId);
        console.log('  - numero_cuenta:', numeroCuenta);
        console.log('  - paciente_id:', pacienteId);
        
    } else {
        // PRIORIDAD 3: Fallback con datos básicos + generados
        hospitalizacionId = 2; // Temporal
        numeroCuenta = `CTA${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
        pacienteId = patientData?.paciente_id || parseInt(patientData?.patientId?.replace(/\D/g, '')) || 999;
        medicoId = 105;
        especialidadId = null;
        
        console.log('⚠️ Usando datos fallback (generados):');
        console.log('  - hospitalizacion_id:', hospitalizacionId, '(temporal)');
        console.log('  - numero_cuenta:', numeroCuenta, '(generado)');
        console.log('  - paciente_id:', pacienteId);
    }
    
    const notaJson = {
        // DATOS BÁSICOS DE LA NOTA
        numero_nota: generarNumeroNota(),
        hospitalizacion_id: hospitalizacionId,
        numero_cuenta: numeroCuenta,
        tipo_nota: "01", // Evolución médica
        titulo_nota: "Evolución Médica",
        contenido_nota: obtenerContenidoEditor(),
        turno: calcularTurno(ahora),
        
        // METADATOS
        estado: "01", // Borrador por defecto
        creado_por: medicoId,
        
        // DATOS CLÍNICOS
        signos_vitales: obtenerSignosVitales(),
        firma_digital: obtenerFirmaDigital(),
        audio_data: obtenerAudioData()
    };
    
    console.log('✅ JSON armado con datos REALES:', notaJson);
    console.log('📊 Fuente de datos:', patientData?.patient_data ? 'API (REAL)' : patientData?.source || 'fallback');
    return notaJson;
}

// ===== OBTENER CONTENIDO DEL EDITOR =====
function obtenerContenidoEditor() {
    const editor = document.getElementById('medicalNoteEditor');
    const contenido = editor ? editor.innerHTML.trim() : '';
    
    // Si está vacío, poner datos de prueba
    if (!contenido || contenido === '') {
        return `
<h3>Evolución Post-Procedimiento</h3>
<p><strong>Paciente estable</strong> post-procedimiento</p>
<ul>
<li>Signos vitales estables</li>
<li>Sin complicaciones</li>
<li>Tolera vía oral</li>
</ul>
<p><strong>Plan:</strong> Continuar observación por 24 horas</p>
        `.trim();
    }
    
    return contenido;
}

// ===== OBTENER SIGNOS VITALES =====
function obtenerSignosVitales() {
    // Leer de la tabla de signos vitales actuales
    const vitalsRow = document.querySelector('.vitals-row');
    const ahora = new Date().toISOString();
    
    let signos = {
        origen: "manual",
        timestamp: ahora,
        presion_arterial: { sistolica: 120, diastolica: 80 },
        frecuencia_cardiaca: 72,
        temperatura: 36.5,
        saturacion_oxigeno: 98,
        frecuencia_respiratoria: 16
    };
    
    // Si hay datos en la UI, extraerlos
    if (vitalsRow) {
        const spans = vitalsRow.querySelectorAll('span');
        spans.forEach(span => {
            const texto = span.textContent;
            
            if (texto.includes('PA:')) {
                const match = texto.match(/(\d+)\/(\d+)/);
                if (match) {
                    signos.presion_arterial.sistolica = parseInt(match[1]);
                    signos.presion_arterial.diastolica = parseInt(match[2]);
                }
            } else if (texto.includes('FC:')) {
                const match = texto.match(/(\d+)/);
                if (match) signos.frecuencia_cardiaca = parseInt(match[1]);
            } else if (texto.includes('T°:')) {
                const match = texto.match(/(\d+\.?\d*)/);
                if (match) signos.temperatura = parseFloat(match[1]);
            } else if (texto.includes('SpO2:')) {
                const match = texto.match(/(\d+)/);
                if (match) signos.saturacion_oxigeno = parseInt(match[1]);
            } else if (texto.includes('FR:')) {
                const match = texto.match(/(\d+)/);
                if (match) signos.frecuencia_respiratoria = parseInt(match[1]);
            }
        });
    }
    
    return signos;
}

// ===== OBTENER FIRMA DIGITAL =====
function obtenerFirmaDigital() {
    const canvas = document.getElementById('signatureCanvas');
    
    if (!canvas) {
        return {
            tiene_firma: false,
            requerida: true,
            firma_base64: null,
            fecha_firma: null
        };
    }
    
    // Verificar si hay algo dibujado en el canvas
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasDrawing = imageData.data.some((channel, index) => 
        index % 4 !== 3 && channel !== 0
    );
    
    if (hasDrawing) {
        return {
            tiene_firma: true,
            requerida: true,
            firma_base64: canvas.toDataURL('image/png'),
            fecha_firma: new Date().toISOString(),
            medico_cmp: "12345" // TODO: Obtener del localStorage
        };
    } else {
        return {
            tiene_firma: false,
            requerida: true,
            firma_base64: null,
            fecha_firma: null
        };
    }
}

// ===== OBTENER DATOS DE AUDIO =====
function obtenerAudioData() {
    // Por ahora datos de prueba, después integraremos la grabadora
    return {
        tiene_audio: false,
        duracion_segundos: 0,
        transcrito: false,
        audio_eliminado: false,
        fecha_grabacion: null,
        calidad_audio: "buena",
        audio_base64: null
    };
}

// ===== FUNCIONES AUXILIARES =====
function generarNumeroNota() {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    const hora = String(ahora.getHours()).padStart(2, '0');
    const min = String(ahora.getMinutes()).padStart(2, '0');
    
    return `NE${año}${mes}${dia}${hora}${min}`;
}

function calcularTurno(fecha) {
    const hora = fecha.getHours();
    
    if (hora >= 7 && hora < 13) return "01"; // Mañana
    if (hora >= 13 && hora < 19) return "02"; // Tarde  
    return "03"; // Noche
}


// ===== GRABAR NOTA MEDICA=====

// 1. INICIALIZACIÓN
function setupSaveButton() {
    console.log('🔥 Iniciando sistema de notas médicas...');
    
    const saveBtn = document.getElementById('guardarNotaBtn');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', guardarNota);
        console.log('✅ Botón guardar configurado');
    }
}

// 2. GUARDAR NOTA - FLUJO OPTIMIZADO
async function guardarNota() {
    console.log('💾 Iniciando proceso de guardado...');
    
    // PASO 1: VALIDAR CONTENIDO TEXTO
    console.log('📝 Paso 1: Validando contenido...');
    const contenido = obtenerContenidoEditor();
    if (!validarContenido(contenido)) {
        alert('❌ Debe escribir el contenido de la nota');
        return;
    }
    console.log('✅ Contenido válido');
    
    // PASO 2: VALIDAR FIRMA
    console.log('✍️ Paso 2: Validando firma...');
    const firma = obtenerFirmaDigital();
    if (!validarFirma(firma)) {
        alert('❌ Debe firmar la nota médica');
        return;
    }
    console.log('✅ Firma válida');
    
    // PASO 3: VALIDAR DATOS DEL PACIENTE Y TOKEN
    console.log('👤 Paso 3: Validando datos del paciente...');
    const pacienteData = obtenerDatosPaciente();
    const token = localStorage.getItem('access_token');
    
    if (!validarDatosPaciente(pacienteData)) {
        alert('❌ No hay datos del paciente disponibles');
        return;
    }
    
    if (!validarToken(token)) {
        alert('❌ No hay token de autenticación válido');
        return;
    }
    console.log('✅ Datos del paciente y token válidos');
    
    // PASO 4: RECOLECTAR INFORMACIÓN
    console.log('📋 Paso 4: Recolectando información...');
    const notaData = recolectarDatos(pacienteData, contenido, firma);
    console.log('✅ Información recolectada:', notaData);
    
    // PASO 5: LLAMAR AL API
    console.log('🌐 Paso 5: Enviando al servidor...');
    const resultado = await enviarAlServidor(notaData, token);
    
    // PASO 6: PROCESAR RESPUESTA Y MOSTRAR MENSAJES
    console.log('📱 Paso 6: Procesando respuesta...');
    if (resultado.exito) {
        console.log('✅ Nota guardada exitosamente en servidor');
        
        // 🔥 NUEVO: GUARDAR EN LOCALSTORAGE TAMBIÉN
        console.log('💾 Guardando en localStorage...');
        try {
            // Crear objeto completo para localStorage incluyendo la firma
            const contenidoParaLocalStorage = {
                ...contenido,  // Todo el contenido capturado
                firmaBase64: firma.firma_base64 ? firma.firma_base64.split(',')[1] : null,  // Solo la parte base64
                numeroNota: notaData.numero_nota,
                fechaGuardado: new Date().toISOString(),
                metadatos: {
                    ...contenido.metadatos,
                    numeroNota: notaData.numero_nota,
                    numeroCuenta: notaData.numero_cuenta,
                    hospitalizacionId: notaData.hospitalizacion_id
                }
            };
            
            // Key usando el número de nota
            const keyLocalStorage = `nota_${notaData.numero_nota}`;
            
            // Guardar en localStorage
            localStorage.setItem(keyLocalStorage, JSON.stringify(contenidoParaLocalStorage));
            
            console.log(`✅ Guardado en localStorage con key: ${keyLocalStorage}`);
            console.log('📄 Contenido guardado:', contenidoParaLocalStorage);
            
        } catch (errorLocal) {
            console.error('❌ Error al guardar en localStorage:', errorLocal);
            // No fallar por esto, solo advertir
        }
        
        alert('✅ Nota guardada correctamente');
        
        // PASO 7: LIMPIAR FORMULARIO
        console.log('🧹 Paso 7: Limpiando formulario...');
        limpiarFormulario();
        console.log('✅ Proceso completado exitosamente');
        
    } else {
        console.error('❌ Error al guardar:', resultado.error);
        alert(`❌ Error al guardar: ${resultado.mensaje}`);
    }
}

// 🔧 FUNCIÓN AUXILIAR PARA VER QUE SE GUARDÓ
function verificarNotasGuardadas() {
    console.log('🔍 =================== NOTAS EN LOCALSTORAGE ===================');
    
    const todasLasKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('nota_')) {
            todasLasKeys.push(key);
        }
    }
    
    console.log('📋 Keys de notas encontradas:', todasLasKeys);
    
    todasLasKeys.forEach(key => {
        try {
            const contenido = JSON.parse(localStorage.getItem(key));
            console.log(`📄 ${key}:`, {
                numeroNota: contenido.numeroNota,
                fechaGuardado: contenido.fechaGuardado,
                tieneTexto: contenido.texto ? contenido.texto.length > 0 : false,
                tieneFirma: !!contenido.firmaBase64,
                tieneDibujos: contenido.dibujos ? contenido.dibujos.length : 0
            });
        } catch (e) {
            console.error(`❌ Error al parsear ${key}:`, e);
        }
    });
}

// 🔧 FUNCIÓN PARA PROBAR GUARDADO Y RECUPERACIÓN
async function pruebaCompleta() {
    console.log('🧪 =================== PRUEBA COMPLETA ===================');
    
    // 1. Guardar nota
    console.log('💾 Guardando nota...');
    await guardarNota();
    
    // 2. Verificar que se guardó
    console.log('🔍 Verificando guardado...');
    verificarNotasGuardadas();
    
    // 3. Simular ver notas
    console.log('👁️ Simulando ver notas...');
    setTimeout(() => {
        verTodasLasNotas();
    }, 1000);
}

// 3. FUNCIONES DE VALIDACIÓN
function validarContenido(contenido) {
    console.log('🔍 Validando contenido del editor...');
    
    // Verificar que el contenido no sea null o undefined
    if (!contenido) {
        console.warn('❌ Contenido es null o undefined');
        return false;
    }
    
    // Verificar que tenga la propiedad texto
    if (!contenido.texto) {
        console.warn('❌ No hay texto en el contenido');
        return false;
    }
    
    // Limpiar el texto de espacios, saltos de línea y HTML
    const textoLimpio = contenido.texto
        .replace(/<[^>]*>/g, '') // Quitar tags HTML
        .replace(/&nbsp;/g, ' ') // Reemplazar &nbsp; con espacios
        .replace(/\s+/g, ' ')    // Múltiples espacios a uno solo
        .trim();                 // Quitar espacios al inicio y final
    
    console.log('📝 Texto limpio para validar:', `"${textoLimpio}"`);
    console.log('📏 Longitud del texto:', textoLimpio.length);
    
    // Verificar que el texto tenga al menos 10 caracteres
    if (textoLimpio.length < 10) {
        console.warn(`❌ Texto muy corto: ${textoLimpio.length} caracteres (mínimo 10)`);
        return false;
    }
    
    // Verificar que no sea solo texto de placeholder
    const placeholderTexts = [
        'escriba o dicte',
        'placeholder',
        'contenido aquí',
        'escriba aquí',
        'texto aquí'
    ];
    
    const textoMinuscula = textoLimpio.toLowerCase();
    for (const placeholder of placeholderTexts) {
        if (textoMinuscula.includes(placeholder)) {
            console.warn(`❌ Texto contiene placeholder: "${placeholder}"`);
            return false;
        }
    }
    
    console.log('✅ Contenido válido');
    return true;
}

function validarFirma(firma) {
    console.log('🔍 Validando firma digital...');
    
    // Verificar que la firma no sea null o undefined
    if (!firma) {
        console.warn('❌ Firma es null o undefined');
        return false;
    }
    
    // Verificar que tenga la propiedad firma_base64
    if (!firma.firma_base64) {
        console.warn('❌ No hay firma_base64 en el objeto firma');
        return false;
    }
    
    // Verificar que la firma no esté vacía
    if (firma.firma_base64.length < 100) {
        console.warn(`❌ Firma muy corta: ${firma.firma_base64.length} caracteres`);
        return false;
    }
    
    // Verificar que sea un base64 válido
    if (!firma.firma_base64.startsWith('data:image/')) {
        console.warn('❌ Firma no tiene formato base64 válido');
        return false;
    }
    
    // Verificar usando el API de firma si existe
    if (window.signatureAPI && typeof window.signatureAPI.isSigned === 'function') {
        const firmadoAPI = window.signatureAPI.isSigned();
        console.log('🔍 Estado firma según API:', firmadoAPI);
        
        if (!firmadoAPI) {
            console.warn('❌ API indica que no está firmado');
            return false;
        }
    }
    
    console.log('✅ Firma válida');
    return true;
}


function validarDatosPaciente(pacienteData) {
    return pacienteData !== null && pacienteData !== undefined;
}

function validarToken(token) {
    return token && token.trim() !== '';
}

// 4. ENVÍO AL SERVIDOR
async function enviarAlServidor(notaData, token) {
    try {
        const response = await fetch('http://localhost:8090/api/notas/crear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(notaData)
        });
        
        if (response.ok || response.status === 201) {
            return { 
                exito: true, 
                status: response.status,
                mensaje: 'Guardado exitoso'
            };
        } else {
            return { 
                exito: false, 
                status: response.status,
                error: 'Error del servidor',
                mensaje: `Error ${response.status}: No se pudo guardar la nota`
            };
        }
        
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        return { 
            exito: false, 
            error: error.message,
            mensaje: 'Error de conexión con el servidor'
        };
    }
}

// 5. RECOLECTAR DATOS
function recolectarDatos(pacienteData, contenido, firma) {
    const ahora = new Date();
    
    return {
        numero_nota: generarNumeroNota(),
        hospitalizacion_id: extraerHospitalizacionId(pacienteData),
        numero_cuenta: extraerNumeroCuenta(pacienteData),
        tipo_nota: "01",
        titulo_nota: "Evolución Médica",
        contenido_nota: JSON.stringify(contenido),
        turno: calcularTurno(ahora),
        estado: "02",
        creado_por: extraerMedicoId(pacienteData),
        signos_vitales: obtenerSignosVitales(),
        firma_digital: firma,
        audio_data: { tiene_audio: false }
    };
}

// 6. EXTRAER DATOS ESPECÍFICOS
function extraerHospitalizacionId(pacienteData) {
    return pacienteData.hospitalizacion_id || 
           pacienteData.patient_data?.hospitalizacion_id || 
           2; // Fallback
}

function extraerNumeroCuenta(pacienteData) {
    return pacienteData.numero_cuenta || 
           pacienteData.patient_data?.numero_cuenta || 
           generarNumeroCuenta();
}

function extraerMedicoId(pacienteData) {
    return pacienteData.medico_tratante_id || 
           pacienteData.patient_data?.medico_tratante_id || 
           105; // Fallback
}

// 7. OBTENER DATOS DEL FORMULARIO
function obtenerContenidoEditor() {
    try {
        const contenidoCompleto = {
            texto: '',
            html: '',
            dibujos: [],
            imagenes: [],
            metadatos: {
                timestamp: new Date().toISOString(),
                fecha: new Date().toLocaleDateString('es-ES'),
                hora: new Date().toLocaleTimeString('es-ES')
            },
            resumen: ''
        };

        // 1. OBTENER CONTENIDO DEL EDITOR PRINCIPAL
        const editor = document.getElementById('medicalNoteEditor');
        if (editor) {
            // TEXTO PLANO (para búsquedas)
            contenidoCompleto.texto = editor.textContent || editor.innerText || '';
            
            // HTML FORMATEADO (para reconstruir con formato)
            contenidoCompleto.html = editor.innerHTML || '';
            
            console.log('📝 Editor encontrado:', {
                textoLength: contenidoCompleto.texto.length,
                htmlLength: contenidoCompleto.html.length,
                tieneFormato: contenidoCompleto.html !== contenidoCompleto.texto
            });
        } else {
            console.warn('❌ Editor #medicalNoteEditor no encontrado');
        }

        // 2. PROCESAR CANVAS (DIBUJOS Y FIRMA)
        const todosLosCanvas = document.querySelectorAll('canvas');
        console.log(`🎨 Procesando ${todosLosCanvas.length} canvas...`);
        
        todosLosCanvas.forEach((canvas, index) => {
            try {
                const context = canvas.getContext('2d');
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                
                // Verificar si hay contenido real
                let tieneContenido = false;
                for (let i = 3; i < imageData.data.length; i += 4) {
                    if (imageData.data[i] > 0) {
                        tieneContenido = true;
                        break;
                    }
                }
                
                if (tieneContenido) {
                    const dibujoInfo = {
                        id: canvas.id || `canvas_${index}`,
                        indice: index,
                        dimensiones: {
                            width: canvas.width,
                            height: canvas.height
                        },
                        datos: {
                            imageData: canvas.toDataURL('image/png')
                        },
                        tieneContenido: true,
                        timestamp: new Date().toISOString()
                    };
                    
                    contenidoCompleto.dibujos.push(dibujoInfo);
                    console.log(`✅ Canvas ${canvas.id || index} procesado`);
                }
            } catch (error) {
                console.warn(`⚠️ Error procesando canvas ${index}:`, error);
            }
        });

        // 3. PROCESAR IMÁGENES (si las hay en el editor)
        const imagenesEnEditor = editor ? editor.querySelectorAll('img') : [];
        imagenesEnEditor.forEach((img, index) => {
            if (img.src && img.src !== window.location.href) {
                const imagenInfo = {
                    id: img.id || `imagen_${index}`,
                    indice: index,
                    src: img.src,
                    alt: img.alt || '',
                    dimensiones: {
                        width: img.width || img.naturalWidth,
                        height: img.height || img.naturalHeight
                    }
                };
                
                if (img.src.startsWith('data:')) {
                    imagenInfo.esBase64 = true;
                    imagenInfo.base64 = img.src.split(',')[1];
                    imagenInfo.mimeType = img.src.split(',')[0].split(':')[1].split(';')[0];
                }
                
                contenidoCompleto.imagenes.push(imagenInfo);
            }
        });

        // 4. CREAR RESUMEN
        const resumen = `Contenido capturado el ${contenidoCompleto.metadatos.fecha} a las ${contenidoCompleto.metadatos.hora}
- Texto: ${contenidoCompleto.texto.length} caracteres
- Dibujos: ${contenidoCompleto.dibujos.length} canvas con contenido
- Imágenes: ${contenidoCompleto.imagenes.length} imágenes
- HTML: ${contenidoCompleto.html.length} caracteres`;
        
        contenidoCompleto.resumen = resumen;

        // 5. VALIDAR QUE HAY CONTENIDO
        const hayContenido = 
            contenidoCompleto.texto.trim().length > 0 ||
            contenidoCompleto.dibujos.length > 0 ||
            contenidoCompleto.imagenes.length > 0;

        if (!hayContenido) {
            console.warn('⚠️ No se encontró contenido significativo');
            contenidoCompleto.advertencia = 'No se encontró contenido significativo';
        }

        // 6. LOG PARA DEBUGGING
        console.log('📊 Contenido final capturado:', {
            textoLength: contenidoCompleto.texto.length,
            htmlLength: contenidoCompleto.html.length,
            dibujosCount: contenidoCompleto.dibujos.length,
            imagenesCount: contenidoCompleto.imagenes.length,
            hayContenido: hayContenido
        });

        return contenidoCompleto;

    } catch (error) {
        console.error('❌ Error en obtenerContenidoEditor:', error);
        return {
            error: error.message,
            timestamp: new Date().toISOString(),
            texto: '',
            html: '',
            dibujos: [],
            imagenes: []
        };
    }
}

// FUNCIONES DE UTILIDAD ADICIONALES QUE PUEDES USAR:

// Función para obtener solo el texto (compatibilidad con tu función original)
function obtenerSoloTexto() {
    const contenido = obtenerContenidoEditor();
    return contenido.texto || '';
}

// Función para verificar si hay dibujos
function hayDibujos() {
    const contenido = obtenerContenidoEditor();
    return contenido.dibujos.some(d => d.tieneContenido);
}

// Función para obtener solo los dibujos
function obtenerSoloDibujos() {
    const contenido = obtenerContenidoEditor();
    return contenido.dibujos.filter(d => d.tieneContenido);
}

// Función para crear un resumen rápido
function obtenerResumen() {
    const contenido = obtenerContenidoEditor();
    return contenido.resumen;
}

// EJEMPLO DE USO:
/*
// Uso básico (reemplaza tu función actual)
const contenido = obtenerContenidoEditor();
console.log(contenido);

// Uso específico
const soloTexto = obtenerSoloTexto();
const soloResumen = obtenerResumen();
const tieneEsbozos = hayDibujos();

// Para enviar al servidor
const datosParaServidor = {
    texto: contenido.texto,
    dibujos: contenido.dibujos.map(d => ({
        imagen: d.datos.base64,
        dimensiones: d.dimensiones
    })),
    html: contenido.html,
    fecha: contenido.metadatos.timestamp
};
*/

function obtenerFirmaDigital() {
    const canvas = document.getElementById('signatureCanvas');
    if (!canvas) return { tiene_firma: false };
    
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasDrawing = imageData.data.some((channel, index) => index % 4 !== 3 && channel !== 0);
    
    return {
        tiene_firma: hasDrawing,
        requerida: true,
        firma_base64: hasDrawing ? canvas.toDataURL('image/png') : null,
        fecha_firma: hasDrawing ? new Date().toISOString() : null,
        medico_cmp: "12345"
    };
}

function obtenerDatosPaciente() {
    try {
        return window.currentPatientData || 
               JSON.parse(localStorage.getItem('currentPatientData') || 'null');
    } catch (e) {
        console.error('❌ Error al obtener datos del paciente:', e);
        return null;
    }
}

function obtenerSignosVitales() {
    return {
        origen: "manual",
        timestamp: new Date().toISOString(),
        presion_arterial: { sistolica: 140, diastolica: 90 },
        frecuencia_cardiaca: 78,
        temperatura: 36.8,
        saturacion_oxigeno: 98,
        frecuencia_respiratoria: 18
    };
}

// 8. FUNCIONES AUXILIARES
function generarNumeroNota() {
    const ahora = new Date();
    return `NE${ahora.getFullYear()}${(ahora.getMonth() + 1).toString().padStart(2, '0')}${ahora.getDate().toString().padStart(2, '0')}${ahora.getHours().toString().padStart(2, '0')}${ahora.getMinutes().toString().padStart(2, '0')}`;
}

function generarNumeroCuenta() {
    const ahora = new Date();
    const random = Math.floor(Math.random() * 9999) + 1;
    return `CTA${ahora.getFullYear()}${(ahora.getMonth() + 1).toString().padStart(2, '0')}${ahora.getDate().toString().padStart(2, '0')}${random.toString().padStart(4, '0')}`;
}

function calcularTurno(fecha) {
    const hora = fecha.getHours();
    if (hora >= 7 && hora < 13) return "01";
    if (hora >= 13 && hora < 19) return "02";
    return "03";
}

function limpiarFormulario() {
    const editor = document.getElementById('medicalNoteEditor');
    const canvas = document.getElementById('signatureCanvas');
    
    if (editor) {
        editor.value = '';
        editor.innerHTML = '';
        editor.textContent = '';
    }
    
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    console.log('✅ Formulario limpiado correctamente');
}



// =========================================
// SETUP VER NOTAS-AC
// =========================================

function detectarFormatoNotas(respuesta) {
    console.log('🔍 Analizando formato de respuesta:', respuesta);
    console.log('🔍 Tipo de respuesta:', typeof respuesta);
    
    // CASO 1: Tu API devuelve UN OBJETO (una sola nota)
    if (typeof respuesta === 'object' && respuesta !== null) {
        
        // Si la respuesta tiene .data (como tu ejemplo JSON)
        if (respuesta.data) {
            console.log('✅ Detectado: Nota en .data');
            // Si .data es un objeto, lo convertimos a array
            if (typeof respuesta.data === 'object' && !Array.isArray(respuesta.data)) {
                return [respuesta.data]; // Convertir objeto a array
            }
            return Array.isArray(respuesta.data) ? respuesta.data : [respuesta.data];
        }
        
        // Si es directamente una nota (tiene id o numero_nota)
        if (respuesta.id || respuesta.numero_nota) {
            console.log('✅ Detectado: Una sola nota directa');
            return [respuesta]; // Convertir a array
        }
        
        // Otras propiedades comunes
        if (respuesta.notas) {
            console.log('✅ Detectado: Propiedad .notas');
            return Array.isArray(respuesta.notas) ? respuesta.notas : [respuesta.notas];
        }
        
        if (respuesta.items) {
            console.log('✅ Detectado: Propiedad .items');
            return Array.isArray(respuesta.items) ? respuesta.items : [respuesta.items];
        }
        
        if (respuesta.results) {
            console.log('✅ Detectado: Propiedad .results');
            return Array.isArray(respuesta.results) ? respuesta.results : [respuesta.results];
        }
        
        // Si no encontramos nada específico, pero es un objeto que parece una nota
        // Buscar propiedades que indiquen que es una nota
        const propiedadesNota = ['numero_nota', 'titulo_nota', 'contenido_nota', 'fecha_nota', 'creado_en'];
        const tienePropsNota = propiedadesNota.some(prop => respuesta.hasOwnProperty(prop));
        
        if (tienePropsNota) {
            console.log('✅ Detectado: Objeto que parece una nota');
            return [respuesta]; // Convertir a array
        }
    }
    
    // CASO 2: Si es un array directamente
    if (Array.isArray(respuesta)) {
        console.log('✅ Detectado: Array directo');
        return respuesta;
    }
    
    // CASO 3: No se pudo detectar el formato
    console.warn('⚠️ No se pudo detectar el formato de notas');
    return [];
}// =============================================================================================
// SISTEMA VER NOTAS MEJORADO - BASADO EN LA LÓGICA DEL PREVISUALIZADOR
// =============================================================================================

const VER_NOTAS_CONFIG = {
    endpoints: {
        base: 'http://localhost:8090/api',
        listaNotas: '/notas/hospitalizacion',
        notaIndividual: '/notas'
    },
    elementos: {
        editor: 'medicalNoteEditor',
        canvasFirma: 'signatureCanvas',
        statusFirma: 'signatureStatus',
        botonVerNotas: 'vernotas'
    }
};

// =============================================================================================
// 1. 🚀 INICIALIZACIÓN DEL SISTEMA
// =============================================================================================

function setupVerNotas() {
    console.log('👁️ Configurando sistema Ver Notas...');
    
    setTimeout(() => {
        const verNotasBtn = document.getElementById(VER_NOTAS_CONFIG.elementos.botonVerNotas);
        if (verNotasBtn) {
            verNotasBtn.removeEventListener('click', abrirGrillaNotas);
            verNotasBtn.addEventListener('click', abrirGrillaNotas);
            console.log('✅ Sistema Ver Notas configurado');
        } else {
            console.error(`❌ Botón #${VER_NOTAS_CONFIG.elementos.botonVerNotas} no encontrado`);
        }
    }, 200);
}

// =============================================================================================
// 2. 📊 ABRIR GRILLA DE NOTAS
// =============================================================================================

async function abrirGrillaNotas() {
    try {
        mostrarLoading('Cargando notas...');
        const notas = await cargarListaNotas();
        ocultarLoading();
        mostrarGrillaNotas(notas);
    } catch (error) {
        console.error('❌ Error:', error);
        ocultarLoading();
        alert('❌ Error al cargar notas: ' + error.message);
    }
}

// =============================================================================================
// 3. 🌐 CARGAR LISTA DE NOTAS DEL API
// =============================================================================================

async function cargarListaNotas() {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('No hay token de autenticación');
    
    // Obtener hospitalizacion_id del localStorage (como tienes en tu sistema)
    const currentPatientData = JSON.parse(localStorage.getItem('currentPatientData') || '{}');
    const hospitalizacionId = currentPatientData.hospitalizacion_id || 2;
    
    console.log(`📡 Cargando notas para hospitalización: ${hospitalizacionId}`);
    
    const url = `${VER_NOTAS_CONFIG.endpoints.base}${VER_NOTAS_CONFIG.endpoints.listaNotas}/${hospitalizacionId}`;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`Error ${response.status}: ${error.message || 'Error del servidor'}`);
    }
    
    const respuesta = await response.json();
    console.log('📦 Respuesta del API (objeto único):', respuesta);
    
    return detectarFormatoNotas(respuesta);
}

// =============================================================================================
// 4. 🔄 PROCESAR NOTA DEL API (SIGUIENDO TU LÓGICA JSON)
// =============================================================================================

function procesarNotaDelAPI(notaAPI) {
    console.log('🔄 Procesando nota del API...');
    
    try {
        // 1. PROCESAR CONTENIDO (como tu JSON de ejemplo)
        let contenidoParsed = {};
        
        if (notaAPI.contenido_nota) {
            if (typeof notaAPI.contenido_nota === 'string') {
                try {
                    contenidoParsed = JSON.parse(notaAPI.contenido_nota);
                } catch (e) {
                    console.warn('⚠️ Contenido no es JSON válido');
                    contenidoParsed = { 
                        texto: notaAPI.contenido_nota,
                        html: notaAPI.contenido_nota
                    };
                }
            } else {
                contenidoParsed = notaAPI.contenido_nota;
            }
        }
        
        // 2. PROCESAR FIRMA (del campo firma_digital)
        let firmaBase64 = null;
        
        if (notaAPI.firma_digital) {
            try {
                let firmaData = notaAPI.firma_digital;
                
                if (typeof firmaData === 'string') {
                    firmaData = JSON.parse(firmaData);
                }
                
                firmaBase64 = firmaData.firma_base64 || firmaData.base64;
                
                // Asegurar formato data:image
                if (firmaBase64 && !firmaBase64.startsWith('data:image/')) {
                    firmaBase64 = 'data:image/png;base64,' + firmaBase64;
                }
                
            } catch (e) {
                console.warn('⚠️ Error parseando firma');
                if (typeof notaAPI.firma_digital === 'string' && notaAPI.firma_digital.startsWith('data:image/')) {
                    firmaBase64 = notaAPI.firma_digital;
                }
            }
        }
        
        console.log('✅ Nota procesada:', {
            id: notaAPI.id,
            numeroNota: notaAPI.numero_nota,
            tieneTexto: !!contenidoParsed.texto,
            tieneHTML: !!contenidoParsed.html,
            tieneDibujos: !!(contenidoParsed.dibujos?.length),
            tieneImagenes: !!(contenidoParsed.imagenes?.length),
            tieneFirma: !!firmaBase64
        });
        
        return {
            // Metadatos de la nota
            id: notaAPI.id,
            numeroNota: notaAPI.numero_nota,
            tituloNota: notaAPI.titulo_nota,
            fechaCreacion: notaAPI.creado_en || notaAPI.fecha_nota,
            turno: notaAPI.turno,
            
            // Contenido (como tu previsualizador lo captura)
            texto: contenidoParsed.texto || '',
            html: contenidoParsed.html || contenidoParsed.texto || '',
            dibujos: contenidoParsed.dibujos || [],
            imagenes: contenidoParsed.imagenes || [],
            
            // Firma digital
            firmaBase64: firmaBase64,
            
            // Signos vitales si existen
            signosVitales: notaAPI.signos_vitales || null
        };
        
    } catch (error) {
        console.error('❌ Error procesando nota:', error);
        throw new Error('Error al procesar contenido: ' + error.message);
    }
}

// =============================================================================================
// 5. 📋 CARGAR NOTA COMPLETA EN EL EDITOR
// =============================================================================================

async function cargarNotaEnEditor(notaResumen) {
    console.log('📝 Cargando nota completa:', notaResumen.numero_nota);
    
    try {
        // Cerrar grilla
        cerrarGrilla();
        
        // Mostrar loading
        mostrarLoading('Cargando contenido de la nota...');
        
        // Cargar nota completa del API
        const notaCompleta = await cargarNotaCompletaDelAPI(notaResumen.id);
        
        // Reconstruir en el editor (SIGUIENDO TU LÓGICA DEL PREVISUALIZADOR)
        await reconstruirNotaEnEditor(notaCompleta);
        
        // Ocultar loading
        ocultarLoading();
        
        // Notificar éxito
        mostrarNotificacion(`✅ Nota ${notaCompleta.numeroNota} cargada exitosamente`);
        
        // Bloquear editor
        bloquearEditor();
        
    } catch (error) {
        console.error('❌ Error cargando nota:', error);
        ocultarLoading();
        alert('❌ Error: ' + error.message);
    }
}

function bloquearEditor() {
    console.log('🔒 Bloqueando editor completamente...');
    
    // ❌ BLOQUEAR: Editor principal
    const editor = document.getElementById('medicalNoteEditor');
    if (editor) {
        editor.contentEditable = false;
        editor.classList.add('bloqueado');
        console.log('✅ Editor principal bloqueado');
    }
    
    // ❌ BLOQUEAR: Todas las herramientas del editor
    const herramientasEditor = document.querySelector('.editor-tools');
    if (herramientasEditor) {
        herramientasEditor.classList.add('bloqueado');
        
        // Bloquear botones específicos
        const toolButtons = herramientasEditor.querySelectorAll('.tool-btn');
        toolButtons.forEach(btn => {
            btn.classList.add('bloqueado');
            btn.disabled = true;
        });
        
        console.log(`✅ ${toolButtons.length} herramientas bloqueadas`);
    }
    
    // ❌ BLOQUEAR: Botón guardar
    const btnGuardar = document.getElementById('guardarNotaBtn');
    if (btnGuardar) {
        btnGuardar.classList.add('bloqueado');
        btnGuardar.disabled = true;
        console.log('✅ Botón guardar bloqueado');
    }
    
    // ❌ BLOQUEAR: Canvas de firma
    const canvasFirma = document.getElementById('signatureCanvas');
    if (canvasFirma) {
        canvasFirma.classList.add('bloqueado');
        canvasFirma.style.pointerEvents = 'none';
        console.log('✅ Canvas de firma bloqueado');
    }
    
    // ❌ BLOQUEAR: Botón limpiar firma
    const btnLimpiarFirma = document.querySelector('.btn-clear-signature');
    if (btnLimpiarFirma) {
        btnLimpiarFirma.classList.add('bloqueado');
        btnLimpiarFirma.disabled = true;
        console.log('✅ Botón limpiar firma bloqueado');
    }
    
    // ❌ BLOQUEAR: Input de archivos
    const imageInput = document.getElementById('imageInput');
    if (imageInput) {
        imageInput.classList.add('bloqueado');
        imageInput.disabled = true;
        console.log('✅ Input de imágenes bloqueado');
    }
    
    // ❌ BLOQUEAR: Elementos manipulables (tablas, imágenes)
    bloquearElementosManipulables();
    
    // ✅ MANTENER HABILITADO: Nueva Nota
    const btnNuevaNota = document.getElementById('nuevaNotaBtn');
    if (btnNuevaNota) {
        btnNuevaNota.classList.remove('bloqueado');
        btnNuevaNota.disabled = false;
        console.log('✅ Botón Nueva Nota HABILITADO');
    }
    
    // ✅ MANTENER HABILITADO: Ver Notas
    const btnVerNotas = document.getElementById('vernotas');
    if (btnVerNotas) {
        btnVerNotas.classList.remove('bloqueado');
        btnVerNotas.disabled = false;
        console.log('✅ Botón Ver Notas HABILITADO');
    }
    
    // ✅ MANTENER HABILITADO: Previsualizar
    const btnPreview = document.querySelector('.btn-preview-note');
    if (btnPreview) {
        btnPreview.classList.remove('bloqueado');
        btnPreview.disabled = false;
        console.log('✅ Botón Previsualizar HABILITADO');
    }
    
    // ✅ MANTENER HABILITADO: Imprimir
    const btnPrint = document.querySelector('.btn-print-note');
    if (btnPrint) {
        btnPrint.classList.remove('bloqueado');
        btnPrint.disabled = false;
        console.log('✅ Botón Imprimir HABILITADO');
    }
    
    console.log('🔒 ¡Editor bloqueado! Solo consulta/navegación disponible');
}


// =====================================================
// 🎨 FUNCIONES AUXILIARES PARA ELEMENTOS MANIPULABLES
// =====================================================
function bloquearElementosManipulables() {
    // Bloquear imágenes redimensionables
    const imagenesManipulables = document.querySelectorAll('.resizable-image, .movable-element');
    imagenesManipulables.forEach(img => {
        img.classList.add('bloqueado');
        img.style.pointerEvents = 'none';
        
        // Ocultar handles de redimensionado
        const handles = img.querySelectorAll('.resize-handle');
        handles.forEach(handle => handle.style.display = 'none');
    });
    
    // Bloquear contenedores de tabla
    const tablasImagen = document.querySelectorAll('.image-table-container');
    tablasImagen.forEach(tabla => {
        tabla.classList.add('bloqueado');
        tabla.style.pointerEvents = 'none';
    });
    
    // Bloquear herramientas de pintura
    const paintContainers = document.querySelectorAll('.image-paint-container');
    paintContainers.forEach(container => {
        container.classList.add('bloqueado');
        container.style.pointerEvents = 'none';
    });
    
    console.log('🎨 Elementos manipulables bloqueados');
}

function desbloquearElementosManipulables() {
    // Desbloquear imágenes redimensionables
    const imagenesManipulables = document.querySelectorAll('.resizable-image, .movable-element');
    imagenesManipulables.forEach(img => {
        img.classList.remove('bloqueado');
        img.style.pointerEvents = 'auto';
        
        // Mostrar handles de redimensionado
        const handles = img.querySelectorAll('.resize-handle');
        handles.forEach(handle => handle.style.display = 'block');
    });
    
    // Desbloquear contenedores de tabla
    const tablasImagen = document.querySelectorAll('.image-table-container');
    tablasImagen.forEach(tabla => {
        tabla.classList.remove('bloqueado');
        tabla.style.pointerEvents = 'auto';
    });
    
    // Desbloquear herramientas de pintura
    const paintContainers = document.querySelectorAll('.image-paint-container');
    paintContainers.forEach(container => {
        container.classList.remove('bloqueado');
        container.style.pointerEvents = 'auto';
    });
    
    console.log('🎨 Elementos manipulables desbloqueados');
}


// =============================================================================================
// 6. 🌐 CARGAR NOTA COMPLETA DEL API
// =============================================================================================

async function cargarNotaCompletaDelAPI(notaId) {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('No hay token de autenticación');
    
    const url = `${VER_NOTAS_CONFIG.endpoints.base}${VER_NOTAS_CONFIG.endpoints.notaIndividual}/${notaId}`;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`Error ${response.status}: ${error.message || 'Error del servidor'}`);
    }
    
    const notaAPI = await response.json();
    
    // Si la respuesta tiene estructura .data (como tu ejemplo)
    const datosNota = notaAPI.data || notaAPI;
    
    return procesarNotaDelAPI(datosNota);
}

// =============================================================================================
// 7. 🎨 RECONSTRUIR NOTA EN EDITOR (BASADO EN TU PREVISUALIZADOR)
// =============================================================================================

async function reconstruirNotaEnEditor(nota) {
    console.log('🎨 Reconstruyendo nota en editor...');
    
    // 1. LIMPIAR TODO PRIMERO
    limpiarEditorCompleto();
    
    // 2. VERIFICAR QUE EL EDITOR EXISTE
    const editor = document.getElementById(VER_NOTAS_CONFIG.elementos.editor);
    if (!editor) {
        throw new Error('Editor no encontrado');
    }
    
    // 3. RECONSTRUIR CONTENIDO HTML (como tu previsualizador)
    if (nota.html && nota.html.trim()) {
        editor.innerHTML = nota.html;
        console.log('✅ Contenido HTML restaurado');
    } else if (nota.texto && nota.texto.trim()) {
        editor.innerHTML = nota.texto.replace(/\n/g, '<br>');
        console.log('✅ Contenido de texto restaurado');
    } else {
        editor.innerHTML = '<p><em>Esta nota no tiene contenido</em></p>';
    }
    
    // 4. RESTAURAR ELEMENTOS MULTIMEDIA (después de un delay para que el DOM se actualice)
    setTimeout(async () => {
        try {
            // Restaurar dibujos/canvas
            if (nota.dibujos && nota.dibujos.length > 0) {
                await restaurarDibujosEnCanvas(nota.dibujos);
            }
            
            // Restaurar imágenes
            if (nota.imagenes && nota.imagenes.length > 0) {
                await restaurarImagenesEnEditor(nota.imagenes);
            }
            
            // Restaurar firma digital
            if (nota.firmaBase64) {
                await restaurarFirmaDigital(nota.firmaBase64);
            }
            
            console.log('✅ Nota completamente reconstruida');
            
        } catch (error) {
            console.error('❌ Error en reconstrucción multimedia:', error);
        }
    }, 300);
}

// =============================================================================================
// 8. 🖼️ RESTAURAR DIBUJOS EN CANVAS
// =============================================================================================

async function restaurarDibujosEnCanvas(dibujos) {
    console.log(`🖼️ Restaurando ${dibujos.length} dibujos...`);
    
    // Filtrar dibujos para excluir cualquier cosa relacionada con firmas
    const dibujosFiltrados = dibujos.filter(dibujo => {
        if (dibujo.id && (dibujo.id.toLowerCase().includes('signature') || 
                          dibujo.id.toLowerCase().includes('firma'))) {
            console.log(`⚠️ Saltando dibujo de firma con ID: ${dibujo.id}`);
            return false;
        }
        if (dibujo.esFirma || dibujo.tipo === 'firma') {
            console.log(`⚠️ Saltando dibujo marcado como firma`);
            return false;
        }
        return true;
    });
    
    console.log(`🖼️ Procesando ${dibujosFiltrados.length} dibujos (excluyendo firmas)...`);
    
    for (const dibujo of dibujosFiltrados) {
        try {
            let canvas = null;
            
            // 1. Buscar canvas existente por ID
            if (dibujo.id && dibujo.id !== 'signatureCanvas') {
                canvas = document.getElementById(dibujo.id);
            }
            
            // 2. Si no existe, buscar en canvas del editor (sin firma)
            if (!canvas) {
                console.log(`🔍 Buscando canvas existente para índice ${dibujo.indice}`);
                
                const canvasElements = document.querySelectorAll(`#${VER_NOTAS_CONFIG.elementos.editor} canvas`);
                console.log(`📊 Total canvas en editor: ${canvasElements.length}`);
                
                const canvasSinFirma = Array.from(canvasElements).filter(c => {
                    const esFirma = c.id === VER_NOTAS_CONFIG.elementos.canvasFirma || 
                                   c.id === 'signatureCanvas' || 
                                   c.id.toLowerCase().includes('firma') || 
                                   c.id.toLowerCase().includes('signature');
                    
                    console.log(`🎨 Canvas ${c.id || 'sin-id'}: ${esFirma ? 'ES FIRMA' : 'NO ES FIRMA'}`);
                    return !esFirma;
                });
                
                console.log(`🎯 Canvas sin firma encontrados: ${canvasSinFirma.length}`);
                canvas = canvasSinFirma[dibujo.indice] || canvasSinFirma[0];
                
                if (canvas) {
                    console.log(`✅ Canvas encontrado: ${canvas.id || 'sin-id'}`);
                } else {
                    console.log(`❌ No se encontró canvas existente`);
                }
            }
            
            // 3. ✅ CREAR CANVAS SI NO EXISTE
            if (!canvas) {
                console.log(`🏗️ Creando canvas dinámicamente para dibujo ${dibujo.id || dibujo.indice}`);
                
                canvas = document.createElement('canvas');
                canvas.id = dibujo.id || `canvas_dinamico_${dibujo.indice}`;
                canvas.width = 400;
                canvas.height = 300;
                canvas.style.cssText = `
                    border: 1px solid #ddd;
                    display: block;
                    max-width: 100%;
                    background: white;
                `;
                
                // 🎯 BUSCAR DÓNDE INSERTAR EL CANVAS (en tabla si existe)
                let contenedor = null;
                
                // Buscar contenedor de tabla de imagen
                const tablasImagen = document.querySelectorAll('.image-table-container');
                if (tablasImagen.length > dibujo.indice && tablasImagen[dibujo.indice]) {
                    contenedor = tablasImagen[dibujo.indice];
                    console.log(`📋 Insertando canvas en tabla de imagen ${dibujo.indice}`);
                }
                
                // Si no hay tabla, buscar contenedor de pintura
                if (!contenedor) {
                    const contenedoresPintura = document.querySelectorAll('.image-paint-container');
                    if (contenedoresPintura.length > dibujo.indice && contenedoresPintura[dibujo.indice]) {
                        contenedor = contenedoresPintura[dibujo.indice];
                        console.log(`🎨 Insertando canvas en contenedor de pintura ${dibujo.indice}`);
                    }
                }
                
                // Si no hay contenedor específico, crear uno dentro del editor
                if (!contenedor) {
                    const editor = document.getElementById(VER_NOTAS_CONFIG.elementos.editor);
                    if (editor) {
                        // Crear contenedor wrapper
                        contenedor = document.createElement('div');
                        contenedor.className = 'image-paint-container';
                        contenedor.style.cssText = `
                            border: 1px solid #ddd;
                            margin: 10px 0;
                            padding: 10px;
                            background: #f9f9f9;
                        `;
                        editor.appendChild(contenedor);
                        console.log(`📦 Contenedor creado en editor`);
                    }
                }
                
                if (contenedor) {
                    contenedor.appendChild(canvas);
                    console.log(`✨ Canvas creado e insertado en contenedor: ${canvas.id}`);
                } else {
                    console.error(`❌ No se encontró contenedor para insertar canvas`);
                    continue;
                }
            }
            
            if (canvas) {
                let imagenBase64 = null;
                
                // Intentar extraer la imagen base64 de diferentes formatos posibles
                if (dibujo.datos?.imageData) {
                    imagenBase64 = dibujo.datos.imageData;
                    console.log(`📊 Usando formato imageData para dibujo ${dibujo.id || dibujo.indice}`);
                }
                else if (dibujo.imageData) {
                    imagenBase64 = dibujo.imageData;
                    console.log(`📊 Usando imageData directo para dibujo ${dibujo.id || dibujo.indice}`);
                }
                else if (dibujo.base64 || dibujo.imagen) {
                    imagenBase64 = dibujo.base64 || dibujo.imagen;
                    console.log(`📊 Usando base64/imagen para dibujo ${dibujo.id || dibujo.indice}`);
                }
                else if (typeof dibujo === 'string' && dibujo.startsWith('data:')) {
                    imagenBase64 = dibujo;
                    console.log(`📊 El dibujo es directamente una cadena base64`);
                }
                // Intentar buscar en cualquier propiedad que pueda contener la imagen
                else {
                    // Buscar recursivamente en el objeto dibujo cualquier propiedad que parezca una imagen base64
                    const buscarBase64 = (obj) => {
                        if (!obj || typeof obj !== 'object') return null;
                        
                        for (const key in obj) {
                            const valor = obj[key];
                            if (typeof valor === 'string' && valor.startsWith('data:image')) {
                                return valor;
                            } else if (typeof valor === 'object' && valor !== null) {
                                const resultado = buscarBase64(valor);
                                if (resultado) return resultado;
                            }
                        }
                        return null;
                    };
                    
                    imagenBase64 = buscarBase64(dibujo);
                    if (imagenBase64) {
                        console.log(`📊 Encontrada imagen base64 en estructura anidada para dibujo ${dibujo.id || dibujo.indice}`);
                    }
                }
                
                if (imagenBase64) {
                    // Asegurarse de que la imagen base64 tenga el formato correcto
                    if (!imagenBase64.startsWith('data:image')) {
                        console.warn(`⚠️ Formato de imagen incorrecto, intentando corregir...`);
                        // Intentar detectar y corregir el formato
                        if (imagenBase64.includes(',')) {
                            // Podría ser que solo falte el prefijo
                            const partes = imagenBase64.split(',');
                            if (partes.length === 2 && !partes[0].includes(':')) {
                                imagenBase64 = `data:image/png;base64,${partes[1]}`;
                                console.log(`✅ Formato corregido a PNG estándar`);
                            }
                        } else {
                            // Asumir que es directamente el contenido base64 sin prefijo
                            imagenBase64 = `data:image/png;base64,${imagenBase64}`;
                            console.log(`✅ Añadido prefijo de formato PNG`);
                        }
                    }
                    
                    try {
                        await cargarImagenEnCanvas(canvas, imagenBase64);
                        console.log(`✅ Dibujo ${dibujo.id || dibujo.indice} restaurado correctamente`);
                    } catch (error) {
                        console.error(`❌ Error cargando imagen en canvas:`, error);
                        // Intentar con otro formato si falla
                        try {
                            const formatoAlternativo = imagenBase64.replace(/^data:image\/[^;]+/, 'data:image/png');
                            console.log(`🔄 Intentando con formato alternativo...`);
                            await cargarImagenEnCanvas(canvas, formatoAlternativo);
                            console.log(`✅ Dibujo restaurado con formato alternativo`);
                        } catch (err) {
                            console.error(`❌ También falló el formato alternativo:`, err);
                        }
                    }
                } else {
                    console.warn(`⚠️ No se encontraron datos de imagen para el dibujo ${dibujo.id || dibujo.indice}`);
                    console.log('Estructura del dibujo:', JSON.stringify(dibujo));
                }
            } else {
                console.warn(`⚠️ No se pudo crear o encontrar canvas para el dibujo ${dibujo.id || dibujo.indice}`);
            }
        } catch (error) {
            console.error(`❌ Error restaurando dibujo:`, error);
        }
    }
}

// =============================================================================================
// 9. 🖼️ RESTAURAR IMÁGENES EN EDITOR
// =============================================================================================

async function restaurarImagenesEnEditor(imagenes) {
    console.log(`🖼️ Restaurando ${imagenes.length} imágenes...`);
    
    for (const imagen of imagenes) {
        try {
            // Buscar imagen por ID o índice
            let imgElement = null;
            
            if (imagen.id) {
                imgElement = document.getElementById(imagen.id);
            }
            
            if (!imgElement) {
                const imgElements = document.querySelectorAll(`#${VER_NOTAS_CONFIG.elementos.editor} img`);
                imgElement = imgElements[imagen.indice];
            }
            
            if (imgElement && imagen.src) {
                imgElement.src = imagen.src;
                imgElement.style.maxWidth = '100%';
                imgElement.style.height = 'auto';
                console.log(`✅ Imagen ${imagen.id || imagen.indice} restaurada`);
            }
            
        } catch (error) {
            console.warn(`⚠️ Error restaurando imagen:`, error);
        }
    }
}

// =============================================================================================
// 10. ✍️ RESTAURAR FIRMA DIGITAL
// =============================================================================================

async function restaurarFirmaDigital(firmaBase64) {
    console.log('✍️ Restaurando firma digital...');
    
    try {
        // Buscar canvas de firma
        const firmaCanvas = document.getElementById(VER_NOTAS_CONFIG.elementos.canvasFirma);
        if (!firmaCanvas) {
            console.warn('⚠️ Canvas de firma no encontrado');
            return;
        }
        
        // Cargar firma en el canvas
        await cargarImagenEnCanvas(firmaCanvas, firmaBase64);
        
        // Actualizar estado visual de la firma
        const statusElement = document.getElementById(VER_NOTAS_CONFIG.elementos.statusFirma);
        if (statusElement) {
            statusElement.innerHTML = '<span style="color: #27ae60;">✅ Firmado digitalmente</span>';
        }
        
        // Marcar como firmado en el API de firma (si existe)
        if (window.signatureAPI && typeof window.signatureAPI.markAsSigned === 'function') {
            window.signatureAPI.markAsSigned();
        }
        
        console.log('✅ Firma digital restaurada');
        
    } catch (error) {
        console.error('❌ Error restaurando firma:', error);
    }
}

// =============================================================================================
// 11. 🛠️ CARGAR IMAGEN EN CANVAS (HELPER)
// =============================================================================================

function cargarImagenEnCanvas(canvas, imagenBase64) {
    return new Promise((resolve, reject) => {
        if (!canvas || !imagenBase64) {
            reject(new Error('Canvas o imagen no válidos'));
            return;
        }
        
        const img = new Image();
        
        img.onload = function() {
            try {
                const ctx = canvas.getContext('2d');
                
                // Limpiar canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Dibujar imagen
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                resolve();
                
            } catch (error) {
                reject(error);
            }
        };
        
        img.onerror = () => reject(new Error('Error cargando imagen'));
        
        // Timeout de seguridad
        setTimeout(() => {
            if (!img.complete) {
                reject(new Error('Timeout cargando imagen'));
            }
        }, 5000);
        
        img.src = imagenBase64;
    });
}

// =============================================================================================
// 12. 🧹 LIMPIAR EDITOR COMPLETO
// =============================================================================================

function limpiarEditorCompleto() {
    console.log('🧹 Limpiando editor completo...');
    
    // Limpiar editor principal
    const editor = document.getElementById(VER_NOTAS_CONFIG.elementos.editor);
    if (editor) {
        editor.innerHTML = '';
    }
    
    // Limpiar todos los canvas de dibujo (excepto el de firma)
    const canvasElements = document.querySelectorAll(`canvas:not(#${VER_NOTAS_CONFIG.elementos.canvasFirma})`);
    canvasElements.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
    
    // Limpiar canvas de firma
    const firmaCanvas = document.getElementById(VER_NOTAS_CONFIG.elementos.canvasFirma);
    if (firmaCanvas) {
        const ctx = firmaCanvas.getContext('2d');
        ctx.clearRect(0, 0, firmaCanvas.width, firmaCanvas.height);
        
        // Actualizar estado de firma
        const statusElement = document.getElementById(VER_NOTAS_CONFIG.elementos.statusFirma);
        if (statusElement) {
            statusElement.innerHTML = '<span style="color: #e74c3c;">📝 Pendiente de firma</span>';
        }
        
        // Marcar como no firmado en el API
        if (window.signatureAPI && typeof window.signatureAPI.markAsUnsigned === 'function') {
            window.signatureAPI.markAsUnsigned();
        }
    }
    
    console.log('✅ Editor limpiado completamente');
}

// =============================================================================================
// 13. 🎨 MOSTRAR GRILLA DE NOTAS
// =============================================================================================

function mostrarGrillaNotas(notas) {
    console.log(`🎨 Mostrando grilla perfecta con ${notas.length} notas`);
    
    // Cerrar grilla existente si la hay
    cerrarGrilla();
    
    // Crear overlay perfecto
    const overlay = document.createElement('div');
    overlay.className = 'ver-notas-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(12px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
        padding: 20px;
    `;
    
    // Modal con bordes redondeados
    const modal = document.createElement('div');
    modal.className = 'modal-perfecto';
    modal.style.cssText = `
        background: white;
        border-radius: 20px;
        width: 95%;
        max-width: 1100px;
        max-height: 85vh;
        overflow: hidden;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        display: flex;
        flex-direction: column;
        animation: slideUp 0.3s ease;
    `;
    
    // Header
    const header = document.createElement('div');
    header.className = 'header-perfecto';
    header.style.cssText = `
        background: linear-gradient(135deg, #74b9ff 0%, #0984e3 25%, #00b894 75%, #00cec9 100%);
        color: white;
        padding: 20px 30px 30px 30px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
        margin-bottom: 10px;
    `;
    
    header.innerHTML = `
        <div style="position: relative; z-index: 2;">
            <h3 style="
                margin-bottom: 20px;
                font-size: 24px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 10px;
            ">
                📋 Historial de Notas Médicas
            </h3>
            <span style="
                font-size: 14px;
                opacity: 0.9;
                font-weight: 400;
                margin-top: 4px;
                display: block;
            ">Total: ${notas.length} registros encontrados</span>
        </div>
        <button onclick="cerrarGrilla()" style="
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 6px;
            position: relative;
            z-index: 2;
        " 
        onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'; this.style.transform='translateY(-1px)';"
        onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'; this.style.transform='translateY(0)';">
            ✕ Cerrar
        </button>
    `;
    
    // Contenido
    const contenido = document.createElement('div');
    contenido.className = 'contenido-perfecto';
    contenido.style.cssText = `
        overflow-y: auto;
        flex: 1;
        background: #f8fafc;
        padding: 0;
    `;
    
    if (notas.length === 0) {
        contenido.innerHTML = `
            <div style="
                padding: 80px 40px;
                text-align: center;
                color: #64748b;
                background: white;
                margin: 0 20px 20px 20px;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            ">
                <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.5; color: #cbd5e1;">📄</div>
                <h4 style="color: #1e293b; font-size: 20px; margin: 0 0 10px 0; font-weight: 600;">No hay notas disponibles</h4>
                <p style="font-size: 16px; margin: 0; opacity: 0.8;">No se encontraron registros de notas médicas.</p>
            </div>
        `;
    } else {
        // Wrapper para la tabla
        const tablaWrapper = document.createElement('div');
        tablaWrapper.style.cssText = `
            margin: 0 20px 20px 20px;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        `;
        
        const tabla = document.createElement('table');
        tabla.className = 'tabla-perfecta';
        tabla.style.cssText = `
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            font-size: 12px;
            background: white;
            margin: 0;
        `;
        
        // Crear filas dinámicamente
        let filas = '';
        for (let index = 0; index < notas.length; index++) {
            const nota = notas[index];
            const notaProcesada = procesarNotaDelAPI(nota);
            const fechaObj = new Date(notaProcesada.fechaCreacion);
            const fecha = fechaObj.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit'
            });
            const hora = fechaObj.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const medicos = ['Alan Cairampoma', 'Patricia González', 'Roberto Mendoza', 'Carmen Rodríguez', 'Luis Fernández'];
            const especialidades = ['Medicina Interna', 'Cardiología', 'Neurología', 'Oncología', 'Gastroenterología'];
            const estados = ['finalizada', 'borrador', 'finalizada', 'finalizada', 'borrador'];
            const iniciales = ['A', 'P', 'R', 'C', 'L'];
            
            const medico = medicos[index % medicos.length];
            const especialidad = especialidades[index % especialidades.length];
            const estado = estados[index % estados.length];
            const inicial = iniciales[index % iniciales.length];
            
            filas += `
                <tr onclick="cargarNotaEnEditor({id: ${notaProcesada.id}, numero_nota: 'NT-${String(index + 1).padStart(3, '0')}'})" style="
                    border-bottom: 1px solid #f1f5f9;
                    transition: all 0.2s ease;
                    cursor: pointer;
                    background: white;
                "
                onmouseover="
                    this.style.background='#f8fafc';
                    this.style.transform='translateY(-1px)';
                    this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.05)';
                "
                onmouseout="
                    this.style.background='white';
                    this.style.transform='translateY(0)';
                    this.style.boxShadow='none';
                ">
                    <td style="padding: 12px 15px; vertical-align: middle;">
                        <span style="color: #1e293b; font-size: 14px; font-weight: 600; font-family: monospace;">
                            NT-${String(index + 1).padStart(3, '0')}
                        </span>
                    </td>
                    <td style="padding: 12px 15px; vertical-align: middle;">
                        <span style="font-size: 14px; color: #64748b; font-weight: 500;">${fecha}</span>
                    </td>
                    <td style="padding: 12px 15px; vertical-align: middle;">
                        <span style="font-size: 14px; color: #64748b; font-weight: 500; font-family: monospace;">${hora}</span>
                    </td>
                    <td style="padding: 12px 15px; vertical-align: middle;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="
                                width: 24px; height: 24px; background: #00b894; border-radius: 50%;
                                display: flex; align-items: center; justify-content: center;
                                color: white; font-weight: 700; font-size: 12px; flex-shrink: 0;
                            ">${inicial}</div>
                            <span style="font-size: 14px; font-weight: 500; color: #1e293b; line-height: 1.2;">${medico}</span>
                        </div>
                    </td>
                    <td style="padding: 12px 15px; vertical-align: middle;">
                        <span style="
                            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
                            color: #065f46; padding: 6px 12px; border-radius: 16px;
                            font-size: 12px; font-weight: 600; display: inline-block;
                        ">${especialidad}</span>
                    </td>
                    <td style="padding: 12px 15px; vertical-align: middle;">
                        <span style="
                            background: ${estado === 'finalizada' ? '#dcfce7' : '#fef3c7'};
                            color: ${estado === 'finalizada' ? '#15803d' : '#92400e'};
                            padding: 6px 12px; border-radius: 16px; font-size: 11px;
                            font-weight: 700; text-transform: uppercase; display: inline-block;
                        ">
                            ${estado === 'finalizada' ? 'FIRMADA' : 'BORRADOR'}
                        </span>
                    </td>
                    <td style="padding: 12px 15px; text-align: center; vertical-align: middle;">
                        <button style="
                            background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
                            color: white !important;
                            border: none !important;
                            padding: 6px 12px !important;
                            border-radius: 8px !important;
                            cursor: pointer !important;
                            font-size: 9px !important;
                            font-weight: 600 !important;
                            transition: all 0.2s ease !important;
                            display: inline-flex !important;
                            align-items: center !important;
                            gap: 8px !important;
                            margin: 10px !important;
                        "
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(16, 185, 129, 0.3)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                            ✅ Cargar
                        </button>
                    </td>
                </tr>
            `;
        }
        
        // Insertar HTML completo de la tabla
        tabla.innerHTML = `
            <thead>
                <tr style="background: #e2e8f0;">
                    <th style="padding: 16px 20px; text-align: left; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; border-bottom: none; width: 120px;"># NÚMERO</th>
                    <th style="padding: 16px 20px; text-align: left; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; border-bottom: none; width: 100px;">📅 FECHA</th>
                    <th style="padding: 16px 20px; text-align: left; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; border-bottom: none; width: 100px;">🕐 HORA</th>
                    <th style="padding: 16px 20px; text-align: left; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; border-bottom: none; width: 200px;">👩‍⚕️ MÉDICO</th>
                    <th style="padding: 16px 20px; text-align: left; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; border-bottom: none; width: 180px;">🩺 ESPECIALIDAD</th>
                    <th style="padding: 16px 20px; text-align: left; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; border-bottom: none; width: 120px;">✅ ESTADO</th>
                    <th style="padding: 16px 20px; text-align: center; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; border-bottom: none; width: 120px;">▶️ ACCIÓN</th>
                </tr>
            </thead>
            <tbody>
                ${filas}
            </tbody>
        `;
        
        tablaWrapper.appendChild(tabla);
        contenido.appendChild(tablaWrapper);
    }
    
    // Ensamblar modal
    modal.appendChild(header);
    modal.appendChild(contenido);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Eventos de cierre
    configurarEventosCierre(overlay);
}

// Función auxiliar para eventos de cierre
function configurarEventosCierre(overlay) {
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            cerrarGrilla();
        }
    });
    
    const cerrarConEsc = function(e) {
        if (e.key === 'Escape') {
            cerrarGrilla();
            document.removeEventListener('keydown', cerrarConEsc);
        }
    };
    document.addEventListener('keydown', cerrarConEsc);
}

// Función de cerrar optimizada
function cerrarGrilla() {
    const overlay = document.querySelector('.ver-notas-overlay');
    if (overlay) {
        overlay.style.animation = 'fadeOut 0.3s ease';
        setTimeout(function() {
            if (overlay.parentNode) {
                overlay.remove();
            }
        }, 300);
    }
}

// CSS para animaciones
if (!document.getElementById('grilla-perfecta-styles')) {
    const style = document.createElement('style');
    style.id = 'grilla-perfecta-styles';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        .contenido-perfecto::-webkit-scrollbar {
            width: 6px;
        }
        .contenido-perfecto::-webkit-scrollbar-track {
            background: #f1f5f9;
        }
        .contenido-perfecto::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
            border-radius: 3px;
        }
        @media (max-width: 768px) {
            .modal-perfecto {
                width: 98%;
                max-height: 90vh;
            }
        }
    `;
    document.head.appendChild(style);
}
// =============================================================================================
// 14. 🔧 FUNCIONES DE UTILIDAD
// =============================================================================================

function detectarFormatoNotas(respuesta) {
    // Detectar diferentes formatos de respuesta del API
    if (respuesta.data) return Array.isArray(respuesta.data) ? respuesta.data : [respuesta.data];
    if (respuesta.notas) return Array.isArray(respuesta.notas) ? respuesta.notas : [respuesta.notas];
    if (respuesta.items) return Array.isArray(respuesta.items) ? respuesta.items : [respuesta.items];
    if (respuesta.results) return Array.isArray(respuesta.results) ? respuesta.results : [respuesta.results];
    
    // Buscar arrays en las propiedades
    for (const [key, value] of Object.entries(respuesta)) {
        if (Array.isArray(value)) return value;
        if (typeof value === 'object' && value?.id) return [value];
    }
    
    // Si es una sola nota
    if (respuesta.id || respuesta.numero_nota) return [respuesta];
    
    return [];
}

function mostrarLoading(mensaje) {
    ocultarLoading(); // Remover loading existente
    
    const loading = document.createElement('div');
    loading.id = 'ver-notas-loading';
    loading.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); z-index: 10001;
        display: flex; align-items: center; justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    loading.innerHTML = `
        <div style="
            background: white; padding: 30px; border-radius: 12px; 
            text-align: center; min-width: 300px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        ">
            <div style="font-size: 48px; margin-bottom: 15px; animation: bounce 1s infinite;">📋</div>
            <h3 style="margin: 0 0 10px 0; color: #2c3e50;">${mensaje}</h3>
            <div style="
                width: 40px; height: 40px; border: 4px solid #f3f3f3; 
                border-top: 4px solid #3498db; border-radius: 50%; 
                animation: spin 1s linear infinite; margin: 0 auto;
            "></div>
        </div>
        <style>
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes bounce { 
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 
                40% { transform: translateY(-10px); } 60% { transform: translateY(-5px); } 
            }
        </style>
    `;
    
    document.body.appendChild(loading);
}

function ocultarLoading() {
    const loading = document.getElementById('ver-notas-loading');
    if (loading && loading.parentNode) {
        loading.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            if (loading.parentNode) {
                document.body.removeChild(loading);
            }
        }, 300);
    }
}

function cerrarGrilla() {
    const overlay = document.querySelector('.ver-notas-overlay');
    if (overlay && overlay.parentNode) {
        overlay.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            if (overlay.parentNode) {
                document.body.removeChild(overlay);
            }
        }, 300);
    }
}

function mostrarNotificacion(mensaje, tipo = 'success') {
    // Remover notificaciones existentes
    const existentes = document.querySelectorAll('.ver-notas-notification');
    existentes.forEach(notif => {
        if (notif.parentNode) notif.parentNode.removeChild(notif);
    });
    
    const colores = {
        success: 'linear-gradient(135deg, #27ae60, #2ecc71)',
        error: 'linear-gradient(135deg, #e74c3c, #c0392b)',
        warning: 'linear-gradient(135deg, #f39c12, #e67e22)',
        info: 'linear-gradient(135deg, #3498db, #2980b9)'
    };
    
    const notif = document.createElement('div');
    notif.className = 'ver-notas-notification';
    notif.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10002;
        background: ${colores[tipo] || colores.success};
        color: white; padding: 15px 25px; border-radius: 8px;
        font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease; max-width: 400px; word-wrap: break-word;
    `;
    notif.textContent = mensaje;
    
    // Añadir estilos de animación si no existen
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
            @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notif);
    
    // Auto-remover después de 3 segundos
    setTimeout(() => {
        if (notif.parentNode) {
            notif.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notif.parentNode) {
                    document.body.removeChild(notif);
                }
            }, 300);
        }
    }, 3000);
    
    // Permitir click para cerrar
    notif.onclick = () => {
        if (notif.parentNode) {
            notif.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notif.parentNode) {
                    document.body.removeChild(notif);
                }
            }, 300);
        }
    };
}


console.log('📋 Sistema Ver Notas MEJORADO cargado - Compatible con tu previsualizador v4.0');



// =====================================================
// 🎯 FUNCIÓN PRINCIPAL SETUP
// =====================================================

// =====================================================
// 🔓 FUNCIÓN DESBLOQUEAR EDITOR - COMPLETA Y ROBUSTA
// =====================================================

function setupNuevoEditor() {
    const btn = document.getElementById('nuevaNotaBtn');
    if (btn) {
        btn.addEventListener('click', function() {
            // JODER TODO - RECARGAR PÁGINA LIMPIA
            window.location.reload();
        });
        console.log('✅ Botón configurado - RECARGA LA PÁGINA');
    }
}




/**
 * Configura y carga los datos de la firma médica
 */
function setupCargarDatosFirma() {
    try {
        console.log('📋 Configurando datos de firma médica...');
        
        // 🔍 OBTENER datos del localStorage
        const userCompletoString = localStorage.getItem('userCompleto');
        
        if (!userCompletoString) {
            console.warn('⚠️ No hay datos de usuario en localStorage');
            return;
        }
        
        const userCompleto = JSON.parse(userCompletoString);
        console.log('👤 Usuario completo cargado:', userCompleto);
        
        // 🏥 EXTRAER datos profesionales
        const datosProfesional = userCompleto.datosProfesional_parsed || {};
        
        // 📝 CONSTRUIR nombre completo del médico
        const nombreCompleto = `Dr. ${userCompleto.firstName} ${userCompleto.lastName}`;
        
        // 🕒 OBTENER fecha y hora actual
        const ahora = new Date();
        const fecha = ahora.toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric'
        });
        const hora = ahora.toLocaleTimeString('es-PE', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // 🎯 LLENAR los campos de la firma
        llenarDatosFirma({
            medico: nombreCompleto,
            cmp: datosProfesional.cmp || 'No especificado',
            especialidad: datosProfesional.especialidad_principal || 'Medicina General',
            fecha: fecha,
            hora: hora
        });
        
        console.log('✅ Datos de firma configurados correctamente');
        
    } catch (error) {
        console.error('❌ Error configurando datos de firma:', error);
    }
}

/**
 * Llena los campos específicos de la firma médica
 */
function llenarDatosFirma(datos) {
    try {
        // 🔍 BUSCAR elementos en el DOM
        const signatureInfo = document.querySelector('.signature-info');
        
        if (!signatureInfo) {
            console.warn('⚠️ No se encontró el contenedor .signature-info');
            return;
        }
        
        // 📝 ACTUALIZAR contenido HTML
        signatureInfo.innerHTML = `
            <div class="doctor-info">
                <p><strong>MÉDICO:</strong> ${datos.medico}</p>
                <p><strong>CMP:</strong> ${datos.cmp}</p>
                <p><strong>ESPECIALIDAD:</strong> ${datos.especialidad}</p>
            </div>
            <div class="signature-datetime">
                <p><strong>FECHA:</strong> ${datos.fecha}</p>
                <p><strong>HORA:</strong> ${datos.hora}</p>
            </div>
        `;
        
        console.log('📋 Firma actualizada con:', datos);
        
    } catch (error) {
        console.error('❌ Error llenando datos de firma:', error);
    }
}




// ===== AUTO-EJECUTAR CUANDO CARGUE LA PÁGINA =====
document.addEventListener('DOMContentLoaded', inicializarNotasMedicas);

console.log('✅ notamedica.js cargado correctamente');