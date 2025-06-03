/**
 * common_navigation.js
 * Funciones comunes para navegación entre páginas del sistema hospitalario
 * Maneja el comportamiento de los botones "Volver" y la visualización del modal
 */

// ===== VARIABLES GLOBALES =====
let isMobileDevice = window.innerWidth < 768;

// Detectar cambios en el tamaño de la ventana
window.addEventListener('resize', function() {
    isMobileDevice = window.innerWidth < 768;
});

/**
 * Función para volver a la página de rondas médicas y mostrar el modal del paciente
 * @param {string} patientId - ID del paciente (opcional)
 * @param {string} bedNumber - Número de cama (opcional)
 */
function returnToMedicalRounds(patientId, bedNumber) {
    console.log('🔙 Ejecutando returnToMedicalRounds');
    
    // Intentar obtener los datos del paciente de diferentes fuentes
    const finalPatientId = patientId || 
                          sessionStorage.getItem('currentPatientId') || 
                          localStorage.getItem('currentPatientId');
                          
    const finalBedNumber = bedNumber || 
                         sessionStorage.getItem('currentBedNumber') || 
                         localStorage.getItem('currentBedNumber');
    
    console.log(`📝 Datos para navegación: patientId=${finalPatientId}, bedNumber=${finalBedNumber}`);
    
    if (!finalPatientId) {
        console.warn('⚠️ No se encontró ID del paciente para la navegación de regreso');
    }
    
    if (!finalBedNumber) {
        console.warn('⚠️ No se encontró número de cama para la navegación de regreso');
    }
    
    // Guardar información en sessionStorage para que se muestre el modal al volver
    sessionStorage.setItem('showPatientModalOnReturn', 'true');
    
    if (finalPatientId) {
        sessionStorage.setItem('returnPatientId', finalPatientId);
        // También guardar en localStorage para mayor robustez
        localStorage.setItem('returnPatientId', finalPatientId);
    }
    
    if (finalBedNumber) {
        sessionStorage.setItem('returnBedNumber', finalBedNumber);
        // También guardar en localStorage para mayor robustez
        localStorage.setItem('returnBedNumber', finalBedNumber);
    }
    
    // Asegurar que la bandera de mostrar modal esté configurada en localStorage también
    localStorage.setItem('showPatientModalOnReturn', 'true');
    
    console.log('🔜 Redirigiendo a rondas médicas con modal configurado');
    
    // Redirigir a la página de rondas médicas
    window.location.href = '/medical/rounds';
}

/**
 * Función para configurar los botones de volver en cualquier página
 * @param {Function} callback - Función a ejecutar cuando se hace clic en el botón volver
 */
function setupBackButtons(callback) {
    console.log('Configurando botones de volver con callback');
    
    // Buscar todos los botones de volver
    const backButtons = document.querySelectorAll('.back-btn, .btn-back, [data-action="back"]');
    
    if (backButtons.length === 0) {
        console.warn('No se encontraron botones de volver en la página');
    } else {
        console.log(`Encontrados ${backButtons.length} botones de volver`);
    }
    
    // Configurar cada botón
    backButtons.forEach(button => {
        // Eliminar manejadores de eventos anteriores
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Agregar nuevo manejador de eventos
        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Botón volver presionado');
            
            // Ejecutar callback si existe
            if (typeof callback === 'function') {
                const handled = callback();
                if (handled) return;
            }
            
            // Si no hay callback o no manejó la navegación, usar comportamiento por defecto
            const currentPatientId = sessionStorage.getItem('currentPatientId');
            const currentBedNumber = sessionStorage.getItem('currentBedNumber');
            returnToMedicalRounds(currentPatientId, currentBedNumber);
        });
    });
    
    console.log('✅ Botones de volver configurados correctamente');
}

/**
 * Función para verificar si se debe mostrar el modal al cargar la página de rondas médicas
 * Verifica tanto sessionStorage como localStorage para mayor robustez
 */
function checkShowPatientModalOnLoad() {
    // Solo ejecutar en la página de rondas médicas
    if (!window.location.pathname.includes('/medical/rounds')) {
        console.log('No estamos en la página de rondas médicas, no se mostrará modal');
        return;
    }
    
    console.log('Verificando si se debe mostrar modal del paciente...');
    
    // Verificar banderas en sessionStorage y localStorage
    const shouldShowModalSession = sessionStorage.getItem('showPatientModalOnReturn') === 'true';
    const shouldShowModalLocal = localStorage.getItem('showPatientModalOnReturn') === 'true';
    
    // Buscar ID del paciente y número de cama en múltiples fuentes
    const patientId = sessionStorage.getItem('returnPatientId') || 
                     localStorage.getItem('returnPatientId') || 
                     sessionStorage.getItem('currentPatientId') || 
                     localStorage.getItem('currentPatientId');
                     
    const bedNumber = sessionStorage.getItem('returnBedNumber') || 
                    localStorage.getItem('returnBedNumber') || 
                    sessionStorage.getItem('currentBedNumber') || 
                    localStorage.getItem('currentBedNumber');
    
    console.log(`Datos para modal: showModal=${shouldShowModalSession || shouldShowModalLocal}, patientId=${patientId}, bedNumber=${bedNumber}`);
    
    if ((shouldShowModalSession || shouldShowModalLocal) && patientId) {
        console.log('🔄 Mostrando modal del paciente después de volver');
        
        // Limpiar datos de sesión y localStorage
        sessionStorage.removeItem('showPatientModalOnReturn');
        sessionStorage.removeItem('returnPatientId');
        sessionStorage.removeItem('returnBedNumber');
        localStorage.removeItem('showPatientModalOnReturn');
        localStorage.removeItem('returnPatientId');
        localStorage.removeItem('returnBedNumber');
        
        // Esperar a que la página cargue completamente
        setTimeout(() => {
            // Verificar que el objeto medicalRounds esté disponible
            if (window.medicalRounds) {
                console.log('Objeto medicalRounds encontrado, intentando mostrar modal');
                
                // Intentar usar la función showPatientInfoByIds si existe
                if (typeof window.medicalRounds.showPatientInfoByIds === 'function') {
                    console.log(`Llamando a showPatientInfoByIds con bedNumber=${bedNumber}, patientId=${patientId}`);
                    window.medicalRounds.showPatientInfoByIds(bedNumber, patientId);
                } 
                // Intentar usar la función showPatientInfo si existe
                else if (typeof window.medicalRounds.showPatientInfo === 'function') {
                    console.log(`Llamando a showPatientInfo con patientId=${patientId}`);
                    window.medicalRounds.showPatientInfo(patientId);
                }
                else {
                    console.error('No se encontró función para mostrar el modal del paciente');
                }
            } else {
                console.error('Objeto medicalRounds no disponible');
            }
        }, 1000); // Aumentar el tiempo de espera para asegurar que la página esté completamente cargada
    }
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    checkShowPatientModalOnLoad();
});

