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
let editorHistory = [];
let historyIndex = -1;
let saveTimeout = null;
const LOCAL_STORAGE_KEY = 'medical_note_draft';
const AUTO_SAVE_INTERVAL = 30000; // 30 segundos

// ===== FUNCIONES DE UTILIDAD =====
function getUrlParameters() {
    const params = {};
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    
    // Obtener parámetros específicos
    params.patientId = urlParams.get('patientId');
    params.bedNumber = urlParams.get('bedNumber');
    params.timestamp = urlParams.get('timestamp');
    params.name = urlParams.get('name');
    params.diagnosis = urlParams.get('diagnosis');
    params.department = urlParams.get('department');
    params.hc = urlParams.get('hc');
    params.age = urlParams.get('age');
    params.gender = urlParams.get('gender');
    
    return params;
}

// ===== CONFIGURACIÓN DE BOTONES DE VOLVER =====
function setupBackButtonsForNotaMedica() {
    // Obtener los parámetros de la URL para saber a dónde volver
    const urlParams = getUrlParameters();
    const bedNumber = urlParams.bedNumber;
    const patientId = urlParams.patientId;
    
    console.log('🔍 Configurando botones de volver con datos:', { bedNumber, patientId });
    
    // Buscar todos los botones de volver en la página
    const backButtons = document.querySelectorAll('.back-btn, [data-action="back"], .btn-volver, button:contains("Volver"), a:contains("Volver")');
    
    if (backButtons.length === 0) {
        console.log('⚠️ No se encontraron botones de volver en la página');
        
        // Crear un botón de volver si no existe
        const header = document.querySelector('header') || document.querySelector('.header') || document.body.firstChild;
        const backButton = document.createElement('button');
        backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Volver';
        backButton.className = 'btn btn-secondary back-btn';
        backButton.style.margin = '10px';
        header.parentNode.insertBefore(backButton, header);
        
        // Configurar el nuevo botón
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            handleBackNavigation(bedNumber, patientId);
        });
        
        console.log('✅ Botón de volver creado y configurado');
    } else {
        // Configurar los botones existentes
        backButtons.forEach(button => {
            // Eliminar manejadores de eventos anteriores
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            // Agregar nuevo manejador de eventos
            newButton.addEventListener('click', function(e) {
                e.preventDefault();
                handleBackNavigation(bedNumber, patientId);
            });
        });
        
        console.log('✅ Botones de volver configurados:', backButtons.length);
    }
}

// ===== MANEJAR NAVEGACIÓN DE REGRESO =====
function handleBackNavigation(bedNumber, patientId) {
    console.log('🔙 Volviendo a rondas médicas con datos:', { bedNumber, patientId });
    
    // Guardar el borrador actual antes de salir
    saveEditorContent();
    
    // Verificar si existe la función de navegación común
    if (typeof returnToMedicalRounds === 'function') {
        // Usar la función de navegación común
        returnToMedicalRounds(patientId, bedNumber);
    } else {
        // Implementación alternativa si no está disponible la función común
        // Guardar información para que se muestre el modal al volver
        sessionStorage.setItem('showPatientModalOnReturn', 'true');
        sessionStorage.setItem('returnPatientId', patientId);
        sessionStorage.setItem('returnBedNumber', bedNumber);
        
        // Redirigir a la página de rondas médicas
        window.location.href = '/medical/rounds';
    }
}

// ===== OBTENER PARÁMETROS DE URL =====
// Nota: Esta función ya está definida arriba con más parámetros
// Esta es una versión simplificada para compatibilidad con código existente
function getSimplifiedUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        bedNumber: urlParams.get('bedNumber') || urlParams.get('bed_number'),
        patientId: urlParams.get('patientId') || urlParams.get('patient_id'),
        timestamp: urlParams.get('timestamp')
    };
}

