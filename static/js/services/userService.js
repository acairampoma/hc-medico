/**
 * 👤 User Service - Manejo de perfil y datos de usuario
 */

import apiService from './apiService.js';

class UserService {
    /**
     * 📋 Obtener perfil de usuario
     */
    async getProfile() {
        try {
            const response = await apiService.get('/usuarios/profile');
            
            if (response.success) {
                return {
                    success: true,
                    user: response.data,
                    message: response.message
                };
            }

            throw new Error(response.message || 'Error obteniendo perfil');
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * ✏️ Actualizar perfil (sin cambiar email/username)
     */
    async updateProfile(formData) {
        try {
            const response = await apiService.putFormData('/upload/update-profile', formData);
            
            if (response.success) {
                return {
                    success: true,
                    user: response.data,
                    message: 'Perfil actualizado exitosamente'
                };
            }

            throw new Error(response.message || 'Error actualizando perfil');
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 🔄 Cambiar contraseña
     */
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await apiService.put('/usuarios/change-password', {
                current_password: currentPassword,
                new_password: newPassword
            });
            
            if (response.success) {
                return {
                    success: true,
                    message: 'Contraseña cambiada exitosamente'
                };
            }

            throw new Error(response.message || 'Error cambiando contraseña');
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 📊 Obtener estadísticas de usuario
     */
    async getUserStats() {
        try {
            const response = await apiService.get('/usuarios/stats');
            
            if (response.success) {
                return {
                    success: true,
                    stats: response.data
                };
            }

            throw new Error(response.message || 'Error obteniendo estadísticas');
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 🏥 Obtener información profesional del médico
     */
    async getMedicoInfo() {
        try {
            const response = await apiService.get('/usuarios/medico-info');
            
            if (response.success) {
                return {
                    success: true,
                    medicoInfo: response.data
                };
            }

            throw new Error(response.message || 'Error obteniendo información médica');
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 📄 Descargar PDF de certificación médica
     */
    async downloadCertification() {
        try {
            const response = await apiService.get('/usuarios/certification-pdf');
            
            // Crear blob y descargar
            const blob = new Blob([response], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'certificacion-medica.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            return {
                success: true,
                message: 'Certificación descargada'
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error descargando certificación'
            };
        }
    }

    /**
     * 🗑️ Eliminar cuenta de usuario
     */
    async deleteAccount(password) {
        try {
            const response = await apiService.delete('/usuarios/account', {
                password: password
            });
            
            if (response.success) {
                return {
                    success: true,
                    message: 'Cuenta eliminada exitosamente'
                };
            }

            throw new Error(response.message || 'Error eliminando cuenta');
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 📸 Actualizar solo foto de perfil
     */
    async updateProfilePhoto(file) {
        try {
            const formData = new FormData();
            formData.append('foto_perfil', file);
            
            const response = await apiService.putFormData('/usuarios/profile-photo', formData);
            
            if (response.success) {
                return {
                    success: true,
                    photoUrl: response.data.foto_perfil_url,
                    message: 'Foto actualizada exitosamente'
                };
            }

            throw new Error(response.message || 'Error actualizando foto');
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
}

// Exportar instancia singleton
const userService = new UserService();
export default userService;