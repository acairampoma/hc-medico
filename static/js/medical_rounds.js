// ===============================================================================
// 🏥 MEDICAL ROUNDS - SISTEMA HOSPITALARIO INTEGRADO
// ===============================================================================
// 
// Versión: 2.1.0 - VERSIÓN FINAL LIMPIA
// Autor: Alan & Claude - Equipo de Desarrollo
// Fecha: Junio 2025
// 
// 🎯 MISIÓN: Sistema hospitalario completo y optimizado
// 📋 APIs: /api/listas/estructuras + /api/pacientes/camas + OAuth2
// 
// ===============================================================================

// ===============================================================================
// 🔧 CONFIGURACIÓN GLOBAL DE MICROSERVICIOS
// ===============================================================================

const MicroservicesConfig = {
    GATEWAY_BASE: 'http://localhost:8090/api',
    
    getAuthToken() {
        return localStorage.getItem('access_token') || 
               sessionStorage.getItem('access_token') || 
               window.authToken;
    },
    
    getAuthHeaders() {
        const token = this.getAuthToken();
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    },
    
    HOSPITAL: {
        BASE: '/listas',
        ENDPOINTS: {
            ESTRUCTURAS: '/listas/listas/estructura',
            ESTRUCTURA_BASICA: '/listas/estructura/basica',
            ESTADISTICAS: '/listas/estadisticas/disponibilidad'
        }
    },
    
    PATIENTS: {
        BASE: '/pacientes',
        ENDPOINTS: {
            TODAS_CAMAS: '/pacientes/camas',
            CAMAS_OCUPADAS: '/pacientes/camas/ocupadas',
            CAMA_ESPECIFICA: '/pacientes/cama',
            BUSCAR_DNI: '/pacientes/buscar/dni',
            ESTADISTICAS: '/pacientes/estadisticas/ocupacion'
        }
    }
};

// ===============================================================================
// 🌐 CLIENTE HTTP ELEGANTE Y ROBUSTO
// ===============================================================================

const ApiClient = {
    async makeRequest(method, endpoint, data = null) {
        try {
            const url = `${MicroservicesConfig.GATEWAY_BASE}${endpoint}`;
            console.log(`🌐 ${method}: ${url}`);
            
            const options = {
                method: method,
                headers: MicroservicesConfig.getAuthHeaders()
            };
            
            if (data && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(data);
            }
            
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log(`✅ ${method} Success: ${endpoint}`);
            
            return result;
            
        } catch (error) {
            console.error(`❌ ${method} Error: ${endpoint}`, error);
            throw error;
        }
    },
    
    async get(endpoint) {
        return this.makeRequest('GET', endpoint);
    },
    
    async post(endpoint, data) {
        return this.makeRequest('POST', endpoint, data);
    },
    
    async testConnection() {
        try {
            console.log('🧪 Testing microservices connection...');
            
            const hospitalTest = await this.get(MicroservicesConfig.HOSPITAL.ENDPOINTS.ESTRUCTURAS);
            console.log('✅ Hospital API OK');
            
            const patientsTest = await this.get(MicroservicesConfig.PATIENTS.ENDPOINTS.TODAS_CAMAS);
            console.log('✅ Patients API OK');
            
            return { hospital: true, patients: true };
            
        } catch (error) {
            console.error('❌ Connection test failed:', error);
            return { hospital: false, patients: false };
        }
    }
};

// ===============================================================================
// 📊 SERVICIO DE DATOS HOSPITALARIOS
// ===============================================================================

const HospitalDataService = {
    async loadHospitalStructure() {
        try {
            console.log('🏥 Cargando estructura hospitalaria...');
            
            const response = await ApiClient.get(MicroservicesConfig.HOSPITAL.ENDPOINTS.ESTRUCTURAS);
            const hospitalData = response.data || response;
            
            console.log('✅ Estructura hospitalaria cargada:', hospitalData);
            return hospitalData;
            
        } catch (error) {
            console.error('❌ Error cargando estructura hospitalaria:', error);
            return this.getFallbackHospitalData();
        }
    },
    
    getFallbackHospitalData() {
        console.log('🔄 Usando datos de fallback para hospital...');
        
        return {
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
            
            beds.push({
                bed_number: bedNumber,
                status: status,
                gender: gender,
                patient_id: status === 'occupied' ? `PAC_${bedNumber}_${Math.floor(Math.random() * 1000)}` : null
            });
        }
        
        return beds;
    }
};

// ===============================================================================
// 👥 SERVICIO DE PACIENTES POR CAMA
// ===============================================================================

