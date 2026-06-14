0# SupportNest — Database Schema Reference

> **Stack:** Supabase (Postgres + pgvector) · Prisma ORM  
> **Last updated:** after full design + query stress-test session  
> **Total tables:** 14

---

## Quick Reference — All Tables

| Table | Purpose |
|---|---|
| `organizations` | Tenants — businesses subscribed to SupportNest |
| `users` | Dashboard users (Super Admin, Org Admin, Support Agent) |
| `api_keys` | Widget authentication credentials per org |
| `customers` | Visitors interacting with the widget (anonymous or JWT-identified) |
| `conversations` | A chat session from first message to close |
| `messages` | Individual messages within a conversation |
| `agent_logs` | Audit trail of every AI pipeline tier action per turn |
| `tickets` | Async work items created on escalation for human agents |
| `knowledge_documents` | PDFs and FAQ entries per org |
| `document_chunks` | Chunked + embedded pieces of documents for RAG |
| `csat_ratings` | Customer satisfaction ratings per conversation |
| `conversation_analytics` | Derived metrics per conversation (computed post-close via BullMQ) |
| `pricing` | SupportNest subscription plans |
| `payments` | Payment records per org |

---

## Relationships Overview

```
Organization
  ├── has many Users
  ├── has many ApiKeys
  ├── has many Customers
  ├── has many KnowledgeDocuments
  ├── has many Conversations (denormalized)
  ├── has many Tickets (denormalized)
  ├── has one Pricing (current plan)
  └── has many Payments

Customer
  ├── belongs to Organization
  └── has many Conversations

Conversation
  ├── belongs to Organization (denormalized)
  ├── belongs to Customer
  ├── belongs to ApiKey (which key initiated it)
  ├── has many Messages
  ├── has many AgentLogs
  ├── has at most one Ticket
  ├── has at most one CsatRating
  └── has exactly one ConversationAnalytics

KnowledgeDocument
  ├── belongs to Organization
  └── has many DocumentChunks

Ticket
  ├── belongs to Conversation (unique)
  ├── belongs to Organization (denormalized)
  └── assigned to one User (support agent)
```

---

## Table Definitions

---

### `organizations`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | varchar | business name |
| slug | varchar | unique, URL-safe identifier |
| email | varchar | primary contact email |
| widget_secret | varchar | ⚠️ secret for verifying customer JWTs — treat like a password, never expose in API responses |
| widget_config | jsonb | widget appearance: colors, greeting message, branding |
| plan_id | uuid | FK → pricing |
| is_active | boolean | super admin can suspend |
| created_at | timestamp | |
| updated_at | timestamp | |

---

### `users`

> Dashboard users only. End customers are in the `customers` table.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| organization_id | uuid | FK → organizations · nullable for SUPER_ADMIN |
| email | varchar | login credential |
| password_hash | varchar | bcrypt |
| role | enum | `SUPER_ADMIN` · `org_admin` · `support_agent` |
| first_name | varchar | |
| last_name | varchar | |
| is_active | boolean | soft disable |
| created_at | timestamp | |
| updated_at | timestamp | |

---

### `api_keys`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| organization_id | uuid | FK → organizations |
| key_hash | varchar | hashed — never store raw |
| key_prefix | varchar | first 8 chars plaintext — shown in dashboard for identification |
| name | varchar | human label e.g. "Production", "Staging" |
| allowed_origins | text[] | domain whitelist for origin validation |
| is_active | boolean | revoke without deleting |
| last_used_at | timestamp | security visibility |
| created_at | timestamp | |
| updated_at | timestamp | |

**Index:** `key_hash` — hit on every widget request

---

### `customers`

> Represents a visitor on the business's site. Anonymous by default. Identity provided via signed JWT from the business.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| organization_id | uuid | FK → organizations |
| external_id | varchar | user ID from the business's own system, extracted from verified JWT · nullable if anonymous |
| email | varchar | from JWT payload · nullable |
| name | varchar | from JWT payload · nullable |
| metadata | jsonb | any extra JWT claims from the business — flexible |
| is_anonymous | boolean | true if no JWT was provided |
| created_at | timestamp | |
| updated_at | timestamp | |

