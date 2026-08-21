# Agent Instructions & Guidelines

Adhere strictly to these rules when working on **Paralux Extract App**. Consult referenced rule files in [`rules/`](rules/) as needed for specific details and procedures.

## 1. Project Overview & Mental Model
**Paralux Extract** is an AI-powered structured data extraction platform. It features an interactive UI playground, schema builder, API keys manager, user portal, and a Cloud Functions backend integrating Gemini LLMs via `@google/adk` and Firebase services.

## 2. Tech Stack & Environment
- **Frontend (`src/`)**: React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + Firebase Web SDK (v12)
- **Backend (`functions/`)**: Node 22 (ESM) + Firebase Cloud Functions + Express + Zod + `@google/adk` (Gemini API)
- **Database & Auth**: Cloud Firestore, Firebase Storage, Firebase Authentication

## 3. Quick Commands & Verification Checklist
Before marking any task complete or committing changes, verify zero errors and zero warnings:
```bash
npm run lint             # Oxlint fast check
npm run build            # TypeScript check (tsc -b) & Vite bundle
npm run build:functions  # Cloud Functions TypeScript compilation
```

## 4. Core Rules & Reference Matrix

1. **Branching & Scope**: Never commit directly to `main`. Always branch off `staging` (`dev/*` or `hotfix/*`). If a task exceeds current branch scope, create a dedicated branch.
   👉 *Details:* [`rules/git-workflow.md`](rules/git-workflow.md) | [`CONTRIBUTING.md`](CONTRIBUTING.md)

2. **Commit Standards**: Strictly format commits with Conventional Commits (`feat`, `fix`, `style`, `refactor`, `docs`, `test`, `chore`) using valid project scopes.
   👉 *Details:* [`rules/commit-standards.md`](rules/commit-standards.md)

3. **Code Quality & Verification**: Zero-tolerance for linter and compiler warnings/errors. Strict typing without `any`.
   👉 *Details:* [`rules/code-quality.md`](rules/code-quality.md)

4. **Architecture & API Contracts**: Enforce input validation via Zod on all Cloud Function endpoints. Deliver clean business data in client responses.
   👉 *Details:* [`rules/architecture.md`](rules/architecture.md)

5. **Database & Security Guardrails**: Never expose raw AI tokens, provider models, or cost telemetry in public client responses (internal only in `/usage_logs`). Enforce user multi-tenancy authorization.
   👉 *Details:* [`rules/database-and-security.md`](rules/database-and-security.md)

## 5. Agent Behavioral Guidelines
- **Minimal Diffs**: Touch only files relevant to the active prompt. Never reformat or refactor unrelated code.
- **Documentation Preservation**: Preserve existing docstrings, TypeScript types, and architectural comments.
- **Verification First**: Always run lint and build commands to ensure changes compile cleanly before completing tasks.