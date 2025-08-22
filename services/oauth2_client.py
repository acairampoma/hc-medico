"""
Cliente OAuth2 para integración con microservicio de autenticación
Maneja tokens, refresh y comunicación con el gateway
"""

import httpx
import base64
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
import json
import asyncio
from dataclasses import dataclass
import logging

# Configurar logging
logger = logging.getLogger(__name__)

@dataclass
class OAuth2Config:
    """Configuración del cliente OAuth2"""
    base_url: str = "http://localhost:8090"  # 🔒 PUERTO DEL GATEWAY DE SEGURIDAD
    client_id: str = "gateway-client"
    client_secret: str = "123456"
    token_endpoint: str = "/oauth2/password-token"
    timeout: int = 10
    
    @property
    def auth_header(self) -> str:
        """Genera el header de autorización Basic"""
        credentials = f"{self.client_id}:{self.client_secret}"
        encoded = base64.b64encode(credentials.encode()).decode()
        return f"Basic {encoded}"

@dataclass
class TokenResponse:
    """Respuesta del token OAuth2"""
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "Bearer"
    expires_in: int = 3600
    scope: Optional[str] = None
    
    @property
    def expires_at(self) -> datetime:
        """Calcula cuándo expira el token"""
        return datetime.now() + timedelta(seconds=self.expires_in)
    
    @property
    def is_expired(self) -> bool:
        """Verifica si el token ha expirado"""
        return datetime.now() >= self.expires_at
    
    @property
    def authorization_header(self) -> str:
        """Header de autorización completo"""
        return f"{self.token_type} {self.access_token}"

