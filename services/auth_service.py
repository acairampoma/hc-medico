"""
Servicio principal de autenticación
Maneja la lógica de negocio y coordina con OAuth2
"""

from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass, asdict
import json

from .oauth2_client import oauth2_client, TokenResponse

logger = logging.getLogger(__name__)

@dataclass
class UserSession:
    """Información de sesión del usuario"""
    user_id: str
    username: str
    name: str
    email: Optional[str] = None
    role: str = "user"
    permissions: list = None
    token: Optional[TokenResponse] = None
    login_time: datetime = None
    last_activity: datetime = None
    # Agregar campos adicionales para nombres
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    
    def __post_init__(self):
        if self.login_time is None:
            self.login_time = datetime.now()
        if self.last_activity is None:
            self.last_activity = datetime.now()
        if self.permissions is None:
            self.permissions = []
    
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
        """Convierte la sesión a diccionario para JSON"""
        data = asdict(self)
        # Convertir datetime a string
        if self.login_time:
            data['login_time'] = self.login_time.isoformat()
        if self.last_activity:
            data['last_activity'] = self.last_activity.isoformat()
        # Excluir token por seguridad pero incluir firstName y lastName si están disponibles
        data.pop('token', None)
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
    """Servicio principal de autenticación"""
    
    def __init__(self):
        self._active_sessions: Dict[str, UserSession] = {}
        self._failed_attempts: Dict[str, list] = {}
        self.max_failed_attempts = 5
        self.lockout_duration = timedelta(minutes=15)
    
    async def login(
        self, 
        username: str, 
        password: str,
        remember_me: bool = False
    ) -> LoginResult:
        """
        Proceso completo de login
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
            
            # Autenticar con OAuth2
            success, token_response, error_msg = await oauth2_client.authenticate(
                username=username,
                password=password
            )
            
            if success and token_response:
                # Crear sesión de usuario
                user_session = await self._create_user_session(
                    username=username,
                    token_response=token_response
                )
                
                # Limpiar intentos fallidos
                self._clear_failed_attempts(username)
                
                # Guardar sesión activa
                self._active_sessions[username] = user_session
                
                logger.info(f"✅ Login exitoso para: {username}")
                
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
    
    async def _create_user_session(
        self, 
        username: str, 
        token_response: TokenResponse
    ) -> UserSession:
        """
        Crea una sesión de usuario con información del token y del microservicio
        """
        try:
            # Obtener información detallada del usuario desde el microservicio
            success, user_data, error = await oauth2_client.get_user_info(
                username=username,
                token=token_response.access_token
            )
            
            if success and user_data:
                # Usar datos reales del microservicio
                firstName = user_data.get('firstName', '')
                lastName = user_data.get('lastName', '')
                
                user_session = UserSession(
                    user_id=str(user_data.get('id', f"user_{hash(username) % 10000}")),
                    username=user_data.get('username', username),
                    name=f"{firstName} {lastName}".strip(),
                    email=user_data.get('email', f"{username}@hospital.com"),
                    role=self._extract_role_from_roles(user_data.get('roles', [])),
                    permissions=self._get_permissions_from_roles(user_data.get('roles', [])),
                    token=token_response,
                    firstName=firstName,
                    lastName=lastName
                )
                
                logger.info(f"👤 Sesión creada con datos del microservicio para {username}")
                return user_session
            else:
                # Fallback a datos básicos si no se puede obtener info del usuario
                logger.warning(f"⚠️ No se pudo obtener info del usuario {username}, usando datos básicos")
                return self._create_basic_user_session(username, token_response)
                
        except Exception as e:
            logger.error(f"💥 Error creando sesión con datos del microservicio: {str(e)}")
            # Fallback a datos básicos
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
        role = "admin" if username.lower() == "admin" else "user"
        
        # Determinar nombre display
        name = f"Dr. {username.title()}" if role == "admin" else username.title()
        
        user_session = UserSession(
            user_id=f"user_{hash(username) % 10000}",  # ID simple para demo
            username=username,
            name=name,
            email=f"{username}@hospital.com",
            role=role,
            permissions=self._get_user_permissions(role),
            token=token_response
        )
        
        logger.info(f"👤 Sesión básica creada para {username} con rol: {role}")
        return user_session
    
    def _extract_role_from_roles(self, roles: list) -> str:
        """
        Extrae el rol principal desde la lista de roles del microservicio
        """
        if not roles:
            return "user"
        
        # Mapear roles del microservicio a roles del sistema
        role_mapping = {
            "ROLE_ADMIN": "admin",
            "ROLE_DOCTOR": "doctor", 
            "ROLE_NURSE": "nurse",
            "ROLE_USER": "user"
        }
        
        # Buscar el rol más específico (prioridad: admin > doctor > nurse > user)
        priority_order = ["ROLE_ADMIN", "ROLE_DOCTOR", "ROLE_NURSE", "ROLE_USER"]
        
        for priority_role in priority_order:
            if priority_role in roles:
                return role_mapping.get(priority_role, "user")
        
        # Si no encuentra ningún rol conocido, usar el primero disponible
        first_role = roles[0] if roles else "ROLE_USER"
        return role_mapping.get(first_role, "user")
    
    def _get_permissions_from_roles(self, roles: list) -> list:
        """
        Obtiene permisos basados en los roles del microservicio
        """
        all_permissions = set()
        
        # Mapear roles a permisos
        role_permissions = {
            "ROLE_ADMIN": [
                "view_patients", "create_patients", "edit_patients", "delete_patients",
                "view_appointments", "create_appointments", "edit_appointments", "delete_appointments",
                "view_staff", "create_staff", "edit_staff", "delete_staff",
                "view_reports", "create_reports", "system_config", "user_management"
            ],
            "ROLE_DOCTOR": [
                "view_patients", "create_patients", "edit_patients",
                "view_appointments", "create_appointments", "edit_appointments",
                "view_medical_records", "create_medical_records", "edit_medical_records",
                "prescribe_medication"
            ],
            "ROLE_NURSE": [
                "view_patients", "edit_patients",
                "view_appointments", "create_appointments",
                "view_medical_records", "basic_medical_records"
            ],
            "ROLE_USER": [
                "view_patients", "view_appointments"
            ]
        }
        
        # Agregar permisos de todos los roles que tiene el usuario
        for role in roles:
            if role in role_permissions:
                all_permissions.update(role_permissions[role])
        
        return list(all_permissions) if all_permissions else ["view_patients"]
    
    def _get_user_permissions(self, role: str) -> list:
        """
        Obtiene permisos basados en el rol
        """
        permissions_map = {
            "admin": [
                "view_patients", "create_patients", "edit_patients", "delete_patients",
                "view_appointments", "create_appointments", "edit_appointments", "delete_appointments",
                "view_staff", "create_staff", "edit_staff", "delete_staff",
                "view_reports", "create_reports", "system_config"
            ],
            "doctor": [
                "view_patients", "create_patients", "edit_patients",
                "view_appointments", "create_appointments", "edit_appointments",
                "view_medical_records", "create_medical_records", "edit_medical_records"
            ],
            "nurse": [
                "view_patients", "edit_patients",
                "view_appointments", "create_appointments",
                "view_medical_records"
            ],
            "user": [
                "view_patients", "view_appointments"
            ]
        }
        return permissions_map.get(role, permissions_map["user"])
    
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
    
    async def logout(self, username: str) -> bool:
        """
        Cierra sesión de usuario
        """
        try:
            user_session = self._active_sessions.get(username)
            if user_session and user_session.token:
                # Revocar token en OAuth2
                await oauth2_client.logout(user_session.token.access_token)
            
            # Remover sesión activa
            self._active_sessions.pop(username, None)
            
            # Limpiar cache de tokens
            oauth2_client.clear_cache(username)
            
            logger.info(f"🚪 Logout exitoso para: {username}")
            return True
            
        except Exception as e:
            logger.error(f"💥 Error en logout: {str(e)}")
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
    
    def has_permission(self, username: str, permission: str) -> bool:
        """
        Verifica si un usuario tiene un permiso específico
        """
        session = self.get_user_session(username)
        if not session:
            return False
        return permission in session.permissions
    
    async def refresh_user_token(self, username: str) -> Optional[str]:
        """
        Renueva el token de un usuario
        """
        try:
            session = self.get_user_session(username)
            if not session or not session.token or not session.token.refresh_token:
                return None
            
            success, new_token, error = await oauth2_client.refresh_token(
                session.token.refresh_token
            )
            
            if success and new_token:
                session.token = new_token
                logger.info(f"🔄 Token renovado para: {username}")
                return new_token.access_token
            
            return None
            
        except Exception as e:
            logger.error(f"💥 Error renovando token: {str(e)}")
            return None
    
    def get_active_sessions_count(self) -> int:
        """
        Obtiene el número de sesiones activas
        """
        # Limpiar sesiones inactivas
        inactive_users = [
            username for username, session in self._active_sessions.items()
            if not session.is_active
        ]
        for username in inactive_users:
            self._active_sessions.pop(username, None)
        
        return len(self._active_sessions)
    
    def get_system_stats(self) -> Dict[str, Any]:
        """
        Obtiene estadísticas del sistema de autenticación
        """
        return {
            "active_sessions": self.get_active_sessions_count(),
            "locked_accounts": len([
                username for username in self._failed_attempts.keys()
                if self._is_account_locked(username)
            ]),
            "total_failed_attempts": sum(
                len(attempts) for attempts in self._failed_attempts.values()
            )
        }

# Instancia singleton del servicio de autenticación
auth_service = AuthService()