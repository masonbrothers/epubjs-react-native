import { existsSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const engine = resolve(root, 'vendor/epub.js');
const expectedCommit = '0af7496052fb140aae07c7ce9d0e3828229a19d5';
const actualCommit = execFileSync('git', ['-C', engine, 'rev-parse', 'HEAD'], {
  encoding: 'utf8',
}).trim();

if (actualCommit !== expectedCommit) {
  throw new Error(
    `Expected EPUB.js submodule ${expectedCommit}, received ${actualCommit}`
  );
}

if (!existsSync(resolve(engine, 'node_modules/webpack/bin/webpack.js'))) {
  throw new Error(
    'EPUB.js dependencies are missing. Run `npm run engine:install` first.'
  );
}

const nodeOptions = [
  process.env.NODE_OPTIONS,
  '--openssl-legacy-provider',
].filter(Boolean).join(' ');
const result = spawnSync('npm', ['run', 'minify'], {
  cwd: engine,
  env: { ...process.env, NODE_OPTIONS: nodeOptions },
  stdio: 'inherit',
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

if (!existsSync(resolve(engine, 'dist/epub.min.js'))) {
  throw new Error('EPUB.js build did not produce dist/epub.min.js');
}
