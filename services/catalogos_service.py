"""
🔥 SERVICIO DE CATÁLOGOS - HOSPITAL DIGITAL
==========================================
Servicio profesional para consumir el microservicio de catálogos
Maneja la lógica de negocio y coordina con la API REST

Características:
✅ Programación funcional y orientada a objetos
✅ Manejo de errores robusto con logging
✅ Cache inteligente con TTL configurable  
✅ Retry automático con backoff exponencial
✅ Formateo automático para formularios
✅ Validación de datos de entrada
✅ Configuración flexible y extensible
✅ Documentación completa con ejemplos
"""

import requests
import logging
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from functools import wraps, lru_cache
from enum import Enum
import time
import json

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# =====================================================
# ENUMS Y CONSTANTES
# =====================================================

class TipoCatalogo(Enum):
    """Tipos de catálogos disponibles en el sistema"""
    TIPOS_DOCUMENTO = "TIPOS_DOCUMENTO"
    ESTADO_CIVIL = "ESTADO_CIVIL"
    OCUPACIONES = "OCUPACIONES"
    DIAGNOSTICOS = "DIAGNOSTICOS"
    TIPOS_SANGRE = "TIPOS_SANGRE"
    TIPOS_ALERGIA = "TIPOS_ALERGIA"
    TIPOS_SEGURO = "TIPOS_SEGURO"
    TIPOS_CONTACTO = "TIPOS_CONTACTO"
    ESPECIALIDADES = "ESPECIALIDADES"


class PrioridadCatalogo(Enum):
    """Prioridades para cache y carga"""
    CRITICA = 1
    ALTA = 2
    MEDIA = 3
    BAJA = 4


# =====================================================
# MODELOS DE DATOS
# =====================================================

@dataclass
class CatalogoConfig:
    """Configuración del servicio de catálogos"""
    base_url: str = "http://localhost:8090/api/catalogos"
    timeout: int = 30
    max_retries: int = 3
    cache_ttl_minutes: int = 15
    enable_logging: bool = True
    enable_cache: bool = True
    retry_delay: float = 1.0


