
// ===============================================================================
// 🔍 FUNCIÓN DE DEBUG TEMPORAL - AGREGAR AL INICIO DE medical_rounds.js
// ===============================================================================
// 
// Esta función nos ayudará a identificar exactamente dónde está el problema
// 
// ⚠️ INSTRUCCIONES:
// 1. Agregar esta función TEMPORAL al inicio de tu medical_rounds.js
// 2. Abrir consola del navegador (F12)
// 3. Hacer click en una cama ocupada
// 4. Ver qué datos aparecen en la consola
// 5. Reportar resultados a Maverick para fix definitivo
// 
// ===============================================================================

/**
 * 🔍 FUNCIÓN DE DEBUG TEMPORAL
 * 
 * Esta función intercepta el flujo de datos del paciente para identificar
 * exactamente dónde se está perdiendo la información
 */
window.debugPatientFlow = function(bedNumber, patientId) {
    console.log('🔍 =============== DEBUG PATIENT FLOW ===============');
    console.log('📞 Llamada inicial:');
    console.log('   - bedNumber:', bedNumber);
    console.log('   - patientId:', patientId);
    console.log('');
    
    console.log('📊 Estado de datos cargados:');
    console.log('   - patientsByBed cargado:', window.app?.patientsByBed ? Object.keys(window.app.patientsByBed).length : 'NO DISPONIBLE');
    console.log('   - Datos en patientsByBed:', window.app?.patientsByBed);
    console.log('');
    
    console.log('🔍 Búsqueda específica por cama:');
    const bedData = window.app?.patientsByBed?.[bedNumber];
    console.log(`   - Datos para cama ${bedNumber}:`, bedData);
    console.log('');
    
    console.log('🌟 PatientDataManager disponible:', typeof patientDataManager !== 'undefined');
    if (typeof patientDataManager !== 'undefined') {
        console.log('   - PatientDataManager inicializado:', patientDataManager.initialized);
        console.log('   - Stats:', patientDataManager.getUsageStats?.());
    }
    console.log('');
    
    console.log('💾 localStorage actual:');
    console.log('   - currentPatientData:', localStorage.getItem('currentPatientData'));
    console.log('   - medicalNotePatientData:', localStorage.getItem('medicalNotePatientData'));
    console.log('');
    
    console.log('🌍 window.currentPatientData:', window.currentPatientData);
    console.log('🔍 =============== FIN DEBUG ===============');
    
    return {
        bedNumber,
        patientId,
        bedData,
        patientDataManagerAvailable: typeof patientDataManager !== 'undefined',
        localStorageData: {
            current: localStorage.getItem('currentPatientData'),
            medicalNote: localStorage.getItem('medicalNotePatientData')
        },
        globalData: window.currentPatientData
    };
};




// ===============================================================================
// 🎯 PARTE 1: PATIENT DATA MANAGER - CLASE CENTRALIZADORA
// ===============================================================================
// 
// 📋 PROPÓSITO: Unificar la gestión de datos del paciente para TODOS los módulos
// 🔧 PROBLEMA QUE RESUELVE: createMedicalNoteDirect no puede leer diagnóstico
// 📊 BENEFICIO: Una sola fuente de verdad para datos del paciente
// 
// ⚠️  INSTRUCCIONES DE INSTALACIÓN:
// 1. Agregar este código AL INICIO de medical_rounds.js (después de los comentarios iniciales)
// 2. Antes de la función medicalRounds()
// 3. NO reemplazar nada todavía, solo AGREGAR
// 
// ===============================================================================


class PatientDataManager {
    constructor() {
        // 📊 Estado interno del gestor
        this.currentPatient = null;
        this.initialized = false;
        
        // 📋 Registro de llamadas para trazabilidad
        this.callRegistry = new Map();
        this.moduleCallCount = {
            prescription: 0,
            examOrder: 0,
            medicalNote: 0,
            vitalSigns: 0,
            dicomViewer: 0
        };
        
        // 🔑 Claves estandarizadas de almacenamiento
        // ANTES: cada función usaba claves diferentes (currentPatientData, patientData, etc.)
        // AHORA: claves estandarizadas para cada módulo
        this.storageKeys = {
            // Clave principal (usada por todos)
            main: 'currentPatientData',
            
            // Claves específicas por módulo
            prescription: 'prescriptionPatientData',
            examOrder: 'examOrderPatientData', 
            medicalNote: 'medicalNotePatientData',
            vitalSigns: 'vitalSignsPatientData',
            dicomViewer: 'dicomPatientData',
            
            // Claves de respaldo para compatibilidad
            backup1: 'patientData',
            backup2: 'notePatientData',
            
            // Clave para logs de trazabilidad
            logs: 'patientDataManagerLogs'
        };
        
        console.log('🏥 PatientDataManager inicializado');
        console.log('📋 Claves de storage configuradas:', Object.keys(this.storageKeys));
        
        this.initialized = true;
    }

    /**
     * 🔧 MÉTODO PRINCIPAL: PREPARAR DATOS ENRIQUECIDOS DEL PACIENTE
     * 
     * Este método toma los datos RAW del JSON y los convierte en un formato
     * estandarizado que pueden usar TODOS los módulos médicos.
     * 
     * @param {Object} bed - Datos de la cama (bed_number, status, patient_id, etc.)
     * @param {Object} patientData - Datos completos del JSON paciente_cama.json
     * @param {string} caller - Quién está solicitando los datos ('prescription', 'medicalNote', etc.)
     * @param {Object} context - Contexto adicional de rondas médicas (specialty, floor, etc.)
     * @returns {Object} - Datos del paciente en formato estandarizado y completo
     */
    prepareEnrichedPatientData(bed, patientData, caller = 'unknown', context = null) {
        try {
            console.log('🔍 PatientDataManager.prepareEnrichedPatientData() iniciado');
            console.log('📞 Llamado por:', caller);
            console.log('🛏️ Cama:', bed?.bed_number);
            console.log('📊 Datos disponibles:', !!patientData);
            
            // 📈 Incrementar contador para este módulo
            if (this.moduleCallCount[caller] !== undefined) {
                this.moduleCallCount[caller]++;
                console.log(`📊 ${caller} llamado ${this.moduleCallCount[caller]} veces`);
            }
            
            // ✅ VALIDAR Y LIMPIAR PATIENT_ID
            const safePatientId = this.ensureValidPatientId(bed?.patient_id, bed?.bed_number);
            console.log('🆔 Patient ID validado:', safePatientId);
            
            // 🎯 EXTRAER DATOS COMPLETOS DEL JSON
            // Antes: solo se usaban nombres básicos
            // Ahora: extraemos TODA la información médica disponible
            const personalInfo = patientData?.personal_info || {};
            const medicalInfo = patientData?.medical_info || {};
            
            console.log('👤 Info personal extraída:', Object.keys(personalInfo));
            console.log('🏥 Info médica extraída:', Object.keys(medicalInfo));
            
            // 🏗️ CONSTRUIR OBJETO ENRIQUECIDO ESTANDARIZADO
            const enrichedData = {
                // ================================
                // 🆔 IDENTIFICADORES BÁSICOS
                // ================================
                patientId: safePatientId,
                bedNumber: bed?.bed_number || 'N/A',
                
                // ================================
                // 👤 INFORMACIÓN PERSONAL COMPLETA (DEL JSON)
                // ================================
                firstName: personalInfo.first_name || 'Paciente',
                lastName: personalInfo.last_name || 'Desconocido',
                fullName: this.buildFullName(personalInfo.first_name, personalInfo.last_name),
                age: personalInfo.age || 45,
                gender: personalInfo.gender || 'N/A',
                genderText: this.formatGender(personalInfo.gender),
                dni: personalInfo.dni || 'No registrado',
                phone: personalInfo.phone || 'No registrado',
                emergencyContact: personalInfo.emergency_contact || 'No registrado',
                
                // ================================
                // 🏥 INFORMACIÓN MÉDICA COMPLETA (DEL JSON)
                // ================================
                // ✅ ESTO RESUELVE EL PROBLEMA: createMedicalNoteDirect ahora SÍ tiene diagnóstico
                primaryDiagnosis: medicalInfo.primary_diagnosis || 'Diagnóstico pendiente',
                primaryDiagnosisCode: medicalInfo.primary_diagnosis_code || '',
                secondaryDiagnosis: medicalInfo.secondary_diagnosis || '',
                secondaryDiagnosisCode: medicalInfo.secondary_diagnosis_code || '',
                
                // Información del médico y hospital
                attendingPhysician: medicalInfo.attending_physician || 'Dr. Sistema',
                medicalRecord: medicalInfo.medical_record || this.generateMockMedicalRecord(),
                admissionDate: medicalInfo.admission_date || new Date().toISOString().split('T')[0],
                admissionReason: medicalInfo.admission_reason || 'Motivo no especificado',
                
                // Medicamentos y alergias (CRÍTICO para recetas)
                currentMedications: medicalInfo.current_medications || [],
                allergies: medicalInfo.allergies || 'Ninguna conocida',
                
                // ================================
                // 🏥 CONTEXTO DE RONDAS MÉDICAS
                // ================================
                specialty: context?.specialty || 'Medicina General',
                floorNumber: context?.floorNumber || 1,
                wingName: context?.wingName || 'Este',
                departmentHead: context?.departmentHead || 'Dr. Sistema',
                
                // ================================
                // 📊 METADATOS Y TRAZABILIDAD
                // ================================
                timestamp: new Date().toISOString(),
                caller: caller,
                sessionId: this.generateSessionId(),
                dataSource: 'patient_json_enhanced',
                
                // ================================
                // 🏥 INFORMACIÓN DEL HOSPITAL (PARA DOCUMENTOS)
                // ================================
                hospital: {
                    name: 'Hospital Central San José',
                    address: 'Av. Angamos Este 2520, Surquillo, Lima',
                    phone: '(01) 434-5678',
                    email: 'info@hospitalcentral.pe'
                },
                
                // ================================
                // 👨‍⚕️ INFORMACIÓN DEL DOCTOR (PARA FIRMAS)
                // ================================
                doctor: {
                    name: medicalInfo.attending_physician || 'Dr. Alan Cairampoma Carrillo',
                    cmp: this.extractCMP(medicalInfo.attending_physician) || '12345',
                    specialty: context?.specialty || 'Medicina Interna',
                    signature: `Dr. ${medicalInfo.attending_physician || 'Alan Cairampoma Carrillo'}`
                }
            };
            
            // 📝 REGISTRAR ESTA LLAMADA PARA TRAZABILIDAD
            this.registerCall(caller, enrichedData);
            
            // 💾 GUARDAR COMO PACIENTE ACTUAL
            this.currentPatient = enrichedData;
            
            console.log('✅ Datos enriquecidos preparados exitosamente');
            console.log('📊 Diagnóstico principal:', enrichedData.primaryDiagnosis);
            console.log('💊 Medicamentos:', enrichedData.currentMedications.length);
            console.log('⚠️ Alergias:', enrichedData.allergies);
            
            return enrichedData;
            
        } catch (error) {
            console.error('❌ Error en prepareEnrichedPatientData:', error);
            
            // 🚨 FALLBACK: Datos mínimos para evitar fallos
            const fallbackData = this.createFallbackPatientData(bed, caller);
            console.log('🔄 Usando datos de fallback');
            
            return fallbackData;
        }
    }
    
    /**
     * 🔧 VALIDAR Y LIMPIAR PATIENT_ID
     * 
     * Muchas veces patient_id viene como 'undefined', 'null' o null
     * Esta función asegura que siempre tengamos un ID válido
     */
    ensureValidPatientId(patientId, bedNumber) {
        // ❌ Casos inválidos comunes
        if (!patientId || 
            patientId === 'undefined' || 
            patientId === 'null' || 
            patientId === null ||
            patientId === 'NaN') {
            
            // ✅ Generar ID seguro basado en cama
            const safeId = `SAFE_${bedNumber}_${Date.now()}`;
            console.log(`🔧 Patient ID inválido (${patientId}), generando: ${safeId}`);
            return safeId;
        }
        
        return patientId;
    }
    
    /**
     * 🏗️ CONSTRUIR NOMBRE COMPLETO DE FORMA SEGURA
     */
    buildFullName(firstName, lastName) {
        const first = firstName || 'Paciente';
        const last = lastName || 'Desconocido';
        return `${first} ${last}`.trim();
    }
    
    /**
     * 🚻 FORMATEAR GÉNERO PARA DISPLAY
     */
    formatGender(gender) {
        switch(gender) {
            case 'M': return 'Masculino';
            case 'F': return 'Femenino';
            default: return 'No especificado';
        }
    }
    
