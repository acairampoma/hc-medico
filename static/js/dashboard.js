/**
 * DASHBOARD JS - HOSPITAL MANAGEMENT SYSTEM
 * Lógica principal del dashboard médico
 */

// ========================================
// VARIABLES GLOBALES
// ========================================
let currentUser = null;
let currentUsername = null;

// ========================================
// INICIALIZACIÓN DEL DASHBOARD
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏥 Iniciando Dashboard Médico...');
    
    // Verificar token de acceso
    if (!checkTokenOnLoad()) {
        console.log('❌ Token no válido, redirigiendo...');
        return;
    }
    
    // Debug de cookies
    debugCookies();
    
    // Inicializar componentes del dashboard
    initializeDashboard();
});

/**
 * Inicializa todos los componentes del dashboard
 */
async function initializeDashboard() {
    try {
        await loadUserData();
        animateNumbers();
        updateActivityTimes();
        setupNotifications();
        setupSearchBar();
        
        console.log('✅ Dashboard inicializado correctamente');
    } catch (error) {
        console.error('❌ Error inicializando dashboard:', error);
    }
}

// ========================================
// GESTIÓN DE AUTENTICACIÓN
// ========================================

/**
 * Verifica el token al cargar la página
 */
function checkTokenOnLoad() {
    console.log('🔍 Verificando token al cargar dashboard...');
    
    const cookieToken = getCookieValue('access_token');
    const localToken = localStorage.getItem('access_token') || 
                      sessionStorage.getItem('access_token') ||
                      window.authToken;
    
    const token = cookieToken || localToken;
    
    if (!token) {
        console.log('❌ No hay token disponible');
        window.location.href = '/login';
        return false;
    }
    
    console.log('✅ Token encontrado:', token.substring(0, 20) + '...');
    return true;
}

/**
 * Obtiene el valor de una cookie específica
 */
function getCookieValue(name) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split('=');
        if (cookieName === name) {
            return cookieValue;
        }
    }
    return null;
}

/**
 * Debug de cookies disponibles
 */
function debugCookies() {
    console.log('🍪 === DEBUG COOKIES ===');
    console.log('🍪 document.cookie completo:', document.cookie);
    console.log('🍪 access_token específico:', getCookieValue('access_token'));
    console.log('🍪 ========================');
}

/**
 * Extrae el username de la sesión actual
 */
function extractUsernameFromSession() {
    try {
        // Intentar obtener de localStorage
        const userCompleto = localStorage.getItem('userCompleto');
        if (userCompleto) {
            const user = JSON.parse(userCompleto);
            if (user.username) {
                console.log('👤 Username desde localStorage:', user.username);
                return user.username;
            }
        }
        
        // Intentar obtener de sessionStorage 
        const sessionUser = sessionStorage.getItem('currentUser');
        if (sessionUser) {
            const user = JSON.parse(sessionUser);
            if (user.username) {
                console.log('👤 Username desde sessionStorage:', user.username);
                return user.username;
            }
        }
        
        // Intentar obtener de cookies
        const username = getCookieValue('username');
        if (username) {
            console.log('👤 Username desde cookie:', username);
            return username;
        }
        
        console.log('⚠️ No se encontró username en sesión, usando fallback');
        return null;
        
    } catch (error) {
        console.error('❌ Error extrayendo username:', error);
        return null;
    }
}

// ========================================
// GESTIÓN DE DATOS DE USUARIO
// ========================================

/**
 * Carga los datos del usuario desde la API
 */
