// ===== CONTINUACIÓN DE AFILIACION.JS =====

                <small><strong>💾 Técnica Alan aplicada:</strong> Trazabilidad completa en 3 tablas</small>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '📋 Ver Lista de Pacientes',
        cancelButtonText: esEdicion ? '🔄 Seguir Editando' : '➕ Nueva Afiliación',
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#64748b'
    }).then((result) => {
        if (result.isConfirmed) {
            // Ir a lista de pacientes
            window.location.href = '/medical/afiliacion';
        } else {
            // Nueva afiliación o seguir editando
            if (!esEdicion) {
                window.location.reload();
            }
        }
    });
}

function mostrarError(mensaje) {
    Swal.fire({
        icon: 'error',
        title: '❌ Error',
        text: mensaje,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#dc2626'
    });
}

// ===== CARGA DE DATOS PARA EDICIÓN =====
async function cargarDatosPaciente(pacienteId) {
    try {
        console.log(`📥 Cargando datos del paciente ID: ${pacienteId}`);
        
        const response = await fetch(`${AfiliacionConfig.endpoints.obtener}/${pacienteId}`);
        const result = await response.json();
        
        if (result.success) {
            poblarFormularioConDatos(result.data);
            console.log('✅ Datos del paciente cargados exitosamente');
        } else {
            throw new Error(result.message || 'Error cargando datos del paciente');
        }
        
    } catch (error) {
        console.error('❌ Error cargando paciente:', error);
        mostrarError('Error cargando los datos del paciente');
    }
}

function poblarFormularioConDatos(datos) {
    // Paso 1: Datos personales
    if (datos.paso1) {
        const paso1 = datos.paso1;
        document.getElementById('tipo-documento').value = paso1.tipo_documento || '';
        document.getElementById('numero-documento').value = paso1.numero_documento || '';
        document.getElementById('nombres').value = paso1.nombres || '';
        document.getElementById('apellidos').value = paso1.apellidos || '';
        document.getElementById('fecha-nacimiento').value = paso1.fecha_nacimiento || '';
        document.getElementById('sexo').value = paso1.sexo || '';
        document.getElementById('estado-civil').value = paso1.estado_civil || '';
        document.getElementById('ocupacion').value = paso1.ocupacion || '';
    }
    
    // Paso 2: Información médica
    if (datos.paso2) {
        const paso2 = datos.paso2;
        document.getElementById('grupo-sanguineo').value = paso2.grupo_sanguineo || '';
        document.getElementById('factor-rh').value = paso2.factor_rh || '';
        document.getElementById('antecedentes').value = paso2.antecedentes || '';
        
        // Cargar alergias
        if (paso2.alergias && paso2.alergias.length > 0) {
            // TODO: Implementar carga de alergias dinámicas
        }
    }
    
    // Paso 3: Contacto
    if (datos.paso3) {
        const paso3 = datos.paso3;
        document.getElementById('telefono').value = paso3.telefono || '';
        document.getElementById('email').value = paso3.email || '';
        document.getElementById('direccion').value = paso3.direccion || '';
        document.getElementById('distrito').value = paso3.distrito || '';
        document.getElementById('contacto-nombre').value = paso3.contacto_nombre || '';
        document.getElementById('contacto-parentesco').value = paso3.contacto_parentesco || '';
        document.getElementById('contacto-telefono').value = paso3.contacto_telefono || '';
    }
}

// ===== UTILIDADES =====
function extraerPacienteIdFromURL() {
    const path = window.location.pathname;
    const matches = path.match(/\/editar\/(\d+)/);
    return matches ? parseInt(matches[1]) : null;
}

function formatearFecha(fechaISO) {
    if (!fechaISO) return 'No especificada';
    
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
    });
}

// ===== CLASES CSS DINÁMICAS =====
const estilosCSS = `
.hidden {
    display: none !important;
}

.fade-in {
    animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.resumen-seccion {
    background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 16px;
}

.resumen-seccion h3 {
    color: #2563eb;
    margin-bottom: 12px;
    font-size: 1.1rem;
}

.resumen-seccion p {
    margin-bottom: 8px;
    color: #64748b;
}

.form-group {
    position: relative;
}

.sugerencias-container {
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
}

.sugerencia-item {
    padding: 12px 16px;
    cursor: pointer;
    border-bottom: 1px solid #e2e8f0;
    transition: background 0.2s ease;
}

.sugerencia-item:hover {
    background: #f1f5f9;
}

.sugerencia-item:last-child {
    border-bottom: none;
}

.sugerencia-codigo {
    font-weight: 600;
    color: #2563eb;
}

.sugerencia-descripcion {
    color: #64748b;
    font-size: 0.9rem;
}
`;

// Inyectar estilos dinámicos
if (!document.getElementById('afiliacion-dynamic-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'afiliacion-dynamic-styles';
    styleSheet.textContent = estilosCSS;
    document.head.appendChild(styleSheet);
}

console.log('🔥 AfiliacionJS cargado - Sistema épico con catálogos dinámicos');