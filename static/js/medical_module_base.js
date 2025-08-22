/**
 * MEDICAL MODULE BASE - CLAUDE DEV
 * Clase base para todos los módulos médicos
 */

class MedicalModule {
    constructor(moduleName, config = {}) {
        this.moduleName = moduleName;
        this.config = {
            debug: false,
            apiEndpoint: '/api',
            ...config
        };
        
        // Inicializar cuando DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    init() {
        this.log(`🏥 Inicializando ${this.moduleName}...`);
        this.setupEventListeners();
        this.loadInitialData();
    }
    
    setupEventListeners() {
        // Implementar en clases hijas
    }
    
    loadInitialData() {
        // Implementar en clases hijas
    }
    
    log(message, type = 'info') {
        if (this.config.debug) {
            console.log(`[${this.moduleName}] ${message}`);
        }
    }
    
    showToast(type, title, message) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: type,
                title: title,
                text: message,
                timer: 3000,
                showConfirmButton: false,
                position: 'top-end',
                toast: true
            });
        } else {
            alert(`${title}: ${message}`);
        }
    }
    
    handleError(error, context = '') {
        this.log(`❌ Error en ${context}: ${error.message}`, 'error');
        this.showToast('error', 'Error', `Error en ${context}: ${error.message}`);
    }
    
    getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
}

console.log('📋 MedicalModule Base cargado correctamente');