async function loadUserData() {
    try {
        console.log('📥 Cargando datos del usuario...');
        
        // Extraer username de la sesión o usar fallback
        currentUsername = extractUsernameFromSession() || 'admin';
        console.log('👤 Username detectado:', currentUsername);
        
        // Llamar al endpoint correcto del ms-usuario
        const response = await fetch(`/api/user/${currentUsername}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const apiResponse = await response.json();
        console.log('📦 Respuesta ms-usuario:', apiResponse);
        console.log('🔍 DEBUGGING EXTREMO apiResponse:');
        console.log('🔍 apiResponse tipo:', typeof apiResponse);
        console.log('🔍 apiResponse.success:', apiResponse.success);
        console.log('🔍 apiResponse.data:', apiResponse.data);
        console.log('🔍 apiResponse.user:', apiResponse.user);
        console.log('🔍 apiResponse keys:', Object.keys(apiResponse));
        
        // Verificar estructura de la nueva respuesta apiResponse
        if (apiResponse.success && apiResponse.data) {
            console.log('✅ Datos encontrados en apiResponse.data');
            currentUser = apiResponse.data;
            updateUserInterface(apiResponse.data);
        } else if (apiResponse.success && apiResponse.user) {
            console.log('✅ Datos encontrados en apiResponse.user');
            currentUser = apiResponse.user;
            updateUserInterface(apiResponse.user);
        } else if (apiResponse.user) {
            console.log('✅ Datos encontrados directamente en user');
            currentUser = apiResponse.user;
            updateUserInterface(apiResponse.user);
        } else if (apiResponse.data) {
            console.log('✅ Datos encontrados directamente en data');
            currentUser = apiResponse.data;
            updateUserInterface(apiResponse.data);
        } else {
            console.warn('⚠️ Respuesta sin datos:', apiResponse);
            updateUserInterface(null);
        }
        
    } catch (error) {
        console.error('❌ Error cargando datos del usuario:', error);
        updateUserInterface(null);
    }
}

/**
 * Actualiza la interfaz con los datos del usuario desde ms-usuario
 */
function updateUserInterface(userData) {
    try {
        let displayName = 'Usuario';
        let role = 'Usuario del Sistema';
        let welcomeMessage = '¡Bienvenido al Sistema Hospitalario! 🏥';

        if (userData) {
            console.log('📦 Procesando datos del ms-usuario:', userData);
            
            // Extraer datos del usuario desde la nueva estructura apiResponse
            const firstName = userData.firstName || userData.first_name || '';
            const lastName = userData.lastName || userData.last_name || '';
            const username = userData.username || '';
            const email = userData.email || '';
            
            // Construir nombre para display
            if (firstName && lastName) {
                displayName = `Dr. ${firstName} ${lastName}`.trim();
                welcomeMessage = `¡Bienvenido Dr. ${firstName} ${lastName}! 🏥`;
            } else if (firstName) {
                displayName = `Dr. ${firstName}`;
                welcomeMessage = `¡Bienvenido Dr. ${firstName}! 🏥`;
            } else if (lastName) {
                displayName = `Dr. ${lastName}`;
                welcomeMessage = `¡Bienvenido Dr. ${lastName}! 🏥`;
            } else if (username) {
                // 🔥 USAR USERNAME CUANDO NO HAY NOMBRES
                const capitalizedUsername = username.charAt(0).toUpperCase() + username.slice(1);
                displayName = capitalizedUsername;
                welcomeMessage = `¡Bienvenido ${capitalizedUsername}! 🏥`;
            }
            
            // 🔑 EXTRAER ROL desde la nueva estructura del ms-usuario
            role = extractUserRole(userData);
            
            // 💾 CREAR Y GUARDAR userCompleto con la nueva estructura
            createUserCompletoFromApiResponse(userData);
            
        } else {
            console.warn('⚠️ No hay datos de usuario, usando valores por defecto');
        }

        // Actualizar elementos del DOM
        updateDOMElements(displayName, role, welcomeMessage);

        console.log('✅ Interfaz actualizada para:', displayName, '| Rol:', role);

    } catch (error) {
        console.error('❌ Error actualizando interfaz:', error);
        // Fallback en caso de error
        updateDOMElements('Usuario', 'Usuario del Sistema', '¡Bienvenido! 🏥');
    }
}

/**
 * Actualiza los elementos del DOM con la información del usuario
 */
function updateDOMElements(displayName, role, welcomeMessage) {
    console.log('🎨 === ACTUALIZANDO DOM ===');
    console.log('🎨 displayName:', displayName);
    console.log('🎨 role:', role);
    console.log('🎨 welcomeMessage:', welcomeMessage);
    
    const userNameElement = document.getElementById('userName');
    const userRoleElement = document.getElementById('userRole');
    const welcomeMessageElement = document.getElementById('welcomeMessage');
    const welcomeSubtextElement = document.getElementById('welcomeSubtext');
    
    console.log('🎨 userNameElement:', userNameElement);
    console.log('🎨 userRoleElement:', userRoleElement);
    console.log('🎨 welcomeMessageElement:', welcomeMessageElement);
    console.log('🎨 welcomeSubtextElement:', welcomeSubtextElement);

    if (userNameElement) {
        userNameElement.textContent = displayName;
        console.log('✅ userName actualizado a:', displayName);
    } else {
        console.error('❌ No se encontró elemento #userName');
    }
    
    if (userRoleElement) {
        userRoleElement.textContent = role;
        console.log('✅ userRole actualizado a:', role);
    } else {
        console.error('❌ No se encontró elemento #userRole');
    }
    
    if (welcomeMessageElement) {
        welcomeMessageElement.textContent = welcomeMessage;
        console.log('✅ welcomeMessage actualizado a:', welcomeMessage);
    } else {
        console.error('❌ No se encontró elemento #welcomeMessage');
    }
    
    if (welcomeSubtextElement) {
        welcomeSubtextElement.textContent = `Sistema funcionando perfectamente - ${new Date().toLocaleDateString()}`;
        console.log('✅ welcomeSubtext actualizado');
    } else {
        console.error('❌ No se encontró elemento #welcomeSubtext');
    }
    
    console.log('🎨 === DOM ACTUALIZADO ===');
}

/**
 * Extrae el rol del usuario desde la nueva estructura del ms-usuario
 */
function extractUserRole(userData) {
    try {
        console.log('🔑 Extrayendo rol del usuario...', userData);
        
        // Buscar en diferentes posibles estructuras del rol
        let userRole = null;
        
        // Opción 1: Array de roles (formato Spring Security)
        if (userData.roles && Array.isArray(userData.roles)) {
            const roles = userData.roles;
            console.log('🔑 Roles encontrados (array):', roles);
            
            if (roles.includes('ROLE_ADMIN') || roles.includes('ADMIN')) {
                userRole = 'Administrador del Sistema';
            } else if (roles.includes('ROLE_DOCTOR') || roles.includes('DOCTOR')) {
                userRole = 'Médico Especialista';
            } else if (roles.includes('ROLE_NURSE') || roles.includes('NURSE')) {
                userRole = 'Enfermero/a Profesional';
            } else {
                userRole = 'Usuario del Sistema';
            }
        }
        // Opción 2: Campo role directo
        else if (userData.role) {
            console.log('🔑 Rol encontrado (string):', userData.role);
            
            const roleMap = {
                'admin': 'Administrador del Sistema',
                'doctor': 'Médico Especialista', 
                'nurse': 'Enfermero/a Profesional',
                'user': 'Usuario del Sistema',
                'ADMIN': 'Administrador del Sistema',
                'DOCTOR': 'Médico Especialista',
                'NURSE': 'Enfermero/a Profesional'
            };
            userRole = roleMap[userData.role] || 'Usuario del Sistema';
        }
        // Opción 3: Dentro de authorities
        else if (userData.authorities && Array.isArray(userData.authorities)) {
            const authorities = userData.authorities;
            console.log('🔑 Authorities encontradas:', authorities);
            
            const hasRole = (role) => authorities.some(auth => 
                auth.authority === role || auth === role
            );
            
            if (hasRole('ROLE_ADMIN') || hasRole('ADMIN')) {
                userRole = 'Administrador del Sistema';
            } else if (hasRole('ROLE_DOCTOR') || hasRole('DOCTOR')) {
                userRole = 'Médico Especialista';
            } else if (hasRole('ROLE_NURSE') || hasRole('NURSE')) {
                userRole = 'Enfermero/a Profesional';
            } else {
                userRole = 'Usuario del Sistema';
            }
        }
        
        // Fallback
        if (!userRole) {
            console.warn('⚠️ No se pudo determinar el rol, usando por defecto');
            userRole = 'Usuario del Sistema';
        }
        
        console.log('✅ Rol extraído:', userRole);
        return userRole;
        
    } catch (error) {
        console.error('❌ Error extrayendo rol:', error);
        return 'Usuario del Sistema';
    }
}

/**
 * Crea y guarda el objeto userCompleto desde datos detallados
 */
function createUserCompleto(detailedUser) {
    try {
        console.log('🔄 Creando userCompleto desde datos detallados...');
        console.log('📥 Datos originales:', detailedUser);
        
        // 🧹 LIMPIAR Y FORMATEAR datos
        const userCompleto = {
            id: detailedUser.id,
            username: detailedUser.username,
            email: detailedUser.email,
            firstName: detailedUser.firstName,
            lastName: detailedUser.lastName,
            enabled: detailedUser.enabled,
            roles: detailedUser.roles || [],
            // 🔄 PARSEAR datosProfesional de string a objeto
            datosProfesional: detailedUser.datosProfesional || '{}',
            datosProfesional_parsed: parseDatosProfesional(detailedUser.datosProfesional)
            // ❌ NO incluir password por seguridad
        };
        
        console.log('✅ Datos limpiados:', userCompleto);
        
        // Guardar en localStorage
        localStorage.setItem('userCompleto', JSON.stringify(userCompleto));
        
        console.log('✅ userCompleto guardado desde microservicio');
        return userCompleto;
        
    } catch (error) {
        console.error('❌ Error creando userCompleto:', error);
        return null;
    }
 }
 
 /**
 * Parsea los datos profesionales de string a objeto
 */
 function parseDatosProfesional(datosProfesionalString) {
    try {
        if (!datosProfesionalString || datosProfesionalString === '{}') {
            return {};
        }
        
        const parsed = JSON.parse(datosProfesionalString);
        console.log('🏥 Datos profesionales parseados:', parsed);
        return parsed;
        
    } catch (error) {
        console.error('❌ Error parseando datosProfesional:', error);
        return {};
    }
 }

/**
 * 🔄 NUEVA FUNCIÓN: Crea userCompleto desde la nueva estructura apiResponse
 */
function createUserCompletoFromApiResponse(userData) {
    try {
        console.log('🔄 Creando userCompleto desde nueva apiResponse...', userData);
        
        // 🧙 LIMPIAR Y FORMATEAR datos desde la nueva estructura
        const userCompleto = {
            id: userData.id || userData.user_id || 'unknown',
            username: userData.username || 'unknown',
            email: userData.email || '',
            firstName: userData.firstName || userData.first_name || '',
            lastName: userData.lastName || userData.last_name || '',
            enabled: userData.enabled !== undefined ? userData.enabled : true,
            
            // 🔑 EXTRAER ROLES desde diferentes posibles estructuras
            roles: extractRolesArray(userData),
            
            // 👨‍⚕️ DATOS PROFESIONALES
            datosProfesional: userData.datosProfesional || userData.datosprofesional || '{}',
            datosProfesional_parsed: parseDatosProfesional(
                userData.datosProfesional || userData.datosprofesional || '{}'
            ),
            
            // 🔥 METADATOS Útiles para el dashboard
            displayRole: extractUserRole(userData),
            lastLogin: userData.lastLogin || userData.last_login || null,
            createdAt: userData.createdAt || userData.created_at || null,
            
            // 📅 TIMESTAMP de actualización
            updatedAt: new Date().toISOString()
        };
        
        console.log('✅ userCompleto desde apiResponse:', userCompleto);
        
        // 💾 GUARDAR en localStorage
        localStorage.setItem('userCompleto', JSON.stringify(userCompleto));
        
        // 📊 GUARDAR TAMBIÉN datos originales para debug
        localStorage.setItem('userRawData', JSON.stringify(userData));
        
        console.log('✅ userCompleto guardado exitosamente desde ms-usuario');
        return userCompleto;
        
    } catch (error) {
        console.error('❌ Error creando userCompleto desde apiResponse:', error);
        return null;
    }
}

/**
 * Extrae array de roles desde diferentes estructuras posibles
 */
function extractRolesArray(userData) {
    try {
        // Opción 1: Ya es array
        if (userData.roles && Array.isArray(userData.roles)) {
            return userData.roles;
        }
        
        // Opción 2: String único
        if (userData.role && typeof userData.role === 'string') {
            return [userData.role];
        }
        
        // Opción 3: Desde authorities
        if (userData.authorities && Array.isArray(userData.authorities)) {
            return userData.authorities.map(auth => 
                auth.authority || auth
            );
        }
        
        // Fallback
        return ['ROLE_USER'];
        
    } catch (error) {
        console.error('❌ Error extrayendo roles array:', error);
        return ['ROLE_USER'];
    }
}

/**
 * Crea userCompleto desde datos de sesión básicos
 */
function createUserCompletoFromSession(sessionUser) {
    try {
        console.log('🔄 Creando userCompleto desde datos de sesión...');
        
        const userCompleto = {
            id: sessionUser.user_id || 'unknown',
            username: sessionUser.username || 'unknown',
            email: sessionUser.email || '',
            firstName: sessionUser.firstName || '',
            lastName: sessionUser.lastName || '',
            enabled: true,
            roles: [sessionUser.role === 'admin' ? 'ROLE_ADMIN' : 'ROLE_USER'],
            datosProfesional: '{}',
            datosProfesional_parsed: {}
        };
        
        localStorage.setItem('userCompleto', JSON.stringify(userCompleto));
        
        console.log('✅ userCompleto básico guardado desde sesión');
        return userCompleto;
        
    } catch (error) {
        console.error('❌ Error creando userCompleto desde sesión:', error);
        return null;
    }
}

// ========================================
// GESTIÓN DE LOGOUT
// ========================================

/**
 * Maneja el proceso de logout con confirmación
 */
async function logout() {
    try {
        const result = await Swal.fire({
            title: '🚪 Cerrar Sesión',
            html: `
                <div style="text-align: center; margin: 20px 0;">
                    <p style="color: #2c5aa0; font-weight: 600; margin-bottom: 15px;">
                        ¿Estás seguro que deseas cerrar sesión?
                    </p>
                    <p style="color: #7f8c8d; font-size: 0.9rem;">
                        Se cerrará tu sesión y se destruirá el token de acceso
                    </p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-sign-out-alt"></i> Sí, cerrar sesión',
            cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#7f8c8d'
        });

        if (result.isConfirmed) {
            await performLogout();
        }

    } catch (error) {
        console.error('💥 Error en logout:', error);
        // En caso de error, limpiar todo igual
        clearAllData();
        window.location.href = '/login';
    }
}

