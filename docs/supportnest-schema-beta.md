### `Organization`

| Field         | Type      | Reason                                                      |
| ------------- | --------- | ----------------------------------------------------------- |
| id            | uuid      | primary key                                                 |
| name          | varchar   | business name                                               |
| slug          | varchar   | unique, URL-safe identifier for the org                     |
| email         | varchar   | primary contact email                                       |
| widget_secret | varchar   | the secret key used to verify signed JWTs from the business |
| plan_id       | uuid      | FK to Pricing — current active plan                         |
| is_active     | boolean   | can be suspended by super admin                             |
| created_at    | timestamp |                                                             |
| updated_at    | timestamp |                                                             |

**One thing to flag:** `widget_secret` lives here because it's org-wide. If you later want per-key secrets (different secret per API key), it moves to `ApiKey`. For MVP, org-level is fine.

---

### `User`

| Field           | Type      | Reason                                      |
| --------------- | --------- | ------------------------------------------- |
| id              | uuid      | primary key                                 |
| organization_id | uuid      | FK to Organization, null if Super Admin     |
| email           | varchar   | login credential                            |
| password_hash   | varchar   | bcrypt                                      |
| role            | enum      | `super_admin`, `org_admin`, `support_agent` |
| first_name      | varchar   |                                             |
| last_name       | varchar   |                                             |
| is_active       | boolean   | soft disable without deleting               |
| created_at      | timestamp |                                             |
| updated_at      | timestamp |                                             |

**Note on Super Admin:** `organization_id` is nullable for super admins since they belong to no org. Alternatively you could have a separate internal org for super admins, but nullable is simpler for MVP.

---

### `ApiKey`

| Field           | Type      | Reason                                                                                  |
| --------------- | --------- | --------------------------------------------------------------------------------------- |
| id              | uuid      | primary key                                                                             |
| organization_id | uuid      | FK to Organization                                                                      |
| key_hash        | varchar   | store hashed, never raw                                                                 |
| key_prefix      | varchar   | first 8 chars in plain text, shown in dashboard so user can identify which key is which |
| name            | varchar   | human label e.g. "Production", "Staging"                                                |
| allowed_origins | text[]    | array of allowed domains for origin validation                                          |
| is_active       | boolean   | revoke without deleting                                                                 |
| last_used_at    | timestamp | security visibility                                                                     |
| created_at      | timestamp |                                                                                         |
| updated_at      | timestamp |                                                                                         |

---

### `Customer`

| Field           | Type      | Reason                                                                       |
| --------------- | --------- | ---------------------------------------------------------------------------- |
| id              | uuid      | primary key                                                                  |
| organization_id | uuid      | FK to Organization                                                           |
| external_id     | varchar   | the user ID from the business's own system, extracted from verified JWT      |
| email           | varchar   | from JWT payload, nullable if anonymous                                      |
| name            | varchar   | from JWT payload, nullable if anonymous                                      |
| metadata        | jsonb     | any extra claims the business includes in their JWT (flexible, future-proof) |
| is_anonymous    | boolean   | true if no JWT was provided                                                  |
| created_at      | timestamp |                                                                              |
| updated_at      | timestamp |                                                                              |

**Note:** `external_id` + `organization_id` should have a unique constraint together — that's how you recognize a returning identified customer across conversations. For anonymous customers, `external_id` is null and each session may create a new customer row, or you tie them by session cookie — something to decide during implementation.

---

### `Conversation`

| Field           | Type      | Reason                                                    |
| --------------- | --------- | --------------------------------------------------------- |
| id              | uuid      | primary key                                               |
| organization_id | uuid      | FK to Organization, denormalized for fast queries         |
| customer_id     | uuid      | FK to Customer                                            |
| api_key_id      | uuid      | FK to ApiKey, which key initiated this                    |
| conversation_status          | enum      | `active → escalated → closed`, `closed`               |
| closed_at     | timestamp | when the chat session ended                                                  |
| created_at      | timestamp |                                                           |
| updated_at      | timestamp |                                                           |

