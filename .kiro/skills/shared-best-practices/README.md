# Shared Best Practices — Skill Pack

This folder contains production-grade best practices that **every agent** working on the Trender furniture database must follow.

---

## Skill Files

1. **skill.md** — Core principles (production-grade, no duplication, security, modularity)
2. **clean-architecture.md** — Separation of concerns, dependency direction, modularity
3. **typescript-production.md** — Strong typing, validation, error handling, pure functions
4. **supabase-postgres.md** — Database design, RLS, indexes, pgvector, security
5. **api-design.md** — REST patterns, validation, pagination, response shapes
6. **security-owasp.md** — Never leak secrets, input validation, SQL injection prevention
7. **data-ingestion-etl.md** — ETL flow, providers, deduplication, job tracking
8. **database-normalization.md** — Separate entities, when to use arrays/JSONB, deduplication
9. **testing-qa.md** — Test migrations, RLS, deduplication, search, API responses
10. **documentation.md** — What to document, writing style, code examples, troubleshooting
11. **agent-workflow.md** — Agent coordination, parallel execution, completion reports

---

## How to Use

### Before Starting Work

Every agent must:

1. Read `skill.md` (core principles)
2. Read relevant specialized skills for their domain
3. State which skills they are using
4. Follow those skills while coding

### Example

```
Agent: Product Normalization Agent

Skills Used:
- skill.md (core principles)
- typescript-production.md (strong typing, validation)
- database-normalization.md (canonical fields, deduplication)
- data-ingestion-etl.md (normalization patterns)

Starting work on:
- src/lib/ingestion/types.ts
- src/lib/ingestion/normalizeProduct.ts
```

---

## Agent Skill Assignments

### Agent 1 — Database Schema Architect
- skill.md
- supabase-postgres.md
- database-normalization.md
- security-owasp.md
- testing-qa.md

### Agent 2 — RLS & Security Agent
- skill.md
- security-owasp.md
- supabase-postgres.md
- api-design.md
- testing-qa.md

### Agent 3 — Product Normalization Agent
- skill.md
- typescript-production.md
- database-normalization.md
- data-ingestion-etl.md

### Agent 4 — Store & Product Upsert Agent
- skill.md
- typescript-production.md
- supabase-postgres.md
- database-normalization.md
- data-ingestion-etl.md

### Agent 5 — Scrape Job Tracking Agent
- skill.md
- data-ingestion-etl.md
- typescript-production.md
- supabase-postgres.md

### Agent 6 — Provider Integration Agent
- skill.md
- data-ingestion-etl.md
- typescript-production.md
- clean-architecture.md

### Agent 7 — Search API Agent
- skill.md
- api-design.md
- security-owasp.md
- typescript-production.md
- supabase-postgres.md

### Agent 8 — Vector Search Agent
- skill.md
- supabase-postgres.md
- database-normalization.md
- typescript-production.md

### Agent 9 — Seed Data & Testing Agent
- skill.md
- testing-qa.md
- supabase-postgres.md
- data-ingestion-etl.md

### Agent 10 — Documentation & QA Agent
- skill.md
- documentation.md
- testing-qa.md
- agent-workflow.md
- ALL other skills (for review)

---

## Quality Bar

All code must:
- ✅ Follow production-grade patterns
- ✅ Be type-safe (TypeScript)
- ✅ Be secure (no leaked secrets)
- ✅ Be modular and testable
- ✅ Be documented where necessary
- ✅ Pass type checks
- ✅ Pass tests
- ✅ Follow project conventions

---

## Enforcement

These are not suggestions. These are **requirements**.

Agents that do not follow these skills will have their work rejected and must revise.

---

## Updates

These skill files may be updated as the project evolves. Agents should check for updates before starting new work.

Last updated: 2026-05-08
