#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const docsRoot = path.join(repoRoot, 'docs', 'content', 'docs');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (entry.isFile() && fullPath.endsWith('.mdx')) {
      files.push(fullPath);
    }
  }
  return files;
}

function humanizeIdentifier(input) {
  const spaced = input
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim();

  if (!spaced) return input;

  return spaced
    .split(/\s+/)
    .map((word) => {
      if (/^[A-Z0-9]+$/.test(word)) return word;
      return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
    })
    .join(' ');
}

function titleFromSignature(signature) {
  const beforeParen = signature.split('(')[0].trim();
  const methodName = beforeParen.includes('.')
    ? beforeParen.split('.').pop()
    : beforeParen;
  return humanizeIdentifier(methodName || signature);
}

function titleFromCodeHeading(code) {
  return humanizeIdentifier(code);
}

function normalizeFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const lines = original.split('\n');
  const out = [];
  let inExamplesSection = false;

  for (let i = 0; i < lines.length; i += 1) {
    let line = lines[i];

    if (/^##\s+/u.test(line)) {
      inExamplesSection = /^##\s+(Examples|Usage examples)\b/ui.test(line);
    }

    if (inExamplesSection && /^###\s+/u.test(line)) {
      line = line.replace(/^###\s+/u, '#### ');
    }

    const match = line.match(/^###\s+`([^`]+)`(.*)$/);
    if (!match) {
      out.push(line);
      continue;
    }

    const code = match[1].trim();
    const suffix = (match[2] || '').trim();
    const isMethodSignature = code.includes('(');

    const title = isMethodSignature
      ? titleFromSignature(code)
      : titleFromCodeHeading(code);

    out.push(`### ${title}${suffix ? ` ${suffix}` : ''}`);

    if (isMethodSignature) {
      const next = lines[i + 1] || '';
      const nextNext = lines[i + 2] || '';
      const alreadyHasUseLine = next.trim().startsWith('Use:') || nextNext.trim().startsWith('Use:');

      if (!alreadyHasUseLine) {
        out.push('');
        out.push(`Use: \`${code}\`.`);
      }
    }
  }

  const normalized = out.join('\n');
  if (normalized !== original) {
    fs.writeFileSync(filePath, normalized);
    return true;
  }
  return false;
}

const files = walk(docsRoot);
let changed = 0;
for (const file of files) {
  if (normalizeFile(file)) {
    changed += 1;
  }
}

console.log(`Normalized headings in ${changed} doc page(s).`);
