/**
 * AFILIACIÓN JS - CLAUDE DEV REVOLUTION
 * Sistema Hospitalario - Alan Cairampoma
 * Mejor que Cursor y Windsurf
 */

// ===== CLASE PRINCIPAL SIGUIENDO TU PATRÓN =====
class AfiliacionModule extends MedicalModule {
    constructor() {
        super('Afiliacion', {
            apiEndpoint: '/api/afiliacion',
            debug: true
        });
        
        // Variables específicas del módulo
        this.currentStep = 1;
        this.totalSteps = 4;
        this.pacienteData = {};
        this.isSubmitting = false;
        
        // Variables para edición
        this.modoEdicion = false;
        this.pacienteId = null;
        
        // 🔥 DEBUG INICIAL
        console.log(`🎯 CONSTRUCTOR - Paso inicial: ${this.currentStep}, Total: ${this.totalSteps}`);
    }
    
    // ===== SETUP PRINCIPAL =====
    setupEventListeners() {
        this.log('🔧 Configurando event listeners...');
        
        this.setupNavegacionPasos();
        this.setupValidacionesTiempoReal();
        this.setupCamposDinamicos();
        this.setupFormularioEnvio();
        
        this.log('✅ Event listeners configurados');
    }
    
    loadInitialData() {
        this.log('📥 Cargando datos iniciales...');
        
        // ✅ FORZAR OCULTACIÓN DE BOTONES INCORRECTOS AL INICIO
        this.inicializarBotonesNavegacion();
        
        // ✅ DETECCIÓN AUTOMÁTICA MODO EDICIÓN - FIX ESPECÍFICO
        const urlPath = window.location.pathname;
        const editarMatch = urlPath.match(/\/medical\/afiliacion\/editar\/(\d+)/);
        
        if (editarMatch) {
            const pacienteId = parseInt(editarMatch[1]);
            this.log(`🔍 MODO EDICIÓN detectado - Paciente ID: ${pacienteId}`);
            this.modoEdicion = true;
            this.pacienteId = pacienteId;
            // ✅ NO cargar catálogos aquí, se cargan en cargarDatosParaEdicion
            this.cargarDatosParaEdicion(pacienteId);
        } else {
            this.log('📝 MODO CREACIÓN detectado');
            this.modoEdicion = false;
            this.pacienteId = null;
            // ✅ Solo en modo creación cargar catálogos
            this.cargarCatalogosDinamicos();
        }
        
        // Configurar fecha máxima (hoy)
        const fechaNacimiento = document.getElementById('fecha-nacimiento');
        if (fechaNacimiento) {
            fechaNacimiento.max = new Date().toISOString().split('T')[0];
        }
        
        // Inicializar progreso
        this.actualizarProgreso();
        
        this.log('✅ Datos iniciales cargados');
    }
    
    // 🔥 INICIALIZAR BOTONES CORRECTAMENTE
    inicializarBotonesNavegacion() {
        console.log('🔧 Inicializando botones de navegación...');
        
        const btnAnterior = document.getElementById('btn-anterior');
        const btnAfiliar = document.getElementById('btn-afiliar');
        const btnSiguiente = document.getElementById('btn-siguiente');
        
        // FORZAR ESTADO INICIAL CORRECTO - SOLO STEP 1
        if (btnAnterior) {
            btnAnterior.style.display = 'none';
            console.log('❌ Botón Anterior OCULTO inicialmente');
        }
        
        if (btnAfiliar) {
            btnAfiliar.style.display = 'none';
            console.log('❌ Botón Afiliar OCULTO inicialmente');
        }
        
        if (btnSiguiente) {
            btnSiguiente.style.display = 'inline-flex';
            console.log('✅ Botón Siguiente VISIBLE inicialmente');
        }
        
        // 🔥 FORZAR STEP 1 INICIAL
        this.currentStep = 1;
        this.actualizarBotonesNavegacion();
    }
    
    // ✨ CATÁLOGOS DINÁMICOS - ESTRATEGIA DUAL ALAN
    async cargarCatalogosDinamicos() {
        try {
            this.log('📋 Cargando catálogos dinámicos...');
            
            const response = await fetch('/api/afiliacion/catalogos');
            if (!response.ok) {
                throw new Error('Error al cargar catálogos');
            }
            
            const resultado = await response.json();
            if (resultado.success && resultado.data) {
                this.poblarCatalogos(resultado.data);
                this.log('✅ Catálogos cargados exitosamente');
            } else {
                throw new Error('No se pudieron obtener los catálogos');
            }
            
        } catch (error) {
            console.error('❌ Error cargando catálogos:', error);
            this.mostrarCatalogosEstaticos();
        }
    }
    
    poblarCatalogos(catalogos) {
        // Estado Civil
        if (catalogos.estado_civil) {
            this.poblarSelect('estado-civil', catalogos.estado_civil, 'Seleccionar estado civil');
        }
        
        // Ocupaciones
        if (catalogos.ocupaciones) {
            this.poblarSelect('ocupacion', catalogos.ocupaciones, 'Seleccionar ocupación');
        }
        
        // Tipos de Sangre (para Fase 2)
        if (catalogos.tipos_sangre) {
            this.poblarSelectGrupoSanguineo(catalogos.tipos_sangre);
        }
    }
    
    poblarSelect(selectId, elementos, placeholderText) {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        // Limpiar opciones existentes
        select.innerHTML = '';
        
        // Agregar opción por defecto
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = placeholderText;
        select.appendChild(defaultOption);
        
        // Agregar elementos del catálogo
        elementos.forEach(elemento => {
            const option = document.createElement('option');
            option.value = elemento.codigo;
            option.textContent = elemento.nombre;
            
            // Agregar color si está disponible
            if (elemento.color) {
                option.setAttribute('data-color', elemento.color);
            }
            
            select.appendChild(option);
        });
        
        this.log(`📋 ${selectId}: ${elementos.length} elementos cargados`);
    }
    
