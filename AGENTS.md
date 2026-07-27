# AGENTS.md - SAAS-LES-EXTRAS

Read `.agents/README.md` before making changes.

## Agent role
- Diagnose the affected runtime: api, front, desk, prisma, or coolify.
- Make minimal, surgical patches.
- Preserve the business rule that Les Extras remains the intermediary between establishments and freelancers.

## Core rules
- Make minimal surgical patches.
- Identify the affected runtime: api, front, desk, prisma, or coolify.
- Never use `prisma migrate dev` in production.
- Never put `/api` in the Coolify API domain.
- Do not duplicate centralized components.
- Do not expose KYC documents or secrets.
- Validate changed package with typecheck/build.

## Main commands
```bash
pnpm --filter @lesextras/api typecheck
pnpm --filter @lesextras/api build
pnpm --filter @lesextras/web typecheck
pnpm --filter @lesextras/web build
```

## Critical prohibitions
- Do not modify Prisma migrations without an explicit migration task.
- Do not modify Dockerfiles unless the task is explicitly DevOps/deployment.
- Do not change environment variable names or secret values.
- Do not refactor unrelated code.
- Do not create direct-contact leakage between establishments and freelancers.

## Product rule
Les Extras must remain the intermediary between establishments and freelancers.

