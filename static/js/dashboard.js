/**
 * 🏥 IA MEDICAL SOLUTIONS - Dashboard JavaScript
 * Sistema Hospitalario con Inteligencia Artificial
 */

// ✅ FUNCIÓN PARA CARGAR DATOS DEL USUARIO (reutilizable)
function loadUserData() {
    console.log('🔥 Cargando datos del usuario desde localStorage...');
    
    // Obtener todos los datos del localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const railwayData = JSON.parse(localStorage.getItem('railway_user_data') || '{}');
    
    console.log('📦 localStorage user:', userData);
    console.log('🚂 localStorage railway_data:', railwayData);
    
    // Intentar obtener el nombre desde varios campos disponibles
    let displayName = '';
    
    if (userData.displayName) {
        displayName = userData.displayName;
    } else if (userData.firstName && userData.lastName) {
        displayName = `Dr. ${userData.firstName} ${userData.lastName}`;
    } else if (userData.first_name && userData.last_name) {
        displayName = `Dr. ${userData.first_name} ${userData.last_name}`;
    } else if (userData.fullName) {
        displayName = `Dr. ${userData.fullName}`;
    } else if (userData.name) {
        displayName = `Dr. ${userData.name}`;
    } else {
        displayName = 'Dr. Usuario';
    }
    
    const doctorNameElement = document.getElementById('doctorName');
    if (doctorNameElement) {
        doctorNameElement.textContent = displayName;
        console.log('✅ Nombre actualizado:', displayName);
    }
    
    // Cargar avatar
    loadUserAvatar(userData, railwayData);
    
    return { userData, railwayData, displayName };
}

// ✅ FUNCIÓN PARA CARGAR AVATAR (reutilizable)
function loadUserAvatar(userData, railwayData) {
    
    // 🔥 CARGAR AVATAR DESDE RAILWAY/CLOUDINARY - MEJORADO
    let avatarUrl = null;
    
    // Buscar la URL del avatar en diferentes ubicaciones
    if (userData.foto_url) {
        avatarUrl = userData.foto_url;
        console.log('🖼️ Avatar encontrado en userData.foto_url:', avatarUrl);
    } else if (railwayData.foto_url) {
        avatarUrl = railwayData.foto_url;
        console.log('🖼️ Avatar encontrado en railwayData.foto_url:', avatarUrl);
    } else if (userData.avatar_url) {
        avatarUrl = userData.avatar_url;
        console.log('🖼️ Avatar encontrado en userData.avatar_url:', avatarUrl);
    } else if (userData.photoUrl) {
        avatarUrl = userData.photoUrl;
        console.log('🖼️ Avatar encontrado en userData.photoUrl:', avatarUrl);
    }
    
    // Si encontramos una URL de avatar, mostrarla
    if (avatarUrl) {
        const userAvatarDiv = document.querySelector('.user-avatar');
        
        if (userAvatarDiv) {
            // Crear o actualizar la imagen del avatar
            let avatarImg = userAvatarDiv.querySelector('img');
            const avatarIcon = userAvatarDiv.querySelector('i');
            
            if (!avatarImg) {
                // Crear elemento img si no existe
                avatarImg = document.createElement('img');
                avatarImg.style.width = '100%';
                avatarImg.style.height = '100%';
                avatarImg.style.borderRadius = '50%';
                avatarImg.style.objectFit = 'cover';
                userAvatarDiv.insertBefore(avatarImg, userAvatarDiv.firstChild);
            }
            
            // Configurar la imagen
            avatarImg.src = avatarUrl;
            avatarImg.alt = `Foto ${displayName}`;
            avatarImg.style.display = 'block';
            
            // Ocultar el icono de respaldo
            if (avatarIcon) {
                avatarIcon.style.display = 'none';
            }
            
            // Manejar error de carga
            avatarImg.onerror = function() {
                console.log('❌ Error cargando avatar, mostrando icono de respaldo');
                this.style.display = 'none';
                if (avatarIcon) avatarIcon.style.display = 'block';
            };
            
            console.log('✅ Avatar configurado exitosamente:', avatarUrl);
        }
    } else {
        console.log('⚠️ No se encontró URL de avatar en ninguna ubicación del localStorage');
        console.log('🔍 Datos disponibles en userData:', Object.keys(userData));
        console.log('🔍 Datos disponibles en railwayData:', Object.keys(railwayData));
    }
}