class OAuth2Client:
    """Cliente OAuth2 elegante para el microservicio"""
    
    def __init__(self, config: Optional[OAuth2Config] = None):
        self.config = config or OAuth2Config()
        self._token_cache: Dict[str, TokenResponse] = {}
        
    async def authenticate(
        self, 
        username: str, 
        password: str, 
        scope: str = "read write"
    ) -> Tuple[bool, Optional[TokenResponse], Optional[str]]:
        """
        Autentica un usuario con el microservicio OAuth2
        
        Returns:
            Tuple[success, token_response, error_message]
        """
        try:
            logger.info(f"🔐 Autenticando usuario: {username}")
            
            # Preparar datos del formulario
            form_data = {
                'grant_type': 'password',
                'username': username,
                'password': password,
                'scope': scope
            }
            
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': self.config.auth_header,
                'Accept': 'application/json'
            }
            
            async with httpx.AsyncClient(timeout=self.config.timeout) as client:
                response = await client.post(
                    f"{self.config.base_url}{self.config.token_endpoint}",
                    data=form_data,
                    headers=headers
                )
                
                logger.info(f"📡 Respuesta OAuth2: {response.status_code}")
                
                if response.status_code == 200:
                    token_data = response.json()
                    token_response = TokenResponse(
                        access_token=token_data.get('access_token'),
                        refresh_token=token_data.get('refresh_token'),
                        token_type=token_data.get('token_type', 'Bearer'),
                        expires_in=token_data.get('expires_in', 3600),
                        scope=token_data.get('scope')
                    )
                    
                    # Cachear token por usuario
                    self._token_cache[username] = token_response
                    
                    logger.info(f"✅ Autenticación exitosa para {username}")
                    return True, token_response, None
                    
                elif response.status_code == 401:
                    error_msg = "Credenciales inválidas"
                    logger.warning(f"❌ {error_msg} para {username}")
                    return False, None, error_msg
                    
                elif response.status_code == 400:
                    try:
                        error_data = response.json()
                        error_msg = error_data.get('error_description', 'Solicitud inválida')
                    except:
                        error_msg = "Datos de solicitud incorrectos"
                    logger.warning(f"❌ {error_msg}")
                    return False, None, error_msg
                    
                else:
                    error_msg = f"Error del servidor: {response.status_code}"
                    logger.error(f"🚫 {error_msg}")
                    return False, None, error_msg
                    
        except httpx.ConnectError as e:
            error_msg = "No se pudo conectar con el servidor de autenticación"
            logger.error(f"🌐 {error_msg}: {str(e)}")
            return False, None, error_msg
            
        except httpx.TimeoutException as e:
            error_msg = "Tiempo de espera agotado"
            logger.error(f"⏰ {error_msg}: {str(e)}")
            return False, None, error_msg
            
        except Exception as e:
            error_msg = f"Error inesperado: {str(e)}"
            logger.error(f"💥 {error_msg}")
            return False, None, error_msg
    
    async def refresh_token(self, refresh_token: str) -> Tuple[bool, Optional[TokenResponse], Optional[str]]:
        """
        Renueva un token usando refresh token
        """
        try:
            logger.info("🔄 Renovando token...")
            
            form_data = {
                'grant_type': 'refresh_token',
                'refresh_token': refresh_token
            }
            
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': self.config.auth_header,
                'Accept': 'application/json'
            }
            
            async with httpx.AsyncClient(timeout=self.config.timeout) as client:
                response = await client.post(
                    f"{self.config.base_url}{self.config.token_endpoint}",
                    data=form_data,
                    headers=headers
                )
                
                if response.status_code == 200:
                    token_data = response.json()
                    token_response = TokenResponse(
                        access_token=token_data.get('access_token'),
                        refresh_token=token_data.get('refresh_token', refresh_token),
                        token_type=token_data.get('token_type', 'Bearer'),
                        expires_in=token_data.get('expires_in', 3600),
                        scope=token_data.get('scope')
                    )
                    
                    logger.info("✅ Token renovado exitosamente")
                    return True, token_response, None
                else:
                    error_msg = "No se pudo renovar el token"
                    logger.error(f"❌ {error_msg}")
                    return False, None, error_msg
                    
        except Exception as e:
            error_msg = f"Error renovando token: {str(e)}"
            logger.error(f"💥 {error_msg}")
            return False, None, error_msg
    
    async def get_user_info(self, username: str, token: str) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Obtiene información detallada del usuario desde el microservicio
        """
        try:
            logger.info(f"👤 Obteniendo info del usuario: {username}")
            
            headers = {
                'Authorization': f'Bearer {token}',
                'Accept': 'application/json'
            }
            
            # 🔍 LOG DEBUGGING
            url = f"{self.config.base_url}/api/usuarios/users/username/{username}"
            logger.info(f"🌐 URL COMPLETA: {url}")
            logger.info(f"🔑 Headers: {headers}")
            
            async with httpx.AsyncClient(timeout=self.config.timeout) as client:
                logger.info(f"🚀 Haciendo request a: {url}")
                
                response = await client.get(
                    url,
                    headers=headers
                )
                
                logger.info(f"📡 Status Code: {response.status_code}")
                logger.info(f"📦 Response Headers: {dict(response.headers)}")
                
                # 🔍 LOG RESPONSE BODY COMPLETO
                response_text = response.text
                logger.info(f"📋 Response Body: {response_text}")
                
                if response.status_code == 200:
                    try:
                        user_data = response.json()
                        logger.info(f"✅ JSON Parseado: {user_data}")
                        logger.info(f"🔍 Tipo de respuesta: {type(user_data)}")
                        
                        # 🔍 ANALIZAR ESTRUCTURA
                        if isinstance(user_data, dict):
                            logger.info(f"📋 Keys en respuesta: {list(user_data.keys())}")
                            
                            # Si viene en formato ApiResponse
                            if 'data' in user_data:
                                actual_data = user_data['data']
                                logger.info(f"🎯 Datos en 'data': {actual_data}")
                                return True, actual_data, None
                            else:
                                logger.info(f"🎯 Usando respuesta directa: {user_data}")
                                return True, user_data, None
                        else:
                            logger.error(f"❌ Respuesta no es dict: {type(user_data)}")
                            return False, None, "Formato de respuesta inválido"
                            
                    except json.JSONDecodeError as e:
                        logger.error(f"❌ Error parseando JSON: {e}")
                        logger.error(f"❌ Response text: {response_text}")
                        return False, None, "Error parseando respuesta JSON"
                        
                elif response.status_code == 404:
                    error_msg = "Usuario no encontrado"
                    logger.warning(f"❌ {error_msg}: {username}")
                    return False, None, error_msg
                elif response.status_code == 401:
                    error_msg = "Token inválido o expirado"
                    logger.warning(f"❌ {error_msg}")
                    return False, None, error_msg
                else:
                    error_msg = f"Error del servidor: {response.status_code}"
                    logger.error(f"🚫 {error_msg}")
                    logger.error(f"🚫 Response: {response_text}")
                    return False, None, error_msg
                    
        except httpx.ConnectError as e:
            error_msg = "No se pudo conectar con el servidor de usuarios"
            logger.error(f"🌐 {error_msg}: {str(e)}")
            return False, None, error_msg
            
        except Exception as e:
            error_msg = f"Error obteniendo info del usuario: {str(e)}"
            logger.error(f"💥 {error_msg}")
            return False, None, error_msg

    async def validate_token(self, token: str) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """
        Valida un token con el servidor OAuth2
        """
        try:
            headers = {
                'Authorization': f'Bearer {token}',
                'Accept': 'application/json'
            }
            
            # Endpoint para validar token (ajusta según tu API)
            async with httpx.AsyncClient(timeout=self.config.timeout) as client:
                response = await client.get(
                    f"{self.config.base_url}/oauth2/check_token",
                    headers=headers
                )
                
                if response.status_code == 200:
                    user_info = response.json()
                    logger.info("✅ Token válido")
                    return True, user_info
                else:
                    logger.warning("❌ Token inválido")
                    return False, None
                    
        except Exception as e:
            logger.error(f"💥 Error validando token: {str(e)}")
            return False, None
    
    def get_cached_token(self, username: str) -> Optional[TokenResponse]:
        """Obtiene token desde cache"""
        token = self._token_cache.get(username)
        if token and not token.is_expired:
            return token
        elif token and token.is_expired:
            # Limpiar token expirado del cache
            del self._token_cache[username]
        return None
    
    def clear_cache(self, username: Optional[str] = None):
        """Limpia cache de tokens"""
        if username:
            self._token_cache.pop(username, None)
            logger.info(f"🧹 Cache limpiado para {username}")
        else:
            self._token_cache.clear()
            logger.info("🧹 Cache completo limpiado")
    
    async def logout(self, token: str) -> bool:
        """
        Cierra sesión (revoca token) y destruye completamente el token
        """
        try:
            logger.info("🚪 Iniciando proceso de logout...")
            
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            # Intentar revocar el token en el servidor OAuth2
            async with httpx.AsyncClient(timeout=self.config.timeout) as client:
                # Primero intentamos el endpoint estándar de revoke
                response = await client.post(
                    f"{self.config.base_url}/oauth2/revoke",
                    headers=headers,
                    data={'token': token}
                )
                
                if response.status_code in [200, 204]:
                    logger.info("✅ Token revocado en servidor OAuth2")
                    return True
                elif response.status_code == 404:
                    # Si no existe el endpoint revoke, el token se considera destruido localmente
                    logger.info("⚠️ Endpoint revoke no disponible, destruyendo token localmente")
                    return True
                else:
                    logger.warning(f"❌ Error revocando token: {response.status_code}")
                    # Aún así consideramos exitoso para limpiar localmente
                    return True
                    
        except httpx.ConnectError:
            logger.warning("🌐 No se pudo conectar para revocar token, destruyendo localmente")
            # Si no se puede conectar, al menos limpiamos localmente
            return True
        except Exception as e:
            logger.error(f"💥 Error en logout: {str(e)}")
            # Aún así retornamos True para limpiar la sesión local
            return True

# Instancia singleton del cliente OAuth2
oauth2_client = OAuth2Client()

# Factory function para tests o configuraciones personalizadas
def create_oauth2_client(
    base_url: str = "http://localhost:8090",
    client_id: str = "gateway-client",
    client_secret: str = "123456"
) -> OAuth2Client:
    """Crea una instancia personalizada del cliente OAuth2"""
    config = OAuth2Config(
        base_url=base_url,
        client_id=client_id,
        client_secret=client_secret
    )
    return OAuth2Client(config)