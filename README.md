# DevDocxAI 🤖📄

>DevDocxAi is a production-grade multi-agent LangGraph system that automatically generates and updates engineering documentation from your GitHub codebase.

![Python](https://img.shields.io/badge/Python-3.12-blue?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green?style=flat-square&logo=fastapi)
![LangGraph](https://img.shields.io/badge/LangGraph-0.2-orange?style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=flat-square&logo=postgresql)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)
![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen?style=flat-square)

---

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
- 🔄 **Updates docs on every PR merge** via GitHub webhooks
- 👀 **Human-in-the-Loop review** — you approve before anything goes live
- 💬 **Onboarding chatbot** — new devs ask questions, get answers from live code

---

## 🤖 Agent Pipeline

```
START
  ↓
codebase_parser      ← AST-level parsing of GitHub repo
  ↓
doc_generator        ← LLM generates structured docs per module/function
  ↓
tavily_researcher    ← enriches with external context (libraries, best practices)
  ↓
HITL checkpoint      ← dev reviews generated docs before publish
  ↓
doc_publisher        ← saves to DB + updates vector store
  ↓
pr_watcher           ← GitHub webhook re-triggers on every PR merge
  ↓
END

Parallel → onboarding_chatbot ← RAG over vector store for new devs
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Agent Framework** | LangGraph (multi-agent, HITL, checkpointing) |
| **Backend** | FastAPI + Python 3.12 |
| **Frontend** | Next.js + Tailwind CSS + Daisy UI|
| **LLM** | Groq — openai/gpt-oss-120b |
| **Embeddings** | Cohere embed-english-v3.0 |
| **Vector DB** | Qdrant |
| **Database** | PostgreSQL (Neon prod ) |
| **Cache** | Redis (Upstash) |
| **Storage** | AWS S3 |
| **Web Search** | Tavily Search API |
| **Observability** | LangSmith |
| **Tool Protocol** | MCP (Model Context Protocol) |
| **Auth** | JWT + GitHub OAuth |
| **Package Manager** | uv |
| **Deployment** | AWS ECR + ECS Fargate |
| **CI/CD** | GitHub Actions |

---

## 📁 Project Structure

```
devdocai/
├── backend/
│   ├── auth/
│   │   ├── jwt.py                  ← JWT create/verify
│   │   ├── github_oauth.py         ← GitHub OAuth flow
│   │   └── routes.py               ← HTTP layer only
│   ├── db/
│   │   ├── database.py             ← async PostgreSQL engine
│   │   └── models.py               ← SQLAlchemy ORM models
│   ├── repositories/
│   │   └── user_repository.py      ← all DB queries isolated here
│   ├── schemas/
│   │   └── auth_schemas.py         ← Pydantic v2 request/response models
│   ├── services/
│   │   └── auth_service.py         ← business logic layer
│   ├── utils/
│   │   ├── helper_auth.py          ← bcrypt password helpers
│   │   └── encryption.py           ← Fernet encryption for tokens
│   ├── mcp/
│   │   └── github_server.py        ← GitHub tools for LangGraph agents
│   ├── agents/
│   │   ├── codebase_parser.py
│   │   ├── doc_generator.py
│   │   ├── brave_researcher.py
│   │   ├── doc_publisher.py
│   │   └── onboarding_chatbot.py
│   ├── graph/
│   │   ├── state.py
│   │   ├── pipeline.py
│   │   └── hitl.py
│   ├── webhooks/
│   │   └── github_pr.py            ← PR merge webhook handler
│   ├── cache/
│   │   └── redis_client.py         ← Upstash Redis caching
│   ├── vectorstore/
│   │   ├── embeddings.py
│   │   └── qdrant_store.py
│   ├── config.py                   ← all env vars, pydantic-settings
│   └── main.py                     ← FastAPI app entry point
├── frontend/                       ← Phase 6
│   ├── app/
│   │   ├── dashboard/
│   │   ├── review/                 ← HITL review panel
│   │   └── chat/                   ← onboarding chatbot UI
└── .github/
    └── workflows/
        └── deploy.yml              ← Phase 7
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

---

## 🚀 Getting Started

### Prerequisites

- Python 3.12+
- [uv](https://docs.astral.sh/uv/) — fast Python package manager just like pip
- Docker (for local PostgreSQL)
- A GitHub OAuth App ([create one here](https://github.com/settings/developers))

### 1. Clone the repo

```bash
git clone https://github.com/Nevin100/DevDocxAI.git
cd DevDocxAI/backend
```

### 2. Install dependencies

```bash
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
# Windows
.venv\Scripts\python.exe -m uvicorn main:app --reload

# Mac/Linux
uvicorn main:app --reload
```

### 6. Open Swagger UI

```
http://localhost:8000/docs
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
| `COHERE_API_KEY` | ✅ | From [cohere.com](https://cohere.com) |
| `TAVILY_API_KEY` | ✅ | From [tavily.com](https://brave.com/search/api) |
| `REDIS_URL` | ✅ | From upstash REDIS URL |
| `AWS_ACCESS_KEY_ID` | ⏳ Phase 7 | S3 storage |

---

## 📊 Database Schema

```
User
 └── Repository
         ├── Document        (DocStatus: PENDING → APPROVED → PUBLISHED)
         └── PipelineRun     (trigger: manual | pr_merge | webhook)
```

---

## 🛣️ Roadmap

| Phase | What | Status |
|---|---|---|
| **Phase 1** | Backend Foundation (FastAPI, DB, Auth, JWT) | ✅ Complete |
| **Phase 2** | GitHub OAuth + MCP Server | ✅ Complete |
| **Phase 3** | LangGraph Core (State, Pipeline, HITL) | ✅ Complete |
| **Phase 4** | Agents (Parser, Generator, Researcher, Chatbot) | ✅ Complete |
| **Phase 5** | Webhooks + Redis Cache | ✅ Complete |
| **Phase 6** | Next.js Frontend | ✅ Complete |
| **Phase 7** | Docker + ECR/ECS Fargate + CI/CD | 🔨 Completing!! |

---

## 📖 Blog Series

Following the build in public on dev.to:

- [Part 1 — Foundation: Backend, Auth, DB, GitHub OAuth, MCP](https://dev.to/nevin100/building-devdocai-an-ai-that-writes-your-docs-part-1-foundation-5cjh)
- [Part 2 — LangGraph Core + Agents + RAG](https://dev.to/nevin100/-building-devdocai-an-ai-that-writes-your-docs-automatically-part-2-langgraph-core-agents--3j27)
- [Part 3 — Webhooks + Redis Cache](https://dev.to/nevin100/building-devdocai-a-production-multi-agent-langgraph-system-part-3-github-webhooks-redis-1mgk)
- [Part 4 — Coming Back, Closing Out the Backend, and Laying Down the Frontend](https://dev.to/nevin100/building-devdocai-a-production-multi-agent-langgraph-system-part-4-coming-back-closing-out-5aa9)
- [Part 5 — Backend Closed Out, GitHub OAuth Working End-to-End](https://dev.to/nevin100/building-devdocai-a-production-multi-agent-langgraph-system-part-5-backend-closed-out-github-216o)
- [Part 6 — The Full Loop Works. Now: Deployment...](https://dev.to/nevin100/building-devdocai-part-6-the-full-loop-works-now-deployment-3a49)

---

## 🤝 Contributing

This project is under active development. Feel free to open issues or PRs.

---

<div align="center">
  <strong>Built by <a href="https://github.com/Nevin100">Nevin Bali</a></strong>
  <br/>
  <em>Building in public 🚀</em>
</div>