/**
 * Ejecuta el proceso de logout
 */
async function performLogout() {
    // Mostrar loading
    Swal.fire({
        title: '🔐 Cerrando sesión...',
        html: `
            <div style="display: flex; align-items: center; justify-content: center; margin: 20px 0;">
                <div style="margin-right: 15px;">
                    <i class="fas fa-sign-out-alt fa-2x" style="color: #e74c3c;"></i>
                </div>
                <div>
                    <p style="color: #2c5aa0; font-weight: 600; margin-bottom: 5px;">Destruyendo token...</p>
                    <p style="color: #7f8c8d; font-size: 0.9rem;">Limpiando datos locales</p>
                </div>
            </div>
        `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        // Limpiar datos locales
        clearAllData();

        // Llamar API de logout
        const logoutResponse = await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: currentUsername || 'admin'
            })
        });

        const logoutResult = await logoutResponse.json();
        console.log('🚪 Resultado logout API:', logoutResult);

    } catch (error) {
        console.error('⚠️ Error en logout API (continuando):', error);
    }

    // Mostrar mensaje de éxito
    await Swal.fire({
        icon: 'success',
        title: '✅ Sesión cerrada',
        html: `
            <div style="text-align: center; margin: 20px 0;">
                <div style="font-size: 2.5rem; margin-bottom: 15px;">👋</div>
                <p style="color: #00a86b; font-weight: 600; margin-bottom: 10px;">
                    ¡Hasta luego!
                </p>
                <p style="color: #2c5aa0; margin-bottom: 5px;">Datos limpiados correctamente</p>
                <p style="color: #7f8c8d; font-size: 0.9rem;">Redirigiendo al login...</p>
            </div>
        `,
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false
    });

    // Redirección
    console.log('🔄 Redirigiendo a login...');
    window.location.href = '/login';
}