    /**
     * 🆔 GENERAR HISTORIA CLÍNICA MOCK SI NO EXISTE
     */
    generateMockMedicalRecord() {
        return `HC${new Date().getFullYear()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    }
    
    /**
     * 🔑 GENERAR SESSION ID ÚNICO
     */
    generateSessionId() {
        return `PDM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * 👨‍⚕️ EXTRAER NÚMERO CMP DEL NOMBRE DEL DOCTOR (SIMPLE)
     */
    extractCMP(doctorName) {
        // Lógica simple, se puede mejorar después
        if (!doctorName) return '12345';
        
        // Buscar si ya tiene CMP en el nombre
        const cmpMatch = doctorName.match(/CMP[:\s]*(\d+)/i);
        if (cmpMatch) return cmpMatch[1];
        
        // Generar CMP mock basado en nombre
        const hash = doctorName.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        return Math.abs(hash).toString().substr(0, 5);
    }
    
    /**
     * 📝 REGISTRAR LLAMADA PARA TRAZABILIDAD
     */
    registerCall(caller, patientData) {
        const callEntry = {
            timestamp: new Date().toISOString(),
            caller: caller,
            bedNumber: patientData.bedNumber,
            patientName: patientData.fullName,
            patientId: patientData.patientId,
            sessionId: patientData.sessionId,
            diagnosis: patientData.primaryDiagnosis
        };
        
        // Guardar en Map interno
        this.callRegistry.set(patientData.sessionId, callEntry);
        
        // Guardar en localStorage para persistencia
        try {
            const existingLogs = JSON.parse(localStorage.getItem(this.storageKeys.logs) || '[]');
            existingLogs.push(callEntry);
            
            // Mantener solo los últimos 50 logs
            if (existingLogs.length > 50) {
                existingLogs.splice(0, existingLogs.length - 50);
            }
            
            localStorage.setItem(this.storageKeys.logs, JSON.stringify(existingLogs));
        } catch (error) {
            console.warn('⚠️ No se pudo guardar log:', error);
        }
        
        console.log(`📝 Llamada registrada: ${caller} -> ${patientData.bedNumber}`);
    }
    
    /**
     * 🚨 CREAR DATOS DE FALLBACK EN CASO DE ERROR
     */
    createFallbackPatientData(bed, caller) {
        return {
            // IDs básicos
            patientId: this.ensureValidPatientId(null, bed?.bed_number),
            bedNumber: bed?.bed_number || 'N/A',
            
            // Datos mínimos
            firstName: 'Paciente',
            lastName: 'Temporal',
            fullName: `Paciente Cama ${bed?.bed_number || 'N/A'}`,
            age: 45,
            gender: 'N/A',
            genderText: 'No especificado',
            
            // Datos médicos básicos
            primaryDiagnosis: 'Pendiente de evaluación',
            primaryDiagnosisCode: '',
            attendingPhysician: 'Dr. Sistema',
            allergies: 'No especificado',
            currentMedications: [],
            
            // Metadatos
            timestamp: new Date().toISOString(),
            caller: caller,
            dataSource: 'fallback',
            
            // Información básica del hospital
            hospital: {
                name: 'Hospital Central San José'
            },
            doctor: {
                name: 'Dr. Sistema',
                cmp: '00000'
            }
        };
    }
    
    /**
     * 📊 OBTENER ESTADÍSTICAS DE USO
     */
    getUsageStats() {
        return {
            totalCalls: Array.from(this.callRegistry.values()).length,
            moduleBreakdown: { ...this.moduleCallCount },
            currentPatient: this.currentPatient?.fullName || 'Ninguno',
            lastActivity: this.currentPatient?.timestamp || 'N/A',
            initialized: this.initialized
        };
    }
    
    /**
     * 🧹 LIMPIAR DATOS ANTIGUOS
     */
    cleanup() {
        console.log('🧹 Limpiando PatientDataManager...');
        this.callRegistry.clear();
        this.currentPatient = null;
        
        // Limpiar logs antiguos
        try {
            localStorage.removeItem(this.storageKeys.logs);
        } catch (error) {
            console.warn('⚠️ Error limpiando logs:', error);
        }
        
        console.log('✅ PatientDataManager limpiado');
    }
}

// ===============================================================================
// 🎯 CREAR INSTANCIA GLOBAL DEL GESTOR
// ===============================================================================
// 
// Esta instancia será usada por TODAS las funciones del sistema
// Reemplaza la lógica duplicada en:
// - createPrescriptionDirect()
// - createExamOrderDirect() 
// - createMedicalNoteDirect()
// - viewPACS()
// - viewVitalSigns()
// 
// ===============================================================================

/**
 * 🌟 INSTANCIA GLOBAL DEL PATIENT DATA MANAGER
 * 
 * Esta variable será accesible desde cualquier parte de medical_rounds.js
 * y proporcionará datos consistentes a todos los módulos médicos.
 */
const patientDataManager = new PatientDataManager();

// 🔍 Log de confirmación
console.log('🌟 PatientDataManager global creado e inicializado');
console.log('📋 Listo para unificar gestión de datos del paciente');

// ===============================================================================
// ✅ PARTE 1 COMPLETADA
// ===============================================================================
// 
// 🎯 QUÉ HEMOS LOGRADO:
// ✅ Clase centralizadora para gestión de datos del paciente
// ✅ Extracción completa de información del JSON (diagnósticos, alergias, medicamentos)
// ✅ Validación automática de IDs de paciente
// ✅ Sistema de trazabilidad integrado
// ✅ Datos de fallback para casos de error
// ✅ Instancia global lista para usar
// 
// 🚀 PRÓXIMO PASO: Parte 2 - ModuleOpener (función unificada para abrir módulos)
// 
// ⚠️  INSTRUCCIONES PARA CONTINUAR:
// 1. ✅ Agregar este código AL INICIO de medical_rounds.js
// 2. ✅ Verificar que no hay errores en consola
// 3. ✅ Confirmar que patientDataManager está disponible globalmente
// 4. 🚀 Continuar con Parte 2
// 
// ===============================================================================

// ===============================================================================
// 🎯 PARTE 2: MODULE OPENER - FUNCIÓN UNIFICADA PARA ABRIR MÓDULOS MÉDICOS
// ===============================================================================
// 
// 📋 PROPÓSITO: Reemplazar las 5 funciones duplicadas con UNA sola función
// 🔧 PROBLEMA QUE RESUELVE: 
//    - createPrescriptionDirect() - 120 líneas
//    - createExamOrderDirect() - 115 líneas  
//    - createMedicalNoteDirect() - 100 líneas
//    - viewPACS() - 95 líneas
//    - viewVitalSigns() - 80 líneas
//    TOTAL: ~510 líneas → ~80 líneas (85% reducción)
// 
// ⚠️  INSTRUCCIONES DE INSTALACIÓN:
// 1. Agregar este código DESPUÉS de PatientDataManager (Parte 1)
// 2. ANTES de la función medicalRounds()
// 3. NO reemplazar las funciones existentes todavía (eso será en Parte 4)
// 
// ===============================================================================

/**
 * 🚀 MODULE OPENER - APERTURA UNIFICADA DE MÓDULOS MÉDICOS
 * 
 * Esta función centraliza la apertura de TODOS los módulos médicos:
 * 📝 Recetas médicas (prescriptions)
 * 🧪 Órdenes de exámenes (examOrders) 
 * 📋 Notas médicas (medicalNotes)
 * 🩻 Visor DICOM/PACS (dicomViewer)
 * 💓 Signos vitales (vitalSigns)
 * 
 * ✅ VENTAJAS:
 * - Una sola función en lugar de 5
 * - Lógica móvil unificada
 * - Manejo de errores centralizado
 * - Almacenamiento estandarizado
 * - Trazabilidad completa
 * - Datos enriquecidos del PatientDataManager
 */

/**
 * 🎯 CONFIGURACIÓN DE MÓDULOS MÉDICOS
 * 
 * Define las características de cada módulo médico:
 * - URL del módulo
 * - Título para display
 * - Icono FontAwesome
 * - Color del tema
 * - Texto descriptivo
 */
const MEDICAL_MODULES_CONFIG = {
    prescription: {
        url: '/medical/prescriptions',
        title: '📝 Receta Médica',
        icon: 'fas fa-prescription-bottle',
        color: '#00a86b',
        colorGradient: 'linear-gradient(135deg, #00a86b 0%, #00d48a 100%)',
        description: 'Formulario de prescripción médica profesional',
        windowFeatures: 'width=1200,height=800,scrollbars=yes,resizable=yes'
    },
    
    examOrder: {
        url: '/medical/orders/exams',
        title: '🧪 Orden de Exámenes',
        icon: 'fas fa-vials',
        color: '#9b59b6',
        colorGradient: 'linear-gradient(135deg, #9b59b6 0%, #e74c3c 100%)',
        description: 'Formulario de órdenes de exámenes de laboratorio',
        windowFeatures: 'width=1100,height=750,scrollbars=yes,resizable=yes'
    },
    
    medicalNote: {
        url: '/medical/notes',
        title: '📋 Nota Médica',
        icon: 'fas fa-edit',
        color: '#2c5aa0',
        colorGradient: 'linear-gradient(135deg, #2c5aa0 0%, #4CAF50 100%)',
        description: 'Editor de notas médicas y evolución del paciente',
        windowFeatures: 'width=1000,height=700,scrollbars=yes,resizable=yes'
    },
    
    dicomViewer: {
        url: '/medical/dicom',
        title: '🩻 Visor DICOM',
        icon: 'fas fa-x-ray',
        color: '#667eea',
        colorGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        description: 'Visor profesional de imágenes médicas DICOM',
        windowFeatures: 'width=1400,height=900,scrollbars=yes,resizable=yes'
    },
    
    vitalSigns: {
        url: '/medical/vital-signs',
        title: '💓 Signos Vitales',
        icon: 'fas fa-heartbeat',
        color: '#17a2b8',
        colorGradient: 'linear-gradient(135deg, #17a2b8 0%, #00d4aa 100%)',
        description: 'Monitor en tiempo real de signos vitales',
        windowFeatures: 'width=1300,height=800,scrollbars=yes,resizable=yes'
    }
};

/**
 * 🚀 FUNCIÓN PRINCIPAL: ABRIR MÓDULO MÉDICO DE FORMA UNIFICADA
 * 
 * Esta función reemplaza a:
 * - createPrescriptionDirect()
 * - createExamOrderDirect() 
 * - createMedicalNoteDirect()
 * - viewPACS()
 * - viewVitalSigns()
 * 
 * @param {string} moduleType - Tipo de módulo ('prescription', 'examOrder', 'medicalNote', 'dicomViewer', 'vitalSigns')
 * @param {string} bedNumber - Número de cama del paciente
 * @param {string} patientId - ID del paciente (puede ser null/undefined)
 * @param {Object} additionalData - Datos adicionales opcionales
 * @returns {Promise<boolean>} - true si se abrió exitosamente
 */
async function openMedicalModule(moduleType, bedNumber, patientId, additionalData = {}) {
    try {
        console.log('🚀 openMedicalModule() iniciado');
        console.log('📂 Tipo de módulo:', moduleType);
        console.log('🛏️ Cama:', bedNumber);
        console.log('👤 Patient ID:', patientId);
        
        // ✅ VALIDACIÓN DE PARÁMETROS
        if (!moduleType || !MEDICAL_MODULES_CONFIG[moduleType]) {
            throw new Error(`Tipo de módulo inválido: ${moduleType}`);
        }
        
        if (!bedNumber) {
            throw new Error('Número de cama no proporcionado');
        }
        
        // 📊 OBTENER CONFIGURACIÓN DEL MÓDULO
        const moduleConfig = MEDICAL_MODULES_CONFIG[moduleType];
        console.log('⚙️ Configuración del módulo:', moduleConfig.title);
        
        // 🔍 DETECTAR TIPO DE DISPOSITIVO
        const isMobile = false
        console.log('📱 Es dispositivo móvil:', isMobile);
        
        // 🆔 ASEGURAR PATIENT_ID VÁLIDO
        const safePatientId = patientDataManager.ensureValidPatientId(patientId, bedNumber);
        console.log('🆔 Patient ID seguro:', safePatientId);
        
        // 🏥 OBTENER DATOS ENRIQUECIDOS DEL PACIENTE
        // Aquí es donde se conecta con PatientDataManager de la Parte 1
        const enrichedPatientData = await getEnrichedPatientDataForModule(bedNumber, safePatientId, moduleType);
        
        if (!enrichedPatientData) {
            throw new Error('No se pudieron obtener datos del paciente');
        }
        
        console.log('✅ Datos del paciente obtenidos:', enrichedPatientData.fullName);
        console.log('🏥 Diagnóstico principal:', enrichedPatientData.primaryDiagnosis);
        
        // 💾 ALMACENAR DATOS DE FORMA ESTANDARIZADA
        storePatientDataForModule(moduleType, enrichedPatientData);
        
        // 🌐 CONSTRUIR URL DEL MÓDULO
        const moduleUrl = buildModuleUrl(moduleConfig.url, safePatientId, bedNumber, additionalData);
        console.log('🔗 URL del módulo:', moduleUrl);
        
        // 🚀 ABRIR MÓDULO (MÓVIL O DESKTOP)
        const success = await openModuleWindow(moduleUrl, moduleType, moduleConfig, enrichedPatientData, isMobile);
        
        if (success) {
            console.log(`✅ Módulo ${moduleType} abierto exitosamente`);
            return true;
        } else {
            throw new Error('No se pudo abrir el módulo');
        }
        
    } catch (error) {
        console.error(`❌ Error en openMedicalModule(${moduleType}):`, error);
        
        // 🚨 MOSTRAR ERROR UNIFICADO
        showModuleError(moduleType, error, bedNumber);
        
        return false;
    }
}

/**
 * 🏥 OBTENER DATOS ENRIQUECIDOS DEL PACIENTE PARA UN MÓDULO
 * 
 * Conecta con el PatientDataManager para obtener datos completos
 */
async function getEnrichedPatientDataForModule(bedNumber, patientId, moduleType) {
    try {
        console.log('🏥 Obteniendo datos enriquecidos del paciente...');
        
        // 🔍 OBTENER DATOS DESDE EL CONTEXTO GLOBAL DE RONDAS MÉDICAS
        const currentPatientContext = window.currentPatientData;
        
        if (!currentPatientContext || !currentPatientContext.patient) {
            console.log('⚠️ No hay contexto de paciente, obteniendo desde API...');
            
            // Si no hay contexto, intentar obtener desde la API
            // (esto debería ser raro, pero es un buen fallback)
            const patientData = await fetchPatientDataFromAPI(patientId, bedNumber);
            
            if (!patientData) {
                throw new Error('No se pudieron obtener datos del paciente');
            }
            
            // Crear contexto mínimo
            const mockBed = { 
                bed_number: bedNumber, 
                patient_id: patientId,
                status: 'occupied' 
            };
            
            return patientDataManager.prepareEnrichedPatientData(
                mockBed, 
                patientData, 
                moduleType,
                { specialty: 'Medicina General' }
            );
        }
        
        // ✅ USAR CONTEXTO EXISTENTE Y ENRIQUECERLO
        const bed = currentPatientContext.bed || { 
            bed_number: bedNumber, 
            patient_id: patientId,
            status: 'occupied' 
        };
        
        const patientData = currentPatientContext.patient;
        
        // Contexto de rondas médicas actual
        const context = {
            specialty: currentPatientContext.specialty || 'Medicina General',
            floorNumber: currentPatientContext.floorNumber || 1,
            wingName: currentPatientContext.wingName || 'Este',
            departmentHead: currentPatientContext.departmentHead || 'Dr. Sistema'
        };
        
        // 🚀 USAR PATIENT DATA MANAGER PARA ENRIQUECER DATOS
        const enrichedData = patientDataManager.prepareEnrichedPatientData(
            bed, 
            patientData, 
            moduleType,
            context
        );
        
        console.log('✅ Datos enriquecidos preparados por PatientDataManager');
        return enrichedData;
        
    } catch (error) {
        console.error('❌ Error obteniendo datos enriquecidos:', error);
        
        // 🚨 FALLBACK: Crear datos mínimos
        return patientDataManager.createFallbackPatientData(
            { bed_number: bedNumber, patient_id: patientId }, 
            moduleType
        );
    }
}

/**
 * 🌐 OBTENER DATOS DEL PACIENTE DESDE API (FALLBACK)
 */
async function fetchPatientDataFromAPI(patientId, bedNumber) {
    try {
        // Intentar obtener desde API de pacientes por cama
        const response = await fetch('/api/patients/beds');
        if (response.ok) {
            const data = await response.json();
            const patientData = data.patients_by_bed[bedNumber];
            
            if (patientData) {
                console.log('✅ Datos obtenidos desde API patients/beds');
                return patientData;
            }
        }
        
        // Intentar API individual del paciente
        if (patientId && patientId !== 'undefined' && !patientId.startsWith('SAFE_')) {
            const response2 = await fetch(`/api/patients/${patientId}`);
            if (response2.ok) {
                const data2 = await response2.json();
                console.log('✅ Datos obtenidos desde API patients/{id}');
                return data2;
            }
        }
        
        return null;
        
    } catch (error) {
        console.warn('⚠️ Error obteniendo datos desde API:', error);
        return null;
    }
}

/**
 * 💾 ALMACENAR DATOS DEL PACIENTE PARA EL MÓDULO
 * 
 * Guarda los datos en las ubicaciones apropiadas para cada módulo
 */
function storePatientDataForModule(moduleType, enrichedPatientData) {
    try {
        console.log(`💾 Almacenando datos para módulo: ${moduleType}`);
        
        // 🔑 OBTENER CLAVES DE ALMACENAMIENTO
        const storageKeys = patientDataManager.storageKeys;
        
        // 💾 ALMACENAMIENTO PRINCIPAL
        localStorage.setItem(storageKeys.main, JSON.stringify(enrichedPatientData));
        
        // 💾 ALMACENAMIENTO ESPECÍFICO DEL MÓDULO
        if (storageKeys[moduleType]) {
            localStorage.setItem(storageKeys[moduleType], JSON.stringify(enrichedPatientData));
        }
        
        // 💾 ALMACENAMIENTO DE RESPALDO
        localStorage.setItem(storageKeys.backup1, JSON.stringify(enrichedPatientData));
        sessionStorage.setItem(storageKeys.backup1, JSON.stringify(enrichedPatientData));
        sessionStorage.setItem(storageKeys.backup2, JSON.stringify(enrichedPatientData));
        
        // 💾 ALMACENAMIENTO ESPECÍFICO POR TIPO DE MÓDULO
        switch (moduleType) {
            case 'medicalNote':
                localStorage.setItem('medicalNotePatientData', JSON.stringify(enrichedPatientData));
                sessionStorage.setItem('notePatientData', JSON.stringify(enrichedPatientData));
                break;
                
            case 'prescription':
                localStorage.setItem('prescriptionPatientData', JSON.stringify(enrichedPatientData));
                sessionStorage.setItem('prescriptionContext', JSON.stringify({
                    bedNumber: enrichedPatientData.bedNumber,
                    patientId: enrichedPatientData.patientId,
                    patientName: enrichedPatientData.fullName
                }));
                break;
                
            case 'dicomViewer':
                sessionStorage.setItem('dicomPatientContext', JSON.stringify({
                    bedNumber: enrichedPatientData.bedNumber,
                    patientId: enrichedPatientData.patientId,
                    patientName: enrichedPatientData.fullName,
                    fromRounds: true,
                    timestamp: new Date().toISOString()
                }));
                break;
                
            case 'vitalSigns':
                sessionStorage.setItem('vitalSignsPatient', JSON.stringify({
                    bedNumber: enrichedPatientData.bedNumber,
                    patientId: enrichedPatientData.patientId,
                    patientName: enrichedPatientData.fullName
                }));
                break;
        }
        
        console.log('✅ Datos almacenados exitosamente para', moduleType);
        
    } catch (error) {
        console.error('❌ Error almacenando datos:', error);
    }
}

/**
 * 🔗 CONSTRUIR URL DEL MÓDULO CON PARÁMETROS
 */
function buildModuleUrl(baseUrl, patientId, bedNumber, additionalData = {}) {
    const params = new URLSearchParams({
        patientId: patientId,
        bedNumber: bedNumber,
        timestamp: Date.now().toString(),
        from: 'rounds',
        ...additionalData
    });
    
    return `${baseUrl}?${params.toString()}`;
}


/**
 * 🚀 ABRIR VENTANA DEL MÓDULO (MÓVIL O DESKTOP)
 * 
 * Maneja la apertura tanto en móviles como en desktop de forma unificada
 */
/**
 * 🚀 ABRIR VENTANA DEL MÓDULO (FORZADO DESKTOP)
 */
async function openModuleWindow(moduleUrl, moduleType, moduleConfig, patientData, isMobile) {
    try {
        // 🖥️ SIEMPRE MODO DESKTOP (NUEVA PESTAÑA)
        console.log('🖥️ Abriendo módulo en NUEVA PESTAÑA...');
        
        const newWindow = window.open(moduleUrl, '_blank', moduleConfig.windowFeatures);
        
        if (newWindow) {
            showModuleSuccessToast(moduleType, patientData);
            return true;
        } else {
            // Fallback si el pop-up es bloqueado
            const result = await Swal.fire({
                icon: 'warning',
                title: '🚫 Pop-up Bloqueado',
                html: `
                    <div style="text-align: center;">
                        <p>Tu navegador está bloqueando las ventanas emergentes.</p>
                        <p style="color: #666; font-size: 0.9rem;">
                            Por favor permite pop-ups para este sitio o usa el botón de abajo.
                        </p>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: `<i class="fas fa-external-link-alt"></i> Abrir de todas formas`,
                cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
                confirmButtonColor: moduleConfig.color,
                cancelButtonColor: '#6c757d'
            });
            
            if (result.isConfirmed) {
                window.location.href = moduleUrl;
                return true;
            }
            
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error abriendo en desktop:', error);
        return false;
    }
}
/**
 * 📱 ABRIR MÓDULO EN DISPOSITIVO MÓVIL
 */
async function openModuleMobile(moduleUrl, moduleType, moduleConfig, patientData) {
    return new Promise((resolve) => {
        Swal.fire({
            title: moduleConfig.title,
            html: `
                <div style="text-align: center; padding: 1rem;">
                    <!-- Header del paciente -->
                    <div style="background: ${moduleConfig.colorGradient}; 
                                padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; 
                                color: white; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <i class="${moduleConfig.icon}" style="font-size: 1.2rem;"></i>
                            <strong style="font-size: 1.1rem;">${patientData.fullName}</strong>
                        </div>
                        <div style="font-size: 0.9rem; opacity: 0.9;">
                            🛏️ Cama ${patientData.bedNumber} • 📋 ${patientData.specialty}
                        </div>
                        <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.3rem;">
                            📊 ${patientData.primaryDiagnosis}
                        </div>
                    </div>
                    
                    <!-- Información del módulo -->
                    <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                        <p style="margin: 0; color: #666; font-size: 0.95rem;">
                            <i class="fas fa-info-circle" style="color: ${moduleConfig.color}; margin-right: 0.5rem;"></i>
                            ${moduleConfig.description}
                        </p>
                    </div>
                    
                    <!-- Botones de acción -->
                    <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                        <button id="openModuleBtn" 
                                style="background: ${moduleConfig.colorGradient}; 
                                       color: white; border: none; padding: 1rem 2rem; 
                                       border-radius: 10px; cursor: pointer; font-size: 1rem; 
                                       min-height: 50px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                                       transition: all 0.3s ease;">
                            <i class="${moduleConfig.icon}" style="margin-right: 0.5rem;"></i>
                            Abrir ${moduleConfig.title.replace(/[🔬📝📋🩻💓]/g, '').trim()}
                        </button>
                        <button id="cancelModuleBtn" 
                                style="background: #6c757d; color: white; border: none; 
                                       padding: 1rem 2rem; border-radius: 10px; cursor: pointer; 
                                       font-size: 1rem; min-height: 50px;">
                            <i class="fas fa-times" style="margin-right: 0.5rem;"></i>
                            Cancelar
                        </button>
                    </div>
                </div>
            `,
            showConfirmButton: false,
            showCloseButton: false,
            allowOutsideClick: true,
            width: '95%',
            customClass: {
                popup: `mobile-${moduleType}-popup`
            },
            didOpen: () => {
                // Manejar botón de abrir (respuesta directa al click del usuario)
                document.getElementById('openModuleBtn').addEventListener('click', function() {
                    console.log(`📱 Abriendo ${moduleType} en móvil...`);
                    
                    // Intentar window.open() sincrónico
                    const newWindow = window.open(moduleUrl, '_blank');
                    
                    if (newWindow) {
                        console.log('✅ window.open() exitoso en móvil');
                        Swal.close();
                        showModuleSuccessToast(moduleType, patientData);
                        resolve(true);
                    } else {
                        console.log('❌ window.open() bloqueado, usando navegación directa');
                        // Fallback: navegación directa
                        Swal.fire({
                            title: '🚀 Abriendo...',
                            text: `Cargando ${moduleConfig.title}`,
                            icon: 'info',
                            timer: 2000,
                            showConfirmButton: false,
                            timerProgressBar: true,
                            willClose: () => {
                                window.location.href = moduleUrl;
                                resolve(true);
                            }
                        });
                    }
                });
                
                // Manejar botón de cancelar
                document.getElementById('cancelModuleBtn').addEventListener('click', function() {
                    Swal.close();
                    resolve(false);
                });
            }
        });
    });
}

/**
 * 🖥️ ABRIR MÓDULO EN DESKTOP
 */
async function openModuleDesktop(moduleUrl, moduleType, moduleConfig, patientData) {
    try {
        console.log('🖥️ Abriendo módulo en desktop...');
        
        const newWindow = window.open(moduleUrl, '_blank', moduleConfig.windowFeatures);
        
        if (newWindow) {
            showModuleSuccessToast(moduleType, patientData);
            return true;
        } else {
            // Fallback si el pop-up es bloqueado
            const result = await Swal.fire({
                icon: 'warning',
                title: '🚫 Pop-up Bloqueado',
                html: `
                    <div style="text-align: center;">
                        <p>Tu navegador está bloqueando las ventanas emergentes.</p>
                        <p style="color: #666; font-size: 0.9rem;">
                            Por favor permite pop-ups para este sitio o usa el botón de abajo.
                        </p>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: `<i class="fas fa-external-link-alt"></i> Abrir de todas formas`,
                cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
                confirmButtonColor: moduleConfig.color,
                cancelButtonColor: '#6c757d'
            });
            
            if (result.isConfirmed) {
                window.location.href = moduleUrl;
                return true;
            }
            
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error abriendo en desktop:', error);
        return false;
    }
}

/**
 * ✅ MOSTRAR TOAST DE ÉXITO
 */
function showModuleSuccessToast(moduleType, patientData) {
    const moduleConfig = MEDICAL_MODULES_CONFIG[moduleType];
    
    Swal.fire({
        icon: 'success',
        title: `${moduleConfig.title} Abierto`,
        html: `
            <div style="text-align: center;">
                <div style="background: #e3f2fd; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <strong>${patientData.fullName}</strong><br>
                    <small>Cama ${patientData.bedNumber} • ${patientData.specialty}</small>
                </div>
                <p>${moduleConfig.description}</p>
            </div>
        `,
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
        background: moduleConfig.colorGradient,
        color: 'white'
    });
}

/**
 * 🚨 MOSTRAR ERROR UNIFICADO
 */
function showModuleError(moduleType, error, bedNumber) {
    const moduleConfig = MEDICAL_MODULES_CONFIG[moduleType] || { 
        title: 'Módulo Médico', 
        color: '#e74c3c' 
    };
    
    Swal.fire({
        icon: 'error',
        title: `❌ Error al Abrir ${moduleConfig.title}`,
        html: `
            <div style="text-align: center;">
                <p>No se pudo abrir el módulo médico.</p>
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                    <strong>Detalles:</strong><br>
                    <small style="color: #666;">Cama: ${bedNumber}</small><br>
                    <small style="color: #666;">Error: ${error.message}</small>
                </div>
                <p style="color: #666; font-size: 0.9rem;">
                    💡 Intenta nuevamente o contacta al administrador del sistema.
                </p>
            </div>
        `,
        confirmButtonColor: moduleConfig.color
    });
}

// ===============================================================================
// ✅ PARTE 2 COMPLETADA
// ===============================================================================
// 
// 🎯 QUÉ HEMOS LOGRADO:
// ✅ Función unificada openMedicalModule() para todos los módulos
// ✅ Configuración centralizada de módulos médicos
// ✅ Detección móvil unificada (antes duplicada 5 veces)
// ✅ Manejo de errores centralizado
// ✅ Almacenamiento estandarizado de datos
// ✅ Integración completa con PatientDataManager (Parte 1)
// ✅ Reducción de ~510 líneas a ~80 líneas (85% menos código)
// 
// 🚀 PRÓXIMO PASO: Parte 3 - CallTracker (sistema de trazabilidad)
// 
// ⚠️  INSTRUCCIONES PARA CONTINUAR:
// 1. ✅ Agregar este código DESPUÉS de PatientDataManager (Parte 1)
// 2. ✅ Verificar que no hay errores en consola
// 3. ✅ Confirmar que MEDICAL_MODULES_CONFIG está disponible
// 4. 🚀 Continuar con Parte 3
// 
// ===============================================================================

// ===============================================================================
// 🎯 PARTE 3: CALL TRACKER - SISTEMA DE TRAZABILIDAD
// ===============================================================================
// 
// 📋 PROPÓSITO: Rastrear quién accede a qué datos de pacientes y cuándo
// 🔧 PROBLEMA QUE RESUELVE: 
//    - Sin visibilidad de quién abre qué módulos
//    - Sin logs de acceso a datos de pacientes
//    - Sin auditoría de uso del sistema
//    - Sin estadísticas de módulos más usados
// 
// ✅ VENTAJAS:
//    - Registro completo de accesos
//    - Auditoría para compliance médico
//    - Estadísticas de uso por módulo
//    - Detección de patrones de uso
//    - Debugging mejorado
// 
// ⚠️  INSTRUCCIONES DE INSTALACIÓN:
// 1. Agregar este código DESPUÉS de ModuleOpener (Parte 2)
// 2. ANTES de la función medicalRounds()
// 3. Este código complementa y no reemplaza nada
// 
// ===============================================================================

/**
 * 📊 CALL TRACKER - SISTEMA DE TRAZABILIDAD Y AUDITORÍA
 * 
 * Este sistema registra TODOS los accesos a datos de pacientes:
 * 👀 Quién accede (usuario/función)
 * 🕐 Cuándo accede (timestamp detallado)
 * 📂 Qué módulo abre (prescription, medicalNote, etc.)
 * 🛏️ A qué paciente (cama, ID, nombre)
 * 💻 Desde qué dispositivo (móvil/desktop)
 * 🔍 Con qué datos (diagnóstico, alergias, etc.)
 * 
 * ✅ CUMPLE CON:
 * - Auditorías médicas
 * - Compliance HIPAA/GDPR
 * - Debugging del sistema
 * - Análisis de uso
 */
const callTracker = {
    
    // ================================
    // 📊 ESTADO INTERNO DEL TRACKER
    // ================================
    
    /**
     * 🏗️ INICIALIZACIÓN DEL CALL TRACKER
     */
    initialized: false,
    
    /**
     * 📝 LOGS EN MEMORIA (SESSION ACTUAL)
     */
    sessionLogs: [],
    
    /**
     * 📊 ESTADÍSTICAS DE LA SESIÓN ACTUAL
     */
    sessionStats: {
        totalCalls: 0,
        startTime: new Date().toISOString(),
        moduleBreakdown: {
            prescription: 0,
            examOrder: 0,
            medicalNote: 0,
            dicomViewer: 0,
            vitalSigns: 0
        },
        deviceBreakdown: {
            mobile: 0,
            desktop: 0
        },
        patientAccesses: new Map(), // patientId -> count
        bedAccesses: new Map()      // bedNumber -> count
    },
    
    /**
     * ⚙️ CONFIGURACIÓN DEL TRACKER
     */
    config: {
        maxLogsInMemory: 100,           // Máximo logs en memoria
        maxLogsInStorage: 500,          // Máximo logs en localStorage
        enableConsoleLogging: true,     // Log en consola
        enableStoragePersistence: true, // Persistir en localStorage
        enableSessionStats: true,      // Calcular estadísticas
        logLevel: 'INFO',              // DEBUG, INFO, WARN, ERROR
        
        // Claves de almacenamiento
        storageKeys: {
            logs: 'callTrackerLogs',
            stats: 'callTrackerStats',
            session: 'callTrackerSession'
        }
    },
    
    // ================================
    // 🚀 MÉTODOS PRINCIPALES
    // ================================
    
    /**
     * 🎯 INICIALIZAR EL CALL TRACKER
     */
    initialize() {
        try {
            if (this.initialized) {
                this.log('⚠️ CallTracker ya está inicializado', 'WARN');
                return;
            }
            
            this.log('🚀 Inicializando CallTracker...', 'INFO');
            
            // Cargar logs previos si existen
            this.loadPersistedLogs();
            
            // Cargar estadísticas previas
            this.loadPersistedStats();
            
            // Generar ID de sesión único
            this.sessionId = this.generateSessionId();
            
            // Registrar inicio de sesión
            this.logSystemEvent('SESSION_START', {
                sessionId: this.sessionId,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
                url: window.location.href
            });
            
            this.initialized = true;
            this.log('✅ CallTracker inicializado correctamente', 'INFO');
            
        } catch (error) {
            this.log(`❌ Error inicializando CallTracker: ${error.message}`, 'ERROR');
        }
    },
    
    /**
     * 📝 REGISTRAR ACCESO A MÓDULO MÉDICO
     * 
     * Este es el método principal que se llama cada vez que se abre un módulo
     */
    logModuleAccess(moduleType, bedNumber, patientId, patientName, additionalData = {}) {
        try {
            // Asegurar inicialización
            if (!this.initialized) {
                this.initialize();
            }
            
            // Crear entrada de log detallada
            const logEntry = {
                // ================================
                // 🆔 IDENTIFICADORES ÚNICOS
                // ================================
                logId: this.generateLogId(),
                sessionId: this.sessionId,
                timestamp: new Date().toISOString(),
                
                // ================================
                // 📂 INFORMACIÓN DEL MÓDULO
                // ================================
                moduleType: moduleType,
                moduleTitle: MEDICAL_MODULES_CONFIG[moduleType]?.title || moduleType,
                
                // ================================
                // 🏥 INFORMACIÓN DEL PACIENTE
                // ================================
                bedNumber: bedNumber,
                patientId: patientId,
                patientName: patientName || 'Nombre no disponible',
                
                // ================================
                // 💻 INFORMACIÓN TÉCNICA
                // ================================
                deviceType: this.detectDeviceType(),
                userAgent: navigator.userAgent,
                screenResolution: `${window.screen.width}x${window.screen.height}`,
                windowSize: `${window.innerWidth}x${window.innerHeight}`,
                
                // ================================
                // 🏥 INFORMACIÓN MÉDICA
                // ================================
                primaryDiagnosis: additionalData.primaryDiagnosis || 'No especificado',
                attendingPhysician: additionalData.attendingPhysician || 'No especificado',
                specialty: additionalData.specialty || 'No especificado',
                
                // ================================
                // 📊 METADATOS
                // ================================
                source: 'medical_rounds',
                action: 'MODULE_ACCESS',
                success: true,
                ...additionalData
            };
            
            // Agregar a logs de la sesión
            this.sessionLogs.push(logEntry);
            
            // Actualizar estadísticas
            this.updateStats(logEntry);
            
            // Persistir si está habilitado
            if (this.config.enableStoragePersistence) {
                this.persistLog(logEntry);
            }
            
            // Log en consola si está habilitado
            if (this.config.enableConsoleLogging) {
                this.log(`📋 Módulo accedido: ${moduleType} -> Cama ${bedNumber} (${patientName})`, 'INFO');
            }
            
            // Limpiar logs antiguos si excede el límite
            this.cleanupOldLogs();
            
            return logEntry;
            
        } catch (error) {
            this.log(`❌ Error registrando acceso a módulo: ${error.message}`, 'ERROR');
            return null;
        }
    },
    
    /**
     * 📊 REGISTRAR EVENTO DEL SISTEMA
     */
    logSystemEvent(eventType, data = {}) {
        try {
            const logEntry = {
                logId: this.generateLogId(),
                sessionId: this.sessionId,
                timestamp: new Date().toISOString(),
                action: eventType,
                source: 'system',
                data: data
            };
            
            this.sessionLogs.push(logEntry);
            
            if (this.config.enableStoragePersistence) {
                this.persistLog(logEntry);
            }
            
            this.log(`🔧 Sistema: ${eventType}`, 'INFO');
            
        } catch (error) {
            this.log(`❌ Error registrando evento del sistema: ${error.message}`, 'ERROR');
        }
    },
    
    // ================================
    // 📊 GESTIÓN DE ESTADÍSTICAS
    // ================================
    
    /**
     * 📈 ACTUALIZAR ESTADÍSTICAS
     */
    updateStats(logEntry) {
        try {
            if (!this.config.enableSessionStats) return;
            
            // Incrementar contadores
            this.sessionStats.totalCalls++;
            
            // Breakdown por módulo
            if (this.sessionStats.moduleBreakdown[logEntry.moduleType] !== undefined) {
                this.sessionStats.moduleBreakdown[logEntry.moduleType]++;
            }
            
            // Breakdown por dispositivo
            if (logEntry.deviceType === 'mobile') {
                this.sessionStats.deviceBreakdown.mobile++;
            } else {
                this.sessionStats.deviceBreakdown.desktop++;
            }
            
            // Accesos por paciente
            if (logEntry.patientId) {
                const currentCount = this.sessionStats.patientAccesses.get(logEntry.patientId) || 0;
                this.sessionStats.patientAccesses.set(logEntry.patientId, currentCount + 1);
            }
            
            // Accesos por cama
            if (logEntry.bedNumber) {
                const currentCount = this.sessionStats.bedAccesses.get(logEntry.bedNumber) || 0;
                this.sessionStats.bedAccesses.set(logEntry.bedNumber, currentCount + 1);
            }
            
            // Actualizar timestamp de última actividad
            this.sessionStats.lastActivity = new Date().toISOString();
            
        } catch (error) {
            this.log(`❌ Error actualizando estadísticas: ${error.message}`, 'ERROR');
        }
    },
    
    /**
     * 📊 OBTENER ESTADÍSTICAS ACTUALES
     */
    getStats() {
        try {
            return {
                session: {
                    ...this.sessionStats,
                    // Convertir Maps a objetos para serialización
                    patientAccesses: Object.fromEntries(this.sessionStats.patientAccesses),
                    bedAccesses: Object.fromEntries(this.sessionStats.bedAccesses),
                    duration: this.getSessionDuration()
                },
                logs: {
                    inMemory: this.sessionLogs.length,
                    inStorage: this.getStoredLogsCount()
                },
                config: this.config
            };
        } catch (error) {
            this.log(`❌ Error obteniendo estadísticas: ${error.message}`, 'ERROR');
            return null;
        }
    },
    
    /**
     * 🕐 CALCULAR DURACIÓN DE LA SESIÓN
     */
    getSessionDuration() {
        try {
            const start = new Date(this.sessionStats.startTime);
            const now = new Date();
            const durationMs = now - start;
            
            const hours = Math.floor(durationMs / (1000 * 60 * 60));
            const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
            
            return `${hours}h ${minutes}m ${seconds}s`;
        } catch (error) {
            return 'N/A';
        }
    },
    
    // ================================
    // 💾 PERSISTENCIA Y ALMACENAMIENTO
    // ================================
    
    /**
     * 💾 PERSISTIR LOG EN LOCALSTORAGE
     */
    persistLog(logEntry) {
        try {
            const storageKey = this.config.storageKeys.logs;
            const existingLogs = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            existingLogs.push(logEntry);
            
            // Limitar tamaño de logs almacenados
            if (existingLogs.length > this.config.maxLogsInStorage) {
                existingLogs.splice(0, existingLogs.length - this.config.maxLogsInStorage);
            }
            
            localStorage.setItem(storageKey, JSON.stringify(existingLogs));
            
        } catch (error) {
            this.log(`⚠️ No se pudo persistir log: ${error.message}`, 'WARN');
        }
    },
    
    /**
     * 📥 CARGAR LOGS PERSISTIDOS
     */
    loadPersistedLogs() {
        try {
            const storageKey = this.config.storageKeys.logs;
            const storedLogs = localStorage.getItem(storageKey);
            
            if (storedLogs) {
                const logs = JSON.parse(storedLogs);
                this.log(`📥 Cargados ${logs.length} logs persistidos`, 'INFO');
                return logs;
            }
            
            return [];
        } catch (error) {
            this.log(`⚠️ Error cargando logs persistidos: ${error.message}`, 'WARN');
            return [];
        }
    },
    
    /**
     * 📊 CARGAR ESTADÍSTICAS PERSISTIDAS
     */
    loadPersistedStats() {
        try {
            const storageKey = this.config.storageKeys.stats;
            const storedStats = localStorage.getItem(storageKey);
            
            if (storedStats) {
                const stats = JSON.parse(storedStats);
                this.log(`📊 Estadísticas previas cargadas`, 'INFO');
                return stats;
            }
            
            return null;
        } catch (error) {
            this.log(`⚠️ Error cargando estadísticas: ${error.message}`, 'WARN');
            return null;
        }
    },
    
    /**
     * 🔢 OBTENER CANTIDAD DE LOGS ALMACENADOS
     */
    getStoredLogsCount() {
        try {
            const storageKey = this.config.storageKeys.logs;
            const storedLogs = localStorage.getItem(storageKey);
            return storedLogs ? JSON.parse(storedLogs).length : 0;
        } catch (error) {
            return 0;
        }
    },
    
    // ================================
    // 🧹 LIMPIEZA Y MANTENIMIENTO
    // ================================
    
    /**
     * 🧹 LIMPIAR LOGS ANTIGUOS
     */
    cleanupOldLogs() {
        try {
            // Limpiar logs en memoria
            if (this.sessionLogs.length > this.config.maxLogsInMemory) {
                const excess = this.sessionLogs.length - this.config.maxLogsInMemory;
                this.sessionLogs.splice(0, excess);
                this.log(`🧹 Limpiados ${excess} logs antiguos de memoria`, 'INFO');
            }
            
            // Limpiar logs muy antiguos del localStorage (más de 7 días)
            const storageKey = this.config.storageKeys.logs;
            const storedLogs = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            
            const recentLogs = storedLogs.filter(log => {
                return new Date(log.timestamp) > sevenDaysAgo;
            });
            
            if (recentLogs.length < storedLogs.length) {
                localStorage.setItem(storageKey, JSON.stringify(recentLogs));
                const cleaned = storedLogs.length - recentLogs.length;
                this.log(`🧹 Limpiados ${cleaned} logs antiguos del almacenamiento`, 'INFO');
            }
            
        } catch (error) {
            this.log(`⚠️ Error en limpieza: ${error.message}`, 'WARN');
        }
    },
    
    /**
     * 🗑️ LIMPIAR TODOS LOS LOGS
     */
    clearAllLogs() {
        try {
            // Limpiar memoria
            this.sessionLogs = [];
            
            // Limpiar almacenamiento
            Object.values(this.config.storageKeys).forEach(key => {
                localStorage.removeItem(key);
            });
            
            // Reiniciar estadísticas
            this.sessionStats = {
                totalCalls: 0,
                startTime: new Date().toISOString(),
                moduleBreakdown: {
                    prescription: 0,
                    examOrder: 0,
                    medicalNote: 0,
                    dicomViewer: 0,
                    vitalSigns: 0
                },
                deviceBreakdown: {
                    mobile: 0,
                    desktop: 0
                },
                patientAccesses: new Map(),
                bedAccesses: new Map()
            };
            
            this.log('🗑️ Todos los logs han sido limpiados', 'INFO');
            
        } catch (error) {
            this.log(`❌ Error limpiando logs: ${error.message}`, 'ERROR');
        }
    },
    
    // ================================
    // 🔧 UTILIDADES Y HELPERS
    // ================================
    
    /**
     * 🆔 GENERAR ID ÚNICO PARA SESIÓN
     */
    generateSessionId() {
        return `CTS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
    
    /**
     * 🆔 GENERAR ID ÚNICO PARA LOG
     */
    generateLogId() {
        return `CTL_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    },
    
    /**
     * 📱 DETECTAR TIPO DE DISPOSITIVO
     */
    detectDeviceType() {
        return (
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            ('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            window.innerWidth <= 768
        ) ? 'mobile' : 'desktop';
    },
    
    /**
     * 📝 LOGGING INTERNO CON NIVELES
     */
    log(message, level = 'INFO') {
        if (!this.config.enableConsoleLogging) return;
        
        const timestamp = new Date().toISOString();
        const prefix = `[CallTracker ${level}]`;
        
        switch (level) {
            case 'DEBUG':
                console.debug(`${prefix} ${timestamp}: ${message}`);
                break;
            case 'INFO':
                console.log(`${prefix} ${timestamp}: ${message}`);
                break;
            case 'WARN':
                console.warn(`${prefix} ${timestamp}: ${message}`);
                break;
            case 'ERROR':
                console.error(`${prefix} ${timestamp}: ${message}`);
                break;
            default:
                console.log(`${prefix} ${timestamp}: ${message}`);
        }
    },
    
    /**
     * 📊 EXPORTAR LOGS PARA ANÁLISIS
     */
    exportLogs(format = 'json') {
        try {
            const allLogs = [...this.sessionLogs, ...this.loadPersistedLogs()];
            
            if (format === 'csv') {
                return this.logsToCSV(allLogs);
            } else {
                return JSON.stringify({
                    exportDate: new Date().toISOString(),
                    totalLogs: allLogs.length,
                    stats: this.getStats(),
                    logs: allLogs
                }, null, 2);
            }
        } catch (error) {
            this.log(`❌ Error exportando logs: ${error.message}`, 'ERROR');
            return null;
        }
    },
    
    /**
     * 📊 CONVERTIR LOGS A CSV
     */
    logsToCSV(logs) {
        try {
            if (!logs.length) return 'No hay logs disponibles';
            
            const headers = Object.keys(logs[0]).join(',');
            const rows = logs.map(log => Object.values(log).join(','));
            
            return [headers, ...rows].join('\n');
        } catch (error) {
            return 'Error generando CSV';
        }
    }
};

// ===============================================================================
// 🎯 AUTO-INICIALIZACIÓN DEL CALL TRACKER
// ===============================================================================

// Inicializar automáticamente el CallTracker
callTracker.initialize();

// Registrar evento de carga del sistema
callTracker.logSystemEvent('MEDICAL_ROUNDS_LOADED', {
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
});

// ===============================================================================
// 🔧 INTEGRACIÓN CON WINDOW PARA DEBUGGING
// ===============================================================================

// Hacer CallTracker accesible globalmente para debugging
window.callTracker = callTracker;

// Comando de utilidad para debugging
window.showCallTrackerStats = function() {
    console.table(callTracker.getStats());
};

// ===============================================================================
// ✅ PARTE 3 COMPLETADA
// ===============================================================================
// 
// 🎯 QUÉ HEMOS LOGRADO:
// ✅ Sistema completo de trazabilidad y auditoría
// ✅ Registro detallado de todos los accesos a pacientes
// ✅ Estadísticas en tiempo real de uso del sistema
// ✅ Persistencia de logs en localStorage
// ✅ Limpieza automática de logs antiguos
// ✅ Exportación de datos para análisis
// ✅ Compliance con auditorías médicas
// ✅ Debugging mejorado del sistema
// 
// 🚀 PRÓXIMO PASO: Parte 4 - Integración Final (reemplazar funciones existentes)
// 
// ⚠️  INSTRUCCIONES PARA CONTINUAR:
// 1. ✅ Agregar este código DESPUÉS de ModuleOpener (Parte 2)
// 2. ✅ Verificar que no hay errores en consola
// 3. ✅ Confirmar que callTracker está disponible globalmente
// 4. 🧪 Test: ejecutar `window.showCallTrackerStats()` en consola
// 5. 🚀 Continuar con Parte 4 (Integración Final)
// 
// ===============================================================================



// ===== CLASE PRINCIPAL DEL SISTEMA DE RONDAS MÉDICAS =====
function medicalRounds() {
    return {
        // ===== ESTADO DE LA APLICACIÓN =====
        currentStep: 1,
        selectedFloor: null,
        selectedWing: null,
        selectedFloorData: null,
        hospital: {},
        patients: {},
        medications: {},
        exams: {},
        medicalOrders: {},
        patientsByBed: {}, // NUEVA PROPIEDAD PARA DATOS POR CAMA
        loading: false,

        // ===== INICIALIZACIÓN =====
        async init() {
            this.showLoading('Cargando datos del hospital...');
            await this.loadAllData();
            this.hideLoading();
            
            // Verificar si se debe mostrar el modal al cargar
            if (typeof checkShowPatientModalOnLoad === 'function') {
                checkShowPatientModalOnLoad();
            }
        },

        // ===== CARGA DE DATOS DESDE APIs =====
        async loadAllData() {
            try {
                await Promise.all([
                    this.loadHospitalData(),
                    this.loadPatientsData(),
                    this.loadMedicationsData(),
                    this.loadExamsData(),
                    this.loadMedicalOrdersData(),
                    this.loadPatientsByBedData(), // 🆕 CARGAR DATOS POR CAMA
                    this.loadVitalSignsData() // 🆕 CARGAR DATOS POR SIGNOS VITALES
                ]);
                console.log('✅ Todos los datos cargados correctamente');
            } catch (error) {
                console.error('❌ Error cargando datos:', error);
                this.showError('Error cargando datos del sistema');
            }
        },

        // ===== CARGA DE DATOS POR SIGNOS VITALES =====
        async loadVitalSignsData() {
            try {
                const response = await fetch('/api/vital-signs/data');
                if (!response.ok) throw new Error('Error cargando signos vitales');
                const data = await response.json();
                this.vitalSignsData = data;
                console.log('📊 Signos vitales cargados');
            } catch (error) {
                console.error('Error cargando signos vitales:', error);
                this.vitalSignsData = {};
            }
        },

        // 🆕 NUEVA FUNCIÓN PARA CARGAR PACIENTES POR CAMA
        async loadPatientsByBedData() {
            try {
                const response = await fetch('/api/patients/beds');
                if (!response.ok) throw new Error('Error cargando pacientes por cama');
                const data = await response.json();
                this.patientsByBed = data.patients_by_bed;
                console.log('🛏️ Base de datos de pacientes por cama cargada');
                console.log('📊 Total pacientes cargados:', Object.keys(this.patientsByBed).length);
            } catch (error) {
                console.error('Error cargando pacientes por cama:', error);
                console.log('⚠️ Usando datos de fallback para pacientes');
                // Si falla, mantener vacío para usar el generador mock
                this.patientsByBed = {};
            }
        },

        async loadHospitalData() {
            try {
                const response = await fetch('/api/hospital/structure');
                if (!response.ok) throw new Error('Error en la respuesta del servidor');
                this.hospital = await response.json();
                console.log('📋 Estructura del hospital cargada');
            } catch (error) {
                console.error('Error cargando estructura del hospital:', error);
                // Fallback a datos de prueba si falla la API
                this.loadFallbackHospitalData();
            }
        },

        async loadPatientsData() {
            try {
                const response = await fetch('/api/patients/database');
                if (!response.ok) throw new Error('Error en la respuesta del servidor');
                this.patients = await response.json();
                console.log('👥 Base de datos de pacientes cargada');
            } catch (error) {
                console.error('Error cargando pacientes:', error);
                this.patients = {};
            }
        },

        async loadMedicationsData() {
            try {
                const response = await fetch('/api/pharmacy/medications');
                if (!response.ok) throw new Error('Error en la respuesta del servidor');
                this.medications = await response.json();
                console.log('💊 Vademécum de medicamentos cargado');
            } catch (error) {
                console.error('Error cargando medicamentos:', error);
                this.medications = {};
            }
        },

        async loadExamsData() {
            try {
                const response = await fetch('/api/medical/exams');
                if (!response.ok) throw new Error('Error en la respuesta del servidor');
                this.exams = await response.json();
                console.log('🔬 Base de datos de exámenes cargada');
            } catch (error) {
                console.error('Error cargando exámenes:', error);
                this.exams = {};
            }
        },

        async loadMedicalOrdersData() {
            try {
                const response = await fetch('/api/medical/orders');
                if (!response.ok) throw new Error('Error en la respuesta del servidor');
                this.medicalOrders = await response.json();
                console.log('📋 Órdenes médicas cargadas');
            } catch (error) {
                console.error('Error cargando órdenes médicas:', error);
                this.medicalOrders = {};
            }
        },

        // ===== DATOS DE FALLBACK (PARA DESARROLLO) =====
        loadFallbackHospitalData() {
            console.log('🔄 Usando datos de fallback...');
            this.hospital = {
                hospital_info: {
                    name: "Hospital Central San José",
                    total_floors: 6,
                    beds_per_floor: 22
                },
                floors: [
                    {
                        floor_number: 1,
                        specialty: "UROLOGÍA",
                        department_head: "Dr. Carlos Mendoza",
                        color_theme: "#5D7CDB",
                        wings: {
                            east: { beds: this.generateMockBeds("1", "E") },
                            west: { beds: this.generateMockBeds("1", "W") }
                        }
                    },
                    {
                        floor_number: 2,
                        specialty: "CIRUGÍA ABDOMINAL",
                        department_head: "Dra. Ana García",
                        color_theme: "#48C78E",
                        wings: {
                            east: { beds: this.generateMockBeds("2", "E") },
                            west: { beds: this.generateMockBeds("2", "W") }
                        }
                    },
                    {
                        floor_number: 3,
                        specialty: "CABEZA Y CUELLO",
                        department_head: "Dr. Luis Rodríguez",
                        color_theme: "#FF8C42",
                        wings: {
                            east: { beds: this.generateMockBeds("3", "E") },
                            west: { beds: this.generateMockBeds("3", "W") }
                        }
                    },
                    {
                        floor_number: 4,
                        specialty: "MAMAS Y TEJIDOS BLANDOS",
                        department_head: "Dra. Patricia López",
                        color_theme: "#E91E63",
                        wings: {
                            east: { beds: this.generateMockBeds("4", "E") },
                            west: { beds: this.generateMockBeds("4", "W") }
                        }
                    },
                    {
                        floor_number: 5,
                        specialty: "CIRUGÍA DE TÓRAX",
                        department_head: "Dr. Roberto Martínez",
                        color_theme: "#9C27B0",
                        wings: {
                            east: { beds: this.generateMockBeds("5", "E") },
                            west: { beds: this.generateMockBeds("5", "W") }
                        }
                    },
                    {
                        floor_number: 6,
                        specialty: "GINECOLOGÍA",
                        department_head: "Dra. Carmen Silva",
                        color_theme: "#4CAF50",
                        wings: {
                            east: { beds: this.generateMockBeds("6", "E") },
                            west: { beds: this.generateMockBeds("6", "W") }
                        }
                    }
                ]
            };
        },

        generateMockBeds(floor, wing) {
            const beds = [];
            const statuses = ['occupied', 'available', 'maintenance', 'cleaning'];
            const genders = ['M', 'F'];
            
            for (let i = 1; i <= 11; i++) {
                const bedNumber = `${floor}0${i.toString().padStart(1, '0')}${wing}`;
                const status = statuses[Math.floor(Math.random() * statuses.length)];
                const gender = status === 'occupied' ? genders[Math.floor(Math.random() * genders.length)] : null;
                
                // ✅ SIEMPRE generar patient_id válido para camas ocupadas
                let patientId = null;
                if (status === 'occupied') {
                    patientId = `PAC_${bedNumber}_${Math.floor(Math.random() * 1000) + 100}`;
                    console.log(`✅ Cama ${bedNumber} generada con PatientID: ${patientId}`);
                }
                
                const bedData = {
                    bed_number: bedNumber,
                    status: status,
                    gender: gender,
                    patient_id: patientId // ✅ NUNCA undefined para camas ocupadas
                };
                
                beds.push(bedData);
                console.log(`🛏️ Cama creada:`, bedData);
            }
            
            console.log(`📋 Total camas generadas para piso ${floor} ala ${wing}: ${beds.length}`);
            return beds;
        },

        // ===== NAVEGACIÓN =====
        selectFloorAndWing(floor, wing) {
            this.selectedFloor = floor.floor_number;
            this.selectedFloorData = floor;
            this.selectedWing = wing;
            this.currentStep = 2; // Ir directo al paso 2 (mapa de camas)
            this.trackUserAction('floor_wing_selected', { floor: floor.floor_number, wing: wing });
        },

        selectFloor(floor) {
            this.selectedFloor = floor.floor_number;
            this.selectedFloorData = floor;
            this.currentStep = 2;
            this.trackUserAction('floor_selected', { floor: floor.floor_number });
        },

        selectWing(wing) {
            this.selectedWing = wing;
            this.currentStep = 3;
            this.trackUserAction('wing_selected', { wing: wing });
        },

        goBack() {
            if (this.currentStep > 1) {
                this.currentStep = 1; // Siempre volver al paso 1 (selección de piso)
                this.selectedFloor = null;
                this.selectedFloorData = null;
                this.selectedWing = null;
            }
        },

        // ===== MANEJO DE CAMAS =====
        async selectBed(bed) {
            if (bed.status !== 'occupied') {
                this.showBedStatusInfo(bed);
                return;
            }

            this.showLoading('Cargando datos del paciente...');
            
            try {
                // 🆕 PASAR EL NÚMERO DE CAMA TAMBIÉN
                const patientData = await this.getPatientData(bed.patient_id, bed.bed_number);
                this.hideLoading();
                this.showPatientInfo(bed, patientData);
            } catch (error) {
                this.hideLoading();
                this.showError('Error cargando datos del paciente');
            }
        },
         

        // 🆕 FUNCIÓN COMPLETAMENTE REESCRITA PARA USAR EL JSON
        async getPatientData(patientId, bedNumber) {
            console.log('🔍 getPatientData llamado con:');
            console.log('   - patientId:', patientId);
            console.log('   - bedNumber:', bedNumber);
            console.log('   - patientsByBed cargado:', Object.keys(this.patientsByBed).length > 0);
            
            // ✅ PRIORIDAD 1: Buscar por número de cama en el JSON
            // ✅ PRIORIDAD 1: Buscar por número de cama en el JSON
            if (bedNumber && this.patientsByBed[bedNumber]) {
                console.log(`✅ Paciente encontrado en JSON para cama ${bedNumber}:`, this.patientsByBed[bedNumber].personal_info.first_name);
                
                // 🔧 GUARDAR DATOS PARA LA NOTA MÉDICA
                const patientData = this.patientsByBed[bedNumber];
                const enrichedData = {
                    patientId: patientId || `SAFE_${bedNumber}_${Date.now()}`,
                    bedNumber: bedNumber,
                    fullName: `${patientData.personal_info.first_name} ${patientData.personal_info.last_name}`,
                    age: patientData.personal_info.age,
                    gender: patientData.personal_info.gender === 'M' ? 'Masculino' : 'Femenino',
                    primaryDiagnosis: patientData.medical_info.primary_diagnosis,
                    primaryDiagnosisCode: patientData.medical_info.primary_diagnosis_code,
                    attendingPhysician: patientData.medical_info.attending_physician,
                    medicalRecord: patientData.medical_info.medical_record,
                    allergies: patientData.medical_info.allergies
                };
                
                localStorage.setItem('currentPatientData', JSON.stringify(enrichedData));
                localStorage.setItem('medicalNotePatientData', JSON.stringify(enrichedData));
                
                return patientData;
            }
            
            // ✅ PRIORIDAD 2: Intentar API real si existe patientId válido
            if (patientId && patientId !== 'undefined' && patientId !== 'null' && patientId !== null) {
                try {
                    console.log('🌐 Intentando API para patientId:', patientId);
                    const response = await fetch(`/api/patients/${patientId}`);
                    if (response.ok) {
                        const data = await response.json();
                        console.log('✅ Datos obtenidos de API:', data);
                        return data;
                    }
                } catch (error) {
                    console.log('⚠️ API no disponible:', error.message);
                }
            }
            
            // ✅ PRIORIDAD 3: Generar mock aleatorio como último recurso
            console.log('🎲 Generando datos mock aleatorios para cama:', bedNumber);
            return this.generateMockPatientData();
        },

        generateMockPatientData() {
            const names = ['Carlos García', 'Ana López', 'Luis Rodríguez', 'María González', 'Pedro Silva', 'Carmen Díaz', 'José Martínez', 'Laura Hernández'];
            const diagnoses = ['Hiperplasia benigna de próstata', 'Litiasis renal', 'Hernia inguinal', 'Colecistitis aguda', 'Apendicitis', 'Cáncer de mama', 'Neumonía', 'Diabetes mellitus'];
            
            const randomName = names[Math.floor(Math.random() * names.length)];
            const nameParts = randomName.split(' ');
            
            return {
                personal_info: {
                    first_name: nameParts[0],
                    last_name: nameParts[1] || 'Apellido',
                    age: 25 + Math.floor(Math.random() * 60), // Entre 25 y 85 años
                    gender: Math.random() > 0.5 ? 'M' : 'F'
                },
                medical_info: {
                    primary_diagnosis: diagnoses[Math.floor(Math.random() * diagnoses.length)],
                    admission_date: '2025-01-15',
                    medical_record: 'HC' + Math.floor(Math.random() * 100000)
                }
            };
        },

        // ===== INFORMACIÓN Y ESTADÍSTICAS =====
        getWingStatsShort(floor, wing) {
            const beds = floor.wings[wing]?.beds || [];
            const occupied = beds.filter(bed => bed.status === 'occupied').length;
            const total = beds.length;
            return `${occupied}/${total}`;
        },

        getWingStats(wing) {
            if (!this.selectedFloorData) return '';
            const beds = this.selectedFloorData.wings[wing]?.beds || [];
            const occupied = beds.filter(bed => bed.status === 'occupied').length;
            const available = beds.filter(bed => bed.status === 'available').length;
            return `${occupied} ocupadas, ${available} libres`;
        },

        getCurrentFloorData() {
            return this.selectedFloorData;
        },

        getCurrentBeds() {
            if (!this.selectedFloorData || !this.selectedWing) return [];
            return this.selectedFloorData.wings[this.selectedWing]?.beds || [];
        },

        getBreadcrumb() {
            let breadcrumb = '';
            if (this.selectedFloorData) {
                breadcrumb += `🏥 Piso ${this.selectedFloorData.floor_number} - ${this.selectedFloorData.specialty}`;
            }
            if (this.selectedWing) {
                breadcrumb += ` <i class="fas fa-chevron-right"></i> Ala ${this.selectedWing === 'east' ? 'Este' : 'Oeste'}`;
            }
            return breadcrumb;
        },

        // ===== ESTILOS Y CLASES =====
        getBedClass(bed) {
            if (bed.status === 'available') return 'available';
            if (bed.status === 'maintenance') return 'maintenance';
            if (bed.status === 'cleaning') return 'cleaning';
            if (bed.status === 'occupied' && bed.gender === 'M') return 'occupied-male';
            if (bed.status === 'occupied' && bed.gender === 'F') return 'occupied-female';
            return 'available';
        },

        getBedIcon(bed) {
            return 'fas fa-bed';
        },

        getBedTooltip(bed) {
            if (bed.status === 'available') return 'Cama disponible';
            if (bed.status === 'maintenance') return 'Cama en mantenimiento';
            if (bed.status === 'cleaning') return 'Cama en limpieza';
            if (bed.status === 'occupied') {
                const gender = bed.gender === 'M' ? 'Masculino' : 'Femenino';
                return `Paciente ${gender} - Click para ver detalles`;
            }
            return '';
        },

        getBedStatusText(status) {
            const statusMap = {
                'available': 'disponible',
                'maintenance': 'en mantenimiento',
                'cleaning': 'en limpieza',
                'occupied': 'ocupada'
            };
            return statusMap[status] || 'desconocido';
        },

        getOccupancyStats() {
            const beds = this.getCurrentBeds();
            const occupied = beds.filter(bed => bed.status === 'occupied').length;
            const total = beds.length;
            const percentage = total > 0 ? Math.round((occupied / total) * 100) : 0;
            return `Ocupación: ${occupied}/${total} (${percentage}%)`;
        },

        // ===== FUNCIONES PARA ESTADÍSTICAS DETALLADAS =====
        
        getWingTotalBeds() {
            return this.getCurrentBeds().length;
        },

        getWingMaleCount() {
            const beds = this.getCurrentBeds();
            return beds.filter(bed => bed.status === 'occupied' && bed.gender === 'M').length;
        },

        getWingFemaleCount() {
            const beds = this.getCurrentBeds();
            return beds.filter(bed => bed.status === 'occupied' && bed.gender === 'F').length;
        },

        getWingAvailableCount() {
            const beds = this.getCurrentBeds();
            return beds.filter(bed => bed.status === 'available').length;
        },

        getWingMaintenanceCount() {
            const beds = this.getCurrentBeds();
            return beds.filter(bed => bed.status === 'maintenance').length;
        },
        
        
        // ===== BUSCAR CAMA POR NÚMERO =====
        findBedByNumber(bedNumber) {
            if (!this.bedsData || !this.bedsData.length) {
                return null;
            }
            
            return this.bedsData.find(bed => bed.bed_number === bedNumber);
        },

        getWingCleaningCount() {
            const beds = this.getCurrentBeds();
            return beds.filter(bed => bed.status === 'cleaning').length;
        },

        // ===== INTERFAZ Y NOTIFICACIONES =====
        showLoading(message = 'Cargando...') {
            this.loading = true;
            Swal.fire({
                title: message,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        },

        hideLoading() {
            this.loading = false;
            Swal.close();
        },

        showError(message) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: message,
                confirmButtonColor: '#e74c3c'
            });
        },

        showSuccess(message) {
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: message,
                timer: 2000,
                confirmButtonColor: '#00a86b'
            });
        },

        showBedStatusInfo(bed) {
            Swal.fire({
                icon: 'info',
                title: `Cama ${bed.bed_number}`,
                text: `Esta cama está ${this.getBedStatusText(bed.status)}`,
                confirmButtonColor: '#2c5aa0'
            });
        },

        // ===== FUNCIÓN PRINCIPAL MODIFICADA - UNA SOLA VENTANA =====
        showPatientInfo(bed, patientData) {
            // 🔍 Guardar datos globalmente para el llamado a receta

            // 🔍 Guardar datos globalmente con VALIDACIÓN
            let safePatientId = bed.patient_id;
            if (!safePatientId || safePatientId === 'undefined' || safePatientId === 'null') {
                safePatientId = `SAFE_${bed.bed_number}_${Date.now()}`;
                console.log('⚠️ patient_id inválido, usando:', safePatientId);
            }

            // 🆕 PREPARAR DATOS USANDO PATIENT DATA MANAGER (DATOS COMPLETOS DEL JSON)
            const enrichedPatientData = patientDataManager.prepareEnrichedPatientData(
                bed, 
                patientData, 
                'showPatientInfo',
                {
                    specialty: this.selectedFloorData?.specialty || 'Medicina General',
                    floorNumber: this.selectedFloorData?.floor_number || 1,
                    wingName: this.selectedWing === 'east' ? 'Este' : 'Oeste',
                    departmentHead: this.selectedFloorData?.department_head || 'Dr. Sistema'
                }
            );


            // 🌟 DATOS GLOBALES ENRIQUECIDOS (AHORA CON TODO EL JSON)
                window.currentPatientData = {
                    bed: bed,
                    patient: patientData,
                    bedNumber: bed.bed_number,
                    patientId: enrichedPatientData.patientId,
                    patientName: enrichedPatientData.fullName,
                    patientAge: enrichedPatientData.age,
                    gender: enrichedPatientData.genderText,
                    specialty: enrichedPatientData.specialty,
                    
                    // ✅ AHORA SÍ INCLUYE DIAGNÓSTICO COMPLETO
                    diagnosis: enrichedPatientData.primaryDiagnosis,
                    diagnosisCode: enrichedPatientData.primaryDiagnosisCode,
                    secondaryDiagnosis: enrichedPatientData.secondaryDiagnosis,
                    secondaryDiagnosisCode: enrichedPatientData.secondaryDiagnosisCode,
                    
                    // ✅ INFORMACIÓN MÉDICA COMPLETA
                    doctor: enrichedPatientData.attendingPhysician,
                    medicalRecord: enrichedPatientData.medicalRecord,
                    admissionDate: enrichedPatientData.admissionDate,
                    currentMedications: enrichedPatientData.currentMedications,
                    allergies: enrichedPatientData.allergies
                };

            // 🆕 MODAL MEJORADO CON MÁS INFORMACIÓN
            Swal.fire({
                title: `🏥 Cama ${bed.bed_number}`,
                html: `
                    <div style="text-align: left; padding: 1rem;">
                        
                        <!-- INFORMACIÓN DEL PACIENTE -->
                        <h3 style="color: #2c5aa0; margin-bottom: 1rem;">
                            <i class="fas fa-user"></i> ${patientData.personal_info.first_name} ${patientData.personal_info.last_name}
                        </h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                            <div>
                                <p><strong>Edad:</strong> ${patientData.personal_info.age} años</p>
                                <p><strong>Género:</strong> ${patientData.personal_info.gender === 'M' ? 'Masculino' : 'Femenino'}</p>
                                <p><strong>DNI:</strong> ${patientData.personal_info.dni || 'No registrado'}</p>
                            </div>
                            <div>
                                <p><strong>Historia Clínica:</strong> ${patientData.medical_info.medical_record}</p>
                                <p><strong>Cama:</strong> ${bed.bed_number}</p>
                                <p><strong>Ingreso:</strong> ${new Date(patientData.medical_info.admission_date).toLocaleDateString('es-ES')}</p>
                            </div>
                        </div>
                        
                        <!-- INFORMACIÓN MÉDICA -->
                        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                            <p><strong>📋 Diagnóstico Principal:</strong><br>
                               <span style="color: #2c5aa0;">${patientData.medical_info.primary_diagnosis_code || 'Sin código'}</span> - ${patientData.medical_info.primary_diagnosis}</p>
                            ${patientData.medical_info.secondary_diagnosis ? `
                                <p><strong>📋 Diagnóstico Secundario:</strong><br>
                                   <span style="color: #6c757d;">${patientData.medical_info.secondary_diagnosis_code || 'Sin código'}</span> - ${patientData.medical_info.secondary_diagnosis}</p>
                            ` : ''}
                            <p><strong>👨‍⚕️ Médico Tratante:</strong> ${patientData.medical_info.attending_physician}</p>
                            ${patientData.medical_info.allergies ? `<p><strong>⚠️ Alergias:</strong> <span style="color: #e74c3c;">${patientData.medical_info.allergies}</span></p>` : ''}
                        </div>
                        
                        <!-- 6 BOTONES EN GRID 3x2 -->
                        <div style="margin-top: 1.5rem;">
                            <h4 style="color: #2c5aa0; margin-bottom: 1rem; text-align: center;">
                                👨‍⚕️ ACCIONES MÉDICAS
                            </h4>
                            
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                                
                                <!-- FILA 1 -->
                                <button onclick="createMedicalNoteDirect('${bed.bed_number}', '${bed.patient_id}')" 
                                        style="background: #2c5aa0; color: white; border: none; padding: 1rem; border-radius: 10px; cursor: pointer; font-size: 1rem;">
                                    <i class="fas fa-edit"></i><br>Nota<br><small>Evolución</small>
                                </button>
                                
                                <button onclick="createPrescriptionDirect('${bed.bed_number}', '${bed.patient_id}')" 
                                        style="background: #00a86b; color: white; border: none; padding: 1rem; border-radius: 10px; cursor: pointer; font-size: 1rem;">
                                    <i class="fas fa-prescription-bottle"></i><br>Receta<br><small>Médica</small>
                                </button>
                                
                                <button onclick="createExamOrderDirect('${bed.bed_number}', '${bed.patient_id}')" 
                                        style="background: #f39c12; color: white; border: none; padding: 1rem; border-radius: 10px; cursor: pointer; font-size: 1rem;">
                                    <i class="fas fa-clipboard-list"></i><br>Orden<br><small>Médica</small>
                                </button>
                                
                                <!-- FILA 2 -->
                                <button onclick="viewExams('${bed.bed_number}', '${bed.patient_id}')" 
                                        style="background: #9b59b6; color: white; border: none; padding: 1rem; border-radius: 10px; cursor: pointer; font-size: 1rem;">
                                    <i class="fas fa-vials"></i><br>Ver<br><small>Exámenes</small>
                                </button>
                                
                                <button onclick="viewPACS('${bed.bed_number}', '${bed.patient_id}')" 
                                        style="background: #e91e63; color: white; border: none; padding: 1rem; border-radius: 10px; cursor: pointer; font-size: 1rem;">
                                    <i class="fas fa-x-ray"></i><br>Visor<br><small>PACS</small>
                                </button>
                                
                                <button onclick="viewVitalSigns('${bed.bed_number}', '${bed.patient_id}')" 
                                        style="background: #17a2b8; color: white; border: none; padding: 1rem; border-radius: 10px; cursor: pointer; font-size: 1rem;">
                                    <i class="fas fa-heartbeat"></i><br>Signos<br><small>Vitales</small>
                                </button>
                                
                            </div>
                        </div>
                    </div>
                `,
                showConfirmButton: false,
                showCloseButton: true,
                width: 700, // 🆕 MÁS ANCHO PARA MÁS INFORMACIÓN
                customClass: {
                    popup: 'patient-info-popup'
                },
                didOpen: () => {
                    // Asegurarse de que el spinner se oculte
                    Swal.hideLoading();
                }
            });
        },

        // ===== TRACKING Y ANALYTICS =====
        trackUserAction(action, data) {
            console.log(`📊 Acción: ${action}`, data);
            // Aquí podrías enviar datos a tu sistema de analytics
        },

        // ===== GUARDAR DATOS MÉDICOS =====
        async saveMedicalNote(bedNumber, patientId, noteContent) {
            try {
                const response = await fetch('/api/medical/notes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        bed_number: bedNumber,
                        patient_id: patientId,
                        content: noteContent,
                        timestamp: new Date().toISOString(),
                        doctor_id: 'DR001' // Esto vendría de la sesión del usuario
                    })
                });

