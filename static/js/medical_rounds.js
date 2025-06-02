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
        patientsByBed: {}, // 🆕 NUEVA PROPIEDAD PARA DATOS POR CAMA
        loading: false,

        // ===== INICIALIZACIÓN =====
        async init() {
            this.showLoading('Cargando datos del hospital...');
            await this.loadAllData();
            this.hideLoading();
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
            if (bedNumber && this.patientsByBed[bedNumber]) {
                console.log(`✅ Paciente encontrado en JSON para cama ${bedNumber}:`, this.patientsByBed[bedNumber].personal_info.first_name);
                return this.patientsByBed[bedNumber];
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

            // 🆕 DATOS MEJORADOS CON INFORMACIÓN DEL JSON
            window.currentPatientData = {
                bed: bed,
                patient: patientData,
                bedNumber: bed.bed_number,
                patientId: safePatientId,
                patientName: `${patientData.personal_info.first_name} ${patientData.personal_info.last_name}`,
                patientAge: patientData.personal_info.age,
                gender: patientData.personal_info.gender === 'M' ? 'Masculino' : 'Femenino',
                specialty: this.selectedFloorData?.specialty || 'Medicina General',
                // 🆕 CAMPOS ADICIONALES DEL JSON
                diagnosis: patientData.medical_info.primary_diagnosis,
                diagnosisCode: patientData.medical_info.primary_diagnosis_code,
                doctor: patientData.medical_info.attending_physician,
                medicalRecord: patientData.medical_info.medical_record,
                admissionDate: patientData.medical_info.admission_date
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
                                <button onclick="openMedicalNoteWithSignature('${bed.bed_number}', '${bed.patient_id}')" 
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



// ===== FUNCIÓN PARA CREAR RECETA DESDE ACCIONES MÉDICAS =====
async function createPrescriptionDirect(bedNumber, patientId) {
    try {
        // Debug: mostrar qué datos recibimos
        console.log('🔍 Debug createPrescriptionDirect:');
        console.log('bedNumber:', bedNumber);
        console.log('patientId:', patientId);
        
        // Validar parámetros
        if (!bedNumber) {
            throw new Error('Número de cama no proporcionado');
        }
        
        // Si no hay patientId válido, crear uno mock
        if (!patientId || patientId === 'undefined' || patientId === 'null') {
            patientId = `MOCK_${bedNumber}`;
            console.log('🔧 Using mock patientId:', patientId);
        }
        
        // Usar datos del contexto si están disponibles
        let patientData = null;
        const context = window.currentPatientData;
        
        if (context && context.patient) {
            patientData = context.patient;
            console.log('✅ Using context patient data:', patientData);
        } else {
            // Intentar obtener desde API si no hay contexto
            if (!patientId.startsWith('MOCK_')) {
                patientData = {
                    name: context.name,
                    age: context.age,
                    room: context.room
                };
            } else {
                console.log('⚠️ No hay datos en contexto, intentando obtener del servidor');
                
                try {
                    // Intentar obtener datos del servidor
                    const response = await fetch(`/api/patients/${patientId}`);
                    if (response.ok) {
                        const data = await response.json();
                        patientData = {
                            name: data.name,
                            age: data.age,
                            room: data.room
                        };
                        console.log('✅ Datos obtenidos del servidor:', patientData);
                    } else {
                        throw new Error('Error obteniendo datos del paciente');
                    }
                } catch (apiError) {
                    console.warn('⚠️ Error al obtener datos del servidor, usando datos de ejemplo');
                    // Usar datos de ejemplo si no se pueden obtener del servidor
                    patientData = {
                        name: 'Paciente ' + patientId,
                        age: '45',
                        room: 'General'
                    };
                }
            }
        }
        
        // Guardar datos y abrir página de prescripciones directamente
        localStorage.setItem('currentPatientData', JSON.stringify(patientData));
        sessionStorage.setItem('patientData', JSON.stringify(patientData));

        const prescriptionUrl = `/medical/prescriptions?patientId=${encodeURIComponent(patientId)}&bedNumber=${encodeURIComponent(bedNumber)}`;
        window.open(prescriptionUrl, '_blank');

        Swal.fire({
            icon: 'success',
            title: '📝 Receta Médica',
            text: `Abriendo formulario de receta para ${patientData.patientName} - Cama ${bedNumber}`,
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    } catch (error) {
        console.error('❌ Error al crear receta:', error);
        
        // Cerrar cualquier diálogo abierto
        Swal.close();
        
        // Mostrar error
        Swal.fire({
            icon: 'error',
            title: 'Error al crear receta',
            text: `Ocurrió un error: ${error.message}`,
            confirmButtonColor: '#e74c3c'
        });
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

// ===== FUNCIÓN PARA CREAR RECETA DESDE ACCIONES MÉDICAS (MEJORADA PARA MÓVILES) =====
async function createPrescriptionDirect(bedNumber, patientId) {
    console.log('📱 createPrescriptionDirect llamado');
    console.log('bedNumber:', bedNumber);
    console.log('patientId:', patientId);
    
    try {
        // 🔍 Detectar si es dispositivo móvil
        const isMobile = isMobileDevice();
        console.log('📱 Es dispositivo móvil:', isMobile);
        
        // Validar parámetros
        if (!bedNumber) {
            throw new Error('Número de cama no proporcionado');
        }
        
        // Si no hay patientId válido, crear uno mock
        if (!patientId || patientId === 'undefined' || patientId === 'null') {
            patientId = `MOCK_${bedNumber}`;
            console.log('🔧 Using mock patientId:', patientId);
        }
        
        // Preparar datos del paciente
        const context = window.currentPatientData;
        let patientData = {
            patientId: patientId,
            patientName: context?.patientName || 'Paciente ' + bedNumber,
            patientAge: context?.patientAge || '45',
            gender: context?.gender || 'No especificado',
            bedNumber: bedNumber,
            specialty: context?.specialty || 'Medicina General',
            diagnosis: context?.diagnosis || 'Diagnóstico pendiente',
            diagnosisCode: context?.diagnosisCode || '',
            doctor: context?.doctor || 'Dr. Sistema'
        };
        
        // Guardar datos en almacenamiento
        localStorage.setItem('currentPatientData', JSON.stringify(patientData));
        sessionStorage.setItem('patientData', JSON.stringify(patientData));
        
        // Construir URL
        const prescriptionUrl = `/medical/prescriptions?patientId=${encodeURIComponent(patientId)}&bedNumber=${encodeURIComponent(bedNumber)}`;
        
        if (isMobile) {
            // 📱 SOLUCIÓN PARA MÓVILES - Modal de confirmación
            console.log('📱 Aplicando solución móvil...');
            
            Swal.fire({
                title: '📝 Abrir Receta Médica',
                html: `
                    <div style="text-align: center; padding: 1rem;">
                        <div style="background: #e3f2fd; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                            <i class="fas fa-user" style="color: #2c5aa0; margin-right: 0.5rem;"></i>
                            <strong>${patientData.patientName}</strong><br>
                            <small>Cama ${bedNumber}</small>
                        </div>
                        
                        <p style="margin-bottom: 1.5rem; color: #666;">
                            ¿Desea abrir el formulario de receta médica?
                        </p>
                        
                        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                            <button id="openPrescriptionBtn" 
                                    style="background: #00a86b; color: white; border: none; padding: 1rem 2rem; border-radius: 8px; cursor: pointer; font-size: 1rem; min-height: 48px;">
                                <i class="fas fa-prescription-bottle"></i> Abrir Receta
                            </button>
                            <button id="cancelBtn" 
                                    style="background: #6c757d; color: white; border: none; padding: 1rem 2rem; border-radius: 8px; cursor: pointer; font-size: 1rem; min-height: 48px;">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                        </div>
                    </div>
                `,
                showConfirmButton: false,
                showCloseButton: false,
                allowOutsideClick: true,
                width: '90%',
                customClass: {
                    popup: 'mobile-prescription-popup'
                },
                didOpen: () => {
                    // Manejar botón de abrir (DEBE estar en respuesta directa al click)
                    document.getElementById('openPrescriptionBtn').addEventListener('click', function() {
                        console.log('📱 Botón de abrir clickeado');
                        
                        // 🚀 MÉTODO 1: Intentar window.open() sincrónico
                        const newWindow = window.open(prescriptionUrl, '_blank');
                        
                        if (newWindow) {
                            console.log('✅ window.open() exitoso');
                            Swal.close();
                            
                            // Toast de éxito
                            Swal.fire({
                                icon: 'success',
                                title: 'Receta abierta',
                                text: 'Formulario de receta médica abierto',
                                timer: 2000,
                                showConfirmButton: false,
                                toast: true,
                                position: 'top-end'
                            });
                        } else {
                            console.log('❌ window.open() bloqueado, usando método alternativo');
                            
                            // 🚀 MÉTODO 2: Navegación directa si falla window.open()
                            Swal.fire({
                                title: 'Redirigiendo...',
                                text: 'Abriendo formulario de receta médica',
                                icon: 'info',
                                timer: 2000,
                                showConfirmButton: false,
                                willClose: () => {
                                    window.location.href = prescriptionUrl;
                                }
                            });
                        }
                    });
                    
                    // Manejar botón de cancelar
                    document.getElementById('cancelBtn').addEventListener('click', function() {
                        Swal.close();
                    });
                }
            });
            
        } else {
            // 🖥️ SOLUCIÓN PARA DESKTOP - window.open() normal
            console.log('🖥️ Aplicando solución desktop...');
            
            const newWindow = window.open(prescriptionUrl, '_blank');
            
            if (newWindow) {
                Swal.fire({
                    icon: 'success',
                    title: '📝 Receta Médica',
                    text: `Formulario abierto para ${patientData.patientName} - Cama ${bedNumber}`,
                    timer: 2000,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                });
            } else {
                // Fallback si el pop-up es bloqueado
                Swal.fire({
                    icon: 'warning',
                    title: 'Pop-up bloqueado',
                    text: 'Por favor permite pop-ups para este sitio o usa el botón de abajo',
                    showCancelButton: true,
                    confirmButtonText: 'Abrir de todas formas',
                    cancelButtonText: 'Cancelar'
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = prescriptionUrl;
                    }
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Error al crear receta:', error);
        
        Swal.close();
        
        Swal.fire({
            icon: 'error',
            title: 'Error al crear receta',
            text: `Ocurrió un error: ${error.message}`,
            confirmButtonColor: '#e74c3c'
        });
    }
}

// ===== FUNCIÓN PARA CREAR ORDEN DE EXÁMENES DESDE ACCIONES MÉDICAS =====
async function createExamOrderDirect(bedNumber, patientId) {
    console.log('🧪 createExamOrderDirect llamado');
    console.log('bedNumber:', bedNumber);
    console.log('patientId:', patientId);
    
    try {
        // 🔍 Detectar si es dispositivo móvil
        const isMobile = isMobileDevice();
        console.log('📱 Es dispositivo móvil:', isMobile);
        
        // Validar parámetros
        if (!bedNumber) {
            throw new Error('Número de cama no proporcionado');
        }
        
        // Si no hay patientId válido, crear uno mock
        if (!patientId || patientId === 'undefined' || patientId === 'null') {
            patientId = `MOCK_${bedNumber}`;
            console.log('🔧 Using mock patientId:', patientId);
        }
        
        // Preparar datos del paciente
        const context = window.currentPatientData;
        let patientData = {
            patientId: patientId,
            patientName: context?.patientName || 'Paciente ' + bedNumber,
            patientAge: context?.patientAge || '45',
            gender: context?.gender || 'No especificado',
            bedNumber: bedNumber,
            specialty: context?.specialty || 'Medicina General',
            diagnosis: context?.diagnosis || 'Diagnóstico pendiente',
            diagnosisCode: context?.diagnosisCode || '',
            doctor: context?.doctor || 'Dr. Sistema'
        };
        
        // Guardar datos en almacenamiento
        localStorage.setItem('currentPatientData', JSON.stringify(patientData));
        sessionStorage.setItem('patientData', JSON.stringify(patientData));
        
        // Construir URL
        const examOrderUrl = `/medical/orders/exams?patientId=${encodeURIComponent(patientId)}&bedNumber=${encodeURIComponent(bedNumber)}`;
        
        if (isMobile) {
            // 📱 SOLUCIÓN PARA MÓVILES - Modal de confirmación
            console.log('📱 Aplicando solución móvil para exámenes...');
            
            Swal.fire({
                title: '🧪 Abrir Orden de Exámenes',
                html: `
                    <div style="text-align: center; padding: 1rem;">
                        <div style="background: #f3e5f5; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                            <i class="fas fa-user" style="color: #9b59b6; margin-right: 0.5rem;"></i>
                            <strong>${patientData.patientName}</strong><br>
                            <small>Cama ${bedNumber}</small>
                        </div>
                        
                        <p style="margin-bottom: 1.5rem; color: #666;">
                            ¿Desea abrir el formulario de órdenes de exámenes?
                        </p>
                        
                        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                            <button id="openExamOrderBtn" 
                                    style="background: #9b59b6; color: white; border: none; padding: 1rem 2rem; border-radius: 8px; cursor: pointer; font-size: 1rem; min-height: 48px;">
                                <i class="fas fa-vials"></i> Abrir Exámenes
                            </button>
                            <button id="cancelExamBtn" 
                                    style="background: #6c757d; color: white; border: none; padding: 1rem 2rem; border-radius: 8px; cursor: pointer; font-size: 1rem; min-height: 48px;">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                        </div>
                    </div>
                `,
                showConfirmButton: false,
                showCloseButton: false,
                allowOutsideClick: true,
                width: '90%',
                customClass: {
                    popup: 'mobile-exam-popup'
                },
                didOpen: () => {
                    // Manejar botón de abrir
                    document.getElementById('openExamOrderBtn').addEventListener('click', function() {
                        console.log('📱 Botón de abrir exámenes clickeado');
                        
                        // 🚀 MÉTODO 1: Intentar window.open() sincrónico
                        const newWindow = window.open(examOrderUrl, '_blank');
                        
                        if (newWindow) {
                            console.log('✅ window.open() exitoso para exámenes');
                            Swal.close();
                            
                            // Toast de éxito
                            Swal.fire({
                                icon: 'success',
                                title: 'Exámenes abierto',
                                text: 'Formulario de órdenes de exámenes abierto',
                                timer: 2000,
                                showConfirmButton: false,
                                toast: true,
                                position: 'top-end'
                            });
                        } else {
                            console.log('❌ window.open() bloqueado, usando método alternativo');
                            
                            // 🚀 MÉTODO 2: Navegación directa si falla window.open()
                            Swal.fire({
                                title: 'Redirigiendo...',
                                text: 'Abriendo formulario de órdenes de exámenes',
                                icon: 'info',
                                timer: 2000,
                                showConfirmButton: false,
                                willClose: () => {
                                    window.location.href = examOrderUrl;
                                }
                            });
                        }
                    });
                    
                    // Manejar botón de cancelar
                    document.getElementById('cancelExamBtn').addEventListener('click', function() {
                        Swal.close();
                    });
                }
            });
            
        } else {
            // 🖥️ SOLUCIÓN PARA DESKTOP - window.open() normal
            console.log('🖥️ Aplicando solución desktop para exámenes...');
            
            const newWindow = window.open(examOrderUrl, '_blank');
            
            if (newWindow) {
                Swal.fire({
                    icon: 'success',
                    title: '🧪 Orden de Exámenes',
                    text: `Formulario abierto para ${patientData.patientName} - Cama ${bedNumber}`,
                    timer: 2000,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                });
            } else {
                // Fallback si el pop-up es bloqueado
                Swal.fire({
                    icon: 'warning',
                    title: 'Pop-up bloqueado',
                    text: 'Por favor permite pop-ups para este sitio o usa el botón de abajo',
                    showCancelButton: true,
                    confirmButtonText: 'Abrir de todas formas',
                    cancelButtonText: 'Cancelar'
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = examOrderUrl;
                    }
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Error al crear orden de exámenes:', error);
        
        Swal.close();
        
        Swal.fire({
            icon: 'error',
            title: 'Error al crear orden',
            text: `Ocurrió un error: ${error.message}`,
            confirmButtonColor: '#e74c3c'
        });
    }
}

// ===== FUNCIONES PARA ACCIONES MÉDICAS NOTAS EVOLUCIÓN =====

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

// Función para visor PACS
// ===== FUNCIÓN VIEWEXAMS INTEGRADA CON RONDAS MÉDICAS =====
function viewPACS(bedNumber, patientId) {
    console.log('🔬 viewExams llamado desde rondas médicas');
    console.log('📋 bedNumber:', bedNumber);
    console.log('👤 patientId:', patientId);
    
    try {
        // 🔍 Detectar si es dispositivo móvil
        const isMobile = isMobileDevice();
        console.log('📱 Es dispositivo móvil:', isMobile);
        
        // Validar parámetros
        if (!bedNumber) {
            throw new Error('Número de cama no proporcionado');
        }
        
        // Si no hay patientId válido, crear uno mock
        if (!patientId || patientId === 'undefined' || patientId === 'null') {
            patientId = `MOCK_${bedNumber}`;
            console.log('🔧 Using mock patientId:', patientId);
        }
        
        // Preparar datos del paciente desde el contexto de rondas médicas
        const context = window.currentPatientData;
        let patientData = {
            patientId: patientId,
            patientName: context?.patientName || 'Paciente ' + bedNumber,
            patientAge: context?.patientAge || '45',
            gender: context?.gender || 'No especificado',
            bedNumber: bedNumber,
            specialty: context?.specialty || 'Medicina General',
            diagnosis: context?.diagnosis || 'Diagnóstico pendiente',
            diagnosisCode: context?.diagnosisCode || '',
            doctor: context?.doctor || 'Dr. Sistema',
            medicalRecord: context?.medicalRecord || 'HC' + Math.floor(Math.random() * 100000),
            admissionDate: context?.admissionDate || new Date().toISOString().split('T')[0]
        };
        
        console.log('📊 Datos del paciente preparados:', patientData);
        
        // Guardar datos en almacenamiento para el visor DICOM
        localStorage.setItem('currentPatientData', JSON.stringify(patientData));
        sessionStorage.setItem('patientData', JSON.stringify(patientData));
        sessionStorage.setItem('dicomPatientContext', JSON.stringify({
            bedNumber: bedNumber,
            patientId: patientId,
            patientName: patientData.patientName,
            fromRounds: true,
            timestamp: new Date().toISOString()
        }));
        
        // Construir URL del visor DICOM con parámetros del paciente
        const dicomUrl = `/medical/dicom?patientId=${encodeURIComponent(patientId)}&bedNumber=${encodeURIComponent(bedNumber)}&patientName=${encodeURIComponent(patientData.patientName)}&from=rounds`;
        
        if (isMobile) {
            // 📱 SOLUCIÓN PARA MÓVILES - Modal de confirmación optimizado
            console.log('📱 Aplicando solución móvil para visor DICOM...');
            
            Swal.fire({
                title: '🩻 Visor de Imágenes Médicas',
                html: `
                    <div style="text-align: center; padding: 1rem;">
                        <!-- Header del paciente -->
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; color: white;">
                            <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                                <i class="fas fa-user-md" style="font-size: 1.2rem;"></i>
                                <strong style="font-size: 1.1rem;">${patientData.patientName}</strong>
                            </div>
                            <div style="font-size: 0.9rem; opacity: 0.9;">
                                🛏️ Cama ${bedNumber} • 📋 ${patientData.specialty}
                            </div>
                            <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.3rem;">
                                📊 ${patientData.diagnosis}
                            </div>
                        </div>
                        
                        <!-- Información del visor -->
                        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                            <p style="margin: 0; color: #666; font-size: 0.95rem;">
                                <i class="fas fa-info-circle" style="color: #17a2b8; margin-right: 0.5rem;"></i>
                                Visor profesional DICOM con navegación por series
                            </p>
                        </div>
                        
                        <!-- Botones de acción -->
                        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                            <button id="openDicomBtn" 
                                    style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                           color: white; border: none; padding: 1rem 2rem; 
                                           border-radius: 10px; cursor: pointer; font-size: 1rem; 
                                           min-height: 50px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                                           transition: all 0.3s ease;">
                                <i class="fas fa-images" style="margin-right: 0.5rem;"></i>
                                Abrir Visor DICOM
                            </button>
                            <button id="cancelDicomBtn" 
                                    style="background: #6c757d; color: white; border: none; 
                                           padding: 1rem 2rem; border-radius: 10px; cursor: pointer; 
                                           font-size: 1rem; min-height: 50px;">
                                <i class="fas fa-times" style="margin-right: 0.5rem;"></i>
                                Cancelar
                            </button>
                        </div>
                        
                        <!-- Footer informativo -->
                        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #dee2e6;">
                            <small style="color: #6c757d;">
                                💡 El visor incluye navegación por scroll, zoom y herramientas profesionales
                            </small>
                        </div>
                    </div>
                `,
                showConfirmButton: false,
                showCloseButton: false,
                allowOutsideClick: true,
                width: '95%',
                customClass: {
                    popup: 'mobile-dicom-popup'
                },
                didOpen: () => {
                    // Efecto hover para el botón principal
                    const openBtn = document.getElementById('openDicomBtn');
                    openBtn.addEventListener('mouseenter', function() {
                        this.style.transform = 'translateY(-2px)';
                        this.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                    });
                    openBtn.addEventListener('mouseleave', function() {
                        this.style.transform = 'translateY(0)';
                        this.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                    });
                    
                    // Manejar botón de abrir (DEBE estar en respuesta directa al click)
                    openBtn.addEventListener('click', function() {
                        console.log('📱 Botón de abrir DICOM clickeado');
                        
                        // 🚀 MÉTODO 1: Intentar window.open() sincrónico
                        const newWindow = window.open(dicomUrl, '_blank');
                        
                        if (newWindow) {
                            console.log('✅ window.open() exitoso para DICOM');
                            Swal.close();
                            
                            // Toast de éxito elegante
                            Swal.fire({
                                icon: 'success',
                                title: '🩻 Visor DICOM Abierto',
                                text: `Imágenes médicas de ${patientData.patientName}`,
                                timer: 3000,
                                showConfirmButton: false,
                                toast: true,
                                position: 'top-end',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white'
                            });
                        } else {
                            console.log('❌ window.open() bloqueado, usando método alternativo');
                            
                            // 🚀 MÉTODO 2: Navegación directa si falla window.open()
                            Swal.fire({
                                title: '🚀 Abriendo Visor...',
                                text: 'Cargando imágenes médicas DICOM',
                                icon: 'info',
                                timer: 2500,
                                showConfirmButton: false,
                                timerProgressBar: true,
                                willClose: () => {
                                    window.location.href = dicomUrl;
                                }
                            });
                        }
                    });
                    
                    // Manejar botón de cancelar
                    document.getElementById('cancelDicomBtn').addEventListener('click', function() {
                        Swal.close();
                    });
                }
            });
            
        } else {
            // 🖥️ SOLUCIÓN PARA DESKTOP - window.open() normal
            console.log('🖥️ Aplicando solución desktop para DICOM...');
            
            const newWindow = window.open(dicomUrl, '_blank');
            
            if (newWindow) {
                Swal.fire({
                    icon: 'success',
                    title: '🩻 Visor DICOM Abierto',
                    html: `
                        <div style="text-align: center;">
                            <div style="background: #e3f2fd; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                                <strong>${patientData.patientName}</strong><br>
                                <small>Cama ${bedNumber} • ${patientData.specialty}</small>
                            </div>
                            <p>Visor de imágenes médicas abierto correctamente</p>
                        </div>
                    `,
                    timer: 3000,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                });
            } else {
                // Fallback si el pop-up es bloqueado
                Swal.fire({
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
                    confirmButtonText: '<i class="fas fa-external-link-alt"></i> Abrir de todas formas',
                    cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
                    confirmButtonColor: '#667eea',
                    cancelButtonColor: '#6c757d'
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = dicomUrl;
                    }
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Error al abrir visor DICOM:', error);
        
        Swal.close();
        
        Swal.fire({
            icon: 'error',
            title: '❌ Error al Abrir Visor',
            html: `
                <div style="text-align: center;">
                    <p>No se pudo abrir el visor de imágenes médicas.</p>
                    <p style="color: #666; font-size: 0.9rem;">
                        Error: ${error.message}
                    </p>
                </div>
            `,
            confirmButtonColor: '#e74c3c'
        });
    }
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

// ===== LOGGING PARA DEBUG =====
console.log('✅ Función viewExams cargada e integrada con rondas médicas');
console.log('🔗 Integración: Rondas Médicas → viewExams() → Visor DICOM');
console.log('📱 Soporte: Desktop y Mobile responsive');
console.log('🎯 Estado: Listo para uso en producción');

// Función para signos vitales
function viewVitalSigns(bedNumber, patientId) {
    try {
        if (!bedNumber) {
            throw new Error('Número de cama no proporcionado');
        }
        
        if (!patientId || patientId === 'undefined' || patientId === 'null') {
            patientId = `MOCK_${bedNumber}`;
        }
        
        const context = window.currentPatientData;
        let patientData = {
            patientId: patientId,
            patientName: context?.patientName || 'Paciente ' + bedNumber,
            patientAge: context?.patientAge || '45',
            gender: context?.gender || 'No especificado',
            bedNumber: bedNumber,
            specialty: context?.specialty || 'Medicina General',
            diagnosis: context?.diagnosis || 'Diagnóstico pendiente',
            doctor: context?.doctor || 'Dr. Sistema'
        };
        
        localStorage.setItem('currentPatientData', JSON.stringify(patientData));
        sessionStorage.setItem('vitalSignsPatient', JSON.stringify({
            bedNumber: bedNumber,
            patientId: patientId,
            patientName: patientData.patientName
        }));
        
        const vitalSignsUrl = `/medical/vital-signs?bedNumber=${encodeURIComponent(bedNumber)}&patientId=${encodeURIComponent(patientId)}`;
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
        
        if (isMobile) {
            Swal.fire({
                title: '💓 Monitor de Signos Vitales',
                html: `
                    <div style="text-align: center; padding: 1rem;">
                        <div style="background: #e8f5e8; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                            <i class="fas fa-heartbeat" style="color: #17a2b8; margin-right: 0.5rem;"></i>
                            <strong>${patientData.patientName}</strong><br>
                            <small>Cama ${bedNumber}</small>
                        </div>
                        <p style="margin-bottom: 1.5rem;">¿Abrir monitor de signos vitales?</p>
                        <div style="display: flex; gap: 1rem; justify-content: center;">
                            <button id="openVitalBtn" style="background: #17a2b8; color: white; border: none; padding: 1rem 2rem; border-radius: 8px; cursor: pointer;">
                                <i class="fas fa-heartbeat"></i> Abrir
                            </button>
                            <button id="cancelVitalBtn" style="background: #6c757d; color: white; border: none; padding: 1rem 2rem; border-radius: 8px; cursor: pointer;">
                                Cancelar
                            </button>
                        </div>
                    </div>
                `,
                showConfirmButton: false,
                showCloseButton: false,
                didOpen: () => {
                    document.getElementById('openVitalBtn').addEventListener('click', function() {
                        const newWindow = window.open(vitalSignsUrl, '_blank');
                        if (newWindow) {
                            Swal.close();
                            Swal.fire({
                                icon: 'success',
                                title: 'Monitor abierto',
                                timer: 2000,
                                showConfirmButton: false,
                                toast: true,
                                position: 'top-end'
                            });
                        } else {
                            window.location.href = vitalSignsUrl;
                        }
                    });
                    document.getElementById('cancelVitalBtn').addEventListener('click', function() {
                        Swal.close();
                    });
                }
            });
        } else {
            const newWindow = window.open(vitalSignsUrl, '_blank');
            if (newWindow) {
                Swal.fire({
                    icon: 'success',
                    title: 'Monitor abierto',
                    text: `Signos vitales para ${patientData.patientName}`,
                    timer: 2000,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                });
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Pop-up bloqueado',
                    showCancelButton: true,
                    confirmButtonText: 'Abrir de todas formas',
                    cancelButtonText: 'Cancelar'
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = vitalSignsUrl;
                    }
                });
            }
        }
        
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message,
            confirmButtonColor: '#e74c3c'
        });
    }
 }

// ===== FUNCIONES AUXILIARES PARA MÓVILES =====
function isMobileDevice() {
    return (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        window.innerWidth <= 768
    );
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