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

            // 🆕 AGREGAR ESTO AL FINAL:
            if (bed.status === 'occupied') {
                // Llamar al sistema de notas médicas
                openMedicalNoteWithSignature(bed.bed_number, bed.patient_id);
            } else {
                Swal.fire({
                    icon: 'info',
                    title: 'Cama vacía',
                    text: 'Esta cama no tiene paciente asignado'
                });
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

// ===== VARIABLES GLOBALES =====
let currentEditor = null;
let speechRecognition = null;
let isRecording = false;
let recognitionActive = false;
let editorContainer = null;

// ===== INICIALIZACIÓN =====
function initMedicalEditor() {
    console.log('🎤 Inicializando Editor Médico Avanzado...');
    
    // Verificar soporte de Web Speech API
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('⚠️ Web Speech API no soportada en este navegador');
        return false;
    }
    
    // Configurar reconocimiento de voz
    setupSpeechRecognition();
    
    return true;
}

// ===== FUNCIÓN PRINCIPAL MEJORADA =====
function openMedicalNote(bedNumber, patientId) {
    const context = window.currentPatientData;
    const patientName = context?.patientName || 'Paciente ' + bedNumber;
    
    // Crear HTML avanzado del editor
    const editorHTML = createAdvancedEditor(bedNumber, patientName);
    
    Swal.fire({
        title: '📝 Nota de Evolución Médica Avanzada',
        html: editorHTML,
        width: '90%',
        customClass: {
            container: 'medical-editor-container',
            popup: 'medical-editor-popup'
        },
        showCancelButton: true,
        showConfirmButton: true,
        confirmButtonText: '💾 Guardar Nota',
        cancelButtonText: '❌ Cancelar',
        confirmButtonColor: '#2c5aa0',
        cancelButtonColor: '#6c757d',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            // Inicializar el editor después de que se abre
            initializeEditor();
        },
        preConfirm: () => {
            return saveMedicalNoteAdvanced(bedNumber, patientId);
        }
    });
}

