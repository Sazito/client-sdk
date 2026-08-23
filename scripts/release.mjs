#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const packageDefinitions = {
  sdk: {
    directory: repoRoot,
    manifest: join(repoRoot, 'package.json'),
    tag(version) { return `v${version}`; },
    commit(version) { return `chore(sdk): release ${version}`; },
    validate: ['pnpm', ['run', 'validate']]
  },
  checkout: {
    directory: join(repoRoot, 'packages', 'checkout'),
    manifest: join(repoRoot, 'packages', 'checkout', 'package.json'),
    tag(version) { return `checkout-v${version}`; },
    commit(version) { return `chore(checkout): release ${version}`; },
    validate: ['pnpm', ['run', 'release:check']]
  }
};

const HELP = `Release Sazito npm packages safely.

Usage:
  node scripts/release.mjs <sdk|checkout|all> [patch|minor|major] [options]

Options:
  --yes       Skip the interactive confirmation
  --no-push   Publish, commit, and tag locally without pushing Git refs
  --help      Show this help

Examples:
  pnpm release:checkout -- patch
  pnpm release:sdk -- minor
  pnpm release:all -- patch
  pnpm release:all -- patch --yes --no-push`;

function fail(message) {
  console.error(`\nRelease stopped: ${message}`);
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit'
  });
  if (result.error) fail(result.error.message);
  if (result.status !== 0 && !options.allowFailure) {
    fail(`\`${command} ${args.join(' ')}\` failed with exit code ${result.status}.`);
  }
  return result;
}

function readManifest(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function nextVersion(version, bump) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) fail(`Version ${version} is not a stable semantic version.`);
  let [, major, minor, patch] = match.map(Number);
  if (bump === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (bump === 'minor') {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }
  return `${major}.${minor}.${patch}`;
}

function packageIsPublished(name, version) {
  const result = run('npm', ['view', `${name}@${version}`, 'version'], {
    capture: true,
    allowFailure: true
  });
  return result.status === 0 && result.stdout.trim() === version;
}

function parseArguments(argv) {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(HELP);
    process.exit(0);
  }
  const positional = argv.filter((arg) => !arg.startsWith('--'));
  const target = positional[0];
  const bump = positional[1] ?? 'patch';
  if (!['sdk', 'checkout', 'all'].includes(target)) {
    fail(`Choose sdk, checkout, or all.\n\n${HELP}`);
  }
  if (!['patch', 'minor', 'major'].includes(bump)) {
    fail(`Choose patch, minor, or major.\n\n${HELP}`);
  }
  // pnpm preserves the standalone `--` used to separate script arguments.
  const knownOptions = new Set(['--', '--yes', '--no-push']);
  const unknownOption = argv.find((arg) => arg.startsWith('--') && !knownOptions.has(arg));
  if (unknownOption) fail(`Unknown option: ${unknownOption}`);
  return {
    target,
    bump,
    yes: argv.includes('--yes'),
    push: !argv.includes('--no-push')
  };
}

async function confirmRelease(plans, skipConfirmation, push) {
  console.log('\nRelease plan:');
  for (const plan of plans) {
    console.log(`  ${plan.name}: ${plan.currentVersion} -> ${plan.nextVersion}`);
  }
  console.log(`  Git push: ${push ? 'yes' : 'no'}`);
  if (skipConfirmation) return;
  if (!process.stdin.isTTY) fail('Use --yes in a non-interactive environment.');
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await prompt.question('\nPublish these versions? [y/N] ');
  prompt.close();
  if (!['y', 'yes'].includes(answer.trim().toLowerCase())) {
    console.log('Release cancelled.');
    process.exit(0);
  }
}

function ensureRepositoryIsReady() {
  const status = run('git', ['status', '--porcelain'], { capture: true });
  if (status.stdout.trim()) fail('Commit or stash all changes before releasing.');
  const branch = run('git', ['branch', '--show-current'], { capture: true }).stdout.trim();
  if (!branch) fail('Releases cannot run from a detached HEAD.');
  run('npm', ['whoami']);
  return branch;
}

function releasePackage(plan) {
  const definition = packageDefinitions[plan.key];
  console.log(`\nValidating ${plan.name}...`);
  run(definition.validate[0], definition.validate[1], { cwd: definition.directory });

  console.log(`\nBumping ${plan.name} to ${plan.nextVersion}...`);
  run('npm', ['version', plan.nextVersion, '--no-git-tag-version', '--ignore-scripts'], {
    cwd: definition.directory
  });

  console.log(`\nPublishing ${plan.name}@${plan.nextVersion}...`);
  run('npm', ['publish', '--access', 'public', '--tag', 'latest'], {
    cwd: definition.directory
  });

  const manifestPath = relative(repoRoot, definition.manifest);
  run('git', ['add', manifestPath]);
  run('git', ['commit', '-m', definition.commit(plan.nextVersion)]);
  const tag = definition.tag(plan.nextVersion);
  run('git', ['tag', tag]);
  return tag;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const branch = ensureRepositoryIsReady();
  const keys = options.target === 'all' ? ['sdk', 'checkout'] : [options.target];
  const plans = keys.map((key) => {
    const manifest = readManifest(packageDefinitions[key].manifest);
    return {
      key,
      name: manifest.name,
      currentVersion: manifest.version,
      nextVersion: nextVersion(manifest.version, options.bump)
    };
  });

  for (const plan of plans) {
    if (packageIsPublished(plan.name, plan.nextVersion)) {
      fail(`${plan.name}@${plan.nextVersion} is already published.`);
    }
    const tag = packageDefinitions[plan.key].tag(plan.nextVersion);
    const existingTag = run('git', ['rev-parse', '--quiet', '--verify', `refs/tags/${tag}`], {
      capture: true,
      allowFailure: true
    });
    if (existingTag.status === 0) fail(`Git tag ${tag} already exists.`);
  }

  await confirmRelease(plans, options.yes, options.push);
  const tags = plans.map(releasePackage);

  if (options.push) {
    console.log(`\nPushing ${branch} and release tags...`);
    run('git', ['push', 'origin', `HEAD:${branch}`]);
    run('git', ['push', 'origin', ...tags]);
  }

  console.log('\nRelease complete:');
  for (const plan of plans) {
    console.log(`  ${plan.name}@${plan.nextVersion}`);
  }
  if (!options.push) {
    console.log(`\nPush later with:\n  git push origin HEAD:${branch}\n  git push origin ${tags.join(' ')}`);
  }
}

await main();
