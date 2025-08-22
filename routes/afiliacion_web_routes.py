# ===== RUTAS AFILIACIÓN - CLAUDE DEV =====
# main.py o archivo de rutas principal

from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse

# Configurar templates
templates = Jinja2Templates(directory="templates")

# Ruta para nueva afiliación
@app.get("/medical/afiliacion/nueva", response_class=HTMLResponse)
async def nueva_afiliacion(request: Request):
    """
    🏥 PÁGINA DE NUEVA AFILIACIÓN
    Renderiza el formulario de afiliación multi-paso
    """
    return templates.TemplateResponse(
        "medical/afiliacion/afiliacion.html", 
        {"request": request, "title": "Nueva Afiliación de Paciente"}
    )

# Ruta para editar afiliación (opcional)
@app.get("/medical/afiliacion/editar/{paciente_id}", response_class=HTMLResponse)
async def editar_afiliacion(request: Request, paciente_id: int):
    """
    📝 PÁGINA DE EDITAR AFILIACIÓN
    Renderiza el formulario con datos del paciente para edición
    """
    return templates.TemplateResponse(
        "medical/afiliacion/afiliacion.html", 
        {
            "request": request, 
            "title": "Editar Paciente",
            "paciente_id": paciente_id,
            "modo_edicion": True
        }
    )

print("🌐 Rutas de afiliación configuradas correctamente")
