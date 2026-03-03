# Commit Message Convention

This repository follows **[Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)**.

> **Tip:** run `npm run commit` to use the interactive [Commitizen](https://commitizen-tools.github.io/commitizen/) prompt instead of writing the message by hand. The prompt is driven by the same `commitlint.config.js` rules that enforce this convention at commit time.

## Format

```
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

- **type** and **summary** are mandatory.
- **scope** is optional but recommended when it improves clarity.
- The summary must be written in the **imperative, present tense** ("add" not "added" / "adds").
- The summary must **not** end with a period.
- The entire header line must be **≤ 72 characters**.

## Types

| Type       | When to use                                                          |
| ---------- | -------------------------------------------------------------------- |
| `feat`     | A new feature visible to end users                                   |
| `fix`      | A bug fix visible to end users                                       |
| `chore`    | Maintenance tasks that do not affect production behaviour            |
| `docs`     | Documentation changes only                                           |
| `style`    | Formatting, whitespace — no logic change                             |
| `refactor` | Code restructuring that is neither a feature nor a bug fix           |
| `perf`     | A change that improves performance                                   |
| `test`     | Adding or correcting tests                                           |
| `build`    | Changes to the build system or external dependencies (vite, tsc, …) |
| `ci`       | Changes to CI/CD pipeline configuration                              |
| `revert`   | Reverts a previous commit                                            |

## Breaking changes

Append a `!` after the type/scope, and add a `BREAKING CHANGE:` footer:

```
feat(auth)!: replace cookie session with JWT

BREAKING CHANGE: The Set-Cookie header is no longer issued. Clients must
store and send the Authorization header on every request.
```

A breaking change in any commit triggers a **major** semver bump.

## Scopes (recommended)

Scopes correspond to the main areas of the codebase. Use lowercase, hyphenated names.

| Scope     | Area                                      |
| --------- | ----------------------------------------- |
| `auth`    | Authentication / session management       |
| `ui`      | Shared UI components                      |
| `routing` | React Router configuration                |
| `api`     | API client / fetching layer               |
| `store`   | Global state management                   |
| `config`  | App configuration & environment variables |
| `deps`    | Dependency upgrades                       |
| `release` | Version bumps and release preparation     |

## Examples

```
feat(auth): add Google OAuth sign-in button
fix(api): retry failed requests up to 3 times before throwing
chore(deps): upgrade vite from 5 to 6
docs(contributing): add commit convention guide
refactor(ui): extract Button into a compound component
perf(routing): lazy-load dashboard route
ci: add Docker publish workflow for develop branch
chore(release): bump version to 1.2.0
```
