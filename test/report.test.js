// The report command delegates output and report writing to the test runner.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT, assert } from './helpers.js';

function report(source) {
  const directory = mkdtempSync(join(tmpdir(), 'eyemind-report-test-'));
  try {
    mkdirSync(join(directory, 'tools'));
    mkdirSync(join(directory, 'test'));
    writeFileSync(join(directory, 'package.json'), '{"type":"module"}');
    cpSync(join(ROOT, 'tools/report.js'), join(directory, 'tools/report.js'));
    writeFileSync(join(directory, 'REPORT.md'), 'saved report\n');
    writeFileSync(join(directory, 'test/run.js'), source);
    const result = spawnSync(process.execPath, [join(directory, 'tools/report.js')], { encoding: 'utf8', cwd: tmpdir() });
    return { ...result, report: readFileSync(join(directory, 'REPORT.md'), 'utf8') };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

export const tests = {
  'the report command preserves runner output diagnostics and its saved report'() {
    const result = report(`import { writeFileSync } from 'node:fs';
console.log('suite results');
console.error('suite diagnostic');
writeFileSync('REPORT.md', 'runner report\\n');`);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, 'suite results\n');
    assert.equal(result.stderr, 'suite diagnostic\n');
    assert.equal(result.report, 'runner report\n');
  },

  'the report command preserves failure codes and leaves old reports alone'() {
    const result = report("console.error('suite failed'); process.exitCode = 23;");
    assert.equal(result.status, 23);
    assert.equal(result.stderr, 'suite failed\n');
    assert.equal(result.report, 'saved report\n');
  },

  'a terminated runner makes the report command fail'() {
    const result = report(`console.log('== Report');
console.log('| partial report |');
process.kill(process.pid, 'SIGTERM');`);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '== Report\n| partial report |\n');
    assert.equal(result.report, 'saved report\n');
  },
};
