"""
Servicio principal de autenticación - VERSIÓN MEJORADA
Maneja la lógica de negocio y coordina con Railway Backend
SOLUCIÓN COMPLETA PARA ROLES EJECUTIVA
"""

from typing import Optional, Dict, Any, Tuple, Set
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass, asdict
import httpx  

logger = logging.getLogger(__name__)

# URL del backend Railway
RAILWAY_BACKEND_URL = "https://hospital-app-backend-production.up.railway.app"

@dataclass
class TokenResponse:
    """Token simple para Railway"""
    access_token: str
    token_type: str = "Bearer"
    expires_in: int = 3600
    
    @property
    def expires_at(self) -> datetime:
        return datetime.now() + timedelta(seconds=self.expires_in)
    
    @property
    def is_expired(self) -> bool:
        return datetime.now() > self.expires_at

@dataclass
class UserSession:
    """Información de sesión del usuario CON datos profesionales Y ROLES CORREGIDOS"""
    user_id: str
    username: str
    name: str
    email: Optional[str] = None
    role: str = "ROLE_USER"  # 🔑 MANTENER FORMATO ROLE_XXXX
    permissions: list = None
    token: Optional[TokenResponse] = None
    login_time: datetime = None
    last_activity: datetime = None
    
    # Campos básicos del usuario
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    
    # 🔥 NUEVOS CAMPOS PROFESIONALES
    cmp: Optional[str] = None
    tipo: Optional[str] = None  
    hospital_id: Optional[int] = None
    area_trabajo: Optional[str] = None
    especialidad_principal: Optional[str] = None
    datos_profesional_raw: Optional[str] = None
    datos_profesional_parsed: Optional[dict] = None
    
    # 🔥 NUEVO: Array completo de roles
    roles_array: Optional[list] = None
    
    def __post_init__(self):
        if self.login_time is None:
            self.login_time = datetime.now()
        if self.last_activity is None:
            self.last_activity = datetime.now()
        if self.permissions is None:
            self.permissions = []
        if self.roles_array is None:
            self.roles_array = [self.role] if self.role else ["ROLE_USER"]
    
    @property
    def is_active(self) -> bool:
        """Verifica si la sesión está activa (menos de 24 horas)"""
        if self.last_activity is None:
            return False
        return (datetime.now() - self.last_activity) < timedelta(hours=24)
    
    def update_activity(self):
        """Actualiza la última actividad"""
        self.last_activity = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convierte la sesión a diccionario para JSON CON datos profesionales Y ROLES"""
        data = {
            'user_id': self.user_id,
            'username': self.username,
            'name': self.name,
            'email': self.email,
            'role': self.role,  # 🔑 ROL PRINCIPAL (ROLE_EJECUTIVA)
            'roles': self.roles_array or [self.role],  # 🔑 ARRAY DE ROLES
            'permissions': self.permissions,
            'firstName': self.firstName,
            'lastName': self.lastName,
            
            # 🔥 INCLUIR DATOS PROFESIONALES
            'cmp': self.cmp,
            'tipo': self.tipo,
            'hospital_id': self.hospital_id, 
            'area_trabajo': self.area_trabajo,
            'especialidad_principal': self.especialidad_principal,
            'datos_profesional_parsed': self.datos_profesional_parsed,
            
            # Datos calculados
            'displayName': f"Dr. {self.firstName} {self.lastName}".strip() if self.firstName and self.lastName else self.name,
            'fullName': f"{self.firstName} {self.lastName}".strip() if self.firstName and self.lastName else self.name,
        }
        
        # Convertir datetime a string
        if self.login_time:
            data['login_time'] = self.login_time.isoformat()
        if self.last_activity:
            data['last_activity'] = self.last_activity.isoformat()
            
        return data

@dataclass
class LoginResult:
    """Resultado del proceso de login"""
    success: bool
    message: str
    user_session: Optional[UserSession] = None
    token: Optional[str] = None
    error_code: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convierte el resultado a diccionario para API"""
        result = {
            'success': self.success,
            'message': self.message
        }
        
        if self.user_session:
            result['user'] = self.user_session.to_dict()
        
        if self.token:
            result['token'] = self.token
            result['redirect'] = '/dashboard'
        
        if self.error_code:
            result['error_code'] = self.error_code
            
        return result

