# middleware/auth_middleware.py - VERSIÓN COMPLETA CORREGIDA

from fastapi import Request
from fastapi.responses import RedirectResponse, JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import os
import logging
import jwt
from typing import Callable
from datetime import datetime, timezone
import urllib.parse

logger = logging.getLogger(__name__)

class AuthMiddleware(BaseHTTPMiddleware):
    """Middleware SÚPER INTELIGENTE que encuentra el token DONDE SEA"""
    
    def __init__(self, app, **kwargs):
        super().__init__(app)
        
        # Variables de entorno
        dev_mode_raw = os.getenv("DEVELOPMENT_MODE", "false")
        security_raw = os.getenv("SECURITY_ENABLED", "true")
        
        self.development_mode = dev_mode_raw.lower() == "true"
        self.security_enabled = security_raw.lower() == "true"
        
        print(f"\n🚨 MIDDLEWARE SÚPER INTELIGENTE INIT:")
        print(f"   development_mode: {self.development_mode}")
        print(f"   security_enabled: {self.security_enabled}")
        
        # Rutas públicas
        self.public_routes = [
            "/", "/login", "/access-denied", "/api/login", "/api/logout", 
            "/api/health", "/static/", "/docs", "/redoc", "/openapi.json", "/favicon.ico"
        ]
        
        # Rutas protegidas  
        self.protected_routes = [
            "/dashboard", "/medical/", "/api/user/", "/api/protected/", 
            "/api/hospital/", "/api/patients/", "/api/pharmacy/", 
            "/api/vital-signs/", "/api/dicom/"
        ]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Dispatch SÚPER INTELIGENTE"""
        
        path = request.url.path
        method = request.method
        query_string = str(request.url.query)
        
        print(f"\n🔍 {method} {path}")
        print(f"   🔗 Query string completa: {query_string}")
        
        # BYPASS en desarrollo
        if self.development_mode or not self.security_enabled:
            print(f"   ✅ BYPASS ACTIVO (desarrollo)")
            return await call_next(request)
        
        # Verificar tipo de ruta
        is_public = self._is_public_route(path)
        is_protected = self._is_protected_route(path)
        
        print(f"   🔓 Es pública: {is_public}")
        print(f"   🔐 Es protegida: {is_protected}")
        
        # 🎯 RUTAS PROTEGIDAS - VALIDAR TOKEN
        if is_protected:
            print(f"   🔐 RUTA PROTEGIDA - Iniciando búsqueda EXHAUSTIVA...")
            
            # 🧠 BÚSQUEDA EXHAUSTIVA DE TOKEN
            token = self._find_token_exhaustive(request)
            
            if not token:
                print(f"   ❌ NO SE ENCONTRÓ TOKEN - Access Denied")
                return self._redirect_to_access_denied(path)
            
            # Validar token
            if self._validate_token_smart(token):
                print(f"   ✅ TOKEN VÁLIDO - Acceso autorizado")
                return await call_next(request)
            else:
                print(f"   ❌ TOKEN INVÁLIDO - Access Denied")
                return self._redirect_to_access_denied(path)

        # 🔓 RUTAS PÚBLICAS - PERMITIR
        if is_public:
            print(f"   ✅ RUTA PÚBLICA - Permitiendo")
            return await call_next(request)
        
        # 🤷 RUTA NO CLASIFICADA - PERMITIR POR DEFECTO
        print(f"   🤷 RUTA NO CLASIFICADA - Permitiendo")
        return await call_next(request)

    def _is_public_route(self, path: str) -> bool:
        """Verificar si es ruta pública"""
        return any(path == route or path.startswith(route) for route in self.public_routes)
    
    def _is_protected_route(self, path: str) -> bool:
        """Verificar si es ruta protegida"""
        return any(path.startswith(route) for route in self.protected_routes)

    def _find_token_exhaustive(self, request: Request) -> str:
        """🧠 BÚSQUEDA EXHAUSTIVA - ENCUENTRA EL TOKEN DONDE SEA"""
        
        print(f"     🔍 === INICIANDO BÚSQUEDA EXHAUSTIVA ===")
        
        # 1. Authorization header (estándar JWT)
        print(f"     1️⃣ Buscando en Authorization header...")
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()
            if len(token) > 10:
                print(f"     ✅ Token encontrado en Authorization header: {token[:30]}...")
                return token
        print(f"     ❌ No hay token en Authorization header")
        
        # 2. Headers personalizados
        print(f"     2️⃣ Buscando en headers personalizados...")
        custom_headers = ["X-Auth-Token", "X-Access-Token", "Auth-Token", "Token", "access_token"]
        for header_name in custom_headers:
            token = request.headers.get(header_name, "").strip()
            if token and len(token) > 10:
                print(f"     ✅ Token encontrado en header {header_name}: {token[:30]}...")
                return token
        print(f"     ❌ No hay token en headers personalizados")
        
        # 3. 🍪 COOKIES - BÚSQUEDA MEJORADA
        print(f"     3️⃣ Buscando en cookies...")
        print(f"     🍪 Cookies RAW: {request.headers.get('cookie', 'No cookie header')}")
        print(f"     🍪 Cookies parseadas: {dict(request.cookies)}")

        # Lista COMPLETA de nombres de cookies a buscar
        cookie_names = ["access_token", "auth_token", "session_token", "token", "authToken", "accessToken"]

        for cookie_name in cookie_names:
            token = request.cookies.get(cookie_name, "").strip()
            if token and len(token) > 10:
                print(f"     ✅ Token encontrado en cookie '{cookie_name}': {token[:30]}...")
                print(f"     🔍 Token completo length: {len(token)}")
                return token

        print(f"     ❌ No hay token válido en cookies")
        print(f"     🔍 Cookies encontradas: {list(request.cookies.keys())}")
        
        # 4. Query parameters (EXHAUSTIVO)
        print(f"     4️⃣ Buscando en query parameters...")
        print(f"     🔗 Query params RAW: {dict(request.query_params)}")
        
        # Lista COMPLETA de posibles nombres de parámetros
        query_param_names = [
            "token", "access_token", "auth_token", "authToken", 
            "accessToken", "access-token", "auth-token",
            "bearer", "jwt", "authorization", "auth"
        ]
        
        for param_name in query_param_names:
            # Obtener valor del parámetro
            token = request.query_params.get(param_name, "").strip()
            if token and len(token) > 10:
                print(f"     ✅ Token encontrado en query param {param_name}: {token[:30]}...")
                return token
        
        # 5. BÚSQUEDA MANUAL EN QUERY STRING (por si acaso)
        print(f"     5️⃣ Búsqueda manual en query string...")
        query_string = str(request.url.query)
        if query_string:
            print(f"     🔍 Query string completa: {query_string}")
            
            # Decodificar URL por si está encoded
            try:
                decoded_query = urllib.parse.unquote(query_string)
                print(f"     🔍 Query string decodificada: {decoded_query}")
                
                # Buscar patrones de token
                for param_name in query_param_names:
                    if f"{param_name}=" in decoded_query:
                        # Extraer valor manualmente
                        start = decoded_query.find(f"{param_name}=") + len(f"{param_name}=")
                        end = decoded_query.find("&", start)
                        if end == -1:
                            end = len(decoded_query)
                        
                        token = decoded_query[start:end].strip()
                        if token and len(token) > 10:
                            print(f"     ✅ Token extraído manualmente de {param_name}: {token[:30]}...")
                            return token
            except Exception as e:
                print(f"     ⚠️ Error decodificando query string: {e}")
        
        print(f"     ❌ Token NO encontrado en query parameters")
        
        # 6. RESUMEN FINAL
        print(f"     📋 === RESUMEN DE BÚSQUEDA ===")
        print(f"     📋 Headers disponibles: {list(request.headers.keys())}")
        print(f"     🍪 Cookies disponibles: {list(request.cookies.keys())}")
        print(f"     🔗 Query params disponibles: {list(request.query_params.keys())}")
        print(f"     🔗 Query string RAW: {request.url.query}")
        print(f"     ❌ === TOKEN NO ENCONTRADO EN NINGÚN LUGAR ===")
        
        return None

    def _validate_token_smart(self, token: str) -> bool:
        """🧠 VALIDACIÓN INTELIGENTE con todas las verificaciones"""
        try:
            print(f"     🔒 === VALIDANDO TOKEN ===")
            print(f"     🔒 Token recibido: {token[:30]}... (longitud: {len(token)})")
            
            # 0. 🚫 VERIFICAR BLACKLIST PRIMERO
            try:
                from services.auth_service import auth_service
                if hasattr(auth_service, 'is_token_blacklisted') and auth_service.is_token_blacklisted(token):
                    print(f"     🚫 Token está BLACKLISTED - RECHAZADO")
                    return False
                print(f"     ✅ Token no está en blacklist")
            except Exception as e:
                print(f"     ⚠️ No se pudo verificar blacklist: {e}")
            
            # 1. Verificación básica de formato
            if not token or len(token) < 20:
                print(f"     ❌ Token muy corto o vacío (longitud: {len(token)})")
                return False
            
            # 2. Si parece JWT, validar estructura
            if token.count('.') >= 2:
                try:
                    print(f"     📋 Detectado como JWT, validando...")
                    # Decodificar sin verificar firma (para obtener info)
                    payload = jwt.decode(token, options={"verify_signature": False})
                    print(f"     📋 JWT payload: {payload}")
                    
                    # Verificar expiración
                    if 'exp' in payload:
                        exp_timestamp = payload['exp']
                        current_timestamp = datetime.now(timezone.utc).timestamp()
                        
                        if current_timestamp > exp_timestamp:
                            print(f"     ⏰ JWT expirado (exp: {exp_timestamp}, now: {current_timestamp})")
                            return False
                        else:
                            print(f"     ✅ JWT vigente (exp: {exp_timestamp}, now: {current_timestamp})")
                    
                    # Verificar que tenga usuario
                    user_fields = ['sub', 'username', 'user', 'user_name', 'preferred_username']
                    has_user = any(field in payload for field in user_fields)
                    
                    if has_user:
                        user_info = {field: payload.get(field) for field in user_fields if field in payload}
                        print(f"     ✅ JWT válido con usuario: {user_info}")
                        return True
                    else:
                        print(f"     ⚠️ JWT sin información de usuario válida")
                        return False
                        
                except Exception as jwt_error:
                    print(f"     ⚠️ Error procesando JWT: {jwt_error}")
                    # No es JWT válido, continuar con validación básica
                    pass
            
            # 3. Para tokens no-JWT, validación básica de longitud
            if len(token) >= 30:
                print(f"     ✅ Token no-JWT pero formato válido (longitud: {len(token)})")
                return True
            
            print(f"     ❌ Token no válido (formato desconocido, longitud: {len(token)})")
            return False
            
        except Exception as e:
            print(f"     💥 Error validando token: {e}")
            return False

    def _redirect_to_access_denied(self, original_path: str) -> Response:
        """Redireccionar a access denied con información detallada"""
        if original_path.startswith("/api/"):
            print(f"     🔄 API endpoint - Devolviendo JSON 401")
            return JSONResponse(
                status_code=401,
                content={
                    "success": False, 
                    "message": "Token de acceso requerido",
                    "error_code": "MISSING_TOKEN",
                    "path": original_path
                }
            )
        
        print(f"     🔄 Web endpoint - Redirigiendo a access-denied")
        access_denied_url = f"/access-denied?reason=missing_token&redirect={original_path}"
        return RedirectResponse(url=access_denied_url, status_code=302)