    poblarSelectGrupoSanguineo(tipos_sangre) {
        const select = document.getElementById('grupo-sanguineo');
        if (!select) return;
        
        // Mantener opción por defecto
        const defaultOption = select.querySelector('option[value=""]');
        select.innerHTML = '';
        if (defaultOption) {
            select.appendChild(defaultOption);
        }
        
        tipos_sangre.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo.codigo;
            option.textContent = tipo.nombre;
            select.appendChild(option);
        });
    }
    
    mostrarCatalogosEstaticos() {
        this.log('⚠️ Usando catálogos estáticos como fallback');
        
        // Estado Civil estático
        const estadoCivil = [
            {codigo: 'SOL', nombre: 'Soltero(a)'},
            {codigo: 'CAS', nombre: 'Casado(a)'},
            {codigo: 'DIV', nombre: 'Divorciado(a)'},
            {codigo: 'VIU', nombre: 'Viudo(a)'},
            {codigo: 'CON', nombre: 'Conviviente'}
        ];
        this.poblarSelect('estado-civil', estadoCivil, 'Seleccionar estado civil');
        
        // Ocupaciones estáticas
        const ocupaciones = [
            {codigo: 'ING', nombre: 'Ingeniero(a)'},
            {codigo: 'MED', nombre: 'Médico(a)'},
            {codigo: 'ABO', nombre: 'Abogado(a)'},
            {codigo: 'PRO', nombre: 'Profesor(a)'},
            {codigo: 'COM', nombre: 'Comerciante'},
            {codigo: 'EST', nombre: 'Estudiante'},
            {codigo: 'AMA', nombre: 'Ama de Casa'},
            {codigo: 'OTR', nombre: 'Otros'}
        ];
        this.poblarSelect('ocupacion', ocupaciones, 'Seleccionar ocupación');
    }
    
    // ===== NAVEGACIÓN DE PASOS =====
    setupNavegacionPasos() {
        const btnSiguiente = document.getElementById('btn-siguiente');
        if (btnSiguiente) {
            // ✅ FIX MÓVIL - AGREGAR MULTIPLE EVENT LISTENERS
            btnSiguiente.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔄 CLICK DETECTADO - Siguiente paso');
                this.siguientePaso();
            });
            
            // ✅ FIX ADICIONAL - TOUCH EVENTS PARA MÓVIL
            btnSiguiente.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('📱 TOUCH DETECTADO - Siguiente paso');
                this.siguientePaso();
            });
            
            // ✅ FIX POINTER EVENTS (UNIVERSAL)
            btnSiguiente.addEventListener('pointerup', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔍 POINTER DETECTADO - Siguiente paso');
                this.siguientePaso();
            });
            
            console.log('✅ Botón SIGUIENTE configurado para móvil y web');
        }
        
        const btnAnterior = document.getElementById('btn-anterior');
        if (btnAnterior) {
            btnAnterior.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.anteriorPaso();
            });
            
            // ✅ FIX ADICIONAL - TOUCH EVENTS PARA MÓVIL
            btnAnterior.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.anteriorPaso();
            });
        }
    }
    
    siguientePaso() {
        console.log(`🔍 === DEBUG SIGUIENTE PASO - INICIO ===`);
        console.log(`🎯 Paso actual: ${this.currentStep}`);
        console.log(`🎯 Total pasos: ${this.totalSteps}`);
        
        // ✅ VERIFICAR VALIDACIÓN ANTES DE CONTINUAR
        const esValido = this.validarPasoActual();
        console.log(`🔍 Validación paso ${this.currentStep}: ${esValido}`);
        
        if (esValido) {
            if (this.currentStep < this.totalSteps) {
                const pasoAnterior = this.currentStep;
                this.currentStep++;
                console.log(`➡️ Cambiando de paso ${pasoAnterior} a ${this.currentStep}`);
                
                this.mostrarPaso(this.currentStep);
                this.actualizarProgreso();
                
                // ✅ DEBUG ADICIONAL PARA MÓVIL
                console.log(`✅ Paso ${this.currentStep} mostrado exitosamente`);
                
                if (this.currentStep === this.totalSteps) {
                    console.log(`🎆 Último paso alcanzado - Generando resumen`);
                    this.generarResumen();
                }
            } else {
                console.log(`⚠️ Ya está en el último paso: ${this.currentStep}`);
            }
        } else {
            console.log(`❌ Validación fallida para paso ${this.currentStep}, no se puede avanzar`);
        }
        
        console.log(`🔍 === DEBUG SIGUIENTE PASO - FIN ===`);
    }
    
    anteriorPaso() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.mostrarPaso(this.currentStep);
            this.actualizarProgreso();
        }
    }
    
    mostrarPaso(stepNumber) {
        // 🔥 DEBUG PASO - CLAUDE DEV FIX
        console.log(`📌 === MOSTRANDO PASO ${stepNumber} ===`);
        console.log(`🔍 Current step: ${this.currentStep}, Target: ${stepNumber}`);
        
        // Ocultar todos los pasos
        for (let i = 1; i <= this.totalSteps; i++) {
            const stepElement = document.getElementById(`step-${i}`);
            if (stepElement) {
                stepElement.classList.add('hidden');
                stepElement.classList.remove('fade-in');
                console.log(`❌ Ocultando paso ${i}`);
            } else {
                console.error(`⚠️ No se encontró elemento step-${i}`);
            }
        }

        // Mostrar paso actual
        const currentStepElement = document.getElementById(`step-${stepNumber}`);
        if (currentStepElement) {
            currentStepElement.classList.remove('hidden');
            currentStepElement.classList.add('fade-in');
            console.log(`✅ Mostrando paso ${stepNumber}`);
            
            // 🔥 VERIFICAR SI REALMENTE ESTÁ VISIBLE
            setTimeout(() => {
                const isVisible = !currentStepElement.classList.contains('hidden');
                console.log(`👀 Paso ${stepNumber} visible: ${isVisible}`);
                console.log(`👀 Clases: ${currentStepElement.className}`);
            }, 100);
            
        } else {
            console.error(`❌ ERROR: No se encontró step-${stepNumber}`);
        }

        // 🔥 ACTUALIZAR BOTONES CON STEPNUMBER CORRECTO
        this.actualizarBotonesNavegacion(stepNumber);
        
        // Actualizar info del paso
        const stepInfo = document.getElementById('step-info');
        if (stepInfo) {
            stepInfo.textContent = `Paso ${stepNumber} de ${this.totalSteps}`;
        }
        
        // 🔥 DEBUG FINAL
        console.log(`🎯 === PASO ${stepNumber} PROCESADO ===`);
    }
    
    actualizarBotonesNavegacion(stepNumber = this.currentStep) {
        const btnAnterior = document.getElementById('btn-anterior');
        const btnSiguiente = document.getElementById('btn-siguiente');
        const btnAfiliar = document.getElementById('btn-afiliar');

        console.log(`🔧 === ACTUALIZANDO BOTONES PARA STEP ${stepNumber} ===`);

        // ✅ BOTÓN ANTERIOR: NUNCA en Step 1, siempre en Steps 2, 3, 4
        if (btnAnterior) {
            if (stepNumber === 1) {
                btnAnterior.style.display = 'none';
                console.log(`⬅️ Step ${stepNumber}: Botón Anterior OCULTO`);
            } else {
                btnAnterior.style.display = 'inline-flex';
                console.log(`⬅️ Step ${stepNumber}: Botón Anterior VISIBLE`);
            }
        }
        
        // ✅ BOTÓN SIGUIENTE: Steps 1, 2, 3 (NO en Step 4)
        if (btnSiguiente) {
            if (stepNumber < this.totalSteps) {
                btnSiguiente.style.display = 'inline-flex';
                console.log(`➡️ Step ${stepNumber}: Botón Siguiente VISIBLE`);
            } else {
                btnSiguiente.style.display = 'none';
                console.log(`➡️ Step ${stepNumber}: Botón Siguiente OCULTO`);
            }
        }
        
        // ✅ BOTÓN GENERAR HC: SOLO Step 4
        if (btnAfiliar) {
            if (stepNumber === this.totalSteps) {
                btnAfiliar.style.display = 'inline-flex';
                btnAfiliar.innerHTML = '<i class="fas fa-user-plus"></i> Generar Historia Clínica';
                console.log(`📝 Step ${stepNumber}: Botón GENERAR HC VISIBLE`);
            } else {
                btnAfiliar.style.display = 'none';
                console.log(`📝 Step ${stepNumber}: Botón GENERAR HC OCULTO`);
            }
        }
        
        console.log(`✅ === BOTONES CONFIGURADOS PARA STEP ${stepNumber} ===`);
    }
    
    actualizarProgreso() {
        for (let i = 1; i <= this.totalSteps; i++) {
            const circle = document.getElementById(`step-${i}-circle`);
            const label = document.querySelector(`.progress-step:nth-child(${i}) .step-label`);
            
            if (circle && label) {
                if (i < this.currentStep) {
                    circle.classList.remove('active');
                    circle.classList.add('completed');
                    circle.innerHTML = '<i class="fas fa-check"></i>';
                    label.classList.remove('active');
                } else if (i === this.currentStep) {
                    circle.classList.remove('completed');
                    circle.classList.add('active');
                    circle.textContent = i;
                    label.classList.add('active');
                } else {
                    circle.classList.remove('active', 'completed');
                    circle.textContent = i;
                    label.classList.remove('active');
                }
            }
        }
    }
    
    // ===== VALIDACIONES =====
    setupValidacionesTiempoReal() {
        const numeroDocumento = document.getElementById('numero-documento');
        const tipoDocumento = document.getElementById('tipo-documento');
        
        if (numeroDocumento && tipoDocumento) {
            tipoDocumento.addEventListener('change', () => {
                this.configurarValidacionDocumento();
            });
            
            numeroDocumento.addEventListener('input', (e) => {
                this.validarDocumentoTiempoReal(e.target.value);
            });
        }
        
        // ✅ SETUP BÚSQUEDA DIAGNÓSTICO CIE-10
        this.setupBusquedaDiagnostico();
    }
    
    // 🩺 BÚSQUEDA DIAGNÓSTICO CIE-10 - CLAUDE DEV FIX
    setupBusquedaDiagnostico() {
        const inputDiagnostico = document.getElementById('diagnostico-buscar');
        const sugerenciasContainer = document.getElementById('diagnosticos-sugerencias');
        
        if (!inputDiagnostico || !sugerenciasContainer) return;
        
        let timeoutId;
        
        inputDiagnostico.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            clearTimeout(timeoutId);
            
            if (query.length < 2) {
                sugerenciasContainer.style.display = 'none';
                return;
            }
            
            timeoutId = setTimeout(() => {
                this.buscarDiagnosticos(query);
            }, 300);
        });
        
        // Cerrar sugerencias al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!inputDiagnostico.contains(e.target) && !sugerenciasContainer.contains(e.target)) {
                sugerenciasContainer.style.display = 'none';
            }
        });
    }
    
    async buscarDiagnosticos(query) {
        try {
            this.log(`🔍 Buscando diagnósticos para: ${query}`);
            
            // ✅ SIMULACIÓN DE DIAGNÓSTICOS CIE-10 COMUNES
            const diagnosticosSimulados = [
                { codigo: 'J44.1', descripcion: 'Enfermedad pulmonar obstructiva crónica con exacerbación aguda' },
                { codigo: 'I10', descripcion: 'Hipertensión esencial (primaria)' },
                { codigo: 'E11.9', descripcion: 'Diabetes mellitus tipo 2 sin complicaciones' },
                { codigo: 'K21.0', descripcion: 'Enfermedad de reflujo gastroesofágico con esofagitis' },
                { codigo: 'M79.3', descripcion: 'Panniculitis, no especificada' },
                { codigo: 'R50.9', descripcion: 'Fiebre, no especificada' },
                { codigo: 'Z51.11', descripcion: 'Encuentro para quimioterapia antineoplásica' },
                { codigo: 'I25.10', descripcion: 'Enfermedad aterosclerótica del corazón, de vaso nativo, sin angina de pecho' }
            ];
            
            // Filtrar diagnósticos que coincidan con la búsqueda
            const resultados = diagnosticosSimulados.filter(d => 
                d.codigo.toLowerCase().includes(query.toLowerCase()) ||
                d.descripcion.toLowerCase().includes(query.toLowerCase())
            );
            
            this.mostrarSugerenciasDiagnostico(resultados.slice(0, 5));
            
        } catch (error) {
            console.error('❌ Error buscando diagnósticos:', error);
            this.mostrarSugerenciasDiagnostico([
                { codigo: 'Z00.00', descripcion: 'Pendiente de evaluación médica' }
            ]);
        }
    }
    
    mostrarSugerenciasDiagnostico(diagnosticos) {
        const sugerenciasContainer = document.getElementById('diagnosticos-sugerencias');
        if (!sugerenciasContainer) return;
        
        if (diagnosticos.length === 0) {
            sugerenciasContainer.style.display = 'none';
            return;
        }
        
        const sugerenciasHTML = diagnosticos.map(d => `
            <div class="sugerencia-item" onclick="window.afiliacionModule.seleccionarDiagnostico('${d.codigo}', '${d.descripcion}')">
                <div class="sugerencia-codigo">${d.codigo}</div>
                <div class="sugerencia-descripcion">${d.descripcion}</div>
            </div>
        `).join('');
        
        sugerenciasContainer.innerHTML = sugerenciasHTML;
        sugerenciasContainer.style.display = 'block';
    }
    
    seleccionarDiagnostico(codigo, descripcion) {
        const inputBuscar = document.getElementById('diagnostico-buscar');
        const inputSeleccionado = document.getElementById('diagnostico-seleccionado');
        const inputCodigo = document.getElementById('diagnostico-codigo');
        const sugerenciasContainer = document.getElementById('diagnosticos-sugerencias');
        
        if (inputBuscar) inputBuscar.value = codigo;
        if (inputSeleccionado) inputSeleccionado.value = `${codigo} - ${descripcion}`;
        if (inputCodigo) inputCodigo.value = codigo;
        if (sugerenciasContainer) sugerenciasContainer.style.display = 'none';
        
        this.log(`✅ Diagnóstico seleccionado: ${codigo} - ${descripcion}`);
    }
    
    configurarValidacionDocumento() {
        const tipo = document.getElementById('tipo-documento').value;
        const numeroInput = document.getElementById('numero-documento');
        
        if (!numeroInput) return;
        
        let maxLength = 15;
        let placeholder = '';
        
        switch(tipo) {
            case 'DNI':
                maxLength = 8;
                placeholder = 'Ej: 12345678';
                break;
            case 'CE':
                maxLength = 12;
                placeholder = 'Ej: 001234567';
                break;
            case 'RUC':
                maxLength = 11;
                placeholder = 'Ej: 12345678901';
                break;
            case 'PAS':
                maxLength = 12;
                placeholder = 'Ej: ABC123456';
                break;
        }
        
        numeroInput.maxLength = maxLength;
        numeroInput.placeholder = placeholder;
    }
    
    validarDocumentoTiempoReal(valor) {
        const tipo = document.getElementById('tipo-documento').value;
        const input = document.getElementById('numero-documento');
        
        let esValido = true;
        
        if (tipo === 'DNI' && valor.length > 0) {
            esValido = /^\d{0,8}$/.test(valor);
        } else if (tipo === 'RUC' && valor.length > 0) {
            esValido = /^\d{0,11}$/.test(valor);
        }
        
        if (input) {
            input.style.borderColor = esValido ? '#e5e7eb' : '#dc2626';
        }
    }
    
    // ===== FORMULARIO Y ENVÍO =====
    // ===== CAMPOS DINÁMICOS - ALERGIAS =====
    setupCamposDinamicos() {
        // Configurar botones de agregar
        this.setupBotonesAgregar();
        
        // Configurar botones de eliminar
        document.addEventListener('click', (e) => {
            if (e.target.closest('.remove-btn')) {
                this.eliminarElemento(e.target.closest('.remove-btn'));
            }
        });
    }
    
    setupBotonesAgregar() {
        // Botón agregar alergia
        const btnAgregarAlergia = document.querySelector('.medical-btn--outline');
        if (btnAgregarAlergia && btnAgregarAlergia.textContent.includes('Alergia')) {
            btnAgregarAlergia.addEventListener('click', (e) => {
                e.preventDefault();
                this.agregarAlergia();
            });
        }
        
        // Botón agregar seguro
        const botones = document.querySelectorAll('.medical-btn--outline');
        botones.forEach(btn => {
            if (btn.textContent.includes('Seguro')) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.agregarSeguro();
                });
            }
        });
    }
    
    agregarAlergia() {
        const container = document.getElementById('alergias-container');
        if (!container) return;
        
        const index = container.children.length;
        const nuevaAlergia = this.crearElementoAlergia(index);
        container.insertAdjacentHTML('beforeend', nuevaAlergia);
        
        this.log('💊 Nueva alergia agregada');
    }
    
    crearElementoAlergia(index) {
        return `
            <div class="dynamic-item" data-index="${index}">
                <button type="button" class="remove-btn">
                    <i class="fas fa-times"></i>
                </button>
                <div class="medical-grid medical-grid--2">
                    <div class="form-group">
                        <label class="form-label">Tipo de Alergia</label>
                        <select class="medical-select alergia-tipo">
                            <option value="">Seleccionar tipo</option>
                            <option value="MEDICAMENTO">Medicamento</option>
                            <option value="ALIMENTO">Alimento</option>
                            <option value="AMBIENTAL">Ambiental</option>
                            <option value="CONTACTO">Contacto</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Descripción</label>
                        <input type="text" class="medical-input alergia-descripcion" 
                               placeholder="Ej: Penicilina, Mariscos">
                    </div>
                </div>
            </div>
        `;
    }
    
    setupFormularioEnvio() {
        const form = document.getElementById('afiliacion-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.procesarAfiliacion();
            });
        }
    }
    
    eliminarElemento(button) {
        const item = button.closest('.dynamic-item');
        if (item) {
            item.style.transform = 'translateX(-100%)';
            item.style.opacity = '0';
            setTimeout(() => item.remove(), 300);
        }
    }
    
    async procesarAfiliacion() {
        if (this.isSubmitting) return;
        
        this.isSubmitting = true;
        const btnAfiliar = document.getElementById('btn-afiliar');
        const originalText = btnAfiliar?.innerHTML;
        
        try {
            // Mostrar loading
            if (btnAfiliar) {
                btnAfiliar.innerHTML = '<span class="spinner"></span> Procesando Afiliación...';
                btnAfiliar.disabled = true;
            }
            
            // Recopilar todos los datos
            const datosCompletos = this.recopilarDatosFormulario();
            
            // Validación final
            if (!this.validarDatosCompletos(datosCompletos)) {
                throw new Error('Datos incompletos o inválidos');
            }
            
            this.log('📤 Enviando datos:', datosCompletos);
            
            // 🔍 DEBUG SETUP FRONTEND - CLAUDE DEV
            console.group('🔍 DEBUG SETUP CLAUDE DEV - FRONTEND');
            console.log('📦 Datos del formulario:', datosCompletos);
            console.log('💊 Alergias encontradas:', datosCompletos.alergias);
            console.log('🎯 Endpoint:', '/api/afiliacion/crear');
            console.groupEnd();
            
            // Enviar a API
            const response = await this.apiCall('/api/afiliacion/crear', {
                method: 'POST',
                body: JSON.stringify(datosCompletos)
            });
            
            this.log('📥 Respuesta recibida:', response);
            
            if (response.success) {
                this.showToast('success', '¡Éxito!', 'Paciente afiliado correctamente usando Técnica Alan');
                
                // Mostrar datos del paciente creado
                if (response.data && response.data.paciente_id) {
                    console.log('✅ Paciente guardado - ID:', response.data.paciente_id);
                }
                
                // Redirigir después de 3 segundos
                setTimeout(() => {
                    window.location.href = '/medical/afiliacion';
                }, 3000);
                
            } else {
                throw new Error(response.message || 'Error en el procesamiento');
            }
            
        } catch (error) {
            console.error('❌ Error en procesarAfiliacion:', error);
            this.showToast('error', 'Error', `Error en afiliación: ${error.message}`);
            
            if (btnAfiliar) {
                btnAfiliar.innerHTML = originalText;
                btnAfiliar.disabled = false;
            }
        } finally {
            this.isSubmitting = false;
        }
    }
    
    // ===== CARGA DE DATOS PARA EDICIÓN - FIX CRÍTICO =====
    async cargarDatosParaEdicion(pacienteId) {
        try {
            this.log(`🔍 Cargando datos para paciente ID: ${pacienteId}`);
            
            // ✅ FIX ESPECÍFICO - Cargar catálogos PRIMERO
            console.log('🔄 Esperando a que se carguen los catálogos...');
            await this.cargarCatalogosDinamicos();
            console.log('✅ Catálogos cargados, esperando renderizado...');
            
            // ✅ ESPERAR EXTRA PARA GARANTIZAR RENDERIZADO DE SELECTS
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const response = await this.apiCall(`/api/afiliacion/paciente/${pacienteId}`);
            
            if (response.success && response.data) {
                console.log('📦 Datos recibidos del backend:', response.data);
                
                // ✅ USAR MÉTODO MEJORADO PARA POBLAR FORMULARIO
                this.poblarFormularioMejorado(response.data);
                this.modoEdicion = true;
                this.pacienteId = pacienteId;
                
                this.showToast('success', 'Datos Cargados', 'Información del paciente recuperada correctamente');
                
            } else {
                throw new Error('Paciente no encontrado');
            }
            
        } catch (error) {
            console.error('❌ Error cargando paciente:', error);
            this.showToast('error', 'Error', 'No se pudieron cargar los datos del paciente');
        }
    }
    
    poblarFormulario(datos) {
        console.log('🔍 Poblando formulario con datos:', datos);
        
        if (datos.paso1) {
            // ✅ FIX ESPECÍFICO - Mapeo correcto del tipo documento
            if (datos.paso1.tipo_documento) {
                console.log('📝 Tipo documento recibido:', datos.paso1.tipo_documento);
                this.setFieldValue('tipo-documento', datos.paso1.tipo_documento);
            }
            
            this.setFieldValue('numero-documento', datos.paso1.numero_documento);
            this.setFieldValue('nombres', datos.paso1.nombres);
            this.setFieldValue('apellidos', datos.paso1.apellidos);
            this.setFieldValue('fecha-nacimiento', datos.paso1.fecha_nacimiento);
            this.setFieldValue('sexo', datos.paso1.sexo);
        }
        
        if (datos.paso3) {
            this.setFieldValue('telefono', datos.paso3.telefono);
            this.setFieldValue('email', datos.paso3.email);
            this.setFieldValue('direccion', datos.paso3.direccion);
            this.setFieldValue('distrito', datos.paso3.distrito);
        }
        
        console.log('✅ Formulario poblado completamente');
    }
    
    setFieldValue(fieldId, value) {
        const field = document.getElementById(fieldId);
        if (field && value !== null && value !== undefined && value !== '') {
            field.value = value;
            console.log(`✅ Campo '${fieldId}' seteado con valor: '${value}'`);
            
            // ✅ TRIGGER CHANGE EVENT PARA VALIDACIONES
            const event = new Event('change', { bubbles: true });
            field.dispatchEvent(event);
            
            // ✅ VISUAL FEEDBACK ESPECÍFICO PARA TIPO DOCUMENTO
            if (fieldId === 'tipo-documento') {
                field.style.borderColor = '#10b981';
                field.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                console.log(`🎯 Tipo documento específicamente configurado: ${value}`);
            }
        } else {
            console.log(`⚠️ Campo '${fieldId}' NO seteado - Element: ${!!field}, Value: '${value}'`);
        }
    }
    
    // ✅ MÉTODO NUEVO - VERIFICACIÓN Y CORRECCIÓN TIPO DOCUMENTO
    verificarYCorregirTipoDocumento(datos) {
        if (!datos.paso1 || !datos.paso1.tipo_documento) return;
        
        const tipoDocSelect = document.getElementById('tipo-documento');
        if (!tipoDocSelect) {
            console.error('❌ No se encontró el select tipo-documento');
            return;
        }
        
        const tipoDocBD = datos.paso1.tipo_documento;
        console.log('🔍 Verificando tipo documento desde BD:', tipoDocBD);
        
        // ✅ MAPEO DE CÓDIGOS BD A VALORES DEL SELECT HTML
        const mapeoTipoDoc = {
            '001': 'DNI',     // BD código 001 → HTML value "DNI"
            '002': 'CE',      // BD código 002 → HTML value "CE"
            '003': 'PAS',     // BD código 003 → HTML value "PAS"
            '004': 'RUC',     // BD código 004 → HTML value "RUC"
            'DNI': 'DNI',     // Ya está en formato HTML
            'CE': 'CE',       // Ya está en formato HTML
            'PAS': 'PAS',     // Ya está en formato HTML
            'RUC': 'RUC'      // Ya está en formato HTML
        };
        
        const valorHTML = mapeoTipoDoc[tipoDocBD];
        
        if (valorHTML) {
            // ✅ VERIFICAR QUE LA OPCIÓN EXISTE EN EL SELECT
            const option = tipoDocSelect.querySelector(`option[value="${valorHTML}"]`);
            if (option) {
                tipoDocSelect.value = valorHTML;
                console.log(`✅ Tipo documento seteado correctamente: ${tipoDocBD} → ${valorHTML}`);
                
                // ✅ VISUAL FEEDBACK
                tipoDocSelect.style.borderColor = '#10b981';
                tipoDocSelect.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                
                // ✅ TRIGGER VALIDACIÓN
                const event = new Event('change', { bubbles: true });
                tipoDocSelect.dispatchEvent(event);
                
            } else {
                console.error(`❌ Opción ${valorHTML} no existe en el select`);
                console.log('🔍 Opciones disponibles:', Array.from(tipoDocSelect.options).map(o => o.value));
            }
        } else {
            console.error(`❌ Tipo documento no mapeado: ${tipoDocBD}`);
        }
    }
    
    // ✅ MÉTODO MEJORADO PARA POBLAR FORMULARIO CON DELAYS PROGRESIVOS
    poblarFormularioMejorado(datos) {
        console.log('🔍 Poblando formulario MEJORADO con datos:', datos);
        
        // ✅ PASO 1: DATOS PERSONALES CON DELAY PROGRESIVO
        if (datos.paso1) {
            // Tipo documento PRIMERO con verificación especial
            if (datos.paso1.tipo_documento) {
                console.log('📋 Configurando tipo documento:', datos.paso1.tipo_documento);
                
                // ✅ USAR MÉTODO ESPECÍFICO PARA TIPO DOCUMENTO
                setTimeout(() => {
                    this.verificarYCorregirTipoDocumento(datos);
                }, 100);
            }
            
            // Otros campos con delay menor
            setTimeout(() => {
                this.setFieldValue('numero-documento', datos.paso1.numero_documento);
                this.setFieldValue('nombres', datos.paso1.nombres);
                this.setFieldValue('apellidos', datos.paso1.apellidos);
                this.setFieldValue('fecha-nacimiento', datos.paso1.fecha_nacimiento);
                this.setFieldValue('sexo', datos.paso1.sexo);
                this.setFieldValue('estado-civil', datos.paso1.estado_civil);
                this.setFieldValue('ocupacion', datos.paso1.ocupacion);
            }, 200);
        }
        
        // ✅ PASO 2: INFORMACIÓN MÉDICA
        if (datos.paso2) {
            setTimeout(() => {
                this.setFieldValue('grupo-sanguineo', datos.paso2.grupo_sanguineo);
                this.setFieldValue('factor-rh', datos.paso2.factor_rh);
                this.setFieldValue('antecedentes', datos.paso2.antecedentes);
            }, 300);
        }
        
        // ✅ PASO 3: CONTACTOS
        if (datos.paso3) {
            setTimeout(() => {
                this.setFieldValue('telefono', datos.paso3.telefono);
                this.setFieldValue('email', datos.paso3.email);
                this.setFieldValue('direccion', datos.paso3.direccion);
                this.setFieldValue('distrito', datos.paso3.distrito);
                this.setFieldValue('contacto-nombre', datos.paso3.contacto_nombre);
                this.setFieldValue('contacto-parentesco', datos.paso3.contacto_parentesco);
                this.setFieldValue('contacto-telefono', datos.paso3.contacto_telefono);
            }, 400);
        }
        
        // ✅ VERIFICACIÓN FINAL DESPUÉS DE TODO
        setTimeout(() => {
            console.log('✅ Formulario poblado COMPLETAMENTE');
            
            // Verificar que tipo documento se configuró correctamente
            const tipoDocSelect = document.getElementById('tipo-documento');
            if (tipoDocSelect && tipoDocSelect.value) {
                console.log('🎯 ÉXITO: Tipo documento final configurado:', tipoDocSelect.value);
            } else {
                console.error('❌ FALLO: Tipo documento NO se configuró');
                // Intentar una vez más como último recurso
                this.verificarYCorregirTipoDocumento(datos);
            }
        }, 600);
    }
    
    // ===== VALIDACIONES DE PASOS - SIMPLIFICADO PARA MÓVIL =====
    validarPasoActual() {
        console.log(`🔍 Validando paso ${this.currentStep}`);
        
        switch (this.currentStep) {
            case 1:
                // SOLO VALIDAR CAMPOS CRÍTICOS
                const tipoDoc = document.getElementById('tipo-documento')?.value;
                const numeroDoc = document.getElementById('numero-documento')?.value;
                const nombres = document.getElementById('nombres')?.value;
                const apellidos = document.getElementById('apellidos')?.value;
                
                console.log(`📋 Campos Step 1:`, {tipoDoc, numeroDoc, nombres, apellidos});
                
                // VALIDACIÓN MÍNIMA - SOLO NOMBRE Y APELLIDO
                if (!nombres || !apellidos) {
                    console.log('❌ Faltan nombres o apellidos');
                    this.showToast('warning', 'Campos Requeridos', 'Complete al menos nombres y apellidos para continuar');
                    return false;
                }
                
                console.log('✅ Step 1 válido');
                return true;
                
            case 2:
            case 3:
            case 4:
                console.log(`✅ Step ${this.currentStep} - Sin validaciones`);
                return true; // ✅ PASOS OPCIONALES
                
            default:
                return false;
        }
    }
    
    validarDatosPersonales() {
        const camposRequeridos = [
            'tipo-documento', 'numero-documento', 'nombres', 
            'apellidos', 'fecha-nacimiento', 'sexo'
        ];

        let esValido = true;
        const camposInvalidos = [];
        
        camposRequeridos.forEach(campo => {
            const elemento = document.getElementById(campo);
            if (!elemento || !elemento.value.trim()) {
                if (elemento) {
                    elemento.style.borderColor = '#dc2626';
                    elemento.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.1)';
                }
                camposInvalidos.push(campo);
                esValido = false;
            } else {
                if (elemento) {
                    elemento.style.borderColor = '#10b981';
                    elemento.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                }
            }
        });

        if (!esValido) {
            this.showToast('warning', 'Campos Requeridos', 
                `Complete los campos obligatorios de la Fase 1. Solo esta fase es requerida según norma MINSA.`);
            
            // Enfocar en el primer campo inválido
            if (camposInvalidos.length > 0) {
                const primerCampo = document.getElementById(camposInvalidos[0]);
                if (primerCampo) {
                    primerCampo.focus();
                }
            }
        } else {
            this.showToast('success', 'Fase 1 Completa', '✅ Datos personales válidos. Las siguientes fases son opcionales.');
        }

        return esValido;
    }
    
    validarDatosCompletos(datos) {
        // 🔥 CLAUDE DEV - Validar con los nombres correctos que usa PostgreSQL
        const esValido = datos.nombres && datos.apellidos && datos.numero_doc && datos.tipo_doc;
        
        this.log('🔍 Validación de datos:', {
            nombres: datos.nombres,
            apellidos: datos.apellidos,
            numero_doc: datos.numero_doc,
            tipo_doc: datos.tipo_doc,
            esValido: esValido
        });
        
        return esValido;
    }
    
    // ===== RECOPILACIÓN DE DATOS CON CÓDIGOS CONVERTIDOS - CLAUDE DEV FIX =====
    recopilarDatosFormulario() {
        // Obtener valores originales
        const tipoDocOriginal = this.getValueById('tipo-documento');
        const sexoOriginal = this.getValueById('sexo');
        const distritoOriginal = this.getValueById('distrito');
        const parentescoOriginal = this.getValueById('contacto-parentesco');
        
        // 🔥 CONVERTIR CÓDIGOS DIRECTAMENTE EN FRONTEND
        const tipoDocCodigo = this.convertirTipoDocumento(tipoDocOriginal);
        const sexoCodigo = this.convertirSexo(sexoOriginal);
        const distritoCodigo = this.convertirDistrito(distritoOriginal);
        const parentescoCodigo = this.convertirParentesco(parentescoOriginal);
        
        const datos = {
            // 🔥 CÓDIGOS DE 3 DÍGITOS SEGÚN adm_elemento
            tipo_doc: tipoDocCodigo,           // '001', '002', '003'
            numero_doc: this.getValueById('numero-documento'),
            nombres: this.getValueById('nombres'),
            apellidos: this.getValueById('apellidos'),
            fecha_nacimiento: this.getValueById('fecha-nacimiento'),
            sexo: sexoCodigo,                  // 'M', 'F'
            estado_civil: this.getValueById('estado-civil'),
            ocupacion: this.getValueById('ocupacion'),
            
            // 🩺 DIAGNÓSTICO - CAPTURAR CORRECTAMENTE
            diagnostico_codigo: this.getValueById('diagnostico-codigo'),
            diagnostico_texto: this.getValueById('diagnostico-seleccionado'),
            diagnosis: this.getValueById('diagnostico-seleccionado') || 'Pendiente de evaluación',
            
            // Información médica
            tipo_sangre: this.getValueById('grupo-sanguineo'),
            factor_rh: this.getValueById('factor-rh'),
            antecedentes_medicos: this.getValueById('antecedentes'),
            medicamentos_actuales: '', // Campo requerido por PostgreSQL
            cirugias_previas: '',      // Campo requerido por PostgreSQL
            observaciones_especiales: '', // Campo requerido por PostgreSQL
            
            // Contacto
            telefono: this.getValueById('telefono'),
            email: this.getValueById('email'),
            direccion: this.getValueById('direccion'),
            distrito: distritoCodigo,          // '01', '02', '99'
            
            // Seguro (opcional)
            seguro_id: '',
            numero_seguro: '',
            
            // Contacto de emergencia
            contacto_emergencia: {
                nombre: this.getValueById('contacto-nombre'),
                parentesco: parentescoOriginal,
                parentesco_codigo: parentescoCodigo,
                telefono_principal: this.getValueById('contacto-telefono'),
                telefono_alternativo: '',
                direccion: ''
            },
            
            // Hospital ID por defecto
            hospital_id: 1,
            usuario_creacion: 1,
            
            // 💊 ALERGIAS DINÁMICAS
            alergias: this.obtenerAlergias(),
            
            // 🔍 DEBUG INFO - CLAUDE DEV
            _debug_conversiones: {
                tipo_doc_original: tipoDocOriginal,
                tipo_doc_codigo: tipoDocCodigo,
                sexo_original: sexoOriginal,
                sexo_codigo: sexoCodigo,
                distrito_original: distritoOriginal,
                distrito_codigo: distritoCodigo,
                parentesco_original: parentescoOriginal,
                parentesco_codigo: parentescoCodigo
            }
        };
        
        // 🔥 CLAUDE DEV - LOGGING DETALLADO PARA DEBUG
        this.log('📦 === DATOS COMPLETOS RECOPILADOS ===');
        this.log('🔍 Datos originales capturados:', {
            tipoDocOriginal,
            sexoOriginal,
            distritoOriginal,
            parentescoOriginal
        });
        this.log('🔄 Códigos convertidos:', {
            tipoDocCodigo,
            sexoCodigo,
            distritoCodigo,
            parentescoCodigo
        });
        this.log('📋 Objeto final a enviar:', datos);
        this.log('✅ Campos críticos:', {
            nombres: datos.nombres,
            apellidos: datos.apellidos,
            numero_doc: datos.numero_doc,
            tipo_doc: datos.tipo_doc
        });
        
        return datos;
    }
    
    obtenerAlergias() {
        const alergias = [];
        const items = document.querySelectorAll('#alergias-container .dynamic-item');
        
        items.forEach(item => {
            const tipo = item.querySelector('.alergia-tipo')?.value;
            const descripcion = item.querySelector('.alergia-descripcion')?.value;
            
            if (tipo && descripcion) {
                alergias.push({ tipo, descripcion });
            }
        });
        
        this.log(`💊 Recolectadas ${alergias.length} alergias:`, alergias);
        return alergias;
    }
    
    // ===== GENERACIÓN DE RESUMEN =====
    generarResumen() {
        const resumenContainer = document.getElementById('resumen-datos');
        if (!resumenContainer) return;
        
        // 🔥 RECOPILAR DATOS REALES DEL FORMULARIO
        const datos = this.recopilarDatosFormulario();
        
        console.log('🔍 Datos recopilados para resumen:', datos);
        
        const resumenHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                <div>
                    <h3 style="color: #2563eb; margin-bottom: 12px;">📋 Datos Personales</h3>
                    <p><strong>Documento:</strong> ${this.mapearTipoDocumento(datos.tipo_doc)} - ${datos.numero_doc || 'No especificado'}</p>
                    <p><strong>Nombres:</strong> ${datos.nombres || 'No especificado'} ${datos.apellidos || ''}</p>
                    <p><strong>Fecha Nacimiento:</strong> ${datos.fecha_nacimiento || 'No especificada'}</p>
                    <p><strong>Sexo:</strong> ${datos.sexo === 'M' ? 'Masculino' : datos.sexo === 'F' ? 'Femenino' : 'No especificado'}</p>
                    <p><strong>Estado Civil:</strong> ${datos.estado_civil || 'No especificado'}</p>
                    <p><strong>Ocupación:</strong> ${datos.ocupacion || 'No especificada'}</p>
                </div>
                
                <div>
                    <h3 style="color: #2563eb; margin-bottom: 12px;">📞 Contacto</h3>
                    <p><strong>Teléfono:</strong> ${datos.telefono || 'No especificado'}</p>
                    <p><strong>Email:</strong> ${datos.email || 'No especificado'}</p>
                    <p><strong>Dirección:</strong> ${datos.direccion || 'No especificada'}</p>
                    <p><strong>Distrito:</strong> ${this.mapearDistrito(datos.distrito) || 'No especificado'}</p>
                </div>
            </div>
            
            <div style="margin-top: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                <div>
                    <h3 style="color: #e74c3c; margin-bottom: 12px;">🩺 Información Médica</h3>
                    <p><strong>Grupo Sanguíneo:</strong> ${datos.tipo_sangre || 'No especificado'}</p>
                    <p><strong>Factor RH:</strong> ${datos.factor_rh || 'No especificado'}</p>
                    <p><strong>Diagnóstico:</strong> ${datos.diagnostico_texto || 'Pendiente de evaluación'}</p>
                    <p><strong>Alergias:</strong> ${datos.alergias && datos.alergias.length > 0 ? datos.alergias.map(a => a.descripcion).join(', ') : 'Ninguna registrada'}</p>
                </div>
                
                <div>
                    <h3 style="color: #f39c12; margin-bottom: 12px;">📞 Contacto Emergencia</h3>
                    <p><strong>Nombre:</strong> ${datos.contacto_emergencia?.nombre || 'No especificado'}</p>
                    <p><strong>Parentesco:</strong> ${datos.contacto_emergencia?.parentesco || 'No especificado'}</p>
                    <p><strong>Teléfono:</strong> ${datos.contacto_emergencia?.telefono_principal || 'No especificado'}</p>
                </div>
            </div>
            
            ${datos.antecedentes_medicos ? `
                <div style="margin-top: 24px;">
                    <h3 style="color: #9b59b6; margin-bottom: 12px;">📄 Antecedentes Médicos</h3>
                    <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; border-left: 4px solid #9b59b6;">
                        <p>${datos.antecedentes_medicos}</p>
                    </div>
                </div>
            ` : ''}
        `;
        
        resumenContainer.innerHTML = resumenHTML;
    }
    
    // 🔥 FUNCIONES AUXILIARES PARA MAPEAR DATOS
    mapearTipoDocumento(codigo) {
        const mapeo = {
            '001': 'DNI',
            '002': 'CE',
            '003': 'PAS',
            '004': 'RUC'
        };
        return mapeo[codigo] || codigo;
    }
    
    mapearDistrito(codigo) {
        const mapeo = {
            '01': 'Lima',
            '02': 'Miraflores',
            '03': 'San Isidro',
            '04': 'Surco',
            '05': 'La Molina',
            '06': 'San Borja',
            '07': 'Callao',
            '99': 'Otros'
        };
        return mapeo[codigo] || codigo;
    }
    
    // ===== UTILIDADES =====
    getValueById(id) {
        const element = document.getElementById(id);
        return element ? element.value.trim() : '';
    }
    
    getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
    
    // 🔥 FUNCIONES DE CONVERSIÓN DE CÓDIGOS - CLAUDE DEV
    convertirTipoDocumento(tipoOriginal) {
        const conversiones = {
            'DNI': '001',   // Código de 3 dígitos según adm_elemento
            'CE': '002',    // Carnet de Extranjería 
            'CEX': '002',   // Alias para CE
            'PAS': '003',   // Pasaporte
            'PASAPORTE': '003', // Alias para PAS
            'RUC': '004',   // RUC
            'CI': '005'     // Cédula (si existe)
        };
        return conversiones[tipoOriginal] || '001'; // Default DNI
    }
    
    convertirSexo(sexoOriginal) {
        // Enviar directamente como M/F según base de datos
        return sexoOriginal || 'M'; // Default Masculino
    }
    
    convertirDistrito(distritoOriginal) {
        const conversiones = {
            'LIMA': '01',
            'MIRAFLORES': '02',
            'SAN_ISIDRO': '03',
            'SURCO': '04',
            'LA_MOLINA': '05',
            'SAN_BORJA': '06',
            'CALLAO': '07',
            'PUEBLO_LIBRE': '08',
            'JESUS_MARIA': '09',
            'LINCE': '10',
            'MAGDALENA': '11',
            'SAN_MIGUEL': '12',
            'BREÑA': '13',
            'RIMAC': '14',
            'CERCADO': '15'
        };
        return conversiones[distritoOriginal] || '99'; // Default OTROS
    }
    
    convertirParentesco(parentescoOriginal) {
        const conversiones = {
            'PADRE': '01',
            'MADRE': '02',
            'HERMANO': '03',
            'HERMANA': '04',
            'ESPOSO': '05',
            'ESPOSA': '06',
            'HIJO': '07',
            'HIJA': '08'
        };
        return conversiones[parentescoOriginal] || '99'; // Default OTROS
    }
    
    apiCall(endpoint, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        const baseUrl = window.location.origin;
        
        return fetch(`${baseUrl}${endpoint}`, finalOptions)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            });
    }
}

// ===== FUNCIONES GLOBALES =====
function eliminarElemento(button) {
    if (window.afiliacionModule) {
        window.afiliacionModule.eliminarElemento(button);
    }
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏥 Inicializando Módulo de Afiliación - Claude Dev Revolution...');
    
    // Crear instancia global
    window.afiliacionModule = new AfiliacionModule();
    
    // ❌ REMOVIDO ONCLICK DIRECTO - CAUSABA DOBLE EJECUCIÓN
    // El problema era que se ejecutaba 2 veces: addEventListener + onclick
    
    // 🔥 TEST INICIAL DE BOTONES - CLAUDE DEV DEBUG
    setTimeout(() => {
        console.log('🔍 === TEST BOTONES NAVEGACIÓN ===');
        const btnAnterior = document.getElementById('btn-anterior');
        const btnSiguiente = document.getElementById('btn-siguiente');
        const btnAfiliar = document.getElementById('btn-afiliar');
        
        console.log('🔍 Estado inicial botones:');
        console.log(`   - Anterior: ${btnAnterior ? btnAnterior.style.display : 'NO EXISTE'}`);
        console.log(`   - Siguiente: ${btnSiguiente ? btnSiguiente.style.display : 'NO EXISTE'}`);
        console.log(`   - Afiliar: ${btnAfiliar ? btnAfiliar.style.display : 'NO EXISTE'}`);
        console.log(`   - Current Step: ${window.afiliacionModule?.currentStep}`);
        console.log('🔍 === FIN TEST BOTONES ===');
    }, 1000);
    
    console.log('✅ Módulo de Afiliación inicializado correctamente');
});

console.log('🔥 Afiliación JS - Claude Dev Revolution cargado correctamente');

// ===== FUNCIÓN GLOBAL PARA BOTÓN VOLVER - CLAUDE DEV CLEAN =====
function volverALista() {
    // 🔥 CONFIRMACIÓN ELEGANTE CON SWEET ALERT
    Swal.fire({
        title: '¿Salir de Afiliación?',
        text: 'Se perderán los datos no guardados',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c',
        cancelButtonColor: '#6c757d',
        confirmButtonText: '✅ Sí, salir',
        cancelButtonText: '❌ Cancelar',
        customClass: {
            container: 'swal-modern'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // 🚀 NAVEGACIÓN LIMPIA
            console.log('🔙 Navegando a lista de afiliación...');
            window.location.href = '/medical/afiliacion';
        }
    });
}

// 🔥 SISTEMA DE NAVEGACIÓN PROPIO - SIN INTERFERENCIAS
class AfiliacionNavigation {
    constructor() {
        this.setupCleanNavigation();
        console.log('🧭 Sistema de navegación propio inicializado');
    }
    
    setupCleanNavigation() {
        // 🔥 SETUP ESPECÍFICO PARA AFILIACIÓN - SIN CONFLICTOS
        document.addEventListener('DOMContentLoaded', () => {
            this.setupBackButton();
            this.preventNavigationConflicts();
            console.log('✅ Navegación limpia configurada');
        });
    }
    
    setupBackButton() {
        // Buscar botón volver específico
        const backButton = document.querySelector('.btn-back-header');
        if (backButton) {
            // Remover cualquier evento previo
            const newButton = backButton.cloneNode(true);
            backButton.parentNode.replaceChild(newButton, backButton);
            
            // Agregar evento limpio
            newButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                volverALista();
            });
            
            console.log('🔙 Botón volver configurado correctamente');
        }
    }
    
    preventNavigationConflicts() {
        // 🔥 PREVENIR CONFLICTOS CON OTROS SISTEMAS
        
        // Desactivar eventos globales problemáticos
        document.removeEventListener('keydown', this.handleGlobalKeydown);
        
        // Limpiar storage problemático
        try {
            sessionStorage.removeItem('showPatientModalOnReturn');
            sessionStorage.removeItem('currentPatientId');
            sessionStorage.removeItem('currentBedNumber');
            localStorage.removeItem('showPatientModalOnReturn');
        } catch (e) {
            console.warn('⚠️ Error limpiando storage:', e);
        }
        
        console.log('🧹 Conflictos de navegación prevenidos');
    }
    
    handleGlobalKeydown(e) {
        // Manejar teclas globales si es necesario
        if (e.key === 'Escape') {
            // Solo en modo afiliación
            if (window.location.pathname.includes('/afiliacion/')) {
                volverALista();
            }
        }
    }
}

// 🚀 INICIALIZAR NAVEGACIÓN PROPIA
const afiliacionNav = new AfiliacionNavigation();

// ===== 🔥 FUNCIONES PACIENTE EXTERNO - ALAN & CLAUDE DEV =====

/**
 * 🔥 MAPEO DE TIPOS DE DOCUMENTO SEGÚN adm_elemento
 * Frontend → Backend (códigos de BD)
 */
const MAPEO_TIPOS_DOCUMENTO = {
    'DNI': '001',    // DNI → código 001 en adm_elemento
    'CE': '002',     // CE → código 002 en adm_elemento  
    'CEX': '002',    // Alias para CE
    'PAS': '003',    // PAS → código 003 en adm_elemento
    'PASAPORTE': '003', // Alias para PAS
    'RUC': '004'     // RUC → código 004 en adm_elemento
};

/**
 * 📞 CREAR PACIENTE EXTERNO - MODAL POPUP CORREGIDO
 * Envía códigos correctos según adm_elemento
 */
function crearPacienteExterno() {
    const modal = document.createElement('div');
    modal.className = 'modal-externo';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>📞 Registro Paciente Externo (EXT)</h3>
                <span class="close" onclick="cerrarModal()">&times;</span>
            </div>
            
            <div class="modal-body">
                <form id="form-externo">
                    <!-- FILA 1: DOCUMENTO -->
                    <div class="form-row">
                        <div class="form-group">
                            <label>Tipo Documento *</label>
                            <select name="tipoDocumento" required>
                                <option value="">Seleccionar...</option>
                                <option value="DNI">DNI - Documento Nacional</option>
                                <option value="CE">CE - Carnet Extranjería</option>
                                <option value="PAS">PAS - Pasaporte</option>
                                <option value="RUC">RUC - Registro Único</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Número Documento *</label>
                            <input name="numeroDocumento" type="text" required 
                                   placeholder="Ej: 12345678" maxlength="12">
                        </div>
                    </div>
                    
                    <!-- FILA 2: NOMBRES -->
                    <div class="form-row">
                        <div class="form-group">
                            <label>Nombres *</label>
                            <input name="nombres" type="text" required 
                                   placeholder="Ej: Juan Carlos" id="nombres-input">
                        </div>
                        <div class="form-group">
                            <label>Apellidos *</label>
                            <input name="apellidos" type="text" required 
                                   placeholder="Ej: Pérez García" id="apellidos-input">
                        </div>
                    </div>
                    
                    <!-- FILA 3: FECHA Y SEXO -->
                    <div class="form-row">
                        <div class="form-group">
                            <label>Fecha Nacimiento *</label>
                            <input name="fechaNacimiento" type="date" required id="fecha-nacimiento-input">
                        </div>
                        <div class="form-group">
                            <label>Sexo *</label>
                            <select name="sexo" required>
                                <option value="">Seleccionar...</option>
                                <option value="M">Masculino</option>
                                <option value="F">Femenino</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- FILA 4: CONTACTO -->
                    <div class="form-row">
                        <div class="form-group">
                            <label>Teléfono</label>
                            <input name="telefono" type="text" 
                                   placeholder="Ej: 987654321" maxlength="15">
                        </div>
                        <div class="form-group">
                            <label>📧 Email</label>
                            <input name="email" type="email" 
                                   placeholder="Ej: paciente@email.com">
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn-success">
                            💾 Crear Externo (EXT)
                        </button>
                        <button type="button" onclick="cerrarModal()" class="btn-secondary">
                            ❌ Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // ✅ MANEJAR ENVÍO DEL FORMULARIO
    document.getElementById('form-externo').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        
        // 🔥 MAPEO CORREGIDO - ENVIAR CÓDIGOS DE adm_elemento
        const tipoDocFrontend = formData.get('tipoDocumento');
        const tipoDocCodigo = MAPEO_TIPOS_DOCUMENTO[tipoDocFrontend];
        
        if (!tipoDocCodigo) {
            Swal.fire({
                icon: 'error',
                title: 'Tipo de Documento Inválido',
                text: 'Seleccione un tipo de documento válido',
                confirmButtonColor: '#fd79a8'
            });
            return;
        }
        
        const datos = {
            // 🔥 ENVIAR CÓDIGO DE 3 DÍGITOS SEGÚN adm_elemento
            tipoDocumento: tipoDocCodigo,  // '001', '002', '003', '004'
            numeroDocumento: formData.get('numeroDocumento'),
            nombres: formData.get('nombres'),
            apellidos: formData.get('apellidos'),
            fechaNacimiento: formData.get('fechaNacimiento'),
            sexo: formData.get('sexo'),
            telefono: formData.get('telefono') || '',
            email: formData.get('email') || '',
            
            // 🔥 CLAVE: PREFIX DINÁMICO PARA EXTERNO
            tipo_admision: 'EXT'  // ✅ ESTO VA A POSTGRESQL
        };
        
        // ✅ VALIDAR DATOS ANTES DE ENVIAR
        if (!validarDatosExterno(datos)) {
            return;
        }
        
        // ✅ ENVIAR A BACKEND
        await enviarPacienteExterno(datos);
    });
    
    // ✅ CONFIGURAR FECHA MÁXIMA (HOY)
    const fechaInput = document.getElementById('fecha-nacimiento-input');
    if (fechaInput) {
        fechaInput.max = new Date().toISOString().split('T')[0];
    }
    
    // ✅ CERRAR MODAL CON ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            cerrarModal();
        }
    });
    
    // ✅ CERRAR MODAL CLICK FUERA
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            cerrarModal();
        }
    });
}

/**
 * ❌ CERRAR MODAL
 */
function cerrarModal() {
    const modal = document.querySelector('.modal-externo');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => modal.remove(), 300);
    }
}

/**
 * 🔍 VALIDAR DATOS DEL PACIENTE EXTERNO
 */
function validarDatosExterno(datos) {
    // Validar campos requeridos
    if (!datos.tipoDocumento || !datos.numeroDocumento || !datos.nombres || 
        !datos.apellidos || !datos.fechaNacimiento || !datos.sexo) {
        Swal.fire({
            icon: 'error',
            title: 'Campos Requeridos',
            text: 'Por favor complete todos los campos marcados con *',
            confirmButtonColor: '#fd79a8'
        });
        return false;
    }
    
    // Validar formato documento
    const documento = datos.numeroDocumento.trim();
    if (datos.tipoDocumento === '001' && (documento.length !== 8 || !/^\d{8}$/.test(documento))) {
        Swal.fire({
            icon: 'error',
            title: 'DNI Inválido',
            text: 'El DNI debe tener exactamente 8 dígitos',
            confirmButtonColor: '#fd79a8'
        });
        return false;
    }
    
    // Validar fecha nacimiento
    const fechaNac = new Date(datos.fechaNacimiento);
    const hoy = new Date();
    if (fechaNac >= hoy) {
        Swal.fire({
            icon: 'error',
            title: 'Fecha Inválida',
            text: 'La fecha de nacimiento debe ser anterior a hoy',
            confirmButtonColor: '#fd79a8'
        });
        return false;
    }
    
    // Validar edad mínima
    const edad = Math.floor((hoy - fechaNac) / (365.25 * 24 * 60 * 60 * 1000));
    if (edad > 150) {
        Swal.fire({
            icon: 'error',
            title: 'Edad Inválida',
            text: 'Por favor verifique la fecha de nacimiento',
            confirmButtonColor: '#fd79a8'
        });
        return false;
    }
    
    return true;
}

/**
 * 🚀 ENVIAR PACIENTE EXTERNO AL BACKEND
 */
async function enviarPacienteExterno(datos) {
    try {
        // ✅ MOSTRAR LOADING
        Swal.fire({
            title: 'Creando Paciente Externo...',
            text: 'Por favor espere',
            allowOutsideClick: false,
            customClass: {
                container: 'swal-high-z-index'
            },
            didOpen: () => {
                Swal.showLoading();
                // Asegurar z-index alto
                const swalContainer = document.querySelector('.swal2-container');
                if (swalContainer) {
                    swalContainer.style.zIndex = '99999';
                }
            }
        });
        
        console.log('📞 Enviando datos externo:', datos);
        
        const response = await fetch('/api/afiliar-paciente-externo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.jwtToken || ''}`
            },
            body: JSON.stringify(datos)
        });
        
        const result = await response.json();
        
        console.log('💾 Respuesta backend:', result);
        
        if (result.success) {
            // ✅ ÉXITO - PACIENTE EXTERNO CREADO
            await Swal.fire({
                icon: 'success',
                title: '¡Paciente Externo Creado!',
                html: `
                    <div style="text-align: left; margin: 1rem 0;">
                        <p><strong>🏥 Código:</strong> ${result.data.historia_clinica || 'EXT000XXX'}</p>
                        <p><strong>👤 Paciente:</strong> ${datos.nombres} ${datos.apellidos}</p>
                        <p><strong>📞 Tipo:</strong> Externo (Llamada telefónica)</p>
                        <p><strong>ℹ️ Estado:</strong> Listo para programar cita</p>
                    </div>
                `,
                confirmButtonColor: '#00b894',
                confirmButtonText: '🎉 ¡Perfecto!',
                customClass: {
                    container: 'swal-high-z-index'
                }
            });
            
            cerrarModal();
            
            // ✅ RECARGAR LISTA PARA MOSTRAR NUEVO PACIENTE
            if (typeof AfiliacionLista !== 'undefined' && AfiliacionLista.cargarTodos) {
                await AfiliacionLista.cargarTodos();
            } else {
                location.reload();
            }
            
        } else {
            // ❌ ERROR AL CREAR
            await Swal.fire({
                icon: 'error',
                title: 'Error al Crear Paciente',
                text: result.message || 'Error desconocido',
                confirmButtonColor: '#e74c3c',
                customClass: {
                    container: 'swal-high-z-index'
                }
            });
        }
        
    } catch (error) {
        console.error('❌ Error enviando paciente externo:', error);
        
        await Swal.fire({
            icon: 'error',
            title: 'Error de Conexión',
            text: 'No se pudo conectar con el servidor. Verifique su conexión.',
            confirmButtonColor: '#e74c3c',
            customClass: {
                container: 'swal-high-z-index'
            }
        });
    }
}

