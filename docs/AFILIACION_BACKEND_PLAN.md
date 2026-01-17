# Plan de Desacoplamiento Backend Afiliación (Referencia técnica)

Este documento sirve como guía de referencia para separar el backend del módulo de Afiliación del frontend, definiendo endpoints, contratos, responsabilidades, mapeos a funciones de PostgreSQL y un plan de acción técnico. La meta es que el frontend consuma un backend estable y bien definido, mientras el backend implementa la lógica y el acceso a datos de forma desacoplada.


## 1) Objetivos
- Establecer contratos claros de API para Afiliación.
- Desacoplar rutas (FastAPI Routers), servicios y acceso a datos (DB/repositories).
- Confirmar el uso de funciones PostgreSQL para operaciones críticas.
- Proveer un plan de acción para migrar sin romper el front actual.


## 2) Arquitectura propuesta (capas)
- Capas y responsabilidades:
  - Router (`routes/afiliacion_router.py`): define endpoints y validaciones mínimas de entrada (Pydantic), sin lógica de negocio.
  - Service (`services/afiliacion_service.py`): orquesta reglas de negocio y transformación de datos.
  - Repository/DB (`services/db_afiliacion.py` o `services/repositories/afiliacion_repository.py`): invoca SQL y funciones PostgreSQL.
  - Infra DB (`services/database_config.py`): pool, lifespan, manejo de transacciones.
  - Middleware (`middleware/auth_middleware.py`): autenticación/autorización.

- Inicialización recomendada en `main.py`:
  - Registrar routers con `app.include_router(afiliacion_router, prefix="/api/afiliacion", tags=["Afiliación"])`.
  - Configurar lifespan para abrir/cerrar pool de DB.


## 3) Endpoints Backend (Afiliación)
Prefijo base: `/api/afiliacion`

- GET `/test`
  - Salud del módulo. Respuesta: `{ success: true, message: string }`.

- GET `/paciente/{paciente_id}`
  - Obtener datos de paciente por ID para edición/visualización.
  - Respuesta: `{ success: true, data: { paso1, paso2, ... } }`.

- POST `/buscar-pacientes`
  - Buscar pacientes con filtros y paginación.
  - Body: `{ filtros: object, pagina?: number, limite?: number }`.
  - Respuesta: `{ success: true, data: [ ... ], pagination: { total_registros, pagina, limite } }`.
  - Nota: había duplicado con diferentes firmas; se consolidará en uno solo.

- POST `/crear`
  - Crear paciente (flujo completo) a través de función PostgreSQL.
  - Body: `{ datos: object }` (ver contrato abajo).
  - Respuesta: `{ success: true, data: { paciente_id, historia_clinica, ... } }`.

- PUT `/actualizar/{paciente_id}`
  - Actualizar paciente (flujo completo) a través de función PostgreSQL.
  - Body: `{ datos: object }`.
  - Respuesta: `{ success: true, data: { paciente_id, historia_clinica, ... } }`.

- POST `/validar-documento`
  - Verifica unicidad/uso de documento.
  - Body: `{ tipo_documento: string, numero_documento: string }`.
  - Respuesta: `{ success: true, existe: boolean, detalle?: object }`.

- GET `/catalogos`
  - Devuelve catálogos dinámicos (sexos, tipos documento, parentesco, etc.).
  - Respuesta: `{ success: true, data: { catalogo1: [...], catalogo2: [...] } }`.

- GET `/diagnosticos/buscar?q=...&limite=...`
  - Búsqueda de CIE-10.
  - Respuesta: `{ success: true, data: [ { codigo, descripcion } ] }`.

- POST `/crear-externo-rapido`
  - Alta rápida de paciente externo (mínimos datos).
  - Body: `{ nombres, apellidos, documento, ... }`.
  - Respuesta: `{ success: true, data: { paciente_id, historia_clinica } }`.


## 4) Contratos (request/response) sugeridos
Notas:
- Mantener compatibilidad con el front actual donde sea posible.
- Utilizar Pydantic para validaciones.