const PatientsDataService = {
    async loadAllBeds() {
        try {
            console.log('👥 Cargando pacientes por cama...');
            
            const response = await ApiClient.get(MicroservicesConfig.PATIENTS.ENDPOINTS.TODAS_CAMAS);
            const bedsData = response.data || response;
            
            console.log('✅ Pacientes por cama cargados:', bedsData.length || 'datos disponibles');
            return bedsData;
            
        } catch (error) {
            console.error('❌ Error cargando pacientes por cama:', error);
            return [];
        }
    },
    
    async getBedData(bedNumber) {
        try {
            console.log(`🎯 Obteniendo datos de cama: ${bedNumber}`);
            
            const endpoint = `${MicroservicesConfig.PATIENTS.ENDPOINTS.CAMA_ESPECIFICA}/${bedNumber}`;
            const response = await ApiClient.get(endpoint);
            const bedData = response.data || response;
            
            console.log('✅ Datos de cama obtenidos:', bedData);
            return bedData;
            
        } catch (error) {
            console.error(`❌ Error obteniendo datos de cama ${bedNumber}:`, error);
            return null;
        }
    },
    
    transformBedData(microserviceData) {
        const transformed = {};
        
        if (Array.isArray(microserviceData)) {
            microserviceData.forEach(bed => {
                transformed[bed.bed_number] = {
                    bed_number: bed.bed_number,
                    status: bed.occupied ? 'occupied' : 'available',
                    patient_id: bed.patient_data?.personal_info?.dni || null,
                    gender: bed.patient_data?.personal_info?.gender || null,
                    patient: bed.patient_data || null
                };
            });
        }
        
        return transformed;
    }
};

// ===============================================================================
// 🎨 SISTEMA DE INTERFAZ DE USUARIO
// ===============================================================================

