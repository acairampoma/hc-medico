/**
 * SISTEMA DE NOTAS MÉDICAS CON FIRMA DIGITAL INTEGRADA
 * Archivo: notamedica.js
 * Autor: Alan Cairampoma - Hospital System
 * Funcionalidades: Editor, Dictado, Firma Digital, Alineación
 */

// ===== VARIABLES GLOBALES =====
let speechRecognition = null;
let isRecording = false;
let currentPatientData = null;

// ===== FUNCIÓN PRINCIPAL CON FIRMA DIGITAL =====
async function openMedicalNoteWithSignature(bedNumber, patientId) {
    try {
        console.log(`🔍 Abriendo nota médica con firma para cama ${bedNumber}`);
        
        // Obtener datos reales del paciente
        const patientData = await fetchPatientRealData(bedNumber, patientId);
        
        if (!patientData) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron obtener los datos del paciente'
            });
            return;
        }

        // Guardar datos del paciente actual
        currentPatientData = patientData;

        // Crear editor con sistema de firma
        const editorHTML = createMedicalNoteWithSignatureSystem(patientData);
        
        Swal.fire({
            title: '📝 Nota de Evolución Médica',
            html: editorHTML,
            width: '95%',
            customClass: {
                container: 'medical-editor-container',
                popup: 'medical-editor-popup'
            },
            showCancelButton: true,
            showConfirmButton: true,
            showDenyButton: true,
            confirmButtonText: '✍️ Firmar y Guardar',
            denyButtonText: '📄 Generar PDF',
            cancelButtonText: '❌ Cancelar',
            confirmButtonColor: '#2c5aa0',
            denyButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                initializeEditorWithSignature(patientData);
                loadCustomStyles();
            },
            preConfirm: () => {
                return signAndSaveMedicalNote(patientData);
            },
            preDeny: () => {
                return generateSignedMedicalNotePDF(patientData);
            }
        });

    } catch (error) {
        console.error('❌ Error abriendo nota médica:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error del sistema',
            text: 'No se pudo cargar la nota médica'
        });
    }
}

