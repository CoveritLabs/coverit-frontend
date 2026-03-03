# Contributing to coverit-frontend

All contributors — human and automated — must follow the conventions documented here to keep the history clean and the CI/CD pipeline predictable.

## Local setup

```bash
npm install
```

This is the only command needed. The `prepare` lifecycle script runs `husky` automatically, installing all Git hooks described in [docs/git-hooks.md](docs/git-hooks.md).

## Documentation

| Topic | File |
| ----- | ---- |
| Branch strategy — long-lived branches, short-lived prefixes, merge rules, release flow | [docs/branching.md](docs/branching.md) |
| Commit message convention — Conventional Commits types, scopes, breaking changes | [docs/commit-convention.md](docs/commit-convention.md) |
| Git hooks — Husky `pre-commit` (license header) and `commit-msg` (commitlint) | [docs/git-hooks.md](docs/git-hooks.md) |
| GitHub Actions — branch name validation and other CI workflows | [docs/github-actions.md](docs/github-actions.md) |