@dataclass
class CatalogoItem:
    """Modelo unificado para elementos de catálogo"""
    codigo: str
    nombre: str
    descripcion: str
    categoria: str
    tabla_origen: str
    estado: str
    tipo: str
    id: Optional[int] = None
    valor_adicional: Optional[str] = None
    orden: Optional[int] = None
    datos_extra: Optional[Dict] = None
    
    def to_select_option(self) -> Dict[str, Any]:
        """Convierte a formato optimizado para SELECT HTML"""
        return {
            'value': self.codigo,
            'text': f"{self.codigo} - {self.nombre}",
            'label': self.nombre,
            'categoria': self.categoria,
            'estado': self.estado,
            'descripcion': self.descripcion,
            'data_extra': self.datos_extra or {}
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """Convierte a diccionario para JSON"""
        return asdict(self)


@dataclass
class ApiResponse:
    """Respuesta estándar de la API con metadata"""
    success: bool
    data: Any
    message: str
    total_items: int = 0
    cached: bool = False
    response_time_ms: int = 0
    error_code: Optional[str] = None
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()


# =====================================================
# DECORADORES Y HELPERS
# =====================================================

def measure_time(func):
    """Decorador para medir tiempo de ejecución"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        
        # Si el resultado es ApiResponse, agregar tiempo
        if isinstance(result, ApiResponse):
            result.response_time_ms = int((end_time - start_time) * 1000)
        
        return result
    return wrapper


def handle_errors(func):
    """Decorador para manejo centralizado de errores"""
    @wraps(func)
    def wrapper(self, *args, **kwargs):
        try:
            return func(self, *args, **kwargs)
        except requests.exceptions.Timeout:
            logger.error(f"⏰ Timeout en {func.__name__}")
            return ApiResponse(
                success=False,
                data=[],
                message="Timeout al conectar con el servicio de catálogos",
                error_code="TIMEOUT_ERROR"
            )
        except requests.exceptions.ConnectionError:
            logger.error(f"🔌 Error de conexión en {func.__name__}")
            return ApiResponse(
                success=False,
                data=[],
                message="No se pudo conectar con el servicio de catálogos",
                error_code="CONNECTION_ERROR"
            )
        except Exception as e:
            logger.error(f"❌ Error inesperado en {func.__name__}: {str(e)}")
            return ApiResponse(
                success=False,
                data=[],
                message=f"Error interno: {str(e)}",
                error_code="INTERNAL_ERROR"
            )
    return wrapper


# =====================================================
# SERVICIO PRINCIPAL
# =====================================================

class CatalogosService:
    """
    🚀 SERVICIO PRINCIPAL DE CATÁLOGOS
    
    Maneja todas las operaciones con el microservicio de catálogos
    Incluye cache inteligente, retry automático y formateo de datos
    
    Ejemplo de uso:
        service = CatalogosService(auth_token="jwt_token")
        medicamentos = service.obtener_medicamentos_para_select()
        examenes = service.buscar_examenes("sangre")
    """
    
    def __init__(self, auth_token: str = None, config: CatalogoConfig = None):
        self.config = config or CatalogoConfig()
        self.auth_token = auth_token
        self.session = self._create_session()
        
        # Cache en memoria con timestamps
        self._cache: Dict[str, Any] = {}
        self._cache_timestamps: Dict[str, datetime] = {}
        
        # Estadísticas
        self._stats = {
            'requests_total': 0,
            'cache_hits': 0,
            'cache_misses': 0,
            'errors': 0
        }
        
        if self.config.enable_logging:
            logger.info(f"🔥 CatalogosService inicializado - URL: {self.config.base_url}")
    
    def _create_session(self) -> requests.Session:
        """Crea sesión HTTP configurada"""
        session = requests.Session()
        session.timeout = self.config.timeout
        session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'HospitalApp-CatalogosService/1.0'
        })
        
        if self.auth_token:
            session.headers['Authorization'] = f'Bearer {self.auth_token}'
        
        return session
    
    def set_auth_token(self, token: str) -> None:
        """Actualiza el token de autenticación"""
        self.auth_token = token
        self.session.headers['Authorization'] = f'Bearer {token}'
        logger.info("🔐 Token de autenticación actualizado")
    
    def _get_cache_key(self, endpoint: str, params: Dict = None) -> str:
        """Genera clave única para cache"""
        params_str = json.dumps(params or {}, sort_keys=True)
        return f"{endpoint}_{hash(params_str)}"
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        """Verifica si el cache es válido"""
        if not self.config.enable_cache or cache_key not in self._cache_timestamps:
            return False
        
        timestamp = self._cache_timestamps[cache_key]
        expiry = timestamp + timedelta(minutes=self.config.cache_ttl_minutes)
        return datetime.now() < expiry
    
    def _get_from_cache(self, cache_key: str) -> Optional[ApiResponse]:
        """Obtiene datos del cache"""
        if self._is_cache_valid(cache_key):
            self._stats['cache_hits'] += 1
            cached_response = self._cache[cache_key]
            cached_response.cached = True
            logger.debug(f"📋 Cache hit: {cache_key}")
            return cached_response
        
        self._stats['cache_misses'] += 1
        return None
    
    def _set_cache(self, cache_key: str, response: ApiResponse) -> None:
        """Guarda datos en cache"""
        if self.config.enable_cache and response.success:
            self._cache[cache_key] = response
            self._cache_timestamps[cache_key] = datetime.now()
            logger.debug(f"💾 Guardado en cache: {cache_key}")
    
    @measure_time
    @handle_errors
    def _make_request(self, endpoint: str, params: Dict = None, use_cache: bool = True) -> ApiResponse:
        """
        Realiza petición HTTP con retry automático y cache
        
        Args:
            endpoint: Endpoint de la API (ej: "/tabla/TIPOS_DOCUMENTO")
            params: Parámetros query de la petición
            use_cache: Si usar cache o forzar petición nueva
        
        Returns:
            ApiResponse con los datos obtenidos
        """
        cache_key = self._get_cache_key(endpoint, params)
        
        # Verificar cache primero
        if use_cache:
            cached_response = self._get_from_cache(cache_key)
            if cached_response:
                return cached_response
        
        url = f"{self.config.base_url}{endpoint}"
        
        # Intentos con backoff exponencial
        for attempt in range(self.config.max_retries):
            try:
                self._stats['requests_total'] += 1
                
                logger.info(f"🌐 Petición: {url} | Params: {params} | Intento: {attempt + 1}")
                
                response = self.session.get(url, params=params)
                response.raise_for_status()
                
                json_data = response.json()
                
                # Procesar respuesta de la API
                if json_data.get('success', False):
                    api_response = ApiResponse(
                        success=True,
                        data=json_data.get('data', []),
                        message=json_data.get('message', 'Operación exitosa'),
                        total_items=len(json_data.get('data', [])) if isinstance(json_data.get('data'), list) else 1
                    )
                else:
                    api_response = ApiResponse(
                        success=False,
                        data=[],
                        message=json_data.get('message', 'Error en la API'),
                        error_code=json_data.get('error_code', 'API_ERROR')
                    )
                
                # Guardar en cache si fue exitoso
                if api_response.success:
                    self._set_cache(cache_key, api_response)
                
                logger.info(f"✅ Respuesta exitosa: {api_response.total_items} elementos")
                return api_response
                
            except requests.exceptions.Timeout:
                logger.warning(f"⏰ Timeout en intento {attempt + 1}")
                if attempt == self.config.max_retries - 1:
                    raise
                time.sleep(self.config.retry_delay * (2 ** attempt))
                
            except requests.exceptions.RequestException as e:
                logger.error(f"❌ Error HTTP: {str(e)}")
                self._stats['errors'] += 1
                if attempt == self.config.max_retries - 1:
                    raise
                time.sleep(self.config.retry_delay * (2 ** attempt))
        
        # Si llegamos aquí, falló todo
        return ApiResponse(
            success=False,
            data=[],
            message="Error después de múltiples intentos",
            error_code="MAX_RETRIES_EXCEEDED"
        )
    
    def _convert_to_catalog_items(self, data: List[Dict]) -> List[CatalogoItem]:
        """Convierte respuesta de API a lista de CatalogoItem"""
        items = []
        
        for item_data in data:
            try:
                # Mapear campos de la respuesta de la API
                item = CatalogoItem(
                    codigo=item_data.get('codigo_busqueda', ''),
                    nombre=item_data.get('descripcion_principal', ''),
                    descripcion=item_data.get('descripcion_principal', ''),
                    categoria=item_data.get('categoria_principal', ''),
                    tabla_origen=item_data.get('tabla_origen', ''),
                    estado=item_data.get('estado', 'ACTIVO'),
                    tipo=item_data.get('tipo_busqueda', 'CATALOGO'),
                    datos_extra=item_data
                )
                items.append(item)
                
            except Exception as e:
                logger.warning(f"⚠️ Error procesando item: {e}")
                continue
        
        return items

    # =====================================================
    # MÉTODOS PÚBLICOS - BÚSQUEDAS GENERALES
    # =====================================================
    
    def buscar_general(self, termino: str) -> Tuple[bool, List[CatalogoItem], str]:
        """
        Búsqueda general en todos los catálogos
        
        Args:
            termino: Texto a buscar en código o descripción
            
        Returns:
            Tupla con (éxito, lista_resultados, mensaje)
        """
        if not termino or len(termino.strip()) < 2:
            return False, [], "El término de búsqueda debe tener al menos 2 caracteres"
        
        response = self._make_request("/buscar", {"q": termino.strip()})
        items = self._convert_to_catalog_items(response.data) if response.success else []
        
        return response.success, items, response.message
    
    def buscar_por_codigo(self, codigo: str) -> Tuple[bool, Optional[CatalogoItem], str]:
        """
        Búsqueda por código exacto
        
        Args:
            codigo: Código exacto a buscar
            
        Returns:
            Tupla con (éxito, item_encontrado, mensaje)
        """
        if not codigo or not codigo.strip():
            return False, None, "Código requerido"
        
        response = self._make_request(f"/codigo/{codigo.strip().upper()}")
        
        if response.success and response.data:
            items = self._convert_to_catalog_items([response.data])
            return True, items[0] if items else None, response.message
        
        return False, None, response.message

    # =====================================================
    # MÉTODOS ESPECÍFICOS POR TIPO DE CATÁLOGO
    # =====================================================
    
    def obtener_tipos_documento(self, termino: str = "") -> Tuple[bool, List[CatalogoItem], str]:
        """Obtiene tipos de documento (DNI, CE, etc.)"""
        endpoint = "/tabla/TIPOS_DOCUMENTO"
        if termino:
            endpoint += f"/buscar"
            params = {"q": termino}
        else:
            params = None
        
        response = self._make_request(endpoint, params)
        items = self._convert_to_catalog_items(response.data) if response.success else []
        return response.success, items, response.message
    
    def obtener_estados_civiles(self, termino: str = "") -> Tuple[bool, List[CatalogoItem], str]:
        """Obtiene estados civiles (Soltero, Casado, etc.)"""
        endpoint = "/tabla/ESTADO_CIVIL"
        if termino:
            endpoint += f"/buscar"
            params = {"q": termino}
        else:
            params = None
        
        response = self._make_request(endpoint, params)
        items = self._convert_to_catalog_items(response.data) if response.success else []
        return response.success, items, response.message
    
    def obtener_ocupaciones(self, termino: str = "") -> Tuple[bool, List[CatalogoItem], str]:
        """Obtiene ocupaciones (Médico, Ingeniero, etc.)"""
        endpoint = "/tabla/OCUPACIONES"
        if termino:
            endpoint += f"/buscar"
            params = {"q": termino}
        else:
            params = None
        
        response = self._make_request(endpoint, params)
        items = self._convert_to_catalog_items(response.data) if response.success else []
        return response.success, items, response.message
    
    def buscar_diagnosticos(self, termino: str) -> Tuple[bool, List[CatalogoItem], str]:
        """Busca diagnósticos CIE-10"""
        if not termino or len(termino.strip()) < 2:
            return False, [], "Ingrese al menos 2 caracteres para buscar diagnósticos"
        
        response = self._make_request("/diagnosticos/buscar", {"q": termino.strip()})
        items = self._convert_to_catalog_items(response.data) if response.success else []
        return response.success, items, response.message
    
    def obtener_tipos_sangre(self) -> Tuple[bool, List[CatalogoItem], str]:
        """Obtiene tipos de sangre (A+, A-, B+, etc.)"""
        response = self._make_request("/tabla/TIPOS_SANGRE")
        items = self._convert_to_catalog_items(response.data) if response.success else []
        return response.success, items, response.message
    
    def obtener_tipos_alergia(self) -> Tuple[bool, List[CatalogoItem], str]:
        """Obtiene tipos de alergia (Medicamentos, Alimentos, etc.)"""
        response = self._make_request("/tabla/TIPOS_ALERGIA")
        items = self._convert_to_catalog_items(response.data) if response.success else []
        return response.success, items, response.message
    
    def obtener_tipos_seguro(self) -> Tuple[bool, List[CatalogoItem], str]:
        """Obtiene tipos de seguro (SIS, EsSalud, etc.)"""
        response = self._make_request("/tabla/TIPOS_SEGURO")
        items = self._convert_to_catalog_items(response.data) if response.success else []
        return response.success, items, response.message
    
    def obtener_tipos_contacto(self) -> Tuple[bool, List[CatalogoItem], str]:
        """Obtiene tipos de contacto/parentesco (Padre, Madre, etc.)"""
        response = self._make_request("/tabla/TIPOS_CONTACTO")
        items = self._convert_to_catalog_items(response.data) if response.success else []
        return response.success, items, response.message

    # =====================================================
    # MÉTODOS OPTIMIZADOS PARA FORMULARIOS
    # =====================================================
    
    def obtener_tipos_documento_para_select(self) -> List[Dict[str, Any]]:
        """🎯 Optimizado para SELECT de tipos de documento"""
        success, items, _ = self.obtener_tipos_documento()
        return [item.to_select_option() for item in items] if success else []
    
    def obtener_estados_civiles_para_select(self) -> List[Dict[str, Any]]:
        """🎯 Optimizado para SELECT de estados civiles"""
        success, items, _ = self.obtener_estados_civiles()
        return [item.to_select_option() for item in items] if success else []
    
    def obtener_ocupaciones_para_select(self) -> List[Dict[str, Any]]:
        """🎯 Optimizado para SELECT de ocupaciones"""
        success, items, _ = self.obtener_ocupaciones()
        return [item.to_select_option() for item in items] if success else []
    
    def obtener_tipos_sangre_para_select(self) -> List[Dict[str, Any]]:
        """🎯 Optimizado para SELECT de tipos de sangre"""
        success, items, _ = self.obtener_tipos_sangre()
        return [item.to_select_option() for item in items] if success else []
    
    def obtener_tipos_alergia_para_select(self) -> List[Dict[str, Any]]:
        """🎯 Optimizado para SELECT de tipos de alergia"""
        success, items, _ = self.obtener_tipos_alergia()
        return [item.to_select_option() for item in items] if success else []
    
    def obtener_tipos_seguro_para_select(self) -> List[Dict[str, Any]]:
        """🎯 Optimizado para SELECT de tipos de seguro"""
        success, items, _ = self.obtener_tipos_seguro()
        return [item.to_select_option() for item in items] if success else []
    
    def obtener_tipos_contacto_para_select(self) -> List[Dict[str, Any]]:
        """🎯 Optimizado para SELECT de tipos de contacto"""
        success, items, _ = self.obtener_tipos_contacto()
        return [item.to_select_option() for item in items] if success else []

    # =====================================================
    # MÉTODOS DE CARGA MASIVA POR PESTAÑA
    # =====================================================
    
    def cargar_catalogos_datos_personales(self) -> Dict[str, List[Dict]]:
        """
        🚀 Carga todos los catálogos necesarios para Pestaña 1: Datos Personales
        
        Returns:
            Diccionario con los catálogos formateados para selects
        """
        logger.info("📋 Cargando catálogos para Datos Personales...")
        
        return {
            'tipos_documento': self.obtener_tipos_documento_para_select(),
            'estados_civiles': self.obtener_estados_civiles_para_select(),
            'ocupaciones': self.obtener_ocupaciones_para_select()
        }
    
    def cargar_catalogos_informacion_medica(self) -> Dict[str, List[Dict]]:
        """
        🚀 Carga todos los catálogos necesarios para Pestaña 2: Información Médica
        
        Returns:
            Diccionario con los catálogos formateados para selects
        """
        logger.info("🏥 Cargando catálogos para Información Médica...")
        
        return {
            'tipos_sangre': self.obtener_tipos_sangre_para_select(),
            'tipos_alergia': self.obtener_tipos_alergia_para_select()
            # diagnósticos se cargan dinámicamente con búsqueda
        }
    
    def cargar_catalogos_seguros_contactos(self) -> Dict[str, List[Dict]]:
        """
        🚀 Carga todos los catálogos necesarios para Pestaña 3: Seguros y Contactos
        
        Returns:
            Diccionario con los catálogos formateados para selects
        """
        logger.info("🛡️ Cargando catálogos para Seguros y Contactos...")
        
        return {
            'tipos_seguro': self.obtener_tipos_seguro_para_select(),
            'tipos_contacto': self.obtener_tipos_contacto_para_select()
        }
    
    def cargar_todos_los_catalogos_formulario(self) -> Dict[str, Any]:
        """
        🔥 MÉTODO MAESTRO - Carga TODOS los catálogos del formulario de afiliación
        
        Returns:
            Diccionario completo con todos los catálogos organizados por pestaña
        """
        logger.info("🚀 Iniciando carga completa de catálogos...")
        
        start_time = time.time()
        
        resultado = {
            'datos_personales': self.cargar_catalogos_datos_personales(),
            'informacion_medica': self.cargar_catalogos_informacion_medica(),
            'seguros_contactos': self.cargar_catalogos_seguros_contactos(),
            'servicio_disponible': True,
            'estadisticas': self.obtener_estadisticas(),
            'tiempo_carga_ms': 0,
            'timestamp': datetime.now().isoformat()
        }
        
        end_time = time.time()
        resultado['tiempo_carga_ms'] = int((end_time - start_time) * 1000)
        
        logger.info(f"✅ Catálogos cargados en {resultado['tiempo_carga_ms']}ms")
        
        return resultado

    # =====================================================
    # MÉTODOS DE VALIDACIÓN
    # =====================================================
    
    def validar_codigo_existe(self, codigo: str, tipo_catalogo: TipoCatalogo = None) -> Tuple[bool, str, Optional[CatalogoItem]]:
        """
        Valida que un código existe en los catálogos
        
        Args:
            codigo: Código a validar
            tipo_catalogo: Tipo específico donde buscar (opcional)
            
        Returns:
            Tupla con (válido, mensaje, item_encontrado)
        """
        if not codigo or not codigo.strip():
            return False, "Código requerido", None
        
        success, item, mensaje = self.buscar_por_codigo(codigo.strip())
        
        if success and item:
            # Si se especificó tipo, validar que coincida
            if tipo_catalogo and item.tabla_origen != tipo_catalogo.value:
                return False, f"Código {codigo} no pertenece al catálogo {tipo_catalogo.value}", None
            
            return True, "Código válido", item
        else:
            return False, f"Código {codigo} no encontrado", None

    # =====================================================
    # MÉTODOS DE UTILIDAD Y ESTADÍSTICAS
    # =====================================================
    
    def health_check(self) -> Tuple[bool, str]:
        """Verifica estado del microservicio"""
        try:
            response = self._make_request("/health", use_cache=False)
            return response.success, response.message
        except Exception as e:
            return False, f"Error en health check: {str(e)}"
    
    def obtener_info_microservicio(self) -> Dict[str, Any]:
        """Obtiene información del microservicio"""
        response = self._make_request("/info")
        return response.data if response.success else {}
    
    def obtener_estadisticas(self) -> Dict[str, Any]:
        """Obtiene estadísticas del servicio"""
        total_requests = self._stats['requests_total']
        cache_hit_rate = (self._stats['cache_hits'] / max(total_requests, 1)) * 100
        
        return {
            'requests_total': total_requests,
            'cache_hits': self._stats['cache_hits'],
            'cache_misses': self._stats['cache_misses'],
            'cache_hit_rate_percent': round(cache_hit_rate, 2),
            'errors': self._stats['errors'],
            'cache_entries': len(self._cache),
            'config': asdict(self.config)
        }
    
    def limpiar_cache(self) -> None:
        """Limpia todo el cache"""
        self._cache.clear()
        self._cache_timestamps.clear()
        logger.info("🧹 Cache limpiado completamente")
    
    def limpiar_estadisticas(self) -> None:
        """Reinicia las estadísticas"""
        self._stats = {
            'requests_total': 0,
            'cache_hits': 0,
            'cache_misses': 0,
            'errors': 0
        }
        logger.info("📊 Estadísticas reiniciadas")


# =====================================================
# FUNCIONES HELPER Y FACTORY
# =====================================================

def crear_servicio_catalogos(auth_token: str = None, 
                            base_url: str = "http://localhost:8090/api/catalogos",
                            cache_ttl_minutes: int = 15) -> CatalogosService:
    """
    🚀 FUNCIÓN FACTORY PARA CREAR SERVICIO RÁPIDAMENTE
    
    Args:
        auth_token: Token JWT de autenticación
        base_url: URL base del microservicio
        cache_ttl_minutes: Tiempo de vida del cache en minutos
        
    Returns:
        Instancia configurada de CatalogosService
    """
    config = CatalogoConfig(
        base_url=base_url,
        timeout=30,
        max_retries=3,
        cache_ttl_minutes=cache_ttl_minutes,
        enable_logging=True,
        enable_cache=True
    )
    
    return CatalogosService(auth_token=auth_token, config=config)


def crear_servicio_para_formulario_afiliacion(auth_token: str) -> CatalogosService:
    """
    🎯 CONFIGURACIÓN ESPECÍFICA PARA FORMULARIO DE AFILIACIÓN
    
    Args:
        auth_token: Token JWT de autenticación
        
    Returns:
        Servicio optimizado para formulario de afiliación
    """
    config = CatalogoConfig(
        base_url="http://localhost:8090/api/catalogos",
        timeout=25,
        max_retries=2,
        cache_ttl_minutes=30,  # Cache más largo para formularios
        enable_logging=True,
        enable_cache=True,
        retry_delay=0.5
    )
    
    return CatalogosService(auth_token=auth_token, config=config)


# =====================================================
# INSTANCIA GLOBAL (SINGLETON PATTERN)
# =====================================================

_global_catalogos_service: Optional[CatalogosService] = None


def get_catalogos_service(auth_token: str = None) -> CatalogosService:
    """
    📦 PATRÓN SINGLETON - Obtiene instancia global del servicio
    
    Args:
        auth_token: Token JWT (requerido en primera llamada)
        
    Returns:
        Instancia global de CatalogosService
    """
    global _global_catalogos_service
    
    if _global_catalogos_service is None:
        if not auth_token:
            raise ValueError("Token de autenticación requerido para inicializar el servicio")
        
        _global_catalogos_service = crear_servicio_catalogos(auth_token)
        logger.info("🌍 Servicio global de catálogos inicializado")
    
    elif auth_token and auth_token != _global_catalogos_service.auth_token:
        # Actualizar token si cambió
        _global_catalogos_service.set_auth_token(auth_token)
    
    return _global_catalogos_service


def reset_global_service() -> None:
    """Resetea la instancia global (útil para testing)"""
    global _global_catalogos_service
    _global_catalogos_service = None
    logger.info("🔄 Servicio global reseteado")


# =====================================================
# EJEMPLOS DE USO Y DOCUMENTACIÓN
# =====================================================

