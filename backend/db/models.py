import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import enum
from db.database import Base

#  Enums 
class DocStatus(str, enum.Enum):
    PENDING = "pending"    # just generated, not reviewed
    APPROVED = "approved"   # dev approved via HITL
    REJECTED = "rejected"   # dev rejected, needs regen
    PUBLISHED = "published"  # live in vector store

class RepoStatus(str, enum.Enum):
    CONNECTED = "connected"
    PARSING = "parsing"
    COMPLETED = "completed"
    FAILED = "failed"

# User
class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)  # null if GitHub OAuth only
    github_id: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    github_username: Mapped[str | None] = mapped_column(String(100), nullable=True)
    github_access_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    repos: Mapped[list["Repository"]] = relationship("Repository", back_populates="owner", cascade="all, delete")

# Repository
class Repository(Base):
    __tablename__ = "repositories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    github_repo_id: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)   
    default_branch: Mapped[str] = mapped_column(String(100), default="main")
    webhook_id: Mapped[str | None] = mapped_column(String(100), nullable=True) 
    status: Mapped[RepoStatus]  = mapped_column(SAEnum(RepoStatus), default=RepoStatus.CONNECTED)
    last_parsed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_processed_commit: Mapped[str | None] = mapped_column(String(100), nullable=True)  # SHA of last processed commit
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="repos")
    documents: Mapped[list["Document"]] = relationship("Document", back_populates="repo", cascade="all, delete")
    pipeline_runs: Mapped[list["PipelineRun"]] = relationship("PipelineRun", back_populates="repo", cascade="all, delete")

# Document
class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repo_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("repositories.id"), nullable=False, index=True)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    module_name: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    s3_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[DocStatus]  = mapped_column(SAEnum(DocStatus), default=DocStatus.PENDING, index=True)
    dev_notes: Mapped[str | None] = mapped_column(Text, nullable=True)          # HITL reviewer notes
    vector_id: Mapped[str | None] = mapped_column(String(255), nullable=True)   # ChromaDB/Qdrant doc ID
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    repo: Mapped["Repository"] = relationship("Repository", back_populates="documents")


# PipelineRun
class PipelineRun(Base):
    __tablename__ = "pipeline_runs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repo_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("repositories.id"), nullable=False)
    thread_id: Mapped[str] = mapped_column(String(255), nullable=False)  # LangGraph thread_id
    trigger: Mapped[str] = mapped_column(String(50), default="manual") # "manual" | "pr_merge" | "webhook"
    pr_number: Mapped[int | None] = mapped_column(nullable=True)              # if triggered by PR
    status: Mapped[str] = mapped_column(String(50), default="running") # running | paused | completed | failed
    started_at: Mapped[datetime]  = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationships
    repo: Mapped["Repository"] = relationship("Repository", back_populates="pipeline_runs")