// Independent answers and boundary cases for practical and mathematical examples.
import { readFileSync } from 'node:fs';
import { checkProof, loadText, run } from '../src/index.js';
import { assert } from './helpers.js';

function solve(name, goal, edit = (text) => text) {
  const text = readFileSync(new URL(`../examples/${name}.js`, import.meta.url), 'utf8');
  return run(loadText(edit(text)), { goal }).answers;
}

export const tests = {
  'Goldbach search returns exactly the least prime split of each small even number'() {
    const text = readFileSync(new URL('../examples/goldbach.js', import.meta.url), 'utf8')
      .replace('implies([in_range(2, 25, I), is(N, pow(2, I)), split(N, Pair)], goldbach(N, Pair))',
        'for (let n = 4; n <= 100; n += 2) query(split(n, Pair))');
    const prime = (n) => {
      if (n < 2) return false;
      for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
      return true;
    };
    const expected = [];
    for (let n = 4; n <= 100; n += 2) {
      let p = 2;
      while (!prime(p) || !prime(n - p)) p++;
      expected.push(`split(${n}, [${p}, ${n - p}])`);
    }
    const program = loadText(text);
    const result = run(program, { proof: true });
    assert.deepEqual(result.answers, expected);
    assert.ok(checkProof(program, result.proof, { allowTrusted: false }).valid);
  },

  'zebra retains the puzzle answer and needs the clue that supplies the blue house'() {
    assert.deepEqual(solve('zebra', 'zebra(Water, Zebra)'), ["zebra('norwegian', 'japanese')"]);
    const withoutBlue = (text) => text.replace(
      "    adjacent(house(_, 'norwegian', _, _, _), house('blue', _, _, _, _), Houses),\n", '');
    assert.deepEqual(solve('zebra', 'zebra(Water, Zebra)', withoutBlue), []);
  },

  'map colouring revisits an earlier colour and reports an exhausted palette'() {
    const source = readFileSync(new URL('../examples/four-color.js', import.meta.url), 'utf8');
    // With two colours, A=red, D=red, B=green strands C. D must become green.
    const rules = source.split('// The map of the European Union.')[0]
      .replace("['red', 'green', 'blue', 'yellow']", "['red', 'green']");
    const path = `
      fact(neighbours('C', ['B', 'D']))
      fact(neighbours('B', ['A', 'C']))
      fact(neighbours('D', ['C']))
      fact(neighbours('A', ['B']))
      query(colors('path', Places))
    `;
    const program = loadText(rules + path);
    const result = run(program, { proof: true });
    assert.deepEqual(result.answers,
      ["colors('path', [['C', 'red'], ['B', 'green'], ['D', 'green'], ['A', 'red']])"]);
    assert.ok(checkProof(program, result.proof, { allowTrusted: false }).valid);
    const triangle = `
      fact(neighbours('A', ['B', 'C']))
      fact(neighbours('B', ['A', 'C']))
      fact(neighbours('C', ['A', 'B']))
      query(colors('triangle', Places))
      query(color_places(['A', 'B', 'C'], [], 'failed'))
    `;
    const impossible = loadText(rules + triangle);
    const failure = run(impossible, { proof: true });
    assert.deepEqual(failure.answers, ["color_places(['A', 'B', 'C'], [], 'failed')"]);
    assert.ok(checkProof(impossible, failure.proof, { allowTrusted: false }).valid);
  },

  'outage repairs restore both functions and a dependency cycle cannot start itself'() {
    assert.deepEqual(solve('service-outage-recovery', 'best_repair(Plan, Cost)'),
      ["best_repair(['catalog_replica', 'bank_backup'], 3)"]);
    assert.deepEqual(solve('service-outage-recovery', 'restored_function(Function)'),
      ["restored_function('place_order')", "restored_function('mobile_checkout')"]);
    const withoutCache = (text) => text.replace("node('risk_cache', 'up', [])", "node('risk_cache', 'down', [])");
    assert.deepEqual(solve('service-outage-recovery', 'best_repair(Plan, Cost)', withoutCache), []);
  },

  'critical scheduling retains both branches when prerequisite finish times tie'() {
    assert.deepEqual(solve('critical-path-schedule', 'project_finish(Finish)'), ['project_finish(23)']);
    assert.equal(solve('critical-path-schedule', 'critical_task(Task)').length, 7);
    const tied = (text) => text.replace("task('frontend', 5,", "task('frontend', 11,");
    assert.deepEqual(solve('critical-path-schedule', "critical_predecessor('integration', Parent)", tied),
      ["critical_predecessor('integration', 'backend')", "critical_predecessor('integration', 'frontend')"]);
    assert.equal(solve('critical-path-schedule', 'critical_task(Task)', tied).length, 9);
  },

  'battery dispatch has the expected optimum and rejects export and grid overload'() {
    assert.deepEqual(solve('battery-dispatch', 'best_dispatch(Plan, Cost)'),
      ['best_dispatch([dispatch(1, 1, 3, 3), dispatch(2, -2, 1, 1), dispatch(3, 2, 0, 3), dispatch(4, -1, 2, 2)], 28)']);
    assert.deepEqual(solve('battery-dispatch', 'transition(3, 1, 0, Next, Grid, Cost)'), []);
    assert.deepEqual(solve('battery-dispatch', 'transition(1, 2, 2, Next, Grid, Cost)'), []);
    assert.deepEqual(solve('battery-dispatch', 'transition(3, 1, 2, Next, Grid, Cost)'), ['transition(3, 1, 2, 3, 0, 0)']);
  },

  'cold-chain decisions use the selected sample and exclude the committed prefix'() {
    assert.deepEqual(solve('cold-chain-recall', 'quarantine(Batch, Evidence)'), ["quarantine('batch_a', 'logger_a')"]);
    assert.deepEqual(solve('cold-chain-recall', 'notify(Site, Batch)'),
      ["notify('north_depot', 'batch_a')", "notify('station_shop', 'batch_a')"]);
    const advanced = (text) => text.replace('checkpoint(42)', 'checkpoint(44)');
    assert.deepEqual(solve('cold-chain-recall', 'quarantine(Batch, Evidence)', advanced), []);
    assert.deepEqual(solve('cold-chain-recall', 'selected_reading(Id, Batch, Temperature)', advanced),
      ["selected_reading('logger_b', 'batch_b', 75)"]);
  },

  'school audits calculate recommendations and preserve equally scored alternatives'() {
    assert.deepEqual(solve('school-placement-audit', 'recommended(Student, School, Score)'), [
      "recommended('ada', 'lindholmen', 1800)", "recommended('bjorn', 'backa', 2600)",
      "recommended('clara', 'haga', 800)", "recommended('davi', 'haga', 1600)",
    ]);
    assert.equal(solve('school-placement-audit', 'audit_flag(Student, Reason)').length, 6);
    const tied = (text) => `${text}\nfact(candidate('ada', 'tie_school', 2000, 1800, 1))\n`;
    assert.deepEqual(solve('school-placement-audit', "recommended('ada', School, Score)", tied),
      ["recommended('ada', 'lindholmen', 1800)", "recommended('ada', 'tie_school', 1800)"]);
    const equallyGood = (text) => text.replace("'centrum', 600, 3600, 2", "'centrum', 600, 1800, 1");
    assert.deepEqual(solve('school-placement-audit', "audit_flag('ada', Reason)", equallyGood), []);
  },

  'Bezout certificates handle signs and zero without admitting the all-zero case'() {
    assert.equal(solve('gcd-bezout-identity', 'identity_holds(Name)').length, 7);
    assert.deepEqual(solve('gcd-bezout-identity', 'bezout(-27, 36, G, S, T)'), ['bezout(-27, 36, 9, 1, 1)']);
    assert.deepEqual(solve('gcd-bezout-identity', 'bezout(0, -5, G, S, T)'), ['bezout(0, -5, 5, 0, -1)']);
    assert.deepEqual(solve('gcd-bezout-identity', 'bezout(0, 0, G, S, T)'), []);
  },

  'Pell solutions remain exact beyond the host safe integer range'() {
    assert.deepEqual(solve('pell-equation', 'pell(50, X, Y)'),
      ['pell(50, 94741125149636933417873079920900017937, 66992092050551637663438906713182313772)']);
    assert.equal(solve('pell-equation', 'equation_holds(N)').length, 5);
    assert.deepEqual(solve('pell-equation', 'pell(-1, X, Y)'), []);
  },

  'binomial identities cover large exact coefficients and truncated split ranges'() {
    assert.deepEqual(solve('binomial-vandermonde', 'choose(100, 50, C)'),
      ['choose(100, 50, 100891344545564193334812497256)']);
    assert.deepEqual(solve('binomial-vandermonde', 'vandermonde(2, 1, 2, Sum)'), ['vandermonde(2, 1, 2, 3)']);
    assert.deepEqual(solve('binomial-vandermonde', 'vandermonde(0, 0, 0, Sum)'), ['vandermonde(0, 0, 0, 1)']);
    assert.deepEqual(solve('binomial-vandermonde', 'choose(5, 6, C)'), []);
    assert.deepEqual(solve('binomial-vandermonde', 'row_sum(12, 0, Sum)'), ['row_sum(12, 0, 4096)']);
  },

  'regression fits the supplied lines and explains its degenerate inputs'() {
    assert.deepEqual(solve('least-squares-regression', 'fit(Name, Slope, Intercept, R2)'),
      ["fit('demo', 0.8, 1.5, 0.64)", "fit('declining', -2.0, 3.0, 1.0)"]);
    assert.deepEqual(new Set(solve('least-squares-regression', 'rejected(Name, Reason)')), new Set([
      "rejected('single', 'too_few_points')", "rejected('vertical', 'no_x_variation')", "rejected('constant', 'no_y_variation')",
    ]));
  },

  'Hamming decoding recovers every payload after any one-bit error'() {
    const list = (values) => `[${values.join(', ')}]`;
    for (let n = 0; n < 16; n++) {
      const data = [n >> 3 & 1, n >> 2 & 1, n >> 1 & 1, n & 1];
      const [a, b, c, d] = data;
      const word = [(a + b + d) % 2, (a + c + d) % 2, a, (b + c + d) % 2, b, c, d];
      for (let flipped = 0; flipped <= 7; flipped++) {
        const received = [...word];
        if (flipped) received[flipped - 1] ^= 1;
        assert.deepEqual(solve('hamming-code', `decode(${list(received)}, S, Corrected, Payload)`),
          [`decode(${list(received)}, ${flipped}, ${list(word)}, ${list(data)})`]);
      }
    }
    assert.deepEqual(solve('hamming-code', 'decode([0, 0, 0, 0, 0, 0, 2], S, C, P)'), []);
  },
};