// ===== CREAR EDITOR CON SISTEMA DE FIRMA MEJORADO =====
function createMedicalNoteWithSignatureSystem(patientData) {
    return `
        <div class="medical-note-with-signature">
            <!-- HEADER OFICIAL DEL HOSPITAL -->
            <div class="official-header">
                <div class="hospital-logo">
                    <img src="/static/images/hospital-logo.png" alt="Logo" style="height: 60px;" onerror="this.style.display='none'">
                    <div class="hospital-text">
                        <h2>${patientData.hospital_name || 'Hospital Central'}</h2>
                        <p>${patientData.hospital_address || 'Av. Hospitales 123'}</p>
                        <p>Teléf. 01-2016500</p>
                    </div>
                </div>
                <div class="document-number">
                    <div class="note-type">NOTA DE EVOLUCIÓN MÉDICA</div>
                    <div class="note-id">N° ${patientData.note_number || generateNoteNumber()}</div>
                    <div class="note-date">${getCurrentDate()}</div>
                </div>
            </div>

            <!-- DATOS COMPLETOS DEL PACIENTE -->
            <div class="patient-complete-data">
                <table class="patient-data-table">
                    <tr>
                        <td class="label">PACIENTE:</td>
                        <td class="value">${patientData.full_name || 'Paciente sin nombre'}</td>
                        <td class="label">HC:</td>
                        <td class="value">${patientData.hc_number || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td class="label">EDAD:</td>
                        <td class="value">${patientData.age || '---'} años</td>
                        <td class="label">SEXO:</td>
                        <td class="value">${patientData.gender || '---'}</td>
                    </tr>
                    <tr>
                        <td class="label">CAMA:</td>
                        <td class="value">${patientData.bed_number || '---'}</td>
                        <td class="label">SERVICIO:</td>
                        <td class="value">${patientData.department || '---'}</td>
                    </tr>
                    <tr>
                        <td class="label">DIAGNÓSTICO:</td>
                        <td class="value" colspan="3">${patientData.diagnosis || 'Pendiente'}</td>
                    </tr>
                </table>
            </div>

            <!-- SIGNOS VITALES ACTUALES -->
            <div class="current-vitals">
                <h4>📊 SIGNOS VITALES ACTUALES - ${getCurrentTime()}</h4>
                <div class="vitals-row">
                    <span><strong>PA:</strong> ${getVitalValue(patientData, 'blood_pressure', 'systolic')}/${getVitalValue(patientData, 'blood_pressure', 'diastolic')} mmHg</span>
                    <span><strong>FC:</strong> ${getVitalValue(patientData, 'heart_rate', 'value')} lpm</span>
                    <span><strong>FR:</strong> ${getVitalValue(patientData, 'respiratory_rate', 'value')} rpm</span>
                    <span><strong>T°:</strong> ${getVitalValue(patientData, 'temperature', 'value')}°C</span>
                    <span><strong>SpO2:</strong> ${getVitalValue(patientData, 'oxygen_saturation', 'value')}%</span>
                </div>
            </div>

            <!-- HERRAMIENTAS DEL EDITOR MEJORADAS -->
            <div class="editor-tools">
                <!-- FORMATO DE TEXTO -->
                <div class="tools-group">
                    <button type="button" class="tool-btn" onclick="formatText('bold')" title="Negrita">
                        <i class="fas fa-bold"></i>
                    </button>
                    <button type="button" class="tool-btn" onclick="formatText('italic')" title="Cursiva">
                        <i class="fas fa-italic"></i>
                    </button>
                    <button type="button" class="tool-btn" onclick="formatText('underline')" title="Subrayado">
                        <i class="fas fa-underline"></i>
                    </button>
                </div>

                <!-- ALINEACIÓN DE TEXTO -->
                <div class="tools-group">
                    <button type="button" class="tool-btn align-btn" onclick="alignText('left')" title="Alinear a la izquierda">
                        <i class="fas fa-align-left"></i>
                    </button>
                    <button type="button" class="tool-btn align-btn" onclick="alignText('center')" title="Centrar">
                        <i class="fas fa-align-center"></i>
                    </button>
                    <button type="button" class="tool-btn align-btn" onclick="alignText('right')" title="Alinear a la derecha">
                        <i class="fas fa-align-right"></i>
                    </button>
                    <button type="button" class="tool-btn align-btn" onclick="alignText('justify')" title="Justificar">
                        <i class="fas fa-align-justify"></i>
                    </button>
                </div>

                <!-- LISTAS Y ELEMENTOS -->
                <div class="tools-group">
                    <button type="button" class="tool-btn" onclick="insertList('ul')" title="Lista con viñetas">
                        <i class="fas fa-list-ul"></i>
                    </button>
                    <button type="button" class="tool-btn" onclick="insertList('ol')" title="Lista numerada">
                        <i class="fas fa-list-ol"></i>
                    </button>
                    <button type="button" class="tool-btn" onclick="insertDivider()" title="Insertar línea divisoria">
                        <i class="fas fa-minus"></i>
                    </button>
                </div>

                <!-- MICRÓFONO -->
                <div class="tools-group">
                    <button type="button" class="tool-btn microphone-btn" 
                            id="microphoneBtn" onclick="toggleSpeechRecognition()" 
                            title="Dictado por voz">
                        <i class="fas fa-microphone" id="micIcon"></i>
                        Dictado
                    </button>
                </div>

                <!-- INSERTAR IMAGEN -->
                <div class="tools-group">
                    <label class="tool-btn" for="imageInput" title="Insertar imagen">
                        <i class="fas fa-image"></i>
                        Imagen
                    </label>
                    <input type="file" id="imageInput" accept="image/*" style="display: none;" 
                           onchange="insertImageInNote(this)">
                </div>

                <!-- PLANTILLAS MÉDICAS -->
                <div class="tools-group">
                    <button type="button" class="tool-btn template-btn" onclick="insertSOAPTemplate()" 
                            title="Plantilla SOAP">
                        <i class="fas fa-notes-medical"></i>
                        SOAP
                    </button>
                    <button type="button" class="tool-btn template-btn" onclick="insertExamTemplate()" 
                            title="Examen físico">
                        <i class="fas fa-stethoscope"></i>
                        Examen
                    </button>
                    <button type="button" class="tool-btn template-btn" onclick="insertPlanTemplate()" 
                            title="Plan médico">
                        <i class="fas fa-clipboard-list"></i>
                        Plan
                    </button>
                </div>

                <!-- LIMPIAR Y DESHACER -->
                <div class="tools-group">
                    <button type="button" class="tool-btn" onclick="undoLastAction()" title="Deshacer">
                        <i class="fas fa-undo"></i>
                    </button>
                    <button type="button" class="tool-btn" onclick="redoLastAction()" title="Rehacer">
                        <i class="fas fa-redo"></i>
                    </button>
                    <button type="button" class="tool-btn danger-btn" onclick="clearEditor()" title="Limpiar todo">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>

            <!-- EDITOR PRINCIPAL -->
            <div class="note-content-area">
                <div class="note-editor" 
                     id="medicalNoteEditor" 
                     contenteditable="true" 
                     placeholder="Escriba o dicte la nota de evolución médica...">
                </div>
            </div>

            <!-- SECCIÓN DE FIRMA DIGITAL -->
            <div class="digital-signature-section">
                <div class="signature-header">
                    <h4>✍️ FIRMA DIGITAL DEL MÉDICO</h4>
                    <div class="signature-status" id="signatureStatus">
                        <span class="status-pending">📝 Pendiente de firma</span>
                    </div>
                </div>

                <div class="signature-area">
                    <div class="signature-info">
                        <div class="doctor-info">
                            <p><strong>MÉDICO:</strong> ${patientData.doctor_info?.name || 'Dr. Usuario'}</p>
                            <p><strong>CMP:</strong> ${patientData.doctor_info?.cmp || '12345'}</p>
                            <p><strong>ESPECIALIDAD:</strong> ${patientData.doctor_info?.specialty || 'Medicina General'}</p>
                        </div>
                        <div class="signature-datetime">
                            <p><strong>FECHA:</strong> ${getCurrentDate()}</p>
                            <p><strong>HORA:</strong> ${getCurrentTime()}</p>
                        </div>
                    </div>
                    
                    <div class="signature-canvas-container">
                        <canvas id="signatureCanvas" width="400" height="150"></canvas>
                        <div class="signature-actions">
                            <button type="button" class="btn-clear-signature" onclick="clearSignature()">
                                <i class="fas fa-eraser"></i> Limpiar Firma
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ===== FUNCIONES DE ALINEACIÓN DE TEXTO =====
function alignText(alignment) {
    const editor = document.getElementById('medicalNoteEditor');
    if (!editor) return;

    // Aplicar alineación al editor
    document.execCommand('justify' + alignment.charAt(0).toUpperCase() + alignment.slice(1), false, null);
    
    // Actualizar estado visual de los botones
    updateAlignButtons(alignment);
    
    console.log(`📐 Texto alineado: ${alignment}`);
}

function updateAlignButtons(activeAlignment) {
    const alignButtons = document.querySelectorAll('.align-btn');
    alignButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Marcar el botón activo
    const activeBtn = document.querySelector(`[onclick="alignText('${activeAlignment}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// ===== FUNCIONES DE FORMATO DE TEXTO =====
function formatText(command) {
    const editor = document.getElementById('medicalNoteEditor');
    if (!editor) return;

    document.execCommand(command, false, null);
    editor.focus();
    
    console.log(`📝 Formato aplicado: ${command}`);
}

// ===== FUNCIONES DE LISTAS =====
function insertList(listType) {
    const editor = document.getElementById('medicalNoteEditor');
    if (!editor) return;

    if (listType === 'ul') {
        document.execCommand('insertUnorderedList', false, null);
    } else if (listType === 'ol') {
        document.execCommand('insertOrderedList', false, null);
    }
    
    editor.focus();
    console.log(`📋 Lista insertada: ${listType}`);
}

function insertDivider() {
    const editor = document.getElementById('medicalNoteEditor');
    if (!editor) return;

    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    const divider = document.createElement('hr');
    divider.style.margin = '10px 0';
    divider.style.border = '1px solid #ccc';
    
    range.insertNode(divider);
    
    // Mover cursor después del divisor
    range.setStartAfter(divider);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    
    editor.focus();
    console.log('➖ Línea divisoria insertada');
}

// ===== FUNCIONES DE HISTORIAL (DESHACER/REHACER) =====
function undoLastAction() {
    document.execCommand('undo', false, null);
    console.log('↶ Acción deshecha');
}

function redoLastAction() {
    document.execCommand('redo', false, null);
    console.log('↷ Acción rehecha');
}

// ===== FUNCIÓN PARA LIMPIAR EDITOR =====
function clearEditor() {
    Swal.fire({
        title: '¿Limpiar todo el contenido?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, limpiar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            const editor = document.getElementById('medicalNoteEditor');
            if (editor) {
                editor.innerHTML = '';
                editor.focus();
                console.log('🗑️ Editor limpiado');
                
                Swal.fire({
                    title: 'Limpiado',
                    text: 'El contenido ha sido eliminado',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        }
    });
}

// ===== PLANTILLAS MÉDICAS =====
function insertSOAPTemplate() {
    const template = `
<div style="margin: 10px 0;">
    <h4 style="color: #2c5aa0; margin-bottom: 5px;">📋 EVALUACIÓN SOAP</h4>
    
    <p><strong>S - SUBJETIVO:</strong></p>
    <p style="margin-left: 20px;">
        • Síntomas que refiere el paciente:<br>
        • Historia de la enfermedad actual:<br>
        • Revisión por sistemas:
    </p>
    
    <p><strong>O - OBJETIVO:</strong></p>
    <p style="margin-left: 20px;">
        • Signos vitales: PA ___ FC ___ FR ___ T° ___ SpO2 ___%<br>
        • Examen físico general:<br>
        • Examen físico por sistemas:
    </p>
    
    <p><strong>A - ANÁLISIS:</strong></p>
    <p style="margin-left: 20px;">
        • Diagnóstico principal:<br>
        • Diagnósticos diferenciales:<br>
        • Evolución del cuadro:
    </p>
    
    <p><strong>P - PLAN:</strong></p>
    <p style="margin-left: 20px;">
        • Plan diagnóstico:<br>
        • Plan terapéutico:<br>
        • Plan educacional:<br>
        • Seguimiento:
    </p>
</div>
    `;
    
    insertTemplateInEditor(template);
    console.log('📋 Plantilla SOAP insertada');
}

function insertExamTemplate() {
    const template = `
<div style="margin: 10px 0;">
    <h4 style="color: #2c5aa0; margin-bottom: 5px;">🩺 EXAMEN FÍSICO</h4>
    
    <p><strong>ASPECTO GENERAL:</strong> Paciente ___, colaborador, orientado en tiempo, espacio y persona.</p>
    
    <p><strong>SIGNOS VITALES:</strong></p>
    <ul style="margin-left: 20px;">
        <li>Presión arterial: ___ mmHg</li>
        <li>Frecuencia cardíaca: ___ lpm</li>
        <li>Frecuencia respiratoria: ___ rpm</li>
        <li>Temperatura: ___°C</li>
        <li>Saturación de oxígeno: ___%</li>
    </ul>
    
    <p><strong>EXAMEN POR SISTEMAS:</strong></p>
    <ul style="margin-left: 20px;">
        <li><strong>Cardiovascular:</strong> ___</li>
        <li><strong>Respiratorio:</strong> ___</li>
        <li><strong>Abdomen:</strong> ___</li>
        <li><strong>Neurológico:</strong> ___</li>
        <li><strong>Extremidades:</strong> ___</li>
    </ul>
</div>
    `;
    
    insertTemplateInEditor(template);
    console.log('🩺 Plantilla de examen físico insertada');
}

function insertPlanTemplate() {
    const template = `
<div style="margin: 10px 0;">
    <h4 style="color: #2c5aa0; margin-bottom: 5px;">📋 PLAN MÉDICO</h4>
    
    <p><strong>1. PLAN DIAGNÓSTICO:</strong></p>
    <ul style="margin-left: 20px;">
        <li>Laboratorios: ___</li>
        <li>Imágenes: ___</li>
        <li>Procedimientos: ___</li>
        <li>Interconsultas: ___</li>
    </ul>
    
    <p><strong>2. PLAN TERAPÉUTICO:</strong></p>
    <ul style="margin-left: 20px;">
        <li>Medicamentos: ___</li>
        <li>Medidas generales: ___</li>
        <li>Dieta: ___</li>
        <li>Actividad física: ___</li>
    </ul>
    
    <p><strong>3. PLAN EDUCACIONAL:</strong></p>
    <ul style="margin-left: 20px;">
        <li>Educación al paciente/familia: ___</li>
        <li>Signos de alarma: ___</li>
    </ul>
    
    <p><strong>4. SEGUIMIENTO:</strong></p>
    <ul style="margin-left: 20px;">
        <li>Próxima cita: ___</li>
        <li>Controles: ___</li>
        <li>Criterios de alta: ___</li>
    </ul>
</div>
    `;
    
    insertTemplateInEditor(template);
    console.log('📋 Plantilla de plan médico insertada');
}

function insertTemplateInEditor(template) {
    const editor = document.getElementById('medicalNoteEditor');
    if (!editor) return;

    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    const templateDiv = document.createElement('div');
    templateDiv.innerHTML = template;
    
    range.insertNode(templateDiv);
    
    // Mover cursor al final del template
    range.setStartAfter(templateDiv);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    
    editor.focus();
}

// ===== FUNCIONES DE UTILIDAD =====
function getCurrentDate() {
    const now = new Date();
    return now.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function generateNoteNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `NE${year}${month}${day}${random}`;
}

function getVitalValue(patientData, category, field) {
    try {
        if (patientData.current_vitals && patientData.current_vitals[category]) {
            return patientData.current_vitals[category][field] || '---';
        }
        return '---';
    } catch (error) {
        return '---';
    }
}

// ===== DICTADO POR VOZ =====
function toggleSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        Swal.fire({
            icon: 'error',
            title: 'Función no disponible',
            text: 'Su navegador no soporta reconocimiento de voz'
        });
        return;
    }

    if (isRecording) {
        stopSpeechRecognition();
    } else {
        startSpeechRecognition();
    }
}

function startSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    speechRecognition = new SpeechRecognition();
    
    speechRecognition.continuous = true;
    speechRecognition.interimResults = true;
    speechRecognition.lang = 'es-ES';
    
    speechRecognition.onstart = function() {
        isRecording = true;
        updateMicrophoneButton(true);
        console.log('🎤 Dictado iniciado');
    };
    
    speechRecognition.onresult = function(event) {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        if (finalTranscript) {
            insertTextInEditor(finalTranscript);
        }
    };
    
    speechRecognition.onerror = function(event) {
        console.error('Error en dictado:', event.error);
        stopSpeechRecognition();
    };
    
    speechRecognition.onend = function() {
        stopSpeechRecognition();
    };
    
    speechRecognition.start();
}

function stopSpeechRecognition() {
    if (speechRecognition) {
        speechRecognition.stop();
        speechRecognition = null;
    }
    
    isRecording = false;
    updateMicrophoneButton(false);
    console.log('🎤 Dictado detenido');
}

function updateMicrophoneButton(recording) {
    const btn = document.getElementById('microphoneBtn');
    const icon = document.getElementById('micIcon');
    
    if (btn && icon) {
        if (recording) {
            btn.classList.add('recording');
            icon.className = 'fas fa-stop';
            btn.innerHTML = '<i class="fas fa-stop" id="micIcon"></i> Detener';
        } else {
            btn.classList.remove('recording');
            icon.className = 'fas fa-microphone';
            btn.innerHTML = '<i class="fas fa-microphone" id="micIcon"></i> Dictado';
        }
    }
}

function insertTextInEditor(text) {
    const editor = document.getElementById('medicalNoteEditor');
    if (!editor) return;

    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    const textNode = document.createTextNode(text + ' ');
    range.insertNode(textNode);
    
    // Mover cursor al final del texto insertado
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    
    editor.focus();
}

// ===== INSERTAR IMAGEN =====
function insertImageInNote(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '300px';
            img.style.height = 'auto';
            img.style.margin = '10px 0';
            img.style.border = '1px solid #ddd';
            img.style.borderRadius = '4px';
            
            const editor = document.getElementById('medicalNoteEditor');
            if (editor) {
                const selection = window.getSelection();
                const range = selection.getRangeAt(0);
                
                range.insertNode(img);
                
                // Mover cursor después de la imagen
                range.setStartAfter(img);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
                
                editor.focus();
            }
            
            console.log('🖼️ Imagen insertada en nota médica');
        };
        
        reader.readAsDataURL(file);
    }
}