---

### `Message`

| Field           | Type      | Reason                                      |
| --------------- | --------- | ------------------------------------------- |
| id              | uuid      | primary key                                 |
| conversation_id | uuid      | FK to Conversation                          |
| role            | enum      | `customer`, `ai`, `human_agent`             |
| content         | text      | the message body                            |
| tier            | enum      | `tier1`, `tier2`, null if not an AI message |
| created_at      | timestamp |                                             |

**Note:** `tier` is only populated when `role = ai`, tells you which agent tier produced this message. No `updated_at` here — messages are immutable once sent.

### `AgentLog`

| Field            | Type      | Reason                                                             |
| ---------------- | --------- | ------------------------------------------------------------------ |
| id               | uuid      | primary key                                                        |
| conversation_id  | uuid      | FK to Conversation                                                 |
| tier             | enum      | `router`, `tier1`, `tier2`                                         |
| action           | enum      | `resolved`, `escalated_to_tier2`, `escalated_to_human`, `no_match` |
| input            | text      | what the agent received                                            |
| output           | text      | what the agent responded or decided                                |
| confidence_score | float     | model's confidence, useful for tuning escalation thresholds        |
| latency_ms       | integer   | how long this tier took, useful for performance monitoring         |
| tokens_used      | integer   | for cost tracking per conversation                                 |
| created_at       | timestamp |                                                                    |

---

### `Ticket`

| Field           | Type      | Reason                                                   |
| --------------- | --------- | -------------------------------------------------------- |
| id              | uuid      | primary key                                              |
| conversation_id | uuid      | FK to Conversation, unique — one ticket per conversation |
| organization_id | uuid      | FK to Organization, denormalized for dashboard queries   |
| assigned_to     | uuid      | FK to User, nullable until assigned                      |
| status          | enum      | `open`, `in_progress`, `resolved`              |
| priority        | enum      | `low`, `medium`, `high`                                  |
| resolution_note | text      | human agent's closing note, nullable                     |
| created_at      | timestamp |                                                          |
| updated_at      | timestamp |                                                          |
| resolved_at     | timestamp | nullable                                                 |

**Note:** you'll notice `assigned_to` exists on both `Conversation` and `Ticket`. They serve slightly different purposes — on `Conversation` it signals the conversation is in human hands, on `Ticket` it tracks the workload assignment in the inbox. They should stay in sync but are not redundant.

---

### `KnowledgeDocument`

| Field           | Type      | Reason                                                        |
| --------------- | --------- | ------------------------------------------------------------- |
| id              | uuid      | primary key                                                   |
| organization_id | uuid      | FK to Organization                                            |
| title           | varchar   | human readable name                                           |
| type            | enum      | `pdf`, `faq`                                                  |
| source_url      | varchar   | storage URL if PDF, nullable for FAQ entries                  |
| status          | enum      | `processing`, `ready`, `failed`                               |
| metadata        | jsonb     | page count, file size, or FAQ category — type-specific extras |
| created_by      | uuid      | FK to User who uploaded it                                    |
| created_at      | timestamp |                                                               |
| updated_at      | timestamp |                                                               |

---

### `DocumentChunk`

| Field           | Type         | Reason                                                                                                                  |
| --------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| id              | uuid         | primary key                                                                                                             |
| document_id     | uuid         | FK to KnowledgeDocument                                                                                                 |
| organization_id | uuid         | FK to Organization, denormalized — vector similarity searches are always org-scoped so this avoids a join at query time |
| content         | text         | the raw chunk text                                                                                                      |
| embedding       | vector(1536) | pgvector embedding, dimension depends on model                                                                          |
| chunk_index     | integer      | position of this chunk within the document                                                                              |
| metadata        | jsonb        | page number, section heading, or any context useful for retrieval                                                       |
| created_at      | timestamp    |                                                                                                                         |

---

### `CsatRating`

