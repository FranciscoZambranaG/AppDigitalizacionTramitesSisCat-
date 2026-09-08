# Módulo Resoluciones

Feature para digitalizar la tabla **"RELACIÓN DE SUPERFICIE"** de las
resoluciones administrativas y volcarla a la **Hoja2** de `plantilla-ph.xlsm`.

Se construye acá pero está pensado para entregarse como un **dominio del ERP**
`github.com/MateoBazo/proyecto-erp` (mismo stack: FastAPI + PostgreSQL + React).

```
resoluciones/
├── backend/    FastAPI (hexagonal). Guarda/lista/entrega resoluciones por usuario.
│              SQLite en dev, PostgreSQL (schema "resoluciones") para integrar.
└── frontend/   Vite + React + Tailwind. Login, lista, OCR en el navegador,
               editor de tabla, generación del .xlsm con SheetJS.
```

## Reparto de responsabilidades

| | Dónde | Qué hace |
|---|---|---|
| **App móvil** (`src/screens/home/ResolucionesScreen.jsx`) | Expo | Escanea las páginas con la cámara + N° de resolución + nombre → **sube** al backend. Lista "mis resoluciones" con su estado. No hace OCR ni Excel. |
| **Backend** (`resoluciones/backend`) | FastAPI :8080 | Guarda las páginas (BLOB) y el estado de la tabla, por usuario (`JWT.sub`). No hace OCR ni interpreta la tabla. |
| **Frontend web** (`resoluciones/frontend`) | Vite :5173 | Lista → abre una resolución → **OCR en el navegador** (`ocr.catastrocbba.com`) → reconstruye la tabla + sugiere roles de columna + detecta Planta → el usuario corrige → **genera el `.xlsm`** (SheetJS, preserva macros). |

## Levantar todo (dev)

```bash
# 1) backend
cd resoluciones/backend && .venv\Scripts\python -m app.main          # :8080

# 2) frontend
cd resoluciones/frontend && npm run dev                              # :5173

# 3) app móvil: EXPO_PUBLIC_ERP_BACKEND_URL=http://<IP-PC>:8080 en .env.local
```

Los tres validan el mismo token de Keycloak (`alcaldia-idec` / `app-idec`).

Detalle en `backend/README.md` y `frontend/README.md`, incluida la receta de
integración al `proyecto-erp`.
