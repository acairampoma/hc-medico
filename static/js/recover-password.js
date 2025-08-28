/**
 * Recovery Password Module
 * Sistema de recuperación de contraseña en 4 pasos
 * Integración con Railway Backend
 */

(function() {
    'use strict';

    // Estado global del módulo
    const RecoveryState = {
        currentStep: 1,
        userEmail: '',
        verifiedCode: '',
        backendUrl: window.RAILWAY_BACKEND_URL || 'https://hospital-app-backend-production.up.railway.app'
    };

    // Elementos del DOM
    const DOM = {
        steps: {},
        forms: {},
        spinners: {},
        buttons: {},
        inputs: {}
    };

    /**
     * Inicialización del módulo
     */
    function init() {
        cacheDOMElements();
        bindEvents();
        console.log('🔑 Recovery Password System Initialized - Railway Integration Active');
    }

    /**
     * Cache de elementos del DOM
     */
    function cacheDOMElements() {
        // Contenedores de pasos
        DOM.steps = {
            step1: document.getElementById('step1'),
            step2: document.getElementById('step2'),
            step3: document.getElementById('step3'),
            step4: document.getElementById('step4')
        };

        // Formularios
        DOM.forms = {
            requestCode: document.getElementById('requestCodeForm'),
            verifyCode: document.getElementById('verifyCodeForm'),
            resetPassword: document.getElementById('resetPasswordForm')
        };

        // Spinners
        DOM.spinners = {
            step1: document.getElementById('step1Spinner'),
            step2: document.getElementById('step2Spinner'),
            step3: document.getElementById('step3Spinner')
        };

        // Inputs
        DOM.inputs = {
            recoveryEmail: document.getElementById('recoveryEmail'),
            verificationCode: document.getElementById('verificationCode'),
            newPassword: document.getElementById('newPassword'),
            confirmPassword: document.getElementById('confirmPassword')
        };
    }

    /**
     * Bind de eventos
     */
    function bindEvents() {
        // Paso 1: Solicitar código
        if (DOM.forms.requestCode) {
            DOM.forms.requestCode.addEventListener('submit', handleRequestCode);
        }

        // Paso 2: Verificar código
        if (DOM.forms.verifyCode) {
            DOM.forms.verifyCode.addEventListener('submit', handleVerifyCode);
        }

        // Paso 3: Resetear contraseña
        if (DOM.forms.resetPassword) {
            DOM.forms.resetPassword.addEventListener('submit', handleResetPassword);
        }

        // Eventos de navegación
        const backToStep1Btn = document.getElementById('backToStep1Btn');
        if (backToStep1Btn) {
            backToStep1Btn.addEventListener('click', () => goToStep(1));
        }

        const backToStep2Btn = document.getElementById('backToStep2Btn');
        if (backToStep2Btn) {
            backToStep2Btn.addEventListener('click', () => goToStep(2));
        }

        // Toggle password visibility
        document.querySelectorAll('.toggle-password').forEach(icon => {
            icon.addEventListener('click', handlePasswordToggle);
        });
    }

    /**
     * PASO 1: Solicitar código de recuperación
     */
    async function handleRequestCode(e) {
        e.preventDefault();
        
        const email = DOM.inputs.recoveryEmail.value;
        const spinner = DOM.spinners.step1;
        const btnText = DOM.forms.requestCode.querySelector('.btn-text');
        
        console.log('🔥 Iniciando envío de código de recuperación...');
        console.log('📧 Email:', email);
        
        showLoading(spinner, btnText);
        
        try {
            const formData = new FormData();
            formData.append('email', email);
            
            const response = await fetch(`${RecoveryState.backendUrl}/api/v1/upload/send-recovery-code`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                RecoveryState.userEmail = email;
                showStep(2);
                
                Swal.fire({
                    icon: 'success',
                    title: '¡Código Enviado!',
                    text: 'Revisa tu correo electrónico',
                    timer: 3000,
                    showConfirmButton: false
                });
            } else {
                throw new Error(result.message || 'Error enviando código');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Error enviando código. Verifica tu email.'
            });
        } finally {
            hideLoading(spinner, btnText);
        }
    }

    /**
     * PASO 2: Verificar código
     */
    async function handleVerifyCode(e) {
        e.preventDefault();
        
        const code = DOM.inputs.verificationCode.value;
        const spinner = DOM.spinners.step2;
        const btnText = DOM.forms.verifyCode.querySelector('.btn-text');
        
        showLoading(spinner, btnText);
        
        try {
            const formData = new FormData();
            formData.append('email', RecoveryState.userEmail);
            formData.append('code', code);
            
            const response = await fetch(`${RecoveryState.backendUrl}/api/v1/upload/verify-recovery-code`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                RecoveryState.verifiedCode = code;
                showStep(3);
                
                Swal.fire({
                    icon: 'success',
                    title: '¡Código Válido!',
                    text: 'Ahora puedes cambiar tu contraseña',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                throw new Error(result.message || 'Código inválido o expirado');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Código Inválido',
                text: error.message || 'Verifica el código e intenta nuevamente'
            });
        } finally {
            hideLoading(spinner, btnText);
        }
    }

    /**
     * PASO 3: Resetear contraseña
     */
    async function handleResetPassword(e) {
        e.preventDefault();
        
        const newPassword = DOM.inputs.newPassword.value;
        const confirmPassword = DOM.inputs.confirmPassword.value;
        
        // Validación de contraseñas
        if (newPassword !== confirmPassword) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Las contraseñas no coinciden'
            });
            return;
        }
        
        // Validación de complejidad
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
        
        const spinner = DOM.spinners.step3;
        const btnText = DOM.forms.resetPassword.querySelector('.btn-text');
        
        showLoading(spinner, btnText);
        
        try {
            const formData = new FormData();
            formData.append('email', RecoveryState.userEmail);
            formData.append('code', RecoveryState.verifiedCode);
            formData.append('new_password', newPassword);
            
            const response = await fetch(`${RecoveryState.backendUrl}/api/v1/upload/reset-password`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                showStep(4);
                
                // Limpiar estado
                RecoveryState.userEmail = '';
                RecoveryState.verifiedCode = '';
            } else {
                throw new Error(result.message || 'Error actualizando contraseña');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Error actualizando contraseña'
            });
        } finally {
            hideLoading(spinner, btnText);
        }
    }

    /**
     * Validación de contraseña
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
     * Navegación entre pasos
     */
    function showStep(step) {
        // Ocultar todos los pasos
        Object.values(DOM.steps).forEach(container => {
            if (container) container.style.display = 'none';
        });
        
        // Mostrar el paso actual
        if (DOM.steps[`step${step}`]) {
            DOM.steps[`step${step}`].style.display = 'block';
        }
        
        RecoveryState.currentStep = step;
        updateProgressIndicator(step);
    }

    /**
     * Actualizar indicador de progreso
     */
    function updateProgressIndicator(currentStep) {
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            step.classList.remove('active', 'completed');
            
            if (index + 1 < currentStep) {
                step.classList.add('completed');
            } else if (index + 1 === currentStep) {
                step.classList.add('active');
            }
        });
    }

    /**
     * Navegación a paso específico
     */
    function goToStep(step) {
        if (step === 1) {
            DOM.inputs.recoveryEmail.value = '';
            RecoveryState.userEmail = '';
        } else if (step === 2) {
            DOM.inputs.verificationCode.value = '';
            RecoveryState.verifiedCode = '';
        }
        showStep(step);
    }

    /**
     * Toggle visibilidad de contraseña
     */
    function handlePasswordToggle(e) {
        const icon = e.currentTarget;
        const inputId = icon.getAttribute('data-target');
        const input = document.getElementById(inputId);
        
        if (!input) return;
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    /**
     * Mostrar loading
     */
    function showLoading(spinner, btnText) {
        if (spinner) spinner.style.display = 'block';
        if (btnText) btnText.style.display = 'none';
    }

    /**
     * Ocultar loading
     */
    function hideLoading(spinner, btnText) {
        if (spinner) spinner.style.display = 'none';
        if (btnText) btnText.style.display = 'block';
    }

    // Exponer funciones necesarias globalmente
    window.RecoveryPassword = {
        init: init,
        goToStep: goToStep
    };

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();