// ✅ AGREGAR CSS PARA MODAL Y ANIMACIONES
if (!document.getElementById('modal-externo-styles')) {
    const style = document.createElement('style');
    style.id = 'modal-externo-styles';
    style.textContent = `
        .modal-externo {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        }
        
        .modal-externo .modal-content {
            background: white;
            border-radius: 15px;
            padding: 0;
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease;
        }
        
        .modal-externo .modal-header {
            background: linear-gradient(135deg, #2980b9, #3498db);
            color: white;
            padding: 20px 25px;
            border-radius: 15px 15px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-externo .modal-header h3 {
            margin: 0;
            font-size: 1.2rem;
            font-weight: 600;
        }
        
        .modal-externo .modal-header .close {
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 5px;
            border-radius: 50%;
            transition: background 0.3s ease;
        }
        
        .modal-externo .modal-header .close:hover {
            background: rgba(255,255,255,0.2);
        }
        
        .modal-externo .modal-body {
            padding: 25px;
        }
        
        .modal-externo .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .modal-externo .form-group {
            margin-bottom: 15px;
        }
        
        .modal-externo .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #2c3e50;
            font-size: 0.9rem;
        }
        
        .modal-externo .form-group input,
        .modal-externo .form-group select {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            transition: all 0.3s ease;
            background: #f8f9fa;
        }
        
        .modal-externo .form-group input:focus,
        .modal-externo .form-group select:focus {
            outline: none;
            border-color: #3498db;
            background: white;
            box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
        }
        
        .modal-externo .form-actions {
            display: flex;
            gap: 15px;
            justify-content: flex-end;
            margin-top: 25px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
        
        .modal-externo .btn-success {
            background: linear-gradient(135deg, #27ae60, #2ecc71);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .modal-externo .btn-success:hover {
            background: linear-gradient(135deg, #229954, #27ae60);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(46, 204, 113, 0.3);
        }
        
        .modal-externo .btn-secondary {
            background: #6c757d;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .modal-externo .btn-secondary:hover {
            background: #5a6268;
            transform: translateY(-2px);
        }
        
        .swal-high-z-index {
            z-index: 99999 !important;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        @media (max-width: 768px) {
            .modal-externo .form-row {
                grid-template-columns: 1fr;
                gap: 10px;
            }
            
            .modal-externo .modal-content {
                width: 95%;
                margin: 10px;
            }
            
            .modal-externo .form-actions {
                flex-direction: column;
            }
        }
    `;
    document.head.appendChild(style);
}

