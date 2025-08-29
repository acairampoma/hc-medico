/**
 * Profile Management Module
 * Sistema de gestión de perfil de usuario  
 * Integración con Railway Backend usando localStorage
 */

(function() {
    'use strict';

    // Estado global del módulo
    const ProfileState = {
        currentUser: null,
        railwayData: null,
        hasChanges: false,
        uploadedPhoto: null,
        backendUrl: 'https://hospital-app-backend-production.up.railway.app'
    };

    // Configuración
    const Config = {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif']
    };

    /**
     * Inicialización del módulo
     */
    function init() {
        loadUserDataFromStorage();
        setupEventListeners();
        console.log('👤 Profile Module Initialized - Railway Integration Active');
    }

    /**
     * Cargar datos del usuario desde localStorage (como dashboard.js)
     */
    function loadUserDataFromStorage() {
        console.log('🔥 Cargando datos desde localStorage...');
        
        // Obtener datos del localStorage (igual que dashboard.js)
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const railwayData = JSON.parse(localStorage.getItem('railway_user_data') || '{}');
        
        console.log('📦 localStorage user:', userData);
        console.log('🚂 localStorage railway_data:', railwayData);
        
        ProfileState.currentUser = userData;
        ProfileState.railwayData = railwayData;
        
        // Poblar formularios con datos disponibles
        populateFormData(userData, railwayData);
        
        // Cargar avatar como en dashboard.js
        loadUserAvatar(userData, railwayData);
    }

    /**
     * Poblar datos en formularios desde localStorage
     */
    function populateFormData(userData, railwayData) {
        // Combinar datos de ambas fuentes
        const allData = { ...userData, ...railwayData };
        
        // Información básica - nuevos campos del HTML
        const firstNameField = document.getElementById('firstName');
        const lastNameField = document.getElementById('lastName'); 
        const emailField = document.getElementById('email');
        const phoneField = document.getElementById('phone');
        const specialtyField = document.getElementById('specialty');
        const experienceField = document.getElementById('experience');
        const licenseField = document.getElementById('license');
        const institutionField = document.getElementById('institution');
        const emergencyPhoneField = document.getElementById('emergencyPhone');
        
        if (firstNameField) firstNameField.value = allData.firstName || allData.first_name || '';
        if (lastNameField) lastNameField.value = allData.lastName || allData.last_name || '';
        if (emailField) emailField.value = allData.email || '';
        if (phoneField) phoneField.value = allData.telefono || allData.phone || '';
        if (specialtyField) specialtyField.value = allData.especialidad || allData.specialty || '';
        if (experienceField) experienceField.value = allData.experiencia || allData.experience || '';
        if (licenseField) licenseField.value = allData.colegiatura || allData.license || '';
        if (institutionField) institutionField.value = allData.institucion || allData.institution || '';
        if (emergencyPhoneField) emergencyPhoneField.value = allData.telefono_emergencia || allData.emergencyPhone || '';
    }

    /**
     * Cargar avatar del usuario (igual que dashboard.js)
     */
    function loadUserAvatar(userData, railwayData) {
        let avatarUrl = null;
        
        // Buscar URL del avatar (igual que dashboard.js)
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
        
        // Mostrar avatar en el círculo de foto
        if (avatarUrl) {
            const photoCircle = document.getElementById('photoCircle');
            if (photoCircle) {
                photoCircle.innerHTML = `
                    <img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
                    <button class="photo-upload" onclick="uploadPhoto()">
                        <i class="fas fa-camera"></i>
                    </button>
                `;
                console.log('✅ Avatar configurado exitosamente:', avatarUrl);
            }
        }
    }

    /**
     * Configurar event listeners para el nuevo HTML
     */
    function setupEventListeners() {
        // Upload de foto - usando el nuevo HTML
        const photoInput = document.getElementById('photoInput');
        if (photoInput) {
            photoInput.addEventListener('change', handlePhotoUpload);
        }
        
        // Toggle password visibility - ya existe en el HTML inline
        // Las funciones globales están definidas en el HTML
        
        console.log('✅ Event listeners configurados');
    }

    /**
     * Manejar upload de foto (adaptado al nuevo HTML)
     */
    function handlePhotoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validar archivo
        if (!Config.allowedTypes.includes(file.type)) {
            Swal.fire({
                icon: 'error',
                title: 'Archivo no válido',
                text: 'Solo se permiten imágenes JPG, PNG o GIF'
            });
            return;
        }
        
        if (file.size > Config.maxFileSize) {
            Swal.fire({
                icon: 'error', 
                title: 'Archivo muy grande',
                text: 'El archivo no debe superar 5MB'
            });
            return;
        }
        
        // Preview local en el círculo de foto
        const reader = new FileReader();
        reader.onload = function(e) {
            const photoCircle = document.getElementById('photoCircle');
            if (photoCircle) {
                photoCircle.innerHTML = `
                    <img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
                    <button class="photo-upload" onclick="uploadPhoto()">
                        <i class="fas fa-camera"></i>
                    </button>
                `;
            }
            ProfileState.uploadedPhoto = file;
            ProfileState.hasChanges = true;
        };
        reader.readAsDataURL(file);
    }

    /**
     * Guardar perfil - Función global llamada desde HTML (técnica como recover-password.js)
     */
    async function saveProfile() {
        console.log('🔥🔥🔥 INICIANDO GUARDADO DE PERFIL 🔥🔥🔥');
        console.log('================================');
        
        try {
            // Crear FormData como recover-password.js
            const formData = new FormData();
            
            // Obtener datos del formulario
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const phone = document.getElementById('phone').value;
            const specialty = document.getElementById('specialty').value;
            const experience = document.getElementById('experience').value;
            const license = document.getElementById('license').value;
            const institution = document.getElementById('institution').value;
            const emergencyPhone = document.getElementById('emergencyPhone').value;
            
            console.log('📝 DATOS DEL FORMULARIO:');
            console.log('   firstName:', firstName);
            console.log('   lastName:', lastName);
            console.log('   phone:', phone);
            console.log('   specialty:', specialty);
            console.log('   license:', license);
            console.log('   institution:', institution);
            
            // Validaciones básicas
            if (!firstName || !lastName || !license || !specialty) {
                Swal.fire({
                    icon: 'error',
                    title: 'Campos obligatorios',
                    text: 'Por favor completa todos los campos marcados con *'
                });
                return;
            }
            
            // Agregar datos al FormData (según el backend real)
            console.log('📦 AGREGANDO DATOS AL FORMDATA:');
            formData.append('firstName', firstName);
            console.log('   ✅ firstName agregado:', firstName);
            
            formData.append('lastName', lastName);
            console.log('   ✅ lastName agregado:', lastName);
            
            formData.append('telefono', phone);
            console.log('   ✅ telefono agregado:', phone);
            
            formData.append('especialidad', specialty);
            console.log('   ✅ especialidad agregado:', specialty);
            
            formData.append('colegiatura', license);
            console.log('   ✅ colegiatura agregado:', license);
            
            formData.append('cargo', institution); // En backend se llama 'cargo'
            console.log('   ✅ cargo agregado:', institution);
            
            // IMPORTANTE: El backend requiere user_id
            console.log('🆔 USER ID CHECK:');
            console.log('   ProfileState.currentUser:', ProfileState.currentUser);
            console.log('   user.id:', ProfileState.currentUser.id);
            
            if (ProfileState.currentUser.id) {
                formData.append('user_id', ProfileState.currentUser.id);
                console.log('   ✅ user_id agregado:', ProfileState.currentUser.id);
            } else {
                console.log('   ❌ ERROR: NO HAY USER_ID!');
                throw new Error('No se pudo identificar al usuario. Inicia sesión nuevamente.');
            }
            
            // MANTENER LA FOTO EXISTENTE SI NO HAY FOTO NUEVA
            if (!ProfileState.uploadedPhoto && ProfileState.currentUser.foto_url) {
                formData.append('foto_url', ProfileState.currentUser.foto_url);
                console.log('📸 Manteniendo foto existente:', ProfileState.currentUser.foto_url);
            }
            
            // Agregar foto si se subió una nueva
            if (ProfileState.uploadedPhoto) {
                console.log('📸 SUBIENDO FOTO NUEVA:');
                console.log('   Nombre:', ProfileState.uploadedPhoto.name);
                console.log('   Tamaño:', ProfileState.uploadedPhoto.size, 'bytes');
                console.log('   Tipo:', ProfileState.uploadedPhoto.type);
                formData.append('photo', ProfileState.uploadedPhoto, ProfileState.uploadedPhoto.name);
            }
            
            // ✅ DEBUG: Log FormData contents antes de enviar
            console.log('🔍 PROFILE UPDATE - FormData contents:');
            for (let [key, value] of formData.entries()) {
                if (key === 'photo') {
                    console.log(`${key}: ${value.name} (${value.size} bytes)`);
                } else {
                    console.log(`${key}: ${value}`);
                }
            }
            console.log('🔍 ProfileState.currentUser:', ProfileState.currentUser);
            console.log('🔍 Backend URL:', ProfileState.backendUrl);
            
            // Mostrar loading
            Swal.fire({
                title: 'Guardando cambios...',
                text: 'Por favor espere',
                allowOutsideClick: false,
                showConfirmButton: false,
                willOpen: () => {
                    Swal.showLoading();
                }
            });
            
            // Obtener token del localStorage
            const token = localStorage.getItem('access_token') || localStorage.getItem('token');
            console.log('🔑 TOKEN CHECK:');
            console.log('   Token encontrado:', token ? `${token.substring(0, 30)}...` : 'NO HAY TOKEN');
            
            if (!token) {
                console.log('   ❌ ERROR: NO HAY TOKEN!');
                throw new Error('No hay token de autenticación. Por favor inicia sesión nuevamente.');
            }
            
            // Mostrar todos los datos del FormData antes de enviar
            console.log('📤 FORMDATA FINAL A ENVIAR:');
            for (let [key, value] of formData.entries()) {
                console.log(`   ${key}: ${value}`);
            }
            
            // Llamada a API con Authorization header
            const url = `${ProfileState.backendUrl}/api/v1/upload/update-profile`;
            console.log('🌐 URL DE DESTINO:', url);
            
            console.log('🚀 ENVIANDO REQUEST...');
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            console.log('📡 RESPUESTA RECIBIDA:');
            console.log('   Status:', response.status);
            console.log('   StatusText:', response.statusText);
            
            const result = await response.json();
            console.log('📦 RESPONSE BODY:', result);
            
            if (response.ok && result.success) {
                console.log('✅✅✅ ÉXITO! Perfil actualizado ✅✅✅');
                console.log('📥 DATOS RECIBIDOS DEL BACKEND:', result.data);
                console.log('🔍 COMPARACIÓN:');
                console.log('   Enviado firstName:', firstName);
                console.log('   Recibido first_name:', result.data.first_name);
                console.log('   Enviado lastName:', lastName); 
                console.log('   Recibido last_name:', result.data.last_name);
                
                // ✅ ANÁLISIS DE RESPUESTA PARA FOTO
                let finalPhotoUrl = ProfileState.currentUser.foto_url;

                if (ProfileState.uploadedPhoto) {
                    console.log('📸 FOTO NUEVA SUBIDA - FORZANDO OBTENCIÓN DE NUEVA URL...');
                    console.log('⚠️ Backend no devuelve foto_url, haciendo re-login para obtenerla...');

                    // ESTRATEGIA AGRESIVA: Hacer un re-login para obtener TODOS los datos frescos
                    // Esperar un poco más para asegurar que Cloudinary procesó todo
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    try {
                        console.log('🔐 Haciendo re-login para obtener datos frescos con foto nueva...');
                        
                        // Re-login con las credenciales almacenadas
                        const email = ProfileState.currentUser.email;
                        const loginResponse = await fetch(`${ProfileState.backendUrl}/api/v1/auth/login`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                email: email,
                                password: 'dummy' // Este login fallará pero obtendremos el usuario por otro medio
                            })
                        });

                        // Si el login falla, intentar obtener datos por otro endpoint
                        console.log('🔍 Intentando obtener datos por /api/v1/medicos...');
                        
                        // Hacer GET a medicos para obtener la lista y buscar nuestro usuario
                        const medicosResponse = await fetch(`${ProfileState.backendUrl}/api/v1/medicos`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        if (medicosResponse.ok) {
                            const medicosData = await medicosResponse.json();
                            console.log('📋 Lista de médicos obtenida:', medicosData);
                            
                            // Buscar nuestro usuario en la lista
                            const currentMedico = medicosData.data?.find(m => m.id === ProfileState.currentUser.id);
                            if (currentMedico?.datos_profesional?.foto_url) {
                                finalPhotoUrl = currentMedico.datos_profesional.foto_url;
                                console.log('🎯 NUEVA FOTO ENCONTRADA EN MÉDICOS:', finalPhotoUrl);
                            }
                        }

                        // Si aún no tenemos la foto, último intento directo a la BD
                        if (!finalPhotoUrl || finalPhotoUrl === ProfileState.currentUser.foto_url) {
                            console.log('🔧 Último intento: GET directo al usuario...');
                            
                            // Intentar con endpoint de médico específico
                            const medicoResponse = await fetch(`${ProfileState.backendUrl}/api/v1/medicos/${ProfileState.currentUser.id}`, {
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            });

                            if (medicoResponse.ok) {
                                const medicoData = await medicoResponse.json();
                                console.log('✅ Datos del médico obtenidos:', medicoData);
                                
                                if (medicoData.data?.datos_profesional?.foto_url) {
                                    finalPhotoUrl = medicoData.data.datos_profesional.foto_url;
                                    console.log('🎯 NUEVA FOTO DEFINITIVA:', finalPhotoUrl);
                                }
                            }
                        }

                    } catch (err) {
                        console.log('⚠️ Error obteniendo datos frescos:', err);
                    }

                    // FORZAR GUARDADO EN VARIABLE TEMPORAL Y FLAG
                    if (finalPhotoUrl && finalPhotoUrl !== ProfileState.currentUser.foto_url) {
                        console.log('💾 GUARDANDO NUEVA FOTO EN LOCALSTORAGE TEMPORAL...');
                        localStorage.setItem('temp_new_photo_url', finalPhotoUrl);
                        localStorage.setItem('photo_updated_at', new Date().toISOString());
                        localStorage.setItem('photo_just_updated', 'true'); // FLAG PARA DASHBOARD
                        console.log('✅ Nueva foto guardada temporalmente:', finalPhotoUrl);
                        console.log('🚩 Flag photo_just_updated establecido para dashboard');
                    } else if (!finalPhotoUrl || finalPhotoUrl === ProfileState.currentUser.foto_url) {
                        // Si no pudimos obtener la nueva foto, igual establecer el flag
                        console.log('⚠️ No se pudo obtener nueva foto URL, pero estableciendo flag para dashboard');
                        localStorage.setItem('photo_just_updated', 'true');
                    }
                }
                
                // Actualizar datos del usuario con la nueva foto si existe
                const updatedUserData = {
                    ...ProfileState.currentUser,
                    firstName: firstName,
                    lastName: lastName,
                    first_name: firstName,
                    last_name: lastName,
                    telefono: phone,
                    especialidad: specialty,
                    colegiatura: license,
                    cargo: institution,
                    foto_url: finalPhotoUrl // Usar la foto obtenida (nueva o existente)
                };
                
                // ✅ PASO 2: Actualizar railway_user_data con los mismos datos
                const updatedRailwayData = {
                    ...ProfileState.railwayData,
                    firstName: updatedUserData.firstName,
                    lastName: updatedUserData.lastName,
                    first_name: updatedUserData.first_name,
                    last_name: updatedUserData.last_name,
                    telefono: updatedUserData.telefono,
                    especialidad: updatedUserData.especialidad,
                    colegiatura: updatedUserData.colegiatura,
                    cargo: updatedUserData.cargo,
                    foto_url: finalPhotoUrl // Usar la misma foto
                };
                
                // ✅ PASO 3: Guardar EN localStorage INMEDIATAMENTE
                localStorage.setItem('user', JSON.stringify(updatedUserData));
                localStorage.setItem('railway_user_data', JSON.stringify(updatedRailwayData));
                
                console.log('🔥 localStorage actualizado:', {
                    user: updatedUserData,
                    railway: updatedRailwayData
                });
                
                // ✅ PASO 4: Actualizar estado interno
                ProfileState.currentUser = updatedUserData;
                ProfileState.railwayData = updatedRailwayData;
                
                // ✅ PASO 4.5: Actualizar foto en la página actual si se subió una nueva (con cache-buster para UI)
                if (ProfileState.uploadedPhoto && finalPhotoUrl && finalPhotoUrl !== ProfileState.currentUser.foto_url) {
                    const bustedUrl = `${finalPhotoUrl}${finalPhotoUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
                    const photoCircle = document.getElementById('photoCircle');
                    if (photoCircle) {
                        photoCircle.innerHTML = `
                            <img src="${bustedUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
                            <button class="photo-upload" onclick="uploadPhoto()">
                                <i class="fas fa-camera"></i>
                            </button>
                        `;
                        console.log('✅ Foto actualizada en el perfil actual');
                    }
                }
                
                // ✅ PASO 5: Notificar cambios al dashboard (si está abierto)
                // Para la UI inmediata usamos cache-buster, pero en localStorage queda la URL "limpia"
                if (ProfileState.uploadedPhoto && finalPhotoUrl) {
                    const bustedUrl = `${finalPhotoUrl}${finalPhotoUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
                    const uiUserData = { ...updatedUserData, foto_url: bustedUrl };
                    const uiRailwayData = { ...updatedRailwayData, foto_url: bustedUrl };
                    updateDashboardData(uiUserData, uiRailwayData);
                } else {
                    updateDashboardData(updatedUserData, updatedRailwayData);
                }
                
                Swal.fire({
                    icon: 'success',
                    title: '¡Perfil actualizado!',
                    html: `
                        <div style="text-align: center;">
                            <h3><i class="fas fa-user-md"></i> Dr. ${updatedUserData.firstName} ${updatedUserData.lastName}</h3>
                            <p><strong>Especialidad:</strong> ${updatedUserData.especialidad}</p>
                            <p><strong>Colegiatura:</strong> ${updatedUserData.colegiatura}</p>
                            <hr style="margin: 15px 0;">
                            <p style="color: #27ae60;"><i class="fas fa-check-circle"></i> Datos actualizados en tiempo real</p>
                            ${ProfileState.uploadedPhoto ? '<p style="color: #3498db;"><i class="fas fa-camera"></i> Foto actualizada exitosamente</p>' : ''}
                        </div>
                    `,
                    showCancelButton: true,
                    confirmButtonColor: '#3498db',
                    cancelButtonColor: '#95a5a6',
                    confirmButtonText: '<i class="fas fa-home"></i> Ir al Dashboard',
                    cancelButtonText: '<i class="fas fa-edit"></i> Seguir Editando',
                    timer: 6000,
                    timerProgressBar: true
                }).then((result) => {
                    if (result.isConfirmed) {
                        goToDashboard();
                    }
                });
                
                ProfileState.hasChanges = false;
                ProfileState.uploadedPhoto = null;
            } else {
                throw new Error(result.message || 'Error actualizando perfil');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Error guardando perfil. Inténtalo nuevamente.'
            });
        }
    }

    /**
     * Cambiar contraseña - Función global llamada desde HTML (técnica como recover-password.js)
     */
    async function changePassword() {
        console.log('🔥 Iniciando cambio de contraseña...');
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Validaciones (como recover-password.js)
        if (!currentPassword || !newPassword || !confirmPassword) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Por favor completa todos los campos'
            });
            return;
        }
        
        if (newPassword !== confirmPassword) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Las contraseñas no coinciden'
            });
            return;
        }
        
        // Validación de complejidad (igual que recover-password.js)
        const passwordErrors = validatePassword(newPassword);
        if (passwordErrors.length > 0) {
            Swal.fire({
                icon: 'error',
                title: 'Contraseña no válida',
                html: `<div style="text-align: left;">
                    <strong>Requisitos faltantes:</strong><br>
                    ${passwordErrors.join('<br>')}
                </div>`
            });
            return;
        }
        
        try {
            // Mostrar loading (como recover-password.js)
            Swal.fire({
                title: 'Cambiando contraseña...',
                text: 'Por favor espere',
                allowOutsideClick: false,
                showConfirmButton: false,
                willOpen: () => {
                    Swal.showLoading();
                }
            });
            
            // Obtener token de acceso del localStorage
            const accessToken = localStorage.getItem('access_token') || localStorage.getItem('token');
            if (!accessToken) {
                throw new Error('No hay sesión activa. Inicia sesión nuevamente.');
            }
            
            // Usar JSON para el endpoint de auth (no FormData)
            const response = await fetch(`${ProfileState.backendUrl}/api/v1/auth/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });
            
            const result = await response.json();
            console.log('📡 Respuesta cambio contraseña:', result);
            
            if (response.ok && result.success) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Contraseña actualizada!',
                    text: 'Tu contraseña se ha cambiado exitosamente',
                    timer: 3000,
                    showConfirmButton: false
                });
                
                // Limpiar formulario
                clearPasswordFields();
            } else {
                throw new Error(result.message || 'Error cambiando contraseña');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Error cambiando contraseña. Verifica tu contraseña actual.'
            });
        }
    }

    /**
     * Función global para cancelar cambios (llamada desde HTML)
     */
    function cancelChanges() {
        // Usar SweetAlert como en el HTML original
        Swal.fire({
            title: '¿Cancelar cambios?',
            text: 'Se perderán todos los cambios no guardados',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#95a5a6',
            confirmButtonText: '<i class="fas fa-check"></i> Sí, cancelar',
            cancelButtonText: '<i class="fas fa-times"></i> No'
        }).then((result) => {
            if (result.isConfirmed) {
                location.reload();
            }
        });
    }

    /**
     * Función global para limpiar campos de contraseña (llamada desde HTML)
     */
    function clearPasswordFields() {
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
        document.getElementById('password-match').textContent = '';
        const strengthFill = document.getElementById('strength-fill');
        if (strengthFill) {
            strengthFill.className = 'password-strength-fill';
        }
    }

    /**
     * Función global para upload de foto (llamada desde HTML)
     */
    function uploadPhoto() {
        document.getElementById('photoInput').click();
    }

    /**
     * ✅ FUNCIÓN PARA ACTUALIZAR DASHBOARD EN TIEMPO REAL
     * Actualiza el nombre de bienvenida y la foto sin necesidad de recargar
     */
    function updateDashboardData(updatedUserData, updatedRailwayData) {
        console.log('🔄 Actualizando dashboard en tiempo real...');
        
        try {
            // ✅ ACTUALIZAR NOMBRE DE BIENVENIDA (como dashboard.js)
            const doctorNameElement = document.getElementById('doctorName');
            if (doctorNameElement) {
                let displayName = '';
                
                if (updatedUserData.displayName) {
                    displayName = updatedUserData.displayName;
                } else if (updatedUserData.firstName && updatedUserData.lastName) {
                    displayName = `Dr. ${updatedUserData.firstName} ${updatedUserData.lastName}`;
                } else if (updatedUserData.first_name && updatedUserData.last_name) {
                    displayName = `Dr. ${updatedUserData.first_name} ${updatedUserData.last_name}`;
                } else if (updatedUserData.fullName) {
                    displayName = `Dr. ${updatedUserData.fullName}`;
                } else if (updatedUserData.name) {
                    displayName = `Dr. ${updatedUserData.name}`;
                } else {
                    displayName = 'Dr. Usuario';
                }
                
                doctorNameElement.textContent = displayName;
                console.log('✅ Nombre actualizado en dashboard:', displayName);
            }
            
            // ✅ ACTUALIZAR FOTO DE AVATAR (como dashboard.js) 
            const avatarElement = document.getElementById('avatarContainer');
            if (avatarElement && (updatedUserData.foto_url || updatedRailwayData.foto_url)) {
                const avatarUrl = updatedUserData.foto_url || updatedRailwayData.foto_url;
                const avatarImg = avatarElement.querySelector('img') || document.createElement('img');
                
                avatarImg.src = avatarUrl;
                avatarImg.alt = `Foto Dr. ${updatedUserData.firstName || 'Usuario'}`;
                avatarImg.style.cssText = `
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid #fff;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                `;
                
                if (!avatarElement.querySelector('img')) {
                    avatarElement.appendChild(avatarImg);
                }
                
                console.log('✅ Foto actualizada en dashboard:', avatarUrl);
            }
            
            // ✅ DISPARAR EVENTO PERSONALIZADO para otros módulos
            const customEvent = new CustomEvent('userDataUpdated', {
                detail: {
                    userData: updatedUserData,
                    railwayData: updatedRailwayData
                }
            });
            document.dispatchEvent(customEvent);
            
            console.log('🔥 Dashboard actualizado exitosamente en tiempo real');
            
        } catch (error) {
            console.warn('⚠️ No se pudo actualizar dashboard (posiblemente no está cargado):', error);
        }
    }

    /**
     * Validación de contraseña (igual que recover-password.js)
     */
    function validatePassword(password) {
        const errors = [];
        
        if (password.length < 8) {
            errors.push('• Al menos 8 caracteres');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('• Al menos una mayúscula (A-Z)');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('• Al menos una minúscula (a-z)');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('• Al menos un número (0-9)');
        }
        if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
            errors.push('• Al menos un símbolo especial (!@#$%^&*)');
        }
        
        return errors;
    }

    /**
     * ✅ FUNCIÓN PARA ARREGLAR LOCALSTORAGE VACÍO
     */
    function fixLocalStorageData() {
        console.log('🔧 Arreglando localStorage con datos de usuario...');
        
        const userData = {
            id: 11,
            username: "acairampoma", 
            email: "alancairampoma@gmail.com",
            firstName: "Alan",
            lastName: "Cairampoma",
            first_name: "Alan",
            last_name: "Cairampoma",
            foto_url: "https://res.cloudinary.com/dz4czc3en/image/upload/v1756382125/hospital/avatars/avatar_acairampoma_474d708e.jpg"
        };
        
        const railwayData = {
            firstName: "Alan",
            lastName: "Cairampoma", 
            first_name: "Alan",
            last_name: "Cairampoma",
            foto_url: "https://res.cloudinary.com/dz4czc3en/image/upload/v1756382125/hospital/avatars/avatar_acairampoma_474d708e.jpg",
            especialidad: "Cardiología Avanzada",
            colegiatura: "CMP-12345", 
            telefono: "999888777",
            cargo: "Cardiólogo Senior"
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('railway_user_data', JSON.stringify(railwayData));
        
        console.log('✅ localStorage arreglado:', {userData, railwayData});
        
        Swal.fire({
            icon: 'success',
            title: 'localStorage Arreglado',
            text: 'Recarga la página para ver los cambios',
            confirmButtonText: 'Recargar Página'
        }).then(() => {
            location.reload();
        });
    }

    /**
     * ✅ FUNCIÓN DE TEST PARA DEBUG PROFILE UPDATE
     */
    async function testProfileUpdateDebug() {
        console.log('🧪 Iniciando test de update profile debug...');
        
        try {
            // Crear FormData exacto como el curl que funciona
            const testFormData = new FormData();
            testFormData.append('user_id', '11'); // Usar ID conocido
            testFormData.append('firstName', 'Test Update');
            testFormData.append('lastName', 'Frontend');
            testFormData.append('telefono', '111222333');
            testFormData.append('especialidad', 'Neurología Frontend');
            testFormData.append('colegiatura', 'TEST-123');
            testFormData.append('cargo', 'Doctor Test Frontend');
            
            console.log('🔍 Enviando datos de test profile...');
            for (let [key, value] of testFormData.entries()) {
                console.log(`${key}: ${value}`);
            }
            
            const token = localStorage.getItem('access_token') || localStorage.getItem('token');
            const response = await fetch(`${ProfileState.backendUrl}/api/v1/upload/update-profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: testFormData
            });
            
            const result = await response.json();
            
            console.log('📡 Respuesta test profile:', response.status, result);
            
            if (response.ok && result.success) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Test Profile Exitoso!',
                    text: `Usuario ${result.data.nombre_completo} actualizado`
                });
            } else {
                throw new Error(result.message || 'Error en test profile');
            }
            
        } catch (error) {
            console.error('❌ Error en test profile:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error en Test Profile',
                text: error.message
            });
        }
    }

    /**
     * ✅ FUNCIÓN PARA IR AL DASHBOARD CON ANIMACIÓN
     */
    function goToDashboard() {
        console.log('🏠 Regresando al dashboard...');
        
        // Mostrar loading suave
        Swal.fire({
            title: 'Regresando al Dashboard...',
            text: 'Los cambios se reflejarán inmediatamente',
            icon: 'info',
            timer: 1500,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading();
            }
        }).then(() => {
            window.location.href = '/dashboard';
        });
    }

    // Exponer funciones globales para el HTML
    window.saveProfile = saveProfile;
    window.changePassword = changePassword;
    window.cancelChanges = cancelChanges;
    window.clearPasswordFields = clearPasswordFields;
    window.uploadPhoto = uploadPhoto;
    window.goToDashboard = goToDashboard;
    window.testProfileUpdateDebug = testProfileUpdateDebug;
    window.fixLocalStorageData = fixLocalStorageData;

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();