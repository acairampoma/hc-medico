/**
 * ===============================================
 * EXAM ORDERS JAVASCRIPT
 * Hospital San José - Sistema de Órdenes de Exámenes
 * ===============================================
 */

document.addEventListener('alpine:init', () => {
    Alpine.data('examOrdersApp', () => ({
        // === ESTADO PRINCIPAL ===
        datosDesdeRondas: false,
        data: {
            paciente: { 
                nombre: '', 
                edad: '', 
                genero: '', 
                cama: '', 
                sala: '' 
            },
            medico: { 
                nombre: 'Dr. María González' 
            },
            diagnostico: {},
            examenes: [] // 🆕 Cambio de medicamentos a exámenes
        },
        
        // === VARIABLES DE CONTROL ===
        // Diagnóstico
        buscarDx: '',
        mostrarDx: false,
        dxFiltrados: [],
        
        // Exámenes (antes medicamentos)
        mostrarFormExamen: false,
        buscarExam: '',
        mostrarExams: false,
        examFiltrados: [],
        nuevoExam: { 
            nombre: '', 
            tipo: '',
            cantidad: '1', 
            indicaciones: '',
            urgente: false // 🆕 Campo nuevo para urgencia
        },
        
        // Firma digital
        signaturePad: null,
        
        // === BASE DE DATOS ===
        // Diagnósticos CIE-10 (mismo que antes)
        diagnosticos: [
            { codigo: 'K59.0', nombre: 'Estreñimiento' },
            { codigo: 'I10', nombre: 'Hipertensión esencial' },
            { codigo: 'E11.9', nombre: 'Diabetes tipo 2' },
            { codigo: 'J06.9', nombre: 'Infección respiratoria' },
            { codigo: 'M79.3', nombre: 'Dolor muscular' },
            { codigo: 'R50.9', nombre: 'Fiebre' },
            { codigo: 'N39.0', nombre: 'Infección urinaria' },
            { codigo: 'K30', nombre: 'Dispepsia' },
            { codigo: 'A09', nombre: 'Diarrea y gastroenteritis' },
            { codigo: 'H10.9', nombre: 'Conjuntivitis' },
            { codigo: 'J44.1', nombre: 'EPOC con exacerbación aguda' },
            { codigo: 'G43.9', nombre: 'Migraña' },
            { codigo: 'L30.9', nombre: 'Dermatitis' },
            { codigo: 'F32.9', nombre: 'Episodio depresivo' },
            { codigo: 'M25.5', nombre: 'Dolor articular' }
        ],
        
        // 🧪 BASE DE DATOS DE EXÁMENES
        examenes: [
            // === LABORATORIO CLÍNICO ===
            { id: 1, nombre: 'Hemograma Completo', codigo: 'HEM001', categoria: 'Hematología', tipo: 'Laboratorio', urgencia: 'Normal' },
            { id: 2, nombre: 'Glucosa en Ayunas', codigo: 'GLU001', categoria: 'Bioquímica', tipo: 'Laboratorio', urgencia: 'Normal' },
            { id: 3, nombre: 'Perfil Lipídico', codigo: 'LIP001', categoria: 'Bioquímica', tipo: 'Laboratorio', urgencia: 'Normal' },
            { id: 4, nombre: 'Función Renal (Urea/Creatinina)', codigo: 'REN001', categoria: 'Bioquímica', tipo: 'Laboratorio', urgencia: 'Normal' },
            { id: 5, nombre: 'Función Hepática', codigo: 'HEP001', categoria: 'Bioquímica', tipo: 'Laboratorio', urgencia: 'Normal' },
            { id: 6, nombre: 'Electrolitos (Na, K, Cl)', codigo: 'ELE001', categoria: 'Bioquímica', tipo: 'Laboratorio', urgencia: 'Urgente' },
            { id: 7, nombre: 'Examen de Orina Completo', codigo: 'ORI001', categoria: 'Uroanálisis', tipo: 'Laboratorio', urgencia: 'Normal' },
            { id: 8, nombre: 'Urocultivo', codigo: 'URO001', categoria: 'Microbiología', tipo: 'Laboratorio', urgencia: 'Normal' },
            { id: 9, nombre: 'Hemocultivo', codigo: 'HCU001', categoria: 'Microbiología', tipo: 'Laboratorio', urgencia: 'Urgente' },
            { id: 10, nombre: 'Proteína C Reactiva (PCR)', codigo: 'PCR001', categoria: 'Inmunología', tipo: 'Laboratorio', urgencia: 'Normal' },
            
            // === IMAGENOLOGÍA ===
            { id: 11, nombre: 'Radiografía de Tórax', codigo: 'RXT001', categoria: 'Radiología Simple', tipo: 'Imagenología', urgencia: 'Normal' },
            { id: 12, nombre: 'Radiografía de Abdomen', codigo: 'RXA001', categoria: 'Radiología Simple', tipo: 'Imagenología', urgencia: 'Normal' },
            { id: 13, nombre: 'Tomografía de Cráneo', codigo: 'TAC001', categoria: 'Tomografía', tipo: 'Imagenología', urgencia: 'Urgente' },
            { id: 14, nombre: 'Tomografía de Abdomen', codigo: 'TAC002', categoria: 'Tomografía', tipo: 'Imagenología', urgencia: 'Normal' },
            { id: 15, nombre: 'Ecografía Abdominal', codigo: 'ECO001', categoria: 'Ecografía', tipo: 'Imagenología', urgencia: 'Normal' },
            { id: 16, nombre: 'Ecocardiograma', codigo: 'ECO002', categoria: 'Ecografía', tipo: 'Imagenología', urgencia: 'Normal' },
            { id: 17, nombre: 'Resonancia Magnética Cerebral', codigo: 'RMN001', categoria: 'Resonancia', tipo: 'Imagenología', urgencia: 'Normal' },
            { id: 18, nombre: 'Mamografía', codigo: 'MAM001', categoria: 'Radiología Especializada', tipo: 'Imagenología', urgencia: 'Normal' },
            
            // === CARDIOLOGÍA ===
            { id: 19, nombre: 'Electrocardiograma (ECG)', codigo: 'ECG001', categoria: 'Cardiología', tipo: 'Funcional', urgencia: 'Urgente' },
            { id: 20, nombre: 'Holter 24 horas', codigo: 'HOL001', categoria: 'Cardiología', tipo: 'Funcional', urgencia: 'Normal' },
            { id: 21, nombre: 'Prueba de Esfuerzo', codigo: 'PEF001', categoria: 'Cardiología', tipo: 'Funcional', urgencia: 'Normal' },
            
            // === NEUMOLOGÍA ===
            { id: 22, nombre: 'Espirometría', codigo: 'ESP001', categoria: 'Neumología', tipo: 'Funcional', urgencia: 'Normal' },
            { id: 23, nombre: 'Gasometría Arterial', codigo: 'GAS001', categoria: 'Neumología', tipo: 'Laboratorio', urgencia: 'Urgente' },
            
            // === OTROS ===
            { id: 24, nombre: 'Endoscopía Digestiva Alta', codigo: 'END001', categoria: 'Endoscopía', tipo: 'Invasivo', urgencia: 'Normal' },
            { id: 25, nombre: 'Colonoscopía', codigo: 'COL001', categoria: 'Endoscopía', tipo: 'Invasivo', urgencia: 'Normal' }
        ],
        
        // Exámenes recomendados por diagnóstico
        examenesPorDx: {
            'K59.0': [7, 15], // Estreñimiento: Orina, Eco abdominal
            'I10': [1, 3, 19, 20], // Hipertensión: Hemograma, Perfil lipídico, ECG, Holter
            'E11.9': [2, 3, 4, 7], // Diabetes: Glucosa, Perfil lipídico, Función renal, Orina
            'J06.9': [1, 10, 11, 22], // Infección respiratoria: Hemograma, PCR, RX tórax, Espirometría
            'M79.3': [1, 10], // Dolor muscular: Hemograma, PCR
            'R50.9': [1, 9, 10, 11], // Fiebre: Hemograma, Hemocultivo, PCR, RX tórax
            'N39.0': [7, 8, 4], // Infección urinaria: Orina, Urocultivo, Función renal
            'K30': [15, 24], // Dispepsia: Eco abdominal, Endoscopía
            'A09': [1, 6, 7], // Diarrea: Hemograma, Electrolitos, Orina
            'H10.9': [1], // Conjuntivitis: Hemograma
            'J44.1': [1, 11, 22, 23], // EPOC: Hemograma, RX tórax, Espirometría, Gasometría
            'G43.9': [13], // Migraña: TAC cráneo
            'L30.9': [1], // Dermatitis: Hemograma
            'M25.5': [1, 10] // Dolor articular: Hemograma, PCR
        },

        // 🆕 PLANTILLAS DE EXÁMENES PREDEFINIDAS
// 🆕 PLANTILLAS DE EXÁMENES (después de examenesPorDx)
plantillasExamenes: [
    {
        id: 'colicos',
        nombre: 'Cólicos Abdominales',
        examenes: [
            { examenId: 1, cantidad: '1 examen', indicaciones: 'Evaluar estado general' },
            { examenId: 15, cantidad: '1 examen', indicaciones: 'Descartar patología abdominal' },
            { examenId: 7, cantidad: '1 muestra', indicaciones: 'Descartar ITU' },
            { examenId: 12, cantidad: '1 vista', indicaciones: 'Evaluar obstrucción intestinal' }
        ]
    },
    {
        id: 'chequeo_general', 
        nombre: 'Chequeo General',
        examenes: [
            { examenId: 1, cantidad: '1 examen', indicaciones: 'Evaluación hematológica' },
            { examenId: 2, cantidad: '1 muestra', indicaciones: 'En ayunas de 12 horas' },
            { examenId: 3, cantidad: '1 examen', indicaciones: 'En ayunas de 12 horas' },
            { examenId: 19, cantidad: '1 examen', indicaciones: 'Evaluación cardiológica' }
        ]
    },
    {
        id: 'preoperatorio',
        nombre: 'Preoperatorio Básico',
        examenes: [
            { examenId: 1, cantidad: '1 examen', indicaciones: 'Evaluación preoperatoria' },
            { examenId: 19, cantidad: '1 examen', indicaciones: 'Riesgo cardiovascular' },
            { examenId: 11, cantidad: '1 vista', indicaciones: 'Evaluación pulmonar' }
        ]
    },
    {
        id: 'diabetes_control',
        nombre: 'Control de Diabetes', 
        examenes: [
            { examenId: 2, cantidad: '1 muestra', indicaciones: 'En ayunas de 12 horas' },
            { examenId: 3, cantidad: '1 examen', indicaciones: 'Perfil lipídico completo' },
            { examenId: 4, cantidad: '1 examen', indicaciones: 'Función renal' }
        ]
    }
],

// 🆕 Variable para plantilla seleccionada
plantillaSeleccionada: '',
        
        // === MÉTODOS DE INICIALIZACIÓN ===
        init() {
            this.configurarEventListeners();
            this.cargarDatosURL();
            this.inicializarFirma();
        },

        configurarEventListeners() {
            // Cerrar dropdowns al hacer click fuera
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.dx-search')) {
                    this.mostrarDx = false;
                }
                if (!e.target.closest('.exam-search')) {
                    this.mostrarExams = false;
                }
            });
        },

        inicializarFirma() {
            this.$nextTick(() => {
                const canvas = document.getElementById('signaturePad');
                if (canvas && window.SignaturePad) {
                    this.signaturePad = new SignaturePad(canvas, {
                        backgroundColor: 'rgb(255, 255, 255)',
                        penColor: 'rgb(0, 0, 0)',
                        minWidth: 0.5,
                        maxWidth: 2.5,
                        throttle: 16,
                        minDistance: 5
                    });
                }
            });
        },

        // === GESTIÓN DE DATOS DEL PACIENTE ===
        determinarGenero(patientData) {
            if (patientData.gender) {
                return patientData.gender === 'Masculino' ? 'M' : 
                       patientData.gender === 'Femenino' ? 'F' : '';
            } else if (patientData.genero) {
                return patientData.genero === 'Masculino' ? 'M' : 
                       patientData.genero === 'Femenino' ? 'F' : 
                       patientData.genero;
            }
            return '';
        },

        cargarDatosPaciente(patientData) {
            console.log('Cargando datos del paciente:', patientData);
            
            try {
                // Establecer datos del paciente
                this.data.paciente.nombre = patientData.patientName || patientData.nombre || '';
                this.data.paciente.edad = patientData.patientAge || patientData.edad || '';
                this.data.paciente.genero = this.determinarGenero(patientData);
                this.data.paciente.cama = patientData.bedNumber || patientData.cama || '';
                this.data.paciente.sala = patientData.specialty || patientData.servicio || patientData.sala || '';
                
                // Cargar diagnóstico si existe
                if (patientData.diagnosis || patientData.diagnostico) {
                    const diagnosisCode = patientData.diagnosisCode || patientData.codigoDiagnostico || '';
                    const diagnosisName = patientData.diagnosis || patientData.diagnostico || '';
                    
                    this.data.diagnostico = {
                        codigo: diagnosisCode,
                        nombre: diagnosisName
                    };
                }
                
                // Establecer médico
                if (patientData.doctor || patientData.medico) {
                    this.data.medico.nombre = patientData.doctor || patientData.medico;
                } else {
                    this.data.medico.nombre = 'Dr. Carrillo - Cabeza y Cuello';
                }
                
                // Marcar origen de datos
                this.datosDesdeRondas = true;
                
                console.log('Datos cargados correctamente');
            } catch (error) {
                console.error('Error al cargar datos del paciente:', error);
                this.mostrarError('Error al cargar datos del paciente');
            }
        },

        cargarDatosURL() {
            console.log('Buscando datos del paciente...');
            
            try {
                // Verificar sessionStorage primero
                const sessionData = sessionStorage.getItem('patientData');
                if (sessionData) {
                    const patientData = JSON.parse(sessionData);
                    this.cargarDatosPaciente(patientData);
                    return;
                }
                
                // Verificar parámetros URL
                const urlParams = new URLSearchParams(window.location.search);
                const patientId = urlParams.get('patientId');
                
                if (patientId) {
                    const patientKey = `patient_${patientId}`;
                    const patientDataStr = localStorage.getItem(patientKey) || 
                                         localStorage.getItem('currentPatientData');
                    
                    if (patientDataStr) {
                        const patientData = JSON.parse(patientDataStr);
                        this.cargarDatosPaciente(patientData);
                        return;
                    }
                }
                
                // Verificar localStorage general
                const pacienteData = localStorage.getItem('currentPatientData') || 
                                   localStorage.getItem('patientData') || 
                                   localStorage.getItem('patient_data');
                
                if (pacienteData) {
                    const patientData = JSON.parse(pacienteData);
                    this.cargarDatosPaciente(patientData);
                } else if (window.currentPatientData) {
                    this.cargarDatosPaciente(window.currentPatientData);
                }
            } catch (error) {
                console.error('Error al cargar datos desde URL/localStorage:', error);
            }
        },

        // === GESTIÓN DE DIAGNÓSTICOS ===
        filtrarDx() {
            if (this.buscarDx.length < 2) {
                this.dxFiltrados = [];
                return;
            }
            
            const termino = this.buscarDx.toLowerCase();
            this.dxFiltrados = this.diagnosticos.filter(dx => 
                dx.codigo.toLowerCase().includes(termino) ||
                dx.nombre.toLowerCase().includes(termino)
            ).slice(0, 10);
        },

        seleccionarDx(dx) {
            this.data.diagnostico = { ...dx };
            this.buscarDx = `${dx.codigo} - ${dx.nombre}`;
            this.mostrarDx = false;
            
            // Mostrar exámenes recomendados
            this.filtrarExamenesRecomendados(dx.codigo);
        },

        eliminarDiagnostico() {
            Swal.fire({
                title: '¿Eliminar diagnóstico?',
                text: 'Esto eliminará también todos los exámenes asociados',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#e74c3c',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    this.data.diagnostico = {};
                    this.data.examenes = [];
                    this.mostrarFormExamen = false;
                    this.buscarDx = '';
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Diagnóstico eliminado',
                        timer: 1500,
                        showConfirmButton: false
                    });
                }
            });
        },

        // === GESTIÓN DE EXÁMENES ===
        filtrarExamenes() {
            if (this.buscarExam.length < 2) {
                this.examFiltrados = [];
                return;
            }
            
            const termino = this.buscarExam.toLowerCase();
            this.examFiltrados = this.examenes.filter(exam => 
                exam.nombre.toLowerCase().includes(termino) ||
                exam.categoria.toLowerCase().includes(termino) ||
                exam.codigo.toLowerCase().includes(termino)
            ).slice(0, 8);
        },

        filtrarExamenesRecomendados(codigoDx) {
            const idsRecomendados = this.examenesPorDx[codigoDx] || [];
            if (idsRecomendados.length > 0) {
                this.examFiltrados = this.examenes.filter(exam => 
                    idsRecomendados.includes(exam.id)
                );
                this.mostrarExams = true;
            }
        },

        seleccionarExamen(exam) {
            this.nuevoExam.nombre = exam.nombre;
            this.nuevoExam.tipo = exam.tipo; // ✅ Usa tipo (especialidad correcta)
            this.nuevoExam.cantidad = '1'; // ✅ Resetear a 1
            this.nuevoExam.urgente = exam.urgencia === 'Urgente';
            this.buscarExam = `${exam.codigo} - ${exam.nombre}`;
            this.mostrarExams = false;
            
            console.log('Examen seleccionado:', {
                nombre: exam.nombre,
                tipo: exam.tipo,
                categoria: exam.categoria
            });
        },

        agregarExam() {
            // Validación
            if (!this.nuevoExam.nombre || !this.nuevoExam.cantidad) {
                this.mostrarError('Nombre y cantidad son obligatorios');
                return;
            }
            
            try {
                // Agregar examen
                this.data.examenes.push({ 
                    nombre: this.nuevoExam.nombre,
                    tipo: this.nuevoExam.tipo,
                    cantidad: this.nuevoExam.cantidad, 
                    indicaciones: this.nuevoExam.indicaciones,
                    urgente: this.nuevoExam.urgente
                });
                
                // Limpiar formulario
                this.limpiarFormularioExamen();
                this.mostrarFormExamen = false;
                 
                Swal.fire({
                    icon: 'success',
                    title: 'Examen agregado',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000
                });
            } catch (error) {
                console.error('Error al agregar examen:', error);
                this.mostrarError('Error al agregar examen');
            }
        },

        cancelarAgregarExam() {
            this.limpiarFormularioExamen();
            this.mostrarFormExamen = false;
        },

        limpiarFormularioExamen() {
            this.nuevoExam = { 
                nombre: '', 
                tipo: '',
                cantidad: '1', 
                indicaciones: '',
                urgente: false
            };
            this.buscarExam = '';
        },

        eliminarExamen(index) {
            if (index >= 0 && index < this.data.examenes.length) {
                this.data.examenes.splice(index, 1);
                
                Swal.fire({
                    icon: 'info',
                    title: 'Examen eliminado',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        },

        // === GESTIÓN DE PLANTILLAS ===
aplicarPlantilla() {
    if (!this.plantillaSeleccionada) return;
    
    const plantilla = this.plantillasExamenes.find(p => p.id === this.plantillaSeleccionada);
    if (!plantilla) return;
    
    Swal.fire({
        title: `¿Aplicar plantilla "${plantilla.nombre}"?`,
        text: `Se agregarán ${plantilla.examenes.length} exámenes automáticamente`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, aplicar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            this.procesarPlantilla(plantilla);
        }
    });
},

procesarPlantilla(plantilla) {
    let examenesAgregados = 0;
    
    plantilla.examenes.forEach(plantillaExam => {
        const examen = this.examenes.find(e => e.id === plantillaExam.examenId);
        if (examen) {
            this.data.examenes.push({
                nombre: examen.nombre,
                tipo: examen.tipo, // 🆕 SETEAR ESPECIALIDAD AUTOMÁTICAMENTE
                cantidad: plantillaExam.cantidad,
                indicaciones: plantillaExam.indicaciones,
                urgente: examen.urgencia === 'Urgente'
            });
            examenesAgregados++;
        }
    });
    
    // Limpiar selección
    this.plantillaSeleccionada = '';
    
    Swal.fire({
        icon: 'success',
        title: `¡Plantilla "${plantilla.nombre}" aplicada!`,
        text: `${examenesAgregados} exámenes agregados con especialidades asignadas`,
        timer: 2500,
        showConfirmButton: false
    });
},

        // === GESTIÓN DE FIRMA ===
        limpiarFirma() {
            if (this.signaturePad) {
                this.signaturePad.clear();
            }
        },

        // === VALIDACIÓN ===
        validarFormulario() {
            const errores = [];
            
            if (!this.data.paciente.nombre?.trim()) {
                errores.push('El nombre del paciente es obligatorio');
            }
            
            if (!this.data.paciente.edad) {
                errores.push('La edad del paciente es obligatoria');
            }
            
            if (!this.data.diagnostico.codigo) {
                errores.push('Debe seleccionar un diagnóstico');
            }
            
            if (this.data.examenes.length === 0) {
                errores.push('Debe agregar al menos un examen');
            }
            
            if (!this.data.medico.nombre?.trim()) {
                errores.push('El nombre del médico es obligatorio');
            }
            
            if (this.signaturePad && this.signaturePad.isEmpty()) {
                errores.push('La firma del médico es obligatoria');
            }
            
            if (errores.length > 0) {
                this.mostrarError(errores.join('<br>'));
                return false;
            }
            
            return true;
        },

        // === UTILIDADES ===
        mostrarError(mensaje) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                html: mensaje,
                confirmButtonText: 'Entendido'
            });
        },

        mostrarExito(mensaje) {
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: mensaje,
                timer: 2000,
                showConfirmButton: false
            });
        },

        // === PREVISUALIZACIÓN Y PDF ===
        previsualizarOrden() {
            if (!this.validarFormulario()) return;
            
            Swal.fire({
                title: 'Vista Previa de Orden de Exámenes',
                html: this.generarHTMLPreview(),
                width: 900,
                showCloseButton: true,
                showConfirmButton: false,
                padding: '10px'
            });
        },

        generarHTMLPreview() {
            // Capturar firma
            let firmaHTML = '';
            if (this.signaturePad && !this.signaturePad.isEmpty()) {
                const firmaImg = this.signaturePad.toDataURL('image/png');
                firmaHTML = `<img src="${firmaImg}" style="height: 60px; max-width: 100px;">`;
            }
            
            return `
                <div style="font-family: Arial, sans-serif; padding: 20px; background: white;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h3 style="color: #2c5aa0; margin: 0;">HOSPITAL CENTRAL SAN JOSÉ</h3>
                        <p style="margin: 5px 0; font-size: 12px;">Sistema de Órdenes de Exámenes</p>
                        <p style="margin: 0; font-size: 10px;">Jr. Ancash 1271 - Lima | Tel: 4117700</p>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <h4 style="color: #2c5aa0; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">DATOS DEL PACIENTE</h4>
                        <p><strong>Nombre:</strong> ${this.data.paciente.nombre}</p>
                        <p><strong>Edad:</strong> ${this.data.paciente.edad} años | <strong>Género:</strong> ${this.data.paciente.genero === 'M' ? 'Masculino' : 'Femenino'}</p>
                        <p><strong>Cama:</strong> ${this.data.paciente.cama} | <strong>Sala:</strong> ${this.data.paciente.sala}</p>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <h4 style="color: #2c5aa0; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">DIAGNÓSTICO</h4>
                        <p><strong>${this.data.diagnostico.codigo}</strong> - ${this.data.diagnostico.nombre}</p>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <h4 style="color: #2c5aa0; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">EXÁMENES SOLICITADOS</h4>
                        ${this.data.examenes.map((exam, i) => `
                            <div style="margin-bottom: 10px; padding: 10px; background: #f9f9f9; border-radius: 5px;">
                                <p style="margin: 0; font-weight: bold; color: #333;">
                                    ${i + 1}. ${exam.nombre}
                                    ${exam.urgente ? '<span style="color: #e74c3c; margin-left: 10px;">[URGENTE]</span>' : ''}
                                </p>
                                <p style="margin: 5px 0 0; font-size: 14px;">
                                    <strong>Cantidad:</strong> ${exam.cantidad}
                                    ${exam.tipo ? ` | <strong>Tipo:</strong> ${exam.tipo}` : ''}
                                </p>
                                ${exam.indicaciones ? `<p style="margin: 5px 0 0; font-size: 13px; font-style: italic; color: #666;">${exam.indicaciones}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                    
                    <div style="margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end;">
                        <div>
                            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
                            <p><strong>Médico:</strong> ${this.data.medico.nombre}</p>
                        </div>
                        <div style="text-align: center;">
                            ${firmaHTML}
                            <p style="margin: 5px 0 0; font-size: 12px;">Firma y Sello</p>
                        </div>
                    </div>
                </div>
            `;
        },

        generarPDF() {
            if (!this.validarFormulario()) return;
            
            try {
                if (!window.jspdf?.jsPDF) {
                    throw new Error('jsPDF no está disponible');
                }
                
                const { jsPDF } = window.jspdf;
                // 🆕 CAMBIO A FORMATO A5
                const doc = new jsPDF('portrait', 'mm', 'a5'); // 148 x 210 mm
                
                // 🎨 HEADER COMPACTO
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.text('HOSPITAL CENTRAL SAN JOSÉ', 74, 15, { align: 'center' });
                
                doc.setFontSize(8);
                doc.setFont(undefined, 'normal');
                doc.text('Sistema de Órdenes de Exámenes', 74, 20, { align: 'center' });
                doc.text('Jr. Ancash 1271 - Lima | Tel: 4117700', 74, 24, { align: 'center' });
                
                // Línea separadora
                doc.setLineWidth(0.5);
                doc.line(10, 27, 138, 27);
                
                // 👤 DATOS DEL PACIENTE COMPACTOS
                let y = 35;
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                doc.text('DATOS DEL PACIENTE', 10, y);
                
                y += 6;
                doc.setFontSize(8);
                doc.setFont(undefined, 'normal');
                
                // Información en dos columnas para ahorrar espacio
                doc.text(`Nombre: ${this.data.paciente.nombre}`, 10, y);
                y += 4;
                doc.text(`Edad: ${this.data.paciente.edad} años`, 10, y);
                doc.text(`Género: ${this.data.paciente.genero === 'M' ? 'Masculino' : 'Femenino'}`, 80, y);
                y += 4;
                doc.text(`Cama: ${this.data.paciente.cama}`, 10, y);
                doc.text(`Sala: ${this.data.paciente.sala}`, 80, y);
                
                // Línea separadora
                y += 3;
                doc.setLineWidth(0.3);
                doc.line(10, y, 138, y);
                y += 5;
                
                // 🩺 DIAGNÓSTICO COMPACTO
                y += 10;
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                doc.text('DIAGNÓSTICO', 10, y);
                
                y += 6;
                doc.setFontSize(8);
                doc.setFont(undefined, 'normal');
                const diagnosticoTexto = `${this.data.diagnostico.codigo} - ${this.data.diagnostico.nombre}`;
                const diagnosticoLineas = doc.splitTextToSize(diagnosticoTexto, 128);
                doc.text(diagnosticoLineas, 10, y);
                y += diagnosticoLineas.length * 4;

                
                
                // 🧪 EXÁMENES AGRUPADOS POR ESPECIALIDAD
                y += 8;
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                doc.text('EXÁMENES SOLICITADOS', 10, y);
                y += 6;
                
                // 🆕 AGRUPAR EXÁMENES POR TIPO/ESPECIALIDAD
                const examenesPorTipo = {};
                this.data.examenes.forEach(exam => {
                    const tipo = exam.tipo || 'Otros';
                    if (!examenesPorTipo[tipo]) {
                        examenesPorTipo[tipo] = [];
                    }
                    examenesPorTipo[tipo].push(exam);
                });
                
                // 🆕 ORDEN DE PRIORIDAD PARA MOSTRAR GRUPOS
                const ordenTipos = ['Laboratorio', 'Imagenología', 'Cardiología', 'Neumología', 'Endoscopía', 'Funcional', 'Otros'];
                
                ordenTipos.forEach(tipoOrden => {
                    if (examenesPorTipo[tipoOrden]) {
                        // 📂 TÍTULO DEL GRUPO
                        doc.setFontSize(9);
                        doc.setFont(undefined, 'bold');
                        
                        // Determinar icono según especialidad
                        let icono = '';
                        switch(tipoOrden) {
                            case 'Laboratorio': icono = ''; break;
                            case 'Imagenología': icono = ''; break;
                            case 'Cardiología': icono = ''; break;
                            case 'Neumología': icono = ''; break;
                            case 'Endoscopía': icono = ''; break;
                            case 'Funcional': icono = ''; break;
                            default: icono = '📋'; break;
                        }
                        
                        doc.text(`${icono} ${tipoOrden.toUpperCase()}`, 10, y);
                        y += 5;
                        
                        // 📋 EXÁMENES DEL GRUPO
                        doc.setFontSize(8);
                        doc.setFont(undefined, 'normal');
                        
                        examenesPorTipo[tipoOrden].forEach((exam, index) => {
                            // Nombre del examen con numeración
                            let examText = `  • ${exam.nombre}`;
                            if (exam.urgente) {
                                examText += ' [URGENTE]';
                            }
                            
                            // Dividir texto si es muy largo
                            const examLineas = doc.splitTextToSize(examText, 120);
                            doc.setFont(undefined, 'bold');
                            doc.text(examLineas, 12, y);
                            y += examLineas.length * 4;
                            
                            // Detalles compactos en una línea
                            doc.setFont(undefined, 'normal');
                            let detalles = [];
                            if (exam.cantidad) detalles.push(`Cantidad: ${exam.cantidad}`);
                            if (exam.indicaciones) detalles.push(`Indicaciones: ${exam.indicaciones}`);
                            
                            if (detalles.length > 0) {
                                const detalleTexto = detalles.join(' | ');
                                const detalleLineas = doc.splitTextToSize(detalleTexto, 115);
                                doc.text(detalleLineas, 15, y);
                                y += detalleLineas.length * 3;
                            }
                            
                            y += 2; // Espaciado entre exámenes
                        });
                        
                        y += 3; // Espaciado entre grupos
                    }
                });
                
                // 📅 FOOTER COMPACTO
                const footerY = 180; // Ajustado para A5
                doc.setFontSize(8);
                doc.setFont(undefined, 'normal');
                
                // Información en dos columnas
                doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 10, footerY);
                doc.text(`Hora: ${new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}`, 10, footerY + 4);
                
                // Información del médico
                const medicoLineas = doc.splitTextToSize(`Médico: ${this.data.medico.nombre}`, 60);
                doc.text(medicoLineas, 10, footerY + 10);
                
                // ✍️ FIRMA AJUSTADA PARA A5
                if (this.signaturePad && !this.signaturePad.isEmpty()) {
                    try {
                        const firmaImg = this.signaturePad.toDataURL('image/png');
                        // Tamaño reducido para A5
                        doc.addImage(firmaImg, 'PNG', 90, footerY - 10, 40, 20);
                    } catch (error) {
                        console.warn('No se pudo agregar la firma al PDF:', error);
                    }
                }
                
                // Texto de firma
                doc.setFontSize(7);
                doc.text('Firma y Sello', 110, footerY + 15, { align: 'center' });
                
                // 📄 NOMBRE DE ARCHIVO MEJORADO
                const fechaActual = new Date().toISOString().slice(0,10);
                const nombrePaciente = this.data.paciente.nombre.replace(/\s+/g, '_').substring(0, 20);
                const fileName = `Orden_Examenes_${nombrePaciente}_${fechaActual}_A5.pdf`;
                
                // 💾 DESCARGAR
                doc.save(fileName);
                
                // ✅ NOTIFICACIÓN DE ÉXITO
                Swal.fire({
                    icon: 'success',
                    title: '¡PDF A5 Generado!',
                    html: `
                        <div style="text-align: left;">
                            <p><strong>✅ Formato:</strong> A5 (148x210mm)</p>
                            <p><strong>📂 Agrupación:</strong> Por especialidad</p>
                            <p><strong>📊 Total exámenes:</strong> ${this.data.examenes.length}</p>
                            <p><strong>🏥 Grupos:</strong> ${Object.keys(examenesPorTipo).length}</p>
                        </div>
                    `,
                    timer: 3000,
                    showConfirmButton: false
                });
                
            } catch (error) {
                console.error('Error generando PDF A5:', error);
                this.mostrarError(`No se pudo generar el PDF A5: ${error.message}`);
            }
        },

        // === FUNCIONES DE DESARROLLO ===
        cargarDatosPrueba() {
            const datosSimulados = {
                patientName: 'Carlos Mendoza',
                patientAge: 62,
                gender: 'Masculino',
                bedNumber: '301A',
                specialty: 'Cardiología',
                diagnosis: 'Hipertensión esencial',
                diagnosisCode: 'I10',
                doctor: 'Dr. Roberto Silva'
            };
            
            sessionStorage.setItem('patientData', JSON.stringify(datosSimulados));
            this.cargarDatosPaciente(datosSimulados);
            
            this.mostrarExito('Datos de prueba cargados correctamente');
        },

        exportarDatos() {
            const datos = {
                paciente: this.data.paciente,
                medico: this.data.medico,
                diagnostico: this.data.diagnostico,
                examenes: this.data.examenes,
                fecha: new Date().toISOString()
            };
            
            const dataStr = JSON.stringify(datos, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `orden_examenes_${this.data.paciente.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
        },

        // === FUNCIONES DE LIMPIEZA ===
        limpiarFormulario() {
            Swal.fire({
                title: '¿Limpiar formulario?',
                text: 'Se perderán todos los datos ingresados',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#e74c3c',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, limpiar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    this.resetearFormulario();
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Formulario limpiado',
                        timer: 1000,
                        showConfirmButton: false
                    });
                }
            });
        },

        resetearFormulario() {
            this.data = {
                paciente: { 
                    nombre: '', 
                    edad: '', 
                    genero: '', 
                    cama: '', 
                    sala: '' 
                },
                medico: { 
                    nombre: 'Dr. María González' 
                },
                diagnostico: {},
                examenes: []
            };
            
            this.buscarDx = '';
            this.limpiarFormularioExamen();
            this.mostrarFormExamen = false;
            this.datosDesdeRondas = false;
            
            if (this.signaturePad) {
                this.signaturePad.clear();
            }
        },

        // === DEBUG ===
        debug() {
            console.log('=== DEBUG EXAM ORDERS APP ===');
            console.log('Data:', this.data);
            console.log('Diagnósticos filtrados:', this.dxFiltrados);
            console.log('Exámenes filtrados:', this.examFiltrados);
            console.log('Firma pad:', this.signaturePad);
            console.log('==============================');
        }
    }));
});

/**
 * ===============================================
 * FUNCIONES GLOBALES Y UTILIDADES
 * ===============================================
 */

// Función global para cargar datos de prueba
window.cargarDatosPruebaExamenes = function() {
    const event = new CustomEvent('cargar-datos-prueba-examenes');
    document.dispatchEvent(event);
};

// Manejador de errores global
window.addEventListener('error', function(e) {
    console.error('Error global capturado en exámenes:', e.error);
});

// Función para detectar si las librerías están cargadas
window.verificarLibreriasExamenes = function() {
    const librerias = {
        'Alpine.js': typeof Alpine !== 'undefined',
        'SweetAlert2': typeof Swal !== 'undefined',
        'jsPDF': typeof window.jspdf !== 'undefined',
        'SignaturePad': typeof SignaturePad !== 'undefined'
    };
    
    console.table(librerias);
    return librerias;
};

// Configura los botones de volver para la página de órdenes de exámenes
// Utiliza common_navigation.js para manejar la navegación
function setupBackButtonsForExamOrders() {
    console.log('Configurando botones de volver para órdenes de exámenes');
    
    // Verificar si la función de configuración común está disponible
    if (typeof setupBackButtons === 'function') {
        // Configurar el comportamiento del botón volver
        setupBackButtons(function() {
            // Guardar el borrador actual o estado antes de volver
            console.log('Guardando estado de órdenes de exámenes antes de volver');
            
            // Aquí se podría guardar el estado del formulario si es necesario
            // Por ejemplo: guardarBorradorExamenes();
            
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

// Auto-verificación al cargar
document.addEventListener('DOMContentLoaded', function() {
    // Configurar botones de volver
    setupBackButtonsForExamOrders();
    
    setTimeout(() => {
        const librerias = window.verificarLibreriasExamenes();
        const faltantes = Object.entries(librerias)
            .filter(([nombre, cargada]) => !cargada)
            .map(([nombre]) => nombre);
        
        if (faltantes.length > 0) {
            console.warn('Librerías faltantes para exámenes:', faltantes);
        } else {
            console.log('✅ Todas las librerías cargadas correctamente para exámenes');
        }
    }, 1000);
});

/**
 * ===============================================
 * FIN DEL ARCHIVO
 * ===============================================
 */