"""
Modelos ORM del dominio Resoluciones.

Convenciones del proyecto-erp (CLAUDE.md seccion 6): snake_case, tablas en
plural, PK `id_<entidad>`, FK con el mismo nombre, `fecha_creacion` /
`fecha_actualizacion` en toda tabla, soft delete (`fecha_eliminacion`) en las de
relevancia. En PostgreSQL las tablas viven en el schema propio del dominio
(`settings.DB_SCHEMA` = "resoluciones"); en SQLite (dev) no hay schema.

Las imagenes de las paginas se guardan como BLOB en la misma BD (columna
`imagen`). Si se quisiera moverlas a disco / almacenamiento de objetos, se
cambia solo `sql_resolucion_repository.py` (la interfaz del puerto no expone que
son BLOB).
"""
from __future__ import annotations

import uuid

from sqlalchemy import (
    JSON,
    DateTime,
    ForeignKey,
    Integer,
    LargeBinary,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.config import settings
from app.core.database.connection import Base

_SCHEMA = None if settings.is_sqlite else settings.DB_SCHEMA


def _table_args() -> dict:
    return {} if _SCHEMA is None else {"schema": _SCHEMA}


def _fk(target: str) -> str:
    # "resoluciones.id_resolucion" -> "resoluciones.resoluciones.id_resolucion" en Postgres
    return target if _SCHEMA is None else f"{_SCHEMA}.{target}"


def _uuid() -> str:
    return str(uuid.uuid4())


class ResolucionModel(Base):
    __tablename__ = "resoluciones"
    __table_args__ = _table_args()

    id_resolucion: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    nro_resolucion: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="pendiente_ocr", index=True)
    usuario_sub: Mapped[str] = mapped_column(String(64), nullable=False, index=True)

    # Estado del editor de tabla de la web (opaco para el backend).
    tabla: Mapped[dict | None] = mapped_column(JSON(none_as_null=True), nullable=True)

    fecha_creacion: Mapped["DateTime"] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    fecha_actualizacion: Mapped["DateTime"] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
    fecha_eliminacion: Mapped["DateTime | None"] = mapped_column(DateTime, nullable=True, index=True)

    paginas: Mapped[list["PaginaModel"]] = relationship(
        back_populates="resolucion",
        cascade="all, delete-orphan",
        order_by="PaginaModel.orden",
    )


class PaginaModel(Base):
    __tablename__ = "resolucion_paginas"
    __table_args__ = _table_args()

    id_pagina: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    id_resolucion: Mapped[str] = mapped_column(
        String(36), ForeignKey(_fk("resoluciones.id_resolucion"), ondelete="CASCADE"), nullable=False, index=True
    )
    orden: Mapped[int] = mapped_column(Integer, nullable=False)
    mime: Mapped[str] = mapped_column(String(40), nullable=False)
    nombre_archivo: Mapped[str | None] = mapped_column(Text, nullable=True)
    imagen: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)

    fecha_creacion: Mapped["DateTime"] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    resolucion: Mapped["ResolucionModel"] = relationship(back_populates="paginas")
