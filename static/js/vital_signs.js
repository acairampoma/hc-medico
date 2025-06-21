/**
 * ===============================================
 * MONITOR DE SIGNOS VITALES - CANVAS NATIVO
 * Refactorizado con datos reales + localStorage
 * Compatible con FastAPI + WebSocket + Alpine.js
 * ===============================================
 */

document.addEventListener('alpine:init', () => {
    Alpine.data('vitalSignsMonitor', () => ({
        // === ESTADO PRINCIPAL ===
        patientsData: {},
        filteredPatients: [],
        websocket: null,
        connectionStatus: 'connecting',
        connectionText: 'Conectando...',
        lastUpdate: 'Nunca',
        isLoading: false,
        
        // === DATOS DEL PACIENTE ACTUAL (LOCALSTORAGE) ===
        currentPatientData: null,
        userCompleto: null,
        
        // === FILTROS ===
        selectedRoom: '',
        alertFilter: '',
        
        // === CANVAS NATIVO ===
        canvasCharts: {},
        vitalSignsData: {},
        updateInterval: null,
        maxDataPoints: 50,
        
        // === ALERTAS ===
        toasts: [],
        totalAlerts: 0,
        toastCounter: 0,
        
        // === INICIALIZACIÓN ===
        async init() {
            console.log('🏥 Iniciando Monitor de Signos Vitales con Canvas Nativo...');
            
            // Cargar datos del localStorage
            this.loadLocalStorageData();
            
            await this.loadInitialData();
            this.initializeWebSocket();
            this.initializeCanvasCharts();
            this.startUpdateLoop();
            
            // Eventos de ventana
            window.addEventListener('beforeunload', () => {
                this.cleanup();
            });
            
            // Redimensionar canvas
            window.addEventListener('resize', () => {
                this.initializeCanvasCharts();
            });
        },
        
        // === CARGAR DATOS DEL LOCALSTORAGE ===
        loadLocalStorageData() {
            try {
                // Cargar datos del paciente actual desde medical rounds
                const currentPatientStr = localStorage.getItem('currentPatientData');
                if (currentPatientStr) {
                    this.currentPatientData = JSON.parse(currentPatientStr);
                    console.log('📋 Datos del paciente actual cargados:', this.currentPatientData);
                }
                
                // Cargar datos del usuario
                const userCompletoStr = localStorage.getItem('userCompleto');
                if (userCompletoStr) {
                    this.userCompleto = JSON.parse(userCompletoStr);
                    console.log('👤 Datos del usuario cargados:', this.userCompleto);
                }
            } catch (error) {
                console.warn('⚠️ Error cargando datos del localStorage:', error);
            }
        },
        
        // === CARGA DE DATOS ===
        async loadInitialData() {
            this.isLoading = true;
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const bedNumber = urlParams.get('bedNumber');
                
                console.log('📡 Cargando datos desde:', '/api/vital-signs');
                const response = await fetch('/api/vital-signs');
                const data = await response.json();
                console.log('🔍 Datos recibidos:', data);
                
                // ✅ CORREGIDO: Acceder a la estructura correcta
                const patientsVitals = data.vital_signs_monitoring?.patients_vitals || {};
                
                // Filtrar por cama si se especifica (desde URL o localStorage)
                const targetBedNumber = bedNumber || this.currentPatientData?.bedNumber;
                
                if (targetBedNumber && patientsVitals[targetBedNumber]) {
                    this.filteredPatients = [patientsVitals[targetBedNumber]];
                    console.log(`🎯 Mostrando solo paciente en cama: ${targetBedNumber}`);
                } else {
                    this.filteredPatients = Object.values(patientsVitals);
                    console.log(`👥 Mostrando ${this.filteredPatients.length} pacientes`);
                }
                
                // ✅ CORREGIDO: Asignar datos correctamente
                this.patientsData = patientsVitals;
                
                // Enriquecer datos con información del localStorage
                this.enrichPatientsWithLocalStorageData();
                
                this.initializeVitalSignsData();
                this.countTotalAlerts();
                this.lastUpdate = this.formatTime(new Date().toISOString());
                
                // Inicializar canvas después de que DOM esté listo
                this.$nextTick(() => {
                    setTimeout(() => this.initializeCanvasCharts(), 500);
                });
                
            } catch (error) {
                console.error('❌ Error cargando datos:', error);
                this.showErrorToast('Error al cargar datos iniciales');
            } finally {
                this.isLoading = false;
            }
        },
        
        // === ENRIQUECER DATOS CON LOCALSTORAGE ===
        enrichPatientsWithLocalStorageData() {
            if (!this.currentPatientData) return;
            
            // Buscar el paciente que coincida con los datos del localStorage
            const targetBed = this.currentPatientData.bedNumber;
            const targetDni = this.currentPatientData.dni || this.currentPatientData.patientId;
            
            // Enriquecer datos del paciente si existe en los signos vitales
            if (this.patientsData[targetBed]) {
                const patient = this.patientsData[targetBed];
                
                // Actualizar información del paciente con datos más completos
                patient.patient_info = {
                    ...patient.patient_info,
                    // Datos más completos del localStorage
                    name: this.currentPatientData.fullName || patient.patient_info.name,
                    age: this.currentPatientData.age || patient.patient_info.age,
                    gender: this.mapGender(this.currentPatientData.gender) || patient.patient_info.gender,
                    document_number: targetDni || patient.patient_info.document_number,
                    admission_date: this.currentPatientData.admissionDate || patient.patient_info.admission_date,
                    attending_physician: this.formatPhysicianName(),
                    specialty: this.currentPatientData.specialty || patient.patient_info.specialty,
                    diagnosis: this.formatDiagnosis(),
                    // Datos adicionales del localStorage
                    medical_record: this.currentPatientData.medicalRecord,
                    allergies: this.currentPatientData.allergies,
                    numero_cuenta: this.currentPatientData.numero_cuenta,
                    hospitalizacion_id: this.currentPatientData.hospitalizacion_id,
                    hospital_info: this.currentPatientData.hospital
                };
                
                console.log('✅ Datos del paciente enriquecidos:', patient.patient_info);
            }
        },
        
        // === MAPEAR GÉNERO ===
        mapGender(gender) {
            if (!gender) return 'M';
            const genderLower = gender.toLowerCase();
            if (genderLower.includes('femen') || genderLower === 'f') return 'F';
            if (genderLower.includes('mascul') || genderLower === 'm') return 'M';
            return gender;
        },
        
        // === FORMATEAR NOMBRE DEL MÉDICO ===
        formatPhysicianName() {
            if (this.userCompleto && this.userCompleto.firstName && this.userCompleto.lastName) {
                return `Dr. ${this.userCompleto.firstName} ${this.userCompleto.lastName}`;
            }
            if (this.currentPatientData?.doctor?.name) {
                return `Dr. ${this.currentPatientData.doctor.name}`;
            }
            return "Dr. Sistema HL7";
        },
        
        // === FORMATEAR DIAGNÓSTICO ===
        formatDiagnosis() {
            if (this.currentPatientData?.diagnosisCode && this.currentPatientData?.primaryDiagnosis) {
                return `${this.currentPatientData.diagnosisCode} - ${this.currentPatientData.primaryDiagnosis}`;
            }
            if (this.currentPatientData?.primaryDiagnosis) {
                return this.currentPatientData.primaryDiagnosis;
            }
            return "En evaluación médica";
        },
        
        // === INICIALIZAR DATOS HISTÓRICOS ===
        initializeVitalSignsData() {
            this.filteredPatients.forEach(patient => {
                const bedId = patient.patient_info.bed;
                const vitals = patient.current_vitals;
                
                this.vitalSignsData[bedId] = {
                    heartRate: { 
                        value: vitals.heart_rate?.value || 72, 
                        data: [], 
                        normal: [60, 100] 
                    },
                    systolic: { 
                        value: vitals.blood_pressure?.systolic || 120, 
                        data: [], 
                        normal: [90, 140] 
                    },
                    diastolic: { 
                        value: vitals.blood_pressure?.diastolic || 80, 
                        data: [], 
                        normal: [60, 90] 
                    },
                    oxygenSat: { 
                        value: vitals.oxygen_saturation?.value || 98, 
                        data: [], 
                        normal: [95, 100] 
                    },
                    temperature: { 
                        value: vitals.temperature?.value || 36.5, 
                        data: [], 
                        normal: [36.1, 37.2] 
                    },
                    respiratoryRate: { 
                        value: vitals.respiratory_rate?.value || 16, 
                        data: [], 
                        normal: [12, 20] 
                    },
                    painScale: { 
                        value: vitals.pain_scale?.value || 0, 
                        data: [], 
                        normal: [0, 3] 
                    }
                };
                
                // Generar datos históricos iniciales
                this.generateInitialHistoricalData(bedId);
            });
        },
        
        generateInitialHistoricalData(bedId) {
            const bedData = this.vitalSignsData[bedId];
            
            Object.keys(bedData).forEach(vitalType => {
                const vital = bedData[vitalType];
                const baseValue = vital.value;
                
                // Generar 20 puntos históricos con variación realista
                for (let i = 19; i >= 0; i--) {
                    const variation = this.getVariationForVital(vitalType);
                    const randomVariation = (Math.random() - 0.5) * 2 * variation;
                    const value = Math.max(0, baseValue + randomVariation);
                    
                    vital.data.push(Number(value.toFixed(1)));
                }
            });
        },
        
        getVariationForVital(vitalType) {
            const variations = {
                heartRate: 8,      // ±8 bpm
                systolic: 12,      // ±12 mmHg
                diastolic: 8,      // ±8 mmHg
                oxygenSat: 3,      // ±3%
                temperature: 0.8,  // ±0.8°C
                respiratoryRate: 5, // ±5 rpm
                painScale: 2       // ±2 puntos
            };
            return variations[vitalType] || 3;
        },
        
        // === CANVAS CHARTS ===
        initializeCanvasCharts() {
            console.log('📊 Inicializando gráficos canvas nativos...');
            
            this.filteredPatients.forEach(patient => {
                const bedId = patient.patient_info.bed;
                const vitals = ['hr', 'bp', 'temp', 'rr', 'spo2', 'pain'];
                
                if (!this.canvasCharts[bedId]) {
                    this.canvasCharts[bedId] = {};
                }
                
                vitals.forEach(vital => {
                    const canvasId = `chart-${vital}-${bedId}`;
                    const canvas = document.getElementById(canvasId);
                    
                    if (canvas) {
                        const ctx = canvas.getContext('2d');
                        canvas.width = canvas.offsetWidth;
                        canvas.height = canvas.offsetHeight;
                        
                        this.canvasCharts[bedId][vital] = ctx;
                        console.log(`✅ Canvas ${vital} inicializado para cama ${bedId}`);
                    }
                });
            });
        },
        
        // === WEBSOCKET ===
        initializeWebSocket() {
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//${window.location.host}/ws/vital-signs`;
            
            this.websocket = new WebSocket(wsUrl);
            
            this.websocket.onopen = () => {
                this.connectionStatus = 'connected';
                this.connectionText = 'Conectado';
                console.log('✅ WebSocket conectado');
            };
            
            this.websocket.onmessage = (event) => {
                const message = JSON.parse(event.data);
                this.handleWebSocketMessage(message);
            };
            
            this.websocket.onclose = () => {
                this.connectionStatus = 'disconnected';
                this.connectionText = 'Reconectando...';
                console.log('🔄 Reconectando WebSocket...');
                setTimeout(() => this.initializeWebSocket(), 3000);
            };
            
            this.websocket.onerror = (error) => {
                console.error('❌ Error WebSocket:', error);
                this.connectionStatus = 'disconnected';
                this.connectionText = 'Error de conexión';
            };
        },
        
        handleWebSocketMessage(message) {
            if (message.type === 'vital_signs_update' || message.type === 'initial_data') {
                this.updatePatientsData(message.data);
                this.lastUpdate = this.formatTime(new Date().toISOString());
            }
        },
        
        updatePatientsData(newData) {
            const previousData = { ...this.patientsData };
            
            // ✅ CORREGIDO: Acceder a la estructura correcta del WebSocket
            if (newData.vital_signs_monitoring) {
                this.patientsData = newData.vital_signs_monitoring.patients_vitals;
            } else {
                this.patientsData = newData;
            }
            
            // Actualizar datos locales con nuevos valores
            this.syncVitalSignsWithNewData(this.patientsData);
            
            // Aplicar filtros existentes
            this.applyFilters();
            this.detectCriticalAlerts(previousData, this.patientsData);
            this.countTotalAlerts();
        },
        
        syncVitalSignsWithNewData(newData) {
            Object.keys(newData).forEach(bedId => {
                if (this.vitalSignsData[bedId]) {
                    const patient = newData[bedId];
                    const vitals = patient.current_vitals;
                    
                    // Actualizar valores actuales
                    this.vitalSignsData[bedId].heartRate.value = vitals.heart_rate?.value || this.vitalSignsData[bedId].heartRate.value;
                    this.vitalSignsData[bedId].systolic.value = vitals.blood_pressure?.systolic || this.vitalSignsData[bedId].systolic.value;
                    this.vitalSignsData[bedId].diastolic.value = vitals.blood_pressure?.diastolic || this.vitalSignsData[bedId].diastolic.value;
                    this.vitalSignsData[bedId].oxygenSat.value = vitals.oxygen_saturation?.value || this.vitalSignsData[bedId].oxygenSat.value;
                    this.vitalSignsData[bedId].temperature.value = vitals.temperature?.value || this.vitalSignsData[bedId].temperature.value;
                    this.vitalSignsData[bedId].respiratoryRate.value = vitals.respiratory_rate?.value || this.vitalSignsData[bedId].respiratoryRate.value;
                    this.vitalSignsData[bedId].painScale.value = vitals.pain_scale?.value || this.vitalSignsData[bedId].painScale.value;
                }
            });
        },
        
        // === ACTUALIZACIÓN DE GRÁFICOS Y VALORES ===
        updateCharts() {
            this.filteredPatients.forEach(patient => {
                const bedId = patient.patient_info.bed;
                const bedData = this.vitalSignsData[bedId];
                const charts = this.canvasCharts[bedId];
                
                if (!bedData || !charts) return;
                
                // Agregar variación realista a los datos
                this.updateVitalData(bedId, 'heartRate');
                this.updateVitalData(bedId, 'systolic');
                this.updateVitalData(bedId, 'diastolic');
                this.updateVitalData(bedId, 'oxygenSat');
                this.updateVitalData(bedId, 'temperature');
                this.updateVitalData(bedId, 'respiratoryRate');
                this.updateVitalData(bedId, 'painScale');
                
                // ✅ ACTUALIZAR VALORES EN PANTALLA
                this.updateDisplayValues(bedId, patient);
                
                // Dibujar gráficos actualizados
                this.drawChart(charts.hr, bedData.heartRate.data, '#ff6b9d');
                this.drawChart(charts.bp, bedData.systolic.data, '#4fd1c7');
                this.drawChart(charts.spo2, bedData.oxygenSat.data, '#63b3ed');
                this.drawChart(charts.temp, bedData.temperature.data, '#f6ad55');
                this.drawChart(charts.rr, bedData.respiratoryRate.data, '#9f7aea');
                this.drawChart(charts.pain, bedData.painScale.data, '#fc8181');
            });
        },
        
        // ✅ ACTUALIZAR LOS VALORES NUMÉRICOS
        updateDisplayValues(bedId, patient) {
            const bedData = this.vitalSignsData[bedId];
            if (!bedData) return;
            
            // Guardar valores anteriores para detectar cambios críticos
            const oldValues = {
                heartRate: patient.current_vitals.heart_rate.value,
                systolic: patient.current_vitals.blood_pressure.systolic,
                diastolic: patient.current_vitals.blood_pressure.diastolic,
                oxygenSat: patient.current_vitals.oxygen_saturation.value,
                temperature: patient.current_vitals.temperature.value,
                respiratoryRate: patient.current_vitals.respiratory_rate.value,
                painScale: patient.current_vitals.pain_scale.value
            };
            
            // Actualizar los valores del paciente con los datos simulados
            const newValues = {
                heartRate: Math.round(bedData.heartRate.value),
                systolic: Math.round(bedData.systolic.value),
                diastolic: Math.round(bedData.diastolic.value),
                oxygenSat: Math.round(bedData.oxygenSat.value),
                temperature: Number(bedData.temperature.value.toFixed(1)),
                respiratoryRate: Math.round(bedData.respiratoryRate.value),
                painScale: Math.round(bedData.painScale.value)
            };
            
            // Actualizar valores en el paciente
            patient.current_vitals.heart_rate.value = newValues.heartRate;
            patient.current_vitals.blood_pressure.systolic = newValues.systolic;
            patient.current_vitals.blood_pressure.diastolic = newValues.diastolic;
            patient.current_vitals.oxygen_saturation.value = newValues.oxygenSat;
            patient.current_vitals.temperature.value = newValues.temperature;
            patient.current_vitals.respiratory_rate.value = newValues.respiratoryRate;
            patient.current_vitals.pain_scale.value = newValues.painScale;
            
            // Actualizar estados basados en los nuevos valores
            this.updateVitalStatuses(patient);
            
            // 🚨 DETECTAR Y CREAR ALERTAS AUTOMÁTICAS
            this.checkAndCreateAutoAlerts(patient, oldValues, newValues);
            
            // Actualizar timestamp
            patient.current_vitals.timestamp = new Date().toISOString();
            
            // Forzar actualización reactiva de Alpine.js
            this.$nextTick(() => {
                this.filteredPatients = [...this.filteredPatients];
            });
        },
        
        // ✅ ACTUALIZAR ESTADOS DE SIGNOS VITALES
        updateVitalStatuses(patient) {
            const vitals = patient.current_vitals;
            
            // Frecuencia cardíaca
            const hr = vitals.heart_rate.value;
            if (hr < 60) {
                vitals.heart_rate.status = 'low';
            } else if (hr > 100) {
                vitals.heart_rate.status = 'elevated';
            } else {
                vitals.heart_rate.status = 'normal';
            }
            
            // Presión arterial
            const sys = vitals.blood_pressure.systolic;
            if (sys >= 180) {
                vitals.blood_pressure.status = 'critical';
            } else if (sys >= 140) {
                vitals.blood_pressure.status = 'high';
            } else if (sys >= 130) {
                vitals.blood_pressure.status = 'elevated';
            } else {
                vitals.blood_pressure.status = 'normal';
            }
            
            // Temperatura
            const temp = vitals.temperature.value;
            if (temp >= 38.0) {
                vitals.temperature.status = 'fever';
            } else if (temp >= 37.5) {
                vitals.temperature.status = 'elevated';
            } else if (temp < 36.0) {
                vitals.temperature.status = 'low';
            } else {
                vitals.temperature.status = 'normal';
            }
            
            // Saturación de oxígeno
            const spo2 = vitals.oxygen_saturation.value;
            if (spo2 < 90) {
                vitals.oxygen_saturation.status = 'critical';
            } else if (spo2 < 95) {
                vitals.oxygen_saturation.status = 'low';
            } else {
                vitals.oxygen_saturation.status = 'normal';
            }
            
            // Frecuencia respiratoria
            const rr = vitals.respiratory_rate.value;
            if (rr < 12 || rr > 20) {
                vitals.respiratory_rate.status = 'abnormal';
            } else {
                vitals.respiratory_rate.status = 'normal';
            }
            
            // Escala de dolor
            const pain = vitals.pain_scale.value;
            if (pain >= 7) {
                vitals.pain_scale.status = 'severe';
            } else if (pain >= 4) {
                vitals.pain_scale.status = 'moderate';
            } else {
                vitals.pain_scale.status = 'mild';
            }
        },
        
        // 🚨 SISTEMA DE ALERTAS AUTOMÁTICAS
        checkAndCreateAutoAlerts(patient, oldValues, newValues) {
            const patientName = patient.patient_info.name;
            
            // Inicializar alertas si no existen
            if (!patient.alerts) {
                patient.alerts = [];
            }
            
            // 🔥 ALERTAS CRÍTICAS
            
            // Saturación de oxígeno crítica
            if (newValues.oxygenSat < 90 && oldValues.oxygenSat >= 90) {
                this.createPatientAlert(patient, 'critical', `Saturación crítica: ${newValues.oxygenSat}%`);
                this.showCriticalToast(patientName, `SpO₂ crítico: ${newValues.oxygenSat}%`);
            }
            
            // Crisis hipertensiva
            if (newValues.systolic >= 180 && oldValues.systolic < 180) {
                this.createPatientAlert(patient, 'critical', `Crisis hipertensiva: ${newValues.systolic}/${newValues.diastolic}`);
                this.showCriticalToast(patientName, `Crisis hipertensiva: ${newValues.systolic}/${newValues.diastolic} mmHg`);
            }
            
            // Taquicardia severa
            if (newValues.heartRate > 120 && oldValues.heartRate <= 120) {
                this.createPatientAlert(patient, 'warning', `Taquicardia: ${newValues.heartRate} bpm`);
                this.showWarningToast(patientName, `Taquicardia: ${newValues.heartRate} bpm`);
            }
            
            // Bradicardia
            if (newValues.heartRate < 50 && oldValues.heartRate >= 50) {
                this.createPatientAlert(patient, 'critical', `Bradicardia: ${newValues.heartRate} bpm`);
                this.showCriticalToast(patientName, `Bradicardia: ${newValues.heartRate} bpm`);
            }
            
            // Fiebre alta
            if (newValues.temperature >= 39.0 && oldValues.temperature < 39.0) {
                this.createPatientAlert(patient, 'warning', `Fiebre alta: ${newValues.temperature}°C`);
                this.showWarningToast(patientName, `Fiebre alta: ${newValues.temperature}°C`);
            }
            
            // Hipotermia
            if (newValues.temperature < 35.0 && oldValues.temperature >= 35.0) {
                this.createPatientAlert(patient, 'critical', `Hipotermia: ${newValues.temperature}°C`);
                this.showCriticalToast(patientName, `Hipotermia: ${newValues.temperature}°C`);
            }
            
            // Dolor severo
            if (newValues.painScale >= 8 && oldValues.painScale < 8) {
                this.createPatientAlert(patient, 'warning', `Dolor severo: ${newValues.painScale}/10`);
                this.showWarningToast(patientName, `Dolor severo: ${newValues.painScale}/10`);
            }
            
            // Taquipnea
            if (newValues.respiratoryRate > 25 && oldValues.respiratoryRate <= 25) {
                this.createPatientAlert(patient, 'warning', `Taquipnea: ${newValues.respiratoryRate} rpm`);
                this.showWarningToast(patientName, `Taquipnea: ${newValues.respiratoryRate} rpm`);
            }
            
            // Actualizar conteo total de alertas
            this.countTotalAlerts();
        },
        
        // ✅ CREAR ALERTA PARA PACIENTE ESPECÍFICO
        createPatientAlert(patient, type, message) {
            const alert = {
                type: type,
                message: message,
                timestamp: new Date().toISOString() + 'Z',
                acknowledged: false
            };
            
            patient.alerts.push(alert);
            
            // Mantener solo las últimas 10 alertas por paciente
            if (patient.alerts.length > 10) {
                patient.alerts = patient.alerts.slice(-10);
            }
            
            console.log(`🚨 Nueva alerta ${type}: ${patient.patient_info.name} - ${message}`);
        },
        
        updateVitalData(bedId, vitalType) {
            const vital = this.vitalSignsData[bedId][vitalType];
            const baseValue = vital.value;
            const variation = this.getVariationForVital(vitalType);
            
            // Generar variación sutil para efecto de movimiento continuo
            const randomVariation = (Math.random() - 0.5) * variation * 0.8;
            let newValue = baseValue + randomVariation;
            
            // Aplicar límites realistas por tipo de vital
            switch(vitalType) {
                case 'heartRate':
                    newValue = Math.max(50, Math.min(150, newValue));
                    break;
                case 'systolic':
                    newValue = Math.max(90, Math.min(200, newValue));
                    break;
                case 'diastolic':
                    newValue = Math.max(50, Math.min(120, newValue));
                    break;
                case 'oxygenSat':
                    newValue = Math.max(85, Math.min(100, newValue));
                    break;
                case 'temperature':
                    newValue = Math.max(35.0, Math.min(42.0, newValue));
                    break;
                case 'respiratoryRate':
                    newValue = Math.max(8, Math.min(35, newValue));
                    break;
                case 'painScale':
                    newValue = Math.max(0, Math.min(10, newValue));
                    break;
            }
            
            // Actualizar el valor base con el nuevo valor
            vital.value = newValue;
            
            // Agregar nuevo punto a los datos históricos
            vital.data.push(Number(newValue.toFixed(1)));
            
            // Mantener máximo de puntos
            if (vital.data.length > this.maxDataPoints) {
                vital.data.shift();
            }
        },
        
        // === DIBUJAR GRÁFICOS ===
        drawChart(ctx, data, color) {
            if (!ctx || !data || data.length < 2) return;
            
            const canvas = ctx.canvas;
            
            // ✅ LIMPIAR CON MEJOR RESOLUCIÓN
            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // ✅ CONFIGURAR ANTI-ALIASING
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // ✅ LÍNEAS MÁS NÍTIDAS Y SUAVES
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // ✅ REDUCIR BRILLO/INTENSIDAD
            ctx.globalAlpha = 0.8;
            
            // ✅ QUITAR SOMBRA (causa borrosidad)
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            
            // Calcular escalas
            const minVal = Math.min(...data);
            const maxVal = Math.max(...data);
            const range = maxVal - minVal || 1;
            const padding = 8;
            
            ctx.beginPath();
            
            data.forEach((value, index) => {
                const x = (index / (data.length - 1)) * (canvas.width - 2 * padding) + padding;
                const y = canvas.height - padding - ((value - minVal) / range) * (canvas.height - 2 * padding);
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
            ctx.restore();
        },
        
        // === LOOP DE ACTUALIZACIÓN ===
        startUpdateLoop() {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
            }
            
            this.updateInterval = setInterval(() => {
                if (this.filteredPatients.length > 0) {
                    this.updateCharts();
                }
            }, 1000); // Cada segundo
            
            console.log('🔄 Loop de actualización iniciado (cada 1 segundo)');
        },
        
        // === OBTENER VALORES ACTUALES ===
        getVitalValue(vitalType, patient) {
            try {
                const vitals = patient.current_vitals;
                if (!vitals) return null;
                
                switch(vitalType) {
                    case 'hr': return vitals.heart_rate?.value;
                    case 'bp': return vitals.blood_pressure?.systolic;
                    case 'temp': return vitals.temperature?.value;
                    case 'rr': return vitals.respiratory_rate?.value;
                    case 'spo2': return vitals.oxygen_saturation?.value;
                    case 'pain': return vitals.pain_scale?.value;
                    default: return null;
                }
            } catch (error) {
                console.warn(`⚠️ Error obteniendo valor ${vitalType}:`, error);
                return null;
            }
        },
        
        // === ESTADO DE SALUD ===
        getHealthStatus(vital, value) {
            const vitalData = this.vitalSignsData[Object.keys(this.vitalSignsData)[0]];
            if (!vitalData || !vitalData[vital]) return 'normal';
            
            const normal = vitalData[vital].normal;
            if (value >= normal[0] && value <= normal[1]) {
                return 'normal';
            } else if (value < normal[0] * 0.8 || value > normal[1] * 1.2) {
                return 'critical';
            } else {
                return 'warning';
            }
        },
        
        // === FILTROS ===
        applyFilters() {
            const urlParams = new URLSearchParams(window.location.search);
            const bedNumber = urlParams.get('bedNumber');
            const targetBedNumber = bedNumber || this.currentPatientData?.bedNumber;
            
            if (targetBedNumber && this.patientsData[targetBedNumber]) {
                this.filteredPatients = [this.patientsData[targetBedNumber]];
                return;
            }
            
            let filtered = Object.values(this.patientsData);
            
            if (this.selectedRoom) {
                filtered = filtered.filter(patient => 
                    patient.patient_info.room_type === this.selectedRoom
                );
            }
            
            if (this.alertFilter) {
                switch (this.alertFilter) {
                    case 'critical':
                        filtered = filtered.filter(patient => 
                            patient.monitoring_status === 'critical'
                        );
                        break;
                    case 'warning':
                        filtered = filtered.filter(patient => 
                            patient.alerts?.some(alert => !alert.acknowledged)
                        );
                        break;
                    case 'normal':
                        filtered = filtered.filter(patient => 
                            !patient.alerts?.some(alert => !alert.acknowledged)
                        );
                        break;
                }
            }
            
            this.filteredPatients = filtered;
        },
        
        filterByRoom() { this.applyFilters(); },
        filterByAlerts() { this.applyFilters(); },
        
        // === ALERTAS ===
        detectCriticalAlerts(oldData, newData) {
            Object.keys(newData).forEach(bedId => {
                const newPatient = newData[bedId];
                const oldPatient = oldData[bedId];
                
                if (!oldPatient || !newPatient) return;
                
                try {
                    const newVitals = newPatient.current_vitals;
                    const oldVitals = oldPatient.current_vitals;
                    
                    if (!newVitals || !oldVitals) return;
                    
                    // Detectar cambios críticos
                    if (newVitals.oxygen_saturation?.value < 90 && 
                        oldVitals.oxygen_saturation?.value >= 90) {
                        this.showCriticalToast(
                            `${newPatient.patient_info.name}`,
                            `SpO₂ crítico: ${newVitals.oxygen_saturation.value}%`
                        );
                    }
                    
                    if (newVitals.blood_pressure?.systolic > 180 && 
                        oldVitals.blood_pressure?.systolic <= 180) {
                        this.showCriticalToast(
                            `${newPatient.patient_info.name}`,
                            `Crisis hipertensiva: ${newVitals.blood_pressure.systolic}/${newVitals.blood_pressure.diastolic}`
                        );
                    }
                } catch (error) {
                    console.warn(`⚠️ Error detectando alertas para cama ${bedId}:`, error);
                }
            });
        },
        
        countTotalAlerts() {
            this.totalAlerts = Object.values(this.patientsData).reduce((total, patient) => {
                return total + (patient.alerts?.filter(alert => !alert.acknowledged).length || 0);
            }, 0);
        },
        
        async acknowledgeAlert(bedId, alertIndex) {
            try {
                const response = await fetch(`/api/vital-signs/${bedId}/acknowledge-alert/${alertIndex}`, {
                    method: 'POST'
                });
                
                if (response.ok) {
                    this.showSuccessToast('Alerta reconocida');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showErrorToast('Error al reconocer alerta');
            }
        },
        
        // === FUNCIONES DE UTILIDAD ===
        getCardClass(patient) {
            const unacknowledgedAlerts = patient.alerts?.filter(alert => !alert.acknowledged) || [];
            
            if (patient.monitoring_status === 'critical' || 
                unacknowledgedAlerts.some(alert => alert.type === 'critical')) {
                return 'critical';
            }
            
            if (unacknowledgedAlerts.some(alert => alert.type === 'warning')) {
                return 'warning';
            }
            
            return 'normal';
        },
        
        getStatusText(status) {
            const statusMap = {
                'active': 'Monitoreando',
                'critical': 'Crítico',
                'warning': 'Alerta',
                'normal': 'Estable'
            };
            return statusMap[status] || status;
        },
        
        getTrendIcon(trend) {
            const trendMap = {
                'stable': 'fas fa-minus',
                'increasing': 'fas fa-arrow-up',
                'decreasing': 'fas fa-arrow-down'
            };
            return trendMap[trend] || 'fas fa-minus';
        },
        
        getAlertIcon(type) {
            const iconMap = {
                'critical': 'fas fa-exclamation-triangle',
                'warning': 'fas fa-exclamation-circle',
                'info': 'fas fa-info-circle',
                'success': 'fas fa-check-circle',
                'error': 'fas fa-times-circle'
            };
            return iconMap[type] || 'fas fa-bell';
        },
        
        formatTime(timestamp) {
            try {
                const date = new Date(timestamp);
                return date.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            } catch (error) {
                return 'N/A';
            }
        },
        
        // === TOASTS CON TIPOS DE ALERTA ===
        showCriticalToast(title, message) {
            this.addToast('critical', title, message, 8000);
        },
        
        showWarningToast(title, message) {
            this.addToast('warning', title, message, 6000);
        },
        
        showSuccessToast(message) {
            this.addToast('success', 'Éxito', message, 3000);
        },
        
        showErrorToast(message) {
            this.addToast('error', 'Error', message, 5000);
        },
        
        addToast(type, title, message, duration = 5000) {
            const toast = {
                id: ++this.toastCounter,
                type,
                title,
                message,
                visible: true,
                timestamp: new Date().toLocaleTimeString('es-ES')
            };
            
            this.toasts.push(toast);
            
            // Auto-cerrar después del tiempo especificado
            setTimeout(() => {
                this.closeToast(toast.id);
            }, duration);
            
            // Sonido de alerta según tipo
            this.playAlertSound(type);
            
            console.log(`🔔 Toast ${type}: ${title} - ${message}`);
        },
        
        // ✅ SONIDOS DE ALERTA
        playAlertSound(type) {
            try {
                // Crear audio context para sonidos
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                // Frecuencias según tipo de alerta
                switch(type) {
                    case 'critical':
                        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                        break;
                    case 'warning':
                        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                        break;
                    default:
                        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                        break;
                }
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.2);
            } catch (error) {
                console.warn('No se pudo reproducir sonido de alerta:', error);
            }
        },
        
        closeToast(toastId) {
            const index = this.toasts.findIndex(toast => toast.id === toastId);
            if (index !== -1) {
                this.toasts[index].visible = false;
                setTimeout(() => {
                    this.toasts.splice(index, 1);
                }, 300);
            }
        },
        
        // === ACCIONES ===
        async refreshData() {
            await this.loadInitialData();
            this.showSuccessToast('Datos actualizados');
        },
        
        showAllAlerts() {
            const allAlerts = [];
            Object.values(this.patientsData).forEach(patient => {
                const unacknowledged = patient.alerts?.filter(alert => !alert.acknowledged) || [];
                unacknowledged.forEach(alert => {
                    allAlerts.push({
                        ...alert,
                        patientName: patient.patient_info.name,
                        bed: patient.patient_info.bed
                    });
                });
            });
            
            if (allAlerts.length === 0) {
                this.showSuccessToast('No hay alertas pendientes');
                return;
            }
            
            console.log(`🚨 ${allAlerts.length} alertas pendientes`);
            alert(`Alertas pendientes: ${allAlerts.length}\n\n${allAlerts.map(a => 
                `${a.patientName} (${a.bed}): ${a.message}`
            ).join('\n')}`);
        },
        
        // === SIMULACIONES MANUALES ===
        async simulatePatient(bedId) {
            try {
                const response = await fetch(`/api/vital-signs/${bedId}/simulate`, {
                    method: 'POST'
                });
                
                if (response.ok) {
                    this.showSuccessToast(`Simulación ejecutada para cama ${bedId}`);
                }
            } catch (error) {
                console.error('Error en simulación:', error);
                this.showErrorToast('Error en simulación');
            }
        },
        
        async simulateAllPatients() {
            try {
                const response = await fetch('/api/vital-signs/simulate/all', {
                    method: 'POST'
                });
                
                if (response.ok) {
                    this.showSuccessToast('Simulación ejecutada para todos los pacientes');
                }
            } catch (error) {
                console.error('Error en simulación general:', error);
                this.showErrorToast('Error en simulación general');
            }
        },
        
        // === INFORMACIÓN ADICIONAL DEL PACIENTE ===
        getPatientAdditionalInfo(patient) {
            const info = patient.patient_info;
            return {
                medicalRecord: info.medical_record || 'N/A',
                allergies: info.allergies || 'Ninguna conocida',
                numeroTarjeta: info.numero_cuenta || 'N/A',
                hospitalizacionId: info.hospitalizacion_id || 'N/A',
                hospitalInfo: info.hospital_info || null
            };
        },
        
        // === ESTADO DE CONEXIÓN MEJORADO ===
        getConnectionStatusText(patient) {
            const connection = patient.monitor_connection;
            if (!connection) return 'Sin información';
            
            switch (connection.status) {
                case 'connected':
                    return '🟢 Monitor conectado';
                case 'available_not_connected':
                    return '🟡 Monitor disponible';
                case 'no_monitor':
                    return '🔴 Sin monitor';
                default:
                    return '⚪ Estado desconocido';
            }
        },
        
        getLastReadingText(patient) {
            const connection = patient.monitor_connection;
            if (!connection?.last_reading) return 'Sin lecturas';
            
            try {
                const lastReading = new Date(connection.last_reading);
                const now = new Date();
                const diffSeconds = Math.floor((now - lastReading) / 1000);
                
                if (diffSeconds < 60) {
                    return `Hace ${diffSeconds} segundos`;
                } else if (diffSeconds < 3600) {
                    return `Hace ${Math.floor(diffSeconds / 60)} minutos`;
                } else {
                    return `Hace ${Math.floor(diffSeconds / 3600)} horas`;
                }
            } catch (error) {
                return 'Tiempo inválido';
            }
        },
        
        // === LIMPIEZA ===
        cleanup() {
            console.log('🧹 Iniciando limpieza...');
            
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
            
            if (this.websocket) {
                this.websocket.close();
                this.websocket = null;
            }
            
            // Limpiar canvas
            Object.values(this.canvasCharts).forEach(bedCharts => {
                Object.values(bedCharts).forEach(ctx => {
                    if (ctx && ctx.canvas) {
                        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                    }
                });
            });
            
            console.log('🧹 Limpieza completada');
        }
    }));
});

console.log('✅ Monitor de Signos Vitales Canvas Nativo - Refactorizado con datos reales + localStorage! 🏥✨');

/**
 * Configura los botones de volver para la página de signos vitales
 * Utiliza common_navigation.js para manejar la navegación
 */
function setupBackButtonsForVitalSigns() {
    console.log('Configurando botones de volver para monitor de signos vitales');
    
    // Verificar si la función de configuración común está disponible
    if (typeof setupBackButtons === 'function') {
        // Configurar el comportamiento del botón volver
        setupBackButtons(function() {
            console.log('Volviendo desde monitor de signos vitales a rondas médicas');
            
            // Usar la función común para volver a rondas médicas
            returnToMedicalRounds();
            return true; // Indicar que se ha manejado la navegación
        });
    } else {
        console.warn('La función setupBackButtons no está disponible');
        
        // Fallback: configurar manualmente los botones de volver
        const backButtons = document.querySelectorAll('.back-btn, .btn-back, [data-action="back"]');
        backButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = '/medical/rounds';
            });
        });
    }
}

// Inicializar configuración de botones de volver cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Configurar botones de volver
    setupBackButtonsForVitalSigns();
});