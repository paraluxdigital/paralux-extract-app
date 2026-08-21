# Code Quality & Local Verification

Before completing tasks or opening pull requests, you **must** verify zero errors and zero warnings.

## Verification Commands
Run in the project root:

```bash
# 1. Lint check (Oxlint)
npm run lint

# 2. Frontend type-check & production build
npm run build

# 3. Backend (Cloud Functions) compilation
npm run build:functions
```

## Quality & Typing Standards
- **Strict TypeScript**: Avoid `any`. Define precise interfaces or infer types from Zod schemas (`z.infer<typeof Schema>`).
- **Zero Warnings**: Treat compiler warnings and linter warnings as errors that must be resolved.
- **Component State**: Avoid unhandled promise rejections or dangling asynchronous state updates in React components.
- **Environment Parity**: Do not introduce dependencies that depend on browser globals in `functions/` or Node-specific built-ins in `src/`.