// ===== ACTUALIZAR INFORMACIÓN DEL PACIENTE EN LA INTERFAZ =====
function updatePatientInfo(patientData) {
    try {
        console.log('Actualizando interfaz con datos del paciente:', patientData);
        
        // Guardar datos en variable global para acceso desde otras funciones
        currentPatientData = patientData;
        
        // Actualizar tabla de datos del paciente
        const patientTable = document.querySelector('.patient-data-table');
        if (patientTable) {
            // Nombre del paciente
            const patientNameCell = patientTable.querySelector('tr:nth-child(1) td:nth-child(2)');
            if (patientNameCell) {
                patientNameCell.textContent = patientData.name || patientData.full_name || 'Paciente sin nombre';
            }
            
            // Número de historia clínica
            const hcNumberCell = patientTable.querySelector('tr:nth-child(1) td:nth-child(4)');
            if (hcNumberCell) {
                hcNumberCell.textContent = patientData.hc_number || 'HC-TEMP';
            }
            
            // Edad del paciente
            const ageCell = patientTable.querySelector('tr:nth-child(2) td:nth-child(2)');
            if (ageCell) {
                ageCell.textContent = patientData.age ? `${patientData.age} años` : '---';
            }
            
            // Sexo del paciente
            const genderCell = patientTable.querySelector('tr:nth-child(2) td:nth-child(4)');
            if (genderCell) {
                genderCell.textContent = patientData.gender || patientData.sexo || '---';
            }
            
            // Número de cama
            const bedCell = patientTable.querySelector('tr:nth-child(3) td:nth-child(2)');
            if (bedCell) {
                bedCell.textContent = patientData.bed_number || '---';
            }
            
            // Servicio/departamento
            const serviceCell = patientTable.querySelector('tr:nth-child(3) td:nth-child(4)');
            if (serviceCell) {
                serviceCell.textContent = patientData.department || patientData.room || 'Medicina General';
            }
            
            // Diagnóstico - Implementación mejorada para mostrar correctamente
            console.log('🔍 Actualizando diagnóstico del paciente');
            console.log('Datos de diagnóstico disponibles:', {
                diagnosis: patientData.diagnosis,
                primaryDiagnosis: patientData.medical_info?.primary_diagnosis,
                diagnosisCode: patientData.diagnosisCode,
                diagnosisText: patientData.diagnosisText
            });
            
            // Determinar el mejor diagnóstico disponible
            const diagnosis = (function() {
                // Prioridad 1: Si hay un diagnóstico completo
                if (patientData.diagnosis && 
                    typeof patientData.diagnosis === 'string' && 
                    !patientData.diagnosis.includes('undefined')) {
                    console.log('Usando diagnóstico de patientData.diagnosis');
                    return patientData.diagnosis;
                }
                
                // Prioridad 2: Si hay diagnóstico en medical_info
                if (patientData.medical_info && 
                    patientData.medical_info.primary_diagnosis && 
                    typeof patientData.medical_info.primary_diagnosis === 'string' && 
                    !patientData.medical_info.primary_diagnosis.includes('undefined')) {
                    console.log('Usando diagnóstico de patientData.medical_info.primary_diagnosis');
                    return patientData.medical_info.primary_diagnosis;
                }
                
                // Prioridad 3: Combinar código y texto si existen
                if (patientData.diagnosisCode || patientData.diagnosisText) {
                    const code = patientData.diagnosisCode || '';
                    const text = patientData.diagnosisText || '';
                    
                    if (code && text && 
                        typeof code === 'string' && typeof text === 'string' && 
                        !code.includes('undefined') && !text.includes('undefined')) {
                        console.log('Usando combinación de código y texto de diagnóstico');
                        return `${code} - ${text}`;
                    } else if (code && typeof code === 'string' && !code.includes('undefined')) {
                        console.log('Usando solo código de diagnóstico');
                        return code;
                    } else if (text && typeof text === 'string' && !text.includes('undefined')) {
                        console.log('Usando solo texto de diagnóstico');
                        return text;
                    }
                }
                
                // Valor por defecto
                console.log('Usando diagnóstico por defecto: Pendiente de evaluación');
                return 'Pendiente de evaluación';
            })();
            
            console.log('✅ Diagnóstico final establecido:', diagnosis);
            
            // Actualizar TODOS los elementos que muestran el diagnóstico
            // 1. Celda en la tabla de paciente
            const diagnosisCell = patientTable.querySelector('tr:nth-child(4) td:nth-child(2)');
            if (diagnosisCell) {
                diagnosisCell.textContent = diagnosis;
                console.log('Actualizada celda de diagnóstico en tabla');
            }
            
            // 2. Elementos con clases especiales para diagnóstico
            const diagnosisElements = document.querySelectorAll('.diagnosis-value, .patient-diagnosis');
            if (diagnosisElements.length > 0) {
                console.log(`Actualizando ${diagnosisElements.length} elementos adicionales con el diagnóstico`);
                diagnosisElements.forEach(element => {
                    element.textContent = diagnosis;
                });
            } else {
                console.log('No se encontraron elementos adicionales para mostrar el diagnóstico');
            }
            
            // 3. Guardar en el objeto global para referencias futuras
            if (window.currentPatientData) {
                window.currentPatientData.diagnosis = diagnosis;
                console.log('Diagnóstico actualizado en objeto global currentPatientData');
            }
        }
        
        // Actualizar información del médico en la sección de firma digital
        if (patientData.doctor_info) {
            const doctorInfo = document.querySelector('.doctor-info');
            if (doctorInfo) {
                const doctorNameElement = doctorInfo.querySelector('p:nth-child(1)');
                const doctorCMPElement = doctorInfo.querySelector('p:nth-child(2)');
                const doctorSpecialtyElement = doctorInfo.querySelector('p:nth-child(3)');
                
                if (doctorNameElement) {
                    doctorNameElement.innerHTML = `<strong>MÉDICO:</strong> ${patientData.doctor_info.name || 'Dr. Sin nombre'}`;
                }
                
                if (doctorCMPElement) {
                    doctorCMPElement.innerHTML = `<strong>CMP:</strong> ${patientData.doctor_info.cmp || '-----'}`;
                }
                
                if (doctorSpecialtyElement) {
                    doctorSpecialtyElement.innerHTML = `<strong>ESPECIALIDAD:</strong> ${patientData.doctor_info.specialty || 'Medicina General'}`;
                }
            }
        }
        
        // Actualizar fecha y hora en la sección de firma
        const dateElement = document.querySelector('.signature-date');
        if (dateElement) {
            const currentDate = new Date();
            const formattedDate = currentDate.toLocaleDateString('es-PE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            dateElement.textContent = `Fecha: ${formattedDate}`;
        }
        
        const timeElement = document.querySelector('.signature-time');
        if (timeElement) {
            const currentTime = new Date();
            const formattedTime = currentTime.toLocaleTimeString('es-PE', {
                hour: '2-digit',
                minute: '2-digit'
            });
            timeElement.textContent = `Hora: ${formattedTime}`;
        }
        
        console.log('✅ Interfaz actualizada con datos del paciente');
        
        // Cargar contenido del editor si existe un borrador previo para este paciente
        loadEditorContent(patientData.patientId);
        
        return true;
    } catch (error) {
        console.error('Error actualizando interfaz con datos del paciente:', error);
        return false;
    }
}

// ===== CARGAR DATOS DESDE URL Y LOCALSTORAGE =====
function cargarDatosDesdeURL() {
    console.log('Buscando datos del paciente desde URL y almacenamiento local...');
    
    try {
        // Verificar parámetros URL
        const urlParams = getUrlParameters();
        const bedNumber = urlParams.bedNumber;
        const patientId = urlParams.patientId;
        
        console.log('Parámetros URL:', { bedNumber, patientId });
        
        if (bedNumber && patientId) {
            // Verificar localStorage para datos específicos del paciente
            const patientKey = `patient_${patientId}`;
            const patientDataStr = localStorage.getItem(patientKey) || 
                               localStorage.getItem('currentPatientData') || 
                               localStorage.getItem('medicalNotePatientData');
            
            if (patientDataStr) {
                try {
                    const patientData = JSON.parse(patientDataStr);
                    console.log('Datos del paciente encontrados en localStorage:', patientData);
                    updatePatientInfo(patientData);
                    return true;
                } catch (parseError) {
                    console.error('Error parseando datos del paciente:', parseError);
                }
            }
            
            // Si no hay datos en localStorage, intentar obtener desde API
            console.log('Intentando obtener datos del paciente desde API...');
            fetch(`/api/patients/${patientId}`)
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error('Error obteniendo datos del paciente');
                })
                .then(data => {
                    // Enriquecer datos del paciente
                    const enrichedPatientData = {
                        ...data,
                        patientId: patientId,
                        bed_number: bedNumber,
                        timestamp: new Date().toISOString(),
                        session_id: Date.now().toString(),
                        // Información adicional
                        hospital_name: 'Hospital Central San José',
                        hospital_address: 'Av. Angamos Este 2520, Surquillo, Lima',
                        department: data.room || data.department || 'Medicina General',
                        doctor_info: {
                            name: 'Dr. Alan Cairampoma Carrillo',
                            cmp: '12345',
                            specialty: 'Medicina Interna'
                        }
                    };
                    
                    // Guardar datos en localStorage para uso futuro
                    localStorage.setItem('currentPatientData', JSON.stringify(enrichedPatientData));
                    localStorage.setItem('medicalNotePatientData', JSON.stringify(enrichedPatientData));
                    localStorage.setItem('lastNotePatientId', patientId);
                    
                    // Actualizar interfaz
                    updatePatientInfo(enrichedPatientData);
                    console.log('✅ Datos del paciente cargados desde API');
                })
                .catch(error => {
                    console.error('Error obteniendo datos del paciente desde API:', error);
                });
        } else {
            // Verificar localStorage general si no hay parámetros URL
            const generalPatientData = localStorage.getItem('currentPatientData') || 
                                    localStorage.getItem('medicalNotePatientData');
            
            if (generalPatientData) {
                try {
                    const patientData = JSON.parse(generalPatientData);
                    console.log('Datos generales del paciente encontrados en localStorage');
                    updatePatientInfo(patientData);
                    return true;
                } catch (parseError) {
                    console.error('Error parseando datos generales del paciente:', parseError);
                }
            }
        }
    } catch (error) {
        console.error('Error cargando datos desde URL/localStorage:', error);
    }
    
    return false;
}

