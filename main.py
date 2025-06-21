from fastapi import FastAPI, Request, HTTPException, Depends, Body, Path, Query, Header
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse, StreamingResponse, Response, FileResponse
from pydantic import BaseModel
import logging
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
import io
import asyncio

os.environ["DEVELOPMENT_MODE"] = "false"
os.environ["SECURITY_ENABLED"] = "true"
print("🔧 FORZADO: Modo producción activado")
# 🔧 CARGAR VARIABLES DE ENTORNO
from dotenv import load_dotenv
load_dotenv()  # Carga el archivo .env

# ===== 🆕 IMPORTAR MIDDLEWARE (AGREGAR ESTA LÍNEA) =====
from middleware import AuthMiddleware

# ===== TUS SERVICIOS EXISTENTES (CONSERVAMOS TODO) =====
from services.auth_service import auth_service, LoginResult
from services.oauth2_client import oauth2_client

# ===== NUEVO SERVICIO DE HOSPITAL (AGREGAMOS SIN TOCAR NADA) =====
from services.hospital_service import HospitalService

# ===== NUEVO SERVICIO DE RECETAS (CORREGIDO) =====
from services.prescription_service import prescription_service

# ===== NUEVO SERVICIO DE SIGNOS VITALES (AGREGAMOS SIN TOCAR NADA) =====
from services.vital_signs_service import VitalSignsManager

from fastapi import WebSocket, WebSocketDisconnect

# ===== NUEVO SERVICIO DE DICOM =====
from services.dicom_service import DicomService


# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Crear la instancia de FastAPI
app = FastAPI(
    title="Hospital Management System",
    description="Sistema hospitalario con autenticación OAuth2 y Rondas Médicas",
    version="1.0.0"
)

# ===== 🔐 AGREGAR MIDDLEWARE DE SEGURIDAD (AGREGAR ESTAS LÍNEAS) =====
app.add_middleware(AuthMiddleware)
logger.info("🔐 Middleware de seguridad agregado exitosamente")

# Configurar archivos estáticos y templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# ===== INICIALIZAR SERVICIOS =====
hospital_service = HospitalService()

# ===== NUEVO SERVICIO DE SIGNOS VITALES (AGREGAMOS SIN TOCAR NADA) =====
vital_signs_service = VitalSignsManager()

# ===== NUEVO SERVICIO DE DICOM =====
dicom_service = DicomService()

# ===== TUS MODELOS EXISTENTES (CONSERVAMOS) =====
class LoginRequest(BaseModel):
    username: str
    password: str
    remember_me: bool = False

class LogoutRequest(BaseModel):
    username: str

# ===== NUEVOS MODELOS PARA HOSPITAL =====
class MedicalNote(BaseModel):
    bed_number: str
    patient_id: str
    content: str
    timestamp: str
    doctor_id: str

class Prescription(BaseModel):
    bed_number: str
    patient_id: str
    medications: List[Dict[str, Any]]
    timestamp: str
    doctor_id: str

class MedicalOrder(BaseModel):
    bed_number: str
    patient_id: str
    order_type: str
    description: str
    timestamp: str
    doctor_id: str



