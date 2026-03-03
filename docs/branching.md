# Branch Strategy

Two long-lived branches exist; everything else is short-lived.

| Branch    | Purpose                                            | Direct push | Protected |
| --------- | -------------------------------------------------- | ----------- | --------- |
| `main`    | Production-ready code. Tagged releases live here.  | No          | Yes       |
| `develop` | Integration branch. All feature work targets here. | No          | Yes       |

## Short-lived branches

Branch off `develop` unless the work is a hotfix for `main`.

| Prefix      | Branches from | Merges into        | Example                     |
| ----------- | ------------- | ------------------ | --------------------------- |
| `feat/`     | `develop`     | `develop`          | `feat/auth-modal`           |
| `fix/`      | `develop`     | `develop`          | `fix/token-refresh-loop`    |
| `hotfix/`   | `main`        | `main` + `develop` | `hotfix/critical-xss-patch` |
| `chore/`    | `develop`     | `develop`          | `chore/update-vite`         |
| `docs/`     | `develop`     | `develop`          | `docs/contributing-guide`   |
| `release/`  | `develop`     | `main` + `develop` | `release/1.2.0`             |

## Merge rules

- Use **pull requests** for every merge; direct pushes to `main` and `develop` are blocked.
- Prefer **squash-merge** for `feat/` and `fix/` branches → keeps `develop` history linear.
- Use **merge commits** (no squash) when merging `release/` or `hotfix/` branches so that the merge point is clearly visible in both `main` and `develop`.
- Delete the source branch after merging.

## Release flow

```
develop ──► release/x.y.z ──► main   (tagged vx.y.z)
                           └──► develop  (back-merge)
```

1. Cut a `release/x.y.z` branch from `develop`.
2. Bump the version in `package.json` and commit with `chore(release): bump version to x.y.z`.
3. Open a PR targeting `main`. After approval, merge with a merge commit.
4. Tag `main` with `vx.y.z`.
5. Open a back-merge PR from `main` (or the release branch) into `develop`.
