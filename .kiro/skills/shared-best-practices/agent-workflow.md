# Agent Workflow & Coordination

**Purpose:** Coordinate multiple agents working in parallel on the Trender furniture database.

---

## Agent Responsibilities

Each agent has a specific domain:

1. **Database Schema Architect** — SQL migrations, tables, indexes
2. **RLS & Security Agent** — Row Level Security, policies, auth
3. **Product Normalization Agent** — Types, normalization utilities
4. **Store & Product Upsert Agent** — Upsert logic, deduplication
5. **Scrape Job Tracking Agent** — Job lifecycle, status tracking
6. **Provider Integration Agent** — Apify, SerpApi, CSV providers
7. **Search API Agent** — Product/store search endpoints
8. **Vector Search Agent** — pgvector, embeddings, similarity search
9. **Seed Data & Testing Agent** — Mock data, tests, verification
10. **Documentation & QA Agent** — Docs, final QA, integration

---

## Before Starting

Every agent must:

1. **Read shared skill files:**
   - `skill.md` (core principles)
   - Relevant specialized skills (typescript, supabase, security, etc.)

2. **Read Trender-specific skill files** (if they exist)

3. **Check existing code:**
   - What files already exist?
   - What has been built by other agents?
   - What can be reused?

4. **State which skills are being used:**
   ```
   Agent: Product Normalization Agent
   Skills: skill.md, typescript-production.md, database-normalization.md, data-ingestion-etl.md
   ```

---

## File Ownership

Each agent owns specific files:

**Agent 1 — Database Schema:**
- `supabase/migrations/*.sql`

**Agent 2 — RLS & Security:**
- RLS policies in migration file (coordinate with Agent 1)
- Security verification notes

**Agent 3 — Normalization:**
- `src/lib/ingestion/types.ts`
- `src/lib/ingestion/normalizeProduct.ts`

**Agent 4 — Upsert:**
- `src/lib/ingestion/upsertStore.ts`
- `src/lib/ingestion/upsertProduct.ts`
- `src/lib/ingestion/supabaseAdmin.ts`

**Agent 5 — Job Tracking:**
- `src/lib/ingestion/createScrapeJob.ts`
- `src/lib/ingestion/runIngestion.ts`

**Agent 6 — Providers:**
- `src/lib/ingestion/providers/apifyProvider.ts`
- `src/lib/ingestion/providers/serpApiShoppingProvider.ts`
- `src/lib/ingestion/providers/csvImportProvider.ts`

**Agent 7 — Search API:**
- `supabase/functions/search-products/index.ts`
- `supabase/functions/search-stores/index.ts`
- `src/services/furnitureSearchService.ts`

**Agent 8 — Vector Search:**
- Vector-related SQL in migration (coordinate with Agent 1)
- Embedding utilities (if needed)

**Agent 9 — Seed & Testing:**
- `supabase/seed/*.sql`
- Test scripts
- Verification checklist

**Agent 10 — Documentation:**
- `docs/furniture-database-ingestion.md`
- Final QA report

---

## Parallel Execution

### Independent Work (can run in parallel):
- Agent 3 (Normalization) — no dependencies
- Agent 6 (Providers) — depends on Agent 3 types
- Agent 9 (Seed Data) — depends on Agent 1 schema

### Sequential Dependencies:
- Agent 1 must finish before Agent 2 (RLS needs tables)
- Agent 1 must finish before Agent 9 (seed needs tables)
- Agent 3 must finish before Agent 4, 5, 6 (they use types)
- Agents 1-9 must finish before Agent 10 (QA reviews all)

### Coordination Required:
- Agent 1 & 2 — Both edit migration file (RLS policies)
- Agent 1 & 8 — Both edit migration file (vector setup)

---

## Communication

When agents need to coordinate:

```
Agent 2 to Agent 1:
"I need to add RLS policies to the migration file. 
Have you finished the table definitions?"

Agent 1 to Agent 2:
"Yes, tables are complete. You can add RLS policies 
after line 450 in the migration file."
```

---

## Completion Report

Every agent must report:

```markdown
## Agent: [Name]

**Status:** Complete | Blocked | Partial

**Files Created:**
- file1.ts
- file2.ts

**Files Modified:**
- existing-file.ts (added function X)

**Assumptions:**
- Assumed Supabase URL is correct
- Assumed service role key is available

**Blockers:**
- None | Waiting for Agent X to finish Y

**Tests Run:**
- Test 1: Passed
- Test 2: Passed

**Next Steps:**
- None | Need to do X after Agent Y finishes
```

---

## Integration Pass

After all agents finish:

1. **Check for conflicts:**
   - Did multiple agents edit the same file?
   - Are there duplicate functions?
   - Are there conflicting types?

2. **Resolve duplicates:**
   - Keep the best implementation
   - Remove redundant code
   - Merge where appropriate

3. **Run type checks:**
   ```bash
   npx tsc --noEmit
   ```

4. **Run tests:**
   - Migration applies successfully
   - Mock data inserts
   - Search works
   - RLS enforced

5. **Final QA:**
   - All requirements met?
   - All files documented?
   - No secrets exposed?
   - Production-ready?

---

## Quality Gates

Before marking complete:

- [ ] All agents reported completion
- [ ] No blockers remaining
- [ ] TypeScript compiles
- [ ] Migration applies successfully
- [ ] RLS policies work
- [ ] Mock data inserted
- [ ] Search returns results
- [ ] No secrets in frontend
- [ ] Documentation complete
- [ ] Tests pass

---

## Failure Handling

If an agent is blocked:

1. **Report the blocker clearly:**
   ```
   Blocked: Need DATABASE_URL to apply migration
   ```

2. **Suggest alternatives:**
   ```
   Alternative: User can apply migration manually via SQL Editor
   ```

3. **Don't block other agents:**
   - Continue with what can be done
   - Let other agents proceed
   - Integrate later when unblocked

---

## Best Practices

- **Start with dependencies:** Build foundation first (types, schema)
- **Work in parallel:** Don't wait unnecessarily
- **Communicate early:** Flag conflicts before they happen
- **Test incrementally:** Don't wait until the end
- **Document as you go:** Don't leave docs for last
- **Review each other:** Catch issues early
- **Keep it simple:** Don't over-engineer
- **Stay focused:** Stick to your agent's responsibility
