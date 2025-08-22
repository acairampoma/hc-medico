# ===== ARCHIVO: afiliacion_service.py - REFACTORIZADO ÉPICO =====
# Ubicación: /services/afiliacion_service.py

from services.database_config import db_manager
import asyncpg
from typing import Dict, Any, List, Optional
import json
from datetime import datetime
import logging


# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AfiliacionManager:
    
    # ===== MÉTODO PRINCIPAL REFACTORIZADO =====
    async def buscar_pacientes_afiliacion(
        self, 
        filtros: Dict[str, Any] = None,
        pagina: int = 1,
        limite: int = 20
    ) -> Dict[str, Any]:
        """
        🔍 Búsqueda épica de pacientes con filtros dinámicos
        Usa la vista vw_pacientes_afiliacion y función PostgreSQL
        """
        try:
            if not db_manager.pool:
                logger.error("❌ Pool de conexiones no inicializado")
                return self._get_error_response("Pool de conexiones no disponible")
            
            # 🎯 Procesar filtros de entrada
            filtros_procesados = self._procesar_filtros(filtros or {})
            
            # 📄 Calcular offset para paginación
            offset = (pagina - 1) * limite
            
            logger.info(f"🔍 Buscando pacientes con filtros: {filtros_procesados}")
            
            async with db_manager.pool.acquire() as connection:
                # 🚀 Búsqueda mediante función PostgreSQL
                query = "SELECT resultado FROM fn_buscar_pacientes_afiliacion($1::JSONB, $2, $3)"
                resultado_json = await connection.fetchval(
                    query,
                    json.dumps(filtros_procesados),
                    limite,
                    offset
                )

                # Asegurar que el resultado sea dict
                if isinstance(resultado_json, str):
                    resultado_json = json.loads(resultado_json)
                resultado = resultado_json or {}

                if resultado.get("success"):
                    pacientes_transformados = self._transformar_pacientes_para_frontend(
                        resultado.get("data", [])
                    )
                    return {
                        "success": True,
                        "data": pacientes_transformados,
                        "pagination": resultado.get("pagination", {}),
                        "filtros_aplicados": resultado.get("filtros_aplicados", {}),
                        "stats": {
                            "total_encontrados": resultado.get("pagination", {}).get("total_registros", 0),
                            "pagina_actual": pagina,
                            "registros_por_pagina": limite,
                            "tiempo_busqueda": resultado.get("timestamp")
                        }
                    }

                logger.error(f"❌ Error en búsqueda PostgreSQL: {resultado.get('message')}")
                return resultado
                
        except Exception as e:
            logger.error(f"❌ Error general en búsqueda de pacientes: {e}")
            return self._get_error_response(f"Error en búsqueda: {str(e)}")
    
    async def obtener_todos_pacientes(self, limite: int = 100) -> Dict[str, Any]:
        """
        📋 Obtener todos los pacientes sin filtros (para tabla inicial)
        """
        return await self.buscar_pacientes_afiliacion(
            filtros={},
            pagina=1,
            limite=limite
        )
    
    async def buscar_por_documento(self, numero_doc: str) -> Dict[str, Any]:
        """
        🆔 Búsqueda rápida por número de documento
        """
        return await self.buscar_pacientes_afiliacion(
            filtros={"numero_doc": numero_doc},
            limite=10
        )
    
    async def buscar_por_historia_clinica(self, historia_clinica: str) -> Dict[str, Any]:
        """
        🏥 Búsqueda rápida por historia clínica
        """
        # Extraer prefijo y número de HC
        hc_clean = historia_clinica.upper().replace("HC", "").replace("EXT", "").replace("QTA", "")
        
        if historia_clinica.upper().startswith("EXT"):
            tipo_paciente = "EXT"
        elif historia_clinica.upper().startswith("HC"):
            tipo_paciente = "HC"
        elif historia_clinica.upper().startswith("QTA"):
            tipo_paciente = "QTA"
        else:
            tipo_paciente = None
        
        filtros = {}
        if tipo_paciente:
            filtros["tipo_paciente"] = tipo_paciente
        
        return await self.buscar_pacientes_afiliacion(
            filtros=filtros,
            limite=10
        )
    
    async def obtener_estadisticas_afiliacion(self) -> Dict[str, Any]:
        """
        📊 Obtener estadísticas generales de afiliación
        """
        try:
            if not db_manager.pool:
                return self._get_error_response("Pool de conexiones no disponible")
            
            async with db_manager.pool.acquire() as connection:
                query = """
                SELECT 
                    COUNT(*) as total_pacientes,
                    COUNT(CASE WHEN hc_prefix = 'EXT' THEN 1 END) as externos,
                    COUNT(CASE WHEN hc_prefix = 'HC' THEN 1 END) as historia_clinica,
                    COUNT(CASE WHEN hc_prefix = 'QTA' THEN 1 END) as quota,
                    COUNT(CASE WHEN estado = 'A' THEN 1 END) as activos,
                    COUNT(CASE WHEN sexo = 'M' THEN 1 END) as masculinos,
                    COUNT(CASE WHEN sexo = 'F' THEN 1 END) as femeninos,
                    COUNT(CASE WHEN DATE_PART('year', CURRENT_DATE) - DATE_PART('year', fecha_nacimiento) < 18 THEN 1 END) as menores,
                    COUNT(CASE WHEN DATE_PART('year', CURRENT_DATE) - DATE_PART('year', fecha_nacimiento) >= 65 THEN 1 END) as adultos_mayores
                FROM vw_pacientes_afiliacion
                """
                
                row = await connection.fetchrow(query)
                
                if row:
                    stats = {
                        "success": True,
                        "data": {
                            "total_pacientes": row['total_pacientes'],
                            "por_tipo": {
                                "externos": row['externos'],
                                "historia_clinica": row['historia_clinica'],
                                "quota": row['quota']
                            },
                            "por_estado": {
                                "activos": row['activos'],
                                "inactivos": row['total_pacientes'] - row['activos']
                            },
                            "por_sexo": {
                                "masculinos": row['masculinos'],
                                "femeninos": row['femeninos']
                            },
                            "por_edad": {
                                "menores": row['menores'],
                                "adultos": row['total_pacientes'] - row['menores'] - row['adultos_mayores'],
                                "adultos_mayores": row['adultos_mayores']
                            }
                        },
                        "timestamp": datetime.now().isoformat()
                    }
                    
                    logger.info(f"📊 Estadísticas obtenidas: {row['total_pacientes']} pacientes")
                    return stats
                else:
                    return self._get_error_response("No se pudieron obtener estadísticas")
                
        except Exception as e:
            logger.error(f"❌ Error obteniendo estadísticas: {e}")
            return self._get_error_response(f"Error en estadísticas: {str(e)}")
    
    # ===== MÉTODOS AUXILIARES REFACTORIZADOS =====
    
    def _procesar_filtros(self, filtros_raw: Dict[str, Any]) -> Dict[str, Any]:
        """
        🎯 Procesar y limpiar filtros de entrada - CORREGIDO
        """
        filtros_procesados = {}
        
        # ===== MAPEO CORREGIDO PARA JAVASCRIPT =====
        filtro_mapping = {
            'nombre': 'nombre',                    # ✅ DIRECTO desde JS
            'tipo_doc': 'tipo_doc',               # ✅ DIRECTO desde JS  
            'numero_doc': 'numero_doc',           # ✅ DIRECTO desde JS
            'tipo_paciente': 'tipo_paciente',     # ✅ DIRECTO desde JS
            'hospital_id': 'hospital_id',
            'estado': 'estado'
        }
        
        for frontend_key, postgres_key in filtro_mapping.items():
            if frontend_key in filtros_raw and filtros_raw[frontend_key]:
                valor = str(filtros_raw[frontend_key]).strip()
                if valor and valor != "":
                    filtros_procesados[postgres_key] = valor
        
        # Filtros especiales
        if 'nombre' in filtros_procesados:
            # Normalizar búsqueda de nombres
            filtros_procesados['nombre'] = filtros_procesados['nombre'].lower()
        
        if 'numero_doc' in filtros_procesados:
            # Limpiar número de documento
            filtros_procesados['numero_doc'] = ''.join(filter(str.isdigit, filtros_procesados['numero_doc']))
        
        return filtros_procesados
    
    def _transformar_pacientes_para_frontend(self, pacientes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        🎨 Transformar datos de PostgreSQL para el frontend
        """
        pacientes_transformados = []
        
        for i, paciente in enumerate(pacientes, 1):
            paciente_transformado = {
                # Para la tabla HTML
                "numero": i,
                "paciente_id": paciente.get('paciente_id'),
                "historia_clinica": paciente.get('historia_clinica', 'N/A'),
                "documento": paciente.get('documento_completo', 'N/A'),
                "nombre_completo": paciente.get('nombres_completos', 'N/A'),
                "telefono": paciente.get('telefono', 'N/A'),
                "email": paciente.get('email', 'N/A'),
                "estado": paciente.get('estado_descripcion', 'N/A'),
                
                # Datos adicionales para cards móvil
                "tipo_paciente": paciente.get('tipo_paciente', 'N/A'),
                "edad": paciente.get('edad', 0),
                "sexo": paciente.get('sexo_descripcion', 'N/A'),
                "hospital": paciente.get('hospital_nombre', 'N/A'),
                "seguro": paciente.get('seguro_nombre', 'N/A'),
                "direccion": paciente.get('direccion', 'N/A'),
                "distrito": paciente.get('distrito', 'N/A'),
                "fecha_afiliacion": paciente.get('fecha_afiliacion'),
                
                # Para acciones
                "puede_editar": True,
                "puede_imprimir": True,
                "puede_upgrade": paciente.get('hc_prefix') == 'EXT'
            }
            
            pacientes_transformados.append(paciente_transformado)
        
        return pacientes_transformados
    
    def _get_error_response(self, error_message: str) -> Dict[str, Any]:
        """Respuesta de error estándar"""
        return {
            "success": False,
            "error": "ERROR_INTERNO",
            "message": error_message,
            "timestamp": datetime.now().isoformat(),
            "data": [],
            "pagination": {
                "total_registros": 0,
                "pagina_actual": 1,
                "total_paginas": 0
            }
        }

    async def obtener_paciente_para_edicion(self, paciente_id: int) -> Dict[str, Any]:
        """
        🔍 RECUPERAR PACIENTE COMPLETO PARA POBLAR FORMULARIO
        Implementa la Técnica Alan - Trazabilidad completa
        """
        try:
            if not db_manager.pool:
                return self._get_error_response("Pool de conexiones no disponible")
            
            logger.info(f"🔍 Recuperando paciente ID: {paciente_id}")
            
            async with db_manager.pool.acquire() as connection:
                query = """
                SELECT 
                    p.id as paciente_id,
                    p.tipo_doc, p.numero_doc, p.nombres, p.apellidos,
                    p.fecha_nacimiento, p.sexo, p.estado_civil, p.ocupacion,
                    p.telefono, p.email, p.direccion, p.distrito,
                    
                    -- Última admisión
                    pa.numero_admision, pa.fecha_admision, pa.tipo_admision, pa.estado as estado_admision
                    
                FROM pacientes p
                LEFT JOIN pacientes_admision pa ON p.id = pa.paciente_id 
                    AND pa.id = (SELECT MAX(id) FROM pacientes_admision WHERE paciente_id = p.id)
                WHERE p.id = $1 AND p.activo = 'S'
                """
                
                row = await connection.fetchrow(query, paciente_id)
                
                if row:
                    # 🎨 TRANSFORMAR PARA FRONTEND
                    paciente_data = {
                        "success": True,
                        "data": {
                            # PASO 1: DATOS PERSONALES
                            "paso1": {
                                "tipo_documento": row['tipo_doc'],
                                "numero_documento": row['numero_doc'],
                                "nombres": row['nombres'],
                                "apellidos": row['apellidos'],
                                "fecha_nacimiento": row['fecha_nacimiento'].isoformat() if row['fecha_nacimiento'] else None,
                                "sexo": row['sexo'],
                                "estado_civil": row['estado_civil'],
                                "ocupacion": row['ocupacion']
                            },
                            
                            # PASO 2: INFORMACIÓN MÉDICA
                            "paso2": {
                                "grupo_sanguineo": None,
                                "factor_rh": None,
                                "antecedentes": None,
                                "alergias": []
                            },
                            
                            # PASO 3: SEGUROS Y CONTACTOS
                            "paso3": {
                                "telefono": row['telefono'],
                                "email": row['email'],
                                "direccion": row['direccion'],
                                "distrito": row['distrito'],
                                "contacto_nombre": None,
                                "contacto_parentesco": None,
                                "contacto_telefono": None,
                                "seguros": []
                            },
                            
                            # PASO 4: DATOS ADICIONALES
                            "paso4": {
                                "paciente_id": row['paciente_id'],
                                "numero_admision": row['numero_admision'],
                                "fecha_admision": row['fecha_admision'].isoformat() if row['fecha_admision'] else None,
                                "tipo_admision": row['tipo_admision'],
                                "estado_admision": row['estado_admision']
                            }
                        },
                        "message": "Paciente recuperado exitosamente",
                        "timestamp": datetime.now().isoformat()
                    }
                    
                    logger.info(f"✅ Paciente recuperado: {row['nombres']} {row['apellidos']}")
                    return paciente_data
                else:
                    logger.warning(f"⚠️ Paciente no encontrado: ID {paciente_id}")
                    return self._get_error_response(f"Paciente con ID {paciente_id} no encontrado")
                    
        except Exception as e:
            logger.error(f"❌ Error recuperando paciente {paciente_id}: {e}")
            return self._get_error_response(f"Error recuperando paciente: {str(e)}")

    async def afiliar_paciente_completo(self, datos_paciente: Dict[str, Any]) -> Dict[str, Any]:
        """
        💾 AFILIAR PACIENTE USANDO FUNCIÓN POSTGRESQL REAL
        Llama a fn_afiliar_paciente_completo con la Técnica Alan
        ✅ CLAUDE DEV FIX: CORREGIDO ERROR CHARACTER VARYING(2)
        """
        try:
            if not db_manager.pool:
                return self._get_error_response("Pool de conexiones no disponible")
            
            logger.info(f"💾 Afiliando paciente: {datos_paciente.get('nombres')} {datos_paciente.get('apellidos')}")
            
            # 🔥 MAPEO CORREGIDO CON VALIDACIÓN DE LONGITUDES - CLAUDE DEV FIX
            datos_formateados = {
                # ✅ CONVERSIÓN DE CÓDIGOS PARA POSTGRESQL
                "tipo_doc": self._convertir_tipo_documento(datos_paciente.get('tipoDocumento', 'DNI')),
                "numero_doc": datos_paciente.get('numeroDocumento'),  # ✅ FIX CRÍTICO
                "nombres": datos_paciente.get('nombres'),
                "apellidos": datos_paciente.get('apellidos'),
                "fecha_nacimiento": datos_paciente.get('fechaNacimiento'),  # ✅ FIX CRÍTICO
                "sexo": self._convertir_sexo(datos_paciente.get('sexo', 'M')),
                "email": datos_paciente.get('email'),
                "telefono": datos_paciente.get('telefono'),
                "direccion": datos_paciente.get('direccion'),
                "distrito": self._convertir_distrito(datos_paciente.get('distrito', '')),
                "hospital_id": datos_paciente.get('hospital_id', 1),
                "usuario_creacion": datos_paciente.get('usuario_creacion', 1),
                
                # 📞 TIPO DE ADMISIÓN - CLAUDE DEV FIX CRÍTICO
                "tipo_admision": datos_paciente.get('tipo_admision', 'EXT'),  # ✅ Va a pacientes_admision
                
                # 🩺 CAMPOS MÉDICOS CORREGIDOS
                "tipo_sangre": datos_paciente.get('tipo_sangre'),  # ✅ Corregido
                "factor_rh": datos_paciente.get('factor_rh'),  # ✅ Agregado
                "antecedentes_medicos": datos_paciente.get('antecedentes_medicos'),  # ✅ Corregido
                "medicamentos_actuales": datos_paciente.get('medicamentos_actuales'),  # ✅ Corregido
                "cirugias_previas": datos_paciente.get('cirugias_previas'),  # ✅ Agregado
                "observaciones_especiales": datos_paciente.get('observaciones_especiales'),  # ✅ Agregado
                
                # 🩺 DIAGNÓSTICO
                "diagnostico_codigo": datos_paciente.get('diagnostico_codigo'),  # ✅ Agregado
                "diagnostico_texto": datos_paciente.get('diagnostico_texto'),  # ✅ Agregado
                "diagnosis": datos_paciente.get('diagnosis'),  # ✅ Agregado
                
                # 🏥 SEGURO
                "seguro_id": datos_paciente.get('seguro_id'),  # ✅ Agregado
                "numero_seguro": datos_paciente.get('numero_seguro'),  # ✅ Agregado
                
                # 📞 CONTACTO DE EMERGENCIA CORREGIDO
                "contacto_emergencia": datos_paciente.get('contacto_emergencia', {})
            }
            
            # 🛡️ VALIDACIÓN CRÍTICA ANTES DE ENVIAR A POSTGRESQL
            logger.info("🛡️ === INICIANDO VALIDACIÓN DE LONGITUDES - CLAUDE DEV ===")
            errores_validacion = self._validar_longitud_campos(datos_formateados)
            logger.info(f"🔍 Errores encontrados en validación: {errores_validacion}")
            
            if errores_validacion:
                logger.error(f"❌ DETENIENDO PROCESO - Errores de validación: {errores_validacion}")
                return {
                    "success": False,
                    "message": f"Errores de validación: {'; '.join(errores_validacion)}",
                    "errores": errores_validacion
                }
            
            logger.info("✅ Validación de longitudes PASÓ - Enviando a PostgreSQL")
            
            # 🔧 AGREGAR CAMPOS OBLIGATORIOS QUE POSTGRESQL ESPERA
            # ⚠️ FIX TEMPORAL: La función PostgreSQL está convirtiendo valores incorrectamente
            datos_formateados.update({
                "estado": "01",    # ✅ VALOR FIJO 2 CARACTERES para campo estado
                "activo": "S"
            })
            
            # ⚠️ IMPORTANTE: REMOVER tipo_admision de datos_formateados para tabla pacientes
            # tipo_admision debe ir solo a pacientes_admision, NO a pacientes
            tipo_admision_temporal = datos_formateados.pop('tipo_admision', 'EXT')
            
            # ✅ REINTRODUCIR tipo_admision PARA PACIENTES_ADMISION SOLAMENTE
            datos_formateados["tipo_admision"] = tipo_admision_temporal
            
            logger.info(f"🔧 VALORES FIJOS AGREGADOS: estado='01', activo='S'")
            logger.info(f"✅ TIPO_ADMISION CONFIGURADO: {tipo_admision_temporal}")
            
            # Agregar alergias si existen - FORMATO ALAN
            if datos_paciente.get('alergias'):
                datos_formateados["alergias"] = datos_paciente.get('alergias')
            
            # 🔍 DEBUG SETUP ÉPICO - CLAUDE DEV
            logger.info("🔍 === DEBUG SETUP CLAUDE DEV ===")
            logger.info(f"📥 DATOS ORIGINALES DEL FRONTEND:")
            logger.info(f"{json.dumps(datos_paciente, indent=2, ensure_ascii=False)}")
            logger.info(f"📤 DATOS FORMATEADOS PARA POSTGRESQL:")
            logger.info(f"{json.dumps(datos_formateados, indent=2, ensure_ascii=False)}")
            logger.info("🔍 === FIN DEBUG SETUP ===")
            
            async with db_manager.pool.acquire() as connection:
                # 🚀 LLAMAR FUNCIÓN POSTGRESQL ÉPICA (YA EXISTE - ALAN TENÍA RAZÓN)
                query = "SELECT public.fn_afiliar_paciente_completo($1::JSONB)"
                
                result = await connection.fetchval(
                    query, 
                    json.dumps(datos_formateados)
                )
                
                # 📊 PROCESAR RESPUESTA
                if isinstance(result, str):
                    result = json.loads(result)
                
                # 🔍 DEBUG DE RESPUESTA POSTGRESQL
                logger.info(f"📥 RESPUESTA POSTGRESQL RAW: {result}")
                
                if result.get('success'):
                    logger.info(f"✅ Paciente afiliado exitosamente: ID {result.get('data', {}).get('paciente_id')}")
                    return {
                        "success": True,
                        "data": result.get('data'),
                        "message": "Paciente afiliado exitosamente - CLAUDE DEV FIX APLICADO",
                        "timestamp": datetime.now().isoformat()
                    }
                else:
                    # 🔍 CAPTURAR ERROR DETALLADO
                    error_detalle = result.get('details', {})
                    logger.error(f"❌ Error en función PostgreSQL:")
                    logger.error(f"   - Mensaje: {result.get('message')}")
                    logger.error(f"   - Error SQL: {error_detalle.get('sql_error')}")
                    logger.error(f"   - Estado SQL: {error_detalle.get('sql_state')}")
                    logger.error(f"   - Datos entrada: {error_detalle.get('datos_entrada')}")
                    
                    return {
                        "success": False,
                        "message": f"Error PostgreSQL: {result.get('message')}",
                        "error_sql": error_detalle.get('sql_error'),
                        "error_state": error_detalle.get('sql_state'),
                        "datos_enviados": datos_formateados
                    }
                    
        except Exception as e:
            logger.error(f"❌ Error afiliando paciente: {e}")
            return self._get_error_response(f"Error en afiliación: {str(e)}")

    async def validar_documento_existente(self, tipo_doc: str, numero_doc: str, excluir_id: int = None) -> Dict[str, Any]:
        """
        🔍 VALIDAR SI EL DOCUMENTO YA EXISTE
        Evita duplicados en la Técnica Alan
        """
        try:
            if not db_manager.pool:
                return self._get_error_response("Pool de conexiones no disponible")
            
            async with db_manager.pool.acquire() as connection:
                query = """
                SELECT id, nombres, apellidos, fecha_nacimiento
                FROM pacientes 
                WHERE tipo_doc = $1 AND numero_doc = $2 AND activo = 'S'
                """
                
                params = [tipo_doc, numero_doc]
                
                if excluir_id:
                    query += " AND id != $3"
                    params.append(excluir_id)
                
                row = await connection.fetchrow(query, *params)
                
                if row:
                    return {
                        "success": True,
                        "existe": True,
                        "data": {
                            "paciente_id": row['id'],
                            "nombres": row['nombres'],
                            "apellidos": row['apellidos'],
                            "fecha_nacimiento": row['fecha_nacimiento'].isoformat() if row['fecha_nacimiento'] else None
                        },
                        "message": f"Ya existe paciente con {tipo_doc}: {numero_doc}"
                    }
                else:
                    return {
                        "success": True,
                        "existe": False,
                        "message": "Documento disponible"
                    }
                    
        except Exception as e:
            logger.error(f"❌ Error validando documento: {e}")
            return self._get_error_response(f"Error validando documento: {str(e)}")

    async def obtener_catalogos(self) -> Dict[str, Any]:
        """
        📊 OBTENER TODOS LOS CATÁLOGOS DINÁMICOS
        Integra sistema dual de catálogos de Alan
        """
        try:
            if not db_manager.pool:
                return self._get_error_response("Pool de conexiones no disponible")
            
            async with db_manager.pool.acquire() as connection:
                # 🔥 OBTENER CATÁLOGOS SIMPLES (adm_tabla + adm_elemento)
                query_catalogos = """
                SELECT 
                    t.codigo_tabla,
                    t.nombre_tabla,
                    t.icono,
                    t.color,
                    json_agg(
                        json_build_object(
                            'codigo', e.codigo_elemento,
                            'nombre', e.nombre_elemento,
                            'descripcion', e.descripcion_corta,
                            'color_ui', e.valor_adicional,
                            'orden', e.orden_presentacion
        ORDER BY e.orden_presentacion
    as elementos
                FROM adm_tabla t
                LEFT JOIN adm_elemento e ON t.id = e.tabla_id AND e.activo = 'S'
                WHERE t.activo = 'S' 
                  AND t.codigo_tabla IN ('TIPOS_DOCUMENTO', 'ESTADO_CIVIL', 'TIPOS_SANGRE', 
                                        'OCUPACIONES', 'TIPOS_CONTACTO', 'TIPOS_SEGURO')
                GROUP BY t.codigo_tabla, t.nombre_tabla, t.icono, t.color
                ORDER BY t.orden_presentacion
                """
                
                rows = await connection.fetch(query_catalogos)
                
                catalogos = {}
                for row in rows:
                    catalogos[row['codigo_tabla']] = {
                        "nombre": row['nombre_tabla'],
                        "icono": row['icono'],
                        "color": row['color'],
                        "elementos": row['elementos'] or []
                    }
                
                logger.info(f"✅ Catálogos obtenidos: {list(catalogos.keys())}")
                
                return {
                    "success": True,
                    "data": catalogos,
                    "message": "Catálogos cargados exitosamente",
                    "timestamp": datetime.now().isoformat()
                }
                
        except Exception as e:
            logger.error(f"❌ Error obteniendo catálogos: {e}")
            return self._get_error_response(f"Error cargando catálogos: {str(e)}")
    
    async def buscar_diagnosticos(self, termino: str, limite: int = 10) -> Dict[str, Any]:
        """
        🔍 BÚSQUEDA DE DIAGNÓSTICOS CIE-10
        Busca en tabla compleja de diagnósticos
        """
        try:
            if not db_manager.pool:
                return self._get_error_response("Pool de conexiones no disponible")
            
            if not termino or len(termino.strip()) < 2:
                return {
                    "success": True,
                    "data": [],
                    "message": "Ingrese al menos 2 caracteres"
                }
            
            termino_busqueda = f"%{termino.strip()}%"
            
            async with db_manager.pool.acquire() as connection:
                query = """
                SELECT 
                    codigo,
                    descripcion,
                    CASE 
                        WHEN codigo ILIKE $1 THEN 100
                        WHEN descripcion ILIKE $1 THEN 80
                        WHEN descripcion ILIKE $2 THEN 60
                        ELSE 40
                    END as relevancia
                FROM diagnosticos 
                WHERE activo = 'S'
                  AND (
                    codigo ILIKE $1 OR 
                    descripcion ILIKE $2
 
                ORDER BY relevancia DESC, codigo
                LIMIT $3
                """
                
                rows = await connection.fetch(
                    query, 
                    f"{termino.strip()}%",  # Para códigos que empiecen con el término
                    termino_busqueda,       # Para descripciones que contengan el término
                    limite
                )
                
                diagnosticos = []
                for row in rows:
                    diagnosticos.append({
                        "codigo": row['codigo'],
                        "descripcion": row['descripcion'],
                        "relevancia": row['relevancia']
                    })
                
                logger.info(f"🔍 Búsqueda diagnósticos '{termino}': {len(diagnosticos)} resultados")
                
                return {
                    "success": True,
                    "data": diagnosticos,
                    "termino_busqueda": termino,
                    "total_encontrados": len(diagnosticos),
                    "timestamp": datetime.now().isoformat()
                }
                
        except Exception as e:
            logger.error(f"❌ Error buscando diagnósticos: {e}")
            return self._get_error_response(f"Error en búsqueda de diagnósticos: {str(e)}")
    
    async def crear_paciente_externo_rapido(self, datos_basicos: Dict[str, Any]) -> Dict[str, Any]:
        """
        ⚡ CREAR PACIENTE EXTERNO RÁPIDO
        Para pacientes que llegan directo sin llamar - Técnica Alan
        """
        try:
            datos_completos = {
                "tipoDocumento": datos_basicos.get('tipo_doc', 'DNI'),
                "numeroDocumento": datos_basicos.get('numero_doc'),
                "nombres": datos_basicos.get('nombres'),
                "apellidos": datos_basicos.get('apellidos'),
                "fechaNacimiento": datos_basicos.get('fecha_nacimiento'),
                "sexo": datos_basicos.get('sexo', 'M'),
                "telefono": datos_basicos.get('telefono', ''),
                "email": datos_basicos.get('email', ''),
                "direccion": '',
                "distrito": 'LIMA',
                "hospital_id": 1,
                "contactoNombre": '',
                "contactoParentesco": '',
                "contactoTelefono": '',
                "alergias": []
            }
            
            logger.info(f"⚡ Creando paciente externo rápido: {datos_basicos.get('nombres')}")
            
            resultado = await self.afiliar_paciente_completo(datos_completos)
            
            if resultado.get('success'):
                resultado['message'] = 'Paciente externo creado rápidamente - Técnica Alan'
            
            return resultado
            
        except Exception as e:
            logger.error(f"❌ Error creando paciente externo: {e}")
            return self._get_error_response(f"Error creando paciente externo: {str(e)}")

    async def obtener_catalogos(self, codigos_tabla: List[str] = None) -> Dict[str, Any]:
        """
        📋 OBTENER CATÁLOGOS DINÁMICOS
        Obtiene catálogos de adm_tabla + adm_elemento según Estrategia Dual Alan
        """
        try:
            if not db_manager.pool:
                logger.error("❌ Pool de conexiones no inicializado")
                return self._get_error_response("Pool de conexiones no disponible")
            
            # Por defecto, obtener catálogos para afiliación
            if not codigos_tabla:
                codigos_tabla = ['ESTADO_CIVIL', 'OCUPACIONES', 'TIPOS_DOCUMENTO', 'TIPOS_SANGRE']
            
            async with db_manager.pool.acquire() as connection:
                catalogos_resultado = {}
                
                for codigo_tabla in codigos_tabla:
                    query = """
                    SELECT 
                        ae.codigo_elemento,
                        ae.nombre_elemento,
                        ae.valor_adicional,
                        ae.orden_presentacion
                    FROM adm_elemento ae
                    JOIN adm_tabla at ON ae.tabla_id = at.id
                    WHERE at.codigo_tabla = $1
                    AND ae.activo = 'S'
                    ORDER BY ae.orden_presentacion, ae.nombre_elemento
                    """
                    
                    rows = await connection.fetch(query, codigo_tabla)
                    
                    elementos = []
                    for row in rows:
                        elementos.append({
                            "codigo": row["codigo_elemento"],
                            "nombre": row["nombre_elemento"],
                            "color": row["valor_adicional"],
                            "orden": row["orden_presentacion"] or 999
                        })
                    
                    catalogos_resultado[codigo_tabla.lower()] = elementos
                    logger.info(f"📋 Catálogo {codigo_tabla}: {len(elementos)} elementos")
                
                return {
                    "success": True,
                    "data": catalogos_resultado,
                    "catalogos_cargados": len(catalogos_resultado),
                    "timestamp": datetime.now().isoformat()
                }
                
        except Exception as e:
            logger.error(f"❌ Error obteniendo catálogos: {e}")
            return self._get_error_response(f"Error obteniendo catálogos: {str(e)}")
    
    # 🛡️ MÉTODO DE VALIDACIÓN CRÍTICO - CLAUDE DEV FIX
    def _validar_longitud_campos(self, datos: Dict[str, Any]) -> List[str]:
        """
        🔍 VALIDAR QUE LOS CAMPOS NO EXCEDAN LONGITUD MÁXIMA EN BD
        CRÍTICO: Evita error SQL 22001 "character varying too long"
        """
        limites_bd = {
            # CAMPOS CRÍTICOS DE 1-2 CARACTERES
            'sexo': 1,           # character(1) - M/F
            'activo': 1,         # character(1) - S/N  
            'estado': 2,         # character(2) - 01/02 ← CAUSA DEL ERROR
            
            # CAMPOS DE TEXTO CORTOS
            'tipo_doc': 3,       # varchar(3) - 001/002/003
            'numero_doc': 15,    # varchar(15)
            'telefono': 15,      # varchar(15)
            'distrito': 50,      # varchar(50)
            'email': 50,         # varchar(50)
            
            # CAMPOS DE TEXTO LARGOS
            'nombres': 80,       # varchar(80)
            'apellidos': 80,     # varchar(80)
            'direccion': 200,    # varchar(200)
            
            # CAMPOS MÉDICOS
            'numero_seguro': 20, # varchar(20)
        }
        
        errores = []
        
        for campo, max_longitud in limites_bd.items():
            valor = datos.get(campo)
            if valor is not None:
                valor_str = str(valor)
                if len(valor_str) > max_longitud:
                    errores.append(
                        f"Campo '{campo}' excede {max_longitud} caracteres: '{valor_str}' ({len(valor_str)} chars)"
                    )
   
        
        # VALIDACIÓN ESPECIAL: Si tipo_admision se está enviando donde no debe
        if 'tipo_admision' in datos:
            tipo_admision = datos.get('tipo_admision', '')
            if len(str(tipo_admision)) > 3:
                errores.append(
                    f"CRÍTICO: tipo_admision '{tipo_admision}' muy largo - debe ir a pacientes_admision, NO a pacientes"
                )
        
        return errores
    
    # 🔧 MÉTODOS DE CONVERSIÓN DE CÓDIGOS - CORREGIDO PARA adm_elemento
    def _convertir_tipo_documento(self, tipo_doc: str) -> str:
        """Convertir tipo de documento - RESPETA códigos de 3 dígitos"""
        conversiones = {
            # ✅ TIPOS TEXTUALES → CÓDIGOS DE 3 DÍGITOS
            'DNI': '001',             # DNI → 001
            'CARNET_EXTRANJERIA': '002',
            'CE': '002',              # Carnet Extranjería → 002
            'CEX': '002',             # Alias
            'PASAPORTE': '003',
            'PPT': '003',             # Pasaporte → 003
            'PAS': '003',             # Alias
            'CEDULA': '004',
            'RUC': '004',             # RUC → 004
            
            # ✅ CÓDIGOS YA CORRECTOS - NO CONVERTIR
            '001': '001',             # ✅ DNI - mantener 3 dígitos
            '002': '002',             # ✅ CE - mantener 3 dígitos
            '003': '003',             # ✅ PAS - mantener 3 dígitos
            '004': '004',             # ✅ RUC - mantener 3 dígitos
            '005': '005'              # ✅ Otros - mantener 3 dígitos
        }
        return conversiones.get(tipo_doc.upper() if tipo_doc else '', '001')  # Default DNI
    
    def _convertir_sexo(self, sexo: str) -> str:
        """Convertir sexo a código de 1 carácter"""
        conversiones = {
            'M': 'M',
            'MASCULINO': 'M',
            'F': 'F',
            'FEMENINO': 'F',
            'O': 'O',
            'OTRO': 'O'
        }
        return conversiones.get(sexo.upper() if sexo else '', 'M')  # ✅ Default M
    
    def _convertir_distrito(self, distrito: str) -> str:
        """Convertir distrito - RESPETA códigos libres"""
        if not distrito or distrito.strip() == '':
            return '999'  # ✅ Código por defecto para distrito no especificado
        
        # Mapeo básico de distritos comunes - MANTENER COMO STRING LIBRE
        conversiones = {
            'LIMA': '001',
            'MIRAFLORES': '002',
            'SAN_ISIDRO': '003',
            'SURCO': '004',
            'LA_MOLINA': '005',
            'SAN_BORJA': '006',
            'CALLAO': '007',
            'PUEBLO_LIBRE': '008',
            'JESUS_MARIA': '009',
            'LINCE': '010',
            'MAGDALENA': '011',
            'SAN_MIGUEL': '012',
            'BREÑA': '013',
            'RIMAC': '014',
            'CERCADO': '015'
        }
        
        distrito_upper = distrito.upper().replace(' ', '_')
        return conversiones.get(distrito_upper, '999')  # ✅ Código libre por defecto

    async def afiliar_paciente_externo(self, datos_paciente: Dict[str, Any]) -> Dict[str, Any]:
        """
        📞 ENDPOINT ESPECÍFICO PARA PACIENTES EXTERNOS
        ✅ CLAUDE DEV FIX: Maneja correctamente tipo_admision = 'EXT'
        """
        try:
            logger.info(f"📞 Creando paciente externo: {datos_paciente.get('nombres')} {datos_paciente.get('apellidos')}")
            
            # ✅ FORZAR TIPO_ADMISION PARA EXTERNOS
            datos_paciente['tipo_admision'] = 'EXT'
            
            # ✅ VALORES POR DEFECTO PARA EXTERNOS
            datos_paciente.setdefault('hospital_id', 1)
            datos_paciente.setdefault('usuario_creacion', 1)
            
            # ✅ LLAMAR MÉTODO PRINCIPAL CON DATOS CORREGIDOS
            resultado = await self.afiliar_paciente_completo(datos_paciente)
            
            if resultado.get('success'):
                resultado['message'] = 'Paciente externo registrado exitosamente - CLAUDE DEV FIX'
                resultado['tipo_registro'] = 'EXTERNO'
            
            return resultado
            
        except Exception as e:
            logger.error(f"❌ Error creando paciente externo: {e}")
            return self._get_error_response(f"Error creando paciente externo: {str(e)}")

    async def obtener_paciente_para_edicion(self, paciente_id: int) -> Dict[str, Any]:
        """
        🔍 FIX ESPECÍFICO - OBTENER PACIENTE PARA EDICIÓN
        Solo lo necesario para poblar formulario
        """
        try:
            if not db_manager.pool:
                return self._get_error_response("Pool de conexiones no disponible")
            
            logger.info(f"🔍 Cargando paciente para edición - ID: {paciente_id}")
            
            async with db_manager.pool.acquire() as connection:
                # ✅ QUERY CORREGIDA - Solo campos que existen en la tabla
                query = """
                SELECT 
                    tipo_doc, numero_doc, nombres, apellidos,
                    fecha_nacimiento, sexo, telefono, email, 
                    direccion, distrito
                FROM pacientes 
                WHERE id = $1 AND activo = 'S'
                """
                
                row = await connection.fetchrow(query, paciente_id)
                
                if row:
                    return {
                        "success": True,
                        "data": {
                            "paso1": {
                                "tipo_documento": row['tipo_doc'],
                                "numero_documento": row['numero_doc'],
                                "nombres": row['nombres'],
                                "apellidos": row['apellidos'],
                                "fecha_nacimiento": row['fecha_nacimiento'].isoformat() if row['fecha_nacimiento'] else None,
                                "sexo": row['sexo']
                            },
                            "paso3": {
                                "telefono": row['telefono'],
                                "email": row['email'],
                                "direccion": row['direccion'],
                                "distrito": row['distrito']
                            }
                        },
                        "message": "Paciente cargado para edición"
                    }
                else:
                    return self._get_error_response(f"Paciente {paciente_id} no encontrado")
                    
        except Exception as e:
            logger.error(f"❌ Error cargando paciente {paciente_id}: {e}")
            return self._get_error_response(f"Error cargando paciente: {str(e)}")
# Instancia del manager
afiliacion_manager = AfiliacionManager()