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
    actualizarCamposPaciente(nombre, cama, id);
    configurarEditor();
    actualizarFechaHora();
    setupAlineacion();
    setupTextFormatting()
    setupImageUpload();
    setupImageTable();
    setupEditorActions();
    setupVoiceDictation()
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

// ===== AUTO-EJECUTAR CUANDO CARGUE LA PÁGINA =====
document.addEventListener('DOMContentLoaded', inicializarNotasMedicas);

console.log('✅ notamedica.js cargado correctamente');