**Unique constraint:** `(organization_id, external_id)` — identifies returning customers  
**Note:** anonymous customers may produce multiple rows per browser session; tie them via session cookie at implementation time

---

### `conversations`

> The chat session. Exists from first message to close. One per customer interaction.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| organization_id | uuid | FK → organizations · denormalized for dashboard queries |
| customer_id | uuid | FK → customers |
| api_key_id | uuid | FK → api_keys · which key initiated this conversation |
| conversation_status | enum | `active` · `escalated` · `closed` |
| closed_at | timestamp | when the chat session ended · nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Indexes:** `organization_id` · `customer_id` · `conversation_status`

---

### `messages`

> Immutable once created. No updated_at.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| conversation_id | uuid | FK → conversations |
| role | enum | `customer` · `ai` · `human_agent` |
| content | text | message body |
| tier | enum | `tier1` · `tier2` · null — only populated when role = ai |
| created_at | timestamp | |

**Index:** `conversation_id`

---

### `agent_logs`

> Full audit trail of every AI pipeline action. One row per tier per conversation turn.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| conversation_id | uuid | FK → conversations |
| tier | enum | `router` · `tier1` · `tier2` |
| action | enum | `resolved` · `escalated_to_tier2` · `escalated_to_human` · `no_match` |
| input | text | what the agent received |
| output | text | what the agent responded or decided |
| confidence_score | float | model confidence — useful for tuning escalation thresholds |
| latency_ms | integer | tier execution time — performance monitoring |
| tokens_used | integer | per-turn token cost tracking |
| created_at | timestamp | |

**Index:** `conversation_id`

---

### `tickets`

> Created only when a conversation escalates to human. Async work item in the agent inbox.  
> `Conversation` tracks the chat session lifecycle. `Ticket` tracks the agent work item lifecycle independently — they can diverge in time (e.g. conversation closed, ticket still open and resolved later).

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| conversation_id | uuid | FK → conversations · unique |
| organization_id | uuid | FK → organizations · denormalized for inbox queries |
| assigned_to | uuid | FK → users · nullable until assigned |
| status | enum | `open` · `in_progress` · `resolved` |
| priority | enum | `low` · `medium` · `high` |
| resolution_note | text | agent's closing note · nullable |
| resolved_at | timestamp | when agent closed the ticket · nullable |
| created_at | timestamp | marks when escalation happened |
| updated_at | timestamp | |

**Indexes:** `organization_id` · `status`

---

### `knowledge_documents`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| organization_id | uuid | FK → organizations |
| title | varchar | human readable name |
| type | enum | `pdf` · `faq` |
| storagePath | varchar | Supabase Storage URL · or Actual website URL |
| status | enum | `processing` · `ready` · `failed` |
| metadata | jsonb | type-specific extras: page count, file size, FAQ category |
| created_by | uuid | FK → users |
| created_at | timestamp | |
| updated_at | timestamp | |

**Index:** `organization_id`

---

### `document_chunks`

> Chunked and embedded pieces of knowledge documents. Queried via pgvector similarity search.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| document_id | uuid | FK → knowledge_documents |
| organization_id | uuid | FK → organizations · denormalized — RAG queries are always org-scoped |
| content | text | raw chunk text |
| embedding | vector(1536) | pgvector embedding · dimension depends on model used |
| chunk_index | integer | position within the source document |
| metadata | jsonb | page number, section heading — context for retrieval |
| created_at | timestamp | |

**Index:** HNSW or IVFFlat on `embedding` composite with `organization_id`

---

### `csat_ratings`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| conversation_id | uuid | FK → conversations · unique |
| organization_id | uuid | FK → organizations · denormalized for analytics |
| customer_id | uuid | FK → customers |
| score | integer | 1–5 from widget rating prompt |
| comment | text | optional free text · nullable |
| created_at | timestamp | |

