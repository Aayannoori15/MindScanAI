from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(ROOT / ".env"), extra="ignore")

    app_name: str = "MindScan AI"
    app_env: str = "development"
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 1440
    database_url: str = "sqlite:///./mindscan.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    model_dir: str = "backend/models"
    use_mock_inference: bool = True
    crisis_stress_threshold: float = 30.0
    crisis_severity_label: str = "Severe_Stress"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def models_path(self) -> Path:
        p = Path(self.model_dir)
        return p if p.is_absolute() else ROOT / p


settings = Settings()