// ===== CREAR EDITOR AVANZADO =====
function createAdvancedEditor(bedNumber, patientName) {
    return `
        <div class="advanced-medical-editor">
            <!-- BARRA DE HERRAMIENTAS -->
            <div class="editor-toolbar">
                <!-- Herramientas de formato -->
                <div class="toolbar-group">
                    <button type="button" class="toolbar-btn" onclick="formatText('bold')" title="Negrita">
                        <i class="fas fa-bold"></i>
                    </button>
                    <button type="button" class="toolbar-btn" onclick="formatText('italic')" title="Cursiva">
                        <i class="fas fa-italic"></i>
                    </button>
                    <button type="button" class="toolbar-btn" onclick="formatText('underline')" title="Subrayado">
                        <i class="fas fa-underline"></i>
                    </button>
                </div>
                
                <!-- Separador -->
                <div class="toolbar-separator"></div>
                
                <!-- Lista y sangría -->
                <div class="toolbar-group">
                    <button type="button" class="toolbar-btn" onclick="formatText('insertUnorderedList')" title="Lista">
                        <i class="fas fa-list-ul"></i>
                    </button>
                    <button type="button" class="toolbar-btn" onclick="formatText('insertOrderedList')" title="Lista numerada">
                        <i class="fas fa-list-ol"></i>
                    </button>
                </div>
                
                <!-- Separador -->
                <div class="toolbar-separator"></div>
                
                <!-- MICRÓFONO - FEATURE PRINCIPAL -->
                <div class="toolbar-group microphone-group">
                    <button type="button" class="toolbar-btn microphone-btn" 
                            id="microphoneBtn" onclick="toggleSpeechRecognition()" 
                            title="Dictado por voz">
                        <i class="fas fa-microphone" id="micIcon"></i>
                        <span class="mic-status" id="micStatus">Dictado</span>
                    </button>
                    <div class="voice-indicator" id="voiceIndicator"></div>
                </div>
                
                <!-- Separador -->
                <div class="toolbar-separator"></div>
                
                <!-- INSERTAR IMAGEN - FEATURE PRINCIPAL -->
                <div class="toolbar-group">
                    <label class="toolbar-btn" for="imageInput" title="Insertar imagen">
                        <i class="fas fa-image"></i>
                        <span>Imagen</span>
                    </label>
                    <input type="file" id="imageInput" accept="image/*" style="display: none;" 
                           onchange="insertImage(this)">
                </div>
                
                <!-- Separador -->
                <div class="toolbar-separator"></div>
                
                <!-- Herramientas médicas -->
                <div class="toolbar-group">
                    <button type="button" class="toolbar-btn" onclick="insertMedicalTemplate('vital_signs')" 
                            title="Insertar signos vitales">
                        <i class="fas fa-heartbeat"></i>
                        <span>Vitales</span>
                    </button>
                    <button type="button" class="toolbar-btn" onclick="insertMedicalTemplate('examination')" 
                            title="Insertar examen físico">
                        <i class="fas fa-stethoscope"></i>
                        <span>Examen</span>
                    </button>
                    <button type="button" class="toolbar-btn" onclick="insertMedicalTemplate('plan')" 
                            title="Insertar plan médico">
                        <i class="fas fa-clipboard-list"></i>
                        <span>Plan</span>
                    </button>
                </div>
            </div>
            
            <!-- INFORMACIÓN DEL PACIENTE -->
            <div class="patient-header">
                <div class="patient-info-grid">
                    <div><strong>Paciente:</strong> ${patientName}</div>
                    <div><strong>Cama:</strong> ${bedNumber}</div>
                    <div><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</div>
                    <div><strong>Hora:</strong> ${new Date().toLocaleTimeString('es-ES')}</div>
                </div>
            </div>
            
            <!-- EDITOR RICH TEXT -->
            <div class="rich-text-editor" 
                 id="medicalEditor" 
                 contenteditable="true" 
                 placeholder="Escriba o dicte la nota de evolución médica aquí...">
                <p><strong>NOTA DE EVOLUCIÓN MÉDICA</strong></p>
                <br>
                <p><strong>Evolución del Paciente:</strong></p>
                <p>• </p>
                <br>
                <p><strong>Examen Físico:</strong></p>
                <p>• </p>
                <br>
                <p><strong>Plan Médico:</strong></p>
                <p>• </p>
            </div>
            
            <!-- INDICADOR DE VOZ -->
            <div class="voice-feedback" id="voiceFeedback" style="display: none;">
                <div class="voice-animation">
                    <div class="wave"></div>
                    <div class="wave"></div>
                    <div class="wave"></div>
                </div>
                <span class="voice-text">Escuchando... 🎤</span>
            </div>
        </div>
        
        <!-- ESTILOS CSS INTEGRADOS -->
        <style>
            .advanced-medical-editor {
                max-width: 100%;
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            
            .editor-toolbar {
                background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                border-bottom: 1px solid #dee2e6;
                padding: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
            }
            
            .toolbar-group {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .toolbar-btn {
                background: white;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                padding: 8px 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 14px;
                color: #495057;
            }
            
            .toolbar-btn:hover {
                background: #f8f9fa;
                border-color: #2c5aa0;
                color: #2c5aa0;
                transform: translateY(-1px);
            }
            
            .toolbar-btn:active {
                transform: translateY(0);
            }
            
            .toolbar-separator {
                width: 1px;
                height: 24px;
                background: #dee2e6;
                margin: 0 4px;
            }
            
            /* MICRÓFONO ESPECIAL */
            .microphone-group {
                position: relative;
            }
            
            .microphone-btn {
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
                border: none;
                padding: 10px 16px;
                font-weight: 600;
            }
            
            .microphone-btn:hover {
                background: linear-gradient(135deg, #218838, #1ea080);
                transform: translateY(-2px);
            }
            
            .microphone-btn.recording {
                background: linear-gradient(135deg, #dc3545, #fd7e14);
                animation: pulse 1.5s infinite;
            }
            
            @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(220, 53, 69, 0); }
                100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
            }
            
            .voice-indicator {
                position: absolute;
                top: -5px;
                right: -5px;
                width: 12px;
                height: 12px;
                background: #28a745;
                border: 2px solid white;
                border-radius: 50%;
                display: none;
            }
            
            .voice-indicator.active {
                display: block;
                animation: blink 1s infinite;
            }
            
            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0.3; }
            }
            
            /* HEADER PACIENTE */
            .patient-header {
                background: linear-gradient(135deg, #2c5aa0, #007bff);
                color: white;
                padding: 16px;
            }
            
            .patient-info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 12px;
                font-size: 14px;
            }
            
            /* EDITOR RICH TEXT */
            .rich-text-editor {
                min-height: 400px;
                max-height: 500px;
                overflow-y: auto;
                padding: 20px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 14px;
                line-height: 1.6;
                border: none;
                outline: none;
                background: white;
            }
            
            .rich-text-editor:empty::before {
                content: attr(placeholder);
                color: #6c757d;
                font-style: italic;
            }
            
            .rich-text-editor p {
                margin: 8px 0;
            }
            
            .rich-text-editor strong {
                color: #2c5aa0;
            }
            
            .rich-text-editor ul, .rich-text-editor ol {
                margin: 8px 0;
                padding-left: 24px;
            }
            
            .rich-text-editor img {
                max-width: 100%;
                height: auto;
                border-radius: 4px;
                margin: 10px 0;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            /* FEEDBACK DE VOZ */
            .voice-feedback {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(40, 167, 69, 0.95);
                color: white;
                padding: 12px 20px;
                border-radius: 25px;
                display: flex;
                align-items: center;
                gap: 12px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                z-index: 10000;
            }
            
            .voice-animation {
                display: flex;
                gap: 3px;
            }
            
            .wave {
                width: 3px;
                height: 15px;
                background: white;
                border-radius: 2px;
                animation: wave 1.2s infinite ease-in-out;
            }
            
            .wave:nth-child(2) { animation-delay: 0.1s; }
            .wave:nth-child(3) { animation-delay: 0.2s; }
            
            @keyframes wave {
                0%, 40%, 100% { transform: scaleY(0.4); }
                20% { transform: scaleY(1); }
            }
            
            /* RESPONSIVE */
            @media (max-width: 768px) {
                .editor-toolbar {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .toolbar-group {
                    justify-content: center;
                }
                
                .patient-info-grid {
                    grid-template-columns: 1fr;
                    gap: 8px;
                }
                
                .rich-text-editor {
                    min-height: 300px;
                }
            }
        </style>
    `;
}