- Buscar pacientes (POST `/buscar-pacientes`)
  - Request:
    ```json
    {
      "filtros": {
        "nombres": "string?",
        "apellidos": "string?",
        "numero_documento": "string?",
        "historia_clinica": "string?",
        "fecha_nacimiento": "YYYY-MM-DD?",
        "sexo": "M|F|O?",
        "otros": {}
      },
      "pagina": 1,
      "limite": 20
    }
    ```
  - Response:
    ```json
    {
      "success": true,
      "data": [
        {
          "paciente_id": 123,
          "nombres": "...",
          "apellidos": "...",
          "numero_documento": "...",
          "historia_clinica": "...",
          "edad": 30,
          "sexo": "M"
        }
      ],
      "pagination": { "total_registros": 250, "pagina": 1, "limite": 20 }
    }
    ```

- Crear/Actualizar (POST `/crear`, PUT `/actualizar/{paciente_id}`)
  - Request (`datos` mapeado al formato esperado por `fn_afiliar_paciente_completo`):
    ```json
    {
      "datos": {
        "paciente": { "nombres": "...", "apellidos": "...", "sexo": "M|F|O", "fecha_nacimiento": "YYYY-MM-DD", "documento": { "tipo": "DNI", "numero": "..." } },
        "direccion": { "ubigeo": "...", "via": "...", "numero": "..." },
        "contacto": { "telefono": "...", "email": "..." },
        "seguro": { "plan": "...", "codigo": "..." },
        "responsable": { "parentesco": "...", "documento": { "tipo": "DNI", "numero": "..." } },
        "otros": { }
      }
    }
    ```
  - Response:
    ```json
    { "success": true, "data": { "paciente_id": 123, "historia_clinica": "000123" } }
    ```

- Validar documento (POST `/validar-documento`)
  - Request: `{ "tipo_documento": "DNI", "numero_documento": "00000000" }`
  - Response: `{ "success": true, "existe": false }`

- Catálogos (GET `/catalogos`)
  - Response: `{ "success": true, "data": { "sexos": [ ... ], "tipos_documento": [ ... ], "parentescos": [ ... ] } }`

- Diagnósticos (GET `/diagnosticos/buscar`)
  - Response: `{ "success": true, "data": [ { "codigo": "F32.0", "descripcion": "Episodio depresivo leve" } ] }`


## 5) Mapeo a Base de Datos (PostgreSQL)
- Funciones principales (ya utilizadas):
  - `fn_buscar_pacientes_afiliacion(filtros JSONB, limite INT, offset INT)` → Endpoint: POST `/buscar-pacientes`.
  - `fn_afiliar_paciente_completo(payload JSONB)` → Endpoints: POST `/crear`, PUT `/actualizar/{paciente_id}`.

- Consultas directas (SELECT):
  - Validación documento → POST `/validar-documento`.
  - Catálogos → GET `/catalogos`.
  - Diagnósticos (CIE-10) → GET `/diagnosticos/buscar`.

- Recomendación: encapsular SQL en `repositories` para testear y reutilizar.


## 5.1) Funciones actuales confirmadas en código
- Archivo: `services/afiliacion_service.py`
  - Búsqueda de pacientes:
    - Query actual:
      ```sql
      SELECT resultado FROM fn_buscar_pacientes_afiliacion($1::JSONB, $2, $3)
      ```
    - Uso: método `buscar_pacientes_afiliacion(filtros, pagina, limite)` invoca la función con filtros procesados (JSONB), límite y offset.

  - Afiliación (crear/actualizar paciente):
    - Query actual:
      ```sql
      SELECT public.fn_afiliar_paciente_completo($1::JSONB)
      ```
    - Uso: método `afiliar_paciente_completo(datos)` mapea el payload del front al formato esperado por la función y procesa el resultado.

  - Utilidades con SELECT directo:
    - Validación de documento: `validar_documento_existente()` ejecuta un `SELECT` parametrizado para verificar existencia.
    - Catálogos: `obtener_catalogos()` arma múltiples `SELECT` para listas de apoyo.
    - Diagnósticos CIE-10: `buscar_diagnosticos()` ejecuta un `SELECT` filtrando por `q` y `limite`.

