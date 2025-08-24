/**
 * 🏥 IA MEDICAL SOLUTIONS - Dashboard JavaScript
 * Sistema Hospitalario con Inteligencia Artificial
 */

// 🔥 OBTENER DATOS DEL USUARIO DEL LOCALSTORAGE Y CARGAR AVATAR
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔥 Iniciando carga de datos desde localStorage...');
    
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
    } else if (userData.fullName) {
        displayName = `Dr. ${userData.fullName}`;
    } else if (userData.name) {
        displayName = `Dr. ${userData.name}`;
    } else {
        displayName = 'Dr. Usuario';
    }
    
    document.getElementById('doctorName').textContent = displayName;
    
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
});

// 👤 FUNCIONES MODAL PERFIL - CONECTADO CON SERVICIOS RAILWAY
async function openEditProfileModal() {
    console.log('🔥 ABRIENDO MODAL PERFIL CON SERVICIOS');
    
    // Mostrar modal inmediatamente
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.style.display = 'flex';
    }
    
    // Cargar datos del usuario desde Railway
    await loadUserDataInModal();
}

// 🚂 CARGAR DATOS DEL USUARIO DESDE RAILWAY EN EL MODAL
async function loadUserDataInModal() {
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('access_token');
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        
        console.log('🔍 Cargando datos del perfil desde Railway...');
        
        if (!token) {
            console.error('❌ No hay token disponible');
            return;
        }
        
        // Llamar al servicio Railway para obtener datos completos del usuario
        const response = await fetch('/api/user-profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const profileData = await response.json();
            console.log('✅ Datos del perfil obtenidos:', profileData);
            
            // Llenar el modal con los datos del servicio
            fillModalWithUserData(profileData.data || profileData);
        } else {
            console.log('⚠️ Error al obtener perfil, usando datos de localStorage');
            // Usar datos del localStorage como fallback
            fillModalWithUserData(userData);
        }
        
    } catch (error) {
        console.error('💥 Error cargando datos del perfil:', error);
        
        // Fallback con datos del localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        fillModalWithUserData(userData);
    }
}

// 📝 LLENAR EL MODAL CON DATOS DEL USUARIO
function fillModalWithUserData(userData) {
    console.log('📝 Llenando modal con datos:', userData);
    
    // Llenar campos básicos
    const firstNameInput = document.getElementById('editFirstName');
    const lastNameInput = document.getElementById('editLastName');
    const emailInput = document.getElementById('editEmail');
    const phoneInput = document.getElementById('editPhone');
    const especialidadInput = document.getElementById('editEspecialidad');
    const colegiaturaInput = document.getElementById('editColegiatura');
    
    if (firstNameInput) firstNameInput.value = userData.firstName || userData.first_name || '';
    if (lastNameInput) lastNameInput.value = userData.lastName || userData.last_name || '';
    if (emailInput) emailInput.value = userData.email || '';
    if (phoneInput && userData.datos_profesional) {
        phoneInput.value = userData.datos_profesional.telefono || '';
    }
    if (especialidadInput && userData.datos_profesional) {
        especialidadInput.value = userData.datos_profesional.especialidad || '';
    }
    if (colegiaturaInput && userData.datos_profesional) {
        colegiaturaInput.value = userData.datos_profesional.colegiatura || '';
    }
    
    // Actualizar preview de foto actual si existe
    const currentPhotoPreview = document.getElementById('currentPhotoPreview');
    if (currentPhotoPreview && userData.foto_url) {
        currentPhotoPreview.innerHTML = `
            <img src="${userData.foto_url}" 
                 alt="Foto actual" 
                 style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;"
                 onerror="this.style.display='none';">
        `;
    }
    
    console.log('✅ Modal llenado con datos del usuario');
}

function closeEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function previewNewPhoto(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('currentPhotoPreview');
            preview.innerHTML = `<img src="${e.target.result}" alt="Vista previa" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        };
        reader.readAsDataURL(file);
    }
}

function saveProfileChanges() {
    Swal.fire({
        icon: 'success',
        title: '¡Perfil Actualizado!',
        text: 'Los cambios se han guardado correctamente',
        timer: 2000,
        showConfirmButton: false
    });
    closeEditProfileModal();
}

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