| Field           | Type      | Reason                                                   |
| --------------- | --------- | -------------------------------------------------------- |
| id              | uuid      | primary key                                              |
| conversation_id | uuid      | FK to Conversation, unique — one rating per conversation |
| organization_id | uuid      | FK to Organization, denormalized for analytics queries   |
| customer_id     | uuid      | FK to Customer                                           |
| score           | integer   | 1–5 rating from the widget                               |
| comment         | text      | optional free text from customer                         |
| created_at      | timestamp |                                                          |

---

### `ConversationAnalytics`

| Field                  | Type      | Reason                                                                  |
| ---------------------- | --------- | ----------------------------------------------------------------------- |
| id                     | uuid      | primary key                                                             |
| conversation_id        | uuid      | FK to Conversation, unique                                              |
| organization_id        | uuid      | FK to Organization, denormalized                                        |
| resolved_by_tier       | enum      | `tier1`, `tier2`, `human`, `unresolved`                                 |
| total_messages         | integer   | count of messages in the conversation                                   |
| first_response_time_ms | integer   | time from first customer message to first AI response                   |
| resolution_time_ms     | integer   | time from conversation start to resolved_at                             |
| escalated_to_tier2     | boolean   | did it reach tier 2                                                     |
| escalated_to_human     | boolean   | did it escalate to a human                                              |
| tokens_used            | integer   | total tokens across all agent logs for this conversation                |
| csat_score             | integer   | denormalized from CsatRating for query convenience                      |
| inferred_sentiment     | enum      | `positive`, `neutral`, `negative`, null — inferred from message content |
| created_at             | timestamp |                                                                         |
| updated_at             | timestamp |                                                                         |

**Note:** most of these fields are derived and populated either at conversation close or via a background job. Nothing here is written in real time — BullMQ handles the computation after the conversation ends.

---

### `Pricing`

| Field                   | Type      | Reason                                         |
| ----------------------- | --------- | ---------------------------------------------- |
| id                      | uuid      | primary key                                    |
| name                    | varchar   | e.g. "Starter", "Growth", "Enterprise"         |
| price_monthly           | decimal   | base monthly price                             |
| max_conversations       | integer   | conversation limit per month, null = unlimited |
| max_agents              | integer   | max human support agent seats                  |
| max_knowledge_documents | integer   | KB document limit                              |
| features                | jsonb     | flexible flag bag for feature toggles per plan |
| is_active               | boolean   | can deprecate old plans without deleting       |
| created_at              | timestamp |                                                |
| updated_at              | timestamp |                                                |

---

### `Payment`

| Field                | Type      | Reason                                                       |
| -------------------- | --------- | ------------------------------------------------------------ |
| id                   | uuid      | primary key                                                  |
| organization_id      | uuid      | FK to Organization                                           |
| pricing_id           | uuid      | FK to Pricing — which plan was active at time of payment     |
| amount               | decimal   | actual amount charged                                        |
| currency             | varchar   | e.g. "USD"                                                   |
| status               | enum      | `pending`, `succeeded`, `failed`, `refunded`                 |
| payment_provider     | varchar   | e.g. "stripe"                                                |
| provider_payment_id  | varchar   | Stripe's payment intent ID or equivalent, for reconciliation |
| billing_period_start | timestamp |                                                              |
| billing_period_end   | timestamp |                                                              |
| created_at           | timestamp |                                                              |

---

That's all 14 entities fully defined.

Before we move to the query stress-test phase, I want to do one pass and flag a few cross-cutting things I noticed:

1. **`widget_secret` on Organization** — this should be treated like an API key (hashed or encrypted at rest, never returned in API responses). Worth flagging to the team explicitly.

2. **`assigned_to` on both `Conversation` and `Ticket`** — the team needs a clear rule about which is the source of truth when they diverge. I'd say `Ticket.assigned_to` is the operational truth for the inbox, `Conversation.assigned_to` is for status display in the chat view.

3. **Anonymous customer deduplication** — right now two anonymous sessions from the same browser would create two `Customer` rows. You'll want a session cookie strategy to link them, but that's an implementation detail not a schema problem.