# ===== TUS RUTAS EXISTENTES (CONSERVAMOS TODO) =====

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Página principal - redirige al login"""
    return RedirectResponse(url="/login")

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    """Página de login médico"""
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard_page(request: Request):
    """Dashboard después del login exitoso"""
    return templates.TemplateResponse("dashboard.html", {"request": request})

# ===== TUS APIs DE AUTENTICACIÓN (CONSERVAMOS) =====

@app.post("/api/login")
async def login_api(login_data: LoginRequest, response: Response):
    """
    Endpoint de login que usa nuestro servicio OAuth2 elegante
    SOLUCIÓN FINAL: Guarda token en cookie HTTP-only para acceso automático
    """
    try:
        logger.info(f"🔑 Solicitud de login para: {login_data.username}")
        
        # Usar nuestro servicio de autenticación
        login_result: LoginResult = await auth_service.login(
            username=login_data.username,
            password=login_data.password,
            remember_me=login_data.remember_me
        )
        
        # Convertir resultado a respuesta JSON
        response_data = login_result.to_dict()
        
        # Log del resultado
        if login_result.success:
            logger.info(f"✅ Login exitoso para: {login_data.username}")
        else:
            logger.warning(f"❌ Login fallido para: {login_data.username} - {login_result.message}")
        
        if login_result.success and login_result.token:
            # Crear respuesta con cookie
            resp = JSONResponse(
                status_code=200,
                content=response_data
            )
            
            # 🍪 ESTABLECER COOKIE
            max_age = 24 * 3600 if login_data.remember_me else 3600  # 24h o 1h
            resp.set_cookie(
                key="access_token",          # ← MISMO NOMBRE que busca el middleware
                value=login_result.token,    # ← TOKEN COMPLETO
                max_age=max_age,
                httponly=True,              # No accesible desde JavaScript (seguridad)
                secure=False,               # True en producción con HTTPS
                samesite="lax",             # Protección CSRF
                path="/"                    # Disponible en toda la app
            )
            
            logger.info(f"🍪 Cookie establecida para: {login_data.username}")
            return resp
        else:
            # Login fallido, solo JSON
            return JSONResponse(
                status_code=401,
                content=response_data
            )
    except Exception as e:
        logger.error(f"💥 Error en login API: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Error interno del servidor",
                "error_code": "INTERNAL_ERROR"
            }
        )

# ===== RUTAS DE PÁGINAS MÉDICAS =====

@app.get("/access-denied", response_class=HTMLResponse)
async def access_denied(request: Request):
    return templates.TemplateResponse("access_denied.html", {"request": request})

@app.get("/medical/rounds", response_class=HTMLResponse)
async def medical_rounds_page(request: Request):
    """Página de rondas médicas"""
    return templates.TemplateResponse("medical/rounds/medical_rounds.html", {"request": request})

@app.get("/medical/prescriptions", response_class=HTMLResponse)
async def prescriptions_page(request: Request):
    """Página de recetas médicas"""
    return templates.TemplateResponse("medical/prescriptions/prescription_form.html", {"request": request})

@app.get("/medical/orders/exams", response_class=HTMLResponse)  # 🆕 Nueva ruta
async def exam_orders_form(request: Request):
    
    return templates.TemplateResponse("medical/orders/exam_orders_form.html", {"request": request})

@app.get("/medical/vital-signs", response_class=HTMLResponse)
async def vital_signs_page(request: Request):
    """Página de signos vitales"""
    return templates.TemplateResponse("medical/vitales/vital_signs.html", {"request": request})

@app.get("/medical/dicom", response_class=HTMLResponse)
async def dicom_page(request: Request):
    """Página de dicom"""
    return templates.TemplateResponse("medical/pacs/dicom_viewer.html", {"request": request})

@app.get("/medical/notes", response_class=HTMLResponse)
async def notes_page(request: Request, bed_number: str = None, patient_id: str = None):
    """Página de notas médicas"""
    return templates.TemplateResponse("medical/notes/medical_notes.html", {
        "request": request,
        "bed_number": bed_number,
        "patient_id": patient_id
    })

# ===== TUS OTRAS RUTAS EXISTENTES (CONSERVAMOS) ===== 
@app.post("/api/logout")
async def logout_endpoint(request: Request):
    """Logout completo con invalidación de token"""
    try:
        print(f"\n🔴 LOGOUT REQUEST RECIBIDO")
        
        # Extraer token de la request
        token = None
        
        # Buscar en Authorization header
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
        
        # Buscar en cookies si no está en header
        if not token:
            token = request.cookies.get("access_token")
        
        print(f"   🔑 Token para logout: {token[:20] if token else 'None'}...")
        
        # Invalidar token
        success = await auth_service.logout(token)
        
        if success:
            # Crear respuesta exitosa
            response = JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": "Sesión cerrada correctamente"
                }
            )
            
            # 🍪 LIMPIAR TODAS LAS COOKIES
            cookies_to_clear = [
                "access_token", "auth_token", "session_token", 
                "user_info", "authToken", "token"
            ]
            
            for cookie_name in cookies_to_clear:
                response.delete_cookie(
                    key=cookie_name,
                    path="/",
                    domain=None
                )
                print(f"   🧹 Cookie '{cookie_name}' eliminada")
            
            print(f"   ✅ LOGOUT EXITOSO")
            return response
        
        else:
            print(f"   ❌ LOGOUT FALLÓ")
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "Error al cerrar sesión"
                }
            )
    
    except Exception as e:
        print(f"   💥 Error en logout endpoint: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Error interno del servidor"
            }
        )

@app.get("/api/user/{username}")
async def get_user_info(username: str):
    """
    Obtiene información del usuario autenticado
    """
    try:
        user_session = auth_service.get_user_session(username)
        
        if not user_session:
            return JSONResponse(
                status_code=401,
                content={
                    "success": False,
                    "message": "Usuario no autenticado"
                }
            )
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "user": user_session.to_dict()
            }
        )
        
    except Exception as e:
        logger.error(f"💥 Error obteniendo info de usuario: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Error interno del servidor"
            }
        )

@app.get("/api/user/{username}/detailed")
async def get_detailed_user_info(username: str):
    """
    Obtiene información detallada del usuario desde el microservicio
    """
    try:
        user_session = auth_service.get_user_session(username)
        
        if not user_session or not user_session.token:
            return JSONResponse(
                status_code=401,
                content={
                    "success": False,
                    "message": "Usuario no autenticado"
                }
            )
        
        # Obtener información fresca del microservicio
        success, user_data, error = await oauth2_client.get_user_info(
            username=username,
            token=user_session.token.access_token
        )
        
        if success and user_data:
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "user_detailed": user_data,
                    "user_session": user_session.to_dict()
                }
            )
        else:
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "message": error or "No se pudo obtener información del usuario"
                }
            )
        
    except Exception as e:
        logger.error(f"💥 Error obteniendo info detallada de usuario: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Error interno del servidor"
            }
        )

@app.post("/api/refresh-token")
async def refresh_token_api(username: str):
    """
    Renueva el token de un usuario
    """
    try:
        new_token = await auth_service.refresh_user_token(username)
        
        if new_token:
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "token": new_token,
                    "message": "Token renovado exitosamente"
                }
            )
        else:
            return JSONResponse(
                status_code=401,
                content={
                    "success": False,
                    "message": "No se pudo renovar el token"
                }
            )
        
    except Exception as e:
        logger.error(f"💥 Error renovando token: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Error interno del servidor"
            }
        )

# ===== NUEVAS APIs PARA HOSPITAL (AGREGAMOS SIN TOCAR NADA) =====

# ===== NUEVAS APIs PARA DICOM =====
@app.get("/api/dicom/studies")
async def get_dicom_studies():
    """Obtener lista de estudios DICOM disponibles"""
    try:
        studies = dicom_service.get_dicom_studies()
        return studies
    except Exception as e:
        logger.error(f"Error obteniendo estudios DICOM: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error obteniendo estudios DICOM: {str(e)}")

@app.get("/api/dicom/image")
async def get_dicom_image(file_path: str):
    """Convertir archivo DICOM a imagen PNG - VERSIÓN CORREGIDA"""
    try:
        logger.info(f"🖼️ Solicitud de imagen DICOM: {file_path}")
        
        # ✅ CORRECCIÓN: NO validar archivo aquí, dejar que DicomService lo maneje
        # El DicomService tiene la lógica completa de búsqueda de archivos
        
        # Obtener los bytes de la imagen directamente del servicio
        image_bytes = dicom_service.get_dicom_image(file_path)
        
        logger.info(f"✅ Imagen DICOM convertida: {file_path} ({len(image_bytes)} bytes)")
        
        return StreamingResponse(
            io.BytesIO(image_bytes),
            media_type="image/png",
            headers={
                "Cache-Control": "max-age=3600",
                "Content-Type": "image/png"
            }
        )
        
    except Exception as e:
        # Logging detallado del error
        logger.error(f"💥 Error en endpoint DICOM: {str(e)}")
        logger.error(f"💥 Tipo de error: {type(e).__name__}")
        
        # Si es FileNotFoundError, devolver 404
        if isinstance(e, FileNotFoundError):
            logger.error(f"📁 Archivo no encontrado: {file_path}")
            raise HTTPException(status_code=404, detail=f"Archivo DICOM no encontrado: {file_path}")
        
        # Para otros errores, devolver 500 con mensaje detallado
        error_detail = f"Error procesando imagen DICOM: {str(e)}"
        logger.error(f"🚨 Error 500: {error_detail}")
        raise HTTPException(status_code=500, detail=error_detail)

        
@app.get("/api/dicom/health")
async def dicom_health_check():
    """Health check para servicio DICOM"""
    return dicom_service.health_check()

@app.get("/api/hospital/structure")
async def get_hospital_structure():
    """Obtener estructura completa del hospital"""
    try:
        data = hospital_service.get_hospital_structure()
        if not data:
            raise HTTPException(status_code=404, detail="Estructura del hospital no encontrada")
        return data
    except Exception as e:
        logger.error(f"Error en get_hospital_structure: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.get("/api/hospital/floors/{floor_number}")
async def get_floor_data(floor_number: int):
    """Obtener datos de un piso específico"""
    try:
        data = hospital_service.get_floor_data(floor_number)
        if not data:
            raise HTTPException(status_code=404, detail=f"Piso {floor_number} no encontrado")
        return data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en get_floor_data: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.get("/api/hospital/stats")
async def get_hospital_stats():
    """Obtener estadísticas generales del hospital"""
    try:
        return hospital_service.get_hospital_stats()
    except Exception as e:
        logger.error(f"Error en get_hospital_stats: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.get("/api/patients/database")
async def get_patients_database():
    """Obtener base de datos completa de pacientes"""
    try:
        return hospital_service.get_patients_database()
    except Exception as e:
        logger.error(f"Error en get_patients_database: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# ✅ PRIMERO: El endpoint específico
@app.get("/api/patients/beds")
async def get_patients_by_beds():
    """Obtener pacientes organizados por cama"""
    try:
        return hospital_service.get_patients_by_beds()
    except Exception as e:
        logger.error(f"Error en get_patients_by_beds: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# ✅ DESPUÉS: El endpoint con parámetro
@app.get("/api/patients/{patient_id}")
async def get_patient_data(patient_id: str):
    """Obtener datos de un paciente específico"""
    try:
        data = hospital_service.get_patient_data(patient_id)
        if not data:
            raise HTTPException(status_code=404, detail=f"Paciente {patient_id} no encontrado")
        return data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en get_patient_data: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.get("/api/pharmacy/medications")
async def get_medications():
    """Obtener vademécum de medicamentos"""
    try:
        return hospital_service.get_medications()
    except Exception as e:
        logger.error(f"Error en get_medications: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.get("/api/pharmacy/medications/search")
async def search_medications(q: str):
    """Buscar medicamentos por nombre"""
    try:
        if len(q) < 2:
            raise HTTPException(status_code=400, detail="La búsqueda debe tener al menos 2 caracteres")
        return hospital_service.search_medications(q)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en search_medications: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.get("/api/pharmacy/medications/search/advanced")
async def advanced_medication_search(
    q: str = Query(..., min_length=2), 
    limit: int = Query(default=10, le=50)
):
    """Búsqueda avanzada de medicamentos con posología"""
    try:
        # Buscar en el vademécum
        medications_data = hospital_service.search_medications(q)
        
        # Limitar resultados
        limited_results = dict(list(medications_data.items())[:limit])
        
        return {
            "success": True,
            "query": q,
            "results": limited_results,
            "total_found": len(medications_data)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en búsqueda avanzada de medicamentos: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.get("/api/medical/exams")
async def get_exams_database():
    """Obtener base de datos de exámenes"""
    try:
        return hospital_service.get_exams_database()
    except Exception as e:
        logger.error(f"Error en get_exams_database: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.get("/api/medical/orders")
async def get_medical_orders():
    """Obtener órdenes médicas"""
    try:
        return hospital_service.get_medical_orders()
    except Exception as e:
        logger.error(f"Error en get_medical_orders: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.post("/api/medical/notes")
async def create_medical_note(note: MedicalNote):
    """Crear nueva nota médica"""
    try:
        result = hospital_service.save_medical_note(note.dict())
        if result["success"]:
            return {"message": "Nota médica guardada exitosamente", "data": result}
        else:
            raise HTTPException(status_code=500, detail=result.get("error", "Error desconocido"))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en create_medical_note: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# ===== RUTAS DE RECETAS (CORREGIDAS PARA FUNCIONAL) =====

@app.post("/api/recetas/crear")
async def crear_receta_endpoint(
    receta_data: dict = Body(...),
    token: str = Header(..., alias="Authorization")
):
    """📝 CREAR NUEVA RECETA"""
    try:
        clean_token = token.replace("Bearer ", "") if token.startswith("Bearer ") else token
        async with prescription_service as service:
            receta = await service.crear_receta_desde_frontend(receta_data, clean_token)
        return {
            "success": True,
            "data": receta,
            "message": "Receta creada exitosamente",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/recetas/{receta_id}")
async def obtener_receta_endpoint(
    receta_id: int = Path(..., gt=0),
    token: str = Header(..., alias="Authorization")
):
    """📖 OBTENER RECETA por ID (modal visualización)"""
    try:
        clean_token = token.replace("Bearer ", "") if token.startswith("Bearer ") else token
        async with prescription_service as service:
            receta = await service.obtener_receta_por_id(receta_id, clean_token)
            if not receta:
                raise HTTPException(status_code=404, detail="Receta no encontrada")
            return {
                "success": True,
                "data": receta,
                "message": "Receta obtenida exitosamente",
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/recetas/hospitalizacion/{hospitalizacion_id}")
async def obtener_recetas_hospitalizacion_endpoint(
    hospitalizacion_id: int = Path(..., gt=0),
    token: str = Header(..., alias="Authorization")
):
    """🏥 OBTENER RECETAS de hospitalización (Ver Recetas)"""
    try:
        clean_token = token.replace("Bearer ", "") if token.startswith("Bearer ") else token
        async with prescription_service as service:
            recetas = await service.obtener_recetas_hospitalizacion(hospitalizacion_id, clean_token)
        return {
            "success": True,
            "data": recetas,
            "message": f"Recetas de hospitalización ({len(recetas)} encontradas)",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/recetas/{receta_id}/editar")
async def actualizar_receta_endpoint(
    receta_id: int = Path(..., gt=0),
    cambios: dict = Body(...),
    medico_id: int = Query(..., gt=0),
    token: str = Header(..., alias="Authorization")
):
    """✏️ ACTUALIZAR RECETA (modal edición)"""
    try:
        clean_token = token.replace("Bearer ", "") if token.startswith("Bearer ") else token
        async with prescription_service as service:
            receta = await service.actualizar_receta(receta_id, cambios, medico_id, clean_token)
            return {
                "success": True,
                "data": receta,
                "message": "Receta actualizada exitosamente",
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/catalogos/medicamentos/buscar")
async def buscar_medicamentos_endpoint(
    q: Optional[str] = Query(None),
    token: str = Header(..., alias="Authorization")
):
    """🔍 BUSCAR MEDICAMENTOS"""
    try:
        clean_token = token.replace("Bearer ", "") if token.startswith("Bearer ") else token
        async with prescription_service as service:
            medicamentos = await service.buscar_medicamentos(q, None, clean_token)
            return {
                "success": True,
                "data": medicamentos,
                "message": f"Medicamentos encontrados: {len(medicamentos)}",
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/catalogos/diagnosticos/buscar")
async def buscar_diagnosticos_endpoint(
    q: Optional[str] = Query(None),
    token: str = Header(..., alias="Authorization")
):
    """🔍 BUSCAR DIAGNÓSTICOS"""
    try:
        clean_token = token.replace("Bearer ", "") if token.startswith("Bearer ") else token
        async with prescription_service as service:
            diagnosticos = await service.buscar_diagnosticos(q, clean_token)
            return {
                "success": True,
                "data": diagnosticos,
                "message": f"Diagnósticos encontrados: {len(diagnosticos)}",
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recetas/generar-pdf")
async def generar_pdf_endpoint(
    receta_id: int = Query(..., gt=0),
    token: str = Header(..., alias="Authorization")
):
    """📄 GENERAR PDF con datos reales"""
    try:
        clean_token = token.replace("Bearer ", "") if token.startswith("Bearer ") else token
        async with prescription_service as service:
            pdf_bytes = await service.generate_prescription_pdf_from_microservice(receta_id, clean_token)
            return Response(
                pdf_bytes,
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename=receta_{receta_id}.pdf"}
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/pacientes/cama/{bed_number}")
async def obtener_datos_cama_endpoint(
    bed_number: str = Path(...),
    token: str = Header(..., alias="Authorization")
):
    """🏥 OBTENER DATOS por número de cama"""
    try:
        clean_token = token.replace("Bearer ", "") if token.startswith("Bearer ") else token
        async with prescription_service as service:
            datos = await service.obtener_datos_cama(bed_number, clean_token)
            if not datos:
                raise HTTPException(status_code=404, detail="Cama no encontrada")
            return {
                "success": True,
                "data": datos,
                "message": "Datos de cama obtenidos",
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/recetas/health")
async def health_check_recetas_endpoint():
    """🛠️ HEALTH CHECK"""
    try:
        async with prescription_service as service:
            health = await service.health_check()
        return {
            "success": True,
            "data": health,
            "message": "Health check completado",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.get("/api/recetas/test/datos")
async def obtener_datos_prueba_endpoint():
    """🧪 DATOS DE PRUEBA"""
    return {
        "success": True,
        "data": prescription_service.obtener_datos_prueba(),
        "message": "Datos de prueba obtenidos",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/recetas/test/crear-prueba")
async def crear_receta_prueba_endpoint(
    token: str = Header(..., alias="Authorization")
):
    """🧪 CREAR RECETA DE PRUEBA"""
    try:
        clean_token = token.replace("Bearer ", "") if token.startswith("Bearer ") else token
        async with prescription_service as service:
            receta = await service.crear_receta_prueba(clean_token)
            return {
                "success": True,
                "data": receta,
                "message": "Receta de prueba creada",
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== APIS DE SIGNOS VITALES - POSTGRESQL =====

@app.get("/api/vital-signs")
async def get_all_vital_signs():
    """Obtener todos los signos vitales desde PostgreSQL"""
    try:
        return await vital_signs_service.get_all_patients_vitals()
    except Exception as e:
        logger.error(f"Error en get_all_vital_signs: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.get("/api/vital-signs/{bed_id}")
async def get_patient_vital_signs(bed_id: str):
    """Obtener signos vitales de un paciente específico desde PostgreSQL"""
    try:
        patient_data = await vital_signs_service.get_patient_vitals(bed_id)
        
        if not patient_data:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")
        
        return patient_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en get_patient_vital_signs: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.post("/api/vital-signs/{bed_id}/acknowledge-alert/{alert_index}")
async def acknowledge_alert(bed_id: str, alert_index: int):
    """Reconocer una alerta específica"""
    try:
        # Obtener datos actuales del paciente
        patient_data = await vital_signs_service.get_patient_vitals(bed_id)
        
        if not patient_data:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")
        
        alerts = patient_data.get("alerts", [])
        if 0 <= alert_index < len(alerts):
            alerts[alert_index]["acknowledged"] = True
            # Nota: En PostgreSQL necesitarías guardar este cambio
            # Por ahora solo devolvemos la confirmación
            return {"message": "Alerta reconocida"}
        
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en acknowledge_alert: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.get("/api/vital-signs/test/data")
async def test_vital_signs_data():
    """Test simple para verificar la data de signos vitales desde PostgreSQL"""
    try:
        data = await vital_signs_service.get_all_patients_vitals()
        patients_vitals = data.get("vital_signs_monitoring", {}).get("patients_vitals", {})
        
        return {
            "status": "success",
            "message": "Datos cargados correctamente desde PostgreSQL",
            "total_patients": len(patients_vitals),
            "bed_ids": list(patients_vitals.keys()),
            "data_source": "PostgreSQL Database",
            "sample_data": data
        }
    except Exception as e:
        logger.error(f"Error en test: {e}")
        return {
            "status": "error",
            "message": str(e),
            "total_patients": 0,
            "bed_ids": [],
            "sample_data": None,
            "data_source": "PostgreSQL Database (ERROR)"
        }

# ===== WEBSOCKET SIMPLIFICADO (SIN SIMULACIÓN POR AHORA) =====
@app.websocket("/ws/vital-signs")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket para actualizaciones en tiempo real"""
    await websocket.accept()
    
    try:
        # Enviar datos iniciales desde PostgreSQL
        initial_data = await vital_signs_service.get_all_patients_vitals()
        await websocket.send_json({
            "type": "initial_data",
            "data": initial_data["vital_signs_monitoring"]["patients_vitals"],
            "timestamp": datetime.now().isoformat()
        })
        
        # Mantener conexión activa
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        logger.info("Cliente WebSocket desconectado")
    except Exception as e:
        logger.error(f"Error en WebSocket: {e}")

