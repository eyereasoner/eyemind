// Invalid release messages must stop before any git operation or publication.
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { ROOT, assert } from './helpers.js';

function attempt(args) {
  const directory = mkdtempSync(join(tmpdir(), 'eyemind-release-test-'));
  const calls = join(directory, 'calls');
  try {
    const git = join(directory, 'git');
    writeFileSync(git, '#!/bin/sh\nprintf "%s\\n" "$*" >> "$RELEASE_TEST_GIT_CALLS"\nexit 97\n');
    chmodSync(git, 0o755);
    const result = spawnSync('bash', [join(ROOT, 'release'), ...args], { encoding: 'utf8',
      env: { ...process.env, PATH: directory + delimiter + process.env.PATH, RELEASE_TEST_GIT_CALLS: calls } });
    return { ...result, touchedGit: existsSync(calls) };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

export const tests = {
  'empty release messages stop before git'() {
    for (const args of [[], ['patch'], ['minor', '   ']]) {
      const result = attempt(args);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /descriptive release message/);
      assert.equal(result.touchedGit, false);
    }
  },
  'version-only release messages stop before git'() {
    for (const message of ['Release v0.7.2', 'v0.7.2', '0.7.2', 'Release v0.7.2: ']) {
      const result = attempt(['patch', message]);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /descriptive release message/);
      assert.equal(result.touchedGit, false);
    }
  },
  'descriptive release messages reach the normal clean-tree checks'() {
    for (const message of ['Align navigation and broaden conformance coverage', 'Release v0.7.2: improve conformance']) {
      const result = attempt(['patch', message]);
      assert.equal(result.touchedGit, true);
      assert.doesNotMatch(result.stderr, /supply a descriptive release message/);
      assert.notEqual(result.status, 0);
    }
  },
};
