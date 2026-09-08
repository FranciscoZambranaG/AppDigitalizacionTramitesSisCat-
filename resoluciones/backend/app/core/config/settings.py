"""
Configuracion global del backend del modulo Resoluciones.

Mismo patron que `proyecto-erp/backend/app/core/config/settings.py` (pydantic-settings,
computed fields para ISSUER / JWKS_URL / TOKEN_URL) para que el equipo del ERP lo
reconozca al integrar. Los valores por defecto de Keycloak coinciden con los del ERP
y los de la app movil: realm `alcaldia-idec`, cliente `app-idec`.
"""
from typing import Optional

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Resoluciones - Backend"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api"

    # Base de datos. SQLite por defecto para dev (no requiere instalar nada).
    # Para integrar con la BD del ERP: postgresql://usuario:clave@host:5432/erp
    DATABASE_URL: str = "sqlite:///./resoluciones.db"

    # Schema de PostgreSQL propio de este dominio (convencion del ERP:
    # "un schema por dominio"). Se ignora en SQLite.
    DB_SCHEMA: str = "resoluciones"

    # Keycloak — mismos valores que la app movil y el proyecto-erp.
    KEYCLOAK_URL: str = "https://auth.catastrocbba.com"
    KEYCLOAK_REALM: str = "alcaldia-idec"
    KEYCLOAK_CLIENT_ID: str = "app-idec"
    KEYCLOAK_CLIENT_SECRET: str = ""
    KEYCLOAK_TIMEOUT_SECONDS: int = 20

    # CORS: origen(es) del frontend web. Coma-separado.
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    PORT: int = 8080

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @computed_field
    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")

    @computed_field
    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.FRONTEND_ORIGIN.split(",") if o.strip()]

    @computed_field
    @property
    def ISSUER(self) -> str:
        return f"{self.KEYCLOAK_URL.rstrip('/')}/realms/{self.KEYCLOAK_REALM}"

    @computed_field
    @property
    def JWKS_URL(self) -> str:
        return f"{self.ISSUER}/protocol/openid-connect/certs"

    @computed_field
    @property
    def TOKEN_URL(self) -> str:
        return f"{self.ISSUER}/protocol/openid-connect/token"


settings = Settings()