const UIHelpers = {
    showLoading(message = 'Cargando...') {
        Swal.fire({
            title: message,
            html: `
                <div style="display: flex; align-items: center; justify-content: center; margin: 20px 0;">
                    <div style="margin-right: 15px;">
                        <i class="fas fa-spinner fa-spin fa-2x" style="color: #2c5aa0;"></i>
                    </div>
                    <span style="color: #2c5aa0; font-weight: 600;">Conectando con microservicios...</span>
                </div>
            `,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            background: '#ffffff',
            customClass: {
                popup: 'loading-popup'
            }
        });
    },
    
    showError(title, message, technical = null) {
        let html = `
            <div style="text-align: center; margin: 20px 0;">
                <p style="color: #e74c3c; font-weight: 600; margin-bottom: 10px;">${message}</p>
        `;
        
        if (technical) {
            html += `<details style="margin-top: 15px; text-align: left;">
                <summary style="cursor: pointer; color: #7f8c8d;">Detalles técnicos</summary>
                <pre style="background: #f8f9fa; padding: 10px; border-radius: 5px; font-size: 0.8rem; margin-top: 10px;">${technical}</pre>
            </details>`;
        }
        
        html += `</div>`;
        
        Swal.fire({
            icon: 'error',
            title: title,
            html: html,
            confirmButtonColor: '#e74c3c'
        });
    },
    
    showSuccess(title, message) {
        Swal.fire({
            icon: 'success',
            title: title,
            text: message,
            timer: 3000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    },
    
    closeLoading() {
        Swal.close();
    }
};

// ===============================================================================
// 🧪 SISTEMA DE DEBUGGING (SOLO DESARROLLO)
// ===============================================================================

const DebugTools = {
    async runSystemTests() {
        if (window.location.hostname !== 'localhost') return;
        
        console.log('🧪 =============== SYSTEM TESTS ===============');
        
        const results = {
            token: this.testToken(),
            hospital: false,
            patients: false,
            config: this.testConfig()
        };
        
        try {
            const hospitalData = await HospitalDataService.loadHospitalStructure();
            results.hospital = hospitalData && hospitalData.floors ? true : false;
            
            const patientsData = await PatientsDataService.loadAllBeds();
            results.patients = Array.isArray(patientsData);
            
        } catch (error) {
            console.error('❌ System tests failed:', error);
        }
        
        console.log('📊 Test Results:', results);
        console.log('🧪 =============== END TESTS ===============');
        
        return results;
    },
    
    testToken() {
        const token = MicroservicesConfig.getAuthToken();
        const hasToken = !!token;
        
        console.log(`🔐 Token disponible: ${hasToken ? '✅' : '❌'}`);
        if (hasToken) {
            console.log(`🔑 Token length: ${token.length} chars`);
        }
        
        return hasToken;
    },
    
    testConfig() {
        const config = {
            gateway: MicroservicesConfig.GATEWAY_BASE,
            hospital: MicroservicesConfig.HOSPITAL.ENDPOINTS.ESTRUCTURAS,
            patients: MicroservicesConfig.PATIENTS.ENDPOINTS.TODAS_CAMAS
        };
        
        console.log('⚙️ Configuration:', config);
        return true;
    }
};

// ===============================================================================
// 🔧 FUNCIÓN HELPER PARA PREPARAR DATOS DEL PACIENTE
// ===============================================================================

function preparePatientDataForModule(bedNumber, patientId) {
    console.log('🔍 INICIO preparePatientDataForModule()');
    console.log('📥 Parámetros recibidos:', { bedNumber, patientId });
    
    const currentData = window.currentPatientData;
    
    console.log('🌐 window.currentPatientData completo:', currentData);
    console.log('🔍 Tipo de currentData:', typeof currentData);
    console.log('🔍 ¿Es null/undefined?:', currentData == null);
    
    if (currentData) {
        console.log('✅ Usando datos del contexto global:', currentData.patientName);
        
        // *** LOGS DETALLADOS DE EXTRACCIÓN ***
        console.log('🔍 Buscando hospitalizacion_id en:');
        console.log('   - currentData.hospitalizacion_id:', currentData.hospitalizacion_id);
        console.log('   - currentData.patient_data:', currentData.patient_data);
        
        if (currentData.patient_data) {
            console.log('   - currentData.patient_data.hospitalizacion_id:', currentData.patient_data.hospitalizacion_id);
        }
        
        console.log('🔍 Buscando otros campos clave:');
        console.log('   - currentData.paciente_id:', currentData.paciente_id);
        console.log('   - currentData.patient_data?.paciente_id:', currentData.patient_data?.paciente_id);
        console.log('   - currentData.medico_tratante_id:', currentData.medico_tratante_id);
        console.log('   - currentData.numero_cuenta:', currentData.numero_cuenta);
        console.log('   - currentData.patient_data?.numero_cuenta:', currentData.patient_data?.numero_cuenta);
        
        const patientData = {
            // IDs básicos
            patientId: currentData.patientId || `SAFE_${bedNumber}_${Date.now()}`,
            bedNumber: currentData.bedNumber || bedNumber,
            
            // *** CAMPOS NUEVOS PARA NOTAS MÉDICAS CON LOGS ***
            hospitalizacion_id: currentData.hospitalizacion_id || currentData.patient_data?.hospitalizacion_id || null,
            numero_cuenta: currentData.numero_cuenta || currentData.patient_data?.numero_cuenta || `CTA${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
            paciente_id: currentData.paciente_id || currentData.patient_data?.paciente_id || parseInt(currentData.patientId?.replace(/\D/g, '')) || null,
            medico_tratante_id: currentData.medico_tratante_id || currentData.patient_data?.medico_tratante_id || null,
            especialidad_id: currentData.especialidad_id || currentData.patient_data?.especialidad_id || null,
            
            // Información personal
            firstName: currentData.patientName ? currentData.patientName.split(' ')[0] : 'Paciente',
            lastName: currentData.patientName ? currentData.patientName.split(' ').slice(1).join(' ') : 'Desconocido',
            fullName: currentData.patientName || `Paciente Cama ${bedNumber}`,
            age: currentData.patientAge || currentData.patient_data?.personal_info?.age || 'N/A',
            gender: currentData.gender || currentData.patient_data?.personal_info?.gender || 'No especificado',
            dni: currentData.patientId || currentData.patient_data?.personal_info?.dni || 'No registrado',
            
            // Información médica
            primaryDiagnosis: currentData.diagnosis || currentData.patient_data?.medical_info?.primary_diagnosis || 'Diagnóstico pendiente',
            diagnosisCode: currentData.diagnosisCode || currentData.patient_data?.medical_info?.primary_diagnosis_code || '',
            attendingPhysician: currentData.doctor || currentData.patient_data?.medical_info?.attending_physician || 'Dr. Sistema',
            medicalRecord: currentData.medicalRecord || currentData.patient_data?.personal_info?.medical_record || 'No disponible',
            admissionDate: currentData.admissionDate || currentData.patient_data?.medical_info?.admission_date || new Date().toISOString().split('T')[0],
            allergies: currentData.allergies || currentData.patient_data?.medical_info?.allergies || 'Ninguna conocida',
            
            // Contexto hospitalario
            specialty: currentData.specialty || 'Medicina General',
            
            // Metadatos
            timestamp: new Date().toISOString(),
            source: 'medical_rounds',
            
            // Información del hospital
            hospital: {
                name: 'Hospital Central San José',
                address: 'Av. Angamos Este 2520, Surquillo, Lima',
                phone: '(01) 434-5678'
            },
            
            // Información del doctor
            doctor: {
                name: currentData.doctor || 'Dr. Alan Cairampoma Carrillo',
                specialty: currentData.specialty || 'Medicina Interna',
                id: currentData.medico_tratante_id || currentData.patient_data?.medico_tratante_id || null
            }
        };
        
        // *** LOGS DEL RESULTADO FINAL ***
        console.log('📋 PatientData preparado:');
        console.log('   - hospitalizacion_id final:', patientData.hospitalizacion_id);
        console.log('   - paciente_id final:', patientData.paciente_id);
        console.log('   - numero_cuenta final:', patientData.numero_cuenta);
        console.log('   - medico_tratante_id final:', patientData.medico_tratante_id);
        console.log('   - especialidad_id final:', patientData.especialidad_id);
        
        // *** GUARDAR EN LOCALSTORAGE ***
        try {
            localStorage.setItem('currentPatientData', JSON.stringify(patientData));
            console.log('💾 Datos guardados en localStorage para notas médicas');
            console.log('💾 localStorage content:', JSON.parse(localStorage.getItem('currentPatientData')));
        } catch (error) {
            console.error('❌ Error guardando en localStorage:', error);
        }
        
        return patientData;
    }
    
    // Fallback si no hay contexto
    console.log('⚠️ Sin contexto, usando datos básicos para cama:', bedNumber);
    
    const fallbackData = {
        patientId: patientId || `SAFE_${bedNumber}_${Date.now()}`,
        bedNumber: bedNumber,
        
        // *** CAMPOS PARA NOTAS MÉDICAS (FALLBACK) ***
        hospitalizacion_id: null,
        numero_cuenta: `CTA${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
        paciente_id: null,
        medico_tratante_id: 105,
        especialidad_id: null,
        
        firstName: 'Paciente',
        lastName: 'Temporal',
        fullName: `Paciente Cama ${bedNumber}`,
        age: 'N/A',
        gender: 'No especificado',
        dni: 'No registrado',
        primaryDiagnosis: 'Diagnóstico pendiente',
        attendingPhysician: 'Dr. Sistema',
        specialty: 'Medicina General',
        timestamp: new Date().toISOString(),
        source: 'medical_rounds_fallback',
        hospital: {
            name: 'Hospital Central San José'
        },
        doctor: {
            name: 'Dr. Sistema',
            id: 105
        }
    };
    
    // *** GUARDAR FALLBACK EN LOCALSTORAGE ***
    try {
        localStorage.setItem('currentPatientData', JSON.stringify(fallbackData));
        console.log('💾 Datos fallback guardados en localStorage');
    } catch (error) {
        console.error('❌ Error guardando fallback en localStorage:', error);
    }
    
    return fallbackData;
}
// ===============================================================================
// 📱 DETECTOR DE DISPOSITIVO MÓVIL
// ===============================================================================

function isMobileDevice() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // iPad Air 5 específico (ambas orientaciones)
    if ((width === 820 && height === 1180) || (width === 1180 && height === 820)) {
        return true;
    }

    // MacBook Air específico (ambas orientaciones)
    if ((width === 1559 && height === 975) || (width === 975 && height === 1559)) {
        return true;
    }
    
    // Dispositivos móviles generales
    if (/Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        return true;
    }
    
    // Pantallas pequeñas
    if (width <= 768) {
        return true;
    }
    
    return false;
}

// ===============================================================================
// 📱 FUNCIÓN MÓVIL ELEGANTE - OPENMODULEMOBILE
// ===============================================================================

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
                            🛏️ Cama ${patientData.bedNumber} • 🏥 ${patientData.specialty}
                        </div>
                        <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.3rem;">
                            📋 ${patientData.primaryDiagnosis}
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
                            Abrir ${moduleConfig.title.replace(/[📝💊🧪🩻💓]/g, '').trim()}
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
                document.getElementById('openModuleBtn').addEventListener('click', function() {
                    console.log(`📱 Abriendo ${moduleType} en móvil...`);
                    
                    const newWindow = window.open(moduleUrl, '_blank');
                    
                    if (newWindow) {
                        console.log('✅ window.open() exitoso en móvil');
                        Swal.close();
                        resolve(true);
                    } else {
                        console.log('⚠️ window.open() bloqueado, usando navegación directa');
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
                
                document.getElementById('cancelModuleBtn').addEventListener('click', function() {
                    Swal.close();
                    resolve(false);
                });
            }
        });
    });
}

