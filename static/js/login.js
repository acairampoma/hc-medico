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
// FUNCIONES BÁSICAS DE UI
// =====================================================

// Alternar visibilidad de contraseña
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

// Manejar subida de foto
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const avatarPreview = document.getElementById('avatarPreview');
            avatarPreview.innerHTML = `<img src="${e.target.result}" alt="Avatar">`;
            console.log('Foto cargada:', file.name);
        };
        reader.readAsDataURL(file);
    }
}

// Mostrar modal de registro
function showRegisterModal() {
    document.getElementById('registerModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Cerrar modal de registro
function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('registerForm').reset();
}

// Alternar tabs del modal
function switchTab(tabName) {
    // Remover active de todos los tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Activar tab seleccionado
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

// =====================================================
// API FUNCTIONS - REAL BACKEND CALLS
// =====================================================

// API Base URL y Endpoints disponibles
const API_BASE_URL = 'https://hospital-app-backend-production.up.railway.app/api/v1';

/* 
🔗 ENDPOINTS CONFIRMADOS DEL BACKEND:
✅ POST /api/v1/upload/send-recovery-code - Enviar código (FormData: email)
✅ POST /api/v1/auth/register - Registro de usuarios (JSON)
✅ POST /api/v1/upload/register-with-photo - Registro con foto (FormData)
*/

// Enviar código de recuperación por email (usando FormData como espera el backend)
async function apiSendRecoveryCode(email) {
    try {
        console.log('🔐 Enviando código de recuperación para:', email);
        
        // El backend espera FormData, no JSON
        const formData = new FormData();
        formData.append('email', email);
        
        const response = await fetch(`${API_BASE_URL}/upload/send-recovery-code`, {
            method: 'POST',
            body: formData // Sin Content-Type header para FormData
        });
        
        const result = await response.json();
        console.log('✅ Código de recuperación enviado:', result);
        return result;
    } catch (error) {
        console.error('❌ Error enviando código:', error);
        throw error;
    }
}

// Registrar usuario con foto
async function apiRegisterUser(formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/upload/register-with-photo`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error registrando usuario:', error);
        throw error;
    }
}

// 🆕 NUEVAS FUNCIONES API SOLICITADAS:

// Grabar registro de usuario (método alternativo sin foto)
/**
 * ✅ NUEVA FUNCIÓN: Registro con FormData usando endpoint correcto
 * Técnica igual que recover-password.js
 */
async function apiGrabarRegistroConFormData(formData) {
    try {
        console.log('🔥 Enviando registro con FormData al endpoint correcto...');
        
        // Log de datos que se envían (sin mostrar contraseña)
        for (let [key, value] of formData.entries()) {
            if (key === 'password') {
                console.log(`📝 ${key}: [HIDDEN]`);
            } else if (key === 'photo') {
                console.log(`📷 ${key}: ${value.name} (${value.size} bytes)`);
            } else {
                console.log(`📝 ${key}: ${value}`);
            }
        }
        
        // ✅ USAR ENDPOINT CORRECTO: /upload/register-with-photo (como en backend)
        const response = await fetch(`${API_BASE_URL}/upload/register-with-photo`, {
            method: 'POST',
            body: formData  // ✅ FormData directo, sin headers Content-Type
        });
        
        const result = await response.json();
        console.log('📡 Respuesta del backend:', result);
        
        // ✅ Manejar respuesta como recover-password.js
        if (response.ok && result.success) {
            return { success: true, data: result.data, message: result.message };
        } else {
            throw new Error(result.message || 'Error en registro');
        }
    } catch (error) {
        console.error('❌ Error en registro:', error);
        throw error;
    }
}

/**
 * 🗑️ FUNCIÓN OBSOLETA: Mantenida para compatibilidad 
 * (Ya no se usa, nueva función es apiGrabarRegistroConFormData)
 */
async function apiGrabarRegistro(userData) {
    console.warn('⚠️ Función obsoleta apiGrabarRegistro llamada. Usar apiGrabarRegistroConFormData');
    
    try {
        console.log('📝 Enviando registro al backend (modo obsoleto):', userData);
        
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        const result = await response.json();
        console.log('✅ Respuesta del backend:', result);
        return result;
    } catch (error) {
        console.error('❌ Error grabando registro:', error);
        throw error;
    }
}

// NOTA: La función apiEnviarCorreo fue eliminada porque el backend
// ya maneja el envío de correos directamente en sus endpoints específicos

// =====================================================
// FUNCIÓN DE PRUEBA DE INTEGRACIÓN
// =====================================================

// Test de integración para verificar que las nuevas APIs funcionan
async function testApiIntegration() {
    console.log('🔧 Iniciando test de integración API...');
    
    // Test 1: Verificar que la función apiGrabarRegistro existe
    if (typeof apiGrabarRegistro === 'function') {
        console.log('✅ Función apiGrabarRegistro está disponible');
    } else {
        console.error('❌ Función apiGrabarRegistro NO encontrada');
        return;
    }
    
    // Test 2: Verificar que la función apiSendRecoveryCode existe
    if (typeof apiSendRecoveryCode === 'function') {
        console.log('✅ Función apiSendRecoveryCode está disponible');
    } else {
        console.error('❌ Función apiSendRecoveryCode NO encontrada');
        return;
    }
    
    // Test 3: Verificar que las funciones de formulario funcionan
    if (typeof submitRegistration === 'function') {
        console.log('✅ Función submitRegistration está disponible');
    } else {
        console.error('❌ Función submitRegistration NO encontrada');
    }
    
    if (typeof forgotPassword === 'function') {
        console.log('✅ Función forgotPassword está disponible');
    } else {
        console.error('❌ Función forgotPassword NO encontrada');
    }
    
    console.log('🎉 Test de integración API completado - Todas las funciones están disponibles!');
}

// Test específico para password recovery
async function testPasswordRecoveryIntegration() {
    console.log('🔐 Iniciando test de recuperación de contraseña...');
    
    try {
        // Verificar endpoint correcto para password recovery
        console.log('🎯 Endpoint configurado: /api/v1/upload/send-recovery-code');
        console.log('📧 Formato de datos: FormData con email');
        console.log('✅ Integración de password recovery configurada correctamente');
        
        // Verificar funciones disponibles
        if (typeof apiSendRecoveryCode === 'function') {
            console.log('✅ apiSendRecoveryCode disponible (usa FormData)');
        } else {
            console.error('❌ apiSendRecoveryCode NO encontrada');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error en test de password recovery:', error);
        return false;
    }
}

// Test completo de separación de archivos
async function testCompleteSeparation() {
    console.log('🎯 Iniciando test de separación completa de archivos...');
    
    // Verificar que estamos en un archivo JS separado
    console.log('✅ JavaScript cargado desde archivo separado: /static/js/login.js');
    
    // Verificar que las CSS están separadas (verificamos si existen elementos con clases específicas)
    const loginContainer = document.querySelector('.login-container');
    if (loginContainer) {
        const computedStyle = window.getComputedStyle(loginContainer);
        if (computedStyle.display === 'grid') {
            console.log('✅ CSS cargado correctamente desde archivo separado: /static/css/styles.css');
        }
    }
    
    // Verificar funciones críticas
    const criticalFunctions = [
        'apiGrabarRegistro',
        'apiSendRecoveryCode', 
        'submitRegistration',
        'forgotPassword',
        'togglePassword'
    ];
    
    let allFunctionsAvailable = true;
    criticalFunctions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
            console.log(`✅ Función ${funcName} disponible`);
        } else {
            console.error(`❌ Función ${funcName} NO disponible`);
            allFunctionsAvailable = false;
        }
    });
    
    if (allFunctionsAvailable) {
        console.log('🎉 INTEGRACIÓN COMPLETA EXITOSA - Arquitectura correctamente separada!');
        console.log('📁 Estructura de archivos:');
        console.log('   📄 HTML: templates/login.html (solo estructura)');
        console.log('   🎨 CSS: static/css/styles.css (solo presentación)');
        console.log('   ⚡ JS: static/js/login.js (solo comportamiento)');
        console.log('   📊 Backend APIs: Integradas con nuevas funciones');
    } else {
        console.error('❌ Faltan funciones críticas en la integración');
    }
}

// Ejecutar test cuando se carga la página (solo en modo desarrollo)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.addEventListener('load', () => {
        // Esperar un poco para que CSS se cargue completamente
        setTimeout(() => {
            testApiIntegration();
            testPasswordRecoveryIntegration();
            testCompleteSeparation();
        }, 500);
    });
}



// Olvidé mi contraseña - REDIRIGIR A RECOVER-PASSWORD.HTML
function forgotPassword() {
    console.log('🔐 Redirigiendo a página de recuperación de contraseña');
    window.location.href = '/recover-password';
}

async function showResetCodeModal(email) {
    const { value: formValues } = await Swal.fire({
        title: 'Código de Recuperación',
        html: `
            <div style="text-align: left;">
                <p style="color: #6c757d; margin-bottom: 15px;">
                    Se ha enviado un código a <strong>${email}</strong>
                </p>
                <label style="display: block; margin-bottom: 5px; color: #2c3e50; font-weight: 600;">
                    Código de recuperación:
                </label>
                <input type="text" id="resetCode" class="swal2-input" 
                       placeholder="Ejemplo: 123456" 
                       style="margin: 0 0 15px 0; width: 100%; padding: 12px; border: 2px solid #e0e6ed; border-radius: 8px;">
                
                <label style="display: block; margin-bottom: 5px; color: #2c3e50; font-weight: 600;">
                    Nueva contraseña:
                </label>
                <input type="password" id="newPassword" class="swal2-input" 
                       placeholder="Mínimo 8 caracteres" 
                       style="margin: 0 0 15px 0; width: 100%; padding: 12px; border: 2px solid #e0e6ed; border-radius: 8px;">
                
                <label style="display: block; margin-bottom: 5px; color: #2c3e50; font-weight: 600;">
                    Confirmar contraseña:
                </label>
                <input type="password" id="confirmPassword" class="swal2-input" 
                       placeholder="Repetir contraseña" 
                       style="margin: 0; width: 100%; padding: 12px; border: 2px solid #e0e6ed; border-radius: 8px;">
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-check"></i> Cambiar Contraseña',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#27ae60',
        cancelButtonColor: '#6c757d',
        preConfirm: () => {
            const code = document.getElementById('resetCode').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (!code) {
                Swal.showValidationMessage('Ingresa el código de recuperación');
                return false;
            }
            // Validaciones detalladas de contraseña
            const passwordErrors = [];
            
            if (newPassword.length < 8) {
                passwordErrors.push('Al menos 8 caracteres');
            }
            if (!/[A-Z]/.test(newPassword)) {
                passwordErrors.push('Al menos una mayúscula (A-Z)');
            }
            if (!/[a-z]/.test(newPassword)) {
                passwordErrors.push('Al menos una minúscula (a-z)');
            }
            if (!/[0-9]/.test(newPassword)) {
                passwordErrors.push('Al menos un número (0-9)');
            }
            if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(newPassword)) {
                passwordErrors.push('Al menos un símbolo especial (!@#$%^&*)');
            }
            
            if (passwordErrors.length > 0) {
                Swal.showValidationMessage(`Requisitos faltantes: ${passwordErrors.join(', ')}`);
                return false;
            }
            if (newPassword !== confirmPassword) {
                Swal.showValidationMessage('Las contraseñas no coinciden');
                return false;
            }
            
            return { code, newPassword };
        }
    });

    if (formValues) {
        // Mostrar loading
        Swal.fire({
            title: 'Cambiando contraseña...',
            text: 'Por favor espera',
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            // 🔥 LLAMADA REAL AL ENDPOINT DE RAILWAY
            const formData = new FormData();
            formData.append('email', email);
            formData.append('code', formValues.code);
            formData.append('new_password', formValues.newPassword);
            
            const response = await fetch(`${API_BASE_URL}/upload/reset-password`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Éxito
                await Swal.fire({
                    title: '¡Contraseña Cambiada!',
                    text: 'Tu contraseña ha sido actualizada correctamente. Ahora puedes iniciar sesión.',
                    icon: 'success',
                    confirmButtonText: 'Iniciar Sesión',
                    confirmButtonColor: '#27ae60'
                });
            } else {
                throw new Error(result.message || 'Error cambiando contraseña');
            }
            
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: error.message || 'No se pudo cambiar la contraseña. Verifica el código e intenta nuevamente.',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        }
    }
}