---

### `conversation_analytics`

> One row per conversation. Computed post-close by a BullMQ background job. Nothing written here in real time.

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| conversation_id | uuid | FK → conversations · unique |
| organization_id | uuid | FK → organizations · denormalized |
| resolved_by_tier | enum | `tier1` · `tier2` · `human` · `unresolved` — single source of truth for resolution attribution |
| total_messages | integer | count of all messages |
| first_response_time_ms | integer | first customer message → first AI response |
| resolution_time_ms | integer | conversation start → closed_at |
| escalated_to_tier2 | boolean | did it reach tier 2 |
| escalated_to_human | boolean | did it escalate to human |
| tokens_used | integer | sum of agent_logs.tokens_used for this conversation |
| csat_score | integer | denormalized from csat_ratings for query convenience · nullable |
| inferred_sentiment | enum | `positive` · `neutral` · `negative` · null |
| created_at | timestamp | |
| updated_at | timestamp | |

**Index:** `organization_id`

---

### `pricing`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | varchar | e.g. "Starter" · "Growth" · "Enterprise" |
| price_monthly | decimal | base monthly price |
| max_conversations | integer | monthly limit · null = unlimited |
| max_agents | integer | max support agent seats |
| max_knowledge_documents | integer | KB document limit |
| features | jsonb | feature flag bag for plan-level toggles |
| is_active | boolean | deprecate old plans without deleting |
| created_at | timestamp | |
| updated_at | timestamp | |

---

### `payments`

| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| organization_id | uuid | FK → organizations |
| pricing_id | uuid | FK → pricing · plan active at time of payment |
| amount | decimal | actual amount charged |
| currency | varchar | e.g. "USD" |
| status | enum | `pending` · `succeeded` · `failed` · `refunded` |
| payment_provider | varchar | e.g. "stripe" |
| provider_payment_id | varchar | Stripe payment intent ID — for reconciliation |
| billing_period_start | timestamp | |
| billing_period_end | timestamp | |
| created_at | timestamp | |

---

## Key Design Decisions (for future reference)

**Why `organization_id` is denormalized on several tables**
`conversations`, `tickets`, `document_chunks`, `csat_ratings`, `conversation_analytics` all carry `organization_id` directly. Dashboard queries filtering by org are the most frequent access pattern — this avoids joins on hot paths.

**Why `Conversation` and `Ticket` have separate lifecycles**
A conversation can close (customer goes offline) while its ticket remains open and gets resolved later by an agent. `conversation_status` tracks the chat session. `ticket.status` tracks the agent work item independently.

**Why `resolved_by_tier` only lives in `conversation_analytics`**
It's a reporting field, not an operational one. Agents and customers don't need to see it in real time. Computed post-close by BullMQ.

**Why `api_key_id` is on `Conversation`**
Auditability — you always know which key initiated a conversation. Useful for security debugging and key rotation decisions.

**Why `widget_secret` is on `Organization`**
Businesses sign customer JWTs with this secret. Org-scoped for MVP. Could move to `ApiKey` if per-key secrets are needed later.

**Anonymous customer identity**
`is_anonymous = true` customers may produce multiple rows per browser. Session cookie deduplication strategy deferred to implementation.

---

## Indexes Summary

| Table | Field(s) | Reason |
|---|---|---|
| api_keys | key_hash | every widget request validates here |
| messages | conversation_id | load conversation history |
| conversations | organization_id | dashboard queries |
| conversations | customer_id | find customer's conversations |
| conversations | conversation_status | filter active/escalated |
| tickets | organization_id | agent inbox queries |
| tickets | status | filter open/in_progress |
| knowledge_documents | organization_id | KB management queries |
| document_chunks | embedding + organization_id | pgvector RAG similarity search (HNSW) |
| conversation_analytics | organization_id | all analytics queries |