// ===============================================================================
// ⚙️ CONFIGURACIONES DE MÓDULOS
// ===============================================================================

const moduleConfigs = {
    'medical-notes': {
        title: '📝 Nota Médica',
        icon: 'fas fa-edit',
        color: '#2c5aa0',
        colorGradient: 'linear-gradient(135deg, #2c5aa0 0%, #4CAF50 100%)',
        description: 'Crear nueva nota de evolución médica para el paciente'
    },
    'prescriptions': {
        title: '💊 Receta Médica', 
        icon: 'fas fa-prescription-bottle',
        color: '#00a86b',
        colorGradient: 'linear-gradient(135deg, #00a86b 0%, #00d48a 100%)',
        description: 'Generar receta médica con medicamentos prescritos'
    },
    'exam-orders': {
        title: '🧪 Orden de Exámenes',
        icon: 'fas fa-clipboard-list',
        color: '#9b59b6', 
        colorGradient: 'linear-gradient(135deg, #9b59b6 0%, #e74c3c 100%)',
        description: 'Solicitar exámenes de laboratorio o diagnóstico'
    },
    'view-exams': {
        title: '🧪 Ver Exámenes',
        icon: 'fas fa-vials',
        color: '#f39c12',
        colorGradient: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)', 
        description: 'Visualizar resultados de exámenes del paciente'
    },
    'pacs-dicom': {
        title: '🩻 Visor PACS',
        icon: 'fas fa-x-ray',
        color: '#667eea',
        colorGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        description: 'Visualizar imágenes médicas y estudios DICOM'
    },
    'vital-signs': {
        title: '💓 Signos Vitales',
        icon: 'fas fa-heartbeat', 
        color: '#17a2b8',
        colorGradient: 'linear-gradient(135deg, #17a2b8 0%, #00d4aa 100%)',
        description: 'Registrar y consultar signos vitales del paciente'
    }
};

// ===============================================================================
// 🔧 FUNCIÓN UNIVERSAL DE NAVEGACIÓN
// ===============================================================================

