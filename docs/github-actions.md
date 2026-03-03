# GitHub Actions

Workflows live in `.github/workflows/`. Each file here documents one workflow.

> Additional workflows should be added as new files in `.github/workflows/` and documented here with their own section.

---

## `branch-validation.yml` — Branch Name Validation

**Trigger:** Every pull request targeting `main` or `develop`

### What it does

Validates two things on every PR:

1. **Source branch name** — must follow the naming convention in [branching.md](./branching.md).
2. **Target branch** — must match the documented "Merges into" rules for that prefix.

The job fails immediately if either check fails, blocking the PR from being merged.

**Allowed patterns and targets:**

| Source branch pattern | Allowed target |
| --------------------- | -------------- |
| `main`, `develop` | any (long-lived back-merges) |
| `feat/<slug>` | `develop` only |
| `fix/<slug>` | `develop` only |
| `chore/<slug>` | `develop` only |
| `docs/<slug>` | `develop` only |
| `hotfix/<slug>` | `main` or `develop` |
| `release/<slug>` | `main` or `develop` |

`<slug>` must be lowercase and may only contain letters, digits, dots (`.`), underscores (`_`), and hyphens (`-`).

### Why it exists

Enforces consistent branch names across all contributors so that automated tooling (Docker tagging, release scripts, changelogs) can reliably parse branch context from CI environment variables.
