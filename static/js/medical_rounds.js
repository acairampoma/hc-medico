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

// ===== FUNCIÓN PARA CREAR RECETA DESDE ACCIONES MÉDICAS =====
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


// ===== FUNCIÓN PARA CREAR NOTA MÉDICA DESDE ACCIONES MÉDICAS =====
async function createMedicalNoteDirect(bedNumber, patientId) {
    try {
        // Debug: mostrar qué datos recibimos
        console.log('🔍 Debug createMedicalNoteDirect:');
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
                    name: context?.name || 'Paciente desconocido',
                    age: context?.age || '---',
                    room: context?.room || 'General',
                    bed_number: bedNumber
                };
            } else {
                console.log('⚠️ No hay datos en contexto, intentando obtener del servidor');
                
                try {
                    // Intentar obtener datos del servidor
                    const response = await fetch(`/api/patients/${patientId}`);
                    if (response.ok) {
                        const data = await response.json();
                        patientData = {
                            name: data.name || data.full_name || 'Paciente desconocido',
                            age: data.age || '---',
                            room: data.room || data.department || 'General',
                            bed_number: bedNumber,
                            hc_number: data.hc_number || 'N/A',
                            gender: data.gender || data.sexo || '---',
                            diagnosis: data.diagnosis || 'Pendiente'
                        };
                        console.log('✅ Datos obtenidos del servidor:', patientData);
                    } else {
                        throw new Error('Error obteniendo datos del paciente');
                    }
                } catch (apiError) {
                    console.warn('⚠️ Error al obtener datos del servidor, usando datos de ejemplo');
                    // Usar datos de ejemplo si no se pueden obtener del servidor
                    patientData = {
                        name: `Paciente Cama ${bedNumber}`,
                        age: '45',
                        room: 'Medicina General',
                        bed_number: bedNumber,
                        hc_number: 'HC-2024-TEMP',
                        gender: 'No especificado',
                        diagnosis: 'Pendiente de evaluación'
                    };
                }
            }
        }
        
        // Enriquecer datos del paciente con información médica adicional
        const enrichedPatientData = {
            ...patientData,
            patientId: patientId,
            bed_number: bedNumber,
            timestamp: new Date().toISOString(),
            session_id: Date.now().toString(),
            // Asegurar que el diagnóstico se pase correctamente
            diagnosis: patientData.diagnosis || 'Pendiente de evaluación',
            // Información para la nota médica
            hospital_name: 'Hospital Central San José',
            hospital_address: 'Av. Angamos Este 2520, Surquillo, Lima',
            department: patientData.room || 'Medicina General',
            doctor_info: {
                name: 'Dr. Alan Cairampoma Carrillo',
                cmp: '12345',
                specialty: 'Medicina Interna'
            }
        };
        
        // Guardar datos en múltiples ubicaciones para asegurar disponibilidad
        // Usar claves estandarizadas para mejor compatibilidad entre archivos
        
        // Guardar con clave específica para este paciente
        const patientSpecificKey = `patient_${patientId}`;
        localStorage.setItem(patientSpecificKey, JSON.stringify(enrichedPatientData));
        
        // Guardar en ubicaciones estándar
        localStorage.setItem('currentPatientData', JSON.stringify(enrichedPatientData));
        localStorage.setItem('medicalNotePatientData', JSON.stringify(enrichedPatientData));
        sessionStorage.setItem('patientData', JSON.stringify(enrichedPatientData));
        sessionStorage.setItem('notePatientData', JSON.stringify(enrichedPatientData));
        
        // Definir la misma clave de almacenamiento que se usa en notamedica.js
        const MEDICAL_NOTE_STORAGE_KEY = 'medical_note_draft';
        
        // Limpiar localStorage de notas anteriores si es un paciente diferente
        const previousNotePatientId = localStorage.getItem('lastNotePatientId');
        if (previousNotePatientId && previousNotePatientId !== patientId) {
            console.log('🗑️ Limpiando nota anterior de otro paciente');
            localStorage.removeItem(MEDICAL_NOTE_STORAGE_KEY);
        }
        
        // Guardar ID del paciente actual para futuras referencias
        localStorage.setItem('lastNotePatientId', patientId);
        
        // También guardarlo en window para acceso inmediato
        window.currentMedicalNoteData = enrichedPatientData;
        
        console.log('💾 Datos guardados para nota médica:', enrichedPatientData);
        
        // Crear URL con parámetros para la página de notas médicas
        // Incluir más datos directamente en la URL para mayor robustez
        const notesUrl = `/medical/notes?patientId=${encodeURIComponent(patientId)}&bedNumber=${encodeURIComponent(bedNumber)}&timestamp=${Date.now()}&name=${encodeURIComponent(enrichedPatientData.name || '')}&diagnosis=${encodeURIComponent(enrichedPatientData.diagnosis || '')}&department=${encodeURIComponent(enrichedPatientData.department || '')}&hc=${encodeURIComponent(enrichedPatientData.hc_number || '')}&age=${encodeURIComponent(enrichedPatientData.age || '')}&gender=${encodeURIComponent(enrichedPatientData.gender || '')}`;
        
        // Abrir en nueva ventana/pestaña
        const newWindow = window.open(notesUrl, '_blank');
        
        // Verificar si se abrió correctamente
        if (newWindow) {
            console.log('✅ Página de notas médicas abierta correctamente');
            
            // Mostrar confirmación con toast
            Swal.fire({
                icon: 'success',
                title: '📝 Nota Médica',
                html: `
                    <div style="text-align: left;">
                        <p><strong>📋 Abriendo editor de nota médica</strong></p>
                        <p><strong>👤 Paciente:</strong> ${enrichedPatientData.name}</p>
                        <p><strong>🛏️ Cama:</strong> ${bedNumber}</p>
                        <p><strong>🏥 Servicio:</strong> ${enrichedPatientData.department}</p>
                    </div>
                `,
                timer: 3000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end',
                background: '#f8f9fa',
                color: '#2c5aa0'
            });
        } else {
            // Si no se pudo abrir, mostrar mensaje de error
            throw new Error('No se pudo abrir la ventana. Verifique que no esté bloqueada por el navegador.');
        }
        
    } catch (error) {
        console.error('❌ Error al crear nota médica:', error);
        
        // Cerrar cualquier diálogo abierto
        Swal.close();
        
        // Mostrar error detallado
        Swal.fire({
            icon: 'error',
            title: 'Error al abrir nota médica',
            html: `
                <div style="text-align: left;">
                    <p><strong>Error:</strong> ${error.message}</p>
                    <p><strong>Cama:</strong> ${bedNumber}</p>
                    <p><strong>ID Paciente:</strong> ${patientId}</p>
                    <br>
                    <p style="font-size: 12px; color: #666;">
                        Si el problema persiste, contacte al administrador del sistema.
                    </p>
                </div>
            `,
            confirmButtonColor: '#e74c3c',
            confirmButtonText: 'Entendido'
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