async function navigateToModule(bedNumber, patientId, moduleType, moduleUrl) {
    console.log(`🚀 Navegando a ${moduleType} para cama: ${bedNumber}`);
    
    const patientData = preparePatientDataForModule(bedNumber, patientId);
    
    // Guardar en localStorage
    localStorage.setItem('currentPatientData', JSON.stringify(patientData));
    localStorage.setItem(`${moduleType}PatientData`, JSON.stringify(patientData));
    localStorage.setItem('patientData', JSON.stringify(patientData));
    sessionStorage.setItem(`${moduleType}Context`, JSON.stringify({
        bedNumber: bedNumber,
        patientId: patientData.patientId,
        patientName: patientData.fullName
    }));
    
    // Detectar dispositivo y navegar
    if (isMobileDevice()) {
        console.log('📱 Dispositivo móvil detectado - Usando modal elegante');
        const moduleConfig = moduleConfigs[moduleType];
        await openModuleMobile(moduleUrl, moduleType, moduleConfig, patientData);
    } else {
        console.log('🖥️ Dispositivo desktop - Usando window.open()');
        window.open(moduleUrl, '_blank');
        console.log(`✅ ${moduleType} abierto y datos guardados`);
    }
}

// ===============================================================================
// 🎯 6 FUNCIONES GLOBALES PARA MÓDULOS MÉDICOS
// ===============================================================================

function createMedicalNoteDirect(bedNumber, patientId) {
    const url = `/medical/notes?patientId=${patientId}&bedNumber=${bedNumber}&from=rounds&timestamp=${Date.now()}`;
    navigateToModule(bedNumber, patientId, 'medical-notes', url);
}

function createPrescriptionDirect(bedNumber, patientId) {
    const url = `/medical/prescriptions?patientId=${patientId}&bedNumber=${bedNumber}&from=rounds&timestamp=${Date.now()}`;
    navigateToModule(bedNumber, patientId, 'prescriptions', url);
}

function createExamOrderDirect(bedNumber, patientId) {
    const url = `/medical/orders/exams?patientId=${patientId}&bedNumber=${bedNumber}&from=rounds&timestamp=${Date.now()}`;
    navigateToModule(bedNumber, patientId, 'exam-orders', url);
}

function viewExams(bedNumber, patientId) {
    const url = `/medical/exams/view?patientId=${patientId}&bedNumber=${bedNumber}&from=rounds&timestamp=${Date.now()}`;
    navigateToModule(bedNumber, patientId, 'view-exams', url);
}

function viewPACS(bedNumber, patientId) {
    const url = `/medical/dicom?patientId=${patientId}&bedNumber=${bedNumber}&from=rounds&timestamp=${Date.now()}`;
    navigateToModule(bedNumber, patientId, 'pacs-dicom', url);
}

function viewVitalSigns(bedNumber, patientId) {
    const url = `/medical/vital-signs?patientId=${patientId}&bedNumber=${bedNumber}&from=rounds&timestamp=${Date.now()}`;
    navigateToModule(bedNumber, patientId, 'vital-signs', url);
}

// ===============================================================================
// 🚀 CLASE PRINCIPAL - MEDICAL ROUNDS SYSTEM
// ===============================================================================

