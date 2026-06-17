from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    AI_API_KEY :str
    AI_ENDPOINT: str
    AI_MODEL: str = "llama-3.3-70b-versatile"
    FASTAPI_SECRET: str
    DATABASE_URL: str
    FRONTEND_URL: str = "http://localhost:3000"
    TAVILY_API_KEY: str
    RESEND_API_KEY: str
    RESEND_FROM_EMAIL: str

settings = Settings()