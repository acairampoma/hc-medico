DROP VIEW IF EXISTS public.vw_pacientes_afiliacion;

-- Vista actualizada para normalizar códigos de tipo_doc y sexo
-- Incluye conversiones de formatos antiguos (DN, 1, 01, 001, etc.) a nomenclatura estándar

CREATE OR REPLACE VIEW public.vw_pacientes_afiliacion AS
SELECT 
    p.id AS paciente_id,
    p.codigo AS codigo_paciente,
    -- Normalizar tipo_doc a etiquetas legibles
    CASE
        WHEN p.tipo_doc IN ('DN', '1', '01', '001') THEN 'DNI'
        WHEN p.tipo_doc IN ('CE', '002') THEN 'CE'
        WHEN p.tipo_doc IN ('PA', 'PAS', '003') THEN 'PAS'
        WHEN p.tipo_doc IN ('RU', 'RUC', '004') THEN 'RUC'
        ELSE p.tipo_doc
    END AS tipo_doc,
    p.numero_doc,
    -- Documento completo
    concat(
        CASE
            WHEN p.tipo_doc IN ('DN', '1', '01', '001') THEN 'DNI'
            WHEN p.tipo_doc IN ('CE', '002') THEN 'CE'
            WHEN p.tipo_doc IN ('PA', 'PAS', '003') THEN 'PAS'
            WHEN p.tipo_doc IN ('RU', 'RUC', '004') THEN 'RUC'
            ELSE p.tipo_doc
        END, ': ', p.numero_doc) AS documento_completo,
    -- Historia clínica
    p.hc_prefix,
    p.hc_numero,
    concat(p.hc_prefix, p.hc_numero) AS historia_clinica,
    CASE
        WHEN p.hc_prefix = 'EXT' THEN 'Externo'
        WHEN p.hc_prefix = 'HC' THEN 'Historia Clínica'
        WHEN p.hc_prefix = 'QTA' THEN 'Quota'
        ELSE p.hc_prefix
    END AS tipo_paciente,

    -- Datos de nombres
    p.nombres,
    p.apellidos,
    concat(p.nombres, ' ', p.apellidos) AS nombres_completos,
    p.fecha_nacimiento,
    EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM p.fecha_nacimiento) AS edad,

    -- Sexo y descripción
    p.sexo,
    CASE
        WHEN p.sexo IN ('M', '1') THEN 'Masculino'::varchar
        WHEN p.sexo IN ('F', '2') THEN 'Femenino'::varchar
        ELSE 'No especificado'::varchar
    END AS sexo_descripcion,

    -- Contacto
    p.email,
    p.telefono,
    p.direccion,
    p.distrito,

    -- Hospital
    p.hospital_id,
    h.nombre AS hospital_nombre,
    h.codigo AS hospital_codigo,

    -- Seguro
    p.seguro_id,
    s.nombre AS seguro_nombre,
    s.codigo AS seguro_codigo,
    p.numero_seguro,

    -- Estado y descripción
    p.estado,
    CASE
        WHEN p.estado = '01' THEN 'Activo'::varchar
        WHEN p.estado = '02' THEN 'Inactivo'::varchar
        WHEN p.estado = '03' THEN 'Suspendido'::varchar
        WHEN p.estado = 'A' THEN 'Activo'::varchar
        WHEN p.estado = 'I' THEN 'Inactivo'::varchar
        WHEN p.estado = 'S' THEN 'Suspendido'::varchar
        ELSE 'Desconocido'::varchar
    END AS estado_descripcion,

    p.activo,
    p.creado_en AS fecha_afiliacion,
    p.actualizado_en AS fecha_actualizacion,

    -- Detalles adicionales (tipo de sangre, contacto emergencia)
    ts.valor AS tipo_sangre,
    ce.valor AS contacto_emergencia_json,

    -- Campos de búsqueda
    lower(translate(concat(p.nombres, ' ', p.apellidos), 'áéíóúñÁÉÍÓÚÑ','aeiounAEIOUN')) AS nombres_busqueda,
    lower(p.numero_doc::text) AS numero_doc_busqueda,
    lower(concat(p.hc_prefix, p.hc_numero)) AS historia_clinica_busqueda,
    CASE
        WHEN p.hc_prefix = 'EXT' THEN 'externo,temporal,consulta'
        WHEN p.hc_prefix = 'HC' THEN 'historia,permanente,hospitalizado'
        WHEN p.hc_prefix = 'QTA' THEN 'quota,especial,derivado'
        ELSE 'otro'
    END AS tags_busqueda
FROM pacientes p
LEFT JOIN hospitales h ON p.hospital_id = h.id
LEFT JOIN seguros s ON p.seguro_id = s.id
LEFT JOIN pacientes_detalle ts ON p.id = ts.paciente_id AND ts.tipo_codigo = 'TSG' AND ts.activo = 'S'
LEFT JOIN pacientes_detalle ce ON p.id = ce.paciente_id AND ce.tipo_codigo = 'CON' AND ce.activo = 'S'
WHERE p.activo = 'S'
ORDER BY p.actualizado_en DESC;
