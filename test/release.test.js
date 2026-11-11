// Invalid release messages must stop before any git operation or publication.
import { spawnSync } from 'node:child_process';
import { chmodSync, cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

// Run a copy with command stubs: no real Git operation or publication can
// happen, but the release ordering and failure handling are exercised.
function simulatedRelease(failEarl = false) {
  const directory = mkdtempSync(join(tmpdir(), 'eyemind-release-flow-'));
  const trace = join(directory, 'trace');
  try {
    cpSync(join(ROOT, 'release'), join(directory, 'release'));
    for (const [name, body] of Object.entries({
      git: 'exit 0\n',
      npm: 'if [ "$1" = version ]; then printf "v9.9.9\\n"; fi\n' +
        'if [ "$*" = "test -- unit -k earl" ] && [ "$RELEASE_TEST_FAIL_EARL" = 1 ]; then exit 23; fi\n',
      node: 'exit 0\n',
      'systemd-run': 'exit 1\n',
    })) {
      const path = join(directory, name);
      writeFileSync(path, `#!/bin/sh\nprintf '%s\\n' "${name} $*" >> "$RELEASE_TEST_TRACE"\n${body}`);
      chmodSync(path, 0o755);
    }
    const result = spawnSync('bash', [join(directory, 'release'), 'patch', 'Add native proofs and test-suite reports'], {
      encoding: 'utf8', env: { ...process.env, PATH: directory + delimiter + process.env.PATH,
        RELEASE_TEST_TRACE: trace, RELEASE_TEST_FAIL_EARL: failEarl ? '1' : '0' },
    });
    return { ...result, calls: readFileSync(trace, 'utf8').trim().split('\n') };
  } finally { rmSync(directory, { recursive: true, force: true }); }
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
  'release refreshes EARL after the version bump and before committing and publishing'() {
    const result = simulatedRelease();
    assert.equal(result.status, 0, result.stderr);
    const calls = result.calls;
    const full = calls.indexOf('npm test');
    const bump = calls.indexOf('npm version patch --no-git-tag-version');
    const synced = calls.indexOf('node tools/version.js --check');
    const earl = calls.indexOf('npm test -- unit -k earl');
    const commit = calls.findIndex((line) => line.startsWith('git commit '));
    const push = calls.indexOf('git push --atomic origin main v9.9.9');
    assert.ok(full >= 0 && bump > full && synced > bump && earl > synced && commit > earl && push > commit);
  },
  'a failed release EARL check prevents the release commit, tag and push'() {
    const result = simulatedRelease(true);
    assert.equal(result.status, 23, result.stderr);
    assert.ok(result.calls.includes('npm test -- unit -k earl'));
    assert.ok(!result.calls.some((line) => /^git (commit|tag|push) /.test(line)));
  },
};