// ===== CARGAR CONTENIDO DEL EDITOR =====
function loadEditorContent(patientId) {
    try {
        console.log('Intentando cargar contenido del editor para paciente:', patientId);
        
        // Verificar si hay un ID de paciente válido
        if (!patientId) {
            console.log('No hay ID de paciente, no se cargará contenido');
            return false;
        }
        
        // Obtener el editor
        const editor = document.getElementById('medicalNoteEditor');
        if (!editor) {
            console.error('No se encontró el editor de notas médicas');
            return false;
        }
        
        // Verificar si hay un borrador guardado
        const savedDraft = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!savedDraft) {
            console.log('No hay borrador guardado para cargar');
            return false;
        }
        
        // Parsear el borrador guardado
        try {
            const draftData = JSON.parse(savedDraft);
            
            // Verificar si el borrador corresponde al paciente actual
            if (draftData.patientId && draftData.patientId === patientId) {
                console.log('Encontrado borrador para el paciente actual:', draftData);
                
                // Cargar el contenido en el editor
                editor.innerHTML = draftData.content || '';
                console.log('✅ Contenido cargado en el editor');
                
                // Guardar historial
                if (draftData.content) {
                    editorHistory = [draftData.content];
                    historyIndex = 0;
                }
                
                return true;
            } else {
                console.log('El borrador guardado pertenece a otro paciente, no se cargará');
                console.log('ID guardado:', draftData.patientId, 'ID actual:', patientId);
                return false;
            }
        } catch (parseError) {
            console.error('Error parseando borrador guardado:', parseError);
            return false;
        }
    } catch (error) {
        console.error('Error cargando contenido del editor:', error);
        return false;
    }
}

// ===== GUARDAR CONTENIDO DEL EDITOR =====
function saveEditorContent() {
    try {
        // Verificar si hay un paciente actual
        if (!currentPatientData || !currentPatientData.patientId) {
            console.log('No hay paciente actual, no se guardará el contenido');
            return false;
        }
        
        // Obtener el editor
        const editor = document.getElementById('medicalNoteEditor');
        if (!editor) {
            console.error('No se encontró el editor de notas médicas');
            return false;
        }
        
        // Obtener el contenido actual
        const content = editor.innerHTML;
        
        // Si el contenido está vacío, no guardar
        if (!content || content.trim() === '') {
            console.log('Contenido vacío, no se guardará');
            return false;
        }
        
        // Crear objeto con datos del borrador
        const draftData = {
            patientId: currentPatientData.patientId,
            content: content,
            timestamp: new Date().toISOString(),
            patientName: currentPatientData.name || currentPatientData.full_name,
            bedNumber: currentPatientData.bed_number
        };
        
        // Guardar en localStorage
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draftData));
        
        // Actualizar historial si es necesario
        if (editorHistory.length === 0 || editorHistory[editorHistory.length - 1] !== content) {
            editorHistory.push(content);
            historyIndex = editorHistory.length - 1;
            
            // Limitar tamaño del historial
            if (editorHistory.length > 20) {
                editorHistory.shift();
                historyIndex--;
            }
        }
        
        console.log('✅ Contenido guardado correctamente para paciente:', currentPatientData.patientId);
        return true;
    } catch (error) {
        console.error('Error guardando contenido del editor:', error);
        return false;
    }
}

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

        // Crear editor con sistema de firma (asume que el HTML ya está separado)
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