# ===== RUTAS DE SIMULACIÓN DESHABILITADAS (POSTGRESQL NO LAS NECESITA) =====
@app.post("/api/vital-signs/{bed_id}/simulate")
async def start_simulation(bed_id: str):
    """Simulación no disponible - usando datos reales de PostgreSQL"""
    return {
        "message": "Simulación no disponible - usando datos reales de PostgreSQL",
        "bed_id": bed_id,
        "data_source": "PostgreSQL Real Data"
    }

@app.post("/api/vital-signs/simulate/all")
async def simulate_all_patients():
    """Simulación no disponible - usando datos reales de PostgreSQL"""
    return {
        "message": "Simulación no disponible - usando datos reales de PostgreSQL", 
        "data_source": "PostgreSQL Real Data"
    }

@app.get("/api/vital-signs/test/file")
async def test_vital_signs_file():
    """Test de archivo no aplicable - usando PostgreSQL"""
    return {
        "message": "Test de archivo no aplicable - usando PostgreSQL",
        "data_source": "PostgreSQL Database",
        "status": "postgresql_active"
    }



# ========================================
# 🩻 APIs DICOM (DUPLICADAS - LIMPIAR)
# ========================================

@app.get("/api/dicom/metadata/{file_name}")
async def get_dicom_metadata(file_name: str):
    """Obtener metadatos detallados de un archivo DICOM"""
    try:
        metadata = dicom_service.get_dicom_metadata(file_name)
        return metadata
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Archivo DICOM no encontrado")
    except Exception as e:
        logger.error(f"Error obteniendo metadatos DICOM: {e}")
        raise HTTPException(status_code=500, detail="Error obteniendo metadatos DICOM")

