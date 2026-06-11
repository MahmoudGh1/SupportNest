## Local Development

Docker Postgres + pgvector

Create migrations:
npx prisma migrate dev

## Shared Supabase

Apply migrations:
npx prisma migrate deploy

Never:

- edit schema directly in Supabase
- use db push on shared DBs
- modify migration files after they are applied