// ===== CREAR EDITOR CON SISTEMA DE FIRMA (SOLO LÓGICA) =====
function createMedicalNoteWithSignatureSystem(patientData) {
    // Validar que patientData exista
    if (!patientData) {
        console.error('❌ Error: No hay datos del paciente disponibles');
        patientData = {
            id: 'unknown',
            full_name: 'Paciente no identificado',
            hc_number: 'Sin HC',
            bed_number: 'N/A',
            department: 'No asignado'
        };
    }
    
    // Registrar los datos del paciente en la consola para depuración
    console.log('📝 Datos del paciente para la nota médica:', patientData);
    
    // Esta función ahora solo retorna el HTML dinámico
    // Los estilos CSS están en archivo separado
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
                        <td class="value"><strong>${patientData.full_name || 'Paciente sin nombre'}</strong></td>
                        <td class="label">HC:</td>
                        <td class="value">${patientData.hc_number || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td class="label">EDAD:</td>
                        <td class="value">${patientData.age ? patientData.age + ' años' : '---'}</td>
                        <td class="label">SEXO:</td>
                        <td class="value">${patientData.gender || '---'}</td>
                    </tr>
                    <tr>
                        <td class="label">CAMA:</td>
                        <td class="value"><strong>${patientData.bed_number || '---'}</strong></td>
                        <td class="label">SERVICIO:</td>
                        <td class="value">${patientData.department || '---'}</td>
                    </tr>
                    <tr>
                        <td class="label">DIAGNÓSTICO:</td>
                        <td class="value" colspan="3">${patientData.diagnosis || 'Diagnóstico pendiente'}</td>
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

            <!-- HERRAMIENTAS DEL EDITOR -->
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
                    <button type="button" class="tool-btn" onclick="testLocalStorage()" title="Probar guardado/carga">
                        <i class="fas fa-save"></i>
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
                
                // Limpiar localStorage
                localStorage.removeItem(LOCAL_STORAGE_KEY);
                console.log('🗑️ Editor limpiado y localStorage eliminado');
                
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
<div style="margin: 10px 0; text-align: left;">
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
    
    // Guardar en localStorage después de insertar plantilla
    saveEditorContent();
}

function insertExamTemplate() {
    const template = `
<div style="margin: 10px 0; text-align: left;">
    <h4 style="color: #2c5aa0; margin-bottom: 5px;">💉 EXAMEN FÍSICO</h4>
    <p><strong>Fecha:</strong> ${getCurrentDate()} | <strong>Hora:</strong> ${getCurrentTime()}</p>
    <hr>
    
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
    console.log('💉 Plantilla de examen físico insertada');
    
    // Guardar en localStorage después de insertar plantilla
    saveEditorContent();
}

function insertPlanTemplate() {
    const template = `
<div style="margin: 10px 0; text-align: left;">
    <h4 style="color: #2c5aa0; margin-bottom: 5px;">📋 PLAN MÉDICO</h4>
    <p><strong>Fecha:</strong> ${getCurrentDate()} | <strong>Hora:</strong> ${getCurrentTime()}</p>
    <hr>
    
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
    
    // Guardar en localStorage después de insertar plantilla
    saveEditorContent();
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
        // Verificar si patientData existe y tiene la estructura correcta
        if (!patientData || !patientData.current_vitals) {
            console.warn(`⚠️ No hay datos de signos vitales disponibles para ${category}.${field}`);
            return '---';
        }
        
        // Verificar si la categoría existe
        if (!patientData.current_vitals[category]) {
            console.warn(`⚠️ Categoría de signo vital no encontrada: ${category}`);
            return '---';
        }
        
        // Obtener el valor del campo específico
        const value = patientData.current_vitals[category][field];
        
        // Si el valor es undefined, null o vacío, devolver '---'
        if (value === undefined || value === null || value === '') {
            return '---';
        }
        
        // Formatear el valor según la categoría y el campo
        if (category === 'temperature') {
            // Formatear temperatura a 1 decimal
            return parseFloat(value).toFixed(1);
        } else if (category === 'blood_pressure' && (field === 'systolic' || field === 'diastolic')) {
            // Asegurar que la presión arterial sea un número entero
            return Math.round(parseFloat(value));
        } else if (category === 'oxygen_saturation') {
            // Asegurar que la saturación sea un número entero
            return Math.round(parseFloat(value));
        } else {
            // Para otros valores, devolver tal cual
            return value;
        }
    } catch (error) {
        console.error('❌ Error al obtener valor de signo vital:', error);
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
    console.log(`💬 Texto insertado: ${text.substring(0, 20)}${text.length > 20 ? '...' : ''}`);
    
    // Guardar en localStorage después de insertar texto dictado
    // Usamos setTimeout para no guardar demasiado frecuentemente durante dictado continuo
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveEditorContent();
    }, 2000); // Esperar 2 segundos después de la última inserción de texto
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
                
                // Guardar en localStorage después de insertar imagen
                saveEditorContent();
            }
            
            console.log('💾️ Imagen insertada en nota médica');
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
        // Asegurarse de que el editor tenga el atributo contenteditable
        editor.setAttribute('contenteditable', 'true');
        
        // Cargar contenido guardado en localStorage
        loadEditorContent();
        
        // Actualizar la información del paciente
        if (patientData) {
            updatePatientInfoDisplay(patientData);
        }
        
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
        
        // Guardar cuando se edita el contenido
        editor.addEventListener('input', function() {
            // Usamos setTimeout para no guardar demasiado frecuentemente durante edición continua
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                saveEditorContent();
            }, 2000); // Esperar 2 segundos después de la última edición
        });
        
        // Configurar autoguardado cada 30 segundos
        const autoSaveInterval = setInterval(() => {
            saveEditorContent();
        }, AUTO_SAVE_INTERVAL);
        
        // Guardar al salir de la página
        window.addEventListener('beforeunload', () => {
            saveEditorContent();
            clearInterval(autoSaveInterval);
        });
    } else {
        console.error('❌ Editor no encontrado en initializeEditorWithSignature');
    }
    
    // Inicializar canvas de firma
    initializeSignatureCanvas();
}

