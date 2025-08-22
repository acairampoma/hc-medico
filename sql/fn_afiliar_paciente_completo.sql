-- =============================================================
-- SQL Script: fn_afiliar_paciente_completo.sql
-- Descripción: Crea o reemplaza la función PL/pgSQL responsable de
--              afiliar un paciente completo / externo usando los
--              códigos ya convertidos provenientes del backend.
--              Esta versión evita el error 22001 de longitud y
--              mantiene sexo en 'M','F','O'.
-- =============================================================

-- Eliminar versión previa si existe
DROP FUNCTION IF EXISTS public.fn_afiliar_paciente_completo(jsonb);

-- Crear función corregida
CREATE OR REPLACE FUNCTION public.fn_afiliar_paciente_completo(p_datos_afiliacion jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    -- Variables de control
    v_paciente_id       BIGINT;
    v_nuevo_hc_numero   VARCHAR(10);
    v_codigo_paciente   VARCHAR(15);
    v_resultado         JSONB;
    v_detalle_record    JSONB;
    v_detalle_counter   INTEGER := 0;
    v_contacto_record   JSONB;

    -- Secuencias / hospital
    v_hospital_id       BIGINT;
    v_ultimo_numero_ext INTEGER;
    v_ultimo_numero_hc  INTEGER;

    -- Flags de validación
    v_existe_documento  BOOLEAN := FALSE;
    v_existe_codigo     BOOLEAN := FALSE;

    -- Auditoría
    v_usuario_creacion  BIGINT;
    v_timestamp_actual  TIMESTAMP := CURRENT_TIMESTAMP;

    -- Códigos convertidos (máx 3 caracteres)
    v_tipo_doc_codigo   VARCHAR(3);
    v_sexo_codigo       BPCHAR(1);      -- Sólo 'M', 'F', 'O'
    v_distrito_codigo   VARCHAR(3);
    v_estado_codigo     VARCHAR(3);
    v_parentesco_codigo VARCHAR(3);

    -- Lógica dinámica
    v_tipo_admision     VARCHAR(3);
    v_codigo_prefix     VARCHAR(3);
    v_historia_clinica  VARCHAR(15);
BEGIN
    ------------------------------------------------------------------
    -- Fase 1: Validaciones básicas
    ------------------------------------------------------------------
    v_hospital_id      := (p_datos_afiliacion ->> 'hospital_id')::BIGINT;
    v_usuario_creacion := COALESCE((p_datos_afiliacion ->> 'usuario_creacion')::BIGINT, 1);
    v_tipo_admision    := COALESCE(p_datos_afiliacion ->> 'tipo_admision', 'HC');

    -- Códigos directos desde backend
    v_tipo_doc_codigo   := COALESCE(p_datos_afiliacion ->> 'tipo_doc', '001');
    v_sexo_codigo       := CASE UPPER(p_datos_afiliacion ->> 'sexo')
                               WHEN 'F' THEN 'F'
                               WHEN 'O' THEN 'O'
                               ELSE 'M'
                           END;
    v_distrito_codigo   := COALESCE(p_datos_afiliacion ->> 'distrito', '999');
    v_estado_codigo     := '01';
    v_parentesco_codigo := COALESCE(p_datos_afiliacion -> 'contacto_emergencia' ->> 'parentesco_codigo', '999');

    ------------------------------------------------------------------
    -- Validar hospital y documento único
    ------------------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM hospitales WHERE id = v_hospital_id AND activo = 'S') THEN
        RETURN jsonb_build_object('success',false,'error','HOSPITAL_NO_EXISTE','message','Hospital inexistente','hospital_id',v_hospital_id);
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM pacientes
        WHERE tipo_doc = v_tipo_doc_codigo
          AND numero_doc = p_datos_afiliacion ->> 'numero_doc'
          AND activo = 'S'
    ) INTO v_existe_documento;

    IF v_existe_documento THEN
        RETURN jsonb_build_object('success',false,'error','DOCUMENTO_DUPLICADO','message','Documento ya existe','tipo_doc_codigo',v_tipo_doc_codigo,'numero_doc',p_datos_afiliacion ->> 'numero_doc');
    END IF;

    ------------------------------------------------------------------
    -- Fase 2: Generar códigos HC / EXT
    ------------------------------------------------------------------
    IF v_tipo_admision = 'EXT' THEN
        v_codigo_prefix := 'EXT';
        SELECT ultimo_numero INTO v_ultimo_numero_ext FROM secuencias WHERE hospital_id=v_hospital_id AND tipo='EXT';
        IF v_ultimo_numero_ext IS NULL THEN
            INSERT INTO secuencias(hospital_id,tipo,ultimo_numero) VALUES (v_hospital_id,'EXT',1)
            ON CONFLICT(hospital_id,tipo) DO UPDATE SET ultimo_numero=1;
            v_ultimo_numero_ext := 1;
        ELSE
            UPDATE secuencias SET ultimo_numero = ultimo_numero + 1 WHERE hospital_id=v_hospital_id AND tipo='EXT';
            v_ultimo_numero_ext := v_ultimo_numero_ext + 1;
        END IF;
        v_nuevo_hc_numero := LPAD(v_ultimo_numero_ext::TEXT,6,'0');
        v_historia_clinica := 'EXT'||v_nuevo_hc_numero;
    ELSE
        v_codigo_prefix := 'HC';
        SELECT ultimo_numero INTO v_ultimo_numero_hc FROM secuencias WHERE hospital_id=v_hospital_id AND tipo='HC';
        IF v_ultimo_numero_hc IS NULL THEN
            INSERT INTO secuencias(hospital_id,tipo,ultimo_numero) VALUES (v_hospital_id,'HC',1)
            ON CONFLICT(hospital_id,tipo) DO UPDATE SET ultimo_numero=1;
            v_ultimo_numero_hc := 1;
        ELSE
            UPDATE secuencias SET ultimo_numero = ultimo_numero + 1 WHERE hospital_id=v_hospital_id AND tipo='HC';
            v_ultimo_numero_hc := v_ultimo_numero_hc + 1;
        END IF;
        v_nuevo_hc_numero := LPAD(v_ultimo_numero_hc::TEXT,6,'0');
        v_historia_clinica := 'HC'||v_nuevo_hc_numero;
    END IF;

    v_codigo_paciente := 'PAC'||LPAD(COALESCE(v_ultimo_numero_ext,v_ultimo_numero_hc)::TEXT,8,'0');
    SELECT EXISTS (SELECT 1 FROM pacientes WHERE codigo=v_codigo_paciente) INTO v_existe_codigo;
    IF v_existe_codigo THEN
        v_codigo_paciente := 'PAC'||EXTRACT(EPOCH FROM v_timestamp_actual)::BIGINT::TEXT;
    END IF;

    ------------------------------------------------------------------
    -- Fase 3: Insert principal en pacientes
    ------------------------------------------------------------------
    INSERT INTO pacientes(
        codigo,tipo_doc,numero_doc,hc_prefix,hc_numero,nombres,apellidos,email,telefono,fecha_nacimiento,
        sexo,direccion,distrito,seguro_id,numero_seguro,hospital_id,estado,activo,creado_en,actualizado_en)
    VALUES (
        v_codigo_paciente,
        v_tipo_doc_codigo,
        p_datos_afiliacion ->> 'numero_doc',
        v_codigo_prefix,
        v_nuevo_hc_numero,
        p_datos_afiliacion ->> 'nombres',
        p_datos_afiliacion ->> 'apellidos',
        NULLIF(p_datos_afiliacion ->> 'email',''),
        NULLIF(p_datos_afiliacion ->> 'telefono',''),
        (p_datos_afiliacion ->> 'fecha_nacimiento')::DATE,
        v_sexo_codigo,
        NULLIF(p_datos_afiliacion ->> 'direccion',''),
        v_distrito_codigo,
        CASE WHEN p_datos_afiliacion ->> 'seguro_id' = '' THEN NULL ELSE (p_datos_afiliacion ->> 'seguro_id')::BIGINT END,
        NULLIF(p_datos_afiliacion ->> 'numero_seguro',''),
        v_hospital_id,
        v_estado_codigo,
        'S',
        v_timestamp_actual,
        v_timestamp_actual
    ) RETURNING id INTO v_paciente_id;

    ------------------------------------------------------------------
    -- Fase 4: Registrar admisión
    ------------------------------------------------------------------
    INSERT INTO pacientes_admision(paciente_id,codigo_prefix,codigo_numero,usuario_creacion,fecha_creacion,observaciones)
    VALUES (v_paciente_id,v_codigo_prefix,v_nuevo_hc_numero,v_usuario_creacion,v_timestamp_actual,
            CASE WHEN v_tipo_admision='EXT' THEN 'Afiliación externo' ELSE 'Afiliación completa' END);

    ------------------------------------------------------------------
    -- Fase 7: Respuesta
    ------------------------------------------------------------------
    v_resultado := jsonb_build_object(
        'success',true,
        'message','Paciente afiliado exitosamente',
        'data',jsonb_build_object(
            'paciente_id',v_paciente_id,
            'historia_clinica',v_historia_clinica,
            'codigo_paciente',v_codigo_paciente
        ));
    RETURN v_resultado;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success',false,'error','ERROR_INTERNO','message',SQLERRM);
END;
$$;