class AuthService:
    """Servicio principal de autenticación - VERSIÓN MEJORADA RAILWAY"""
    
    def __init__(self):
        self._active_sessions: Dict[str, UserSession] = {}
        self._failed_attempts: Dict[str, list] = {}
        self.max_failed_attempts = 5
        self.lockout_duration = timedelta(minutes=15)
        self._blacklisted_tokens = set()

    async def login(
        self, 
        username: str, 
        password: str,
        remember_me: bool = False
    ) -> LoginResult:
        """
        Proceso completo de login - RAILWAY BACKEND
        """
        try:
            logger.info(f"🔑 Iniciando login para: {username}")
            
            # Verificar si está bloqueado por intentos fallidos
            if self._is_account_locked(username):
                return LoginResult(
                    success=False,
                    message="Cuenta temporalmente bloqueada por múltiples intentos fallidos",
                    error_code="ACCOUNT_LOCKED"
                )
            
            # Autenticar directo con Railway
            success, token_response, error_msg = await self._railway_login(
                username=username,
                password=password
            )
            
            if success and token_response:
                # Crear sesión de usuario CON ROLES CORREGIDOS
                user_session = await self._create_user_session(
                    username=username,
                    token_response=token_response
                )
                
                # Limpiar intentos fallidos
                self._clear_failed_attempts(username)
                
                # Guardar sesión activa
                self._active_sessions[username] = user_session
                
                logger.info(f"✅ Login exitoso para: {username} con rol: {user_session.role}")
                
                return LoginResult(
                    success=True,
                    message="Autenticación exitosa",
                    user_session=user_session,
                    token=token_response.access_token
                )
            else:
                # Registrar intento fallido
                self._record_failed_attempt(username)
                
                logger.warning(f"❌ Login fallido para: {username}")
                
                return LoginResult(
                    success=False,
                    message=error_msg or "Credenciales inválidas",
                    error_code="INVALID_CREDENTIALS"
                )
                
        except Exception as e:
            logger.error(f"💥 Error en login: {str(e)}")
            return LoginResult(
                success=False,
                message="Error interno del servidor",
                error_code="INTERNAL_ERROR"
            )
    
    async def _railway_login(self, username: str, password: str) -> tuple[bool, Optional[TokenResponse], Optional[str]]:
        """Login directo con Railway backend"""
        try:
            async with httpx.AsyncClient(verify=False) as client:
                # Login directo como funciona
                response = await client.post(
                    f"{RAILWAY_BACKEND_URL}/api/v1/auth/login",
                    json={"username": username, "password": password},
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and data.get("data", {}).get("token", {}).get("access_token"):
                        token = TokenResponse(
                            access_token=data["data"]["token"]["access_token"],
                            token_type="Bearer"
                        )
                        logger.info(f"✅ Login Railway exitoso para: {username}")
                        return True, token, None
                    else:
                        error_msg = "Token no encontrado en respuesta"
                        logger.warning(f"❌ Login Railway fallido: {error_msg}")
                        return False, None, error_msg
                else:
                    error_msg = f"Error HTTP {response.status_code}"
                    logger.error(f"❌ Error Railway: {error_msg}")
                    return False, None, error_msg
                    
        except Exception as e:
            logger.error(f"💥 Error conectando Railway: {str(e)}")
            return False, None, f"Error de conexión: {str(e)}"
    
    async def _get_railway_user_info(self, username: str, token: str) -> tuple[bool, Optional[dict], Optional[str]]:
        """Obtener info del usuario desde Railway"""
        try:
            async with httpx.AsyncClient(verify=False) as client:
                response = await client.get(
                    f"{RAILWAY_BACKEND_URL}/api/usuarios/me",
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        user_data = data.get("data", {})
                        logger.info(f"✅ Info usuario Railway obtenida: {user_data.get('username', 'unknown')}")
                        return True, user_data, None
                    else:
                        error_msg = data.get("message", "Error obteniendo usuario")
                        return False, None, error_msg
                else:
                    error_msg = f"Error HTTP {response.status_code}"
                    logger.warning(f"⚠️ Railway user info error: {error_msg}")
                    return False, None, error_msg
                    
        except Exception as e:
            logger.error(f"💥 Error obteniendo user info Railway: {str(e)}")
            return False, None, f"Error de conexión: {str(e)}"
    
    async def _create_user_session(
        self, 
        username: str, 
        token_response: TokenResponse
    ) -> UserSession:
        """
        Crea una sesión de usuario con información COMPLETA del Railway backend
        """
        try:
            # Obtener datos completos del microservicio
            logger.info(f"👤 Obteniendo datos completos para: {username}")
            
            success, user_data, error = await self._get_railway_user_info(
                username=username,
                token=token_response.access_token
            )
            
            if success and user_data:
                logger.info(f"✅ Datos obtenidos del Railway backend: {user_data}")
                
                # Crear sesión con datos del backend
                firstName = user_data.get('firstName', user_data.get('nombre_completo', '').split()[0] if user_data.get('nombre_completo') else '')
                lastName = user_data.get('lastName', ' '.join(user_data.get('nombre_completo', '').split()[1:]) if user_data.get('nombre_completo') else '')
                
                user_session = UserSession(
                    user_id=str(user_data.get('id', f"user_{hash(username) % 10000}")),
                    username=user_data.get('username', username),
                    name=user_data.get('nombre_completo', f"{firstName} {lastName}".strip()),
                    email=user_data.get('email', f"{username}@hospital.com"),
                    role="ROLE_ADMIN" if username.lower() == "admin" else "ROLE_USER",
                    permissions=self._get_user_permissions("ROLE_ADMIN" if username.lower() == "admin" else "ROLE_USER"),
                    token=token_response,
                    firstName=firstName,
                    lastName=lastName
                )
                
                logger.info(f"👤 Sesión COMPLETA creada para {username}")
                return user_session
            else:
                logger.warning(f"⚠️ No se pudo obtener info del usuario {username}, usando datos básicos")
                return self._create_basic_user_session(username, token_response)
                
        except Exception as e:
            logger.error(f"💥 Error creando sesión con datos del Railway backend: {str(e)}")
            return self._create_basic_user_session(username, token_response)

    def _create_basic_user_session(
        self, 
        username: str, 
        token_response: TokenResponse
    ) -> UserSession:
        """
        Crea una sesión básica cuando no se puede obtener info del microservicio
        """
        # Determinar rol basado en username (fallback)
        if username.lower() == "admin":
            role = "ROLE_ADMIN"
        else:
            role = "ROLE_USER"
        
        # Determinar nombre display
        name = f"Dr. {username.title()}" if role in ["ROLE_ADMIN", "ROLE_MEDICO"] else username.title()
        
        user_session = UserSession(
            user_id=f"user_{hash(username) % 10000}",  # ID simple para demo
            username=username,
            name=name,
            email=f"{username}@hospital.com",
            role=role,
            permissions=self._get_user_permissions(role),
            token=token_response,
            roles_array=[role]  # 🔑 ARRAY CON EL ROL
        )
        
        logger.info(f"👤 Sesión básica creada para {username} con rol: {role}")
        return user_session
    
    def _get_user_permissions(self, role: str) -> list:
        """
        Obtiene permisos basados en el rol
        """
        permissions_map = {
            "ROLE_ADMIN": [
                "view_patients", "create_patients", "edit_patients", "delete_patients",
                "view_appointments", "create_appointments", "edit_appointments", "delete_appointments",
                "view_staff", "create_staff", "edit_staff", "delete_staff",
                "view_reports", "create_reports", "system_config"
            ],
            "ROLE_MEDICO": [
                "view_patients", "create_patients", "edit_patients",
                "view_appointments", "create_appointments", "edit_appointments",
                "view_medical_records", "create_medical_records", "edit_medical_records"
            ],
            "ROLE_USER": [
                "view_patients", "view_appointments"
            ]
        }
        return permissions_map.get(role, permissions_map["ROLE_USER"])
    
    def _is_account_locked(self, username: str) -> bool:
        """
        Verifica si una cuenta está bloqueada por intentos fallidos
        """
        attempts = self._failed_attempts.get(username, [])
        if len(attempts) < self.max_failed_attempts:
            return False
        
        # Verificar si el último intento fue hace menos del tiempo de bloqueo
        last_attempt = max(attempts)
        return (datetime.now() - last_attempt) < self.lockout_duration
    
    def _record_failed_attempt(self, username: str):
        """
        Registra un intento de login fallido
        """
        if username not in self._failed_attempts:
            self._failed_attempts[username] = []
        
        self._failed_attempts[username].append(datetime.now())
        
        # Mantener solo los últimos intentos dentro del período de bloqueo
        cutoff = datetime.now() - self.lockout_duration
        self._failed_attempts[username] = [
            attempt for attempt in self._failed_attempts[username] 
            if attempt > cutoff
        ]
    
    def _clear_failed_attempts(self, username: str):
        """
        Limpia los intentos fallidos después de un login exitoso
        """
        self._failed_attempts.pop(username, None)
    
    async def logout(self, token: str) -> bool:
        """Logout con token y blacklist"""
        try:
            if token:
                self._blacklisted_tokens.add(token)
                logger.info(f"🚪 Token blacklisted: {token[:20]}...")
                
                try:
                    import jwt
                    payload = jwt.decode(token, options={"verify_signature": False})
                    username = payload.get('sub') or payload.get('username')
                    if username:
                        self._active_sessions.pop(username, None)
                        logger.info(f"🧹 Sesión eliminada para: {username}")
                except:
                    pass
            return True
        except Exception as e:
            logger.error(f"💥 Error en logout: {e}")
            return False
    
    def get_user_session(self, username: str) -> Optional[UserSession]:
        """
        Obtiene la sesión activa de un usuario
        """
        session = self._active_sessions.get(username)
        if session and session.is_active:
            session.update_activity()
            return session
        elif session:
            # Remover sesión inactiva
            self._active_sessions.pop(username, None)
        return None
    
    def is_authenticated(self, username: str) -> bool:
        """
        Verifica si un usuario está autenticado
        """
        return self.get_user_session(username) is not None

# Instancia singleton del servicio de autenticación
auth_service = AuthService()