// ===== CANVAS DE FIRMA =====
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
        
        // Intentar obtener datos reales del paciente desde la API
        try {
            const apiUrl = `/api/patients/${patientId}?bed=${bedNumber}`;
            console.log(`🌐 Intentando obtener datos reales desde: ${apiUrl}`);
            
            const response = await fetch(apiUrl);
            
            if (response.ok) {
                const realPatientData = await response.json();
                console.log('✅ Datos reales del paciente obtenidos con éxito');
                return realPatientData;
            } else {
                console.warn(`⚠️ No se pudieron obtener datos reales. Status: ${response.status}`);
                // Continuar con datos de prueba si la API falla
            }
        } catch (apiError) {
            console.warn('⚠️ Error al conectar con la API:', apiError);
            // Continuar con datos de prueba si hay error de conexión
        }
        
        // Si no se pudieron obtener datos reales, usar datos de prueba
        console.log('📑 Usando datos de prueba para el paciente');
        
        // Datos de prueba pero con el ID y número de cama correctos
        const mockPatientData = {
            id: patientId,
            full_name: `Paciente de Cama ${bedNumber}`,
            hc_number: `HC-${patientId}`,
            age: '58',
            gender: 'Masculino',
            bed_number: bedNumber,
            department: 'Medicina Interna',
            diagnosis: 'Diagnóstico pendiente',
            hospital_name: 'Hospital Central',
            hospital_address: 'Av. Hospitales 123',
            current_vitals: {
                blood_pressure: {
                    systolic: 120,
                    diastolic: 80
                },
                heart_rate: {
                    value: 75
                },
                respiratory_rate: {
                    value: 16
                },
                temperature: {
                    value: 36.5
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

// ===== MANEJO DEL CIERRE DE LA VENTANA =====
function handleWindowClose() {
    console.log('🚪 Manejando cierre de ventana de nota médica');
    
    // Guardar el contenido actual antes de cerrar
    saveEditorContent();
    
    // No es necesario limpiar localStorage aquí, ya que ahora usamos IDs de paciente
    // para controlar qué contenido se carga
    
    return true;
}

// ===== INICIALIZACIÓN AUTOMÁTICA AL CARGAR LA PÁGINA =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando editor de notas médicas...');
    
    // Inicializar editor
    initializeEditor();
    
    // Cargar datos del paciente
    loadPatientInfo();
    
    // Cargar contenido guardado si existe
    loadEditorContent();
    
    // Configurar botones de volver
    setupBackButtonsForNotaMedica();
    
    // Inicializar el editor y el canvas de firma
    initializeSignatureCanvas();
    
    // Configurar el botón de volver a rondas
    const backButton = document.querySelector('.back-to-rounds-btn');
    if (backButton) {
        backButton.addEventListener('click', function(e) {
            // Guardar antes de cerrar
            saveEditorContent();
            console.log('🔙 Volviendo a rondas médicas');
            // window.close() ya está en el onclick del HTML
        });
    }
    
    // Manejar cierre de ventana
    window.addEventListener('beforeunload', handleWindowClose);
    
    // Obtener el editor
    const editor = document.getElementById('medicalNoteEditor');
    if (editor) {
        // Asegurarse de que el editor tenga el atributo contenteditable
        editor.setAttribute('contenteditable', 'true');
        
        // Configurar eventos del editor
        editor.addEventListener('input', function() {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                saveEditorContent();
            }, 2000);
        });
        
        // Cargar datos del paciente desde la URL y localStorage
        console.log('🔍 Cargando datos del paciente desde URL y localStorage...');
        
        // Obtener parámetros de la URL y mostrar la URL completa para depuración
        console.log('URL completa:', window.location.href);
        
        // Obtener todos los parámetros de la URL para depuración
        const allUrlParams = {};
        const searchParams = new URLSearchParams(window.location.search);
        for (const [key, value] of searchParams.entries()) {
            allUrlParams[key] = value;
        }
        console.log('Todos los parámetros de URL:', allUrlParams);
        
        // Obtener parámetros específicos
        const urlParams = getUrlParameters();
        const bedNumber = urlParams.bedNumber;
        const patientId = urlParams.patientId;
        
        console.log('Parámetros procesados:', { bedNumber, patientId });
        
        // Crear un objeto de datos del paciente con la información de la URL
        let minimalPatientData = null;
        
        if (patientId) {
            // Obtener todos los parámetros de la URL
            const urlParams = getUrlParameters();
            
            minimalPatientData = {
                id: patientId,
                patientId: patientId,
                patient_id: patientId,
                bed_number: bedNumber || 'No asignada',
                bedNumber: bedNumber || 'No asignada',
                name: urlParams.name || 'Paciente',
                full_name: urlParams.name || 'Paciente',
                diagnosis: urlParams.diagnosis || 'Pendiente de evaluación',
                department: urlParams.department || 'Medicina General',
                hc_number: urlParams.hc || 'HC-TEMP',
                age: urlParams.age || '---',
                gender: urlParams.gender || '---'
            };
            
            console.log('📝 Datos del paciente desde URL:', minimalPatientData);
        }
        
        // Intentar obtener datos completos del localStorage
        let patientDataFromStorage = null;
        
        if (patientId) {
            // Buscar en todas las posibles ubicaciones
            const patientKey = `patient_${patientId}`;
            const storageLocations = [
                { name: 'patient_specific', data: localStorage.getItem(patientKey) },
                { name: 'currentPatientData', data: localStorage.getItem('currentPatientData') },
                { name: 'medicalNotePatientData', data: localStorage.getItem('medicalNotePatientData') },
                { name: 'notePatientData', data: sessionStorage.getItem('notePatientData') }
            ];
            
            // Mostrar todas las ubicaciones para depuración
            storageLocations.forEach(location => {
                console.log(`Datos en ${location.name}:`, location.data ? 'Encontrados' : 'No encontrados');
            });
            
            // Encontrar la primera ubicación con datos
            const foundLocation = storageLocations.find(location => location.data);
            
            if (foundLocation) {
                try {
                    patientDataFromStorage = JSON.parse(foundLocation.data);
                    console.log(`✅ Datos del paciente encontrados en ${foundLocation.name}:`, patientDataFromStorage);
                } catch (error) {
                    console.error(`❌ Error parseando datos del paciente desde ${foundLocation.name}:`, error);
                }
            } else {
                console.log('⚠️ No se encontraron datos del paciente en ninguna ubicación de almacenamiento');
            }
        }
        
        // Usar los datos más completos disponibles
        const patientData = patientDataFromStorage || minimalPatientData;
        
        if (patientData) {
            console.log('💾 Usando datos del paciente para actualizar interfaz:', patientData);
            
            // Guardar en variable global para acceso desde otras funciones
            currentPatientData = patientData;
            
            // Actualizar la interfaz con los datos del paciente
            updatePatientInfoDisplay(patientData);
            
            // Cargar contenido guardado para este paciente
            const currentPatientId = patientData.id || patientData.patient_id || patientData.patientId;
            if (currentPatientId) {
                loadEditorContent(currentPatientId);
            }
        } else {
            console.error('❌ No se pudieron obtener datos del paciente de ninguna fuente');
        }
    } else {
        console.error('❌ Editor no encontrado en el DOM');
    }
    
    // Configurar los event listeners para los botones de formato
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Enfocar el editor antes de aplicar el formato
            if (editor) editor.focus();
            
            // Determinar qué acción ejecutar según el botón
            if (this.title.includes('Negrita')) formatText('bold');
            if (this.title.includes('Cursiva')) formatText('italic');
            if (this.title.includes('Subrayado')) formatText('underline');
            
            // Alineación de texto
            if (this.title.includes('izquierda')) alignText('left');
            if (this.title.includes('Centrar')) alignText('center');
            if (this.title.includes('derecha')) alignText('right');
            if (this.title.includes('Justificar')) alignText('justify');
            
            // Listas
            if (this.title.includes('viñetas')) insertList('unordered');
            if (this.title.includes('numerada')) insertList('ordered');
            
            // Otras acciones
            if (this.title.includes('Limpiar todo')) clearEditor();
            if (this.title.includes('Deshacer')) undoLastAction();
            if (this.title.includes('Rehacer')) redoLastAction();
            if (this.title.includes('Separador')) insertDivider();
            
            // Guardar después de aplicar el formato
            saveEditorContent();
        });
    });
    
    // Inicializar botones de plantillas
    document.querySelectorAll('.template-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Enfocar el editor antes de insertar la plantilla
            if (editor) editor.focus();
            
            if (this.title.includes('SOAP')) insertSOAPTemplate();
            if (this.title.includes('Examen')) insertExamTemplate();
            if (this.title.includes('Plan')) insertPlanTemplate();
            
            // Guardar después de insertar la plantilla
            saveEditorContent();
        });
    });
    
    // Inicializar otros componentes específicos
    const microphoneBtn = document.getElementById('microphoneBtn');
    if (microphoneBtn) {
        microphoneBtn.addEventListener('click', toggleSpeechRecognition);
    }
    
    const imageInput = document.getElementById('imageInput');
    if (imageInput) {
        imageInput.addEventListener('change', function() { 
            insertImageInNote(this);
            // Guardar después de insertar la imagen
            saveEditorContent();
        });
    }
    
    const clearSignatureBtn = document.querySelector('.btn-clear-signature');
    if (clearSignatureBtn) {
        clearSignatureBtn.addEventListener('click', clearSignature);
    }
    
    // Agregar botón para probar localStorage
    const testStorageBtn = document.getElementById('testLocalStorage');
    if (testStorageBtn) {
        testStorageBtn.addEventListener('click', testLocalStorage);
    }
    
    // Configurar autoguardado cada 30 segundos
    const autoSaveInterval = setInterval(() => {
        saveEditorContent();
    }, AUTO_SAVE_INTERVAL);
    
    // Guardar al salir de la página
    window.addEventListener('beforeunload', () => {
        saveEditorContent();
        clearInterval(autoSaveInterval);
    });
    
    console.log('✅ Editor de notas médicas inicializado correctamente');
});