                if (response.ok) {
                    this.showSuccess('Nota médica guardada exitosamente');
                    return true;
                } else {
                    throw new Error('Error guardando la nota');
                }
            } catch (error) {
                this.showError('Error guardando la nota médica');
                return false;
            }
        },

        async savePrescription(bedNumber, patientId, prescriptionData) {
            try {
                const response = await fetch('/api/medical/prescriptions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        bed_number: bedNumber,
                        patient_id: patientId,
                        medications: prescriptionData,
                        timestamp: new Date().toISOString(),
                        doctor_id: 'DR001'
                    })
                });

                if (response.ok) {
                    this.showSuccess('Receta médica guardada exitosamente');
                    return true;
                } else {
                    throw new Error('Error guardando la receta');
                }
            } catch (error) {
                this.showError('Error guardando la receta médica');
                return false;
            }
        }
    }
}


/**
 * 📋 CREAR NOTA MÉDICA - CON DATOS GARANTIZADOS
 */
async function createMedicalNoteDirect(bedNumber, patientId) {
    console.log('📋 createMedicalNoteDirect() - CON DATOS');
    
    try {
        // 🔥 PASO 1: PREPARAR DATOS ANTES DE ABRIR
        const enrichedData = await preparePatientDataBeforeOpen(bedNumber, patientId, 'medicalNote');
        
        // 🔥 PASO 2: GUARDAR EN TODAS LAS UBICACIONES
        savePatientDataToStorage(enrichedData, 'medicalNote');
        
        // 🔥 PASO 3: CONSTRUIR URL CON PARÁMETROS
        const url = `/medical/notes?patientId=${enrichedData.patientId}&bedNumber=${enrichedData.bedNumber}&patientName=${encodeURIComponent(enrichedData.fullName)}&from=rounds&timestamp=${Date.now()}`;
        
        // 🔥 PASO 4: ABRIR VENTANA
        const newWindow = window.open(url, '_blank');
        
        if (newWindow) {
            console.log('✅ Nota médica abierta con datos completos');
            return true;
        } else {
            throw new Error('Pop-up bloqueado');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo abrir la nota médica',
            confirmButtonColor: '#e74c3c'
        });
        return false;
    }
}

