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
    loadUserAvatar(userData, railwayData, displayName);
    
    return { userData, railwayData, displayName };
}

// ✅ FUNCIÓN PARA CARGAR AVATAR (reutilizable)
function loadUserAvatar(userData, railwayData, displayName = 'Usuario') {
    console.log('🔍 BUSCANDO FOTO DE USUARIO...');
    console.log('   userData.foto_url:', userData?.foto_url);
    console.log('   railwayData.foto_url:', railwayData?.foto_url);
    
    // 🔥 CARGAR AVATAR DESDE RAILWAY/CLOUDINARY - MEJORADO
    let avatarUrl = null;
    
    // 🆕 PRIORIDAD 1: Buscar foto temporal actualizada desde el profile
    const tempPhotoUrl = localStorage.getItem('temp_new_photo_url');
    const photoUpdatedAt = localStorage.getItem('photo_updated_at');
    
    if (tempPhotoUrl) {
        console.log('🔥 FOTO TEMPORAL ENCONTRADA:', tempPhotoUrl);
        avatarUrl = tempPhotoUrl;
        
        // Actualizar los datos en memoria y localStorage
        userData.foto_url = tempPhotoUrl;
        railwayData.foto_url = tempPhotoUrl;
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('railway_user_data', JSON.stringify(railwayData));
        
        // Limpiar temporales
        localStorage.removeItem('temp_new_photo_url');
        localStorage.removeItem('photo_updated_at');
        
        console.log('✅ Foto temporal aplicada y localStorage actualizado');
    }
    
    // PRIORIDAD 2: Usar la foto de userData o railwayData
    if (!avatarUrl) {
        // Revisar todas las posibles ubicaciones
        avatarUrl = userData?.foto_url || 
                   railwayData?.foto_url || 
                   userData?.avatar_url || 
                   userData?.photoUrl || 
                   userData?.photo_url ||
                   railwayData?.photo_url;
                   
        if (avatarUrl) {
            console.log('🖼️ Avatar encontrado:', avatarUrl);
        } else {
            console.log('⚠️ No se encontró avatar URL en ninguna ubicación');
        }
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
            
            // Configurar la imagen (con cache-buster para forzar refresco visual)
            const uiAvatarUrl = `${avatarUrl}${avatarUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
            avatarImg.src = uiAvatarUrl;
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
            
            console.log('✅ Avatar configurado exitosamente:', { persisted: avatarUrl, ui: uiAvatarUrl });
        }
    } else {
        console.log('⚠️ No se encontró URL de avatar en ninguna ubicación del localStorage');
        console.log('🔍 Datos disponibles en userData:', Object.keys(userData));
        console.log('🔍 Datos disponibles en railwayData:', Object.keys(railwayData));
    }
}

// ✅ INICIALIZACIÓN PRINCIPAL DEL DASHBOARD
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Dashboard iniciando...');
    
    // 🔥 VERIFICAR SI VENIMOS DE UNA ACTUALIZACIÓN DE PERFIL CON FOTO NUEVA
    const photoJustUpdated = localStorage.getItem('photo_just_updated');
    
    if (photoJustUpdated === 'true') {
        console.log('🔥🔥🔥 FOTO ACTUALIZADA DETECTADA - OBTENIENDO DATOS FRESCOS 🔥🔥🔥');
        
        // Limpiar flag inmediatamente
        localStorage.removeItem('photo_just_updated');
        
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (token && userData.id) {
            try {
                console.log('📡 Consultando backend para obtener foto nueva...');
                
                // Obtener datos frescos del médico
                const medicoResponse = await fetch(`https://hospital-app-backend-production.up.railway.app/api/v1/medicos/${userData.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (medicoResponse.ok) {
                    const medicoData = await medicoResponse.json();
                    console.log('✅ DATOS FRESCOS DEL BACKEND:', medicoData);
                    
                    // Extraer la nueva foto URL
                    if (medicoData.data?.datos_profesional?.foto_url) {
                        const nuevaFotoUrl = medicoData.data.datos_profesional.foto_url;
                        console.log('🖼️ NUEVA FOTO URL OBTENIDA:', nuevaFotoUrl);
                        
                        // FORZAR ACTUALIZACIÓN EN LOCALSTORAGE
                        userData.foto_url = nuevaFotoUrl;
                        
                        // Actualizar railway_user_data también
                        let railwayData = JSON.parse(localStorage.getItem('railway_user_data') || '{}');
                        railwayData.foto_url = nuevaFotoUrl;
                        
                        // Guardar en localStorage
                        localStorage.setItem('user', JSON.stringify(userData));
                        localStorage.setItem('railway_user_data', JSON.stringify(railwayData));
                        
                        console.log('💾 LOCALSTORAGE ACTUALIZADO CON NUEVA FOTO');
                        console.log('   user.foto_url:', userData.foto_url);
                        console.log('   railway.foto_url:', railwayData.foto_url);
                    }
                }
            } catch (error) {
                console.error('❌ Error obteniendo datos frescos:', error);
            }
        }
    }
    
    // Pequeño delay para asegurar que localStorage esté sincronizado
    setTimeout(() => {
        // Cargar datos iniciales
        loadUserData();
    }, 100);
    
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
        loadUserAvatar(userData, railwayData, displayName);
        
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