// ===== CONFIGURACIÓN DEL RECONOCIMIENTO DE VOZ =====
function setupSpeechRecognition() {
    // Crear instancia del reconocimiento de voz
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        console.warn('⚠️ Speech Recognition no disponible');
        return;
    }
    
    speechRecognition = new SpeechRecognition();
    
    // Configuración optimizada para uso médico
    speechRecognition.continuous = true;  // Continuar escuchando
    speechRecognition.interimResults = true;  // Resultados intermedios
    speechRecognition.lang = 'es-ES';  // Español
    speechRecognition.maxAlternatives = 3;  // Múltiples alternativas
    
    // Eventos del reconocimiento
    speechRecognition.onstart = function() {
        console.log('🎤 Reconocimiento de voz iniciado');
        recognitionActive = true;
        updateMicrophoneUI(true);
        showVoiceFeedback(true);
    };
    
    speechRecognition.onresult = function(event) {
        let interimTranscript = '';
        let finalTranscript = '';
        
        // Procesar resultados
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            
            if (result.isFinal) {
                finalTranscript += result[0].transcript + ' ';
            } else {
                interimTranscript += result[0].transcript;
            }
        }
        
        // Insertar texto en el editor
        if (finalTranscript) {
            insertTextIntoEditor(finalTranscript.trim());
        }
        
        console.log('🗣️ Transcripción:', finalTranscript || interimTranscript);
    };
    
    speechRecognition.onerror = function(event) {
        console.error('❌ Error en reconocimiento de voz:', event.error);
        
        if (event.error === 'no-speech') {
            // Reiniciar automáticamente si no detecta voz
            setTimeout(() => {
                if (recognitionActive) {
                    speechRecognition.start();
                }
            }, 1000);
        } else {
            stopSpeechRecognition();
        }
    };
    
    speechRecognition.onend = function() {
        console.log('🎤 Reconocimiento de voz terminado');
        
        // Reiniciar automáticamente si está activo
        if (recognitionActive) {
            setTimeout(() => {
                speechRecognition.start();
            }, 100);
        } else {
            updateMicrophoneUI(false);
            showVoiceFeedback(false);
        }
    };
}