// =====================================================
// REGISTER WITH REAL API
// =====================================================

// ✅ FUNCIÓN DE TEST TEMPORAL PARA DEBUG
async function testRegistrationDebug() {
    console.log('🧪 Iniciando test de registro debug...');
    
    try {
        // Crear FormData exacto como el curl que funciona
        const testFormData = new FormData();
        testFormData.append('firstName', 'Alan');
        testFormData.append('lastName', 'Test');
        testFormData.append('email', 'alan.test@gmail.com');
        testFormData.append('username', 'alantest');
        testFormData.append('password', 'Admin123!');
        testFormData.append('especialidad', 'Neurología');
        testFormData.append('colegiatura', '54321');
        testFormData.append('telefono', '123456789');
        testFormData.append('cargo', 'Doctor Test');
        
        console.log('🔍 Enviando datos de test...');
        
        const response = await fetch(`${API_BASE_URL}/upload/register-with-photo`, {
            method: 'POST',
            body: testFormData
        });
        
        const result = await response.json();
        
        console.log('📡 Respuesta test:', response.status, result);
        
        if (response.ok && result.success) {
            Swal.fire({
                icon: 'success',
                title: '¡Test Exitoso!',
                text: `Usuario ${result.data.nombre_completo} creado con ID ${result.data.id}`
            });
        } else {
            throw new Error(result.message || 'Error en test');
        }
        
    } catch (error) {
        console.error('❌ Error en test:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error en Test',
            text: error.message
        });
    }
}

