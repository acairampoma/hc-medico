// =====================================================
// SISTEMA DE LOGIN HOSPITALARIO - JAVASCRIPT COMPLETO
// Autor: Alan Cairampoma
// Fecha: 21 Junio 2025
// =====================================================

// Configuración personalizada de SweetAlert2 para tema médico
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});

// =====================================================
// FUNCIONES DE UTILIDAD
// =====================================================

/**
 * 🔑 Extrae el rol desde la respuesta del login (ms-usuario)
 */
function extractRoleFromLoginResponse(userData) {
    try {
        console.log('🔑 Extrayendo rol desde login response:', userData);
        
        // Opción 1: Campo role directo
        if (userData.role) {
            console.log('🔑 Rol directo encontrado:', userData.role);
            return userData.role;
        }
        
        // Opción 2: Array de roles
        if (userData.roles && Array.isArray(userData.roles) && userData.roles.length > 0) {
            console.log('🔑 Array de roles encontrado:', userData.roles);
            
            // Priorizar ciertos roles
            if (userData.roles.includes('ROLE_ADMIN')) return 'ROLE_ADMIN';
            if (userData.roles.includes('ROLE_EJECUTIVA')) return 'ROLE_EJECUTIVA';
            if (userData.roles.includes('ROLE_MEDICO')) return 'ROLE_MEDICO';
            if (userData.roles.includes('ROLE_NURSE')) return 'ROLE_NURSE';
            
            // Tomar el primer rol
            return userData.roles[0];
        }
        
        // Opción 3: Authorities
        if (userData.authorities && Array.isArray(userData.authorities) && userData.authorities.length > 0) {
            console.log('🔑 Authorities encontradas:', userData.authorities);
            
            const authority = userData.authorities[0];
            return authority.authority || authority;
        }
        
        // Fallback
        console.warn('⚠️ No se encontró rol, usando ROLE_USER por defecto');
        return 'ROLE_USER';
        
    } catch (error) {
        console.error('❌ Error extrayendo rol:', error);
        return 'ROLE_USER';
    }
}

/**
 * 📝 Genera nombre para display robusto
 */
function generateDisplayName(userData, fallbackUsername) {
    try {
        const firstName = (userData.firstName || userData.first_name || userData.nombre || '').trim();
        const lastName = (userData.lastName || userData.last_name || userData.apellido || '').trim();
        const username = (userData.username || fallbackUsername || '').trim();
        
        console.log('📝 Generando displayName:', {firstName, lastName, username});
        
        // Si tenemos nombre y apellido NO VACÍOS
        if (firstName && lastName) {
            const fullName = `${firstName} ${lastName}`;
            console.log('✅ Usando nombre completo:', fullName);
            return fullName;
        }
        
        // Si solo tenemos nombre NO VACÍO
        if (firstName) {
            console.log('✅ Usando solo firstName:', firstName);
            return firstName;
        }
        
        // Si solo tenemos apellido NO VACÍO
        if (lastName) {
            console.log('✅ Usando solo lastName:', lastName);
            return lastName;
        }
        
        // 🔥 FALLBACK AL USERNAME (capitalizado para que se vea mejor)
        if (username) {
            const capitalizedUsername = username.charAt(0).toUpperCase() + username.slice(1);
            console.log('✅ Usando username capitalizado:', capitalizedUsername);
            return capitalizedUsername;
        }
        
        // Último fallback
        console.warn('⚠️ Usando fallback final: Usuario');
        return 'Usuario';
        
    } catch (error) {
        console.error('❌ Error generando displayName:', error);
        return 'Usuario';
    }
}

/**
 * 📝 Genera nombre completo
 */
