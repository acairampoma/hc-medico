"""
Servicio de Hospital - Lógica de negocio para manejo de datos hospitalarios
"""
import json
import os
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HospitalService:
    """Servicio para manejar toda la lógica del hospital"""
    
    def __init__(self, data_dir: str = "data/mock"):
        self.data_dir = data_dir
        self.hospital_file = f"{data_dir}/hospital/hospital_structure.json"
        self.patients_file = f"{data_dir}/patients/patients_database.json"
        self.patients_beds_file = f"{data_dir}/patients/paciente_cama.json"
        self.medications_file = f"{data_dir}/pharmacy/medications_vademecum.json"
        self.exams_file = f"{data_dir}/medical/exams_database.json"
        self.orders_file = f"{data_dir}/medical/medical_orders.json"
        
        # Cache en memoria
        self._hospital_cache = None
        self._patients_cache = None
        self._patients_beds_cache = None
        self._cache_timestamp = None

    def _load_json_file(self, file_path: str) -> Dict:
        """Cargar archivo JSON con manejo de errores"""
        try:
            if not os.path.exists(file_path):
                logger.warning(f"Archivo no encontrado: {file_path}")
                return {}
            
            with open(file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
                logger.info(f"✅ Archivo cargado: {file_path}")
                return data
                
        except json.JSONDecodeError as e:
            logger.error(f"❌ Error JSON en {file_path}: {e}")
            return {}
        except Exception as e:
            logger.error(f"❌ Error cargando {file_path}: {e}")
            return {}

    def _save_json_file(self, file_path: str, data: Dict) -> bool:
        """Guardar archivo JSON"""
        try:
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, 'w', encoding='utf-8') as file:
                json.dump(data, file, indent=2, ensure_ascii=False)
            logger.info(f"✅ Archivo guardado: {file_path}")
            return True
        except Exception as e:
            logger.error(f"❌ Error guardando {file_path}: {e}")
            return False

    def _is_cache_valid(self, max_age_seconds: int = 300) -> bool:
        """Verificar si el cache es válido (5 minutos por defecto)"""
        if self._cache_timestamp is None:
            return False
        
        elapsed = (datetime.now() - self._cache_timestamp).total_seconds()
        return elapsed < max_age_seconds

    # ===== MÉTODOS DE ESTRUCTURA HOSPITALARIA =====

    def get_patients_by_beds(self) -> Dict:
        """Obtener pacientes organizados por número de cama"""
        if self._patients_beds_cache and self._is_cache_valid():
            logger.info("🛏️ Usando cache de pacientes por cama")
            return self._patients_beds_cache
        
        # 🔍 AGREGAR MÁS DEBUG
        logger.info(f"🔍 Intentando cargar: {self.patients_beds_file}")
        logger.info(f"🔍 Archivo existe: {os.path.exists(self.patients_beds_file)}")
        
        patients_by_bed_data = self._load_json_file(self.patients_beds_file)
        
        # 🔍 MÁS DEBUG
        logger.info(f"🔍 Datos cargados: {type(patients_by_bed_data)}")
        logger.info(f"🔍 Tamaño de datos: {len(patients_by_bed_data) if patients_by_bed_data else 0}")
        
        if patients_by_bed_data:
            self._patients_beds_cache = patients_by_bed_data
            self._cache_timestamp = datetime.now()
            beds_count = len(patients_by_bed_data.get('patients_by_bed', {}))
            logger.info(f"🛏️ Pacientes por cama cargados: {beds_count} registros")
    
        return patients_by_bed_data
    
    def get_hospital_structure(self) -> Dict:
        """Obtener estructura completa del hospital"""
        if self._hospital_cache and self._is_cache_valid():
            logger.info("📋 Usando cache de estructura hospitalaria")
            return self._hospital_cache
        
        hospital_data = self._load_json_file(self.hospital_file)
        if hospital_data:
            self._hospital_cache = hospital_data
            self._cache_timestamp = datetime.now()
            logger.info(f"📋 Estructura cargada: {len(hospital_data.get('floors', []))} pisos")
        
        return hospital_data

    def get_floor_data(self, floor_number: int) -> Optional[Dict]:
        """Obtener datos específicos de un piso"""
        hospital_data = self.get_hospital_structure()
        floors = hospital_data.get('floors', [])
        
        floor_data = next((floor for floor in floors if floor['floor_number'] == floor_number), None)
        if floor_data:
            logger.info(f"🏥 Datos del piso {floor_number}: {floor_data['specialty']}")
        else:
            logger.warning(f"⚠️ Piso {floor_number} no encontrado")
        
        return floor_data

    def get_wing_data(self, floor_number: int, wing: str) -> Optional[Dict]:
        """Obtener datos específicos de un ala"""
        floor_data = self.get_floor_data(floor_number)
        if not floor_data:
            return None
        
        wing_data = floor_data.get('wings', {}).get(wing)
        if wing_data:
            beds_count = len(wing_data.get('beds', []))
            logger.info(f"🏥 Ala {wing} del piso {floor_number}: {beds_count} camas")
        
        return wing_data

    def get_bed_data(self, bed_number: str) -> Optional[Dict]:
        """Obtener datos específicos de una cama"""
        hospital_data = self.get_hospital_structure()
        
        for floor in hospital_data.get('floors', []):
            for wing_name, wing_data in floor.get('wings', {}).items():
                for bed in wing_data.get('beds', []):
                    if bed.get('bed_number') == bed_number:
                        logger.info(f"🛏️ Cama encontrada: {bed_number}")
                        return bed
        
        logger.warning(f"⚠️ Cama {bed_number} no encontrada")
        return None

    # ===== MÉTODOS DE PACIENTES =====
    
    def get_patients_database(self) -> Dict:
        """Obtener base de datos completa de pacientes"""
        if self._patients_cache and self._is_cache_valid():
            logger.info("👥 Usando cache de pacientes")
            return self._patients_cache
        
        patients_data = self._load_json_file(self.patients_file)
        if patients_data:
            self._patients_cache = patients_data
            logger.info(f"👥 Base de datos cargada: {len(patients_data)} pacientes")
        
        return patients_data

    def get_patient_data(self, patient_id: str) -> Optional[Dict]:
        """Obtener datos específicos de un paciente"""
        patients_data = self.get_patients_database()
        
        patient_data = patients_data.get(patient_id)
        if patient_data:
            logger.info(f"👤 Paciente encontrado: {patient_id}")
        else:
            logger.warning(f"⚠️ Paciente {patient_id} no encontrado")
        
        return patient_data

    def get_patient_by_bed(self, bed_number: str) -> Optional[Dict]:
        """Obtener paciente por número de cama"""
        bed_data = self.get_bed_data(bed_number)
        if not bed_data or bed_data.get('status') != 'occupied':
            return None
        
        patient_id = bed_data.get('patient_id')
        if patient_id:
            return self.get_patient_data(patient_id)
        
        return None

    # ===== MÉTODOS DE ESTADÍSTICAS =====
    
    def get_hospital_stats(self) -> Dict:
        """Calcular estadísticas generales del hospital"""
        hospital_data = self.get_hospital_structure()
        patients_data = self.get_patients_database()
        
        total_floors = len(hospital_data.get('floors', []))
        total_beds = 0
        occupied_beds = 0
        available_beds = 0
        maintenance_beds = 0
        cleaning_beds = 0
        
        for floor in hospital_data.get('floors', []):
            for wing_name, wing_data in floor.get('wings', {}).items():
                beds = wing_data.get('beds', [])
                total_beds += len(beds)
                
                for bed in beds:
                    status = bed.get('status', 'unknown')
                    if status == 'occupied':
                        occupied_beds += 1
                    elif status == 'available':
                        available_beds += 1
                    elif status == 'maintenance':
                        maintenance_beds += 1
                    elif status == 'cleaning':
                        cleaning_beds += 1
        
        occupancy_rate = (occupied_beds / total_beds * 100) if total_beds > 0 else 0
        
        stats = {
            "hospital_info": hospital_data.get('hospital_info', {}),
            "total_floors": total_floors,
            "total_beds": total_beds,
            "occupied_beds": occupied_beds,
            "available_beds": available_beds,
            "maintenance_beds": maintenance_beds,
            "cleaning_beds": cleaning_beds,
            "occupancy_rate": round(occupancy_rate, 2),
            "total_patients": len(patients_data),
            "last_updated": datetime.now().isoformat()
        }
        
        logger.info(f"📊 Estadísticas calculadas: {occupancy_rate:.1f}% ocupación")
        return stats

    def get_floor_stats(self, floor_number: int) -> Dict:
        """Obtener estadísticas específicas de un piso"""
        floor_data = self.get_floor_data(floor_number)
        if not floor_data:
            return {}
        
        stats = {
            "floor_number": floor_number,
            "specialty": floor_data.get('specialty'),
            "department_head": floor_data.get('department_head'),
            "wings": {}
        }
        
        for wing_name, wing_data in floor_data.get('wings', {}).items():
            beds = wing_data.get('beds', [])
            occupied = len([b for b in beds if b.get('status') == 'occupied'])
            available = len([b for b in beds if b.get('status') == 'available'])
            
            stats["wings"][wing_name] = {
                "total_beds": len(beds),
                "occupied": occupied,
                "available": available,
                "occupancy_rate": round((occupied / len(beds) * 100), 2) if beds else 0
            }
        
        return stats

    # ===== MÉTODOS DE FARMACIA =====
    
    def get_medications(self) -> Dict:
        """Obtener vademécum de medicamentos"""
        medications_data = self._load_json_file(self.medications_file)
        if medications_data:
            logger.info(f"💊 Vademécum cargado: {len(medications_data)} medicamentos")
        return medications_data

    def search_medications(self, query: str) -> Dict:
        """Buscar medicamentos por nombre"""
        medications_data = self.get_medications()
        results = {}
        
        query_lower = query.lower()
        for med_id, med_data in medications_data.items():
            name = med_data.get('name', '').lower()
            generic_name = med_data.get('generic_name', '').lower()
            
            if query_lower in name or query_lower in generic_name:
                results[med_id] = med_data
        
        logger.info(f"🔍 Búsqueda '{query}': {len(results)} medicamentos encontrados")
        return results

    # ===== MÉTODOS DE EXÁMENES =====
    
    def get_exams_database(self) -> Dict:
        """Obtener base de datos de exámenes"""
        return self._load_json_file(self.exams_file)

    def get_patient_exams(self, patient_id: str) -> Dict:
        """Obtener exámenes de un paciente específico"""
        exams_data = self.get_exams_database()
        patient_exams = {}
        
        for exam_id, exam_data in exams_data.items():
            if exam_data.get('patient_id') == patient_id:
                patient_exams[exam_id] = exam_data
        
        logger.info(f"🔬 Exámenes del paciente {patient_id}: {len(patient_exams)} encontrados")
        return patient_exams

    # ===== MÉTODOS DE ÓRDENES MÉDICAS =====
    
    def get_medical_orders(self) -> Dict:
        """Obtener órdenes médicas"""
        return self._load_json_file(self.orders_file)

    def get_patient_orders(self, patient_id: str) -> Dict:
        """Obtener órdenes médicas de un paciente"""
        orders_data = self.get_medical_orders()
        patient_orders = {}
        
        for order_id, order_data in orders_data.items():
            if order_data.get('patient_id') == patient_id:
                patient_orders[order_id] = order_data
        
        logger.info(f"📋 Órdenes del paciente {patient_id}: {len(patient_orders)} encontradas")
        return patient_orders

    # ===== MÉTODOS PARA GUARDAR DATOS =====
    
    def save_medical_note(self, note_data: Dict) -> Dict:
        """Guardar nota médica"""
        notes_file = f"{self.data_dir}/medical/medical_notes.json"
        notes_data = self._load_json_file(notes_file)
        
        note_id = f"NOTE_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{note_data['patient_id']}"
        
        note_record = {
            "id": note_id,
            **note_data,
            "created_at": datetime.now().isoformat()
        }
        
        notes_data[note_id] = note_record
        
        if self._save_json_file(notes_file, notes_data):
            logger.info(f"📝 Nota médica guardada: {note_id}")
            return {"success": True, "note_id": note_id}
        else:
            logger.error(f"❌ Error guardando nota médica")
            return {"success": False, "error": "Error guardando nota"}

    def save_prescription(self, prescription_data: Dict) -> Dict:
        """Guardar receta médica"""
        prescriptions_file = f"{self.data_dir}/medical/prescriptions.json"
        prescriptions_data = self._load_json_file(prescriptions_file)
        
        prescription_id = f"RX_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{prescription_data['patient_id']}"
        
        prescription_record = {
            "id": prescription_id,
            **prescription_data,
            "created_at": datetime.now().isoformat(),
            "status": "active"
        }
        
        prescriptions_data[prescription_id] = prescription_record
        
        if self._save_json_file(prescriptions_file, prescriptions_data):
            logger.info(f"💊 Receta guardada: {prescription_id}")
            return {"success": True, "prescription_id": prescription_id}
        else:
            logger.error(f"❌ Error guardando receta")
            return {"success": False, "error": "Error guardando receta"}

    # ===== MÉTODOS DE UTILIDAD =====
    
    def invalidate_cache(self):
        """Invalidar cache en memoria"""
        self._hospital_cache = None
        self._patients_cache = None
        self._patients_beds_cache = None
        self._cache_timestamp = None
        logger.info("🗑️ Cache invalidado")

    def validate_data_files(self) -> Dict[str, bool]:
        """Validar que existan todos los archivos de datos"""
        files_status = {}
        required_files = [
            self.hospital_file,
            self.patients_file,
            self.medications_file,
            self.exams_file,
            self.orders_file
        ]
        
        for file_path in required_files:
            exists = os.path.exists(file_path)
            files_status[os.path.basename(file_path)] = exists
            
            if exists:
                logger.info(f"✅ Archivo encontrado: {file_path}")
            else:
                logger.warning(f"⚠️ Archivo faltante: {file_path}")
        
        return files_status