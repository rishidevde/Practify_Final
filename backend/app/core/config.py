from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "Practify"
    api_prefix: str = "/api"

    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176"

    sqlite_path: str = "practify.db"

    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 60 * 24 * 7  # 7 days


settings = Settings()