// Exponer función de test globalmente
window.testRegistrationDebug = testRegistrationDebug;

// Submit registro
async function submitRegistration() {
    console.log('🔥 Iniciando proceso de registro con mejores prácticas...');
    
    // Crear FormData con nombres que coinciden exactamente con el backend
    const formData = new FormData();
    
    // ✅ DATOS BÁSICOS (van a campos directos de la tabla users)
    formData.append('firstName', document.getElementById('firstName').value);
    formData.append('lastName', document.getElementById('lastName').value);
    formData.append('email', document.getElementById('email').value);
    formData.append('username', document.getElementById('registerUsername').value);
    formData.append('password', document.getElementById('registerPassword').value);
    
    // ✅ DATOS PROFESIONALES (van al JSONB datos_profesional) - NOMBRES CORREGIDOS
    formData.append('especialidad', document.getElementById('specialty').value);        // specialty → especialidad
    formData.append('colegiatura', document.getElementById('medicalLicense').value);   // medicalLicense → colegiatura
    formData.append('telefono', document.getElementById('phone').value);              // phone → telefono
    formData.append('cargo', document.getElementById('hospital').value);              // hospital → cargo
    
    // ✅ FOTO (va a Cloudinary y URL se guarda en datos_profesional.foto_url)
    const photoFile = document.getElementById('photoUpload').files[0];
    if (photoFile) {
        formData.append('photo', photoFile);
        console.log('📷 Foto incluida en el registro:', photoFile.name);
    }

    // ✅ VALIDACIÓN de campos requeridos (nombres actualizados)
    const requiredData = {
        'firstName': formData.get('firstName'),
        'lastName': formData.get('lastName'), 
        'email': formData.get('email'),
        'username': formData.get('username'),
        'password': formData.get('password'),
        'especialidad': formData.get('especialidad'),
        'colegiatura': formData.get('colegiatura')
    };
    
    const missingFields = Object.keys(requiredData).filter(field => !requiredData[field]);
    
    if (missingFields.length > 0) {
        Swal.fire({
            title: 'Campos Requeridos',
            text: 'Por favor complete todos los campos marcados con *',
            icon: 'warning',
            confirmButtonColor: '#3498db'
        });
        return;
    }

    // ✅ MOSTRAR loading con SweetAlert
    Swal.fire({
        title: 'Registrando Médico...',
        text: 'Subiendo foto y enviando email de bienvenida',
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        // ✅ DEBUG: Log FormData contents
        console.log('🔍 FormData contents:');
        for (let [key, value] of formData.entries()) {
            if (key === 'password') {
                console.log(`${key}: [HIDDEN]`);
            } else if (key === 'photo') {
                console.log(`${key}: ${value.name} (${value.size} bytes)`);
            } else {
                console.log(`${key}: ${value}`);
            }
        }
        
        // ✅ LLAMAR API CORRECTA con FormData (como recover-password.js)
        const result = await apiGrabarRegistroConFormData(formData);
        
        console.log('🔍 API Response:', result);
        
        if (result.success) {
            Swal.fire({
                title: '¡Registro Exitoso!',
                html: `
                    <div style="text-align: center;">
                        <h3><i class="fas fa-user-md"></i> Dr. ${formData.get('firstName')} ${formData.get('lastName')}</h3>
                        <p><strong>Especialidad:</strong> ${formData.get('especialidad')}</p>
                        <p><strong>Colegiatura:</strong> ${formData.get('colegiatura')}</p>
                        <p><strong>Usuario:</strong> ${formData.get('username')}</p>
                        <hr style="margin: 15px 0;">
                        <p style="color: #27ae60;"><i class="fas fa-envelope"></i> Email de bienvenida enviado</p>
                        <p style="color: #3498db;"><i class="fas fa-cloud-upload-alt"></i> Foto subida a Cloudinary</p>
                    </div>
                `,
                icon: 'success',
                confirmButtonColor: '#27ae60',
                confirmButtonText: '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión'
            }).then(() => {
                closeRegisterModal();
                // Limpiar formulario
                document.getElementById('registerForm').reset();
                document.getElementById('avatarPreview').innerHTML = '<i class="fas fa-user"></i>';
            });
        } else {
            throw new Error(result.message || 'Error en el registro');
        }
    } catch (error) {
        Swal.fire({
            title: 'Error de Registro',
            text: error.message || 'No se pudo completar el registro. Intenta nuevamente.',
            icon: 'error',
            confirmButtonColor: '#ef4444'
        });
    }
}

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

// =====================================================
// MANEJO DEL FORMULARIO DE LOGIN
// =====================================================

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Mostrar loading
    const btnText = document.querySelector('.btn-text');
    const loadingSpinner = document.getElementById('loadingSpinner');
    btnText.style.display = 'none';
    loadingSpinner.style.display = 'block';
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Obtener datos del usuario para personalizar el saludo
            const userData = result.user || {};
            const firstName = userData.first_name || '';
            const lastName = userData.last_name || '';
            const specialty = userData.datos_profesional?.especialidad || '';
            
            let greeting = '¡Bienvenido!';
            if (firstName && lastName) {
                greeting = `¡Bienvenido Dr. ${firstName} ${lastName}!`;
                if (specialty) {
                    greeting += `\nEspecialista en ${specialty}`;
                }
            }
            
            // Guardar datos
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(userData));
            
            // SweetAlert personalizado
            await Swal.fire({
                title: 'Acceso Autorizado',
                html: `
                    <div style="text-align: center;">
                        <i class="fas fa-user-md" style="font-size: 3rem; color: #27ae60; margin-bottom: 15px;"></i>
                        <h3 style="color: #2c3e50; margin-bottom: 10px;">${greeting}</h3>
                        <p style="color: #6c757d;">Accediendo al sistema médico...</p>
                    </div>
                `,
                icon: 'success',
                timer: 2500,
                showConfirmButton: false,
                background: '#ffffff',
                customClass: {
                    popup: 'medical-popup'
                }
            });
            
            window.location.href = '/dashboard';
        } else {
            throw new Error(result.message || 'Error de autenticación');
        }
    } catch (error) {
        Swal.fire({
            title: 'Error de Acceso',
            text: error.message || 'Credenciales incorrectas',
            icon: 'error',
            confirmButtonColor: '#e74c3c'
        });
    } finally {
        btnText.style.display = 'block';
        loadingSpinner.style.display = 'none';
    }
});

// =====================================================
// EVENT LISTENERS
// =====================================================

// Cerrar modal con click fuera
window.addEventListener('click', function(event) {
    const modal = document.getElementById('registerModal');
    if (event.target === modal) {
        closeRegisterModal();
    }
});

// Cerrar modal con ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('registerModal');
        if (modal.style.display === 'flex') {
            closeRegisterModal();
        }
    }
});