function generateFullName(userData) {
    try {
        const firstName = (userData.firstName || userData.first_name || userData.nombre || '').trim();
        const lastName = (userData.lastName || userData.last_name || userData.apellido || '').trim();
        const username = (userData.username || '').trim();
        
        console.log('📝 Generando fullName:', {firstName, lastName, username});
        
        // Si tenemos nombre y apellido NO VACÍOS
        if (firstName && lastName) {
            const fullName = `${firstName} ${lastName}`;
            console.log('✅ FullName con nombres:', fullName);
            return fullName;
        }
        
        // Si solo tenemos uno de los dos
        if (firstName || lastName) {
            const singleName = firstName || lastName;
            console.log('✅ FullName con un solo nombre:', singleName);
            return singleName;
        }
        
        // 🔥 FALLBACK AL USERNAME
        if (username) {
            const capitalizedUsername = username.charAt(0).toUpperCase() + username.slice(1);
            console.log('✅ FullName usando username:', capitalizedUsername);
            return capitalizedUsername;
        }
        
        console.warn('⚠️ FullName fallback final: Usuario');
        return 'Usuario';
        
    } catch (error) {
        console.error('❌ Error generando fullName:', error);
        return 'Usuario';
    }
}

/**
 * 🏥 Parsea datos profesionales desde el login
 */
function parseDatosProfesionalLogin(datosProfesionalString) {
    try {
        if (!datosProfesionalString || datosProfesionalString === '{}') {
            return {};
        }
        
        // Si ya es un objeto, devolverlo
        if (typeof datosProfesionalString === 'object') {
            return datosProfesionalString;
        }
        
        // Si es string, parsearlo
        const parsed = JSON.parse(datosProfesionalString);
        console.log('🏥 Datos profesionales parseados en login:', parsed);
        return parsed;
        
    } catch (error) {
        console.error('❌ Error parseando datosProfesional en login:', error);
        return {};
    }
}