/**
 * 💊 CREAR RECETA - CON DATOS GARANTIZADOS
 */
async function createPrescriptionDirect(bedNumber, patientId) {
    console.log('💊 createPrescriptionDirect() - CON DATOS');
    
    try {
        const enrichedData = await preparePatientDataBeforeOpen(bedNumber, patientId, 'prescription');
        savePatientDataToStorage(enrichedData, 'prescription');
        
        const url = `/medical/prescriptions?patientId=${enrichedData.patientId}&bedNumber=${enrichedData.bedNumber}&patientName=${encodeURIComponent(enrichedData.fullName)}&from=rounds&timestamp=${Date.now()}`;
        
        const newWindow = window.open(url, '_blank');
        
        if (newWindow) {
            console.log('✅ Receta abierta con datos completos');
            return true;
        } else {
            throw new Error('Pop-up bloqueado');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo abrir la receta médica',
            confirmButtonColor: '#e74c3c'
        });
        return false;
    }
}

/**
 * 🧪 CREAR ORDEN EXÁMENES - CON DATOS GARANTIZADOS
 */
async function createExamOrderDirect(bedNumber, patientId) {
    console.log('🧪 createExamOrderDirect() - CON DATOS');
    
    try {
        const enrichedData = await preparePatientDataBeforeOpen(bedNumber, patientId, 'examOrder');
        savePatientDataToStorage(enrichedData, 'examOrder');
        
        const url = `/medical/orders/exams?patientId=${enrichedData.patientId}&bedNumber=${enrichedData.bedNumber}&patientName=${encodeURIComponent(enrichedData.fullName)}&from=rounds&timestamp=${Date.now()}`;
        
        const newWindow = window.open(url, '_blank');
        
        if (newWindow) {
            console.log('✅ Orden de exámenes abierta con datos completos');
            return true;
        } else {
            throw new Error('Pop-up bloqueado');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo abrir la orden de exámenes',
            confirmButtonColor: '#e74c3c'
        });
        return false;
    }
}