// ===== INICIALIZACIÓN =====
function initializeEditorWithSignature(patientData) {
    console.log('🚀 Inicializando editor con firma digital');
    
    // Configurar editor
    const editor = document.getElementById('medicalNoteEditor');
    if (editor) {
        editor.focus();
        
        // Eventos del editor
        editor.addEventListener('keydown', function(e) {
            // Ctrl+B para negrita
            if (e.ctrlKey && e.key === 'b') {
                e.preventDefault();
                formatText('bold');
            }
            // Ctrl+I para cursiva
            if (e.ctrlKey && e.key === 'i') {
                e.preventDefault();
                formatText('italic');
            }
            // Ctrl+U para subrayado
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
                formatText('underline');
            }
        });
    }
    
    // Inicializar canvas de firma
    initializeSignatureCanvas();
}

// ===== CANVAS DE FIRMA =====
function initializeSignatureCanvas() {
    const canvas = document.getElementById('signatureCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let drawing = false;
    
    // Configurar canvas
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    // Eventos del mouse
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Eventos táctiles para móvil
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', stopDrawing);
    
    function startDrawing(e) {
        drawing = true;
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }
    
    function draw(e) {
        if (!drawing) return;
        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    }
    
    function stopDrawing() {
        drawing = false;
        ctx.beginPath();
    }
    
    function handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }
    
    function handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }
}

