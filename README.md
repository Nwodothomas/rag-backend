# RAG Backend

`rag-backend` is the API gateway and ETL automation layer behind the developer dashboard and the end-user RAG experience.

It is responsible for:

- receiving developer uploads from the ETL UI
- storing documents in Supabase Storage
- triggering extraction, transformation, embedding, and load workflows
- serving user queries against indexed knowledge
- exposing admin-only observability and maintenance endpoints

## Current Architecture

```text
rag-backend/
├── src/
│   ├── server.ts
│   ├── routes/
│   ├── services/
│   ├── jobs/
│   ├── middleware/
│   └── utils/
├── data/
├── tests/
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

## What Was Already In The Repo

The repository started as a lightweight Express proof of concept with:

- a single `src/index.js` entrypoint
- a Supabase table smoke test route
- a Supabase Storage smoke test route
- minimal package scripts and documentation

That setup was useful as an initial connectivity check, but it was not yet structured for:

- multiple upload types
- ETL orchestration
- admin authentication
- background ingestion flows
- query endpoints
- testability
- TypeScript maintainability

## What This Revision Adds

- TypeScript backend structure aligned to your ETL/RAG architecture
- dedicated routes for upload, ingest, query, health, and admin operations
- service boundaries for Supabase, OpenAI, file processing, notifications, and RAG orchestration
- middleware for developer auth, rate limiting, and centralized errors
- background job scaffolding for ingestion, scheduling, and cleanup
- test scaffolding for routes, services, pipeline, and file processing
- Docker and TypeScript project configuration

## API Routes

### Public

- `GET /health`
- `POST /query`

### Developer/Admin

- `POST /upload/pdf`
- `POST /upload/docx`
- `POST /upload/xls`
- `POST /upload/video`
- `POST /upload/url`
- `POST /ingest/:fileId`
- `GET /admin/files`
- `GET /admin/files/:fileId`
- `POST /admin/reingest/:fileId`
- `GET /admin/stats`

## Authentication

Admin routes expect either:

- `x-admin-key: <ADMIN_API_KEY>`
- `Authorization: Bearer <ADMIN_API_KEY>`

This is a practical bootstrap approach for internal tooling. You can later swap this middleware to Supabase Auth or JWT verification without changing route contracts.

## Environment Variables

Create a local `.env` with values similar to:

```bash
PORT=4000
NODE_ENV=development
ADMIN_API_KEY=dev-admin-key
JWT_SECRET=dev-jwt-secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=documents
OPENAI_API_KEY=your-openai-api-key
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_COMPLETION_MODEL=gpt-4o-mini
MAX_CHUNK_SIZE=1000
CHUNK_OVERLAP=150
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=60
```

## Local Development

```bash
npm install
npm run dev
```

Server default:

- `http://localhost:4000`

## Build And Run

```bash
npm run build
npm start
```

## Test

```bash
npm test
```

## Important Implementation Notes

- The project currently includes a mock in-memory fallback for file records and vector chunks so local development can proceed before Supabase tables and vector persistence are finalized.
- The OpenAI client currently provides deterministic mock embeddings and answer composition, which keeps the backend testable while the final model HTTP integration is still pending.
- `fileProcessor.ts` includes extraction placeholders for binary formats. Production-ready PDF, DOCX, XLS, and video transcript extraction should be connected next.

## Recommended Next Backend Upgrades

1. Replace mock OpenAI calls with the official API integration for embeddings and answer generation.
2. Back `FileRecord` and chunk storage with Supabase Postgres tables plus pgvector.
3. Add a real queue worker for large ingestion jobs using BullMQ, Trigger.dev, or Supabase Edge Functions.
4. Implement binary document parsers for PDF, DOCX, XLS, and media transcript generation.
5. Add structured observability with request IDs, metrics, and external log sinks.
6. Replace static admin-key auth with Supabase Auth or JWT role validation.
