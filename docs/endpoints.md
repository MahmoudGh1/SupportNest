Widget API + AI Pipeline

API key validation middleware
POST /widget/conversations — start conversation
POST /widget/conversations/:id/messages — receive message + trigger pipeline
Wire the AI pipeline service: Router → Tier 1 (RAG) → Tier 2 → escalation trigger (creates ticket)
GET /widget/conversations/:id/messages — history

-------------

Ticket Inbox + Agent Endpoints

GET /dashboard/tickets — inbox with filters
GET /dashboard/tickets/:id — detail + full conversation context
PATCH /dashboard/tickets/:id — status update, assign, resolve
POST /widget/conversations/:id/csat — CSAT submission (simple insert)

--------------

API Keys + Widget Config + KB Management

POST /dashboard/api-keys — generate + hash key
GET /dashboard/api-keys — list
PATCH /dashboard/api-keys/:id — revoke
GET /dashboard/widget-config
PATCH /dashboard/widget-config
GET /dashboard/knowledge-documents
DELETE /dashboard/knowledge-documents/:id

--------------

Team Management + Analytics

POST /dashboard/users/invite
GET /dashboard/users
PATCH /dashboard/users/:id — deactivate
GET /dashboard/analytics — query conversation_analytics, aggregate and shape the response