function clearSignature() {
    const canvas = document.getElementById('signatureCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        console.log('🧹 Firma limpiada');
    }
}

// ===== OBTENER DATOS DEL PACIENTE =====
async function fetchPatientRealData(bedNumber, patientId) {
    try {
        console.log(`📡 Obteniendo datos del paciente: cama ${bedNumber}, ID ${patientId}`);
        
        // Simular datos del paciente (en producción, esto vendría de la API)
        const mockPatientData = {
            full_name: 'Juan Carlos Pérez González',
            hc_number: 'HC-2024-001234',
            age: '58',
            gender: 'Masculino',
            bed_number: bedNumber,
            department: 'Medicina Interna',
            diagnosis: 'Diabetes Mellitus Tipo 2 + Hipertensión Arterial',
            hospital_name: 'Hospital Central San José',
            hospital_address: 'Av. Angamos Este 2520, Surquillo, Lima',
            current_vitals: {
                blood_pressure: {
                    systolic: 140,
                    diastolic: 90
                },
                heart_rate: {
                    value: 78
                },
                respiratory_rate: {
                    value: 18
                },
                temperature: {
                    value: 36.8
                },
                oxygen_saturation: {
                    value: 98
                }
            },
            doctor_info: {
                name: 'Dr. Alan Cairampoma Carrillo',
                cmp: '12345',
                specialty: 'Medicina Interna'
            }
        };
        
        // En un entorno real, harías algo como:
        // const response = await fetch(`/api/patients/${patientId}?bed=${bedNumber}`);
        // return await response.json();
        
        return mockPatientData;
        
    } catch (error) {
        console.error('❌ Error obteniendo datos del paciente:', error);
        return null;
    }
}

