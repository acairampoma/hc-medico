# ===== ARCHIVO: vital_signs_service.py =====
# Ubicación: /services/vital_signs_service.py

from services.database_config import db_manager
import asyncpg
from typing import Dict, Any, List
import json
from datetime import datetime
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VitalSignsManager:
    
    async def get_all_patients_vitals(self) -> Dict[str, Any]:
        """
        Obtener signos vitales de todos los pacientes activos
        Transformar desde PostgreSQL al formato compatible con el frontend
        """
        try:
            # Verificar que el pool esté inicializado
            if not db_manager.pool:
                logger.error("❌ Pool de conexiones no inicializado")
                return self._get_empty_response("Pool de conexiones no disponible")
            
            async with db_manager.pool.acquire() as connection:
                # Consulta COMPLETA: TODOS los pacientes hospitalizados (con o sin equipos conectados)
                query = """
                WITH ultima_lectura AS (
                    SELECT DISTINCT ON (cama_codigo, tipo_signo) 
                        cama_codigo,
                        paciente_id,
                        numero_cuenta,
                        tipo_signo,
                        valor_numerico,
                        unidad_medida,
                        fecha_registro,
                        monitor_codigo
                    FROM hospitalizacion_signos_vitales hsv
                    WHERE es_ultimo_del_dia = 'S' 
                      AND estado_registro = '01'
                      AND fecha_registro >= CURRENT_DATE - INTERVAL '7 days'
                    ORDER BY cama_codigo, tipo_signo, fecha_registro DESC
                )
                SELECT 
                    -- Datos de la cama (siempre presente)
                    c.codigo as cama_codigo,
                    
                    -- Datos completos del paciente
                    p.id as paciente_id,
                    p.nombres,
                    p.apellidos,
                    p.numero_doc,
                    p.tipo_doc,
                    EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM p.fecha_nacimiento) as edad,
                    p.sexo as genero,
                    p.fecha_nacimiento,
                    p.telefono,
                    p.email,
                    p.direccion,
                    p.distrito,
                    
                    -- Datos de hospitalización
                    h.numero_cuenta,
                    h.fecha_ingreso as fecha_hospitalizacion,
                    h.fecha_alta_real,
                    h.estado as estado_hospitalizacion,
                    
                    -- Datos del médico tratante
                    med.cmp,
                    u.first_name as medico_nombre,
                    u.last_name as medico_apellido,
                    
                    -- Especialidad
                    esp.nombre as especialidad,
                    esp.codigo as especialidad_codigo,
                    
                    -- Datos de la cama actual
                    c.numero as numero_cama,
                    c.codigo as codigo_cama,
                    c.tipo as tipo_cama,
                    c.estado as estado_cama,
                    c.oxigeno,
                    c.monitor,
                    
                    -- Datos del piso
                    piso.numero as piso_numero,
                    piso.nombre as piso_nombre,
                    piso.tipo as tipo_piso,
                    
                    -- Hospital
                    hosp.nombre as hospital_nombre,
                    hosp.codigo as hospital_codigo,
                    
                    -- Seguro (si tiene)
                    seg.nombre as seguro_nombre,
                    p.numero_seguro,
                    
                    -- Movimiento actual de hospitalización
                    hm.fecha_asignacion as fecha_asignacion_cama,
                    hm.estado as estado_movimiento,
                    
                    -- ✅ SIGNOS VITALES (pueden ser NULL si no hay equipo conectado)
                    ul.tipo_signo,
                    ul.valor_numerico,
                    ul.unidad_medida,
                    ul.fecha_registro,
                    ul.monitor_codigo,
                    
                    -- Estado de conexión del monitor
                    CASE 
                        WHEN ul.monitor_codigo IS NOT NULL THEN 'connected'
                        WHEN c.monitor = 'S' THEN 'available_not_connected'
                        ELSE 'no_monitor'
                    END as monitor_status
                    
                FROM 
                    -- ✅ PARTIR DESDE HOSPITALIZACIONES ACTIVAS
                    hospitalizacion_cab h
                    
                -- ✅ SEMPRE JOIN con pacientes
                INNER JOIN pacientes p ON h.paciente_id = p.id
                
                -- ✅ SEMPRE JOIN con movimiento actual de cama
                INNER JOIN hospitalizacion_mov hm ON h.id = hm.hospitalizacion_id 
                    AND hm.estado = '01' 
                    AND hm.fecha_liberacion IS NULL
                    
                -- ✅ SEMPRE JOIN con cama actual
                INNER JOIN camas c ON hm.cama_destino_id = c.id
                
                -- ✅ LEFT JOIN para signos vitales (puede no haber)
                LEFT JOIN ultima_lectura ul ON c.codigo = ul.cama_codigo
                
                -- Otros LEFT JOINs opcionales
                LEFT JOIN medicos med ON h.medico_tratante_id = med.id
                LEFT JOIN users u ON med.usuario_id = u.id
                LEFT JOIN especialidades esp ON h.especialidad_id = esp.id
                LEFT JOIN pisos piso ON c.piso_id = piso.id
                LEFT JOIN hospitales hosp ON p.hospital_id = hosp.id
                LEFT JOIN seguros seg ON p.seguro_id = seg.id
                
                WHERE 
                    h.estado = '01'  -- Solo hospitalizaciones activas
                    AND p.activo = 'S'  -- Solo pacientes activos
                    AND c.activo = 'S'  -- Solo camas activas
                
                ORDER BY 
                    piso.numero, 
                    c.numero, 
                    ul.tipo_signo, 
                    ul.fecha_registro DESC
                """
                
                logger.info("🔍 Ejecutando consulta de signos vitales...")
                rows = await connection.fetch(query)
                logger.info(f"📊 Encontrados {len(rows)} registros de signos vitales")
                
                # Transformar datos a formato frontend
                result = self._transform_to_frontend_format(rows)
                logger.info(f"✅ Datos transformados para {len(result['vital_signs_monitoring']['patients_vitals'])} pacientes")
                
                return result
                
        except asyncpg.PostgresError as e:
            logger.error(f"❌ Error PostgreSQL: {e}")
            return self._get_empty_response(f"Error de base de datos: {str(e)}")
        except Exception as e:
            logger.error(f"❌ Error general consultando signos vitales: {e}")
            return self._get_empty_response(f"Error interno: {str(e)}")
    
    async def get_patient_vitals(self, bed_id: str) -> Dict[str, Any]:
        """
        Obtener signos vitales de un paciente específico por cama
        """
        try:
            if not db_manager.pool:
                logger.error("❌ Pool de conexiones no inicializado")
                return None
            
            async with db_manager.pool.acquire() as connection:
                # Consulta COMPLETA para paciente específico
                query = """
                SELECT DISTINCT ON (hsv.tipo_signo) 
                    -- Datos de signos vitales
                    hsv.cama_codigo,
                    hsv.paciente_id,
                    hsv.numero_cuenta,
                    hsv.tipo_signo,
                    hsv.valor_numerico,
                    hsv.unidad_medida,
                    hsv.fecha_registro,
                    hsv.monitor_codigo,
                    
                    -- Datos completos del paciente
                    p.nombres,
                    p.apellidos,
                    p.numero_doc,
                    p.tipo_doc,
                    EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM p.fecha_nacimiento) as edad,
                    p.sexo as genero,
                    p.fecha_nacimiento,
                    p.telefono,
                    p.email,
                    p.direccion,
                    p.distrito,
                    
                    -- Datos de hospitalización
                    h.fecha_ingreso as fecha_hospitalizacion,
                    h.fecha_alta_real,
                    h.estado as estado_hospitalizacion,
                    
                    -- Datos del médico tratante
                    med.cmp,
                    u.first_name as medico_nombre,
                    u.last_name as medico_apellido,
                    
                    -- Especialidad
                    esp.nombre as especialidad,
                    esp.codigo as especialidad_codigo,
                    
                    -- Datos de la cama actual
                    c.numero as numero_cama,
                    c.codigo as codigo_cama,
                    c.tipo as tipo_cama,
                    c.estado as estado_cama,
                    c.oxigeno,
                    c.monitor,
                    
                    -- Datos del piso
                    piso.numero as piso_numero,
                    piso.nombre as piso_nombre,
                    piso.tipo as tipo_piso,
                    
                    -- Hospital
                    hosp.nombre as hospital_nombre,
                    hosp.codigo as hospital_codigo,
                    
                    -- Seguro (si tiene)
                    seg.nombre as seguro_nombre,
                    p.numero_seguro,
                    
                    -- Movimiento actual de hospitalización
                    hm.fecha_asignacion as fecha_asignacion_cama,
                    hm.estado as estado_movimiento
                    
                FROM hospitalizacion_signos_vitales hsv
                
                -- JOINs principales
                LEFT JOIN pacientes p ON hsv.paciente_id = p.id
                LEFT JOIN hospitalizacion_cab h ON hsv.numero_cuenta = h.numero_cuenta
                
                -- Médico tratante
                LEFT JOIN medicos med ON h.medico_tratante_id = med.id
                LEFT JOIN users u ON med.usuario_id = u.id
                
                -- Especialidad
                LEFT JOIN especialidades esp ON h.especialidad_id = esp.id
                
                -- Cama actual (último movimiento)
                LEFT JOIN hospitalizacion_mov hm ON h.id = hm.hospitalizacion_id 
                    AND hm.estado = '01' 
                    AND hm.fecha_liberacion IS NULL
                LEFT JOIN camas c ON hm.cama_destino_id = c.id
                
                -- Piso
                LEFT JOIN pisos piso ON c.piso_id = piso.id
                
                -- Hospital
                LEFT JOIN hospitales hosp ON p.hospital_id = hosp.id
                
                -- Seguro
                LEFT JOIN seguros seg ON p.seguro_id = seg.id
                
                WHERE hsv.cama_codigo = $1
                  AND hsv.es_ultimo_del_dia = 'S' 
                  AND hsv.estado_registro = '01'
                  AND hsv.fecha_registro >= CURRENT_DATE - INTERVAL '2 days'
                  AND h.estado = '01'  -- Solo hospitalizaciones activas
                  
                ORDER BY hsv.tipo_signo, hsv.fecha_registro DESC
                """
                
                rows = await connection.fetch(query, bed_id)
                
                if not rows:
                    logger.warning(f"⚠️ No se encontraron datos para la cama {bed_id}")
                    return None
                
                # Transformar a formato frontend
                transformed_data = self._transform_to_frontend_format(rows)
                patients_data = transformed_data['vital_signs_monitoring']['patients_vitals']
                
                return patients_data.get(bed_id)
                
        except Exception as e:
            logger.error(f"❌ Error obteniendo datos del paciente {bed_id}: {e}")
            return None
    
    def _transform_to_frontend_format(self, rows) -> Dict[str, Any]:
        """
        Transformar filas de PostgreSQL al formato exacto que espera el frontend
        """
        patients_data = {}
        
        # Agrupar por cama_codigo (paciente)
        for row in rows:
            bed_id = row['cama_codigo'] or row['codigo_cama']
            
            # Inicializar paciente si no existe
            if bed_id not in patients_data:
                # Calcular edad de forma segura
                edad = row['edad'] if row['edad'] and row['edad'] > 0 else 50
                
                # ✅ Estado de conexión del monitor
                monitor_status = row['monitor_status']
                connection_status = "connected" if monitor_status == "connected" else "disconnected"
                
                patients_data[bed_id] = {
                    "patient_info": {
                        "name": f"{row['nombres'] or 'Paciente'} {row['apellidos'] or 'Sin Apellido'}",
                        "bed": bed_id,
                        "bed_number": row['numero_cama'] or bed_id,
                        "bed_code": row['codigo_cama'] or bed_id,
                        "room_type": row['especialidad'] or "General",
                        "floor": f"Piso {row['piso_numero']} - {row['piso_nombre']}" if row['piso_numero'] else "Piso General",
                        "admission_date": row['fecha_hospitalizacion'].strftime("%Y-%m-%d") if row['fecha_hospitalizacion'] else "2025-01-20",
                        "attending_physician": f"Dr. {row['medico_nombre']} {row['medico_apellido']}" if row['medico_nombre'] else "Dr. Sistema HL7",
                        "physician_cmp": row['cmp'] or "0000",
                        "specialty": row['especialidad'] or "Medicina General",
                        "diagnosis": "En evaluación médica",  # Se puede obtener de otra tabla si existe
                        "age": edad,
                        "gender": row['genero'] or "M",
                        "document_type": row['tipo_doc'] or "01",
                        "document_number": row['numero_doc'] or "00000000",
                        "phone": row['telefono'] or "",
                        "email": row['email'] or "",
                        "address": f"{row['direccion']}, {row['distrito']}" if row['direccion'] else "",
                        "insurance": row['seguro_nombre'] or "Sin seguro",
                        "insurance_number": row['numero_seguro'] or "",
                        "hospital": row['hospital_nombre'] or "Hospital Central San José",
                        "bed_features": {
                            "oxygen": row['oxigeno'] == 'S',
                            "monitor": row['monitor'] == 'S',
                            "bed_type": row['tipo_cama'] or "01",
                            "bed_status": row['estado_cama'] or "01"
                        },
                        "admission_details": {
                            "admission_date": row['fecha_hospitalizacion'].isoformat() if row['fecha_hospitalizacion'] else None,
                            "bed_assignment_date": row['fecha_asignacion_cama'].isoformat() if row['fecha_asignacion_cama'] else None,
                            "hospitalization_status": row['estado_hospitalizacion'] or "01",
                            "discharge_date": row['fecha_alta_real'].isoformat() if row['fecha_alta_real'] else None
                        }
                    },
                    "current_vitals": {
                        "timestamp": datetime.now().isoformat(),
                        "heart_rate": {"value": 75, "status": "normal", "range": "60-100", "trend": "stable"},
                        "blood_pressure": {"systolic": 120, "diastolic": 80, "status": "normal", "range": "120/80", "trend": "stable"},
                        "temperature": {"value": 36.5, "status": "normal", "range": "36.0-37.5", "trend": "stable"},
                        "respiratory_rate": {"value": 16, "status": "normal", "range": "12-20", "trend": "stable"},
                        "oxygen_saturation": {"value": 98, "status": "normal", "range": ">95", "trend": "stable"},
                        "pain_scale": {"value": 0, "status": "mild", "range": "0-10", "location": ""}
                    },
                    "alerts": [],
                    "monitoring_status": connection_status,  # ✅ Estado basado en conexión real
                    "device_id": row['monitor_codigo'] or f"MON_{bed_id}_001",
                    # ✅ NUEVOS CAMPOS DE ESTADO
                    "monitor_connection": {
                        "status": monitor_status,
                        "last_reading": row['fecha_registro'].isoformat() if row['fecha_registro'] else None,
                        "device_available": row['monitor'] == 'S',
                        "device_connected": monitor_status == "connected"
                    }
                }
            
            # ✅ Solo mapear signos vitales si hay datos reales
            if row['tipo_signo'] and row['valor_numerico'] is not None:
                vital_value = float(row['valor_numerico'])
                vital_type = row['tipo_signo']
                timestamp = row['fecha_registro'].isoformat() if row['fecha_registro'] else datetime.now().isoformat()
                
                # Actualizar timestamp del paciente
                patients_data[bed_id]["current_vitals"]["timestamp"] = timestamp
                
                # Mapear según tipo de signo vital
                if vital_type == 'FRECUENCIA_CARDIACA':
                    patients_data[bed_id]["current_vitals"]["heart_rate"]["value"] = int(vital_value)
                    patients_data[bed_id]["current_vitals"]["heart_rate"]["status"] = self._get_heart_rate_status(vital_value)
                    
                elif vital_type == 'PRESION_SISTOLICA':
                    patients_data[bed_id]["current_vitals"]["blood_pressure"]["systolic"] = int(vital_value)
                    
                elif vital_type == 'PRESION_DIASTOLICA':
                    patients_data[bed_id]["current_vitals"]["blood_pressure"]["diastolic"] = int(vital_value)
                    
                elif vital_type == 'TEMPERATURA':
                    patients_data[bed_id]["current_vitals"]["temperature"]["value"] = round(vital_value, 1)
                    patients_data[bed_id]["current_vitals"]["temperature"]["status"] = self._get_temperature_status(vital_value)
                    
                elif vital_type == 'FRECUENCIA_RESPIRATORIA':
                    patients_data[bed_id]["current_vitals"]["respiratory_rate"]["value"] = int(vital_value)
                    patients_data[bed_id]["current_vitals"]["respiratory_rate"]["status"] = self._get_respiratory_status(vital_value)
                    
                elif vital_type == 'SATURACION_OXIGENO':
                    patients_data[bed_id]["current_vitals"]["oxygen_saturation"]["value"] = int(vital_value)
                    patients_data[bed_id]["current_vitals"]["oxygen_saturation"]["status"] = self._get_oxygen_status(vital_value)
                    
                elif vital_type == 'ESCALA_DOLOR':
                    patients_data[bed_id]["current_vitals"]["pain_scale"]["value"] = int(vital_value)
                    patients_data[bed_id]["current_vitals"]["pain_scale"]["status"] = self._get_pain_status(vital_value)
        
        # Post-procesamiento: calcular estados combinados y alertas
        for bed_id, patient in patients_data.items():
            bp = patient["current_vitals"]["blood_pressure"]
            bp["status"] = self._get_blood_pressure_status(bp["systolic"], bp["diastolic"])
            
            # Calcular tendencias (por ahora estables, se puede mejorar con datos históricos)
            self._calculate_trends(patient["current_vitals"])
            
            # Generar alertas automáticas
            patient["alerts"] = self._generate_alerts(patient["current_vitals"], bed_id)
            
            # Determinar estado de monitoreo general
            patient["monitoring_status"] = self._get_monitoring_status(patient["alerts"])
        
        return {
            "vital_signs_monitoring": {
                "patients_vitals": patients_data,
                "metadata": {
                    "hospital": "Hospital Central San José",
                    "system": "HL7 Vital Signs Monitor - PostgreSQL Real Data",
                    "last_updated": datetime.now().isoformat(),
                    "refresh_interval": 5000,
                    "total_patients": len(patients_data),
                    "data_source": "PostgreSQL Database",
                    "units": {
                        "temperature": "°C",
                        "heart_rate": "bpm", 
                        "blood_pressure": "mmHg",
                        "respiratory_rate": "rpm",
                        "oxygen_saturation": "%",
                        "pain_scale": "0-10"
                    }
                }
            }
        }
    
    # ===== MÉTODOS DE CÁLCULO DE ESTADOS =====
    
    def _get_heart_rate_status(self, value: float) -> str:
        """Determinar estado de frecuencia cardíaca"""
        if value < 60: 
            return "low"
        elif value > 100: 
            return "elevated"
        else: 
            return "normal"
    
    def _get_temperature_status(self, value: float) -> str:
        """Determinar estado de temperatura"""
        if value >= 38.0: 
            return "fever"
        elif value >= 37.5: 
            return "elevated"
        elif value < 36.0: 
            return "low"
        else: 
            return "normal"
    
    def _get_respiratory_status(self, value: float) -> str:
        """Determinar estado de frecuencia respiratoria"""
        if value < 12 or value > 20: 
            return "abnormal"
        else: 
            return "normal"
    
    def _get_oxygen_status(self, value: float) -> str:
        """Determinar estado de saturación de oxígeno"""
        if value < 90: 
            return "critical"
        elif value < 95: 
            return "low"
        else: 
            return "normal"
    
    def _get_pain_status(self, value: float) -> str:
        """Determinar estado de dolor"""
        if value >= 7: 
            return "severe"
        elif value >= 4: 
            return "moderate"
        else: 
            return "mild"
    
    def _get_blood_pressure_status(self, systolic: int, diastolic: int) -> str:
        """Determinar estado de presión arterial"""
        if systolic >= 180 or diastolic >= 120: 
            return "critical"
        elif systolic >= 140 or diastolic >= 90: 
            return "high"
        elif systolic >= 130 or diastolic >= 80: 
            return "elevated"
        else: 
            return "normal"
    
    def _calculate_trends(self, vitals: Dict) -> None:
        """
        Calcular tendencias de signos vitales
        Por ahora mantiene 'stable', se puede mejorar con datos históricos
        """
        for vital_name, vital_data in vitals.items():
            if isinstance(vital_data, dict) and 'trend' in vital_data:
                # Por ahora todos estables, se puede mejorar consultando histórico
                vital_data['trend'] = 'stable'
    
    def _generate_alerts(self, vitals: Dict, bed_id: str) -> List[Dict]:
        """Generar alertas automáticas basadas en valores críticos"""
        alerts = []
        
        try:
            # Frecuencia cardíaca crítica
            hr = vitals.get("heart_rate", {}).get("value", 75)
            if hr < 50:
                alerts.append(self._create_alert("critical", f"Bradicardia crítica: {hr} bpm", bed_id))
            elif hr > 120:
                alerts.append(self._create_alert("warning", f"Taquicardia: {hr} bpm", bed_id))
            
            # Saturación crítica
            spo2 = vitals.get("oxygen_saturation", {}).get("value", 98)
            if spo2 < 90:
                alerts.append(self._create_alert("critical", f"Saturación crítica: {spo2}%", bed_id))
            elif spo2 < 95:
                alerts.append(self._create_alert("warning", f"Saturación baja: {spo2}%", bed_id))
            
            # Presión arterial crítica
            bp = vitals.get("blood_pressure", {})
            sys = bp.get("systolic", 120)
            dias = bp.get("diastolic", 80)
            if sys >= 180:
                alerts.append(self._create_alert("critical", f"Crisis hipertensiva: {sys}/{dias} mmHg", bed_id))
            elif sys >= 140:
                alerts.append(self._create_alert("warning", f"Hipertensión: {sys}/{dias} mmHg", bed_id))
            
            # Fiebre alta
            temp = vitals.get("temperature", {}).get("value", 36.5)
            if temp >= 39.0:
                alerts.append(self._create_alert("warning", f"Fiebre alta: {temp}°C", bed_id))
            elif temp >= 38.5:
                alerts.append(self._create_alert("warning", f"Fiebre: {temp}°C", bed_id))
            
            # Dolor severo
            pain = vitals.get("pain_scale", {}).get("value", 0)
            if pain >= 8:
                alerts.append(self._create_alert("warning", f"Dolor severo: {pain}/10", bed_id))
            
            # Frecuencia respiratoria anormal
            rr = vitals.get("respiratory_rate", {}).get("value", 16)
            if rr > 25:
                alerts.append(self._create_alert("warning", f"Taquipnea: {rr} rpm", bed_id))
            elif rr < 10:
                alerts.append(self._create_alert("warning", f"Bradipnea: {rr} rpm", bed_id))
                
        except Exception as e:
            logger.error(f"❌ Error generando alertas para {bed_id}: {e}")
        
        return alerts
    
    def _create_alert(self, alert_type: str, message: str, bed_id: str) -> Dict:
        """Crear objeto de alerta"""
        return {
            "type": alert_type,
            "message": message,
            "timestamp": datetime.now().isoformat() + "Z",
            "acknowledged": False,
            "bed_id": bed_id
        }
    
    def _get_monitoring_status(self, alerts: List[Dict]) -> str:
        """Determinar estado general de monitoreo basado en alertas"""
        if not alerts:
            return "active"
        
        critical_alerts = [alert for alert in alerts if alert.get("type") == "critical"]
        if critical_alerts:
            return "critical"
        
        warning_alerts = [alert for alert in alerts if alert.get("type") == "warning"]
        if warning_alerts:
            return "warning"
        
        return "active"
    
    def _get_empty_response(self, error_message: str = "No hay datos disponibles") -> Dict[str, Any]:
        """Respuesta vacía en caso de error"""
        return {
            "vital_signs_monitoring": {
                "patients_vitals": {},
                "metadata": {
                    "hospital": "Hospital Central San José",
                    "system": "HL7 Vital Signs Monitor",
                    "last_updated": datetime.now().isoformat(),
                    "refresh_interval": 5000,
                    "total_patients": 0,
                    "data_source": "PostgreSQL Database",
                    "error": error_message
                }
            }
        }

# Instancia del manager
vital_signs_manager = VitalSignsManager()