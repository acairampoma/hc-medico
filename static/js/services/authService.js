/**
 * 🔐 Auth Service - Manejo de autenticación y recuperación de contraseña
 */

import apiService from './apiService.js';

class AuthService {
    constructor() {
        this.tokenKey = 'hospital_access_token';
        this.refreshTokenKey = 'hospital_refresh_token';
        this.userKey = 'hospital_user';
    }

    /**
     * 🔐 Login con email y contraseña
     */
    async login(email, password) {
        try {
            const response = await apiService.post('/auth/login', {
                email,
                password
            });

            if (response.success && response.data) {
                // Guardar tokens
                this.saveTokens(response.data.token);
                // Guardar usuario
                this.saveUser(response.data.user);
                // Configurar token en API service
                apiService.setAuthToken(response.data.token.access_token);
                
                return {
                    success: true,
                    user: response.data.user,
                    message: response.message
                };
            }

            throw new Error(response.message || 'Error en login');
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 📝 Registro con foto
     */
    async registerWithPhoto(formData) {
        try {
            const response = await apiService.postFormData('/upload/register-with-photo', formData);
            
            if (response.success) {
                return {
                    success: true,
                    user: response.data,
                    message: response.message
                };
            }

            throw new Error(response.message || 'Error en registro');
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 📧 Enviar código de recuperación
     */
    async sendRecoveryCode(email) {
        try {
            const formData = new FormData();
            formData.append('email', email);
            
            const response = await apiService.postFormData('/upload/send-recovery-code', formData);
            
            if (response.success) {
                return {
                    success: true,
                    message: 'Código enviado a tu correo'
                };
            }

            throw new Error(response.message || 'Error enviando código');
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * ✅ Verificar código de recuperación
     */
    async verifyRecoveryCode(email, code) {
        try {
            const formData = new FormData();
            formData.append('email', email);
            formData.append('code', code);
            
            const response = await apiService.postFormData('/upload/verify-recovery-code', formData);
            
            if (response.success) {
                return {
                    success: true,
                    valid: response.data.code_valid,
                    message: response.data.message
                };
            }

            throw new Error(response.message || 'Código inválido');
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 🔑 Resetear contraseña
     */
    async resetPassword(email, code, newPassword) {
        try {
            const formData = new FormData();
            formData.append('email', email);
            formData.append('code', code);
            formData.append('new_password', newPassword);
            
            const response = await apiService.postFormData('/upload/reset-password', formData);
            
            if (response.success) {
                return {
                    success: true,
                    message: 'Contraseña actualizada exitosamente'
                };
            }

            throw new Error(response.message || 'Error actualizando contraseña');
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 🚪 Logout
     */
    async logout() {
        try {
            await apiService.post('/auth/logout');
        } catch (error) {
            console.error('Error en logout:', error);
        } finally {
            this.clearAuth();
            window.location.href = '/login.html';
        }
    }

    /**
     * 🔄 Refrescar token
     */
    async refreshToken() {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) return false;

        try {
            const response = await apiService.post('/auth/refresh', {
                refresh_token: refreshToken
            });

            if (response.success && response.data) {
                this.saveTokens(response.data);
                apiService.setAuthToken(response.data.access_token);
                return true;
            }
        } catch (error) {
            console.error('Error refrescando token:', error);
        }

        return false;
    }

    /**
     * 💾 Guardar tokens
     */
    saveTokens(tokenData) {
        localStorage.setItem(this.tokenKey, tokenData.access_token);
        localStorage.setItem(this.refreshTokenKey, tokenData.refresh_token);
    }

    /**
     * 💾 Guardar usuario
     */
    saveUser(user) {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    /**
     * 📖 Obtener usuario actual
     */
    getCurrentUser() {
        const userStr = localStorage.getItem(this.userKey);
        return userStr ? JSON.parse(userStr) : null;
    }

    /**
     * 📖 Obtener token
     */
    getAccessToken() {
        return localStorage.getItem(this.tokenKey);
    }

    /**
     * 📖 Obtener refresh token
     */
    getRefreshToken() {
        return localStorage.getItem(this.refreshTokenKey);
    }

    /**
     * 🧹 Limpiar autenticación
     */
    clearAuth() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.refreshTokenKey);
        localStorage.removeItem(this.userKey);
        apiService.setAuthToken(null);
    }

    /**
     * ✅ Verificar si está autenticado
     */
    isAuthenticated() {
        return !!this.getAccessToken();
    }

    /**
     * 🏥 Verificar si es médico
     */
    isMedico() {
        const user = this.getCurrentUser();
        return user && user.is_medico;
    }

    /**
     * 🔧 Inicializar auth (llamar al cargar la app)
     */
    init() {
        const token = this.getAccessToken();
        if (token) {
            apiService.setAuthToken(token);
        }
    }
}

// Exportar instancia singleton
const authService = new AuthService();
export default authService;