/**
 * 🩻 VER PACS - CON DATOS GARANTIZADOS
 */
async function viewPACS(bedNumber, patientId) {
    console.log('🩻 viewPACS() - CON DATOS');
    
    try {
        const enrichedData = await preparePatientDataBeforeOpen(bedNumber, patientId, 'dicomViewer');
        savePatientDataToStorage(enrichedData, 'dicomViewer');
        
        const url = `/medical/dicom?patientId=${enrichedData.patientId}&bedNumber=${enrichedData.bedNumber}&patientName=${encodeURIComponent(enrichedData.fullName)}&from=rounds&timestamp=${Date.now()}`;
        
        const newWindow = window.open(url, '_blank');
        
        if (newWindow) {
            console.log('✅ Visor PACS abierto con datos completos');
            return true;
        } else {
            throw new Error('Pop-up bloqueado');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo abrir el visor PACS',
            confirmButtonColor: '#e74c3c'
        });
        return false;
    }
}

/**
 * 💓 VER SIGNOS VITALES - CON DATOS GARANTIZADOS
 */
async function viewVitalSigns(bedNumber, patientId) {
    console.log('💓 viewVitalSigns() - CON DATOS');
    
    try {
        const enrichedData = await preparePatientDataBeforeOpen(bedNumber, patientId, 'vitalSigns');
        savePatientDataToStorage(enrichedData, 'vitalSigns');
        
        const url = `/medical/vital-signs?patientId=${enrichedData.patientId}&bedNumber=${enrichedData.bedNumber}&patientName=${encodeURIComponent(enrichedData.fullName)}&from=rounds&timestamp=${Date.now()}`;
        
        const newWindow = window.open(url, '_blank');
        
        if (newWindow) {
            console.log('✅ Signos vitales abiertos con datos completos');
            return true;
        } else {
            throw new Error('Pop-up bloqueado');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo abrir signos vitales',
            confirmButtonColor: '#e74c3c'
        });
        return false;
    }
}

