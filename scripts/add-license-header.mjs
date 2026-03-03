#!/usr/bin/env node

// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.


// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.

// Pre-commit hook: prepends the CoverIt proprietary license header to staged
// source files that are missing it (.ts .tsx .js .jsx .mts .mjs .css).
// Called by .husky/pre-commit — can also be run directly: node scripts/add-license-header.mjs

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { extname } from 'path';

const JS_HEADER = `\
// Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
// Proprietary and confidential. Unauthorized use is strictly prohibited.
// See LICENSE file in the project root for full license information.
`;

const CSS_HEADER = `\
/* Copyright (c) 2026 CoverIt Labs. All Rights Reserved.
 * Proprietary and confidential. Unauthorized use is strictly prohibited.
 * See LICENSE file in the project root for full license information.
 */
`;

/** Returns the correct header for the given file extension. */
function headerFor(ext) {
  return ext === '.css' ? CSS_HEADER : JS_HEADER;
}

/** Returns true when the file already starts with the copyright marker. */
function hasHeader(content, ext) {
  const marker = ext === '.css' ? '/* Copyright (c)' : '// Copyright (c)';
  return content.trimStart().startsWith(marker);
}

const ALLOWED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mts', '.mjs', '.css']);

let stagedFiles;
try {
  stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', {
    encoding: 'utf8',
  })
    .split('\n')
    .map((f) => f.trim())
    .filter((f) => f.length > 0 && ALLOWED_EXTENSIONS.has(extname(f)));
} catch {
  // Not inside a git repo or no staged files, aka nothing to do.
  process.exit(0);
}

if (stagedFiles.length === 0) {
  process.exit(0);
}

let modified = 0;

for (const file of stagedFiles) {
  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    // File may have been deleted between the diff and now — skip.
    continue;
  }

  const ext = extname(file);
  if (hasHeader(content, ext)) continue;

  const header = headerFor(ext);

  // Preserve shebangs on the very first line.
  if (content.startsWith('#!')) {
    const newline = content.indexOf('\n');
    const shebang = content.slice(0, newline + 1);
    const rest = content.slice(newline + 1);
    writeFileSync(file, `${shebang}\n${header}\n${rest}`, 'utf8');
  } else {
    writeFileSync(file, `${header}\n${content}`, 'utf8');
  }

  // Re-stage so the header is included in the commit.
  execSync(`git add "${file}"`);
  console.log(`[license] Header added → ${file}`);
  modified++;
}

if (modified > 0) {
  console.log(`[license] ${modified} file(s) updated with license header.`);
} else {
  console.log('[license] All staged files already have the license header.');
}

process.exit(0);
