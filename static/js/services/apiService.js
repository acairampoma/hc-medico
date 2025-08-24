/**
 * 🔌 API Service - Capa de servicios para todas las llamadas al backend
 * Arquitectura limpia con separación de responsabilidades
 */

class ApiService {
    constructor() {
        // Configuración base
        this.baseURL = 'https://hospital-app-backend-production.up.railway.app/api/v1';
        this.headers = {
            'Content-Type': 'application/json'
        };
    }

    /**
     * 🔑 Configurar token de autenticación
     */
    setAuthToken(token) {
        if (token) {
            this.headers['Authorization'] = `Bearer ${token}`;
        } else {
            delete this.headers['Authorization'];
        }
    }

    /**
     * 🔄 Método genérico para peticiones HTTP
     */
    async request(url, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${url}`, {
                ...options,
                headers: {
                    ...this.headers,
                    ...options.headers
                }
            });

            // Si no es OK, lanzar error con detalles
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
            }

            // Retornar JSON parseado
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * 📥 GET request
     */
    async get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, {
            method: 'GET'
        });
    }

    /**
     * 📤 POST request
     */
    async post(url, data = {}) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * 📤 POST con FormData (para archivos)
     */
    async postFormData(url, formData) {
        const headers = { ...this.headers };
        delete headers['Content-Type']; // FormData establece su propio Content-Type
        
        return this.request(url, {
            method: 'POST',
            headers,
            body: formData
        });
    }

    /**
     * ✏️ PUT request
     */
    async put(url, data = {}) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * ✏️ PUT con FormData (para archivos)
     */
    async putFormData(url, formData) {
        const headers = { ...this.headers };
        delete headers['Content-Type'];
        
        return this.request(url, {
            method: 'PUT',
            headers,
            body: formData
        });
    }

    /**
     * 🗑️ DELETE request
     */
    async delete(url) {
        return this.request(url, {
            method: 'DELETE'
        });
    }
}

// Exportar instancia singleton
const apiService = new ApiService();
export default apiService;