# Shared Best Practices — Core Skill File

**Purpose:** Every agent working on the Trender furniture database must follow these foundational principles.

---

## Production-Grade Code

- All code must be production-ready, not prototype quality
- Code should be maintainable by other developers
- Assume this will run in production with real Ontario furniture data
- No placeholder comments like "TODO: implement later" unless absolutely necessary

---

## No Duplication

- Do not create duplicate logic across files
- Do not create duplicate tables, functions, or types
- If two agents need the same utility, coordinate to share it
- Check existing code before creating new functions
- Reuse existing normalization, validation, and upsert logic

---

## Focused Changes

- Only modify files relevant to your agent's responsibility
- Do not refactor unrelated code
- Do not change frontend UI unless required for testing
- Do not rebuild the entire app
- Keep changes surgical and targeted

---

## Security First

- Never expose secrets (API keys, service role keys, DB URLs, tokens)
- Never log secrets
- Never commit secrets to git
- Use environment variables for all sensitive data
- Validate and sanitize all external input
- Assume all scraper/provider data is untrusted

---

## Avoid Over-Engineering

- Build what is needed, not what might be needed
- Follow YAGNI (You Aren't Gonna Need It)
- Do not add features not in the requirements
- Do not create unnecessary abstractions
- Keep it simple and clear

---

## Modular & Testable

- Write small, focused files (< 300 lines where possible)
- Each file should have a single clear responsibility
- Functions should do one thing well
- Make dependencies explicit (no hidden globals)
- Make code easy to test and verify

---

## Type Safety

- Use TypeScript interfaces for all data structures
- Avoid `any` unless absolutely necessary
- Use explicit return types for public functions
- Validate external data before using it
- Handle null/undefined safely

---

## Useful Comments Only

- Add comments where logic is complex or non-obvious
- Do not comment obvious code
- Use JSDoc for public functions and types
- Explain "why" not "what" in comments
- Keep comments up-to-date with code changes

---

## Fail Safely

- Handle errors gracefully
- Provide useful error messages
- Do not silently swallow errors
- Log errors without exposing sensitive data
- Return typed error objects where appropriate
- Fail one item without failing the entire batch where possible

---

## Input Validation

- Validate all external input (API params, scraper data, CSV rows)
- Check for required fields
- Validate data types and formats
- Normalize inconsistent input
- Reject invalid data early

---

## Error Logging

- Log useful context (operation, input summary, error type)
- Do not log full secrets or sensitive data
- Include timestamps and operation IDs where useful
- Make errors actionable (what failed, why, how to fix)
- Use structured logging where possible

---

## Agent Completion Report

Every agent must produce a brief completion report:

```
Agent: [Agent Name]
Status: [Complete | Blocked | Partial]
Files Created: [list]
Files Modified: [list]
Assumptions: [list]
Blockers: [list if any]
Tests Run: [list]
Next Steps: [if blocked]
```

---

## Coordination

- Check what other agents are building before starting
- Do not edit files owned by other agents unless coordinating
- Communicate dependencies clearly
- Work in parallel where possible
- Integrate carefully after parallel work

---

## Quality Bar

- Code must pass TypeScript type checking
- Code must follow project conventions (snake_case for DB, camelCase for TS)
- Code must be consistent with existing patterns
- Code must be documented where necessary
- Code must be tested or verifiable