// ===== FUNCIONES DE ALMACENAMIENTO LOCAL =====
/**
 * Función para probar el guardado y carga de localStorage
 */
function testLocalStorage() {
    Swal.fire({
        title: 'Prueba de localStorage',
        html: `
            <div style="text-align: left; margin-bottom: 20px;">
                <p>Esta función permite probar el guardado y carga de contenido en localStorage.</p>
                <p>Seleccione una opción:</p>
            </div>
        `,
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Guardar ahora',
        denyButtonText: 'Cargar contenido',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            // Guardar contenido actual
            saveEditorContent();
            Swal.fire('Guardado', 'El contenido ha sido guardado en localStorage', 'success');
        } else if (result.isDenied) {
            // Cargar contenido guardado
            loadEditorContent();
            Swal.fire('Cargado', 'Se ha cargado el contenido desde localStorage', 'info');
        }
    });
}

/**
 * Guarda el contenido del editor en localStorage junto con el ID del paciente actual
 */
function saveEditorContent() {
    const editor = document.getElementById('medicalNoteEditor');
    if (!editor) {
        console.error('❌ Editor no encontrado al intentar guardar');
        return;
    }
    
    const content = editor.innerHTML;
    
    // No guardar si el contenido está vacío o es igual al último guardado
    if (!content || content.trim() === '') {
        console.log('⚠️ No se guardó contenido vacío');
        return;
    }
    
    // Verificar si el contenido ha cambiado antes de guardar
    const lastSaved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (lastSaved === content) {
        console.log('ℹ️ Contenido sin cambios, no se guarda');
        return;
    }
    
    try {
        // Obtener ID del paciente actual
        const currentPatientDataStr = localStorage.getItem('medicalNotePatientData') || 
                                    sessionStorage.getItem('notePatientData') || 
                                    localStorage.getItem('currentPatientData');
        
        if (currentPatientDataStr) {
            const currentPatientData = JSON.parse(currentPatientDataStr);
            const currentPatientId = currentPatientData.id || currentPatientData.patient_id || currentPatientData.patientId;
            
            if (currentPatientId) {
                // Guardar el ID del paciente actual para referencia futura
                localStorage.setItem('lastNotePatientId', currentPatientId);
                console.log(`🔑 ID del paciente guardado: ${currentPatientId}`);
            }
        }
    } catch (e) {
        console.error('❌ Error al guardar ID del paciente:', e);
    }
    
    // Guardar en localStorage
    localStorage.setItem(LOCAL_STORAGE_KEY, content);
    console.log('💾 Contenido guardado en localStorage');
    
    // Guardar en el historial para deshacer/rehacer
    if (editorHistory.length === 0 || editorHistory[editorHistory.length - 1] !== content) {
        // Eliminar estados futuros si estamos en medio del historial
        if (historyIndex < editorHistory.length - 1) {
            editorHistory = editorHistory.slice(0, historyIndex + 1);
        }
        
        // Añadir nuevo estado
        editorHistory.push(content);
        historyIndex = editorHistory.length - 1;
        
        // Limitar tamaño del historial
        if (editorHistory.length > 50) {
            editorHistory.shift();
            historyIndex--;
        }
    }
    
    // Mostrar notificación sutil
    showSaveNotification();
}