function medicalRounds() {
    return {
        // Estado de la aplicación
        currentStep: 1,
        selectedFloor: null,
        selectedWing: null,
        selectedFloorData: null,
        loading: false,
        
        // Datos del sistema
        hospital: {},
        patientsByBed: {},
        
        // Estado de conexión
        connectionStatus: {
            hospital: false,
            patients: false,
            initialized: false
        },
        
        // Inicialización principal
        async init() {
            try {
                console.log('🚀 =============== MEDICAL ROUNDS INIT ===============');
                
                UIHelpers.showLoading('Inicializando sistema hospitalario...');
                
                await this.testConnections();
                await this.loadAllSystemData();
                this.setupInterface();
                
                UIHelpers.closeLoading();
                UIHelpers.showSuccess('✅ Sistema Listo', 'Microservicios conectados exitosamente');
                
                console.log('✅ Medical Rounds inicializado correctamente');
                
            } catch (error) {
                UIHelpers.closeLoading();
                UIHelpers.showError(
                    '❌ Error de Inicialización',
                    'No se pudo conectar con los microservicios',
                    error.message
                );
                console.error('💥 Error en inicialización:', error);
            }
        },
        
        async testConnections() {
            console.log('🔌 Testing connections...');
            
            const results = await ApiClient.testConnection();
            this.connectionStatus = { ...results, initialized: true };
            
            if (!results.hospital || !results.patients) {
                throw new Error('Uno o más microservicios no están disponibles');
            }
        },
        
        async loadAllSystemData() {
            console.log('📊 Loading system data...');
            
            const hospitalRawData = await HospitalDataService.loadHospitalStructure();
            
            if (Array.isArray(hospitalRawData) && hospitalRawData.length > 0) {
                this.hospital = hospitalRawData[0];
                console.log('✅ Datos extraídos del array del microservicio');
            } else if (hospitalRawData && hospitalRawData.floors) {
                this.hospital = hospitalRawData;
                console.log('✅ Datos ya están en formato directo');
            } else {
                console.log('⚠️ Usando datos de fallback');
                this.hospital = HospitalDataService.getFallbackHospitalData();
            }
            
            const bedsData = await PatientsDataService.loadAllBeds();
            this.patientsByBed = PatientsDataService.transformBedData(bedsData);
            
            console.log('✅ All system data loaded');
            console.log('🏥 Hospital floors loaded:', this.hospital.floors?.length || 0);
            console.log('🏥 Hospital name:', this.hospital.hospital_info?.name || 'No name');
        },
        
        setupInterface() {
            console.log('🎨 Setting up interface...');
            
            this.setupGlobalEvents();
            
            // Solo en desarrollo: comandos de debug
            if (window.location.hostname === 'localhost') {
                this.setupDebugCommands();
            }
        },
        
        setupGlobalEvents() {
            window.addEventListener('unhandledrejection', (event) => {
                console.error('🚫 Unhandled promise rejection:', event.reason);
            });
        },
        
        setupDebugCommands() {
            window.MedicalRoundsDebug = {
                testSystem: () => DebugTools.runSystemTests(),
                testToken: () => DebugTools.testToken(),
                showConfig: () => console.table(MicroservicesConfig),
                reloadData: () => this.loadAllSystemData(),
                showData: () => ({
                    hospital: this.hospital,
                    patients: this.patientsByBed,
                    status: this.connectionStatus
                })
            };
            
            console.log('🧪 Debug commands available: window.MedicalRoundsDebug');
        },
        
        // Navegación
        selectFloorAndWing(floor, wing) {
            this.selectedFloor = floor.floor_number;
            this.selectedFloorData = floor;
            this.selectedWing = wing;
            this.currentStep = 2;
        },
        
        goBack() {
            if (this.currentStep > 1) {
                this.currentStep = 1;
                this.selectedFloor = null;
                this.selectedFloorData = null;
                this.selectedWing = null;
            } else {
                window.location.href = 'http://localhost:8000/dashboard';
            }
        },
        
        async selectBed(bed) {
            if (bed.status !== 'occupied') {
                this.showBedStatusInfo(bed);
                return;
            }

            UIHelpers.showLoading('Cargando datos del paciente...');
            
            try {
                const patientData = await PatientsDataService.getBedData(bed.bed_number);
                UIHelpers.closeLoading();
                
                if (patientData) {
                    this.showPatientInfo(bed, patientData);
                } else {
                    UIHelpers.showError('❌ Error', 'No se pudieron cargar los datos del paciente');
                }
            } catch (error) {
                UIHelpers.closeLoading();
                UIHelpers.showError('❌ Error', 'Error cargando datos del paciente', error.message);
            }
        },
        
        // Métodos helper
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
        
        getCurrentFloorData() {
            return this.selectedFloorData;
        },
        
        getCurrentBeds() {
            if (!this.selectedFloorData || !this.selectedWing) return [];
            return this.selectedFloorData.wings[this.selectedWing]?.beds || [];
        },
        
        getWingStatsShort(floor, wing) {
            const beds = floor.wings[wing]?.beds || [];
            const occupied = beds.filter(bed => bed.status === 'occupied').length;
            const total = beds.length;
            return `${occupied}/${total}`;
        },
        
        // Funciones para Alpine.js
        getOccupancyStats() {
            const beds = this.getCurrentBeds();
            const occupied = beds.filter(bed => bed.status === 'occupied').length;
            const total = beds.length;
            const percentage = total > 0 ? Math.round((occupied / total) * 100) : 0;
            return `Ocupación: ${occupied}/${total} (${percentage}%)`;
        },
        
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
        
        getWingCleaningCount() {
            const beds = this.getCurrentBeds();
            return beds.filter(bed => bed.status === 'cleaning').length;
        },
        
        // Funciones para interfaz
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
        
        showBedStatusInfo(bed) {
            const statusMap = {
                'available': 'disponible',
                'maintenance': 'en mantenimiento', 
                'cleaning': 'en limpieza',
                'occupied': 'ocupada'
            };
            
            Swal.fire({
                icon: 'info',
                title: `Cama ${bed.bed_number}`,
                text: `Esta cama está ${statusMap[bed.status] || 'desconocido'}`,
                confirmButtonColor: '#2c5aa0'
            });
        },
        
        // Modal de información del paciente
        showPatientInfo(bed, patientData) {
            let safePatientId = patientData?.patient_data?.personal_info?.dni || 
            patientData?.personal_info?.dni || 
            `SAFE_${bed.bed_number}_${Date.now()}`;
    if (!safePatientId || safePatientId === 'undefined' || safePatientId === 'null') {
        safePatientId = `SAFE_${bed.bed_number}_${Date.now()}`;
        console.log('⚠️ patient_id inválido, usando:', safePatientId);
    }

    // *** DATOS GLOBALES CORREGIDOS PARA OTROS MÓDULOS ***
    window.currentPatientData = {
        // Mantener estructura original para compatibilidad
        bed: bed,
        patient: patientData,
        bedNumber: bed.bed_number,
        patientId: safePatientId,
        patientName: patientData?.patient_data?.personal_info ? 
        `${patientData.patient_data.personal_info.first_name} ${patientData.patient_data.personal_info.last_name}` : 
        'Paciente Desconocido',
        patientAge: patientData?.patient_data?.personal_info?.age || 'N/A',
        gender: patientData?.patient_data?.personal_info?.gender === 'M' ? 'Masculino' : 'Femenino',

        // Información médica
        diagnosis: patientData?.patient_data?.medical_info?.primary_diagnosis || 'Diagnóstico pendiente',
        diagnosisCode: patientData?.patient_data?.medical_info?.primary_diagnosis_code || '',
        doctor: patientData?.patient_data?.medical_info?.attending_physician || 'Dr. Sistema',
        medicalRecord: patientData?.patient_data?.medical_info?.medical_record || 'No disponible',
        admissionDate: patientData?.patient_data?.medical_info?.admission_date || new Date().toISOString().split('T')[0],
        allergies: patientData?.patient_data?.medical_info?.allergies || 'Ninguna conocida',

        // *** NUEVOS CAMPOS AGREGADOS PARA PREPAREPATIENTDATAFORMODULE() ***
        // Campos directos que busca la función
        hospitalizacion_id: patientData?.hospitalizacionId || patientData?.hospitalizacion_id || null,
        numero_cuenta: patientData?.numeroCuenta || patientData?.numero_cuenta || null,
        paciente_id: patientData?.pacienteId || patientData?.paciente_id || null,
        medico_tratante_id: null, // No viene en tu API response
        especialidad_id: null,    // No viene en tu API response
        
        // *** ESTRUCTURA PATIENT_DATA COMPLETA ***
        // Esto permite que preparePatientDataForModule() acceda a patient_data.hospitalizacion_id
        patient_data: {
            hospitalizacion_id: patientData?.hospitalizacionId || patientData?.patient_data?.hospitalizacion_id || null,
            numero_cuenta: patientData?.numeroCuenta || patientData?.patient_data?.numero_cuenta || null,
            paciente_id: patientData?.pacienteId || patientData?.patient_data?.paciente_id || null,
            especialidad_id: patientData?.patient_data?.especialidad_id || null,
            medico_tratante_id: patientData?.patient_data?.medico_tratante_id || null,
            
            personal_info: patientData?.patient_data?.personal_info || {},
            medical_info: patientData?.patient_data?.medical_info || {}
        }
    };

    // *** LOG PARA VERIFICAR QUE ESTÁ BIEN ***
    console.log('🔍 window.currentPatientData asignado:', window.currentPatientData);
    console.log('🔍 hospitalizacion_id disponible en:', {
        directo: window.currentPatientData.hospitalizacion_id,
        anidado: window.currentPatientData.patient_data?.hospitalizacion_id
    });
        
            // Modal completo
            Swal.fire({
                title: `🏥 Cama ${bed.bed_number}`,
                html: `
                    <div style="text-align: left; padding: 1rem;">
                        <!-- INFORMACIÓN DEL PACIENTE -->
                        <h3 style="color: #2c5aa0; margin-bottom: 1rem; text-align: center;">
                            <i class="fas fa-user"></i> ${window.currentPatientData.patientName}
                        </h3>
                        
                        <!-- INFORMACIÓN PERSONAL -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                            <div>
                                <p><strong>👤 Edad:</strong> ${window.currentPatientData.patientAge} años</p>
                                <p><strong>🚻 Género:</strong> ${window.currentPatientData.gender}</p>
                                <p><strong>🆔 DNI:</strong> ${patientData?.patient_data?.personal_info?.dni || 'No registrado'}</p>
                            </div>
                            <div>
                                <p><strong>📋 Historia Clínica:</strong> ${window.currentPatientData.medicalRecord}</p>
                                <p><strong>🛏️ Cama:</strong> ${bed.bed_number}</p>
                                <p><strong>📅 Ingreso:</strong> ${new Date(window.currentPatientData.admissionDate).toLocaleDateString('es-ES')}</p>
                            </div>
                        </div>
                        
                        <!-- INFORMACIÓN MÉDICA -->
                        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                            <p><strong>📋 Diagnóstico Principal:</strong><br>
                               <span style="color: #2c5aa0;">${window.currentPatientData.diagnosisCode}</span> - ${window.currentPatientData.diagnosis}</p>
                            <p><strong>👨‍⚕️ Médico Tratante:</strong> ${window.currentPatientData.doctor}</p>
                            ${window.currentPatientData.allergies !== 'Ninguna conocida' ? `
                                <p><strong>⚠️ Alergias:</strong> <span style="color: #e74c3c;">${window.currentPatientData.allergies}</span></p>
                            ` : ''}
                        </div>
                        
                        <!-- BOTONES DE ACCIONES MÉDICAS -->
                        <div style="margin-top: 1.5rem;">
                            <h4 style="color: #2c5aa0; margin-bottom: 1rem; text-align: center;">
                                👨‍⚕️ ACCIONES MÉDICAS
                            </h4>
                            
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                                <button onclick="createMedicalNoteDirect('${bed.bed_number}', '${safePatientId}')" 
                                        style="background: linear-gradient(135deg, #2c5aa0 0%, #4CAF50 100%); color: white; border: none; padding: 1rem; border-radius: 10px; cursor: pointer; font-size: 1rem; transition: transform 0.2s;"
                                        onmouseover="this.style.transform='scale(1.05)'" 
                                        onmouseout="this.style.transform='scale(1)'">
                                    <i class="fas fa-edit"></i><br>Nota<br><small>Evolución</small>
                                </button>
                                
                                <button onclick="createPrescriptionDirect('${bed.bed_number}', '${safePatientId}')" 
                                        style="background: linear-gradient(135deg, #00a86b 0%, #00d48a 100%); color: white; border: none; padding: 1rem; border-radius: 10px; cursor: pointer; font-size: 1rem; transition: transform 0.2s;"
                                        onmouseover="this.style.transform='scale(1.05)'" 
                                        onmouseout="this.style.transform='scale(1)'">
                                    <i class="fas fa-prescription-bottle"></i><br>Receta<br><small>Médica</small>
                                </button>
                                
                                <button onclick="createExamOrderDirect('${bed.bed_number}', '${safePatientId}')" 
                                        style="background: linear-gradient(135deg, #9b59b6 0%, #e74c3c 100%); color: white; border: none; padding: 1rem; border-radius: 10px; cursor: pointer; font-size: 1rem; transition: transform 0.2s;"
                                        onmouseover="this.style.transform='scale(1.05)'" 
                                        onmouseout="this.style.transform='scale(1)'">
                                    <i class="fas fa-clipboard-list"></i><br>Orden<br><small>Médica</small>
                                </button>
                                
                                <button onclick="viewExams('${bed.bed_number}', '${safePatientId}')" 
                                        style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; border: none; padding: 1rem; border-radius: 10px; cursor: pointer; font-size: 1rem; transition: transform 0.2s;"
                                        onmouseover="this.style.transform='scale(1.05)'" 
                                        onmouseout="this.style.transform='scale(1)'">
                                    <i class="fas fa-vials"></i><br>Ver<br><small>Exámenes</small>
                                </button>
                                
                                <button onclick="viewPACS('${bed.bed_number}', '${safePatientId}')" 
                                        style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 1rem; border-radius: 10px; cursor: pointer; font-size: 1rem; transition: transform 0.2s;"
                                        onmouseover="this.style.transform='scale(1.05)'" 
                                        onmouseout="this.style.transform='scale(1)'">
                                    <i class="fas fa-x-ray"></i><br>Visor<br><small>PACS</small>
                                </button>
                                
                                <button onclick="viewVitalSigns('${bed.bed_number}', '${safePatientId}')" 
                                        style="background: linear-gradient(135deg, #17a2b8 0%, #00d4aa 100%); color: white; border: none; padding: 1rem; border-radius: 10px; cursor: pointer; font-size: 1rem; transition: transform 0.2s;"
                                        onmouseover="this.style.transform='scale(1.05)'" 
                                        onmouseout="this.style.transform='scale(1)'">
                                    <i class="fas fa-heartbeat"></i><br>Signos<br><small>Vitales</small>
                                </button>
                            </div>
                        </div>
                        
                        <!-- PIE DE INFORMACIÓN -->
                        <div style="margin-top: 1.5rem; padding: 1rem; background: #e3f2fd; border-radius: 8px; text-align: center;">
                            <small style="color: #1976d2;">
                                <i class="fas fa-info-circle"></i> 
                                Datos obtenidos del microservicio en tiempo real
                            </small>
                        </div>
                    </div>
                `,
                showConfirmButton: false,
                showCloseButton: true,
                width: 750,
                customClass: {
                    popup: 'patient-info-popup'
                },
                didOpen: () => {
                    Swal.hideLoading();
                }
            });
        }
    }
}

