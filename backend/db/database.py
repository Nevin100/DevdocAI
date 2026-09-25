from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from config import get_settings

settings = get_settings()

connect_args = {"ssl": "require"} if settings.DATABASE_SSL else {}

# Engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DATABASE_ECHO,
    pool_size=10, # The number of connections to keep in the pool
    max_overflow=20, # The maximum number of connections to allow in overflow (connections that can be created beyond the pool_size)
    pool_timeout=30, # The time to wait for a connection from the pool
    pool_recycle=280, # The time to recycle a connection
    pool_pre_ping=True, # Test connections before use
    connect_args=connect_args 
)

# Session Factory
async_session_local = async_sessionmaker(
    # Bind the session to the engine
    bind=engine,

    # Don't expire objects after commit
    expire_on_commit=False, 
    
    # Use AsyncSession for async operations
    class_=AsyncSession # Use AsyncSession for async operations
)

# Backwards-compat alias: main.py imports the PascalCase name
AsyncSessionLocal = async_session_local

# Base Class for Models
class Base(DeclarativeBase):
    pass

# Dependency to get DB session
async def get_db():
    async with async_session_local() as session:
        try: 
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback() # Rollback the transaction in case of an exception
            raise e
        
# Function to initialize the database (create tables)
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
