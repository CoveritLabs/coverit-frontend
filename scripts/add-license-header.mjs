#!/usr/bin/env node

// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

// Pre-commit hook that prepends the CoverIt proprietary license header
// to staged source files missing it.
// Called by .husky/pre-commit — also runnable via: node scripts/add-license-header.mjs

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { extname } from 'path';

const JS_HEADER = `\
// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.
`;

const ALLOWED_EXTENSIONS = new Set(['.ts', '.tsx', '.ts', '.js', '.jsx', '.mts', '.mjs', '.css', '.scss']);

/** Returns the correct header for the given file extension. */
function headerFor() {
  return JS_HEADER;
}

/** Returns `true` when the content already starts with the copyright marker. */
function hasHeader(content) {
  const marker = '// Copyright (c)';
  const checkContent = content.startsWith('#!')
    ? content.slice(content.indexOf('\n') + 1)
    : content;
  return checkContent.trimStart().startsWith(marker);
}

/** Prepends the header to content, preserving any shebang on line 1. */
function prependHeader(content, header) {
  if (content.startsWith('#!')) {
    const newline = content.indexOf('\n');
    return `${content.slice(0, newline + 1)}\n${header}\n${content.slice(newline + 1)}`;
  }
  return `${header}\n${content}`;
}

// Retrieve staged files from the git index.
let stagedFiles;
try {
  stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', {
    encoding: 'utf8',
  })
    .split('\n')
    .map((f) => f.trim())
    .filter((f) => f.length > 0 && ALLOWED_EXTENSIONS.has(extname(f)));
} catch {
  process.exit(0);
}

if (stagedFiles.length === 0) {
  process.exit(0);
}

let modified = 0;

for (const file of stagedFiles) {
  let stagedContent;
  try {
    stagedContent = execSync(`git show ":${file}"`, { encoding: 'utf8' });
  } catch {
    continue;
  }

  if (hasHeader(stagedContent)) continue;

  const header = headerFor();
  const newStagedContent = prependHeader(stagedContent, header);

  // Write header into the index directly to preserve partial staging.
  const hash = execSync('git hash-object -w --stdin', {
    input: newStagedContent,
    encoding: 'utf8',
  }).trim();

  const mode = execSync(`git ls-files --stage "${file}"`, { encoding: 'utf8' })
    .trim()
    .split(' ')[0];

  execSync(`git update-index --cacheinfo ${mode},${hash},${file}`);

  // Patch the working-tree copy so the diff stays consistent.
  try {
    const workingContent = readFileSync(file, 'utf8');
    if (!hasHeader(workingContent)) {
      writeFileSync(file, prependHeader(workingContent, header), 'utf8');
    }
  } catch {
    // Working-tree file unreadable — skipping.
  }

  console.log(`[license] Header added → ${file}`);
  modified++;
}

if (modified > 0) {
  console.log(`[license] ${modified} file(s) updated with license header.`);
} else {
  console.log('[license] All staged files already have the license header.');
}

process.exit(0);