Notas:
- Estas referencias provienen del código actual y garantizan que el backend ya está alineado con el uso de funciones PostgreSQL indicado.
- El plan de desacoplamiento migrará estas llamadas a una capa `repositories/afiliacion_repository.py` sin cambiar los contratos públicos.


## 6) Plan de acción (paso a paso)
- Paso 1: Crear `routes/afiliacion_router.py` con `APIRouter` y mover endpoints desde `main.py`.
- Paso 2: Consolidar `POST /buscar-pacientes` en una sola ruta con un único contrato.
- Paso 3: Extraer acceso a datos a `services/repositories/afiliacion_repository.py`:
  - Métodos: `buscar_pacientes()`, `afiliar_paciente_completo()`, `validar_documento()`, `obtener_catalogos()`, `buscar_diagnosticos()`.
- Paso 4: Mantener `services/afiliacion_service.py` como capa de negocio (mapeos/validaciones previas a DB).
- Paso 5: Implementar lifespan en `main.py` para iniciar y cerrar pool de DB con logging.
- Paso 6: Añadir modelos Pydantic en `models/afiliacion.py` para requests/responses.
- Paso 7: Añadir pruebas (unitarias para service y repository, de integración para router) con `pytest`.
- Paso 8: Documentar OpenAPI/Swagger con ejemplos y descripciones en schemas.
- Paso 9: Revisar seguridad (middleware, scopes/roles por endpoint).


## 7) Estructura de archivos sugerida
```
project/
  main.py
  middleware/
    auth_middleware.py
  models/
    afiliacion.py
  routes/
    afiliacion_router.py
  services/
    afiliacion_service.py
    database_config.py
    repositories/
      afiliacion_repository.py
  docs/
    AFILIACION.md
    AFILIACION_BACKEND_PLAN.md
    ESCENARIO_AFILIACION.md
```


## 8) Reglas de versionado y cambios
- Versionar el API: `v1` en prefijo opcional (`/api/v1/afiliacion`).
- Marcar rutas antiguas como deprecated con periodo de transición.
- Mantener compatibilidad de respuesta (campos existentes) en cambios menores.


## 9) Seguridad y control de acceso
- Autenticación vía middleware (`middleware/auth_middleware.py`).
- Autorización por rol/perfil (p.ej., `role: afiliaciones-editor`).
- Logging y auditoría de acciones críticas (crear/actualizar paciente).
- Validación estricta de entrada con Pydantic.


## 10) Errores y manejo de respuestas
- Convención de error:
  - 400: validación.
  - 401/403: auth/autz.
  - 404: recursos inexistentes.
  - 409: conflictos (documento ya existente).
  - 500: errores inesperados.
- Formato de error:
  ```json
  { "success": false, "error": { "code": "string", "message": "string", "details": {} } }
  ```


## 11) Pruebas y checklist de aceptación
- Unitarias (service): mapeo a `fn_afiliar_paciente_completo`, normalización de filtros.
- Unitarias (repository): SQL parametrizado y manejo de nulls.
- Integración (router): contratos, códigos HTTP.
- Smoke test: `/test`, `/catalogos`, `/diagnosticos/buscar`.
- E2E: crear → buscar → editar → buscar diagnósticos → validar documento.


## 12) Cronograma sugerido
- Día 1: Router + consolidación de búsqueda + modelos Pydantic.
- Día 2: Repository + service ajustado + lifespan DB.
- Día 3: Pruebas unitarias/integración + documentación OpenAPI.
- Día 4: Ajustes finales, deprecated/compatibilidad, checklist E2E.


## 13) Notas finales
- Mantener `services/afiliacion_service.py` como única vía hacia DB a corto plazo para no romper el front; introducir repository gradualmente.
- Cualquier cambio en contratos debe reflejarse en `docs/AFILIACION.md` y `docs/ESCENARIO_AFILIACION.md`.