console.log('🔥 Funciones Paciente Externo - LISTO PARA ACCIÓN!');
console.log('📞 Función crearPacienteExterno() disponible globalmente');
console.log('💾 Mapeo códigos adm_elemento: ', MAPEO_TIPOS_DOCUMENTO);

// ===== CSS SUGERENCIAS DIAGNÓSTICO - CLAUDE DEV =====
if (!document.getElementById('diagnostico-sugerencias-styles')) {
    const style = document.createElement('style');
    style.id = 'diagnostico-sugerencias-styles';
    style.textContent = `
        #diagnosticos-sugerencias {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            margin-top: 2px;
        }
        
        .sugerencia-item {
            padding: 12px 16px;
            cursor: pointer;
            border-bottom: 1px solid #f1f5f9;
            transition: background 0.2s ease;
        }
        
        .sugerencia-item:hover {
            background: #f8fafc;
        }
        
        .sugerencia-item:last-child {
            border-bottom: none;
        }
        
        .sugerencia-codigo {
            font-weight: 600;
            color: #2563eb;
            font-size: 0.9rem;
        }
        
        .sugerencia-descripcion {
            color: #64748b;
            font-size: 0.85rem;
            margin-top: 2px;
        }
        
        .form-group {
            position: relative;
        }
        
        .swal-high-z-index {
            z-index: 99999 !important;
        }
    `;
    document.head.appendChild(style);
}
