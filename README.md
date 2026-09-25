# DevDocAI 📄

>DevDocxAi is a production-grade multi-agent LangGraph system that automatically generates and updates engineering documentation from your GitHub codebase.

![Python](https://img.shields.io/badge/Python-3.12-blue?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green?style=flat-square&logo=fastapi)
![LangGraph](https://img.shields.io/badge/LangGraph-0.2-orange?style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=flat-square&logo=postgresql)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)
![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen?style=flat-square)

---




---
🌐 Live: devdocai.nevinbali.me

## 🚨 The Problem:

Every engineering team has the same dirty secret — **the docs are lying.**

Not intentionally. Code moves fast, documentation doesn't.

- New dev joins → 2 weeks reading outdated wikis
- Senior engineers constantly interrupted with "what does this do?"
- PR gets merged → docs never updated
- Generic RAG chatbots don't understand code *structure*

**DevDocAI fixes this.**

---

## ✨ What It Does

- 🔍 **Connects to your GitHub repo** via OAuth
- 🌳 **Parses your codebase at the AST level** — understands functions, classes, modules
- 📝 **Auto-generates structured documentation** per module and function
- 🔄 **Updates docs on every PR merge** via GitHub webhooks (diff-aware — only changed files re-documented)
- 👀 **Human-in-the-Loop review** — you approve before anything goes live
- 💬 **Onboarding chatbot** — new devs ask questions, get answers from live code
- ⚡ **Multi-key LLM pool** — round-robin across up to 10 Groq keys for speed + 429 resilience
- 📏 **Repo size gate** — rejects repos with 40+ Python files up front instead of timing out

---

## 🤖 Agent Pipeline

```
START
  ↓
compute_diff         ← diffs against last processed commit (only changed files)
  ↓
codebase_parser      ← AST-level parsing of GitHub repo
  ↓
doc_generator        ← LLM generates structured docs per module (batched, multi-key pool)
  ↓
brave_researcher     ← enriches with external context via Tavily (libraries, best practices)
  ↓
HITL checkpoint      ← dev reviews generated docs before publish (interrupt_before human_review)
  ↓
doc_publisher        ← saves to DB + batch upserts vectors to Qdrant
  ↓
END

Parallel → onboarding_chatbot ← RAG over vector store for new devs
Webhook → pr_watcher           ← GitHub webhook re-triggers on every PR merge

```

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Agent Framework** | LangGraph (multi-agent, HITL, checkpointing) |
| **Backend** | FastAPI + Python 3.12 |
| **Frontend** | Next.js + Tailwind CSS + Daisy UI|
| **LLM** | Groq — openai/gpt-oss-120b (multi-key round-robin pool) |
| **Embeddings** | sentence-transformers all-MiniLM-L6-v2 (384-dim) |
| **Vector DB** | Qdrant |
| **Database** | PostgreSQL (Neon prod ) |
| **Cache** | Redis (Upstash) |
| **Web Search** | Tavily Search API |
| **Observability** | LangSmith |
| **Tool Protocol** | MCP (Model Context Protocol) |
| **Auth** | JWT + GitHub OAuth |
| **Package Manager** | uv |
| **Deployment** | AWS ECR + ECS Fargate |
| **CI/CD** | GitHub Actions |
| **34 Themes Support** | Daisy UI |
---

## 📁 Project Structure

```
devdocai/
├── backend/
│   ├── agents/
│   │   ├── codebase_parser.py      ← AST-level parsing of GitHub repo
│   │   ├── compute_diff.py         ← diff vs last_processed_commit
│   │   ├── doc_generator.py        ← batched LLM doc generation (multi-key pool)
│   │   ├── brave_researcher.py     ← Tavily enrichment
│   │   ├── doc_publisher.py        ← DB save + Qdrant batch upsert
│   │   └── onboarding_chatbot.py   ← RAG chatbot over vector store
│   ├── auth/
│   │   ├── jwt.py                  ← JWT create/verify
│   │   ├── github_oauth.py         ← GitHub OAuth flow
│   │   └── routes.py               ← HTTP layer only
│   ├── chat/
│   │   └── routes.py               ← onboarding chatbot endpoints
│   ├── pipeline/
│   │   └── routes.py               ← pipeline run + SSE streaming endpoints
│   ├── repos/
│   │   └── routes.py               ← repo connect/run endpoints (40-file gate here)
│   ├── db/
│   │   ├── database.py             ← async PostgreSQL engine
│   │   └── models.py               ← SQLAlchemy ORM models
│   ├── repositories/
│   │   ├── user_repository.py      ← user DB queries
│   │   └── repo_repository.py      ← repo/run DB queries
│   ├── schemas/
│   │   ├── auth_schema.py
│   │   ├── chat_schemas.py
│   │   ├── pipeline_schemas.py
│   │   └── repo_schemas.py         ← Pydantic v2 request/response models
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── chat_service.py
│   │   ├── pipeline_service.py     ← background pipeline orchestration
│   │   └── repo_service.py         ← business logic layer
│   ├── utils/
│   │   ├── groq_pool.py            ← multi-key round-robin Groq pool
│   │   ├── helper_auth.py          ← bcrypt password helpers
│   │   └── encryption.py           ← Fernet encryption for tokens
│   ├── mcp/
│   │   └── github_server.py        ← GitHub tools for LangGraph agents
│   ├── graph/
│   │   ├── state.py                ← shared pipeline state
│   │   ├── pipeline.py             ← LangGraph builder + edges
│   │   └── hitl.py                 ← human-in-the-loop helpers
│   ├── webhooks/
│   │   └── github_pr.py            ← PR merge webhook handler
│   ├── cache/
│   │   └── redis_client.py         ← Upstash Redis caching
│   ├── vectorstore/
│   │   ├── embeddings.py           ← HF MiniLM embedding client
│   │   └── qdrant_store.py         ← Qdrant batch upsert/search
│   ├── config.py                   ← all env vars, pydantic-settings
│   ├── create_index.py             ← one-off Qdrant index setup
│   └── main.py                     ← FastAPI app entry point
├── frontend/                       ← Next.js 16 + DaisyUI
│   └── src/
│       ├── app/
│       │   ├── page.tsx            ← landing page
│       │   ├── login/              ← login page
│       │   ├── signup/             ← signup page
│       │   ├── auth/callback/      ← GitHub OAuth callback
│       │   ├── dashboard/          ← connected repos grid
│       │   ├── review/             ← HITL review panel
│       │   ├── chat/               ← onboarding chatbot UI
│       │   ├── blogs/              ← blog listing
│       │   └── theme/              ← theme picker
│       ├── components/
│       │   ├── Navbar.tsx
│       │   ├── PipelineLoader.tsx  ← global pipeline progress modal
│       │   ├── PipelineStrip.tsx   ← per-run progress strip
│       │   ├── ThemeProvider.tsx
│       │   └── ThemeDemoCard.tsx
│       └── lib/
│           ├── api.ts              ← typed API client (ApiError with status)
│           └── validation.ts
└── .github/
    └── workflows/
        └── deploy.yml              ← build → ECR → ECS Fargate deploy

```

---

## 🏛️ Architecture

Clean layered architecture — every layer has one job:

```
Route       →  HTTP only (request / response)
    ↓
Service     →  Business logic
    ↓
Repository  →  DB queries only
    ↓
Database
```

Deployment
```
push → GitHub Actions → ECR (:latest) → ECS Fargate (web + background workers in one task)
```
---

## 🚀 Getting Started

### Prerequisites

- Python 3.12+
- [uv](https://docs.astral.sh/uv/) — fast Python package manager just like pip
- Docker (for local PostgreSQL)
- A GitHub OAuth App ([create one here](https://github.com/settings/developers))
- Node 20+ (for the frontend)

### 1. Clone the repo

```bash
git clone https://github.com/Nevin100/DevDocxAI.git
cd DevDocxAI/backend
```

### 2. Backend Setup

```bash
cd backend
uv venv
# Windows
.venv\Scripts\activate
# Mac/Linux
source .venv/bin/activate

uv add -r requirements.txt

```

### 3. Setup environment variables

```bash
cp .env.example .env
# Fill in your actual values in .env
```

#### Generate required keys:

```bash
# JWT Secret
python -c "import secrets; print(secrets.token_hex(32))"

# Fernet Encryption Key
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### 4. Start local PostgreSQL (Docker)

```bash
docker run -d \
  --name devdocai_postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=devpassword \
  -e POSTGRES_DB=devdocai \
  -p 5432:5432 \
  -v devdocai_pgdata:/var/lib/postgresql/data \
  postgres:16
```

### 5. Run the server

```bash
## Windows
.venv\Scripts\python.exe -m uvicorn main:app --reload

# Mac/Linux
uvicorn main:app --reload

```

### 6. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

### 7. Open the app

```bash
Frontend:  http://localhost:3000
Swagger:   http://localhost:8000/docs

```
---

## 🔑 Environment Variables

| Variable | Required Now | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon - PostgreSQL connection string with `+asyncpg` |
| `JWT_SECRET_KEY` | ✅ | Random secret for JWT signing |
| `ENCRYPTION_KEY` | ✅ | Fernet key for token encryption |
| `GROQ_API_KEY` | ✅ | From [console.groq.com](https://console.groq.com) |
| `LANGCHAIN_API_KEY` | ✅ | From [smith.langchain.com](https://smith.langchain.com) |
| `GITHUB_CLIENT_ID` | ✅ | GitHub OAuth App |
| `GITHUB_CLIENT_SECRET` | ✅ | GitHub OAuth App |
| `TAVILY_API_KEY` | ✅ | From [tavily.com](https://brave.com/search/api) |
| `GROQ_API_KEY_2 .. GROQ_API_KEY_6` | ⬜ | Optional extra keys — pool round-robins for speed + 429 resilience |
| `MAX_REPO_FILES` | ⬜ | Repo-size gate, default 40 (repos above this return 413) |
| `REDIS_URL` | ✅ | From upstash REDIS URL |

---

## 📊 Database Schema

```
User
 └── Repository
         ├── Document        (DocStatus: PENDING → APPROVED → PUBLISHED)
         └── PipelineRun     (trigger: manual | pr_merge | webhook)
```
repositories.last_processed_commit tracks the diff base so re-runs only re-document changed files.

---

## 🛣️ Roadmap (V1)

| Phase | What | Status |
|---|---|---|
| **Phase 1** | Backend Foundation (FastAPI, DB, Auth, JWT) | ✅ Complete |
| **Phase 2** | GitHub OAuth + MCP Server | ✅ Complete |
| **Phase 3** | LangGraph Core (State, Pipeline, HITL) | ✅ Complete |
| **Phase 4** | Agents (Parser, Generator, Researcher, Chatbot) | ✅ Complete |
| **Phase 5** | Webhooks + Redis Cache | ✅ Complete |
| **Phase 6** | Next.js Frontend | ✅ Complete |
| **Phase 7** | Docker + ECR/ECS Fargate + CI/CD | ✅ Complete |

## 🛣️ Roadmap (V2)
| Phase | What | Status |
|---|---|---|
| **Phase I** | JavaScript, TypeScript, Go, Java, C++ support | 🔜 Planned |
| **Phase II** | Large-repo support (40+ files) | 🔜 Planned |
---

## 📖 Blog Series

Following the build in public on dev.to:

- [Part 1 — Foundation: Backend, Auth, DB, GitHub OAuth, MCP](https://dev.to/nevin100/building-devdocai-an-ai-that-writes-your-docs-part-1-foundation-5cjh)
- [Part 2 — LangGraph Core + Agents + RAG](https://dev.to/nevin100/-building-devdocai-an-ai-that-writes-your-docs-automatically-part-2-langgraph-core-agents--3j27)
- [Part 3 — Webhooks + Redis Cache](https://dev.to/nevin100/building-devdocai-a-production-multi-agent-langgraph-system-part-3-github-webhooks-redis-1mgk)
- [Part 4 — Coming Back, Closing Out the Backend, and Laying Down the Frontend](https://dev.to/nevin100/building-devdocai-a-production-multi-agent-langgraph-system-part-4-coming-back-closing-out-5aa9)
- [Part 5 — Backend Closed Out, GitHub OAuth Working End-to-End](https://dev.to/nevin100/building-devdocai-a-production-multi-agent-langgraph-system-part-5-backend-closed-out-github-216o)
- [Part 6 — The Full Loop Works. Now: Deployment...](https://dev.to/nevin100/building-devdocai-part-6-the-full-loop-works-now-deployment-3a49)
- [Part 7 — From Laptop to Production: The Deployment Gauntlet](https://dev.to/nevin100/building-devdocai-a-production-multi-agent-langgraph-system-part-7-from-laptop-to-production-3p4m)
---

## 🤝 Contributing

This project is completed i.e The first version is now live!!. Feel free to open issues or PRs.

---

<div align="center">
  <strong>Built by <a href="https://github.com/Nevin100">Nevin Bali</a></strong>
  <br/>
  <em>Building in public 🚀</em>
</div>