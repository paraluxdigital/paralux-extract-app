# Commit Message Standards

Commits must strictly follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(<scope>): <subject in imperative mood>

[optional body: details of what changed and why]
- Detail 1
- Detail 2
```

## Types (`<type>`)
- `feat`: New feature or capability
- `fix`: Bug repair or runtime issue fix
- `style`: Formatting, layout, Tailwind adjustments (no logic change)
- `refactor`: Restructuring code without fix or feature
- `docs`: Documentation updates
- `test`: Adding or modifying tests
- `chore`: Tooling, build scripts, or dependency updates

## Common Scopes (`<scope>`)
`extraction` | `schema` | `ui` | `api` | `auth` | `functions` | `rules` | `config`

## Rules
- Imperative, present tense (`add feature`, not `added feature`).
- Lowercase subject, maximum 50 characters, no trailing period.
