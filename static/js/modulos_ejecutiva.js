// =====================================================
// DASHBOARD EJECUTIVA - VERSIÓN SIMPLIFICADA
// =====================================================

let currentUser = null;

// =====================================================
// INICIALIZAR AL CARGAR
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏥 Cargando Dashboard Ejecutiva...');
    loadUserData();
    setupBasicEvents();
});

// =====================================================
// CARGAR DATOS DEL USUARIO
// =====================================================
function loadUserData() {
    try {
        const userData = localStorage.getItem('user_data');
        
        if (!userData) {
            redirectToLogin();
            return;
        }
        
        currentUser = JSON.parse(userData);
        
        // Verificar rol ejecutiva
        if (!currentUser.role || !currentUser.role.includes('EJECUTIVA')) {
            alert('Acceso denegado: No tienes permisos de ejecutiva');
            redirectToLogin();
            return;
        }
        
        updateUI();
        
    } catch (error) {
        console.error('Error cargando datos:', error);
        redirectToLogin();
    }
}

// =====================================================
// ACTUALIZAR INTERFAZ
// =====================================================
function updateUI() {
    // Avatar
    const userAvatar = document.querySelector('.user-avatar');
    if (userAvatar && currentUser.firstName && currentUser.lastName) {
        const initials = `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`;
        userAvatar.textContent = initials.toUpperCase();
    }
    
    // Nombre
    const userName = document.querySelector('.user-info > div > div:first-child');
    if (userName) {
        const displayName = currentUser.fullName || `${currentUser.firstName} ${currentUser.lastName}`;
        userName.textContent = displayName;
    }
    
    // Cargo
    const userRole = document.querySelector('.user-info > div > div:last-child');
    if (userRole && currentUser.datos_profesional_parsed) {
        const cargo = currentUser.datos_profesional_parsed.cargo || 'Ejecutiva de Admisión';
        userRole.textContent = cargo;
    }
    
    // Bienvenida
    const welcomeTitle = document.querySelector('.welcome-title');
    if (welcomeTitle) {
        const firstName = currentUser.firstName || 'Usuario';
        welcomeTitle.textContent = `¡Bienvenida ${firstName}!`;
    }
    
    console.log('✅ UI actualizada');
}

// =====================================================
// ABRIR MÓDULOS
// =====================================================
function openModule(module) {
    // Efecto visual
    const card = event.target.closest('.module-card');
    if (card) {
        card.style.transform = 'scale(0.95)';
        setTimeout(() => card.style.transform = '', 150);
    }
    
    console.log(`🎯 Abriendo: ${module}`);
    
    // Mapeo de módulos a rutas
    const moduleRoutes = {
        'afiliacion': '/medical/afiliacion',
        'programacion': '#', 
        'cupos': '#',
        'citas': '#',
        'hospitalizacion': '#',
        'mantenimiento': '#'
    };
    
    const moduleNames = {
        'afiliacion': 'Afiliación',
        'programacion': 'Programación', 
        'cupos': 'Cupos',
        'citas': 'Citas',
        'hospitalizacion': 'Hospitalización',
        'mantenimiento': 'Mantenimiento'
    };
    
    const moduleName = moduleNames[module] || module;
    const moduleRoute = moduleRoutes[module];
    
    if (module === 'afiliacion') {
        console.log('🏥 Navegando a Afiliación...');
        window.location.href = moduleRoute;
    } else {
        alert(`🚧 Módulo ${moduleName}\n\nPróximamente disponible...`);
    }
}

// =====================================================
// LOGOUT HERMOSO CON SWEETALERT2
// =====================================================
async function logout() {
    const userName = currentUser?.firstName || 'Usuario';
    
    // Confirmar logout con SweetAlert2 bonito
    const result = await Swal.fire({
        title: '🚪 Cerrar Sesión',
        html: `
            <div style="text-align: center; margin: 20px 0;">
                <div style="font-size: 3rem; margin-bottom: 20px;">👋</div>
                <p style="color: #2c5aa0; font-weight: 600; margin-bottom: 15px; font-size: 1.1rem;">
                    ¿Estás segura de que deseas cerrar sesión, ${userName}?
                </p>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p style="color: #6c757d; font-size: 0.9rem;">
                        Se cerrarán todos los módulos y deberás iniciar sesión nuevamente
                    </p>
                </div>
            </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '✅ Sí, cerrar sesión',
        cancelButtonText: '❌ Cancelar',
        confirmButtonColor: '#e74c3c',
        cancelButtonColor: '#6c757d',
        background: '#ffffff',
        color: '#2c3e50',
        reverseButtons: true
    });
    
    if (!result.isConfirmed) {
        return;
    }
    
    // Ejecutar logout hermoso
    await performLogout();
}

// =====================================================
// FUNCIÓN LOGOUT HERMOSO
// =====================================================
async function performLogout() {
    // Mostrar loading hermoso
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
        console.log('🚪 Iniciando proceso de logout...');
        
        // Limpiar datos locales
        clearAllData();

        // Llamar API de logout
        const logoutResponse = await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: currentUser?.username || 'teresa'
            })
        });

        const logoutResult = await logoutResponse.json();
        console.log('🚪 Resultado logout API:', logoutResult);

    } catch (error) {
        console.error('⚠️ Error en logout API (continuando):', error);
    }

    // Mostrar mensaje de éxito hermoso
    await Swal.fire({
        icon: 'success',
        title: '✅ Sesión cerrada',
        html: `
            <div style="text-align: center; margin: 20px 0;">
                <div style="font-size: 2.5rem; margin-bottom: 15px;">👋</div>
                <p style="color: #00a86b; font-weight: 600; margin-bottom: 10px;">
                    ¡Hasta luego ${currentUser?.firstName || 'Usuario'}!
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

// =====================================================
// FUNCIÓN MEJORADA PARA LIMPIAR DATOS
// =====================================================
function clearAllData() {
    try {
        console.log('🧹 Limpiando todos los datos...');
        
        // Limpiar localStorage completamente
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('last_activity');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('session_data');
        
        // Limpiar sessionStorage completamente
        sessionStorage.clear();
        
        // Limpiar variables globales
        currentUser = null;
        
        // Limpiar cookies si existen (opcional)
        document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        console.log('✅ Todos los datos limpiados');
        
    } catch (error) {
        console.error('💥 Error limpiando datos:', error);
    }
}

// =====================================================
// REDIRECCIÓN A LOGIN
// =====================================================
function redirectToLogin() {
    setTimeout(() => {
        window.location.href = '/login';
    }, 500);
}

// =====================================================
// EVENTOS BÁSICOS
// =====================================================
function setupBasicEvents() {
    // Efecto de carga
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
    
    // Logout con Ctrl+ESC
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && event.ctrlKey) {
            logout();
        }
    });
    
    console.log('✅ Eventos configurados');
}

// =====================================================
// UTILIDADES
// =====================================================
function getCurrentUser() {
    return currentUser;
}

// =====================================================
// FUNCIONES PARA DEBUG
// =====================================================
window.getCurrentUser = getCurrentUser;

console.log('🚀 Dashboard Ejecutiva Simple - Listo');