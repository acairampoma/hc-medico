# services/__init__.py
"""
Servicios del sistema hospitalario
"""

from .auth_service import auth_service, AuthService, LoginResult, UserSession
from .oauth2_client import oauth2_client, OAuth2Client, OAuth2Config, TokenResponse

__all__ = [
    'auth_service',
    'AuthService', 
    'LoginResult',
    'UserSession',
    'oauth2_client',
    'OAuth2Client',
    'OAuth2Config',
    'TokenResponse'
]

# models/__init__.py
"""
Modelos de datos del sistema
"""

# utils/__init__.py
"""
Utilidades del sistema
"""