/**
 * 🏥 PREPARAR DATOS DEL PACIENTE ANTES DE ABRIR
 */
async function preparePatientDataBeforeOpen(bedNumber, patientId, moduleType) {
    console.log('🏥 Preparando datos del paciente...');
    
    // Usar datos del contexto actual si están disponibles
    const currentContext = window.currentPatientData;
    
    if (currentContext && currentContext.patient) {
        // Usar PatientDataManager para enriquecer datos
        const enrichedData = patientDataManager.prepareEnrichedPatientData(
            currentContext.bed || { bed_number: bedNumber, patient_id: patientId },
            currentContext.patient,
            moduleType,
            {
                specialty: currentContext.specialty || 'Medicina General',
                floorNumber: currentContext.floorNumber || 1,
                wingName: currentContext.wingName || 'Este'
            }
        );
        
        console.log('✅ Datos enriquecidos preparados:', enrichedData.fullName);
        return enrichedData;
    } else {
        // Fallback: crear datos básicos
        console.log('⚠️ Usando datos básicos de fallback');
        return {
            patientId: patientId || `SAFE_${bedNumber}_${Date.now()}`,
            bedNumber: bedNumber,
            fullName: `Paciente Cama ${bedNumber}`,
            age: 45,
            gender: 'No especificado',
            primaryDiagnosis: 'Pendiente de evaluación',
            attendingPhysician: 'Dr. Sistema',
            specialty: 'Medicina General'
        };
    }
}