// ARREGLO ESPECÍFICO PARA MÓVILES
function fixMobileButtons() {
    console.log('🔧 Arreglando botones para móvil...');
    
    // Detectar si estamos en móvil
    const isMobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile) {
        console.log('📱 No es móvil, no se necesitan arreglos');
        return;
    }
    
    console.log('📱 Dispositivo móvil detectado, aplicando arreglos...');
    
    // ARREGLAR TODOS LOS BOTONES
    const allButtons = document.querySelectorAll('button, .tool-btn, .btn-clear-signature, .btn-preview-note, .btn-print-note');
    
    allButtons.forEach((button, index) => {
        // Arreglos específicos para móvil
        button.style.touchAction = 'manipulation';
        button.style.webkitTapHighlightColor = 'rgba(0,0,0,0.1)';
        button.style.userSelect = 'none';
        button.style.webkitUserSelect = 'none';
        button.style.position = 'relative';
        button.style.zIndex = '100';
        
        // Área de toque más grande
        const currentHeight = parseInt(getComputedStyle(button).height);
        if (currentHeight < 44) {
            button.style.minHeight = '44px';
            button.style.minWidth = '44px';
        }
        
        // Remover y re-agregar eventos para evitar conflictos
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Re-asignar eventos específicos según el tipo de botón
        if (newButton.id === 'imageTableBtn') {
            setupImageTable();
        } else if (newButton.id === 'imagePaintBtn') {
            setupImagePaint();
        } else if (newButton.classList.contains('btn-clear-signature')) {
            setupDigitalSignature();
        } else if (newButton.classList.contains('btn-preview-note')) {
            setupMedicalNotePreview();
        } else if (newButton.classList.contains('btn-print-note')) {
            setupMedicalNotePrint();
        } else if (newButton.id === 'voiceRecorderBtn') {
            setupVoiceRecorder();
        }
        
        console.log(`✅ Botón ${index + 1} arreglado para móvil`);
    });
    
    // ARREGLAR CANVAS DE FIRMA ESPECÍFICAMENTE
    const signatureCanvas = document.getElementById('signatureCanvas');
    if (signatureCanvas) {
        signatureCanvas.style.touchAction = 'none';
        signatureCanvas.style.msTouchAction = 'none';
        signatureCanvas.style.webkitUserSelect = 'none';
        signatureCanvas.style.userSelect = 'none';
        
        console.log('✅ Canvas de firma arreglado para móvil');
    }
    
    // ARREGLAR EDITOR PRINCIPAL
    const editor = document.getElementById('medicalNoteEditor');
    if (editor) {
        editor.style.touchAction = 'manipulation';
        editor.style.webkitUserSelect = 'text';
        editor.style.userSelect = 'text';
        
        console.log('✅ Editor principal arreglado para móvil');
    }
    
    // FORZAR RE-INICIALIZACIÓN DE TODOS LOS SISTEMAS
    setTimeout(() => {
        console.log('🔄 Re-inicializando sistemas para móvil...');
        
        // Re-llamar todos los setups después del arreglo
        if (typeof setupTextFormatting === 'function') setupTextFormatting();
        if (typeof setupEditorActions === 'function') setupEditorActions();
        if (typeof setupImageTable === 'function') setupImageTable();
        if (typeof setupImagePaint === 'function') setupImagePaint();
        if (typeof setupDigitalSignature === 'function') setupDigitalSignature();
        if (typeof setupMedicalNotePreview === 'function') setupMedicalNotePreview();
        if (typeof setupMedicalNotePrint === 'function') setupMedicalNotePrint();
        if (typeof setupVoiceRecorder === 'function') setupVoiceRecorder();
        
        console.log('✅ Todos los sistemas re-inicializados para móvil');
    }, 500);
}

// EJECUTAR ARREGLO MÓVIL DESPUÉS DE QUE TODO ESTÉ CARGADO
document.addEventListener('DOMContentLoaded', function() {
    // Esperar un poco más para que todo esté listo
    setTimeout(fixMobileButtons, 1000);
});

// TAMBIÉN EJECUTAR EN RESIZE POR SI ACASO
window.addEventListener('resize', function() {
    const wasMobile = window.isMobileDevice;
    const isMobileNow = window.innerWidth < 768;
    
    if (!wasMobile && isMobileNow) {
        // Se cambió a móvil
        setTimeout(fixMobileButtons, 300);
    }
});

// FUNCIÓN PARA LLAMAR MANUALMENTE SI ES NECESARIO
window.fixMobileButtonsManual = fixMobileButtons;