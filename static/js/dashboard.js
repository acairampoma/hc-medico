/**
 * 🏥 IA MEDICAL SOLUTIONS - Dashboard JavaScript
 * Sistema Hospitalario con Inteligencia Artificial
 */

// Obtener datos del usuario del localStorage
document.addEventListener('DOMContentLoaded', function() {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
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
    console.log('Dashboard - Usuario cargado:', userData);
    console.log('Dashboard - Nombre mostrado:', displayName);
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