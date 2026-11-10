import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const failures = new Set();
const git = (args, input) => execFileSync('git', args, {
  cwd: root,
  input,
  encoding: 'utf8',
  maxBuffer: 16 * 1024 * 1024,
});
const split = (value) => value.split('\0').filter(Boolean);

function ignoredPaths(files) {
  if (!files.length) return new Set();
  try {
    return new Set(split(git(['check-ignore', '--no-index', '-z', '--stdin'], `${files.join('\0')}\0`)));
  } catch (error) {
    if (error.status === 1) return new Set();
    throw error;
  }
}

// Exercise patterns without creating secrets or changing the Git index.
const privateProbes = [
  '.private/example.txt', '.env', '.env.local', '.env.staging', '.env.backup',
  'src/.env.example', 'config/production.env', '.neon', '.npmrc',
  '.agents/skills/local/SKILL.md', '.codex/config.toml', 'skills-lock.json',
  'data/overtime_store.json', 'data/nested/records.txt', 'data/upload.png',
  'wa_export.txt', 'wa_lampiran/image.jpg', 'arsip_percakapan_codex/chat.txt',
  'report.PDF', 'report.xlsx', 'export.csv', 'backup.zip', 'private.key',
  'credentials.json', 'service-account-prod.json', 'database.sqlite-wal',
  'database.sqlite3-shm', 'database.db-journal', 'sessions.jsonl',
  '.next/server/app.js', 'node_modules/package/index.js', 'test-results/screen.png',
];
const allowedProbes = [
  '.gitignore', '.dockerignore', '.env.example', 'AGENTS.md', 'README.md',
  'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'data/.gitkeep',
  'next.config.ts', 'src/app/page.tsx', 'public/next.svg',
  'scripts/init-neon-db.sql', 'scripts/check-privacy.mjs',
];
const ignoredProbes = ignoredPaths([...privateProbes, ...allowedProbes]);
for (const file of privateProbes) {
  if (!ignoredProbes.has(file)) failures.add(`Private path is not ignored: ${file}`);
}
for (const file of allowedProbes) {
  if (ignoredProbes.has(file)) failures.add(`Required project file is ignored: ${file}`);
}

const candidates = [...new Set(split(git(['ls-files', '-z', '--cached', '--others', '--exclude-standard'])))];
for (const file of ignoredPaths(candidates)) {
  failures.add(`Private/generated file is already tracked; .gitignore alone cannot protect it: ${file}`);
}

const detectors = [
  ['private key', /-----BEGIN (?:[A-Z]+ )*PRIVATE KEY-----/],
  ['provider token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[A-Z0-9]{16}|sk-(?:proj-)?[A-Za-z0-9_-]{24,})\b/],
  ['credential in URL', /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s:'"<>]+:[^\s@'"<>]+@/],
  ['hardcoded secret', /\b(?:[A-Z_]*(?:SECRET|PASSWORD|API_KEY|ACCESS_TOKEN)|secret|password|apiKey|accessToken)\s*[:=]\s*['"][^'"\r\n]{8,}['"]/],
];
const emailPattern = /[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi;
const exampleDomains = new Set(['example.com', 'example.org', 'example.net', 'example.invalid']);

function scan(file, bytes, label = file) {
  // Binary assets need a visual/manual review; do not print their contents.
  if (bytes.includes(0)) return;
  const text = bytes.toString('utf8');
  for (const [kind, pattern] of detectors) {
    if (pattern.test(text)) failures.add(`Review ${kind}: ${label}`);
  }
  for (const match of text.matchAll(emailPattern)) {
    if (!exampleDomains.has(match[1].toLowerCase())) failures.add(`Review non-example email: ${label}`);
  }
}

for (const file of candidates) {
  try {
    scan(file, readFileSync(path.join(root, file)));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

// Review the staged version too: a clean working copy can hide an older staged secret.
const staged = split(git(['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z']));
for (const file of staged) {
  const bytes = execFileSync('git', ['show', `:${file}`], { cwd: root, maxBuffer: 16 * 1024 * 1024 });
  scan(file, bytes, `${file} (staged)`);
}

// Gitignore does not stop Next.js from serving a local file under public/.
function publicFiles(directory = 'public') {
  return readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap((entry) => {
    const file = `${directory}/${entry.name}`;
    if (entry.isSymbolicLink()) {
      failures.add(`Review symlink in public assets: ${file}`);
      return [];
    }
    return entry.isDirectory() ? publicFiles(file) : [file];
  });
}
for (const file of ignoredPaths(publicFiles())) {
  failures.add(`Private file would still be served by Next.js; move it outside public/: ${file}`);
}

if (failures.size) {
  console.error([...failures].join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Privacy checks passed: ${privateProbes.length} private patterns, ${allowedProbes.length} public patterns, ${candidates.length} candidate files, ${staged.length} staged files.`);
  console.log('Heuristic scan only. Manually review new source, documents and media before publishing.');
}
