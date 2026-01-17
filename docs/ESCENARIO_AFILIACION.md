# Escenario de Prueba: Afiliación

Este documento describe un escenario paso a paso para validar el módulo de Afiliación usando la API. Ejemplos con `curl`.

## Pre-requisitos
- Servidor FastAPI en ejecución.
- Autenticación configurada (si aplica). Si usas cookie `access_token`, agrega `-H "Cookie: access_token=..."` a los ejemplos.

## 1) Obtener catálogos
```bash
curl -s http://localhost:8000/api/afiliacion/catalogos | jq
```

## 2) Validar documento disponible
```bash
curl -s -X POST http://localhost:8000/api/afiliacion/validar-documento \
  -H "Content-Type: application/json" \
  -d '{
    "tipo_doc": "DNI",
    "numero_doc": "12345678"
  }' | jq
```

## 3) Crear paciente externo rápido
```bash
curl -s -X POST http://localhost:8000/api/afiliacion/crear-externo-rapido \
  -H "Content-Type: application/json" \
  -d '{
    "tipoDocumento": "DNI",
    "numeroDocumento": "12345678",
    "nombres": "MARIA",
    "apellidos": "GONZALEZ",
    "fechaNacimiento": "1990-05-10",
    "sexo": "F",
    "telefono": "+51 999 111 222",
    "email": "maria@example.com",
    "hospital_id": 1
  }' | jq
```

## 4) Buscar pacientes con filtros (nombre/doc)
```bash
curl -s -X POST http://localhost:8000/api/afiliacion/buscar-pacientes \
  -H "Content-Type: application/json" \
  -d '{
    "filtros": { "nombre": "maria" },
    "limite": 10,
    "offset": 0
  }' | jq
```

## 5) Obtener paciente para edición
Usa `paciente_id` devuelto al crear o buscar.
```bash
curl -s http://localhost:8000/api/afiliacion/paciente/1 | jq
```

## 6) Actualizar paciente existente
```bash
curl -s -X PUT http://localhost:8000/api/afiliacion/actualizar/1 \
  -H "Content-Type: application/json" \
  -d '{
    "tipoDocumento": "DNI",
    "numeroDocumento": "12345678",
    "nombres": "MARIA LUISA",
    "apellidos": "GONZALEZ",
    "fechaNacimiento": "1990-05-10",
    "sexo": "F",
    "telefono": "+51 999 111 222",
    "email": "maria@example.com",
    "hospital_id": 1
  }' | jq
```

## 7) Búsqueda de diagnósticos (CIE-10)
```bash
curl -s "http://localhost:8000/api/afiliacion/diagnosticos/buscar?q=F32&limite=10" | jq
```

## 8) Verificaciones esperadas
- __Creación__: respuesta `success: true` y datos con `paciente_id`/`historia_clinica`.
- __Búsqueda__: lista con `data[]` y `pagination.total_registros`.
- __Edición__: `success: true` y datos por pasos `paso1/paso2/...`.
- __Diagnósticos__: lista de códigos/descripciones relevantes.

## Notas
- El alta y la edición utilizan la función PostgreSQL `fn_afiliar_paciente_completo` vía `services/afiliacion_service.py`.
- La búsqueda usa `fn_buscar_pacientes_afiliacion`.
- Algunas utilidades (validación de documento, catálogos, diagnósticos) usan consultas SELECT directas.