@app.get("/api/dicom/test")
async def test_dicom_processing():
    """Test para verificar procesamiento DICOM"""
    try:
        return dicom_service.test_dicom_processing()
    except Exception as e:
        logger.error(f"Error en test DICOM: {e}")
        return {
            "status": "error", 
            "message": str(e),
            "timestamp": datetime.now().isoformat()
        }

# ===== TUS ENDPOINTS DE MONITOREO (CONSERVAMOS) =====

@app.get("/api/health")
async def health_check():
    """
    Health check del sistema
    """
    try:
        # Verificar conexión con OAuth2
        system_stats = auth_service.get_system_stats()
        
        # Verificar archivos de hospital
        hospital_files = hospital_service.validate_data_files()
        
        return JSONResponse(
            status_code=200,
            content={
                "status": "healthy",
                "message": "Sistema funcionando correctamente",
                "oauth2_service": "connected",
                "hospital_service": "connected",
                "data_files": hospital_files,
                "statistics": system_stats,
                "timestamp": datetime.now().isoformat()
            }
        )
        
    except Exception as e:
        logger.error(f"💥 Error en health check: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "message": "Error en el sistema",
                "error": str(e)
            }
        )

@app.get("/api/stats")
async def get_system_stats():
    """
    Obtiene estadísticas del sistema de autenticación
    """
    try:
        auth_stats = auth_service.get_system_stats()
        hospital_stats = hospital_service.get_hospital_stats()
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "auth_stats": auth_stats,
                "hospital_stats": hospital_stats
            }
        )
        
    except Exception as e:
        logger.error(f"💥 Error obteniendo estadísticas: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Error obteniendo estadísticas"
            }
        )