/**
 * Limpia todos los datos almacenados
 */
function clearAllData() {
    console.log('🧹 Limpiando localStorage y sessionStorage...');
    
    localStorage.clear();
    sessionStorage.clear();
    
    // Limpiar variables globales
    window.authToken = null;
    window.currentUser = null;
    window.currentUsername = null;
    currentUser = null;
    currentUsername = null;
    
    console.log('✅ Storage limpiado completamente');
}

// ========================================
// ANIMACIONES Y EFECTOS VISUALES
// ========================================

/**
 * Anima los números de las estadísticas
 */
function animateNumbers() {
    const numbers = document.querySelectorAll('.stat-number');
    numbers.forEach(num => {
        const target = parseInt(num.textContent.replace(/,/g, ''));
        let count = 0;
        const increment = target / 50;
        
        const timer = setInterval(() => {
            count += increment;
            if (count >= target) {
                num.textContent = target.toLocaleString();
                clearInterval(timer);
            } else {
                num.textContent = Math.floor(count).toLocaleString();
            }
        }, 30);
    });
}

// ========================================
// FUNCIONALIDADES DEL DASHBOARD
// ========================================

/**
 * Actualiza los tiempos de actividad
 */
function updateActivityTimes() {
    console.log('🔄 Actualizando tiempos de actividad...');
    // Aquí se conectaría con la API Java para obtener actividades reales
}