// Toggle mostrar/ocultar contraseña
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.querySelector('.toggle-password');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Función para olvido de contraseña
function forgotPassword() {
    Swal.fire({
        title: '🔐 Recuperar Contraseña',
        html: `
            <div style="text-align: left; margin: 20px 0;">
                <p style="margin-bottom: 15px; color: #2c5aa0;">Ingresa tu email para recibir instrucciones:</p>
                <input type="email" id="recovery-email" class="swal2-input" placeholder="tu-email@hospital.com" style="margin: 0;">
            </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-paper-plane"></i> Enviar',
        cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
        confirmButtonColor: '#2c5aa0',
        cancelButtonColor: '#7f8c8d',
        background: '#ffffff',
        color: '#2c3e50',
        customClass: {
            popup: 'medical-popup',
            title: 'medical-title'
        },
        preConfirm: () => {
            const email = document.getElementById('recovery-email').value;
            if (!email) {
                Swal.showValidationMessage('Por favor ingresa tu email');
                return false;
            }
            if (!email.includes('@')) {
                Swal.showValidationMessage('Por favor ingresa un email válido');
                return false;
            }
            return email;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            Toast.fire({
                icon: 'info',
                title: '📧 Email enviado',
                text: `Instrucciones enviadas a ${result.value}`
            });
        }
    });
}

// =====================================================
// LÓGICA DE REDIRECCIÓN POR ROLES
// =====================================================

// Función para determinar la redirección según el rol
function determinarRedireccion(userRole) {
    const redirections = {
        'ROLE_ADMIN': '/dashboard',                    // Dashboard administrativo general
        'ROLE_MEDICO': '/dashboard',                   // Dashboard médico con módulos clínicos
        'ROLE_EJECUTIVA': '/modulos_ejecutiva',   // 🎯 Módulos específicos de ejecutiva
        'ROLE_MODERATOR': '/dashboard',                // Dashboard moderador
        'ROLE_USER': '/dashboard',                     // Dashboard usuario básico
        'ROLE_API': '/api-docs',                       // Documentación de API
        
        // 🔥 TAMBIÉN MAPEAR LOS ROLES SIN "ROLE_" POR SI ACASO
        'admin': '/dashboard',
        'medico': '/dashboard', 
        'ejecutiva': '/modulos_ejecutiva',
        'user': '/dashboard'
    };
    
    // 🔍 Detectar el rol correcto
    console.log(`🔍 ROL RECIBIDO: "${userRole}" (tipo: ${typeof userRole})`);
    
    // Si es un array, tomar el primer elemento
    if (Array.isArray(userRole)) {
        userRole = userRole[0];
        console.log(`📋 Array detectado, usando primer rol: ${userRole}`);
    }
    
    // Buscar redirección exacta primero
    let redirectUrl = redirections[userRole];
    
    // Si no se encuentra, buscar conteniendo EJECUTIVA
    if (!redirectUrl && userRole && userRole.toString().toUpperCase().includes('EJECUTIVA')) {
        redirectUrl = '/modulos_ejecutiva';
        console.log(`🎯 EJECUTIVA detectada en rol: ${userRole} → ${redirectUrl}`);
    }
    
    // Si no se encuentra, buscar conteniendo MEDICO
    if (!redirectUrl && userRole && userRole.toString().toUpperCase().includes('MEDICO')) {
        redirectUrl = '/dashboard';
        console.log(`👨‍⚕️ MEDICO detectado en rol: ${userRole} → ${redirectUrl}`);
    }
    
    // Default dashboard
    const finalUrl = redirectUrl || '/dashboard';
    console.log(`🎯 REDIRECCIÓN FINAL: ${userRole} → ${finalUrl}`);
    
    return finalUrl;
}

// Función para obtener mensaje personalizado por rol
function obtenerMensajeRole(userRole) {
    // 🔍 Detectar tipo de rol dinámicamente
    console.log(`🔍 ANALIZANDO ROL PARA MENSAJE: "${userRole}"`);
    
    let roleType = 'unknown';
    
    // Detectar EJECUTIVA
    if (userRole && userRole.toString().toUpperCase().includes('EJECUTIVA')) {
        roleType = 'EJECUTIVA';
    }
    // Detectar MEDICO
    else if (userRole && userRole.toString().toUpperCase().includes('MEDICO')) {
        roleType = 'MEDICO';
    }
    // Detectar ADMIN
    else if (userRole && userRole.toString().toUpperCase().includes('ADMIN')) {
        roleType = 'ADMIN';
    }
    // Roles específicos
    else if (userRole === 'ROLE_MODERATOR') {
        roleType = 'MODERATOR';
    }
    else if (userRole === 'ROLE_USER' || userRole === 'user') {
        roleType = 'USER';
    }
    
    console.log(`🎯 TIPO DE ROL DETECTADO: ${roleType}`);
    
    const roleMessages = {
        'EJECUTIVA': { 
            icon: '👩‍💼', 
            message: 'Accediendo a módulos administrativos...', 
            description: 'Afiliación • Programación • Cupos • Citas' 
        },
        'MEDICO': { 
            icon: '👨‍⚕️', 
            message: 'Accediendo a sistema clínico...', 
            description: 'Consultas • Órdenes • Recetas • Notas Médicas' 
        },
        'ADMIN': { 
            icon: '⚙️', 
            message: 'Accediendo a panel administrativo...', 
            description: 'Configuración completa del sistema' 
        },
        'MODERATOR': { 
            icon: '🛡️', 
            message: 'Accediendo a panel de moderación...', 
            description: 'Gestión de contenido y usuarios' 
        },
        'USER': { 
            icon: '👤', 
            message: 'Accediendo al sistema...', 
            description: 'Panel de usuario básico' 
        }
    };
    
    const result = roleMessages[roleType] || { 
        icon: '🏥', 
        message: 'Accediendo al sistema...', 
        description: 'Sistema hospitalario' 
    };
    
    console.log(`📝 MENSAJE SELECCIONADO:`, result);
    return result;
}

// =====================================================
// MANEJO DEL FORMULARIO DE LOGIN
// =====================================================

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    
    // =====================================================
    // VALIDACIONES CON SWEETALERT2
    // =====================================================
    if (!username.trim()) {
        Swal.fire({
            icon: 'warning',
            title: '⚠️ Campo requerido',
            text: 'Por favor ingresa tu usuario',
            confirmButtonColor: '#2c5aa0',
            background: '#ffffff',
            color: '#2c3e50'
        });
        return;
    }

    if (!password.trim()) {
        Swal.fire({
            icon: 'warning',
            title: '⚠️ Campo requerido',
            text: 'Por favor ingresa tu contraseña',
            confirmButtonColor: '#2c5aa0',
            background: '#ffffff',
            color: '#2c3e50'
        });
        return;
    }
    
    // =====================================================
    // MOSTRAR LOADING ELEGANTE
    // =====================================================
    Swal.fire({
        title: '🏥 Autenticando...',
        html: `
            <div style="display: flex; align-items: center; justify-content: center; margin: 20px 0;">
                <div style="animation: spin 1s linear infinite; margin-right: 10px;">
                    <i class="fas fa-user-md fa-2x" style="color: #2c5aa0;"></i>
                </div>
                <span style="color: #2c5aa0; font-weight: 600;">Verificando credenciales...</span>
            </div>
        `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        background: '#ffffff',
        color: '#2c3e50',
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    try {
        // =====================================================
        // LLAMADA AL API DE LOGIN
        // =====================================================
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password,
                remember_me: remember
            })
        });
        
        const result = await response.json();
        
        if (result.success && result.token) {
            console.log('🎉 === LOGIN EXITOSO - INICIANDO DEBUGGING ===');
            console.log('🔍 result completo:', result);
            console.log('🔍 result.user:', result.user);
            console.log('🔍 result.token:', result.token);
            
            // =====================================================
            // LOGIN EXITOSO - PROCESAR DATOS DEL USUARIO DESDE MS-USUARIO
            // =====================================================
            localStorage.setItem('access_token', result.token);
            console.log('✅ Token guardado');
            
            // 📦 EXTRAER DATOS desde la nueva estructura apiResponse del ms-usuario
            console.log('📦 Respuesta completa del login:', result);
            
            // 🔄 PROCESAR datos del usuario desde result.user (la respuesta del ms-usuario)
            const userData = result.user || {};
            console.log('👤 Datos del usuario extraídos:', userData);
            console.log('🔍 TIPO DE userData:', typeof userData);
            console.log('🔍 userData es array?:', Array.isArray(userData));
            console.log('🔍 userData.firstName:', userData.firstName);
            console.log('🔍 userData.lastName:', userData.lastName);
            console.log('🔍 userData.username:', userData.username);
            
            // 📝 CREAR userCompleto con estructura robusta
            const userCompleto = {
                // 🔑 Datos básicos - manejar diferentes nombres de campos
                id: userData.id || userData.user_id || userData.userId || 'unknown',
                username: userData.username || username, // Fallback al username ingresado
                email: userData.email || '',
                
                // 👨‍⚕️ Nombres - diferentes posibles estructuras
                firstName: userData.firstName || userData.first_name || userData.nombre || '',
                lastName: userData.lastName || userData.last_name || userData.apellido || '',
                
                // 🔑 Rol - extraer de diferentes estructuras posibles
                role: extractRoleFromLoginResponse(userData),
                
                // 📊 Permisos y authorities
                permissions: userData.permissions || [],
                authorities: userData.authorities || [],
                roles: userData.roles || [],
                
                // 📝 Nombres calculados para display
                displayName: generateDisplayName(userData, username),
                fullName: generateFullName(userData),
                
                // 🏥 Datos profesionales - si existen
                cmp: userData.cmp || 'N/A',
                tipo: userData.tipo || 'N/A', 
                hospital_id: userData.hospital_id || null,
                area_trabajo: userData.area_trabajo || 'N/A',
                especialidad_principal: userData.especialidad_principal || 'N/A',
                
                // 📦 Datos profesionales parseados
                datosProfesional: userData.datosProfesional || userData.datosprofesional || '{}',
                datos_profesional_parsed: parseDatosProfesionalLogin(userData.datosProfesional || userData.datosprofesional),
                
                // 🕒 Metadatos
                loginTime: new Date().toISOString(),
                lastActivity: new Date().toISOString(),
                enabled: userData.enabled !== undefined ? userData.enabled : true
            };

            // 💾 GUARDAR datos completos del usuario
            localStorage.setItem('user_data', JSON.stringify(userCompleto));
            localStorage.setItem('userCompleto', JSON.stringify(userCompleto)); // También para dashboard.js
            
            console.log('🔍 USUARIO COMPLETO PROCESADO:', userCompleto);
            console.log('🎯 ROL FINAL DETECTADO:', userCompleto.role);
            console.log('📝 DISPLAY NAME GENERADO:', userCompleto.displayName);
            console.log('📝 FULL NAME GENERADO:', userCompleto.fullName);

            // =====================================================
            // DETERMINAR REDIRECCIÓN SEGÚN ROL
            // =====================================================
            
            // 🔍 DEBUG: Mostrar toda la información del usuario
            console.log('🔍 DATOS COMPLETOS DEL USUARIO:', userCompleto);
            console.log('🎯 ROL ORIGINAL:', result.user.role);
            console.log('🎯 ROL EN userCompleto:', userCompleto.role);
            
            // 🔥 VERIFICAR SI HAY ROLES EN EL ARRAY (desde el backend)
            if (result.user.roles && Array.isArray(result.user.roles)) {
                console.log('📋 ROLES ARRAY DETECTADO:', result.user.roles);
                
                // Buscar ROLE_EJECUTIVA específicamente
                if (result.user.roles.includes('ROLE_EJECUTIVA')) {
                    userCompleto.role = 'ROLE_EJECUTIVA';
                    console.log('✅ ROLE_EJECUTIVA detectado y asignado!');
                }
                else if (result.user.roles.includes('ROLE_MEDICO')) {
                    userCompleto.role = 'ROLE_MEDICO';
                    console.log('✅ ROLE_MEDICO detectado y asignado!');
                }
                else if (result.user.roles.includes('ROLE_ADMIN')) {
                    userCompleto.role = 'ROLE_ADMIN';
                    console.log('✅ ROLE_ADMIN detectado y asignado!');
                }
            }
            
            const redirectUrl = determinarRedireccion(userCompleto.role);
            const roleData = obtenerMensajeRole(userCompleto.role);
            
            console.log(`🎯 Redirigiendo a: ${redirectUrl} (Rol: ${userCompleto.role})`);
            console.log('🎨 Datos del rol:', roleData);

            // =====================================================
            // MENSAJE DE BIENVENIDA PERSONALIZADO CON DATOS REALES
            // =====================================================
            const userName = userCompleto.displayName || userCompleto.firstName || userCompleto.username || 'Usuario';
            const userRole = userCompleto.role || 'ROLE_USER';
            
            console.log('🎆 Preparando mensaje de bienvenida para:', userName, '| Rol:', userRole);

            await Swal.fire({
                icon: 'success',
                title: '✅ ¡Bienvenido!',
                html: `
                    <div style="text-align: center; margin: 20px 0;">
                        <div style="font-size: 3rem; margin-bottom: 15px;">${roleData.icon}</div>
                        <p style="color: #00a86b; font-weight: 600; margin-bottom: 10px; font-size: 1.2rem;">
                            ¡Hola ${userName}!
                        </p>
                        <p style="color: #2c5aa0; margin-bottom: 10px; font-weight: 500;">${result.message || 'Autenticación exitosa'}</p>
                        <p style="color: #7f8c8d; font-size: 0.9rem; margin-bottom: 15px;">${roleData.message}</p>
                        <div style="margin-top: 15px; padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #2c5aa0;">
                            <div style="color: #6c757d; font-size: 0.85rem; margin-bottom: 5px;">
                                <strong>Usuario:</strong> ${userCompleto.username}
                            </div>
                            <div style="color: #6c757d; font-size: 0.85rem; margin-bottom: 5px;">
                                <strong>Rol:</strong> ${userRole.replace('ROLE_', '')}
                            </div>
                            <div style="color: #6c757d; font-size: 0.8rem;">
                                ${roleData.description}
                            </div>
                        </div>
                    </div>
                `,
                timer: 4000,
                timerProgressBar: true,
                showConfirmButton: false,
                confirmButtonColor: '#00a86b',
                background: '#ffffff',
                color: '#2c3e50',
                customClass: {
                    popup: 'welcome-popup'
                }
            });

            // =====================================================
            // REDIRECCIÓN FINAL
            // =====================================================
            window.location.href = redirectUrl;
            
        } else {
            // =====================================================
            // ERROR DE LOGIN
            // =====================================================
            await Swal.fire({
                icon: 'error',
                title: '❌ Error de autenticación',
                html: `
                    <div style="text-align: center; margin: 20px 0;">
                        <div style="font-size: 2rem; margin-bottom: 15px;">🚫</div>
                        <p style="color: #e74c3c; font-weight: 600; margin-bottom: 10px;">
                            ${result.message || 'Credenciales incorrectas'}
                        </p>
                        <p style="color: #7f8c8d; font-size: 0.9rem;">
                            Verifica tus credenciales e intenta nuevamente
                        </p>
                    </div>
                `,
                confirmButtonText: '<i class="fas fa-redo"></i> Intentar de nuevo',
                confirmButtonColor: '#e74c3c',
                background: '#ffffff',
                color: '#2c3e50'
            });
            
            // Limpiar campos y enfocar usuario
            document.getElementById('password').value = '';
            document.getElementById('username').focus();
        }
        
    } catch (error) {
        // =====================================================
        // ERROR DE CONEXIÓN
        // =====================================================
        console.error('Error:', error);
        await Swal.fire({
            icon: 'error',
            title: '🚫 Error de conexión',
            html: `
                <div style="text-align: center; margin: 20px 0;">
                    <div style="font-size: 2rem; margin-bottom: 15px;">🌐</div>
                    <p style="color: #e74c3c; font-weight: 600; margin-bottom: 10px;">
                        No se pudo conectar con el servidor
                    </p>
                    <p style="color: #7f8c8d; font-size: 0.9rem;">
                        Verifica tu conexión a internet e intenta nuevamente
                    </p>
                </div>
            `,
            confirmButtonText: '<i class="fas fa-wifi"></i> Reintentar',
            confirmButtonColor: '#e74c3c',
            background: '#ffffff',
            color: '#2c3e50'
        });
    }
});

// =====================================================
// EVENT LISTENERS
// =====================================================

// Bienvenida inicial cuando carga la página
document.addEventListener('DOMContentLoaded', function() {
    // Toast de bienvenida sutil
    setTimeout(() => {
        Toast.fire({
            icon: 'info',
            title: '🏥 Sistema Hospitalario',
            text: 'Listo para autenticación'
        });
    }, 500);
    
    // Focus automático en el campo usuario
    document.getElementById('username').focus();
});

// Detectar Enter en los campos
document.getElementById('username').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('password').focus();
    }
});

document.getElementById('password').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('loginForm').dispatchEvent(new Event('submit'));
    }
});

// =====================================================
// RESUMEN DE REDIRECCIONES POR ROL
// =====================================================
/*
🎯 TABLA DE REDIRECCIONES:

ROL                 REDIRECCIÓN                USUARIO EJEMPLO
═══════════════════════════════════════════════════════════════
ROLE_EJECUTIVA  →   /modulos_ejecutiva         Teresa Carrillo
ROLE_MEDICO     →   /dashboard                 Dr. Alan Cairampoma  
ROLE_ADMIN      →   /dashboard                 Iker Admin
ROLE_MODERATOR  →   /dashboard                 
ROLE_USER       →   /dashboard                 
ROLE_API        →   /api-docs                  

📋 MÓDULOS POR ROL:

🏥 EJECUTIVA (Teresa):
   • Afiliación (registro pacientes)
   • Programación (horarios médicos)
   • Cupos (disponibilidad)
   • Citas (programación)
   • Hospitalización (ingresos)
   • Mantenimiento (configuración)

👨‍⚕️ MÉDICO (Alan):
   • Consultas médicas
   • Órdenes de laboratorio/radiología
   • Recetas digitales
   • Notas de evolución
   • Hospitalización (vista clínica)

⚙️ ADMIN (Iker):
   • Todos los módulos
   • Configuración del sistema
   • Gestión de usuarios
   • Reportes avanzados
*/