from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

# This configuration class uses Pydantic's BaseSettings to load environment variables and provide type validation.
class Settings(BaseSettings):
    # App 
    APP_NAME: str = "DevDocxAI"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # Database:
    DATABASE_URL: str
    DATABASE_ECHO: bool = False
    DATABASE_SSL: bool = False   # dev=False, prod=True (Neon)

    # JWT:
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24
    ENCRYPTION_KEY: str

    # GitHub OAuth:
    GITHUB_CLIENT_ID: str
    GITHUB_CLIENT_SECRET: str
    GITHUB_REDIRECT_URI: str

    # LLM 
    GROQ_API_KEY: str
    GROQ_API_KEY_2: str = ""
    GROQ_API_KEY_3: str = ""
    GROQ_API_KEY_4: str = ""
    GROQ_API_KEY_5: str = ""
    GROQ_API_KEY_6: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"

    # Vector Database:
    QDRANT_URL: str = "http://localhost:6333"  # local Docker (dev) / Qdrant Cloud URL (prod)
    QDRANT_API_KEY: str = ""                   # empty for local, set for Qdrant Cloud
    QDRANT_COLLECTION_NAME: str = "devdocai_docs"

    # Tavily Search api
    TAVILY_API_KEY: str = ""

    # Redis:
    REDIS_URL: str

    # AWS S3:
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_REGION: str = "ap-south-1"
    S3_BUCKET_NAME: str

    #LangSmith:
    LANGCHAIN_API_KEY: str
    LANGCHAIN_TRACING_V2: bool = True
    LANGCHAIN_PROJECT: str = "DevDocxAI"

    # Frontend Url:
    FRONTEND_URL: str = "http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"  # ← yeh add karo
    )

# Use LRU cache to ensure that settings are loaded only once and reused across the application
@lru_cache()
def get_settings() -> Settings:
    return Settings()

