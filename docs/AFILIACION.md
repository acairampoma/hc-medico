# Módulo de Afiliación

Este documento describe los endpoints, flujo general y el uso de base de datos para el módulo de Afiliación del proyecto.

## Resumen
- Framework: FastAPI
- Archivo principal: `main.py`
- Servicio de afiliación: `services/afiliacion_service.py`
- Middleware de seguridad: `middleware/auth_middleware.py`

## Endpoints
Definidos en `main.py`.

- GET `/api/afiliacion/test`
  - Healthcheck del módulo de afiliación.

- GET `/api/afiliacion/paciente/{paciente_id}`
  - Recupera datos completos de un paciente para edición.

- POST `/api/afiliacion/buscar-pacientes`
  - Busca pacientes con filtros y paginación.
  - Body: `{ filtros, limite, offset }`.

- POST `/api/afiliacion/crear`
  - Crea un paciente (afiliación completa vía función PostgreSQL).

- PUT `/api/afiliacion/actualizar/{paciente_id}`
  - Actualiza un paciente existente (reusa la misma función PostgreSQL en modo edición).

- POST `/api/afiliacion/validar-documento`
  - Valida duplicados de documento. Puede recibir `excluir_id`.

- GET `/api/afiliacion/catalogos`
  - Obtiene catálogos dinámicos (tablas maestras) para el front.

- GET `/api/afiliacion/diagnosticos/buscar?q=...&limite=...`
  - Búsqueda CIE-10.

- POST `/api/afiliacion/crear-externo-rapido`
  - Alta rápida de paciente externo (mínimos datos).

- Endpoints de prueba/adicionales (en `main.py`):
  - GET `/api/afiliacion/pacientes`
  - GET `/api/afiliacion/pacientes/todos`
  - GET `/api/afiliacion/pacientes/documento/{numero_doc}`
  - GET `/api/afiliacion/pacientes/historia/{historia_clinica}`
  - GET `/api/afiliacion/estadisticas`
  - POST `/api/afiliacion/buscar`
  - NOTA: Existe una segunda definición duplicada de `POST /api/afiliacion/buscar-pacientes` con firma distinta; se recomienda consolidar.

## Flujo general
1. Front (páginas):
   - `GET /medical/afiliacion` → `templates/medical/afiliacion/afiliacion_lista.html`
   - `GET /medical/afiliacion/nueva|nuevo` → `templates/medical/afiliacion/afiliacion.html`
   - `GET /medical/afiliacion/editar/{paciente_id}` → `templates/medical/afiliacion/afiliacion.html`

2. API → Servicio:
   - `main.py` delega en `afiliacion_manager` (`services/afiliacion_service.py`).

3. Servicio → Base de Datos:
   - Usa un pool a PostgreSQL desde `services/database_config.py` (no cubierto aquí) vía `asyncpg`.

## Uso de Base de Datos
El módulo USA funciones/procedimientos de PostgreSQL para operaciones principales, no inserciones directas manuales.

- Búsqueda de pacientes:
  ```sql
  SELECT resultado FROM fn_buscar_pacientes_afiliacion($1::JSONB, $2, $3)
  ```
  Referencia: `services/afiliacion_service.py` → `buscar_pacientes_afiliacion()`.

- Afiliar/crear/actualizar paciente:
  ```sql
  SELECT public.fn_afiliar_paciente_completo($1::JSONB)
  ```
  Referencia: `services/afiliacion_service.py` → `afiliar_paciente_completo()`.

- Validación de documento (consulta SELECT simple, no función):
  ```sql
  SELECT id, nombres, apellidos, fecha_nacimiento
  FROM pacientes
  WHERE tipo_doc = $1 AND numero_doc = $2 AND activo = 'S'
  [AND id != $3]
  ```
  Referencia: `services/afiliacion_service.py` → `validar_documento_existente()`.

- Catálogos (consulta agregada JSON, no función):
  Consulta sobre `adm_tabla` y `adm_elemento` armando JSON con `json_agg/json_build_object`.
  Referencia: `services/afiliacion_service.py` → `obtener_catalogos()`.

- Diagnósticos CIE-10 (consulta SELECT con relevancia, no función):
  Referencia: `services/afiliacion_service.py` → `buscar_diagnosticos()`.

## Mapeos y validaciones clave
- `afiliar_paciente_completo()` realiza un mapeo desde los campos del front a los esperados por la función PostgreSQL e incluye validaciones de longitud y normalizaciones.
- Se fija `estado = '01'` y `activo = 'S'` antes de invocar la función (ajuste temporal documentado en el código).
- `tipo_admision` se maneja para tabla `pacientes_admision` (no debe mezclarse con `pacientes`).

## Consideraciones
- Asegurar que el pool de conexiones esté inicializado (`db_manager.init_pool()` en `main.py` lifespan).
- Revisar la duplicidad de `POST /api/afiliacion/buscar-pacientes` y el archivo `routes/afiliacion_web_routes.py` (no registra router correctamente).
