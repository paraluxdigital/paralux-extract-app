# Git Workflow & Branching Strategy

## Branch Hierarchy
- **`main`**: Production code only. **NEVER commit directly to `main`**.
- **`staging`**: Integration and pre-release branch. Base branch for all feature work.
- **`dev/*`** (`dev/schema-builder`, `dev/pdf-preview`, etc.): Feature, fix, or enhancement branches.
- **`hotfix/*`** (`hotfix/cors-fix`, etc.): Critical production hotfixes created directly from `main` and merged into both `main` and `staging`.

## Scope Rule
Before modifying files, verify your active branch (`git branch --show-current`). If the requested work is outside the scope of your current branch:
```bash
git checkout staging
git pull origin staging
git checkout -b dev/<feature-or-fix-name>
```

## Integration Flow
1. Branch from latest `staging`.
2. Implement and test changes.
3. Validate locally (`npm run lint && npm run build`).
4. Commit using Conventional Commits.
5. Merge / PR into `staging`.
