# SupportNest

**AI-powered customer support widget platform for B2B SaaS teams.**

SupportNest lets companies embed a smart, multi-agent AI support widget on their site in minutes — handling tier-based ticket routing, RAG-powered knowledge base answers, and multi-step tool-chaining, all from a single dashboard.

> 🎓 Built as a graduation project for the **ITI MCIT Full Stack MERN + Generative AI** scholarship program (completed June 2026).

![Demo placeholder](./assets/demo-placeholder.png)
<!-- 🔗 Live demo: coming soon -->

---

## Why SupportNest?

Most support widgets are either dumb chatbots or expensive enterprise tools. SupportNest sits in between: a **multi-agent AI pipeline** that knows when to answer from your docs, when to call a tool, and when to chain multiple actions together — without you writing a single prompt.

---

## Key Features

- **Multi-Agent AI Pipeline** — A Router agent classifies incoming messages and delegates to the right specialist:
  - **Tier 0 (RAG Agent)** — Answers from your knowledge base using vector search (pgvector)
  - **Tier 1 Agent** — Handles single-tool actions (e.g., check order status)
  - **Tier 2 Agent** — Chains multiple tools together for complex, multi-step requests
  - **Reporter Agent** — Generates structured analysis of every conversation for insights

- **Embeddable Widget** — Lightweight, white-label chat widget that drops into any website with a single script tag

- **Multi-Tenant Architecture** — Full data isolation per organization, with per-tenant API key management

- **Team Management** — Google OAuth, email/OTP verification, and team invitations via email

- **Billing & Plans** — Paymob integration with plan-based seat limits and feature gating

- **Agent Lifecycle Tools** — Tool visibility controls, scheduled agent removal via background jobs, and per-agent ticket stats

- **Secure by Design** — AES-256-GCM encrypted tokens, JWT + httpOnly cookie auth

---

## Tech Stack

**Backend**
- Node.js, Express, TypeScript
- PostgreSQL + Prisma (with pgvector for embeddings)
- Redis + BullMQ (background jobs & scheduling)
- LangChain + Google Gemini (multi-agent orchestration)

**Frontend**
- Next.js, React, TypeScript

**Infra**
- Railway (deployment)
- Nodemailer (transactional email)

---

## Architecture Overview

```
User Message
     │
     ▼
 Router Agent ──► classifies intent
     │
     ├──► Tier 0 (RAG Agent)     → knowledge base Q&A
     ├──► Tier 1 Agent           → single tool call
     └──► Tier 2 Agent           → multi-step tool chaining
                  │
                  ▼
           Reporter Agent → structured conversation analysis
```

Each organization's data — documents, embeddings, conversations, and agents — is fully isolated at the database query level for multi-tenant safety.

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/<your-username>/supportnest.git
cd supportnest

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your DATABASE_URL, REDIS_URL, GOOGLE_API_KEY(s), JWT_SECRET, etc.

# Run database migrations
npx prisma migrate dev

# Start the dev server
npm run dev
```

> **Note:** Full environment variable documentation and deployment guide coming soon.

---

## Roadmap

- [ ] Public API for headless integrations
- [ ] More LLM provider support (OpenAI, Ollama)
- [ ] Analytics dashboard v2
- [ ] Marketplace for prebuilt tool integrations

---

## License

MIT