/**
 * Carga el contenido guardado en localStorage al editor
 * Solo carga el contenido si corresponde al paciente actual
 */
function loadEditorContent() {
    const editor = document.getElementById('medicalNoteEditor');
    if (!editor) {
        console.error('❌ Editor no encontrado al intentar cargar contenido');
        return;
    }
    
    try {
        // Obtener ID del paciente actual
        const currentPatientDataStr = localStorage.getItem('medicalNotePatientData') || 
                                     sessionStorage.getItem('notePatientData') || 
                                     localStorage.getItem('currentPatientData');
        
        if (!currentPatientDataStr) {
            console.log('⚠️ No se encontraron datos del paciente actual');
            return;
        }
        
        const currentPatientData = JSON.parse(currentPatientDataStr);
        const currentPatientId = currentPatientData.id || currentPatientData.patient_id || currentPatientData.patientId;
        
        if (!currentPatientId) {
            console.log('⚠️ No se pudo determinar el ID del paciente actual');
            return;
        }
        
        // Verificar si tenemos el ID del paciente de la nota guardada
        const savedPatientId = localStorage.getItem('lastNotePatientId');
        
        // Solo cargar el contenido si es del mismo paciente
        if (savedPatientId && savedPatientId === currentPatientId) {
            const savedContent = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedContent && savedContent.trim() !== '') {
                editor.innerHTML = savedContent;
                console.log(`📂 Contenido cargado desde localStorage para paciente ID: ${currentPatientId}`);
                
                // Guardar en el historial para deshacer/rehacer
                if (editorHistory.length === 0 || editorHistory[editorHistory.length - 1] !== savedContent) {
                    editorHistory.push(savedContent);
                    historyIndex = editorHistory.length - 1;
                }
                
                // Mostrar notificación de carga
                showLoadNotification();
            } else {
                console.log('📭 No hay contenido guardado para este paciente');
            }
        } else {
            console.log(`🔄 Paciente diferente detectado. No se cargará contenido anterior.`);
            console.log(`   Paciente actual: ${currentPatientId}, Paciente de nota guardada: ${savedPatientId || 'ninguno'}`);
            // Limpiar el editor para el nuevo paciente
            editor.innerHTML = '';
        }
        
        // Actualizar la información del paciente en la interfaz
        updatePatientInfoDisplay(currentPatientData);
        
    } catch (e) {
        console.error('❌ Error al cargar datos del paciente:', e);
    }
}

/**
 * Muestra una notificación sutil de guardado
 */
function showSaveNotification() {
    // Crear elemento de notificación si no existe
    let notification = document.getElementById('saveNotification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'saveNotification';
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = '#28a745';
        notification.style.color = 'white';
        notification.style.padding = '10px 15px';
        notification.style.borderRadius = '5px';
        notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        notification.style.zIndex = '9999';
        notification.style.transition = 'opacity 0.5s';
        notification.style.opacity = '0';
        document.body.appendChild(notification);
    }
    
    // Mostrar mensaje
    notification.textContent = '✓ Nota guardada automáticamente';
    notification.style.opacity = '1';
    
    // Ocultar después de 2 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
    }, 2000);
}

/**
 * Muestra una notificación de carga de contenido
 */
