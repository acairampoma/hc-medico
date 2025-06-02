# vital_signs_service.py
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
import json
import asyncio
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import uvicorn
from pathlib import Path

app = FastAPI(title="Hospital Vital Signs Monitor", version="1.0.0")

# Servir archivos estáticos
app.mount("/static", StaticFiles(directory="static"), name="static")

class VitalSignsManager:
    def __init__(self):
        self.connected_clients: List[WebSocket] = []
        self.vital_signs_data = self.load_vital_signs_data()
        self.simulation_running = False
        
    def load_vital_signs_data(self) -> dict:
        """Cargar datos de signos vitales desde JSON"""
        try:
            with open('data/mock/vitales/vital_signs_data.json', 'r', encoding='utf-8') as file:
                return json.load(file)
        except FileNotFoundError:
            # Datos por defecto si no existe el archivo
            return {
                "vital_signs_monitoring": {
                    "patients_vitals": {},
                    "metadata": {
                        "last_updated": datetime.now().isoformat(),
                        "refresh_interval": 5000
                    }
                }
            }
    
    def save_vital_signs_data(self):
        """Guardar datos actualizados"""
        with open('data/mock/vitales/vital_signs_data.json', 'w', encoding='utf-8') as file:
            json.dump(self.vital_signs_data, file, indent=2, ensure_ascii=False)
    
    def simulate_vital_signs_change(self, bed_id: str) -> dict:
        """Simular cambios realistas en signos vitales"""
        if bed_id not in self.vital_signs_data["vital_signs_monitoring"]["patients_vitals"]:
            return {}
            
        patient_data = self.vital_signs_data["vital_signs_monitoring"]["patients_vitals"][bed_id]
        current_vitals = patient_data["current_vitals"]
        
        # Simulación realista basada en condición del paciente
        diagnosis = patient_data["patient_info"]["diagnosis"].lower()
        
        # Factores de variación según diagnóstico
        if "cáncer" in diagnosis or "tumor" in diagnosis:
            hr_variation = random.randint(-3, 8)  # Tendencia a taquicardia
            bp_sys_variation = random.randint(-5, 10)
            temp_variation = round(random.uniform(-0.2, 0.5), 1)
        elif "renal" in diagnosis or "cólico" in diagnosis:
            hr_variation = random.randint(5, 15)  # Dolor causa taquicardia
            bp_sys_variation = random.randint(10, 25)  # Hipertensión por dolor
            temp_variation = round(random.uniform(-0.1, 0.8), 1)
        else:
            hr_variation = random.randint(-5, 5)
            bp_sys_variation = random.randint(-8, 8)
            temp_variation = round(random.uniform(-0.3, 0.3), 1)
        
        # Aplicar variaciones
        new_hr = max(45, min(150, current_vitals["heart_rate"]["value"] + hr_variation))
        new_sys = max(90, min(200, current_vitals["blood_pressure"]["systolic"] + bp_sys_variation))
        new_dias = max(50, min(120, current_vitals["blood_pressure"]["diastolic"] + random.randint(-3, 5)))
        new_temp = max(35.0, min(42.0, current_vitals["temperature"]["value"] + temp_variation))
        new_resp = max(8, min(40, current_vitals["respiratory_rate"]["value"] + random.randint(-2, 4)))
        new_spo2 = max(85, min(100, current_vitals["oxygen_saturation"]["value"] + random.randint(-2, 1)))
        
        # Actualizar valores
        current_vitals["heart_rate"]["value"] = new_hr
        current_vitals["blood_pressure"]["systolic"] = new_sys
        current_vitals["blood_pressure"]["diastolic"] = new_dias
        current_vitals["temperature"]["value"] = new_temp
        current_vitals["respiratory_rate"]["value"] = new_resp
        current_vitals["oxygen_saturation"]["value"] = new_spo2
        current_vitals["timestamp"] = datetime.now().isoformat()
        
        # Determinar estados
        self.update_vital_status(current_vitals)
        self.check_and_create_alerts(bed_id, current_vitals)
        
        return patient_data
    
    def update_vital_status(self, vitals: dict):
        """Actualizar estado de signos vitales"""
        # Frecuencia cardíaca
        hr = vitals["heart_rate"]["value"]
        if hr < 60:
            vitals["heart_rate"]["status"] = "low"
        elif hr > 100:
            vitals["heart_rate"]["status"] = "elevated"
        else:
            vitals["heart_rate"]["status"] = "normal"
            
        # Presión arterial
        sys = vitals["blood_pressure"]["systolic"]
        if sys >= 180:
            vitals["blood_pressure"]["status"] = "critical"
        elif sys >= 140:
            vitals["blood_pressure"]["status"] = "high"
        elif sys >= 130:
            vitals["blood_pressure"]["status"] = "elevated"
        else:
            vitals["blood_pressure"]["status"] = "normal"
            
        # Temperatura
        temp = vitals["temperature"]["value"]
        if temp >= 38.0:
            vitals["temperature"]["status"] = "fever"
        elif temp >= 37.5:
            vitals["temperature"]["status"] = "elevated"
        elif temp < 36.0:
            vitals["temperature"]["status"] = "low"
        else:
            vitals["temperature"]["status"] = "normal"
            
        # Saturación de oxígeno
        spo2 = vitals["oxygen_saturation"]["value"]
        if spo2 < 90:
            vitals["oxygen_saturation"]["status"] = "critical"
        elif spo2 < 95:
            vitals["oxygen_saturation"]["status"] = "low"
        else:
            vitals["oxygen_saturation"]["status"] = "normal"
    
    def check_and_create_alerts(self, bed_id: str, vitals: dict):
        """Crear alertas basadas en signos vitales críticos"""
        patient_data = self.vital_signs_data["vital_signs_monitoring"]["patients_vitals"][bed_id]
        alerts = patient_data.get("alerts", [])
        
        # Limpiar alertas antiguas (más de 1 hora)
        current_time = datetime.now()
        alerts = [alert for alert in alerts 
                 if (current_time - datetime.fromisoformat(alert["timestamp"].replace('Z', ''))) < timedelta(hours=1)]
        
        # Verificar condiciones críticas
        if vitals["oxygen_saturation"]["value"] < 90:
            alerts.append({
                "type": "critical",
                "message": f"Saturación crítica: {vitals['oxygen_saturation']['value']}%",
                "timestamp": datetime.now().isoformat() + "Z",
                "acknowledged": False
            })
        
        if vitals["heart_rate"]["value"] > 120:
            alerts.append({
                "type": "warning",
                "message": f"Taquicardia: {vitals['heart_rate']['value']} bpm",
                "timestamp": datetime.now().isoformat() + "Z",
                "acknowledged": False
            })
        
        if vitals["blood_pressure"]["systolic"] > 180:
            alerts.append({
                "type": "critical",
                "message": f"Crisis hipertensiva: {vitals['blood_pressure']['systolic']}/{vitals['blood_pressure']['diastolic']}",
                "timestamp": datetime.now().isoformat() + "Z",
                "acknowledged": False
            })
        
        patient_data["alerts"] = alerts[-10:]  # Mantener solo las últimas 10 alertas
    
    async def broadcast_vital_signs(self):
        """Enviar datos actualizados a todos los clientes conectados"""
        if self.connected_clients:
            message = {
                "type": "vital_signs_update",
                "data": self.vital_signs_data["vital_signs_monitoring"]["patients_vitals"],
                "timestamp": datetime.now().isoformat()
            }
            
            disconnected_clients = []
            for client in self.connected_clients:
                try:
                    await client.send_json(message)
                except:
                    disconnected_clients.append(client)
            
            # Remover clientes desconectados
            for client in disconnected_clients:
                self.connected_clients.remove(client)