# ===== TUS DEPENDENCIAS EXISTENTES (CONSERVAMOS) =====

async def get_current_user(username: str = None):
    """
    Dependencia para obtener el usuario actual autenticado
    """
    if not username:
        raise HTTPException(status_code=401, detail="Usuario no proporcionado")
    
    user_session = auth_service.get_user_session(username)
    if not user_session:
        raise HTTPException(status_code=401, detail="Usuario no autenticado")
    
    return user_session

# ===== TUS ENDPOINTS PROTEGIDOS (CONSERVAMOS Y MEJORAMOS) =====

@app.get("/api/protected/dashboard-data")
async def get_dashboard_data(username: str):
    """
    Endpoint protegido que requiere autenticación con datos reales del usuario
    """
    try:
        user_session = await get_current_user(username)
        
        # Obtener información fresca del usuario
        success, detailed_user, error = await oauth2_client.get_user_info(
            username=username,
            token=user_session.token.access_token
        )
        
        # Preparar mensaje de bienvenida personalizado
        display_name = user_session.name
        if detailed_user:
            first_name = detailed_user.get('firstName', '')
            last_name = detailed_user.get('lastName', '')
            if first_name or last_name:
                display_name = f"Dr. {first_name} {last_name}".strip()
        
        # Obtener estadísticas del hospital
        hospital_stats = hospital_service.get_hospital_stats()
        
        # Datos del dashboard personalizados por rol
        dashboard_data = {
            "welcome_message": f"Bienvenido, {display_name}",
            "role": user_session.role,
            "role_display": {
                "admin": "Administrador del Sistema",
                "doctor": "Médico Especialista", 
                "nurse": "Enfermero/a Profesional",
                "user": "Usuario del Sistema"
            }.get(user_session.role, "Usuario"),
            "permissions": user_session.permissions,
            "user_info": {
                "id": user_session.user_id,
                "username": user_session.username,
                "email": user_session.email,
                "full_name": display_name,
                "enabled": detailed_user.get('enabled', True) if detailed_user else True,
                "roles": detailed_user.get('roles', []) if detailed_user else []
            },
            "stats": _get_role_based_stats(user_session.role),
            "hospital_stats": hospital_stats,
            "recent_activity": _get_role_based_activity(user_session.role),
            "quick_actions": _get_role_based_actions(user_session.role, user_session.permissions)
        }
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": dashboard_data,
                "user": user_session.to_dict(),
                "detailed_user": detailed_user if detailed_user else None
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"💥 Error obteniendo datos del dashboard: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Error obteniendo datos del dashboard"
            }
        )

