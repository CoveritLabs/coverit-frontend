# Git Hooks

Hooks are managed with **[Husky](https://typicode.github.io/husky/)** and live in `.husky/`. They are installed automatically after `npm install` via the `prepare` lifecycle script.

> Additional hooks should be added as new files inside `.husky/` and documented here with their own section.

---

## `pre-commit`

**File:** [.husky/pre-commit](../.husky/pre-commit)  
**Scripts:** [scripts/add-license-header.mjs](../scripts/add-license-header.mjs)

This hook runs two checks in sequence. Both must pass for the commit to proceed.

### Check 1 — License header

Inspects every staged source file (`.ts`, `.tsx`, `.js`, `.jsx`, `.mts`, `.mjs`, `.css`) and prepends the CoverIt proprietary license header if it is missing. Files that already carry the header are left untouched.

**JavaScript / TypeScript header:**

```
// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.
```

**CSS header:**

```css
/* Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
 * Proprietary and confidential. Unauthorized use is strictly prohibited.
 * See LICENSE file in the project root for full license information.
 */
```

Modified files are automatically re-staged so the header is included in the commit without any manual intervention. Shebangs (`#!`) on the first line are preserved.

**Running manually:**

```bash
npm run check:license
# or directly:
node scripts/add-license-header.mjs
```

### Check 2 — Branch name

Validates that the current branch name follows the naming convention defined in [branching.md](./branching.md) before you waste a commit on a wrongly-named branch. The same rule is enforced server-side by the `branch-validation.yml` workflow, but catching it locally is faster.

**Allowed format:** `<type>/<slug>`  
**Allowed types:** `feat`, `fix`, `hotfix`, `chore`, `docs`, `release`  
**Slug rules:** lowercase letters, digits, hyphens, dots, underscores  
**Exempt:** `main` and `develop` are always allowed.

### Bypassing (use sparingly)

```bash
git commit --no-verify -m "chore: emergency fix"
```

Bypassing skips **all** `pre-commit` checks. Document the reason in the commit body.

---

## `commit-msg`

**File:** [.husky/commit-msg](../.husky/commit-msg)  
**Tool:** [commitlint](https://commitlint.js.org/) — configured in [`commitlint.config.js`](../commitlint.config.js)

### What it does

Runs after you finish writing a commit message and validates it against the Conventional Commits rules defined in `commitlint.config.js`. If the message does not conform, the commit is rejected with a clear error explaining which rule failed.

```js
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
};
```

This enforces the convention described in [commit-convention.md](./commit-convention.md) automatically — no manual checking required.

### Interactive commits with Commitizen

Instead of writing commit messages manually, use the interactive prompt to be guided through the correct format:

```bash
npm run commit
```

This runs `cz`, which uses `@commitlint/cz-commitlint` as the adapter so the prompt's choices stay in sync with the `commitlint.config.js` rules.

### Bypassing (use sparingly)

```bash
git commit --no-verify -m "chore: emergency fix"
```

Bypassing skips **both** `pre-commit` and `commit-msg`. Document the reason in the commit body.
