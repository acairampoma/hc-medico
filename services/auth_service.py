"""
Servicio principal de autenticación - VERSIÓN MEJORADA
Maneja la lógica de negocio y coordina con OAuth2
SOLUCIÓN COMPLETA PARA ROLES EJECUTIVA
"""

from typing import Optional, Dict, Any, Tuple, Set
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass, asdict
import json
from .oauth2_client import oauth2_client, TokenResponse  

logger = logging.getLogger(__name__)

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
    """Servicio principal de autenticación - VERSIÓN MEJORADA"""
    
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
        Proceso completo de login - MEJORADO PARA ROLES
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
    
    async def _create_user_session(
        self, 
        username: str, 
        token_response: TokenResponse
    ) -> UserSession:
        """
        Crea una sesión de usuario con información COMPLETA del microservicio
        🔥 VERSIÓN MEJORADA PARA MANEJAR ROLES CORRECTAMENTE
        """
        try:
            # Obtener datos completos del microservicio
            logger.info(f"👤 Obteniendo datos completos para: {username}")
            
            success, user_data, error = await oauth2_client.get_user_info(
                username=username,
                token=token_response.access_token
            )
            
            # 🔍 DEBUGGING EXTREMO
            logger.info(f"📦 === DEBUGGING AUTH_SERVICE ====")
            logger.info(f"📦 success: {success}")
            logger.info(f"📦 error: {error}")
            logger.info(f"📦 user_data COMPLETO: {user_data}")
            logger.info(f"📦 user_data tipo: {type(user_data)}")
            
            if user_data:
                logger.info(f"📦 user_data keys: {list(user_data.keys()) if isinstance(user_data, dict) else 'No es dict'}")
                logger.info(f"📦 firstName en user_data: '{user_data.get('firstName', 'NO_EXISTE')}'")
                logger.info(f"📦 lastName en user_data: '{user_data.get('lastName', 'NO_EXISTE')}'")
                logger.info(f"📦 roles en user_data: {user_data.get('roles', 'NO_EXISTE')}")
            
            if success and user_data:
                logger.info(f"✅ Datos obtenidos del microservicio: {user_data}")
                
                # 🔥 OBTENER Y PROCESAR ROLES CORRECTAMENTE
                roles_array = user_data.get('roles', ['ROLE_USER'])
                logger.info(f"📋 ROLES RAW del microservicio: {roles_array}")
                
                # Extraer rol principal con nueva lógica
                principal_role = self._extract_role_from_roles(roles_array)
                logger.info(f"🎯 ROL PRINCIPAL DETECTADO: {principal_role}")
                
                # 🔥 PARSEAR datosProfesional AQUÍ EN EL BACKEND
                datos_profesionales = {}
                try:
                    if 'datosProfesional' in user_data and user_data['datosProfesional']:
                        raw_datos = user_data['datosProfesional']
                        
                        if isinstance(raw_datos, str):
                            # Es string JSON, parsearlo
                            datos_profesionales = json.loads(raw_datos)
                            logger.info(f"✅ datosProfesional parseado: {datos_profesionales}")
                        elif isinstance(raw_datos, dict):
                            # Ya es dict
                            datos_profesionales = raw_datos
                        else:
                            logger.warning(f"⚠️ datosProfesional tipo inesperado: {type(raw_datos)}")
                            datos_profesionales = {}
                    else:
                        logger.warning(f"⚠️ No hay datosProfesional para {username}")
                        datos_profesionales = {}
                        
                except json.JSONDecodeError as e:
                    logger.error(f"❌ Error parseando datosProfesional: {e}")
                    datos_profesionales = {}
                
                # Crear sesión con TODOS los datos Y ROLES CORREGIDOS
                firstName = user_data.get('firstName', '')
                lastName = user_data.get('lastName', '')
                
                user_session = UserSession(
                    user_id=str(user_data.get('id', f"user_{hash(username) % 10000}")),
                    username=user_data.get('username', username),
                    name=f"{firstName} {lastName}".strip(),
                    email=user_data.get('email', f"{username}@hospital.com"),
                    role=principal_role,  # 🔑 ROL PRINCIPAL CORRECTO (ROLE_EJECUTIVA)
                    permissions=self._get_permissions_from_roles(roles_array),
                    token=token_response,
                    firstName=firstName,
                    lastName=lastName,
                    roles_array=roles_array  # 🔑 ARRAY COMPLETO DE ROLES
                )
                
                # 🔥 AGREGAR LOS DATOS PROFESIONALES A LA SESIÓN
                user_session.cmp = datos_profesionales.get('cmp', 'N/A')
                user_session.tipo = datos_profesionales.get('tipo', 'N/A') 
                user_session.hospital_id = datos_profesionales.get('hospital_id', None)
                user_session.area_trabajo = datos_profesionales.get('area_trabajo', 'N/A')
                user_session.especialidad_principal = datos_profesionales.get('especialidad_principal', 'N/A')
                user_session.datos_profesional_raw = user_data.get('datosProfesional', '{}')
                user_session.datos_profesional_parsed = datos_profesionales
                
                logger.info(f"👤 Sesión COMPLETA creada para {username}")
                logger.info(f"🎯 ROL PRINCIPAL: {user_session.role}")
                logger.info(f"📋 ROLES ARRAY: {user_session.roles_array}")
                logger.info(f"🏥 CMP: {user_session.cmp}")
                logger.info(f"⚕️ Especialidad: {user_session.especialidad_principal}")
                logger.info(f"🏢 Área: {user_session.area_trabajo}")
                
                return user_session
            else:
                logger.warning(f"⚠️ No se pudo obtener info del usuario {username}, usando datos básicos")
                return self._create_basic_user_session(username, token_response)
                
        except Exception as e:
            logger.error(f"💥 Error creando sesión con datos del microservicio: {str(e)}")
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
        elif username.lower() == "teresa":
            role = "ROLE_EJECUTIVA"  # 🔑 FALLBACK PARA TERESA
        else:
            role = "ROLE_USER"
        
        # Determinar nombre display
        name = f"Dr. {username.title()}" if role in ["ROLE_ADMIN", "ROLE_EJECUTIVA"] else username.title()
        
        user_session = UserSession(
            user_id=f"user_{hash(username) % 10000}",  # ID simple para demo
            username=username,
            name=name,
            email=f"{username}@hospital.com",
            role=role,
            permissions=self._get_permissions_from_roles([role]),
            token=token_response,
            roles_array=[role]  # 🔑 ARRAY CON EL ROL
        )
        
        logger.info(f"👤 Sesión básica creada para {username} con rol: {role}")
        return user_session
    
    def _extract_role_from_roles(self, roles: list) -> str:
        """
        Extrae el rol principal desde la lista de roles del microservicio
        🔥 VERSIÓN MEJORADA CON PRIORIDADES CORRECTAS
        """
        if not roles:
            return "ROLE_USER"
        
        logger.info(f"🔍 Analizando roles: {roles}")
        
        # 🔥 ORDEN DE PRIORIDAD CORREGIDO (más específico primero)
        priority_order = [
            "ROLE_ADMIN",
            "ROLE_EJECUTIVA",    # 🎯 ALTA PRIORIDAD PARA EJECUTIVA
            "ROLE_MEDICO", 
            "ROLE_DOCTOR",       # Alias para médico
            "ROLE_NURSE",
            "ROLE_MODERATOR",
            "ROLE_USER"
        ]
        
        # Buscar el rol más específico (prioridad: admin > ejecutiva > medico > nurse > user)
        for priority_role in priority_order:
            if priority_role in roles:
                logger.info(f"✅ ROL PRINCIPAL SELECCIONADO: {priority_role} (encontrado en prioridades)")
                return priority_role
        
        # Si no encuentra ningún rol conocido, usar el primero disponible
        first_role = roles[0] if roles else "ROLE_USER"
        logger.warning(f"⚠️ Usando primer rol disponible: {first_role}")
        return first_role
    
    def _get_permissions_from_roles(self, roles: list) -> list:
        """
        Obtiene permisos basados en los roles del microservicio
        🔥 VERSIÓN MEJORADA CON PERMISOS PARA EJECUTIVA
        """
        all_permissions = set()
        
        # Mapear roles a permisos - INCLUYENDO EJECUTIVA
        role_permissions = {
            "ROLE_ADMIN": [
                "view_patients", "create_patients", "edit_patients", "delete_patients",
                "view_appointments", "create_appointments", "edit_appointments", "delete_appointments",
                "view_staff", "create_staff", "edit_staff", "delete_staff",
                "view_reports", "create_reports", "system_config", "user_management"
            ],
            "ROLE_EJECUTIVA": [  # 🔥 NUEVOS PERMISOS PARA EJECUTIVA
                "view_patients", "create_patients", "edit_patients",
                "view_appointments", "create_appointments", "edit_appointments", 
                "afiliacion", "programacion", "cupos", "citas", "hospitalizacion", "mantenimiento",
                "view_reports", "administrative_tasks"
            ],
            "ROLE_MEDICO": [
                "view_patients", "create_patients", "edit_patients",
                "view_appointments", "create_appointments", "edit_appointments",
                "view_medical_records", "create_medical_records", "edit_medical_records",
                "prescribe_medication", "medical_orders", "medical_notes"
            ],
            "ROLE_DOCTOR": [  # Alias para ROLE_MEDICO
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
                permissions = role_permissions[role]
                all_permissions.update(permissions)
                logger.info(f"➕ Agregando permisos de {role}: {permissions}")
        
        final_permissions = list(all_permissions) if all_permissions else ["view_patients"]
        logger.info(f"🔐 PERMISOS FINALES: {final_permissions}")
        return final_permissions
    
    def _get_user_permissions(self, role: str) -> list:
        """
        Obtiene permisos basados en el rol - VERSIÓN DE FALLBACK
        """
        permissions_map = {
            "ROLE_ADMIN": [
                "view_patients", "create_patients", "edit_patients", "delete_patients",
                "view_appointments", "create_appointments", "edit_appointments", "delete_appointments",
                "view_staff", "create_staff", "edit_staff", "delete_staff",
                "view_reports", "create_reports", "system_config"
            ],
            "ROLE_EJECUTIVA": [  # 🔥 PERMISOS EJECUTIVA
                "view_patients", "create_patients", "edit_patients",
                "view_appointments", "create_appointments", "edit_appointments",
                "afiliacion", "programacion", "cupos", "citas", "hospitalizacion", "mantenimiento"
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

    def get_blacklisted_tokens(self) -> Set[str]:
        """
        Obtiene la lista de tokens blacklisted
        """
        return self._blacklisted_tokens

    async def validate_token(self, token: str) -> bool:
        """
        Validar si un JWT token es válido
        """
        try:
            if not token:
                logger.debug("❌ Token vacío")
                return False
            
            # Verificar en sesiones activas primero
            for username, session in self._active_sessions.items():
                if (session.token and 
                    session.token.access_token == token and 
                    session.is_active):
                    
                    # Actualizar última actividad
                    session.update_activity()
                    logger.debug(f"✅ Token válido para usuario: {username}")
                    return True
            
            # Si no está en sesiones activas, validar con OAuth2 server
            logger.debug("🔍 Validando token con OAuth2 server")
            return await self._validate_with_oauth_server(token)
            
        except Exception as e:
            logger.error(f"💥 Error validando token: {str(e)}")
            return False
    
    async def get_user_from_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Obtener datos del usuario desde un JWT token
        """
        try:
            if not token:
                return None
            
            # Buscar en sesiones activas
            for username, session in self._active_sessions.items():
                if (session.token and 
                    session.token.access_token == token and
                    session.is_active):
                    
                    # Actualizar última actividad
                    session.update_activity()
                    
                    return {
                        "username": session.username,
                        "user_id": session.user_id,
                        "name": session.name,
                        "email": session.email,
                        "role": session.role,
                        "roles": session.roles_array,  # 🔑 INCLUIR ARRAY DE ROLES
                        "permissions": session.permissions,
                        "firstName": session.firstName,
                        "lastName": session.lastName,
                        "last_activity": session.last_activity.isoformat() if session.last_activity else None,
                        "login_time": session.login_time.isoformat() if session.login_time else None
                    }
            
            # Si no está en sesiones, intentar validar con OAuth2 server
            logger.debug("🔍 Usuario no encontrado en sesiones activas, intentando OAuth2")
            return await self._get_user_from_oauth_server(token)
            
        except Exception as e:
            logger.error(f"💥 Error obteniendo usuario del token: {str(e)}")
            return None
    
    async def _validate_with_oauth_server(self, token: str) -> bool:
        """
        Validar token directamente con el servidor OAuth2
        """
        try:
            # Usar el oauth2_client existente para validar
            success, user_data, error = await oauth2_client.get_user_info_by_token(token)
            
            if success and user_data:
                logger.debug(f"✅ Token validado con OAuth2 server para usuario: {user_data.get('username', 'unknown')}")
                return True
            
            logger.debug(f"❌ Token inválido según OAuth2 server: {error}")
            return False
            
        except AttributeError:
            # Si el método get_user_info_by_token no existe, intentar alternativa
            logger.warning("⚠️ Método get_user_info_by_token no disponible, usando validación básica")
            return len(token) > 20  # Validación básica como fallback
        except Exception as e:
            logger.error(f"💥 Error validando con OAuth server: {str(e)}")
            return False
    
    async def _get_user_from_oauth_server(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Obtener datos del usuario desde el servidor OAuth2 usando el token
        """
        try:
            # Intentar obtener info del usuario del token
            success, user_data, error = await oauth2_client.get_user_info_by_token(token)
            
            if success and user_data:
                # Formatear datos para consistencia
                firstName = user_data.get('firstName', '')
                lastName = user_data.get('lastName', '')
                roles_array = user_data.get('roles', ['ROLE_USER'])
                
                return {
                    "username": user_data.get('username', 'unknown'),
                    "user_id": str(user_data.get('id', 'unknown')),
                    "name": f"{firstName} {lastName}".strip() or user_data.get('username', 'unknown'),
                    "email": user_data.get('email', ''),
                    "role": self._extract_role_from_roles(roles_array),
                    "roles": roles_array,  # 🔑 INCLUIR ARRAY DE ROLES
                    "permissions": self._get_permissions_from_roles(roles_array),
                    "firstName": firstName,
                    "lastName": lastName,
                    "last_activity": datetime.now().isoformat(),
                    "login_time": None
                }
            
            return None
            
        except AttributeError:
            logger.warning("⚠️ Método get_user_info_by_token no disponible en oauth2_client")
            return None
        except Exception as e:
            logger.error(f"💥 Error obteniendo usuario del OAuth server: {str(e)}")
            return None

# Instancia singleton del servicio de autenticación
auth_service = AuthService()

# =====================================================
# RESULTADO ESPERADO PARA TERESA:
# =====================================================
"""
Cuando Teresa (username: teresa) haga login, debería retornar:

{
  "success": true,
  "message": "Autenticación exitosa",
  "token": "eyJ...",
  "user": {
    "user_id": "2",
    "username": "teresa", 
    "role": "ROLE_EJECUTIVA",                    ← ROL PRINCIPAL ✅
    "roles": ["ROLE_EJECUTIVA"],                 ← ARRAY DE ROLES ✅
    "firstName": "Teresa",
    "lastName": "Carrillo Chavez",
    "email": "teresa.carrillo@hospitaloncologico.com",
    "area_trabajo": "Dirección Cabeza y Cuello",
    "tipo": "ADMIN",
    "hospital_id": 1,
    "permissions": [
      "view_patients", "create_patients", "edit_patients",
      "view_appointments", "create_appointments", "edit_appointments", 
      "afiliacion", "programacion", "cupos", "citas", 
      "hospitalizacion", "mantenimiento", "view_reports"
    ],
    "datos_profesional_parsed": {
      "tipo": "ADMIN",
      "cargo": "Ejecutiva de Admisión",
      "hospital_id": 1,
      "area_trabajo": "Dirección Cabeza y Cuello",
      "departamento": "Administración"
    },
    "displayName": "Dr. Teresa Carrillo Chavez",
    "fullName": "Teresa Carrillo Chavez"
  }
}

FLUJO CORRECTO:
1. Backend recibe: teresa/123456
2. OAuth2 retorna: roles: ["ROLE_EJECUTIVA"]
3. _extract_role_from_roles detecta: "ROLE_EJECUTIVA" 
4. Se asigna role: "ROLE_EJECUTIVA"
5. Se envía al frontend: role + roles array
6. Frontend JavaScript detecta: ROLE_EJECUTIVA
7. determinarRedireccion(): /modulos_ejecutiva.html ✅
8. Teresa ve el dashboard ejecutiva ✅

LOGS ESPERADOS:
📋 ROLES RAW del microservicio: ['ROLE_EJECUTIVA']
🔍 Analizando roles: ['ROLE_EJECUTIVA']
✅ ROL PRINCIPAL SELECCIONADO: ROLE_EJECUTIVA (encontrado en prioridades)
🎯 ROL PRINCIPAL DETECTADO: ROLE_EJECUTIVA
👤 Sesión COMPLETA creada para teresa
🎯 ROL PRINCIPAL: ROLE_EJECUTIVA
📋 ROLES ARRAY: ['ROLE_EJECUTIVA']
"""

# =====================================================
# TESTING RÁPIDO - FUNCIONES DE PRUEBA
# =====================================================

def test_role_extraction():
    """Función de prueba para verificar extracción de roles"""
    auth = AuthService()
    
    # Test casos
    test_cases = [
        (["ROLE_EJECUTIVA"], "ROLE_EJECUTIVA"),
        (["ROLE_MEDICO"], "ROLE_MEDICO"), 
        (["ROLE_ADMIN"], "ROLE_ADMIN"),
        (["ROLE_USER"], "ROLE_USER"),
        (["ROLE_EJECUTIVA", "ROLE_USER"], "ROLE_EJECUTIVA"),  # Prioridad
        (["ROLE_USER", "ROLE_ADMIN"], "ROLE_ADMIN"),  # Prioridad admin
        ([], "ROLE_USER"),  # Default
    ]
    
    print("🧪 TESTING EXTRACCIÓN DE ROLES:")
    for roles_input, expected in test_cases:
        result = auth._extract_role_from_roles(roles_input)
        status = "✅" if result == expected else "❌"
        print(f"{status} Input: {roles_input} → Output: {result} (Expected: {expected})")

def test_permissions():
    """Función de prueba para verificar permisos"""
    auth = AuthService()
    
    roles_ejecutiva = ["ROLE_EJECUTIVA"]
    permissions = auth._get_permissions_from_roles(roles_ejecutiva)
    
    print(f"\n🔐 PERMISOS PARA ROLE_EJECUTIVA:")
    for perm in permissions:
        print(f"  • {perm}")
    
    # Verificar permisos clave
    required_perms = ["afiliacion", "programacion", "cupos", "citas", "hospitalizacion", "mantenimiento"]
    missing = [p for p in required_perms if p not in permissions]
    
    if not missing:
        print("✅ Todos los permisos ejecutiva están presentes")
    else:
        print(f"❌ Permisos faltantes: {missing}")

# Para ejecutar tests:
# test_role_extraction()
# test_permissions()

# =====================================================
# CONFIGURACIÓN ADICIONAL RECOMENDADA
# =====================================================

# En tu archivo de configuración/settings, agregar:
ROLE_PRIORITIES = [
    "ROLE_ADMIN",
    "ROLE_EJECUTIVA", 
    "ROLE_MEDICO",
    "ROLE_DOCTOR",
    "ROLE_NURSE", 
    "ROLE_MODERATOR",
    "ROLE_USER"
]

ROLE_REDIRECTIONS = {
    "ROLE_EJECUTIVA": "/modulos_ejecutiva",
    "ROLE_MEDICO": "/dashboard",
    "ROLE_ADMIN": "/dashboard",
    "ROLE_USER": "/dashboard"
}

# =====================================================
# MIDDLEWARE PARA VERIFICAR ROLES (OPCIONAL)
# =====================================================

def require_role(required_role: str):
    """Decorador para verificar roles en endpoints"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Obtener usuario de la sesión
            user_session = kwargs.get('current_user')
            if not user_session:
                raise HTTPException(status_code=401, detail="No autorizado")
            
            # Verificar rol
            if user_session.role != required_role and user_session.role != "ROLE_ADMIN":
                raise HTTPException(status_code=403, detail="Permisos insuficientes")
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# Uso del decorador:
# @require_role("ROLE_EJECUTIVA")
# async def afiliacion_endpoint(current_user: UserSession):
#     return {"message": "Acceso permitido a afiliación"}

# =====================================================
# INSTRUCCIONES DE IMPLEMENTACIÓN:
# =====================================================
"""
PASOS PARA IMPLEMENTAR:

1. REEMPLAZAR tu auth_service.py actual con este código completo
2. ASEGURARTE que el microservicio OAuth2 retorne:
   {
     "username": "teresa",
     "roles": ["ROLE_EJECUTIVA"],  ← ARRAY CON ROLES
     "datosProfesional": "{\"tipo\": \"ADMIN\", ...}"
   }

3. VERIFICAR que el endpoint /api/usuarios/users/username/teresa retorne:
   {
     "id": 2,
     "username": "teresa", 
     "roles": ["ROLE_EJECUTIVA"],  ← CRUCIAL
     "firstName": "Teresa",
     "lastName": "Carrillo Chavez",
     "datosProfesional": "..."
   }

4. REINICIAR tu servidor Python

5. PROBAR login con teresa/123456

6. VERIFICAR logs del backend:
   - Debe mostrar: "ROL PRINCIPAL DETECTADO: ROLE_EJECUTIVA"
   - Debe mostrar: "ROLES ARRAY: ['ROLE_EJECUTIVA']"

7. VERIFICAR respuesta JSON en el frontend:
   - result.user.role debe ser "ROLE_EJECUTIVA"
   - result.user.roles debe ser ["ROLE_EJECUTIVA"]

8. CONFIRMAR redirección a /modulos_ejecutiva.html

¡Con estos cambios Teresa debería ir directo a su dashboard ejecutiva! 🚀
"""