# ===== TUS FUNCIONES AUXILIARES (CONSERVAMOS) =====

def _get_role_based_stats(role: str) -> dict:
    """
    Obtiene estadísticas basadas en el rol del usuario
    """
    base_stats = {
        "patients_total": 1245,
        "appointments_today": 23,
        "doctors_active": 15,
        "emergencies": 4
    }
    
    if role == "admin":
        base_stats.update({
            "system_users": 89,
            "active_sessions": 12,
            "monthly_revenue": 125000,
            "pending_approvals": 7
        })
    elif role == "doctor":
        base_stats.update({
            "my_patients": 156,
            "my_appointments_today": 8,
            "pending_consultations": 3,
            "prescriptions_issued": 45
        })
    elif role == "nurse":
        base_stats.update({
            "assigned_patients": 32,
            "vital_signs_pending": 12,
            "medications_due": 18,
            "rounds_completed": 4
        })
    
    return base_stats

def _get_role_based_activity(role: str) -> list:
    """
    Obtiene actividad reciente basada en el rol
    """
    base_activity = [
        {
            "id": 1,
            "type": "new_patient",
            "message": "Nuevo paciente registrado: María González",
            "time": "Hace 15 minutos",
            "icon": "user-plus"
        }
    ]
    
    if role == "admin":
        base_activity.extend([
            {
                "id": 2,
                "type": "system",
                "message": "Backup del sistema completado",
                "time": "Hace 30 minutos",
                "icon": "database"
            },
            {
                "id": 3,
                "type": "user_management",
                "message": "Nuevo usuario médico aprobado",
                "time": "Hace 1 hora",
                "icon": "user-check"
            }
        ])
    elif role == "doctor":
        base_activity.extend([
            {
                "id": 2,
                "type": "consultation",
                "message": "Consulta completada: Juan Pérez",
                "time": "Hace 20 minutos",
                "icon": "stethoscope"
            },
            {
                "id": 3,
                "type": "prescription",
                "message": "Receta emitida para Ana Silva",
                "time": "Hace 45 minutos",
                "icon": "prescription-bottle"
            }
        ])
    elif role == "nurse":
        base_activity.extend([
            {
                "id": 2,
                "type": "medication",
                "message": "Medicación administrada a paciente 204",
                "time": "Hace 10 minutos",
                "icon": "pills"
            },
            {
                "id": 3,
                "type": "vital_signs",
                "message": "Signos vitales registrados - Sala 3",
                "time": "Hace 35 minutos",
                "icon": "heartbeat"
            }
        ])
    
    return base_activity

