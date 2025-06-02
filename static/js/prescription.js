/**
 * ===============================================
 * PRESCRIPTION FORM JAVASCRIPT
 * Hospital San José - Sistema de Prescripción
 * ===============================================
 */

document.addEventListener('alpine:init', () => {
    Alpine.data('prescriptionApp', () => ({
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
            medicamentos: []
        },
        
        // === VARIABLES DE CONTROL ===
        // Diagnóstico
        buscarDx: '',
        mostrarDx: false,
        dxFiltrados: [],
        
        // Medicamentos
        mostrarFormMedicamento: false,
        buscarMed: '',
        mostrarMeds: false,
        medFiltrados: [],
        nuevoMed: { 
            nombre: '', 
            concentracion: '',
            dosis: '', 
            frecuencia: '', 
            duracion: '', 
            via: '',
            indicaciones: '' 
        },
        
        // Firma digital
        signaturePad: null,
        
        // === BASE DE DATOS ===
        // Diagnósticos CIE-10
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
        
        // Medicamentos
        medicamentos: [
            { id: 1, nombre: 'Paracetamol', concentracion: '500mg', categoria: 'Analgésico', via: 'Oral' },
            { id: 2, nombre: 'Ibuprofeno', concentracion: '400mg', categoria: 'Antiinflamatorio', via: 'Oral' },
            { id: 3, nombre: 'Amoxicilina', concentracion: '500mg', categoria: 'Antibiótico', via: 'Oral' },
            { id: 4, nombre: 'Omeprazol', concentracion: '20mg', categoria: 'Protector gástrico', via: 'Oral' },
            { id: 5, nombre: 'Loratadina', concentracion: '10mg', categoria: 'Antialérgico', via: 'Oral' },
            { id: 6, nombre: 'Metformina', concentracion: '850mg', categoria: 'Antidiabético', via: 'Oral' },
            { id: 7, nombre: 'Enalapril', concentracion: '10mg', categoria: 'Antihipertensivo', via: 'Oral' },
            { id: 8, nombre: 'Salbutamol', concentracion: '100mcg', categoria: 'Broncodilatador', via: 'Inhalatoria' },
            { id: 9, nombre: 'Ciprofloxacino', concentracion: '500mg', categoria: 'Antibiótico', via: 'Oral' },
            { id: 10, nombre: 'Ranitidina', concentracion: '150mg', categoria: 'Antiulceroso', via: 'Oral' },
            { id: 11, nombre: 'Diclofenaco', concentracion: '50mg', categoria: 'Antiinflamatorio', via: 'Oral' },
            { id: 12, nombre: 'Simvastatina', concentracion: '20mg', categoria: 'Hipolipemiante', via: 'Oral' },
            { id: 13, nombre: 'Amlodipino', concentracion: '5mg', categoria: 'Antihipertensivo', via: 'Oral' },
            { id: 14, nombre: 'Azitromicina', concentracion: '500mg', categoria: 'Antibiótico', via: 'Oral' },
            { id: 15, nombre: 'Prednisona', concentracion: '20mg', categoria: 'Corticoide', via: 'Oral' }
        ],
        
        // Medicamentos recomendados por diagnóstico
        medicamentosPorDx: {
            'K59.0': [1, 10], // Estreñimiento
            'I10': [7, 13], // Hipertensión
            'E11.9': [6], // Diabetes
            'J06.9': [3, 8, 14], // Infección respiratoria
            'M79.3': [2, 11], // Dolor muscular
            'R50.9': [1, 2], // Fiebre
            'N39.0': [9], // Infección urinaria
            'K30': [4, 10], // Dispepsia
            'A09': [1, 4], // Diarrea
            'H10.9': [5], // Conjuntivitis
            'J44.1': [8, 15], // EPOC
            'G43.9': [1, 2], // Migraña
            'L30.9': [5, 15], // Dermatitis
            'M25.5': [2, 11] // Dolor articular
        },
        
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
                if (!e.target.closest('.med-search')) {
                    this.mostrarMeds = false;
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
            ).slice(0, 10); // Limitar a 10 resultados
        },

        seleccionarDx(dx) {
            this.data.diagnostico = { ...dx };
            this.buscarDx = `${dx.codigo} - ${dx.nombre}`;
            this.mostrarDx = false;
            
            // Mostrar medicamentos recomendados
            this.filtrarMedicamentosRecomendados(dx.codigo);
        },

        eliminarDiagnostico() {
            Swal.fire({
                title: '¿Eliminar diagnóstico?',
                text: 'Esto eliminará también todos los medicamentos asociados',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#e74c3c',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    this.data.diagnostico = {};
                    this.data.medicamentos = [];
                    this.mostrarFormMedicamento = false;
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

        // === GESTIÓN DE MEDICAMENTOS ===
        filtrarMedicamentos() {
            if (this.buscarMed.length < 2) {
                this.medFiltrados = [];
                return;
            }
            
            const termino = this.buscarMed.toLowerCase();
            this.medFiltrados = this.medicamentos.filter(med => 
                med.nombre.toLowerCase().includes(termino) ||
                med.categoria.toLowerCase().includes(termino) ||
                med.concentracion.toLowerCase().includes(termino)
            ).slice(0, 8); // Limitar a 8 resultados
        },

        filtrarMedicamentosRecomendados(codigoDx) {
            const idsRecomendados = this.medicamentosPorDx[codigoDx] || [];
            if (idsRecomendados.length > 0) {
                this.medFiltrados = this.medicamentos.filter(med => 
                    idsRecomendados.includes(med.id)
                );
                this.mostrarMeds = true;
            }
        },

        seleccionarMedicamento(med) {
            this.nuevoMed.nombre = med.nombre;
            this.nuevoMed.concentracion = med.concentracion;
            this.nuevoMed.via = med.via;
            this.buscarMed = `${med.nombre} ${med.concentracion}`;
            this.mostrarMeds = false;
        },

        agregarMed() {
            // Validación
            if (!this.nuevoMed.nombre || !this.nuevoMed.dosis || !this.nuevoMed.frecuencia) {
                this.mostrarError('Nombre, dosis y frecuencia son obligatorios');
                return;
            }
            
            try {
                // Crear nombre completo
                const nombreCompleto = this.nuevoMed.concentracion ? 
                    `${this.nuevoMed.nombre} ${this.nuevoMed.concentracion}` : 
                    this.nuevoMed.nombre;
                
                // Agregar medicamento
                this.data.medicamentos.push({ 
                    nombre: nombreCompleto,
                    dosis: this.nuevoMed.dosis, 
                    frecuencia: this.nuevoMed.frecuencia, 
                    duracion: this.nuevoMed.duracion,
                    via: this.nuevoMed.via,
                    indicaciones: this.nuevoMed.indicaciones
                });
                
                // Limpiar formulario
                this.limpiarFormularioMedicamento();
                this.mostrarFormMedicamento = false;
                 
                Swal.fire({
                    icon: 'success',
                    title: 'Medicamento agregado',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000
                });
            } catch (error) {
                console.error('Error al agregar medicamento:', error);
                this.mostrarError('Error al agregar medicamento');
            }
        },

        cancelarAgregarMed() {
            this.limpiarFormularioMedicamento();
            this.mostrarFormMedicamento = false;
        },

        limpiarFormularioMedicamento() {
            this.nuevoMed = { 
                nombre: '', 
                concentracion: '',
                dosis: '', 
                frecuencia: '', 
                duracion: '', 
                via: '',
                indicaciones: '' 
            };
            this.buscarMed = '';
        },

        eliminarMedicamento(index) {
            if (index >= 0 && index < this.data.medicamentos.length) {
                this.data.medicamentos.splice(index, 1);
                
                Swal.fire({
                    icon: 'info',
                    title: 'Medicamento eliminado',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
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
            
            if (this.data.medicamentos.length === 0) {
                errores.push('Debe agregar al menos un medicamento');
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

        // === PREVISUALIZACIÓN ===
        previsualizarReceta() {
            if (!this.validarFormulario()) return;
            
            Swal.fire({
                title: 'Vista Previa de Receta (A5 Apaisado)',
                html: this.generarHTMLPreview(),
                width: 900,
                showCloseButton: true,
                showConfirmButton: false,
                padding: '10px',
                customClass: {
                    htmlContainer: 'prescription-preview'
                }
            });
        },

        generarHTMLPreview() {
            // Capturar firma
            let firmaHTML = '';
            if (this.signaturePad && !this.signaturePad.isEmpty()) {
                const firmaImg = this.signaturePad.toDataURL('image/png');
                firmaHTML = `<img src="${firmaImg}" style="height: 60px; max-width: 100px;">`;
            }
            
            // Función para generar copia
            const generarCopia = (titulo) => `
                <div style="width: 48%; position: relative; font-family: Arial, sans-serif; padding: 15px 10px 10px; background-color: white;">
                    <div style="position: absolute; top: 5px; left: 5px; font-weight: bold; font-size: 14px; color: #000;">
                        ${titulo}
                    </div>
                    
                    <div style="text-align: center; margin-bottom: 15px; padding-top: 10px;">
                        <h3 style="color: #000; margin: 0; font-size: 16px; font-weight: bold;">HOSPITAL CENTRAL SAN JOSÉ</h3>
                        <p style="margin: 3px 0; font-size: 10px;">Sistema de Prescripción Digital</p>
                        <p style="margin: 0; font-size: 9px;">Jr. Ancash 1271 - Lima | Tel: 4117700</p>
                    </div>
                    
                    <div style="margin-bottom: 12px;">
                        <h4 style="color: #000; margin: 0 0 5px 0; font-size: 13px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 3px;">DATOS DEL PACIENTE</h4>
                        <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
                            <tr><td style="padding: 2px 0;"><strong>Nombre:</strong> ${this.data.paciente.nombre}</td></tr>
                            <tr>
                                <td style="padding: 2px 0;"><strong>Edad:</strong> ${this.data.paciente.edad} años</td>
                                <td style="padding: 2px 0; text-align: right;"><strong>Género:</strong> ${this.data.paciente.genero === 'M' ? 'M' : this.data.paciente.genero === 'F' ? 'F' : 'NE'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 2px 0;"><strong>Cama:</strong> ${this.data.paciente.cama}</td>
                                <td style="padding: 2px 0; text-align: right;"><strong>Sala:</strong> ${this.data.paciente.sala}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="margin-bottom: 12px;">
                        <h4 style="color: #000; margin: 0 0 5px 0; font-size: 13px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 3px;">DIAGNÓSTICO</h4>
                        <p style="margin: 2px 0; font-size: 11px;"><strong>${this.data.diagnostico.codigo}</strong> - ${this.data.diagnostico.nombre}</p>
                    </div>
                    
                    <div style="margin-bottom: 12px;">
                        <h4 style="color: #000; margin: 0 0 5px 0; font-size: 13px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 3px;">MEDICAMENTOS PRESCRITOS</h4>
                        ${this.data.medicamentos.map((med, i) => `
                            <div style="margin-bottom: 8px; font-size: 11px;">
                                <p style="margin: 0; font-weight: bold;">${i + 1}. ${med.nombre}</p>
                                <p style="margin: 2px 0 0; font-size: 10px; margin-left: 12px;">
                                    ${med.dosis}${med.frecuencia ? ` - ${med.frecuencia}` : ''}${med.duracion ? ` - ${med.duracion}` : ''}${med.via ? ` - Vía ${med.via}` : ''}
                                </p>
                                ${med.indicaciones ? `<p style="margin: 2px 0 0; font-size: 9px; font-style: italic; margin-left: 12px; color: #555;">${med.indicaciones}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                    
                    <div style="margin-top: auto; font-size: 10px; position: absolute; bottom: 10px; width: calc(100% - 20px);">
                        <table style="width: 100%;">
                            <tr>
                                <td style="vertical-align: bottom;">
                                    <p style="margin: 0;"><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
                                    <p style="margin: 3px 0 0;"><strong>Médico:</strong> ${this.data.medico.nombre}</p>
                                </td>
                                <td style="text-align: right; vertical-align: bottom;">
                                    <div style="display: inline-block; margin-bottom: 5px;">${firmaHTML}</div>
                                    <p style="text-align: center; margin: 0; font-size: 9px;">Firma y Sello</p>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            `;
            
            return `
                <div style="display: flex; justify-content: space-between; width: 100%; border: 1px solid #ccc; background: #fff; padding: 0; box-shadow: 0 2px 5px rgba(0,0,0,0.1); overflow: hidden;">
                    ${generarCopia('ORIGINAL')}
                    <div style="width: 1px; background-color: #000; margin: 0;"></div>
                    ${generarCopia('DUPLICADO')}
                </div>
            `;
        },

        // === GENERACIÓN DE PDF ===
        generarPDF() {
            if (!this.validarFormulario()) return;
            
            try {
                if (!window.jspdf?.jsPDF) {
                    throw new Error('jsPDF no está disponible');
                }
                
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({
                    orientation: 'landscape',
                    unit: 'mm',
                    format: 'a5'
                });
                
                const pageWidth = 210;
                const halfWidth = pageWidth / 2;
                const margin = 5;
                
                // Función para generar copia en PDF
                const generarCopiaPDF = (startX, titulo) => {
                    // Título
                    doc.setFontSize(10);
                    doc.setFont(undefined, 'bold');
                    doc.text(titulo, startX + (halfWidth/2), 10, { align: 'center' });
                    
                    // Header
                    doc.setFontSize(12);
                    doc.text('HOSPITAL CENTRAL SAN JOSÉ', startX + (halfWidth/2), 15, { align: 'center' });
                    
                    doc.setFontSize(7);
                    doc.setFont(undefined, 'normal');
                    doc.text('Sistema de Prescripción Digital', startX + (halfWidth/2), 20, { align: 'center' });
                    doc.text('Jr. Ancash 1271 - Lima | Tel: 4117700', startX + (halfWidth/2), 24, { align: 'center' });
                    
                    // Datos del paciente
                    let y = 30;
                    doc.setFontSize(9);
                    doc.setFont(undefined, 'bold');
                    doc.text('DATOS DEL PACIENTE', startX + margin, y);
                    
                    y += 5;
                    doc.setFontSize(7);
                    doc.setFont(undefined, 'normal');
                    doc.text(`Nombre: ${this.data.paciente.nombre}`, startX + margin, y);
                    y += 4;
                    doc.text(`Edad: ${this.data.paciente.edad} años`, startX + margin, y);
                    doc.text(`Género: ${this.data.paciente.genero === 'M' ? 'M' : this.data.paciente.genero === 'F' ? 'F' : 'NE'}`, startX + halfWidth - 25, y);
                    y += 4;
                    doc.text(`Cama: ${this.data.paciente.cama}`, startX + margin, y);
                    doc.text(`Sala: ${this.data.paciente.sala}`, startX + halfWidth - 25, y);
                    
                    // Diagnóstico
                    y += 7;
                    doc.setFontSize(9);
                    doc.setFont(undefined, 'bold');
                    doc.text('DIAGNÓSTICO', startX + margin, y);
                    
                    y += 5;
                    doc.setFontSize(7);
                    doc.setFont(undefined, 'normal');
                    doc.text(`${this.data.diagnostico.codigo} - ${this.data.diagnostico.nombre}`, startX + margin, y);
                    
                    // Medicamentos
                    y += 7;
                    doc.setFontSize(9);
                    doc.setFont(undefined, 'bold');
                    doc.text('MEDICAMENTOS PRESCRITOS', startX + margin, y);
                    
                    y += 5;
                    doc.setFontSize(7);
                    
                    this.data.medicamentos.forEach((med, i) => {
                        doc.setFont(undefined, 'bold');
                        doc.text(`${i + 1}. ${med.nombre}`, startX + margin, y);
                        y += 4;
                        
                        doc.setFont(undefined, 'normal');
                        let dosisTexto = med.dosis;
                        if (med.frecuencia) dosisTexto += ` - ${med.frecuencia}`;
                        if (med.duracion) dosisTexto += ` - ${med.duracion}`;
                        if (med.via) dosisTexto += ` - Vía ${med.via}`;
                        
                        // Dividir texto largo
                        const textoLineas = doc.splitTextToSize(dosisTexto, halfWidth - 15);
                        doc.text(textoLineas, startX + margin + 3, y);
                        y += textoLineas.length * 3;
                        
                        if (med.indicaciones) {
                            y += 3;
                            doc.setFont(undefined, 'italic');
                            const indicacionesLineas = doc.splitTextToSize(med.indicaciones, halfWidth - 15);
                            doc.text(indicacionesLineas, startX + margin + 3, y);
                            y += indicacionesLineas.length * 3;
                        }
                        
                        y += 3;
                    });
                    
                    // Footer
                    const footerY = 125;
                    doc.setFontSize(7);
                    doc.setFont(undefined, 'normal');
                    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, startX + margin, footerY);
                    doc.text(`Médico: ${this.data.medico.nombre}`, startX + margin, footerY + 4);
                    
                    // Agregar firma
                    if (this.signaturePad && !this.signaturePad.isEmpty()) {
                        try {
                            const firmaImg = this.signaturePad.toDataURL('image/png');
                            doc.addImage(firmaImg, 'PNG', startX + halfWidth - 45, footerY - 5, 40, 20);
                        } catch (error) {
                            console.warn('No se pudo agregar la firma al PDF:', error);
                        }
                    }
                    
                    doc.text('Firma y Sello', startX + halfWidth - 25, footerY + 18, { align: 'center' });
                };
                
                // Línea divisoria
                doc.setDrawColor(200, 200, 200);
                doc.line(pageWidth/2, 5, pageWidth/2, 143);
                
                // Generar copias
                generarCopiaPDF(0, 'ORIGINAL');
                generarCopiaPDF(pageWidth/2, 'DUPLICADO');
                
                // Descargar
                const fileName = `Receta_${this.data.paciente.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`;
                doc.save(fileName);
                
                Swal.fire({
                    icon: 'success',
                    title: '¡PDF Generado!',
                    text: 'La receta se ha descargado correctamente',
                    timer: 2000,
                    showConfirmButton: false
                });
                
            } catch (error) {
                console.error('Error generando PDF:', error);
                this.mostrarError('No se pudo generar el PDF. Verifique que todas las librerías estén cargadas.');
            }
        },

        // === UTILIDADES ===
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
                medicamentos: []
            };
            
            this.buscarDx = '';
            this.limpiarFormularioMedicamento();
            this.mostrarFormMedicamento = false;
            this.datosDesdeRondas = false;
            
            if (this.signaturePad) {
                this.signaturePad.clear();
            }
        },

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

        mostrarInfo(mensaje) {
            Swal.fire({
                icon: 'info',
                title: 'Información',
                text: mensaje,
                confirmButtonText: 'Entendido'
            });
        },

        // === FUNCIONES DE DESARROLLO ===
        cargarDatosPrueba() {
            const datosSimulados = {
                patientName: 'Ana López Martínez',
                patientAge: 45,
                gender: 'Femenino',
                bedNumber: '102E',
                specialty: 'Urología',
                diagnosis: 'Infección urinaria',
                diagnosisCode: 'N39.0',
                doctor: 'Dra. María González'
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
                medicamentos: this.data.medicamentos,
                fecha: new Date().toISOString()
            };
            
            const dataStr = JSON.stringify(datos, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `receta_${this.data.paciente.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
        },

        // === DEBUG ===
        debug() {
            console.log('=== DEBUG PRESCRIPTION APP ===');
            console.log('Data:', this.data);
            console.log('Diagnósticos filtrados:', this.dxFiltrados);
            console.log('Medicamentos filtrados:', this.medFiltrados);
            console.log('Firma pad:', this.signaturePad);
            console.log('===============================');
        }
    }));
});

/**
 * ===============================================
 * FUNCIONES GLOBALES Y UTILIDADES
 * ===============================================
 */

// Función global para cargar datos de prueba (accesible desde consola)
window.cargarDatosPrueba = function() {
    const event = new CustomEvent('cargar-datos-prueba');
    document.dispatchEvent(event);
};

// Manejador de errores global
window.addEventListener('error', function(e) {
    console.error('Error global capturado:', e.error);
});

// Función para detectar si las librerías están cargadas
window.verificarLibrerias = function() {
    const librerias = {
        'Alpine.js': typeof Alpine !== 'undefined',
        'SweetAlert2': typeof Swal !== 'undefined',
        'jsPDF': typeof window.jspdf !== 'undefined',
        'SignaturePad': typeof SignaturePad !== 'undefined'
    };
    
    console.table(librerias);
    return librerias;
};

// Configura los botones de volver para la página de prescripción
// Utiliza common_navigation.js para manejar la navegación
function setupBackButtonsForPrescription() {
    console.log('Configurando botones de volver para prescripción');
    
    // Verificar si la función de configuración común está disponible
    if (typeof setupBackButtons === 'function') {
        // Configurar el comportamiento del botón volver
        setupBackButtons(function() {
            // Guardar el borrador actual o estado antes de volver
            console.log('Guardando estado de prescripción antes de volver');
            
            // Aquí se podría guardar el estado del formulario si es necesario
            // Por ejemplo: guardarBorradorPrescripcion();
            
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
    setupBackButtonsForPrescription();
    
    setTimeout(() => {
        const librerias = window.verificarLibrerias();
        const faltantes = Object.entries(librerias)
            .filter(([nombre, cargada]) => !cargada)
            .map(([nombre]) => nombre);
        
        if (faltantes.length > 0) {
            console.warn('Librerías faltantes:', faltantes);
        } else {
            console.log('✅ Todas las librerías cargadas correctamente');
        }
    }, 1000);
});

/**
 * ===============================================
 * FIN DEL ARCHIVO
 * ===============================================
 */