// ✅ INICIALIZACIÓN PRINCIPAL DEL DASHBOARD
document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos iniciales
    loadUserData();
    
    // ✅ LISTENER PARA ACTUALIZACIONES EN TIEMPO REAL DESDE PROFILE
    document.addEventListener('userDataUpdated', function(event) {
        console.log('🔄 Recibida actualización de datos desde profile:', event.detail);
        
        const { userData, railwayData } = event.detail;
        
        // Actualizar nombre de bienvenida inmediatamente
        let displayName = '';
        
        if (userData.displayName) {
            displayName = userData.displayName;
        } else if (userData.firstName && userData.lastName) {
            displayName = `Dr. ${userData.firstName} ${userData.lastName}`;
        } else if (userData.first_name && userData.last_name) {
            displayName = `Dr. ${userData.first_name} ${userData.last_name}`;
        } else if (userData.fullName) {
            displayName = `Dr. ${userData.fullName}`;
        } else if (userData.name) {
            displayName = `Dr. ${userData.name}`;
        } else {
            displayName = 'Dr. Usuario';
        }
        
        const doctorNameElement = document.getElementById('doctorName');
        if (doctorNameElement) {
            doctorNameElement.textContent = displayName;
            console.log('✅ Nombre actualizado dinámicamente:', displayName);
        }
        
        // Actualizar avatar inmediatamente
        loadUserAvatar(userData, railwayData);
        
        console.log('🔥 Dashboard actualizado en tiempo real exitosamente!');
    });
    
    // ✅ LISTENER PARA DETECTAR CAMBIOS EN localStorage (fallback)
    window.addEventListener('storage', function(event) {
        if (event.key === 'user' || event.key === 'railway_user_data') {
            console.log('🔄 Detectado cambio en localStorage, recargando datos...');
            setTimeout(() => {
                loadUserData();
            }, 100);
        }
    });
});


// Switch entre tabs
function switchTab(tabName) {
    // Remover active de todos los tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Activar tab seleccionado
    event.target.closest('.tab-btn').classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

// Logout function mejorada
async function logout() {
    const result = await Swal.fire({
        title: '¿Cerrar Sesión?',
        text: '¿Estás seguro que deseas salir del sistema?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        // Mostrar loading
        Swal.fire({
            title: 'Cerrando sesión...',
            text: 'Por favor espere',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const token = localStorage.getItem('token') || localStorage.getItem('access_token');
            
            if (token) {
                const response = await fetch('/api/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    console.log('✅ Logout exitoso en servidor');
                }
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        } finally {
            // Limpiar todo el localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            localStorage.removeItem('authToken');
            localStorage.removeItem('session_token');
            localStorage.removeItem('user_info');
            
            // Limpiar sessionStorage también
            sessionStorage.clear();
            
            // Limpiar cookies del lado cliente si existen
            document.cookie.split(";").forEach(function(c) { 
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
            });
            
            // Mostrar mensaje de éxito
            await Swal.fire({
                icon: 'success',
                title: 'Sesión cerrada',
                text: 'Has salido exitosamente del sistema',
                timer: 1500,
                showConfirmButton: false
            });
            
            // Redirigir al login
            window.location.href = '/';
        }
    }
}

// Animación de números
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        element.textContent = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Animar valores al cargar
window.addEventListener('load', () => {
    document.querySelectorAll('.indicator-value').forEach(element => {
        const value = parseInt(element.textContent);
        if (!isNaN(value)) {
            animateValue(element, 0, value, 1000);
        }
    });
});

// ===== PROFILE DROPDOWN FUNCTIONALITY =====
document.addEventListener('DOMContentLoaded', function() {
    const profileMenuBtn = document.getElementById('profileMenuBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    
    if (profileMenuBtn && profileDropdown) {
        // Toggle dropdown
        profileMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const isVisible = profileDropdown.style.display === 'block';
            profileDropdown.style.display = isVisible ? 'none' : 'block';
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!profileMenuBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.style.display = 'none';
            }
        });
        
        // NO interferir con enlaces - dejar que naveguen naturalmente
        // Los enlaces <a href="/profile"> deben funcionar sin interferencia
    }
});