// ===== CONTROL DEL MICRÓFONO =====
function toggleSpeechRecognition() {
    if (!speechRecognition) {
        Swal.fire({
            icon: 'error',
            title: 'Función no disponible',
            text: 'El reconocimiento de voz no está disponible en este navegador.'
        });
        return;
    }
    
    if (recognitionActive) {
        stopSpeechRecognition();
    } else {
        startSpeechRecognition();
    }
}

function startSpeechRecognition() {
    try {
        recognitionActive = true;
        speechRecognition.start();
        
        // Feedback visual inmediato
        updateMicrophoneUI(true);
        
    } catch (error) {
        console.error('Error iniciando reconocimiento:', error);
        recognitionActive = false;
        updateMicrophoneUI(false);
    }
}

function stopSpeechRecognition() {
    recognitionActive = false;
    
    if (speechRecognition) {
        speechRecognition.stop();
    }
    
    updateMicrophoneUI(false);
    showVoiceFeedback(false);
}

function updateMicrophoneUI(isActive) {
    const micBtn = document.getElementById('microphoneBtn');
    const micIcon = document.getElementById('micIcon');
    const micStatus = document.getElementById('micStatus');
    const voiceIndicator = document.getElementById('voiceIndicator');
    
    if (!micBtn) return;
    
    if (isActive) {
        micBtn.classList.add('recording');
        micIcon.className = 'fas fa-microphone-slash';
        micStatus.textContent = 'Parar';
        voiceIndicator.classList.add('active');
    } else {
        micBtn.classList.remove('recording');
        micIcon.className = 'fas fa-microphone';
        micStatus.textContent = 'Dictado';
        voiceIndicator.classList.remove('active');
    }
}

function showVoiceFeedback(show) {
    const voiceFeedback = document.getElementById('voiceFeedback');
    if (voiceFeedback) {
        voiceFeedback.style.display = show ? 'flex' : 'none';
    }
}

// ===== INSERCIÓN DE TEXTO =====
function insertTextIntoEditor(text) {
    const editor = document.getElementById('medicalEditor');
    if (!editor) return;
    
    // Obtener la selección actual
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    // Crear nodo de texto
    const textNode = document.createTextNode(text + ' ');
    
    // Insertar en la posición del cursor
    range.insertNode(textNode);
    
    // Mover el cursor al final del texto insertado
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Enfocar el editor
    editor.focus();
}

// ===== FORMATEO DE TEXTO =====
function formatText(command, value = null) {
    document.execCommand(command, false, value);
    
    // Mantener el foco en el editor
    const editor = document.getElementById('medicalEditor');
    if (editor) {
        editor.focus();
    }
}

// ===== INSERCIÓN DE IMÁGENES =====
function insertImage(input) {
    const file = input.files[0];
    if (!file) return;
    
    // Verificar que sea una imagen
    if (!file.type.startsWith('image/')) {
        Swal.fire({
            icon: 'error',
            title: 'Archivo inválido',
            text: 'Por favor seleccione un archivo de imagen válido.'
        });
        return;
    }
    
    // Verificar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
            icon: 'error',
            title: 'Archivo muy grande',
            text: 'La imagen no puede superar los 5MB.'
        });
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const editor = document.getElementById('medicalEditor');
        if (!editor) return;
        
        // Crear elemento imagen
        const img = document.createElement('img');
        img.src = e.target.result;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.margin = '10px 0';
        img.style.borderRadius = '4px';
        img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        img.alt = 'Imagen médica insertada';
        
        // Insertar en la posición del cursor
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        
        // Crear párrafo contenedor
        const p = document.createElement('p');
        p.appendChild(img);
        
        range.insertNode(p);
        
        // Mover cursor después de la imagen
        range.setStartAfter(p);
        range.setEndAfter(p);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Limpiar input
        input.value = '';
        
        // Enfocar editor
        editor.focus();
        
        console.log('📷 Imagen insertada exitosamente');
    };
    
    reader.readAsDataURL(file);
}

