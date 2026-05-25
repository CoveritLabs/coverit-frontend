# Docker Images

> **Status: planned.** The workflow described below is not yet implemented. This section documents the intended design so that platform and consumer teams can plan accordingly.

## Overview

The CI/CD pipeline will automatically build and publish Docker images for every significant event in the repository. These images are consumed by other CoveritLabs repositories (e.g., integration environments, E2E test suites, staging deployments).

## Image variants

| Trigger                    | Image tag pattern     | Registry path                                         | Intended consumers                      |
| -------------------------- | --------------------- | ----------------------------------------------------- | --------------------------------------- |
| Push to `develop`          | `develop-<short-sha>` | `ghcr.io/coveritlabs/coverit-frontend:develop-<sha>`  | Internal staging, integration tests     |
| Push to `develop` (latest) | `develop`             | `ghcr.io/coveritlabs/coverit-frontend:develop`        | Always-latest develop snapshot          |
| Push to `main`             | `main-<short-sha>`    | `ghcr.io/coveritlabs/coverit-frontend:main-<sha>`     | Pre-production validation               |
| Push to `main` (latest)    | `main`                | `ghcr.io/coveritlabs/coverit-frontend:main`           | Always-latest stable snapshot           |
| Git tag `vX.Y.Z` on `main` | `X.Y.Z` + `latest`   | `ghcr.io/coveritlabs/coverit-frontend:X.Y.Z`          | Production deployments, other CL repos  |

## Tagging convention

```
ghcr.io/coveritlabs/coverit-frontend:<tag>
```

| Tag               | Mutable | Description                                                    |
| ----------------- | ------- | -------------------------------------------------------------- |
| `develop`         | Yes     | Always points to the most recent develop build.                |
| `develop-<sha>`   | No      | Exact commit from `develop`. Use this to pin in dependent repos. |
| `main`            | Yes     | Always points to the most recent build from `main`.            |
| `main-<sha>`      | No      | Exact commit from `main`.                                      |
| `X.Y.Z`           | No      | Immutable release image. Preferred for production.             |
| `latest`          | Yes     | Always equals the most recent `vX.Y.Z` release. Avoid in production. |

## Consuming images in other CoveritLabs repositories

Pin to an immutable tag in any environment where reproducibility matters:

```yaml
# Good — pinned to a specific release
image: ghcr.io/coveritlabs/coverit-frontend:1.2.0

# Good — pinned to a specific develop build for integration testing
image: ghcr.io/coveritlabs/coverit-frontend:develop-a3f9c12

# Avoid in production — mutable, can change without notice
image: ghcr.io/coveritlabs/coverit-frontend:develop
image: ghcr.io/coveritlabs/coverit-frontend:latest
```

## Build behaviour

- Images are built from the repository root using the project `Dockerfile` (to be added).
- The build runs `tsc -b && vite build` and serves the static output with a minimal web server (e.g., nginx or Caddy).
- Build arguments will expose `VITE_*` environment variables at build time; secrets are never baked into images.
- Multi-platform builds (`linux/amd64`, `linux/arm64`) will be enabled for release tags.
