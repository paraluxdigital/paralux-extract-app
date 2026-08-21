# Architecture & Implementation Guardrails

## Tech Stack & Architecture
- **Frontend (`src/`)**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Firebase Web SDK (v12).
  - Component-driven architecture (`src/components/`).
  - Shared context providers (`src/context/`) for global navigation and session states.
  - Dedicated services (`src/services/`) for Firebase operations and backend API calls.
  - Strict TypeScript types (`src/types/`).
- **Backend (`functions/`)**: Firebase Cloud Functions (Node 22 ESM) + Express + Zod + `@google/adk` (Gemini API).
  - Routes in `functions/src/routes.ts` or `index.ts`.
  - Input validation using Zod schemas (`functions/src/zodHelper.ts`).
  - Core AI extraction and business logic in `functions/src/service.ts`.

## API Request & Response Contracts
- **Input Validation**: Every Cloud Function endpoint receiving a request body must validate it using Zod schemas before processing.
- **Client Responses**: Deliver clean business data only (`status`, `extractionId`, `data`, `creditsUsed`, `creditsRemaining`, `executionTimeMs`).
- **Error Handling**: Use structured HTTP status codes (400 for bad input, 401 for unauthorized, 402 for insufficient credits, 500 for server errors) with actionable error messages.

## Code Integrity & Minimal Diffs
- Maintain existing docstrings, TypeScript types, and architectural comments.
- Keep diffs focused and minimal; do not refactor unrelated files or change project formatting styles.
