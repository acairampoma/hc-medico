# middleware/__init__.py

"""
🔐 Hospital Security Middleware Package

Middleware de seguridad para sistema hospitalario con:
- ✅ Autenticación JWT
- ✅ Modo desarrollo/producción  
- ✅ Session timeout
- ✅ Logging de seguridad
- ✅ Headers de seguridad
"""

from .auth_middleware import AuthMiddleware

__all__ = [
    "AuthMiddleware"
]

__version__ = "1.0.0"
__author__ = "Alan Cairampoma + Maverick"
__description__ = "Security middleware for hospital management system"