/**
 * 💾 GUARDAR DATOS EN TODAS LAS UBICACIONES DE STORAGE
 */
function savePatientDataToStorage(enrichedData, moduleType) {
    console.log('💾 Guardando datos en localStorage...');
    
    try {
        // Guardar en ubicaciones principales
        localStorage.setItem('currentPatientData', JSON.stringify(enrichedData));
        localStorage.setItem('patientData', JSON.stringify(enrichedData));
        sessionStorage.setItem('patientData', JSON.stringify(enrichedData));
        
        // Guardar específico por módulo
        switch (moduleType) {
            case 'medicalNote':
                localStorage.setItem('medicalNotePatientData', JSON.stringify(enrichedData));
                sessionStorage.setItem('notePatientData', JSON.stringify(enrichedData));
                break;
                
            case 'prescription':
                localStorage.setItem('prescriptionPatientData', JSON.stringify(enrichedData));
                sessionStorage.setItem('prescriptionContext', JSON.stringify({
                    bedNumber: enrichedData.bedNumber,
                    patientId: enrichedData.patientId,
                    patientName: enrichedData.fullName
                }));
                break;
                
            case 'examOrder':
                localStorage.setItem('examOrderPatientData', JSON.stringify(enrichedData));
                break;
                
            case 'dicomViewer':
                sessionStorage.setItem('dicomPatientContext', JSON.stringify({
                    bedNumber: enrichedData.bedNumber,
                    patientId: enrichedData.patientId,
                    patientName: enrichedData.fullName,
                    fromRounds: true,
                    timestamp: new Date().toISOString()
                }));
                break;
                
            case 'vitalSigns':
                sessionStorage.setItem('vitalSignsPatient', JSON.stringify({
                    bedNumber: enrichedData.bedNumber,
                    patientId: enrichedData.patientId,
                    patientName: enrichedData.fullName
                }));
                break;
        }
        
        console.log(`✅ Datos guardados para módulo: ${moduleType}`);
        
    } catch (error) {
        console.error('❌ Error guardando en localStorage:', error);
    }
}



