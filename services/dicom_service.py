import os
import glob
import pydicom
import numpy as np
from PIL import Image
import io
import logging
import traceback
from datetime import datetime
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

class DicomService:
    """
    Servicio para manejo de archivos DICOM con logging completo para debug
    """
    
    def __init__(self):
        self.DICOM_FOLDER = r"C:\Users\acairamp\Documents\proyecto\Curso\pythonn\front\hospital-app\data\dicom"
        logger.info(f"🩻 DicomService inicializado con carpeta: {self.DICOM_FOLDER}")
        
        # Configurar pydicom para ser más permisivo
        pydicom.config.convert_wrong_length_to_UN = True
        pydicom.config.assume_implicit_vr_transfer = True
        
        # Verificar soporte para compresión
        self._check_compression_support()
        
    def _check_compression_support(self):
        """Verificar soporte para diferentes tipos de compresión"""
        try:
            try:
                import pylibjpeg
                logger.info("✅ pylibjpeg disponible para JPEG Lossless")
                self.has_pylibjpeg = True
            except ImportError:
                logger.warning("⚠️ pylibjpeg no disponible")
                self.has_pylibjpeg = False
            
            try:
                import gdcm
                logger.info("✅ GDCM disponible para compresión")
                self.has_gdcm = True
            except ImportError:
                logger.warning("⚠️ GDCM no disponible")
                self.has_gdcm = False
                
        except Exception as e:
            logger.error(f"Error verificando soporte de compresión: {e}")
            self.has_pylibjpeg = False
            self.has_gdcm = False
    
    def get_dicom_studies(self) -> List[Dict[str, Any]]:
        """
        Obtiene la lista de estudios DICOM disponibles
        """
        try:
            studies = []
            
            # Buscar archivos DICOM recursivamente
            dicom_files = []
            for root, dirs, files in os.walk(self.DICOM_FOLDER):
                for file in files:
                    if file.lower().endswith('.dcm'):
                        dicom_files.append(os.path.join(root, file))
            
            logger.info(f"🩻 Encontrados {len(dicom_files)} archivos DICOM")
            
            for file_path in dicom_files:
                try:
                    metadata = self.extract_dicom_metadata(file_path)
                    metadata['file_path'] = file_path
                    studies.append(metadata)
                except Exception as e:
                    logger.error(f"Error procesando {file_path}: {str(e)}")
                    continue
            
            return studies
            
        except Exception as e:
            logger.error(f"Error obteniendo estudios: {str(e)}")
            raise
    
    def get_dicom_image(self, file_path: str) -> bytes:
        """
        Convierte archivo DICOM a imagen PNG con logging completo
        """
        try:
            # LOGGING DETALLADO DEL REQUEST
            logger.info(f"🔍 === INICIO PROCESAMIENTO IMAGEN ===")
            logger.info(f"🔍 file_path recibido: '{file_path}'")
            logger.info(f"🔍 tipo: {type(file_path)}")
            logger.info(f"🔍 longitud: {len(file_path) if file_path else 0}")
            logger.info(f"🔍 DICOM_FOLDER: {self.DICOM_FOLDER}")
            
            if not file_path:
                raise ValueError("file_path está vacío")
            
            # Encontrar el archivo
            full_path = self._find_dicom_file_debug(file_path)
            if not full_path:
                raise FileNotFoundError(f"Archivo DICOM no encontrado: {file_path}")
            
            logger.info(f"🎯 Archivo encontrado: {full_path}")
            
            # Verificar que existe
            if not os.path.exists(full_path):
                raise FileNotFoundError(f"El archivo no existe en el sistema: {full_path}")
            
            # Procesar imagen
            result_bytes = self.dicom_to_image_debug(full_path)
            
            logger.info(f"✅ Imagen procesada exitosamente: {len(result_bytes)} bytes")
            logger.info(f"🔍 === FIN PROCESAMIENTO IMAGEN ===")
            
            return result_bytes
            
        except Exception as e:
            error_msg = f"Error procesando imagen DICOM: {str(e)}"
            error_trace = traceback.format_exc()
            logger.error(f"💥 {error_msg}")
            logger.error(f"💥 Traceback completo:\n{error_trace}")
            
            # En lugar de re-raise, devolver imagen de error
            logger.info("🎨 Creando imagen de error como fallback")
            return self._create_error_image_bytes(error_msg)
    
    def _find_dicom_file_debug(self, file_path: str) -> str:
        """
        Encuentra archivo DICOM con logging detallado
        """
        logger.info(f"🔍 === INICIO BÚSQUEDA DE ARCHIVO ===")
        logger.info(f"🔍 Buscando: {file_path}")
        
        # Normalizar separadores
        normalized_path = file_path.replace('\\', '/')
        logger.info(f"🔧 Ruta normalizada: {normalized_path}")
        
        # Estrategia 1: Ruta absoluta
        if os.path.isabs(file_path):
            logger.info(f"🔍 Estrategia 1: Ruta absoluta")
            if os.path.exists(file_path):
                logger.info(f"✅ Encontrado (absoluta): {file_path}")
                return file_path
        
        # Estrategia 2: Combinaciones directas
        logger.info(f"🔍 Estrategia 2: Combinaciones directas")
        possible_paths = [
            os.path.join(self.DICOM_FOLDER, normalized_path),
            os.path.join(self.DICOM_FOLDER, file_path),
            file_path
        ]
        
        for i, path in enumerate(possible_paths, 1):
            logger.info(f"🔍   Probando {i}: {path}")
            if os.path.exists(path) and path.lower().endswith('.dcm'):
                logger.info(f"✅ Encontrado (combinación {i}): {path}")
                return path
        
        # Estrategia 3: Búsqueda recursiva
        logger.info(f"🔍 Estrategia 3: Búsqueda recursiva")
        target_filename = os.path.basename(normalized_path)
        logger.info(f"🔍 Buscando archivo: {target_filename}")
        
        matches_found = []
        for root, dirs, files in os.walk(self.DICOM_FOLDER):
            for file in files:
                if file.lower().endswith('.dcm'):
                    full_file_path = os.path.join(root, file)
                    
                    # Coincidencia exacta por nombre
                    if file == target_filename:
                        matches_found.append(('exact_name', full_file_path))
                        logger.info(f"🎯 Coincidencia exacta: {full_file_path}")
                    
                    # Coincidencia por contenido de ruta
                    elif normalized_path in full_file_path.replace('\\', '/'):
                        matches_found.append(('path_contains', full_file_path))
                        logger.info(f"🎯 Coincidencia parcial: {full_file_path}")
        
        # Preferir coincidencias exactas
        for match_type, match_path in matches_found:
            if match_type == 'exact_name':
                logger.info(f"✅ Usando coincidencia exacta: {match_path}")
                return match_path
        
        # Si no hay exactas, usar la primera parcial
        for match_type, match_path in matches_found:
            if match_type == 'path_contains':
                logger.info(f"✅ Usando coincidencia parcial: {match_path}")
                return match_path
        
        # Estrategia 4: Listado de archivos disponibles
        logger.info(f"🔍 Estrategia 4: Listando archivos disponibles")
        available_files = []
        for root, dirs, files in os.walk(self.DICOM_FOLDER):
            for file in files:
                if file.lower().endswith('.dcm'):
                    rel_path = os.path.relpath(os.path.join(root, file), self.DICOM_FOLDER)
                    available_files.append(rel_path)
        
        logger.info(f"📋 Primeros 10 archivos disponibles:")
        for i, avail_file in enumerate(available_files[:10], 1):
            logger.info(f"   {i}. {avail_file}")
        
        logger.error(f"❌ Archivo no encontrado: {file_path}")
        logger.info(f"🔍 === FIN BÚSQUEDA DE ARCHIVO ===")
        return None
    
    def dicom_to_image_debug(self, file_path: str) -> bytes:
        """
        Convierte DICOM a imagen con logging detallado
        """
        try:
            logger.info(f"🔄 === INICIO CONVERSIÓN ===")
            logger.info(f"🔄 Procesando: {os.path.basename(file_path)}")
            
            # Leer DICOM
            logger.info(f"📖 Leyendo archivo DICOM...")
            ds = self._read_dicom_safely_debug(file_path)
            logger.info(f"✅ Archivo DICOM leído correctamente")
            
            # Obtener píxeles
            logger.info(f"🖼️ Extrayendo píxeles...")
            pixel_array = self._get_pixel_array_debug(ds, file_path)
            
            if pixel_array is None:
                logger.warning("⚠️ No se pudieron extraer píxeles, usando fallback")
                pixel_array = self._create_test_pattern_debug(512, 512)
            
            logger.info(f"✅ Píxeles obtenidos: {pixel_array.shape if pixel_array is not None else 'None'}")
            
            # Normalizar
            logger.info(f"🔧 Normalizando píxeles...")
            normalized_array = self._normalize_pixel_array_debug(pixel_array, ds)
            logger.info(f"✅ Píxeles normalizados: {normalized_array.shape}")
            
            # Crear imagen PIL
            logger.info(f"🎨 Creando imagen PIL...")
            image = self._create_pil_image_debug(normalized_array)
            logger.info(f"✅ Imagen PIL creada: {image.size}")
            
            # Convertir a PNG
            logger.info(f"💾 Convirtiendo a PNG...")
            img_buffer = io.BytesIO()
            image.save(img_buffer, format='PNG', optimize=True)
            img_buffer.seek(0)
            result_bytes = img_buffer.getvalue()
            
            logger.info(f"✅ PNG creado: {len(result_bytes)} bytes")
            logger.info(f"🔄 === FIN CONVERSIÓN ===")
            
            return result_bytes
            
        except Exception as e:
            error_msg = f"Error en conversión: {str(e)}"
            error_trace = traceback.format_exc()
            logger.error(f"💥 {error_msg}")
            logger.error(f"💥 Traceback:\n{error_trace}")
            raise
    
    def _read_dicom_safely_debug(self, file_path: str):
        """Lee DICOM con logging"""
        try:
            logger.info(f"📖 Intento 1: Lectura normal")
            ds = pydicom.dcmread(file_path)
            logger.info(f"✅ Lectura normal exitosa")
            return ds
        except Exception as e1:
            logger.warning(f"⚠️ Intento 1 falló: {e1}")
            try:
                logger.info(f"📖 Intento 2: Lectura con force=True")
                ds = pydicom.dcmread(file_path, force=True)
                logger.info(f"✅ Lectura con force exitosa")
                return ds
            except Exception as e2:
                logger.error(f"❌ Intento 2 falló: {e2}")
                raise e2
    
    def _get_pixel_array_debug(self, ds, file_path: str):
        """Obtiene píxeles con logging"""
        try:
            # Verificar PixelData
            if not hasattr(ds, 'PixelData'):
                logger.warning("⚠️ No hay PixelData")
                return None
            
            logger.info(f"📊 PixelData presente: {len(ds.PixelData)} bytes")
            
            # Transfer Syntax
            transfer_syntax = getattr(ds, 'file_meta', {}).get('TransferSyntaxUID', 'Unknown')
            logger.info(f"📋 Transfer Syntax: {transfer_syntax}")
            
            # Intentar acceso directo
            try:
                logger.info(f"🔄 Intento 1: Acceso directo")
                pixel_array = ds.pixel_array
                logger.info(f"✅ Acceso directo exitoso: {pixel_array.shape}")
                return pixel_array
            except Exception as e1:
                logger.warning(f"⚠️ Acceso directo falló: {e1}")
            
            # Intentar descompresión
            if hasattr(ds, 'decompress'):
                try:
                    logger.info(f"🔄 Intento 2: Descompresión")
                    ds.decompress()
                    pixel_array = ds.pixel_array
                    logger.info(f"✅ Descompresión exitosa: {pixel_array.shape}")
                    return pixel_array
                except Exception as e2:
                    logger.warning(f"⚠️ Descompresión falló: {e2}")
            
            logger.error("❌ Todas las estrategias fallaron")
            return None
            
        except Exception as e:
            logger.error(f"💥 Error general obteniendo píxeles: {e}")
            return None
    
    def _create_test_pattern_debug(self, rows, columns):
        """Crea patrón de prueba con logging"""
        logger.info(f"🎨 Creando patrón de prueba: {rows}x{columns}")
        
        pattern = np.zeros((rows, columns), dtype=np.uint8)
        square_size = max(rows // 16, columns // 16, 8)
        
        for i in range(0, rows, square_size):
            for j in range(0, columns, square_size):
                if (i // square_size + j // square_size) % 2 == 0:
                    end_i = min(i + square_size, rows)
                    end_j = min(j + square_size, columns)
                    pattern[i:end_i, j:end_j] = 128
        
        # X en el centro
        center_row, center_col = rows // 2, columns // 2
        size = min(rows, columns) // 8
        
        for offset in range(-size, size + 1):
            r1, c1 = center_row + offset, center_col + offset
            if 0 <= r1 < rows and 0 <= c1 < columns:
                pattern[r1, c1] = 255
            
            r2, c2 = center_row + offset, center_col - offset
            if 0 <= r2 < rows and 0 <= c2 < columns:
                pattern[r2, c2] = 255
        
        logger.info(f"✅ Patrón de prueba creado")
        return pattern
    
    def _normalize_pixel_array_debug(self, pixel_array, ds):
        """Normaliza con logging"""
        try:
            logger.info(f"🔧 Tipo original: {pixel_array.dtype}")
            
            if pixel_array.dtype == np.uint8:
                logger.info(f"✅ Ya está en uint8")
                return pixel_array
            
            # Window/Level
            if hasattr(ds, 'WindowCenter') and hasattr(ds, 'WindowWidth'):
                try:
                    wc = float(ds.WindowCenter[0] if isinstance(ds.WindowCenter, list) else ds.WindowCenter)
                    ww = float(ds.WindowWidth[0] if isinstance(ds.WindowWidth, list) else ds.WindowWidth)
                    logger.info(f"🪟 Window/Level: {wc}/{ww}")
                    
                    img_min = wc - ww // 2
                    img_max = wc + ww // 2
                    
                    pixel_array = np.clip(pixel_array, img_min, img_max)
                    pixel_array = ((pixel_array - img_min) / (img_max - img_min) * 255).astype(np.uint8)
                    
                    logger.info(f"✅ Normalización con Window/Level")
                    return pixel_array
                except Exception as we:
                    logger.warning(f"⚠️ Error con Window/Level: {we}")
            
            # Normalización estándar
            logger.info(f"🔧 Normalización estándar")
            pixel_array = pixel_array.astype(np.float64)
            p_min, p_max = pixel_array.min(), pixel_array.max()
            logger.info(f"📊 Rango: {p_min} - {p_max}")
            
            if p_min < p_max:
                pixel_array = (pixel_array - p_min) / (p_max - p_min) * 255
            else:
                pixel_array = np.full_like(pixel_array, 128)
            
            result = pixel_array.astype(np.uint8)
            logger.info(f"✅ Normalización completada")
            return result
            
        except Exception as e:
            logger.error(f"💥 Error en normalización: {e}")
            return np.full((512, 512), 128, dtype=np.uint8)
    
    def _create_pil_image_debug(self, pixel_array):
        """Crea imagen PIL con logging"""
        try:
            logger.info(f"🎨 Forma del array: {pixel_array.shape}")
            
            if len(pixel_array.shape) == 2:
                logger.info(f"📷 Modo: Escala de grises")
                image = Image.fromarray(pixel_array, mode='L')
            elif len(pixel_array.shape) == 3:
                if pixel_array.shape[2] == 3:
                    logger.info(f"📷 Modo: RGB")
                    image = Image.fromarray(pixel_array, mode='RGB')
                else:
                    logger.info(f"📷 Modo: Primer canal como escala de grises")
                    image = Image.fromarray(pixel_array[:,:,0], mode='L')
            else:
                logger.warning(f"⚠️ Forma no reconocida, usando fallback")
                fallback = np.zeros((512, 512), dtype=np.uint8)
                image = Image.fromarray(fallback, mode='L')
            
            logger.info(f"✅ Imagen PIL creada: {image.size}")
            return image
            
        except Exception as e:
            logger.error(f"💥 Error creando imagen PIL: {e}")
            fallback = np.zeros((512, 512), dtype=np.uint8)
            return Image.fromarray(fallback, mode='L')
    
    def _create_error_image_bytes(self, error_message: str) -> bytes:
        """Crea imagen de error"""
        try:
            logger.info(f"🎨 Creando imagen de error: {error_message[:50]}...")
            
            error_array = np.zeros((512, 512), dtype=np.uint8)
            
            # Patrón de fondo
            for i in range(0, 512, 32):
                for j in range(0, 512, 32):
                    if (i // 32 + j // 32) % 2 == 0:
                        error_array[i:i+32, j:j+32] = 64
            
            # X grande
            for i in range(512):
                error_array[i, i] = 255
                error_array[i, 511-i] = 255
            
            image = Image.fromarray(error_array, mode='L')
            img_buffer = io.BytesIO()
            image.save(img_buffer, format='PNG')
            img_buffer.seek(0)
            
            result = img_buffer.getvalue()
            logger.info(f"✅ Imagen de error creada: {len(result)} bytes")
            return result
            
        except Exception as e:
            logger.error(f"💥 Error creando imagen de error: {e}")
            # Fallback extremo
            simple = np.full((256, 256), 128, dtype=np.uint8)
            image = Image.fromarray(simple, mode='L')
            buffer = io.BytesIO()
            image.save(buffer, format='PNG')
            buffer.seek(0)
            return buffer.getvalue()
    
    def extract_dicom_metadata(self, file_path: str) -> Dict[str, Any]:
        """Extrae metadatos"""
        try:
            ds = pydicom.dcmread(file_path)
            
            def safe_get(attr, default="N/A"):
                try:
                    value = getattr(ds, attr, default)
                    return str(value) if value else default
                except:
                    return default
            
            study_date = safe_get('StudyDate', '')
            if study_date and len(study_date) == 8:
                try:
                    formatted_date = datetime.strptime(study_date, '%Y%m%d').strftime('%d/%m/%Y')
                except:
                    formatted_date = study_date
            else:
                formatted_date = study_date or 'N/A'
            
            return {
                'patient_name': safe_get('PatientName', 'Paciente sin nombre'),
                'patient_id': safe_get('PatientID'),
                'patient_birth_date': safe_get('PatientBirthDate'),
                'patient_sex': safe_get('PatientSex'),
                'study_date': formatted_date,
                'study_time': safe_get('StudyTime'),
                'study_description': safe_get('StudyDescription'),
                'series_description': safe_get('SeriesDescription'),
                'modality': safe_get('Modality'),
                'body_part': safe_get('BodyPartExamined'),
                'institution': safe_get('InstitutionName', 'Hospital San José'),
                'manufacturer': safe_get('Manufacturer'),
                'model': safe_get('ManufacturerModelName'),
                'rows': safe_get('Rows'),
                'columns': safe_get('Columns'),
                'pixel_spacing': safe_get('PixelSpacing'),
                'slice_thickness': safe_get('SliceThickness'),
                'window_center': safe_get('WindowCenter'),
                'window_width': safe_get('WindowWidth'),
                'file_name': os.path.basename(file_path)
            }
            
        except Exception as e:
            logger.error(f"Error extrayendo metadatos: {e}")
            raise
    
    def get_dicom_metadata(self, file_name: str) -> Dict[str, Any]:
        """Obtiene metadatos de archivo específico"""
        file_path = os.path.join(self.DICOM_FOLDER, file_name)
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Archivo no encontrado: {file_path}")
        return self.extract_dicom_metadata(file_path)
    
    def test_dicom_processing(self) -> Dict[str, Any]:
        """Test del procesamiento"""
        try:
            dicom_files = []
            for root, dirs, files in os.walk(self.DICOM_FOLDER):
                for file in files:
                    if file.lower().endswith('.dcm'):
                        dicom_files.append(os.path.join(root, file))
            
            if not dicom_files:
                return {
                    "status": "no_files",
                    "message": "No se encontraron archivos DICOM"
                }
            
            test_file = dicom_files[0]
            metadata = self.extract_dicom_metadata(test_file)
            
            try:
                image_bytes = self.dicom_to_image_debug(test_file)
                image_status = "success"
                image_size = len(image_bytes)
            except Exception as e:
                image_status = f"error: {str(e)}"
                image_size = 0
            
            return {
                "status": "success",
                "message": "Servicio DICOM con debug completo",
                "test_file": os.path.basename(test_file),
                "image_processing": {
                    "status": image_status,
                    "size_bytes": image_size
                },
                "total_files": len(dicom_files),
                "compression_support": {
                    "pylibjpeg": getattr(self, 'has_pylibjpeg', False),
                    "gdcm": getattr(self, 'has_gdcm', False)
                }
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }
    
    def health_check(self) -> Dict[str, Any]:
        """Health check"""
        try:
            folder_exists = os.path.exists(self.DICOM_FOLDER)
            
            dicom_files = []
            if folder_exists:
                for root, dirs, files in os.walk(self.DICOM_FOLDER):
                    for file in files:
                        if file.lower().endswith('.dcm'):
                            dicom_files.append(os.path.join(root, file))
            
            return {
                "status": "healthy" if folder_exists else "warning",
                "message": "Servicio DICOM con logging completo",
                "dicom_folder": self.DICOM_FOLDER,
                "folder_exists": folder_exists,
                "dicom_files_found": len(dicom_files),
                "compression_support": {
                    "pylibjpeg": getattr(self, 'has_pylibjpeg', False),
                    "gdcm": getattr(self, 'has_gdcm', False)
                },
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": str(e),
                "timestamp": datetime.now().isoformat()
            }