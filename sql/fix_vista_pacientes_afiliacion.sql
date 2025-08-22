-- ===== ARREGLAR VISTA PACIENTES AFILIACIÓN =====

-- 🗂️ Eliminar vista actual
DROP VIEW IF EXISTS vw_pacientes_afiliacion;

-- 🚀 Crear vista épica CORREGIDA
CREATE VIEW vw_pacientes_afiliacion AS
SELECT 
    -- 🆔 Identificadores principales
    p.id as paciente_id,
    p.codigo as codigo_paciente,
    
    -- 📄 Documento de identidad CORREGIDO
    CASE 
        WHEN p.tipo_doc = 'DN' THEN 'DNI'
        WHEN p.tipo_doc = 'CE' THEN 'CE'
        WHEN p.tipo_doc = 'PA' THEN 'PAS'
        WHEN p.tipo_doc = 'RU' THEN 'RUC'
        ELSE p.tipo_doc
    END as tipo_doc,
    p.numero_doc,
    CONCAT(
        CASE 
            WHEN p.tipo_doc = 'DN' THEN 'DNI'
            WHEN p.tipo_doc = 'CE' THEN 'CE'
            WHEN p.tipo_doc = 'PA' THEN 'PAS'
            WHEN p.tipo_doc = 'RU' THEN 'RUC'
            ELSE p.tipo_doc
        END, 
        ': ', p.numero_doc
    ) as documento_completo,
    
    -- 🏥 Historia clínica
    p.hc_prefix,
    p.hc_numero,
    CONCAT(p.hc_prefix, p.hc_numero) as historia_clinica,
    CASE 
        WHEN p.hc_prefix = 'EXT' THEN 'Externo'
        WHEN p.hc_prefix = 'HC' THEN 'Historia Clínica'
        WHEN p.hc_prefix = 'QTA' THEN 'Quota'
        ELSE p.hc_prefix
    END as tipo_paciente,
    
    -- 👤 Datos personales
    p.nombres,
    p.apellidos,
    CONCAT(p.nombres, ' ', p.apellidos) as nombres_completos,
    p.fecha_nacimiento,
    EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM p.fecha_nacimiento) as edad,
    p.sexo,
    CASE 
        WHEN p.sexo = 'M' THEN 'Masculino'
        WHEN p.sexo = 'F' THEN 'Femenino'
        ELSE 'No especificado'
    END as sexo_descripcion,
    
    -- 📞 Contacto
    p.email,
    p.telefono,
    p.direccion,
    p.distrito,
    
    -- 🏥 Hospital y seguro
    p.hospital_id,
    h.nombre as hospital_nombre,
    h.codigo as hospital_codigo,
    p.seguro_id,
    s.nombre as seguro_nombre,
    s.codigo as seguro_codigo,
    p.numero_seguro,
    
    -- 📊 Estado CORREGIDO
    p.estado,
    CASE 
        WHEN p.estado = '01' THEN 'Activo'
        WHEN p.estado = '02' THEN 'Inactivo'
        WHEN p.estado = '03' THEN 'Suspendido'
        WHEN p.estado = 'A' THEN 'Activo'
        WHEN p.estado = 'I' THEN 'Inactivo'
        WHEN p.estado = 'S' THEN 'Suspendido'
        ELSE 'Desconocido'
    END as estado_descripcion,
    p.activo,
    p.creado_en as fecha_afiliacion,
    p.actualizado_en as fecha_actualizacion,
    
    -- 🩺 Información médica básica (desde pacientes_detalle)
    ts.valor as tipo_sangre,
    
    -- 📞 Contacto de emergencia (desde pacientes_detalle)
    ce.valor as contacto_emergencia_json,
    
    -- 📈 Campos calculados para filtros CORREGIDOS
    LOWER(TRANSLATE(CONCAT(p.nombres, ' ', p.apellidos), 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')) as nombres_busqueda,
    LOWER(p.numero_doc) as numero_doc_busqueda,
    LOWER(CONCAT(p.hc_prefix, p.hc_numero)) as historia_clinica_busqueda,
    
    -- 🏷️ Tags para búsqueda avanzada
    CASE 
        WHEN p.hc_prefix = 'EXT' THEN 'externo,temporal,consulta'
        WHEN p.hc_prefix = 'HC' THEN 'historia,permanente,hospitalizado'
        WHEN p.hc_prefix = 'QTA' THEN 'quota,especial,derivado'
        ELSE 'otro'
    END as tags_busqueda

FROM pacientes p
    LEFT JOIN hospitales h ON p.hospital_id = h.id
    LEFT JOIN seguros s ON p.seguro_id = s.id
    -- Tipo de sangre (TSG)
    LEFT JOIN pacientes_detalle ts ON p.id = ts.paciente_id 
        AND ts.tipo_codigo = 'TSG' 
        AND ts.activo = 'S'
    -- Contacto de emergencia (CON)
    LEFT JOIN pacientes_detalle ce ON p.id = ce.paciente_id 
        AND ce.tipo_codigo = 'CON' 
        AND ce.activo = 'S'

WHERE p.activo = 'S'  -- Solo pacientes activos

ORDER BY p.actualizado_en DESC;

-- 🚀 Comentarios de la vista
COMMENT ON VIEW vw_pacientes_afiliacion IS 'Vista épica CORREGIDA - Tipos de documento y estados descriptivos';

-- 📋 Actualizar función para búsqueda con filtros CORREGIDA
CREATE OR REPLACE FUNCTION fn_buscar_pacientes_afiliacion(
    p_filtros JSONB DEFAULT '{}'::JSONB,
    p_limit INTEGER DEFAULT 10,  -- 📄 CAMBIAR A 10 POR DEFECTO
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    resultado JSONB
) AS $$
DECLARE
    v_query TEXT;
    v_where_conditions TEXT[] := ARRAY[]::TEXT[];
    v_total_count INTEGER;
    v_pacientes JSONB;
BEGIN
    -- 🔍 Construir condiciones WHERE dinámicamente CORREGIDAS
    
    -- Filtro por nombre o apellidos
    IF p_filtros ? 'nombre' AND p_filtros->>'nombre' != '' THEN
        v_where_conditions := array_append(v_where_conditions, 
            'nombres_busqueda LIKE ' || quote_literal('%' || LOWER(TRANSLATE(p_filtros->>'nombre', 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN')) || '%')
        );
    END IF;
    
    -- Filtro por tipo de documento CORREGIDO
    IF p_filtros ? 'tipo_doc' AND p_filtros->>'tipo_doc' != '' THEN
        v_where_conditions := array_append(v_where_conditions, 
            'tipo_doc = ' || quote_literal(p_filtros->>'tipo_doc')
        );
    END IF;
    
    -- Filtro por número de documento
    IF p_filtros ? 'numero_doc' AND p_filtros->>'numero_doc' != '' THEN
        v_where_conditions := array_append(v_where_conditions, 
            'numero_doc_busqueda LIKE ' || quote_literal('%' || LOWER(p_filtros->>'numero_doc') || '%')
        );
    END IF;
    
    -- Filtro por tipo de paciente
    IF p_filtros ? 'tipo_paciente' AND p_filtros->>'tipo_paciente' != '' THEN
        v_where_conditions := array_append(v_where_conditions, 
            'hc_prefix = ' || quote_literal(p_filtros->>'tipo_paciente')
        );
    END IF;
    
    -- Filtro por hospital
    IF p_filtros ? 'hospital_id' AND p_filtros->>'hospital_id' != '' THEN
        v_where_conditions := array_append(v_where_conditions, 
            'hospital_id = ' || (p_filtros->>'hospital_id')::INTEGER
        );
    END IF;
    
    -- Filtro por estado CORREGIDO
    IF p_filtros ? 'estado' AND p_filtros->>'estado' != '' THEN
        v_where_conditions := array_append(v_where_conditions, 
            'estado_descripcion = ' || quote_literal(p_filtros->>'estado')
        );
    END IF;
    
    -- 📊 Construir query completa
    v_query := 'SELECT * FROM vw_pacientes_afiliacion';
    
    IF array_length(v_where_conditions, 1) > 0 THEN
        v_query := v_query || ' WHERE ' || array_to_string(v_where_conditions, ' AND ');
    END IF;
    
    -- 📈 Obtener total de registros
    EXECUTE 'SELECT COUNT(*) FROM (' || v_query || ') as count_query' INTO v_total_count;
    
    -- 📄 Agregar paginación
    v_query := v_query || ' ORDER BY fecha_actualizacion DESC LIMIT ' || p_limit || ' OFFSET ' || p_offset;
    
    -- 🚀 Ejecutar query y convertir a JSONB
    EXECUTE 'SELECT jsonb_agg(row_to_json(t.*)) FROM (' || v_query || ') t' INTO v_pacientes;
    
    -- 📦 Retornar resultado estructurado
    RETURN QUERY SELECT jsonb_build_object(
        'success', true,
        'data', COALESCE(v_pacientes, '[]'::JSONB),
        'pagination', jsonb_build_object(
            'total_registros', v_total_count,
            'limite', p_limit,
            'offset', p_offset,
            'pagina_actual', (p_offset / p_limit) + 1,
            'total_paginas', CEIL(v_total_count::DECIMAL / p_limit)
        ),
        'filtros_aplicados', p_filtros,
        'timestamp', EXTRACT(EPOCH FROM NOW())
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT jsonb_build_object(
            'success', false,
            'error', 'ERROR_BUSQUEDA',
            'message', SQLERRM,
            'timestamp', EXTRACT(EPOCH FROM NOW())
        );
END;
$$ LANGUAGE plpgsql;