# Instancia global del manager
vital_signs_manager = VitalSignsManager()

@app.get("/", response_class=HTMLResponse)
async def serve_monitor():
    """Servir página principal del monitor"""
    return FileResponse("templates/vital_signs.html")

@app.get("/api/vital-signs")
async def get_all_vital_signs():
    """Obtener todos los signos vitales"""
    return vital_signs_manager.vital_signs_data["vital_signs_monitoring"]

@app.get("/api/vital-signs/{bed_id}")
async def get_patient_vital_signs(bed_id: str):
    """Obtener signos vitales de un paciente específico"""
    patients_vitals = vital_signs_manager.vital_signs_data["vital_signs_monitoring"]["patients_vitals"]
    
    if bed_id not in patients_vitals:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    
    return patients_vitals[bed_id]

@app.post("/api/vital-signs/{bed_id}/acknowledge-alert/{alert_index}")
async def acknowledge_alert(bed_id: str, alert_index: int):
    """Reconocer una alerta específica"""
    patients_vitals = vital_signs_manager.vital_signs_data["vital_signs_monitoring"]["patients_vitals"]
    
    if bed_id not in patients_vitals:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    
    alerts = patients_vitals[bed_id].get("alerts", [])
    if 0 <= alert_index < len(alerts):
        alerts[alert_index]["acknowledged"] = True
        vital_signs_manager.save_vital_signs_data()
        await vital_signs_manager.broadcast_vital_signs()
        return {"message": "Alerta reconocida"}
    
    raise HTTPException(status_code=404, detail="Alerta no encontrada")

@app.websocket("/ws/vital-signs")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket para actualizaciones en tiempo real"""
    await websocket.accept()
    vital_signs_manager.connected_clients.append(websocket)
    
    try:
        # Enviar datos iniciales
        await websocket.send_json({
            "type": "initial_data",
            "data": vital_signs_manager.vital_signs_data["vital_signs_monitoring"]["patients_vitals"],
            "timestamp": datetime.now().isoformat()
        })
        
        # Mantener conexión activa
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        vital_signs_manager.connected_clients.remove(websocket)

@app.on_event("startup")
async def startup_event():
    """Iniciar simulación de signos vitales"""
    if not vital_signs_manager.simulation_running:
        vital_signs_manager.simulation_running = True
        asyncio.create_task(simulation_loop())

async def simulation_loop():
    """Loop principal de simulación"""
    while vital_signs_manager.simulation_running:
        # Simular cambios para cada paciente
        patients_vitals = vital_signs_manager.vital_signs_data["vital_signs_monitoring"]["patients_vitals"]
        
        for bed_id in patients_vitals.keys():
            vital_signs_manager.simulate_vital_signs_change(bed_id)
        
        # Enviar actualizaciones
        await vital_signs_manager.broadcast_vital_signs()
        
        # Guardar datos cada 30 segundos
        if datetime.now().second % 30 == 0:
            vital_signs_manager.save_vital_signs_data()
        
        # Esperar 5 segundos para próxima actualización
        await asyncio.sleep(5)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)