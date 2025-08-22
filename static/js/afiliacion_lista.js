// ===== AFILIACION LISTA JS - CORREGIDO COMPLETO =====

const AfiliacionLista = {
    pacientes: [],
    filtrosActivos: {},
    
    // ===== NUEVA PROPIEDAD PARA PAGINACIÓN =====
    paginacion: {
        paginaActual: 1,
        limite: 10,
        totalRegistros: 0,
        totalPaginas: 0
    },
    
    API_URLS: {
        BUSCAR: '/api/afiliacion/pacientes',
        TODOS: '/api/afiliacion/pacientes/todos'
    },
    
    async init() {
        this.setupEventListeners();
        await this.cargarTodos();
    },
    
    // ===== CAMBIO DE SERVICIO - USAR FUNCIÓN POSTGRESQL =====
    async cargarTodos(pagina = 1) {
        try {
            this.mostrarLoading(true);
            this.paginacion.paginaActual = pagina;
            
            // USAR DIRECTAMENTE LA FUNCIÓN POSTGRESQL
            const filtrosVacios = {};
            const offset = (pagina - 1) * this.paginacion.limite;
            
            const response = await fetch('/api/afiliacion/buscar-pacientes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filtros: filtrosVacios,
                    limite: this.paginacion.limite,
                    offset: offset
                })
            });
            
            const resultado = await response.json();
            
            if (resultado.success) {
                this.pacientes = resultado.data || [];
                
                // MAPEAR PAGINACIÓN DESDE POSTGRESQL
                if (resultado.pagination) {
                    this.paginacion = {
                        paginaActual: resultado.pagination.pagina_actual,
                        limite: resultado.pagination.limite,
                        totalRegistros: resultado.pagination.total_registros,
                        totalPaginas: resultado.pagination.total_paginas
                    };
                }
                
                this.renderizarPacientes();
                this.actualizarEstadisticas();
                this.renderizarPaginacion();
            } else {
                this.mostrarError('No se pudieron cargar los pacientes', resultado.message);
            }
        } catch (error) {
            this.mostrarError('Error de conexión', 'No se pudo conectar con el servidor');
        } finally {
            this.mostrarLoading(false);
        }
    },
    
    // ===== CAMBIO DE SERVICIO - USAR FUNCIÓN POSTGRESQL =====
    async buscarConFiltros(pagina = 1) {
        try {
            this.mostrarLoading(true);
            this.paginacion.paginaActual = pagina;
            
            const filtros = this.obtenerFiltrosFormulario();
            const offset = (pagina - 1) * this.paginacion.limite;
            
            // MAPEAR FILTROS PARA POSTGRESQL
            const filtrosPostgres = {};
            if (filtros.nombre) filtrosPostgres.nombre = filtros.nombre;
            if (filtros.tipo_doc) filtrosPostgres.tipo_doc = filtros.tipo_doc;
            if (filtros.numero_doc) filtrosPostgres.numero_doc = filtros.numero_doc;
            if (filtros.tipo_paciente) filtrosPostgres.tipo_paciente = filtros.tipo_paciente;
            
            const response = await fetch('/api/afiliacion/buscar-pacientes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filtros: filtrosPostgres,
                    limite: this.paginacion.limite,
                    offset: offset
                })
            });
            
            const resultado = await response.json();
            
            if (resultado.success) {
                this.pacientes = resultado.data || [];
                this.filtrosActivos = filtros;
                
                // MAPEAR PAGINACIÓN DESDE POSTGRESQL
                if (resultado.pagination) {
                    this.paginacion = {
                        paginaActual: resultado.pagination.pagina_actual,
                        limite: resultado.pagination.limite,
                        totalRegistros: resultado.pagination.total_registros,
                        totalPaginas: resultado.pagination.total_paginas
                    };
                }
                
                this.renderizarPacientes();
                this.actualizarEstadisticas();
                this.renderizarPaginacion();
                
                if (pagina === 1) {
                    this.mostrarNotificacion('success', 'Búsqueda completada', 
                        `${this.paginacion.totalRegistros} paciente(s) encontrado(s)`);
                }
            } else {
                this.mostrarError('Sin resultados', resultado.message || 'No se encontraron pacientes');
                this.pacientes = [];
                this.renderizarPacientes();
                this.renderizarPaginacion();
            }
        } catch (error) {
            this.mostrarError('Error de búsqueda', 'No se pudo realizar la búsqueda');
        } finally {
            this.mostrarLoading(false);
        }
    },
    
    obtenerFiltrosFormulario() {
        return {
            nombre: document.getElementById('filtro-nombre')?.value?.trim() || '',
            tipo_doc: document.getElementById('filtro-tipo-doc')?.value || '',
            numero_doc: document.getElementById('filtro-numero-doc')?.value?.trim() || '',
            tipo_paciente: document.getElementById('filtro-tipo-paciente')?.value || ''
        };
    },
    
    // ===== MODIFICADO PARA NÚMEROS GLOBALES =====
    renderizarPacientes() {
        const tbody = document.getElementById('pacientes-tbody');
        const cardsContainer = document.getElementById('pacientes-cards');
        
        tbody.innerHTML = '';
        cardsContainer.innerHTML = '';
        
        if (this.pacientes.length === 0) {
            this.mostrarNoResultados(true);
            return;
        }
        
        this.mostrarNoResultados(false);
        
        this.pacientes.forEach((paciente, index) => {
            // ===== NÚMERO GLOBAL CON PAGINACIÓN =====
            const numeroGlobal = ((this.paginacion.paginaActual - 1) * this.paginacion.limite) + index + 1;
            
            // TABLA DESKTOP
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td><strong>${numeroGlobal}</strong></td>
                <td><span class="historia-clinica">${paciente.historia_clinica || 'N/A'}</span></td>
                <td>${paciente.documento_completo || paciente.documento || 'N/A'}</td>
                <td><strong>${paciente.nombres_completos || paciente.nombre_completo || 'N/A'}</strong></td>
                <td>${paciente.telefono || 'No registrado'}</td>
                <td>${paciente.email || 'No registrado'}</td>
                <td><span class="badge badge-activo">${paciente.estado_descripcion || paciente.estado || 'Activo'}</span></td>
                <td>
                    <div class="acciones-group">
                        <button class="btn-accion btn-ver" onclick="AfiliacionLista.verPaciente(${paciente.paciente_id})">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                        <button class="btn-accion btn-editar" onclick="AfiliacionLista.editarPaciente(${paciente.paciente_id})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-accion btn-imprimir" onclick="AfiliacionLista.imprimirHoja(${paciente.paciente_id})">
                            <i class="fas fa-print"></i> Imprimir
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(fila);
            
            // CARDS MÓVIL
            const card = document.createElement('div');
            card.className = 'paciente-card';
            card.innerHTML = `
                <div class="card-header">
                    <div class="card-numero">${numeroGlobal}</div>
                    <div class="card-tipo ${this.getTipoClase(paciente.tipo_paciente)}">
                        ${paciente.tipo_paciente || 'Externo'}
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-field">
                        <div class="field-label">Historia Clínica</div>
                        <div class="field-value historia-clinica">${paciente.historia_clinica || 'N/A'}</div>
                    </div>
                    <div class="card-field">
                        <div class="field-label">Documento</div>
                        <div class="field-value">${paciente.documento_completo || paciente.documento || 'N/A'}</div>
                    </div>
                    <div class="card-field">
                        <div class="field-label">Nombre</div>
                        <div class="field-value">${paciente.nombres_completos || paciente.nombre_completo || 'N/A'}</div>
                    </div>
                    <div class="card-field">
                        <div class="field-label">Teléfono</div>
                        <div class="field-value">${paciente.telefono || 'No registrado'}</div>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-accion btn-ver" onclick="AfiliacionLista.verPaciente(${paciente.paciente_id})">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button class="btn-accion btn-editar" onclick="AfiliacionLista.editarPaciente(${paciente.paciente_id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-accion btn-imprimir" onclick="AfiliacionLista.imprimirHoja(${paciente.paciente_id})">
                        <i class="fas fa-print"></i> Imprimir
                    </button>
                </div>
            `;
            cardsContainer.appendChild(card);
        });
    },
    
    getTipoClase(tipoPaciente) {
        if (!tipoPaciente) return 'tipo-externo';
        return tipoPaciente.toLowerCase().includes('ext') ? 'tipo-externo' : 'tipo-hc';
    },
    
    setupEventListeners() {
        const filtroNombre = document.getElementById('filtro-nombre');
        if (filtroNombre) {
            filtroNombre.addEventListener('input', () => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.buscarConFiltros(1);
                }, 500);
            });
        }

        document.querySelectorAll('.filtro-input, .filtro-select').forEach(elemento => {
            elemento.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.buscarConFiltros(1);
                }
            });
        });
    },
    
    async aplicarFiltros() {
        const filtros = this.obtenerFiltrosFormulario();
        const hayFiltros = Object.values(filtros).some(valor => valor !== '');
        
        if (!hayFiltros) {
            this.mostrarNotificacion('info', 'Sin filtros', 
                'No has especificado filtros. Se mostrarán todos los pacientes.');
            await this.cargarTodos(1);
            return;
        }
        
        await this.buscarConFiltros(1);
    },
    
    limpiarFiltros() {
        document.getElementById('filtro-nombre').value = '';
        document.getElementById('filtro-tipo-doc').value = '';
        document.getElementById('filtro-numero-doc').value = '';
        document.getElementById('filtro-tipo-paciente').value = '';
        
        this.filtrosActivos = {};
        this.cargarTodos(1);
        this.mostrarNotificacion('success', 'Filtros limpiados', 'Se muestran todos los pacientes');
    },
    
    // ===== 🚀 NUEVAS FUNCIONES DE PAGINACIÓN =====
    
    /**
     * Renderiza los controles de paginación
     */
    renderizarPaginacion() {
        let container = document.getElementById('paginacion-container');
        
        // Crear contenedor si no existe
        if (!container) {
            container = document.createElement('div');
            container.id = 'paginacion-container';
            container.className = 'paginacion-container';
            
            const tablaContainer = document.querySelector('.tabla-container');
            if (tablaContainer) {
                tablaContainer.parentNode.insertBefore(container, tablaContainer.nextSibling);
            }
        }
        
        // Si no hay páginas múltiples, ocultar
        if (this.paginacion.totalPaginas <= 1) {
            container.innerHTML = '';
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'flex';
        container.innerHTML = this.construirHTMLPaginacion();
    },
    
    /**
     * Construye el HTML de paginación
     */
    construirHTMLPaginacion() {
        const { paginaActual, totalPaginas, totalRegistros, limite } = this.paginacion;
        const inicio = ((paginaActual - 1) * limite) + 1;
        const fin = Math.min(paginaActual * limite, totalRegistros);
        
        let html = `
            <div class="paginacion-info">
                Mostrando ${inicio}-${fin} de ${totalRegistros} registros
            </div>
            <div class="paginacion-controles">
        `;
        
        // Botón Anterior
        if (paginaActual > 1) {
            html += `<button class="btn-pag" onclick="AfiliacionLista.irAPagina(${paginaActual - 1})">
                <i class="fas fa-chevron-left"></i> Anterior
            </button>`;
        }
        
        // Páginas numéricas
        const inicio_pag = Math.max(1, paginaActual - 2);
        const fin_pag = Math.min(totalPaginas, paginaActual + 2);
        
        for (let i = inicio_pag; i <= fin_pag; i++) {
            const activa = i === paginaActual ? 'activa' : '';
            html += `<button class="btn-pag ${activa}" onclick="AfiliacionLista.irAPagina(${i})">${i}</button>`;
        }
        
        // Botón Siguiente
        if (paginaActual < totalPaginas) {
            html += `<button class="btn-pag" onclick="AfiliacionLista.irAPagina(${paginaActual + 1})">
                Siguiente <i class="fas fa-chevron-right"></i>
            </button>`;
        }
        
        html += '</div>';
        return html;
    },
    
    /**
     * Navega a una página específica
     */
    async irAPagina(pagina) {
        if (pagina < 1 || pagina > this.paginacion.totalPaginas || pagina === this.paginacion.paginaActual) {
            return;
        }
        
        const hayFiltros = Object.values(this.filtrosActivos).some(valor => valor !== '');
        
        if (hayFiltros) {
            await this.buscarConFiltros(pagina);
        } else {
            await this.cargarTodos(pagina);
        }
        
        document.querySelector('.tabla-container')?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    },
    
    async verPaciente(pacienteId) {
        const paciente = this.pacientes.find(p => p.paciente_id === pacienteId);
        
        if (!paciente) {
            this.mostrarError('Error', 'Paciente no encontrado');
            return;
        }
        
        await Swal.fire({
            title: '👁️ Detalles del Paciente',
            html: `
                <div style="text-align: left; margin: 20px 0;">
                    <h4 style="color: #2c5aa0; margin-bottom: 15px;">
                        <i class="fas fa-user"></i> ${paciente.nombres_completos || paciente.nombre_completo}
                    </h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div><strong>Historia:</strong><br>${paciente.historia_clinica}</div>
                        <div><strong>Documento:</strong><br>${paciente.documento_completo || paciente.documento}</div>
                        <div><strong>Tipo:</strong><br>${paciente.tipo_paciente}</div>
                        <div><strong>Edad:</strong><br>${paciente.edad || 'N/A'} años</div>
                        <div><strong>Teléfono:</strong><br>${paciente.telefono || 'No registrado'}</div>
                        <div><strong>Email:</strong><br>${paciente.email || 'No registrado'}</div>
                    </div>
                </div>
            `,
            icon: 'info',
            confirmButtonText: '✅ Cerrar',
            confirmButtonColor: '#3498db',
            width: '600px'
        });
    },
    
    editarPaciente(pacienteId) {
        const paciente = this.pacientes.find(p => p.paciente_id === pacienteId);
        
        if (!paciente) {
            this.mostrarError('Error', 'Paciente no encontrado');
            return;
        }
        
        // 🔥 DETECTAR SI ES PACIENTE EXTERNO Y OFRECER UPGRADE
        if (paciente.historia_clinica && paciente.historia_clinica.includes('EXT')) {
            Swal.fire({
                title: '📞 Paciente Externo Detectado',
                html: `
                    <div style="text-align: left; margin: 1rem 0;">
                        <p><strong>👤 Paciente:</strong> ${paciente.nombres_completos || paciente.nombre_completo}</p>
                        <p><strong>🏥 Historia:</strong> ${paciente.historia_clinica}</p>
                        <p><strong>📞 Tipo:</strong> Externo (Llamada telefónica)</p>
                    </div>
                    <div style="background: #e1f5fe; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <h4 style="color: #0277bd; margin: 0 0 10px 0;">🔄 Opciones Disponibles:</h4>
                        <p style="margin: 5px 0;"><strong>1. Editar Datos:</strong> Actualizar información básica</p>
                        <p style="margin: 5px 0;"><strong>2. Upgrade a HC:</strong> Completar datos y crear Historia Clínica</p>
                    </div>
                `,
                icon: 'question',
                showCancelButton: true,
                showDenyButton: true,
                confirmButtonText: '🔄 Upgrade a HC',
                denyButtonText: '✏️ Editar Datos',
                cancelButtonText: '❌ Cancelar',
                confirmButtonColor: '#2196f3',
                denyButtonColor: '#ff9800'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Upgrade EXT → HC
                    window.location.href = `/medical/afiliacion/editar/${pacienteId}?upgrade=true&tipo=HC`;
                } else if (result.isDenied) {
                    // Editar datos básicos
                    window.location.href = `/medical/afiliacion/editar/${pacienteId}?tipo=EXT`;
                }
            });
        } else {
            // Paciente HC normal - editar directamente
            window.location.href = `/medical/afiliacion/editar/${pacienteId}?tipo=HC`;
        }
    },
    
    async imprimirHoja(pacienteId) {
        const paciente = this.pacientes.find(p => p.paciente_id === pacienteId);
        
        if (!paciente) {
            this.mostrarError('Error', 'Paciente no encontrado');
            return;
        }
        
        const result = await Swal.fire({
            title: '🖨️ Imprimir Hoja de Afiliación',
            html: `
                <div style="text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 15px;">📄</div>
                    <p>¿Deseas generar e imprimir la hoja de afiliación?</p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <strong>Paciente:</strong> ${paciente.nombres_completos || paciente.nombre_completo}<br>
                        <strong>Historia:</strong> ${paciente.historia_clinica}
                    </div>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '🖨️ Generar PDF',
            cancelButtonText: '❌ Cancelar',
            confirmButtonColor: '#7b1fa2'
        });
        
        if (result.isConfirmed) {
            this.generarPDF(paciente);
        }
    },
    
    async generarPDF(paciente) {
        Swal.fire({
            title: '📄 Generando PDF...',
            html: `
                <div style="text-align: center;">
                    <i class="fas fa-file-pdf fa-3x" style="color: #e74c3c;"></i>
                    <p>Generando hoja de afiliación...</p>
                    <strong>${paciente.nombres_completos || paciente.nombre_completo}</strong>
                </div>
            `,
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false
        }).then(() => {
            Swal.fire({
                icon: 'success',
                title: '✅ PDF Generado',
                text: 'La hoja de afiliación se ha generado correctamente'
            });
        });
    },
    
    mostrarLoading(mostrar) {
        const loading = document.getElementById('loading-container');
        const tabla = document.getElementById('pacientes-tabla');
        const cards = document.getElementById('pacientes-cards');
        
        if (mostrar) {
            loading.style.display = 'block';
            tabla.style.display = 'none';
            cards.style.display = 'none';
        } else {
            loading.style.display = 'none';
            tabla.style.display = 'table';
            cards.style.display = 'flex';
        }
    },
    
    mostrarNoResultados(mostrar) {
        const noResultados = document.getElementById('no-resultados');
        const tabla = document.getElementById('pacientes-tabla');
        const cards = document.getElementById('pacientes-cards');
        
        if (mostrar) {
            noResultados.style.display = 'block';
            tabla.style.display = 'none';
            cards.style.display = 'none';
        } else {
            noResultados.style.display = 'none';
        }
    },
    
    actualizarEstadisticas() {
        const statsElement = document.getElementById('tabla-stats');
        if (statsElement) {
            const { totalRegistros, paginaActual, totalPaginas } = this.paginacion;
            statsElement.textContent = `Total: ${totalRegistros} pacientes (Página ${paginaActual} de ${totalPaginas})`;
        }
    },
    
    mostrarNotificacion(tipo, titulo, texto) {
        Swal.fire({
            icon: tipo,
            title: titulo,
            text: texto,
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    },
    
    mostrarError(titulo, mensaje) {
        Swal.fire({
            icon: 'error',
            title: titulo,
            text: mensaje,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#e74c3c'
        });
    }
};

// ===== FUNCIONES GLOBALES =====
function aplicarFiltros() {
    AfiliacionLista.aplicarFiltros();
}

function limpiarFiltros() {
    AfiliacionLista.limpiarFiltros();
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    
    // ===== CSS PARA PAGINACIÓN =====
    if (!document.getElementById('paginacion-styles')) {
        const style = document.createElement('style');
        style.id = 'paginacion-styles';
        style.textContent = `
            .paginacion-container {
                margin: 20px 0;
                padding: 15px;
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                border-radius: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 15px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .paginacion-info {
                color: #6c757d;
                font-size: 0.9rem;
                font-weight: 500;
            }
            .paginacion-controles {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }
            .btn-pag {
                padding: 8px 16px;
                border: 2px solid #dee2e6;
                background: white;
                color: #495057;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.9rem;
                font-weight: 500;
                transition: all 0.3s ease;
                min-width: 40px;
                text-align: center;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
            }
            .btn-pag:hover {
                background: #007bff;
                color: white;
                border-color: #007bff;
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(0,123,255,0.3);
            }
            .btn-pag.activa {
                background: #007bff;
                color: white;
                border-color: #007bff;
                box-shadow: 0 0 0 3px rgba(0,123,255,0.15);
            }
            
            /* ===== ESTILOS MODAL EXTERNO ===== */
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
            @media (max-width: 768px) {
                .paginacion-container {
                    flex-direction: column;
                    text-align: center;
                    gap: 10px;
                }
                .paginacion-controles {
                    justify-content: center;
                    gap: 6px;
                }
                .btn-pag {
                    padding: 6px 12px;
                    font-size: 0.85rem;
                    min-width: 35px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    AfiliacionLista.init();
});

console.log('🚀 Afiliación Lista - Sistema Cargado con Paginación');

// ===== 🔥 FUNCIONES PACIENTE EXTERNO - ALAN & CLAUDE DEV =====

/**
 * 📞 CREAR PACIENTE EXTERNO - MODAL POPUP
 * Solo datos básicos de pestaña 1 para llamadas telefónicas
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
                    const datos = {
                    tipoDocumento: formData.get('tipoDocumento'),
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
    if (datos.tipoDocumento === 'DNI' && (documento.length !== 8 || !/^\d{8}$/.test(documento))) {
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
        // ✅ MOSTRAR LOADING CON Z-INDEX ALTO - CLAUDE DEV FIX
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
            // ✅ ÉXITO - PACIENTE EXTERNO CREADO CON Z-INDEX ALTO
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
                },
                didOpen: () => {
                    // Asegurar z-index alto para éxito
                    const swalContainer = document.querySelector('.swal2-container');
                    if (swalContainer) {
                        swalContainer.style.zIndex = '99999';
                    }
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
            // ❌ ERROR AL CREAR CON Z-INDEX ALTO
            await Swal.fire({
                icon: 'error',
                title: 'Error al Crear Paciente',
                text: result.message || 'Error desconocido',
                confirmButtonColor: '#e74c3c',
                customClass: {
                    container: 'swal-high-z-index'
                },
                didOpen: () => {
                    // Asegurar z-index alto para error
                    const swalContainer = document.querySelector('.swal2-container');
                    if (swalContainer) {
                        swalContainer.style.zIndex = '99999';
                    }
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
            },
            didOpen: () => {
                // Asegurar z-index alto para error de conexión
                const swalContainer = document.querySelector('.swal2-container');
                if (swalContainer) {
                    swalContainer.style.zIndex = '99999';
                }
            }
        });
    }
}

// ✅ AGREGAR CSS PARA ANIMACIÓN FADEOUT
const fadeOutCSS = `
@keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
}
`;

if (!document.querySelector('#fadeout-styles')) {
    const style = document.createElement('style');
    style.id = 'fadeout-styles';
    style.textContent = fadeOutCSS;
    document.head.appendChild(style);
}

console.log('🔥 Funciones Paciente Externo - LISTO PARA ACCIÓN!');

/**
 * 🎯 CONFIGURAR FECHA MÁXIMA PARA NACIMIENTO (OPCIONAL)
 */
document.addEventListener('DOMContentLoaded', function() {
    // Configurar fecha máxima para nacimiento (hoy)
    const fechaInputs = document.querySelectorAll('input[name="fechaNacimiento"]');
    const hoy = new Date().toISOString().split('T')[0];
    
    fechaInputs.forEach(input => {
        input.max = hoy;
    });
});

// ===== 🔥 FIX ESPECÍFICO - FUNCIÓN EDITAR PACIENTE =====
/**
 * ✏️ EDITAR PACIENTE - Abre formulario con datos cargados
 * @param {number} pacienteId - ID del paciente a editar
 */
function editarPaciente(pacienteId) {
    console.log(`✏️ Editando paciente ID: ${pacienteId}`);
    
    // ✅ Ir a página de edición con ID del paciente
    window.location.href = `/medical/afiliacion/editar/${pacienteId}`;
}

/**
 * 🔍 VISUALIZAR PACIENTE - Abre en modo solo lectura
 * @param {number} pacienteId - ID del paciente a visualizar
 */
function visualizarPaciente(pacienteId) {
    console.log(`🔍 Visualizando paciente ID: ${pacienteId}`);
    
    // ✅ Ir a página de visualización
    window.location.href = `/medical/afiliacion/ver/${pacienteId}`;
}

console.log('✅ Funciones de edición disponibles: editarPaciente(), visualizarPaciente()');