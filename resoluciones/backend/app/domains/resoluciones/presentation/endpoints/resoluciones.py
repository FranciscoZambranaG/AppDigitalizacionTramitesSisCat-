"""
Endpoints REST del dominio Resoluciones. `/api/resoluciones/...`
(el prefijo /api lo pone main.py, y /resoluciones el registry).

Flujo:
- POST   /resoluciones                 (movil o web) subir paginas escaneadas
- GET    /resoluciones                 lista del usuario autenticado
- GET    /resoluciones/{id}            detalle + estado de tabla
- GET    /resoluciones/{id}/paginas/{orden}   imagen de una pagina
- PUT    /resoluciones/{id}/tabla      guardar el editor de tabla (solo web)
- DELETE /resoluciones/{id}            baja logica
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, Request, Response, UploadFile, status

from app.core.security.token_verifier import VerifiedUser
from app.domains.resoluciones.application.use_cases import (
    CrearResolucionUseCase,
    EliminarResolucionUseCase,
    GuardarTablaUseCase,
    ListarResolucionesUseCase,
    ObtenerResolucionUseCase,
)
from app.domains.resoluciones.presentation.deps import (
    get_crear_resolucion_use_case,
    get_current_user,
    get_eliminar_resolucion_use_case,
    get_guardar_tabla_use_case,
    get_listar_resoluciones_use_case,
    get_obtener_resolucion_use_case,
)
from app.domains.resoluciones.presentation.schemas import (
    GuardarTablaRequest,
    ResolucionDetalleOut,
    ResolucionResumenOut,
)

router = APIRouter(tags=["resoluciones"])


def _base_paginas_url(request: Request, id_resolucion: str) -> str:
    """URL absoluta de `.../resoluciones/{id}/paginas` (sin el `{orden}` final)."""
    full = str(request.url_for("obtener_pagina", id_resolucion=id_resolucion, orden=0))
    return full.rsplit("/", 1)[0]


@router.post("", response_model=ResolucionDetalleOut, status_code=status.HTTP_201_CREATED)
async def crear_resolucion(
    request: Request,
    nro_resolucion: str = Form(...),
    nombre: str = Form(...),
    paginas: list[UploadFile] = File(...),
    user: VerifiedUser = Depends(get_current_user),
    uc: CrearResolucionUseCase = Depends(get_crear_resolucion_use_case),
) -> ResolucionDetalleOut:
    archivos = [(f.content_type or "", f.filename or "", await f.read()) for f in paginas]
    creada = uc.execute(
        nro_resolucion=nro_resolucion,
        nombre=nombre,
        usuario_sub=user.sub,
        paginas=archivos,
    )
    base = _base_paginas_url(request, creada.id_resolucion or "")
    return ResolucionDetalleOut.from_entity(creada, base_url=base)


@router.get("", response_model=list[ResolucionResumenOut])
def listar_resoluciones(
    user: VerifiedUser = Depends(get_current_user),
    uc: ListarResolucionesUseCase = Depends(get_listar_resoluciones_use_case),
) -> list[ResolucionResumenOut]:
    return [ResolucionResumenOut.from_entity(r) for r in uc.execute(usuario_sub=user.sub)]


@router.get("/{id_resolucion}", response_model=ResolucionDetalleOut)
def obtener_resolucion(
    id_resolucion: str,
    request: Request,
    user: VerifiedUser = Depends(get_current_user),
    uc: ObtenerResolucionUseCase = Depends(get_obtener_resolucion_use_case),
) -> ResolucionDetalleOut:
    r = uc.execute(id_resolucion=id_resolucion, usuario_sub=user.sub)
    base = _base_paginas_url(request, id_resolucion)
    return ResolucionDetalleOut.from_entity(r, base_url=base)


@router.get("/{id_resolucion}/paginas/{orden}", name="obtener_pagina")
def obtener_pagina(
    id_resolucion: str,
    orden: int,
    user: VerifiedUser = Depends(get_current_user),
    uc: ObtenerResolucionUseCase = Depends(get_obtener_resolucion_use_case),
) -> Response:
    mime, data = uc.pagina(id_resolucion=id_resolucion, orden=orden, usuario_sub=user.sub)
    return Response(content=data, media_type=mime)


@router.put("/{id_resolucion}/tabla", response_model=ResolucionDetalleOut)
def guardar_tabla(
    id_resolucion: str,
    body: GuardarTablaRequest,
    request: Request,
    user: VerifiedUser = Depends(get_current_user),
    uc: GuardarTablaUseCase = Depends(get_guardar_tabla_use_case),
) -> ResolucionDetalleOut:
    r = uc.execute(
        id_resolucion=id_resolucion,
        usuario_sub=user.sub,
        tabla=body.tabla,
        estado=body.estado,
    )
    base = _base_paginas_url(request, id_resolucion)
    return ResolucionDetalleOut.from_entity(r, base_url=base)


@router.delete("/{id_resolucion}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_resolucion(
    id_resolucion: str,
    user: VerifiedUser = Depends(get_current_user),
    uc: EliminarResolucionUseCase = Depends(get_eliminar_resolucion_use_case),
) -> Response:
    uc.execute(id_resolucion=id_resolucion, usuario_sub=user.sub)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