// ===== PLANTILLAS MÉDICAS =====
function insertMedicalTemplate(templateType) {
    const templates = {
        vital_signs: `
<p><strong>📊 SIGNOS VITALES:</strong></p>
<ul>
    <li>Presión Arterial: ___/___</li>
    <li>Frecuencia Cardíaca: ___ lpm</li>
    <li>Frecuencia Respiratoria: ___ rpm</li>
    <li>Temperatura: ___°C</li>
    <li>Saturación O2: ___%</li>
</ul>`,
        
        examination: `
<p><strong>🔍 EXAMEN FÍSICO:</strong></p>
<ul>
    <li><strong>General:</strong> </li>
    <li><strong>Cardiovascular:</strong> </li>
    <li><strong>Respiratorio:</strong> </li>
    <li><strong>Abdomen:</strong> </li>
    <li><strong>Neurológico:</strong> </li>
</ul>`,
        
        plan: `
<p><strong>📋 PLAN MÉDICO:</strong></p>
<ol>
    <li><strong>Diagnóstico:</strong> </li>
    <li><strong>Tratamiento:</strong> </li>
    <li><strong>Medicación:</strong> </li>
    <li><strong>Seguimiento:</strong> </li>
    <li><strong>Observaciones:</strong> </li>
</ol>`
    };
    
    const template = templates[templateType];
    if (!template) return;
    
    const editor = document.getElementById('medicalEditor');
    if (!editor) return;
    
    // Insertar plantilla en la posición del cursor
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    // Crear div temporal para convertir HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = template;
    
    // Insertar cada nodo hijo
    while (tempDiv.firstChild) {
        range.insertNode(tempDiv.firstChild);
    }
    
    // Enfocar editor
    editor.focus();
    
    console.log(`📝 Plantilla ${templateType} insertada`);
}

// ===== INICIALIZACIÓN DEL EDITOR =====
function initializeEditor() {
    console.log('🚀 Inicializando editor médico...');
    
    currentEditor = document.getElementById('medicalEditor');
    editorContainer = document.querySelector('.advanced-medical-editor');
    
    if (!currentEditor) {
        console.error('❌ No se pudo encontrar el editor');
        return;
    }
    
    // Configurar el editor
    currentEditor.focus();
    
    // Colocar cursor al final del contenido inicial
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(currentEditor);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Inicializar reconocimiento de voz si está disponible
    if (!speechRecognition) {
        initMedicalEditor();
    }
    
    console.log('✅ Editor médico inicializado correctamente');
}

// ===== GUARDAR NOTA AVANZADA =====
function saveMedicalNoteAdvanced(bedNumber, patientId) {
    const editor = document.getElementById('medicalEditor');
    if (!editor) {
        console.error('❌ Editor no encontrado');
        return false;
    }
    
    const noteContent = editor.innerHTML;
    
    if (!noteContent.trim() || noteContent.trim() === '') {
        Swal.fire({
            icon: 'warning',
            title: 'Nota vacía',
            text: 'Por favor escriba o dicte el contenido de la nota médica.'
        });
        return false;
    }
    
    // Detener reconocimiento de voz si está activo
    if (recognitionActive) {
        stopSpeechRecognition();
    }
    
    // Aquí iría la lógica para guardar en el backend
    const noteData = {
        bedNumber: bedNumber,
        patientId: patientId,
        content: noteContent,
        timestamp: new Date().toISOString(),
        type: 'evolution_note',
        hasImages: noteContent.includes('<img'),
        hasVoiceInput: true // Siempre true ya que tiene capacidad de voz
    };
    
    console.log('💾 Guardando nota médica avanzada:', noteData);
    
    // Simular guardado exitoso
    Swal.fire({
        icon: 'success',
        title: 'Nota guardada',
        text: 'La nota de evolución médica ha sido guardada exitosamente.',
        timer: 2000,
        timerProgressBar: true
    });
    
    return true;
}

// ===== INICIALIZACIÓN AUTOMÁTICA =====
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar cuando el documento esté listo
    initMedicalEditor();
    
    console.log('🏥 Editor Médico Avanzado cargado - Listo para usar con voz e imágenes');
});

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