/**
 * Configura las notificaciones
 */
function setupNotifications() {
    const notificationIcons = document.querySelectorAll('.notification-icon');
    notificationIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            console.log('🔔 Mostrando notificaciones...');
            // Aquí se implementaría el dropdown de notificaciones
        });
    });
}

/**
 * Configura la barra de búsqueda
 */
function setupSearchBar() {
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                console.log('🔍 Buscando:', this.value);
                // Aquí se implementaría la funcionalidad de búsqueda
            }
        });
    }
}

// ========================================
// UTILIDADES
// ========================================

/**
 * Transfiere el token para otras páginas
 */
function transferToken() {
    const token = localStorage.getItem('access_token') || 
                  sessionStorage.getItem('access_token') ||
                  localStorage.getItem('token');
    
    if (token) {
        localStorage.setItem('access_token', token);
        sessionStorage.setItem('access_token', token);
        window.authToken = token;
        console.log('✅ Token transferido correctamente');
    }
}

/**
 * Maneja errores de la aplicación
 */
function handleError(error, context = '') {
    console.error(`❌ Error ${context}:`, error);
    
    // Aquí se podría implementar un sistema de notificaciones de error
    // Por ejemplo, mostrar un toast o notification
}

// ========================================
// EVENTOS GLOBALES
// ========================================

/**
 * Maneja errores no capturados
 */
window.addEventListener('error', function(e) {
    handleError(e.error, 'no capturado');
});

/**
 * Maneja promesas rechazadas
 */
window.addEventListener('unhandledrejection', function(e) {
    handleError(e.reason, 'promesa rechazada');
});

console.log('✅ Dashboard JS cargado correctamente');