def _get_role_based_actions(role: str, permissions: list) -> list:
    """
    Obtiene acciones rápidas basadas en rol y permisos
    """
    actions = []
    
    if "create_patients" in permissions:
        actions.append({
            "title": "Nuevo Paciente",
            "icon": "user-plus",
            "url": "/patients/new",
            "color": "blue"
        })
    
    if "create_appointments" in permissions:
        actions.append({
            "title": "Agendar Cita",
            "icon": "calendar-plus",
            "url": "/appointments/new", 
            "color": "green"
        })
    
    if "create_medical_records" in permissions:
        actions.append({
            "title": "Rondas Médicas",
            "icon": "bed",
            "url": "/medical/rounds",
            "color": "purple"
        })
    
    if role == "admin":
        actions.extend([
            {
                "title": "Gestión Usuarios",
                "icon": "users-cog",
                "url": "/admin/users",
                "color": "orange"
            },
            {
                "title": "Reportes",
                "icon": "chart-bar",
                "url": "/reports",
                "color": "indigo"
            }
        ])
    
    # Siempre mostrar emergencia
    actions.append({
        "title": "Emergencia",
        "icon": "ambulance",
        "url": "/emergency",
        "color": "red"
    })
    
    return actions

# ===== TUS MANEJADORES DE ERRORES (CONSERVAMOS) =====

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Manejo personalizado de excepciones HTTP
    """
    logger.warning(f"❌ HTTP Exception: {exc.status_code} - {exc.detail}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "status_code": exc.status_code
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """
    Manejo de excepciones generales
    """
    logger.error(f"💥 Excepción no manejada: {str(exc)}")
    
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Error interno del servidor",
            "status_code": 500
        }
    )

# ===== TUS EVENTOS (CONSERVAMOS Y MEJORAMOS) =====

@app.on_event("startup")
async def startup_event():
    """
    Eventos al iniciar la aplicación
    """
    logger.info("🏥 Iniciando Hospital Management System...")
    
    # ✅ AGREGAR ESTAS LÍNEAS:
    try:
        from services.database_config import db_manager
        await db_manager.init_pool()
        logger.info("🗃️ Base de datos PostgreSQL conectada")
    except Exception as e:
        logger.error(f"❌ Error conectando base de datos: {e}")
        # No fallar el startup, solo log del error
    
    logger.info("🔐 Servicio de autenticación OAuth2 configurado")
    logger.info("🏥 Servicio de hospital configurado")
    logger.info("📊 Sistema de monitoreo activado")

@app.on_event("shutdown")
async def shutdown_event():
    """
    Eventos al cerrar la aplicación
    """
    logger.info("🚪 Cerrando Hospital Management System...")
    
    # ✅ AGREGAR ESTAS LÍNEAS:
    try:
        from services.database_config import db_manager
        await db_manager.close_pool()
        logger.info("🗃️ Pool de base de datos cerrado")
    except Exception as e:
        logger.error(f"❌ Error cerrando base de datos: {e}")
    
    # Cerrar todas las sesiones activas
    active_count = auth_service.get_active_sessions_count()

# ===== CONFIGURACIÓN PARA DESARROLLO (ACTUALIZADA) =====

if __name__ == "__main__":
    import uvicorn
    
    print("🏥 ===== HOSPITAL MANAGEMENT SYSTEM =====")
    print("🔐 OAuth2 Service: http://localhost:8090")
    print("📱 Web App: http://localhost:8000")
    print("🏥 Rondas Médicas: http://localhost:8000/medical/rounds")
    print("📋 API Docs: http://localhost:8000/docs")
    print("🔍 Health Check: http://localhost:8000/api/health")
    print("📊 Stats: http://localhost:8000/api/stats")


     # 🆕 MOSTRAR CONFIGURACIÓN ACTUAL
    dev_mode = os.getenv("DEVELOPMENT_MODE", "false").lower() == "true"
    print(f"🔧 Modo: {'DESARROLLO' if dev_mode else 'PRODUCCIÓN'}")
    print(f"🛡️ Seguridad: {'DESHABILITADA' if dev_mode else 'ACTIVA'}")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )