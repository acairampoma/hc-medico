
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
                    // Aquí conectarías con tu API Java para recuperación
                    Toast.fire({
                        icon: 'info',
                        title: '📧 Email enviado',
                        text: `Instrucciones enviadas a ${result.value}`
                    });
                }
            });
        }

        // Manejar envío del formulario con SweetAlert2
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const loginBtn = document.querySelector('.login-btn');
            const btnText = document.querySelector('.btn-text');
            const spinner = document.querySelector('.loading-spinner');
            
            // Validaciones con SweetAlert2
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
            
            // Mostrar loading elegante
            Swal.fire({
                title: '🏥 Autenticando...',
                html: `
                    <div style="display: flex; align-items: center; justify-content: center; margin: 20px 0;">
                        <div style="animate: spin 1s linear infinite; margin-right: 10px;">
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
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {


                    if (result.token) {
                        localStorage.setItem('access_token', result.token);
                        sessionStorage.setItem('access_token', result.token);
                        window.authToken = result.token;
                        console.log('✅ Token guardado:', result.token.substring(0, 20) + '...');
                    }
                    



                    // Login exitoso con celebración personalizada
                    const userName = result.user ? 
                        `${result.user.firstName || ''} ${result.user.lastName || ''}`.trim() || result.user.name :
                        'Usuario';
                    
                    await Swal.fire({
                        icon: 'success',
                        title: '✅ ¡Bienvenido!',
                        html: `
                            <div style="text-align: center; margin: 20px 0;">
                                <div style="font-size: 3rem; margin-bottom: 15px;">🏥</div>
                                <p style="color: #00a86b; font-weight: 600; margin-bottom: 10px; font-size: 1.2rem;">
                                    ¡Hola Dr. ${userName}!
                                </p>
                                <p style="color: #2c5aa0; margin-bottom: 5px;">${result.message}</p>
                                <p style="color: #7f8c8d; font-size: 0.9rem;">Redirigiendo al sistema hospitalario...</p>
                            </div>
                        `,
                        timer: 3000,
                        timerProgressBar: true,
                        showConfirmButton: false,
                        confirmButtonColor: '#00a86b',
                        background: '#ffffff',
                        color: '#2c3e50',
                        customClass: {
                            popup: 'welcome-popup'
                        }
                    });
                    
                    // Redirección suave
                    window.location.href = result.redirect || '/dashboard';
                    
                } else {
                    // Error de login
                    await Swal.fire({
                        icon: 'error',
                        title: '❌ Error de autenticación',
                        html: `
                            <div style="text-align: center; margin: 20px 0;">
                                <p style="color: #e74c3c; font-weight: 600; margin-bottom: 10px;">${result.message}</p>
                                <p style="color: #7f8c8d; font-size: 0.9rem;">Verifica tus credenciales e intenta nuevamente</p>
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
                console.error('Error:', error);
                await Swal.fire({
                    icon: 'error',
                    title: '🚫 Error de conexión',
                    html: `
                        <div style="text-align: center; margin: 20px 0;">
                            <div style="font-size: 2rem; margin-bottom: 15px;">🌐</div>
                            <p style="color: #e74c3c; font-weight: 600; margin-bottom: 10px;">No se pudo conectar con el servidor</p>
                            <p style="color: #7f8c8d; font-size: 0.9rem;">Verifica tu conexión a internet e intenta nuevamente</p>
                        </div>
                    `,
                    confirmButtonText: '<i class="fas fa-wifi"></i> Reintentar',
                    confirmButtonColor: '#e74c3c',
                    background: '#ffffff',
                    color: '#2c3e50'
                });
            }
        });

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
