Shared:

POST /dashboard/api-keys — generate + hash key
API key validation middleware
POST /widget/conversations — start conversation
POST /widget/conversations/:id/messages — receive message + trigger pipeline
Wire the AI pipeline service: Router → Tier 1 (RAG) → Tier 2 → escalation trigger (creates ticket)
GET /widget/conversations/:id/messages — history

---------------

Per Dev:

Dev 1 - [ ]
GET /dashboard/tickets — inbox with filters
GET /dashbickets/:id — detail + full conversation context
PATCH /dashboard/tickets/:id — status update, assign, resolve
POST /widget/conversations/:id/csat — CSAT submission

Dev 2 - [ Ahmed ]
GET /dashboard/api-keys — list
PATCH /dashboard/api-keys/:id — revoke
GET /dashboard/widget-config
PATCH /dashboard/widget-config

Dev 3 - [ ]
GET /dashboard/conversations ( + filter by status)
GET /dashbarod/conversations/:id
GET /dashboard/knowledge-documents
DELETE /dashboard/knowledge-documents/:id

Dev 4 - [ ]
POST /dashboard/users/invite
GET /dashboard/users
PATCH /dashboard/users/:id — deactivate
GET /dashboard/analytics — query conversation_analytics, aggregate and shape the response