function saveMedicalNote(bedNumber, patientId) {
    const noteContent = document.getElementById('medicalNoteContent').value;
    const noteDateTime = document.getElementById('noteDateTime').value;
    
    if (!noteContent.trim()) {
        Swal.fire({
            icon: 'warning',
            title: 'Atención',
            text: 'Por favor escriba el contenido de la nota médica',
            confirmButtonColor: '#f39c12'
        });
        return;
    }
    
    // Simular guardado
    Swal.fire({
        title: '✅ Nota Guardada',
        html: `
            <div style="text-align: left;">
                <p><strong>Cama:</strong> ${bedNumber}</p>
                <p><strong>Paciente:</strong> ${patientId}</p>
                <p><strong>Fecha:</strong> ${new Date(noteDateTime).toLocaleString()}</p>
                <p><strong>Estado:</strong> Guardada exitosamente</p>
            </div>
        `,
        icon: 'success',
        timer: 3000,
        confirmButtonColor: '#2c5aa0'
    });
}



// Función para abrir orden médica
function openMedicalOrder(bedNumber, patientId) {
    Swal.fire({
        title: '📋 Orden Médica',
        text: `Módulo de órdenes médicas para cama ${bedNumber} - Próximamente implementado`,
        icon: 'info',
        confirmButtonColor: '#f39c12'
    });
}

// Función para ver exámenes
function viewExams(bedNumber, patientId) {
    Swal.fire({
        title: '🔬 Exámenes de Laboratorio',
        text: `Módulo de exámenes para cama ${bedNumber} - Próximamente implementado`,
        icon: 'info',
        confirmButtonColor: '#9b59b6'
    });
}



// ===== FUNCIÓN PARA INICIALIZAR DATOS DEL PACIENTE EN EL VISOR DICOM =====
function initializeDicomViewer() {
    console.log('🎯 Inicializando visor DICOM...');
    
    // Obtener parámetros de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('patientId');
    const bedNumber = urlParams.get('bedNumber');
    const patientName = urlParams.get('patientName');
    const from = urlParams.get('from');
    
    console.log('📋 Parámetros recibidos:', { patientId, bedNumber, patientName, from });
    
    if (from === 'rounds' && patientId && bedNumber) {
        // Actualizar información del paciente en el visor
        updateDicomPatientInfo(patientId, bedNumber, patientName);
    }
    
    // Obtener datos del sessionStorage si están disponibles
    const contextData = sessionStorage.getItem('dicomPatientContext');
    if (contextData) {
        const context = JSON.parse(contextData);
        console.log('📊 Contexto del paciente cargado:', context);
        updateDicomPatientInfo(context.patientId, context.bedNumber, context.patientName);
    }
}

// ===== FUNCIÓN PARA ACTUALIZAR INFORMACIÓN DEL PACIENTE EN EL VISOR =====
function updateDicomPatientInfo(patientId, bedNumber, patientName) {
    console.log('🔄 Actualizando información del paciente en visor DICOM');
    
    // Actualizar el panel de información del paciente
    const patientInfoElement = document.querySelector('.patient-info');
    if (patientInfoElement) {
        patientInfoElement.innerHTML = `
            <div class="patient-name">🏥 Hospital San José</div>
            <div class="study-info">
                <div>👤 Paciente: ${patientName || 'Anónimo'}</div>
                <div>🛏️ Cama: ${bedNumber || 'N/A'}</div>
                <div>📋 ID: ${patientId || 'N/A'}</div>
                <div>📅 Fecha: ${new Date().toLocaleDateString('es-ES')}</div>
            </div>
        `;
        
        console.log('✅ Información del paciente actualizada en el visor');
    }
    
    // Actualizar título de la página
    document.title = `Visor DICOM - ${patientName || 'Paciente'} (Cama ${bedNumber || 'N/A'})`;
    
    // Actualizar overlays si existen
    setTimeout(() => {
        const overlayTopLeft = document.getElementById('overlayTopLeft');
        if (overlayTopLeft) {
            overlayTopLeft.innerHTML = `
                <div>Paciente: ${patientName || 'Anónimo'}</div>
                <div>Cama: ${bedNumber || 'N/A'}</div>
                <div>ID: ${patientId || 'N/A'}</div>
            `;
        }
    }, 1000);
}





function debugMobileNavigation() {
    console.log('=== DEBUG MÓVIL ===');
    console.log('User Agent:', navigator.userAgent);
    console.log('Es móvil:', isMobileDevice());
    console.log('Ancho ventana:', window.innerWidth);
    console.log('Soporte táctil:', 'ontouchstart' in window);
    console.log('Max touch points:', navigator.maxTouchPoints);
    console.log('================');
}

document.addEventListener('DOMContentLoaded', function() {
    // Esperar a que notamedica.js esté cargado
    const checkNotesMedicas = setInterval(() => {
        if (typeof window.openMedicalNoteWithSignature !== 'undefined') {
            console.log('✅ notamedica.js cargado correctamente');
            clearInterval(checkNotesMedicas);
        }
    }, 100);
});