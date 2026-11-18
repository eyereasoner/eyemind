// Run independent upstream cases in at most two threads. Pass case indexes
// so the terms parsed in each thread keep their LS prototypes. Publish
// results in the same order as a serial run.
import * as os from 'node:os';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { mobibenchCases, runMobibenchCase } from './mobibench.js';
import { scoreShaclCase, scoredShaclCases } from './shacl.js';

function scoreMobibenchCase(item) {
  const started = performance.now();
  let problem = null;
  try { runMobibenchCase(item); }
  catch (error) { problem = `${error?.stack ?? String(error)}\n`; }
  return { ms: performance.now() - started, problem };
}

const suites = {
  mobibench: [mobibenchCases, scoreMobibenchCase],
  shacl: [scoredShaclCases, scoreShaclCase],
};

function score(suite, indexes, cases = suites[suite][0]()) {
  const [, run] = suites[suite];
  return indexes.map((index) => run(cases[index]));
}

export async function scoreUpstreamCases(suite, indexes, cases) {
  const jobs = Math.min(2, os.availableParallelism?.() ?? os.cpus().length, indexes.length);
  if (jobs < 2) return score(suite, indexes, cases);
  const workers = [];
  const results = new Array(indexes.length);
  try {
    await Promise.all(Array.from({ length: jobs }, (_, slot) => new Promise((resolve, reject) => {
      const batch = indexes.filter((_, i) => i % jobs === slot);
      const worker = new Worker(new URL(import.meta.url), { workerData: { suite, indexes: batch } });
      workers.push(worker);
      let received = false;
      worker.once('message', (rows) => {
        if (rows.length !== batch.length) return;
        rows.forEach((row, i) => { results[i * jobs + slot] = row; });
        received = true;
      });
      worker.once('error', reject);
      worker.once('exit', (code) => {
        if (code === 0 && received) resolve();
        else reject(new Error(`${suite} worker exited with code ${code} before returning its cases`));
      });
    })));
    return results;
  } finally {
    await Promise.all(workers.map((worker) => worker.terminate()));
  }
}

if (!isMainThread) parentPort.postMessage(score(workerData.suite, workerData.indexes));
