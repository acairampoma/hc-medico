"""
ENDPOINTS AFILIACIÓN - CLAUDE DEV REPARACIÓN
Archivo temporal para testing
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from typing import Dict, Any
import asyncio
from datetime import datetime

# Router temporal para testing
afiliacion_router = APIRouter(prefix="/api/afiliacion", tags=["afiliacion"])

@afiliacion_router.get("/test")
async def test_endpoint():
    """Endpoint de prueba"""
    return {"success": True, "message": "Afiliación API funcionando"}

@afiliacion_router.get("/paciente/{paciente_id}")
async def obtener_paciente_test(paciente_id: int):
    """Endpoint temporal para testing"""
    await asyncio.sleep(0.5)  # Simular carga
    
    return {
        "success": True,
        "data": {
            "paso1": {
                "tipo_documento": "DNI",
                "numero_documento": "12345678",
                "nombres": "Juan Carlos",
                "apellidos": "Pérez López",
                "fecha_nacimiento": "1990-05-15",
                "sexo": "M",
                "estado_civil": "SOL",
                "ocupacion": "Ingeniero"
            },
            "paso2": {
                "grupo_sanguineo": "O+",
                "factor_rh": "POS",
                "antecedentes": "Hipertensión controlada",
                "alergias": [
                    {"tipo": "MEDICAMENTO", "descripcion": "Penicilina"}
                ]
            },
            "paso3": {
                "telefono": "987654321",
                "email": "juan.perez@email.com",
                "direccion": "Av. Lima 123",
                "distrito": "LIMA",
                "contacto_nombre": "María Pérez",
                "contacto_parentesco": "MADRE",
                "contacto_telefono": "987123456",
                "seguros": [
                    {"tipo": "SIS", "numero": "123456789", "condicion": "TITULAR"}
                ]
            },
            "paso4": {
                "paciente_id": paciente_id,
                "numero_admision": f"PAC{paciente_id:06d}",
                "fecha_admision": "2024-01-15T10:30:00",
                "tipo_admision": "EXT",
                "estado_admision": "01"
            }
        },
        "message": "Datos de prueba cargados"
    }

@afiliacion_router.post("/crear")
async def crear_paciente_test(datos: Dict[str, Any]):
    """Endpoint temporal para crear paciente"""
    await asyncio.sleep(1)  # Simular procesamiento
    
    return {
        "success": True,
        "data": {
            "paciente_id": 12345,
            "numero_admision": "PAC012345"
        },
        "message": "Paciente creado exitosamente (TEST)"
    }

@afiliacion_router.post("/validar-documento")
async def validar_documento_test(datos: Dict[str, Any]):
    """Endpoint temporal para validar documento"""
    return {
        "success": True,
        "existe": False,
        "message": "Documento disponible (TEST)"
    }

print("🌐 Endpoints de afiliación TEST creados")
