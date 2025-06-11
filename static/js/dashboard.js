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

// ========================================
// GESTIÓN DE DATOS DE USUARIO
// ========================================

/**
 * Carga los datos del usuario desde la API
 */
async function loadUserData() {
    try {
        console.log('📥 Cargando datos del usuario...');
        
        // Por ahora usamos 'admin', en producción vendría de la sesión
        currentUsername = 'admin';
        
        // Intentar obtener datos detallados del usuario
        const response = await fetch(`/api/user/${currentUsername}/detailed`);
        const result = await response.json();
        
        if (result.success && result.user_detailed) {
            currentUser = result.user_detailed;
            updateUserInterface(result.user_detailed, result.user_session);
        } else {
            // Fallback a datos básicos
            const basicResponse = await fetch(`/api/user/${currentUsername}`);
            const basicResult = await basicResponse.json();
            
            if (basicResult.success) {
                updateUserInterface(null, basicResult.user);
            }
        }
    } catch (error) {
        console.error('❌ Error cargando datos del usuario:', error);
        updateUserInterface(null, null);
    }
}

/**
 * Actualiza la interfaz con los datos del usuario
 */
function updateUserInterface(detailedUser, sessionUser) {
    try {
        let displayName = 'Usuario';
        let role = 'Usuario del Sistema';
        let welcomeMessage = '¡Bienvenido al Sistema Hospitalario! 🏥';

        if (detailedUser) {
            // Usar datos del microservicio
            const firstName = detailedUser.firstName || '';
            const lastName = detailedUser.lastName || '';
            displayName = `Dr. ${firstName} ${lastName}`.trim();
            
            // Determinar rol display
            const roles = detailedUser.roles || [];
            if (roles.includes('ROLE_ADMIN')) {
                role = 'Administrador del Sistema';
            } else if (roles.includes('ROLE_DOCTOR')) {
                role = 'Médico Especialista';
            } else if (roles.includes('ROLE_NURSE')) {
                role = 'Enfermero/a Profesional';
            }
            
            welcomeMessage = `¡Bienvenido Dr. ${firstName} ${lastName}! 🏥`;
            
            // Crear y guardar userCompleto
            createUserCompleto(detailedUser);
            
        } else if (sessionUser) {
            // Usar datos de la sesión
            displayName = sessionUser.name || 'Usuario';
            const userRole = sessionUser.role || 'user';
            
            const roleMap = {
                'admin': 'Administrador del Sistema',
                'doctor': 'Médico Especialista',
                'nurse': 'Enfermero/a Profesional',
                'user': 'Usuario del Sistema'
            };
            role = roleMap[userRole] || 'Usuario del Sistema';
            
            welcomeMessage = `¡Bienvenido ${displayName}! 🏥`;
            
            // Crear userCompleto con datos de sesión
            createUserCompletoFromSession(sessionUser);
        }

        // Actualizar elementos del DOM
        updateDOMElements(displayName, role, welcomeMessage);

        console.log('✅ Interfaz actualizada para:', displayName);

    } catch (error) {
        console.error('❌ Error actualizando interfaz:', error);
    }
}

/**
 * Actualiza los elementos del DOM con la información del usuario
 */
function updateDOMElements(displayName, role, welcomeMessage) {
    const userNameElement = document.getElementById('userName');
    const userRoleElement = document.getElementById('userRole');
    const welcomeMessageElement = document.getElementById('welcomeMessage');
    const welcomeSubtextElement = document.getElementById('welcomeSubtext');

    if (userNameElement) userNameElement.textContent = displayName;
    if (userRoleElement) userRoleElement.textContent = role;
    if (welcomeMessageElement) welcomeMessageElement.textContent = welcomeMessage;
    if (welcomeSubtextElement) {
        welcomeSubtextElement.textContent = `Sistema funcionando perfectamente - ${new Date().toLocaleDateString()}`;
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