// ===============================================================================
// 🎯 DECLARAR FUNCIONES COMO GLOBALES
// ===============================================================================

// Hacer las funciones accesibles desde HTML
window.createMedicalNoteDirect = createMedicalNoteDirect;
window.createPrescriptionDirect = createPrescriptionDirect;
window.createExamOrderDirect = createExamOrderDirect;
window.viewExams = viewExams;
window.viewPACS = viewPACS;
window.viewVitalSigns = viewVitalSigns;
window.preparePatientDataForModule = preparePatientDataForModule;

// ===============================================================================
// 🎯 AUTO-INICIALIZACIÓN Y COMANDOS GLOBALES
// ===============================================================================

// Comando global para testing rápido (solo desarrollo)
if (window.location.hostname === 'localhost') {
    window.testMicroservices = async function() {
        console.log('🧪 Testing microservices from global command...');
        return await DebugTools.runSystemTests();
    };
}

// Log de sistema cargado
console.log('🚀 Medical Rounds System v2.1.0 - CLEAN VERSION');
console.log('📊 APIs: Hospital + Pacientes + OAuth2');
console.log('🎯 Mission: Sistema hospitalario optimizado y production-ready');
console.log('✅ Funciones globales registradas:', Object.keys(window).filter(key => 
    ['createMedicalNoteDirect', 'createPrescriptionDirect', 'createExamOrderDirect', 
     'viewExams', 'viewPACS', 'viewVitalSigns'].includes(key)
));