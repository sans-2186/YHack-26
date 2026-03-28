from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    mongo_uri: str | None = None
    mongo_db_name: str = "yhack_invest"

    finnhub_api_key: str | None = None
    fmp_api_key: str | None = None
    news_api_key: str | None = None

    # OpenAI-compatible endpoints (plug K2 / Hermes host here)
    ai_k2_base_url: str | None = None
    ai_k2_api_key: str | None = None
    ai_k2_model: str = "k2-think-v2"

    ai_hermes_base_url: str | None = None
    ai_hermes_api_key: str | None = None
    ai_hermes_model: str = "hermes"

    analysis_cache_ttl_minutes: int = 45
    http_timeout_seconds: float = 12.0
    cors_origins: str = "http://localhost:3000"


settings = Settings()


def cors_origin_list() -> list[str]:
    return [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