function showLoadNotification() {
    // Crear elemento de notificación si no existe
    let notification = document.getElementById('loadNotification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'loadNotification';
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = '#2c5aa0';
        notification.style.color = 'white';
        notification.style.padding = '10px 15px';
        notification.style.borderRadius = '5px';
        notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        notification.style.zIndex = '9999';
        notification.style.transition = 'opacity 0.5s';
        notification.style.opacity = '0';
        document.body.appendChild(notification);
    }
    
    // Mostrar mensaje
    notification.textContent = '📂 Borrador anterior cargado';
    notification.style.opacity = '1';
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
    }, 3000);
}

/**
 * Actualiza la información del paciente en la interfaz de la nota médica
 * @param {Object} patientData - Datos del paciente
 */
function updatePatientInfoDisplay(patientData) {
    if (!patientData) {
        console.warn('⚠️ No hay datos de paciente para mostrar');
        return;
    }
    
    console.log('🔄 Actualizando información del paciente en la interfaz', patientData);
    
    try {
        // Obtener todas las filas de la tabla de datos del paciente
        const table = document.querySelector('.patient-data-table');
        if (!table) {
            console.warn('⚠️ Tabla de datos del paciente no encontrada');
            return;
        }
        
        // Mapeo de campos para actualizar
        const patientFields = {
            // Nombre del paciente (primera fila, segunda celda)
            'PACIENTE:': patientData.name || patientData.full_name || 
                      `${patientData.personal_info?.first_name || ''} ${patientData.personal_info?.last_name || ''}`.trim() || 
                      patientData.patientName || 'No registrado',
                      
            // Historia clínica (primera fila, cuarta celda)
            'HC:': patientData.hc_number || patientData.medical_record || 
                 patientData.medical_info?.medical_record || 'No registrado',
                 
            // Edad (segunda fila, segunda celda)
            'EDAD:': (patientData.age || patientData.personal_info?.age || '---') + 
                   (typeof patientData.age === 'number' || typeof patientData.personal_info?.age === 'number' ? ' años' : ''),
                   
            // Sexo/Género (segunda fila, cuarta celda)
            'SEXO:': (() => {
                let gender = patientData.gender || patientData.personal_info?.gender || '---';
                if (gender === 'M') return 'Masculino';
                if (gender === 'F') return 'Femenino';
                return gender;
            })(),
            
            // Cama (tercera fila, segunda celda)
            'CAMA:': patientData.bed_number || patientData.bedNumber || '---',
            
            // Servicio/Departamento (tercera fila, cuarta celda)
            'SERVICIO:': patientData.department || patientData.room || 
                      patientData.medical_info?.department || 'Medicina General',
                      
            // Diagnóstico (cuarta fila, segunda celda si existe)
            'DIAGNÓSTICO:': (() => {
                // Verificar todas las posibles fuentes de diagnóstico
                console.log('🔍 Datos de diagnóstico disponibles:', {
                    diagnosis: patientData.diagnosis,
                    primary_diagnosis: patientData.medical_info?.primary_diagnosis,
                    diagnosisCode: patientData.diagnosisCode,
                    diagnosisText: patientData.diagnosisText
                });
                
                // Prioridad 1: Si hay diagnosis directamente
                if (patientData.diagnosis) {
                    return patientData.diagnosis;
                }
                
                // Prioridad 2: Si hay diagnóstico en medical_info
                if (patientData.medical_info?.primary_diagnosis) {
                    return patientData.medical_info.primary_diagnosis;
                }
                
                // Prioridad 3: Si hay código y texto de diagnóstico
                if (patientData.diagnosisCode || patientData.diagnosisText) {
                    const code = patientData.diagnosisCode || '';
                    const text = patientData.diagnosisText || '';
                    
                    if (code && text) {
                        return `${code} - ${text}`;
                    } else if (code) {
                        return code;
                    } else if (text) {
                        return text;
                    }
                }
                
                // Valor por defecto
                return 'Pendiente de evaluación';
            })()
        };
        
        // Recorrer todas las filas de la tabla
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
            const label = row.querySelector('td:first-child');
            const value = row.querySelector('td:nth-child(2)');
            
            if (label && value && patientFields[label.textContent]) {
                value.textContent = patientFields[label.textContent];
            }
            
            // Manejar las celdas de la derecha en la misma fila
            const rightLabel = row.querySelector('td:nth-child(3)');
            const rightValue = row.querySelector('td:nth-child(4)');
            
            if (rightLabel && rightValue && patientFields[rightLabel.textContent]) {
                rightValue.textContent = patientFields[rightLabel.textContent];
            }
        });
        
        // Actualizar diagnóstico si existe un elemento con clase especial
        const diagnosisElement = document.querySelector('.diagnosis-value');
        if (diagnosisElement) {
            // Usar la misma lógica que para la tabla
            const diagnosisToShow = (() => {
                // Prioridad 1: Si hay diagnosis directamente
                if (patientData.diagnosis) {
                    return patientData.diagnosis;
                }
                
                // Prioridad 2: Si hay diagnóstico en medical_info
                if (patientData.medical_info?.primary_diagnosis) {
                    return patientData.medical_info.primary_diagnosis;
                }
                
                // Prioridad 3: Si hay código y texto de diagnóstico
                if (patientData.diagnosisCode || patientData.diagnosisText) {
                    const code = patientData.diagnosisCode || '';
                    const text = patientData.diagnosisText || '';
                    
                    if (code && text) {
                        return `${code} - ${text}`;
                    } else if (code) {
                        return code;
                    } else if (text) {
                        return text;
                    }
                }
                
                // Valor por defecto
                return 'Pendiente de evaluación';
            })();
            
            diagnosisElement.textContent = diagnosisToShow;
            console.log('✅ Diagnóstico actualizado en elemento especial:', diagnosisToShow);
        }
        
        console.log('✅ Información del paciente actualizada correctamente');
    } catch (error) {
        console.error('❌ Error actualizando información del paciente:', error);
    }
}