// ===== FIRMAR Y GUARDAR NOTA =====
async function signAndSaveMedicalNote(patientData) {
    try {
        const editor = document.getElementById('medicalNoteEditor');
        const canvas = document.getElementById('signatureCanvas');
        
        if (!editor || !canvas) {
            throw new Error('Editor o canvas de firma no encontrado');
        }
        
        // Validar contenido
        const noteContent = editor.innerHTML.trim();
        if (!noteContent) {
            Swal.fire({
                icon: 'warning',
                title: 'Contenido vacío',
                text: 'Debe escribir el contenido de la nota médica'
            });
            return false;
        }
        
        // Validar firma
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hasSignature = imageData.data.some(channel => channel !== 0);
        
        if (!hasSignature) {
            Swal.fire({
                icon: 'warning',
                title: 'Firma requerida',
                text: 'Debe firmar la nota médica antes de guardar'
            });
            return false;
        }
        
        // Preparar datos para guardar
        const noteData = {
            patient_id: patientData.patient_id || 'PAT001',
            bed_number: patientData.bed_number,
            content: noteContent,
            signature: canvas.toDataURL('image/png'),
            doctor_info: patientData.doctor_info,
            timestamp: new Date().toISOString(),
            note_number: generateNoteNumber()
        };
        
        // Mostrar loading
        Swal.fire({
            title: 'Guardando nota médica...',
            html: '⏳ Procesando firma digital',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Simular guardado (en producción sería una llamada a la API)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // En un entorno real:
        // const response = await fetch('/api/medical/notes', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(noteData)
        // });
        
        console.log('💾 Nota médica guardada:', noteData);
        
        // Actualizar estado de firma
        updateSignatureStatus(true);
        
        Swal.fire({
            icon: 'success',
            title: '✅ Nota Médica Guardada',
            html: `
                <div style="text-align: left;">
                    <p><strong>📋 Número:</strong> ${noteData.note_number}</p>
                    <p><strong>👤 Paciente:</strong> ${patientData.full_name}</p>
                    <p><strong>🛏️ Cama:</strong> ${patientData.bed_number}</p>
                    <p><strong>⏰ Fecha:</strong> ${getCurrentDate()} ${getCurrentTime()}</p>
                    <p><strong>✍️ Estado:</strong> Firmada digitalmente</p>
                </div>
            `,
            confirmButtonText: 'Continuar',
            confirmButtonColor: '#28a745'
        });
        
        return true;
        
    } catch (error) {
        console.error('❌ Error guardando nota médica:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error al guardar',
            text: 'No se pudo guardar la nota médica. Intente nuevamente.'
        });
        return false;
    }
}

// ===== GENERAR PDF =====
async function generateSignedMedicalNotePDF(patientData) {
    try {
        const editor = document.getElementById('medicalNoteEditor');
        const canvas = document.getElementById('signatureCanvas');
        
        if (!editor || !canvas) {
            throw new Error('Editor o canvas no encontrado');
        }
        
        const noteContent = editor.innerHTML.trim();
        if (!noteContent) {
            Swal.fire({
                icon: 'warning',
                title: 'Contenido vacío',
                text: 'Debe escribir el contenido antes de generar el PDF'
            });
            return false;
        }
        
        // Mostrar loading
        Swal.fire({
            title: 'Generando PDF...',
            html: '📄 Creando documento con firma digital',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Preparar datos para PDF
        const pdfData = {
            patient_data: patientData,
            note_content: noteContent,
            signature: canvas.toDataURL('image/png'),
            doctor_info: patientData.doctor_info,
            timestamp: new Date().toISOString(),
            note_number: generateNoteNumber()
        };
        
        // Simular generación de PDF
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        // En un entorno real:
        // const response = await fetch('/api/medical/notes/generate-pdf', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(pdfData)
        // });
        // const blob = await response.blob();
        // const url = URL.createObjectURL(blob);
        // const a = document.createElement('a');
        // a.href = url;
        // a.download = `Nota_Medica_${patientData.bed_number}_${getCurrentDate()}.pdf`;
        // a.click();
        
        console.log('📄 PDF generado:', pdfData);
        
        Swal.fire({
            icon: 'success',
            title: '📄 PDF Generado',
            html: `
                <div style="text-align: left;">
                    <p><strong>📋 Documento:</strong> Nota de Evolución Médica</p>
                    <p><strong>👤 Paciente:</strong> ${patientData.full_name}</p>
                    <p><strong>🛏️ Cama:</strong> ${patientData.bed_number}</p>
                    <p><strong>✍️ Estado:</strong> Firmado digitalmente</p>
                    <p><strong>📁 Archivo:</strong> Nota_Medica_${patientData.bed_number}_${getCurrentDate()}.pdf</p>
                </div>
            `,
            confirmButtonText: 'Descargar',
            confirmButtonColor: '#007bff',
            showCancelButton: true,
            cancelButtonText: 'Cerrar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Simular descarga
                const fileName = `Nota_Medica_${patientData.bed_number}_${getCurrentDate()}.pdf`;
                console.log(`📥 Simulando descarga: ${fileName}`);
                
                // En producción aquí iría la descarga real
                Swal.fire({
                    icon: 'info',
                    title: 'Descarga simulada',
                    text: `Archivo: ${fileName}`,
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        });
        
        return true;
        
    } catch (error) {
        console.error('❌ Error generando PDF:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error generando PDF',
            text: 'No se pudo generar el documento. Intente nuevamente.'
        });
        return false;
    }
}

// ===== ACTUALIZAR ESTADO DE FIRMA =====
function updateSignatureStatus(signed) {
    const statusElement = document.getElementById('signatureStatus');
    if (statusElement) {
        if (signed) {
            statusElement.innerHTML = '<span class="status-signed">✅ Firmada digitalmente</span>';
        } else {
            statusElement.innerHTML = '<span class="status-pending">📝 Pendiente de firma</span>';
        }
    }
}

// ===== CARGAR ESTILOS PERSONALIZADOS =====
function loadCustomStyles() {
    const styles = `
        <style>
        .medical-note-with-signature {
            max-width: 100%;
            margin: 0 auto;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.4;
        }
        
        .official-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            border-bottom: 2px solid #2c5aa0;
            margin-bottom: 15px;
        }
        
        .hospital-logo {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .hospital-text h2 {
            color: #2c5aa0;
            margin: 0;
            font-size: 16px;
            font-weight: bold;
        }
        
        .hospital-text p {
            margin: 2px 0;
            font-size: 12px;
            color: #666;
        }
        
        .document-number {
            text-align: right;
        }
        
        .note-type {
            font-weight: bold;
            color: #2c5aa0;
            font-size: 14px;
        }
        
        .note-id, .note-date {
            font-size: 12px;
            color: #666;
            margin: 2px 0;
        }
        
        .patient-data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 12px;
        }
        
        .patient-data-table td {
            padding: 4px 8px;
            border: 1px solid #ddd;
        }
        
        .patient-data-table .label {
            background-color: #f8f9fa;
            font-weight: bold;
            width: 15%;
        }
        
        .patient-data-table .value {
            background-color: white;
        }
        
        .current-vitals {
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
        }
        
        .current-vitals h4 {
            margin: 0 0 8px 0;
            color: #2c5aa0;
            font-size: 14px;
        }
        
        .vitals-row {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            font-size: 12px;
        }
        
        .editor-tools {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 5px;
            margin-bottom: 10px;
            border: 1px solid #ddd;
        }
        
        .tools-group {
            display: flex;
            gap: 5px;
            align-items: center;
        }
        
        .tool-btn {
            background: white;
            border: 1px solid #ddd;
            padding: 6px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .tool-btn:hover {
            background: #e9ecef;
            border-color: #2c5aa0;
        }
        
        .tool-btn.active {
            background: #2c5aa0;
            color: white;
            border-color: #2c5aa0;
        }
        
        .tool-btn.recording {
            background: #dc3545;
            color: white;
            border-color: #dc3545;
            animation: pulse 1s infinite;
        }
        
        .tool-btn.danger-btn {
            background: #dc3545;
            color: white;
            border-color: #dc3545;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .note-content-area {
            border: 2px solid #ddd;
            border-radius: 5px;
            margin-bottom: 15px;
        }
        
        .note-editor {
            min-height: 300px;
            padding: 15px;
            outline: none;
            font-size: 14px;
            line-height: 1.6;
            background: white;
        }
        
        .note-editor:empty:before {
            content: attr(placeholder);
            color: #999;
            font-style: italic;
        }
        
        .digital-signature-section {
            border: 2px solid #28a745;
            border-radius: 5px;
            padding: 15px;
            background-color: #f8fff9;
        }
        
        .signature-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .signature-header h4 {
            margin: 0;
            color: #28a745;
            font-size: 16px;
        }
        
        .status-pending {
            color: #ffc107;
            font-weight: bold;
        }
        
        .status-signed {
            color: #28a745;
            font-weight: bold;
        }
        
        .signature-area {
            display: flex;
            gap: 20px;
            align-items: flex-start;
        }
        
        .signature-info {
            flex: 1;
            font-size: 12px;
        }
        
        .doctor-info, .signature-datetime {
            margin-bottom: 10px;
        }
        
        .doctor-info p, .signature-datetime p {
            margin: 2px 0;
        }
        
        .signature-canvas-container {
            border: 2px dashed #28a745;
            border-radius: 5px;
            padding: 10px;
            background: white;
        }
        
        #signatureCanvas {
            border: 1px solid #ddd;
            border-radius: 3px;
            cursor: crosshair;
            display: block;
        }
        
        .signature-actions {
            margin-top: 10px;
            text-align: center;
        }
        
        .btn-clear-signature {
            background: #dc3545;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .btn-clear-signature:hover {
            background: #c82333;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .official-header {
                flex-direction: column;
                text-align: center;
                gap: 10px;
            }
            
            .signature-area {
                flex-direction: column;
            }
            
            .editor-tools {
                justify-content: center;
            }
            
            #signatureCanvas {
                width: 100%;
                height: 120px;
            }
        }
        </style>
    `;
    
    // Insertar estilos en el head del documento
    const existingStyles = document.getElementById('medical-note-styles');
    if (existingStyles) {
        existingStyles.remove();
    }
    
    const styleElement = document.createElement('div');
    styleElement.id = 'medical-note-styles';
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);
}

// ===== EXPORTAR FUNCIONES PARA USO GLOBAL =====
window.openMedicalNoteWithSignature = openMedicalNoteWithSignature;
window.formatText = formatText;
window.alignText = alignText;
window.insertList = insertList;
window.insertDivider = insertDivider;
window.undoLastAction = undoLastAction;
window.redoLastAction = redoLastAction;
window.clearEditor = clearEditor;
window.insertSOAPTemplate = insertSOAPTemplate;
window.insertExamTemplate = insertExamTemplate;
window.insertPlanTemplate = insertPlanTemplate;
window.toggleSpeechRecognition = toggleSpeechRecognition;
window.insertImageInNote = insertImageInNote;
window.clearSignature = clearSignature;
window.formatText = formatText;
window.alignText = alignText;

console.log('📋 notamedica.js cargado correctamente - Versión con alineación de texto');

