import test from 'node:test';
import assert from 'node:assert/strict';
import { patterns, problems, schedule, dayView } from '../assets/dsa/curriculum.mjs';
import { STORAGE_KEY, normalizeProgress, loadProgress, saveProgress, setCompleted } from '../assets/dsa/progress.mjs';
import { renderDay, renderReference } from '../assets/dsa/schedule.mjs';

test('all 70 days resolve to real problems and precise pattern taxonomy', () => {
  assert.equal(schedule.length, 70);
  const broadLabels = ['Dynamic Programming', 'Graphs', 'Trees', 'Binary Search', 'Greedy'];
  schedule.forEach((day, index) => {
    assert.equal(day.day, index + 1);
    assert.equal(day.week, Math.ceil((index + 1) / 7));
    assert.ok(day.problems.length >= 1);
    assert.equal(new Set(day.problems.map(item => item.id)).size, day.problems.length);
    for (const item of day.problems) {
      const problem = problems[item.id];
      assert.ok(problem, `Missing problem ${item.id}`);
      const pattern = patterns[problem.patternId];
      assert.ok(pattern?.category);
      assert.ok(!broadLabels.includes(pattern.pattern));
      assert.ok(pattern.recognitionHint.length > 10);
    }
  });
});

test('intentional repetitions are marked across days, while new LIS methods stay distinct', () => {
  assert.equal(schedule[0].problems[0].revision, false);
  assert.equal(schedule[1].problems[1].revision, true);
  assert.equal(schedule[26].problems[1].revision, true);
  assert.equal(schedule[35].problems[0].revision, true);
  assert.equal(schedule[38].problems[0].revision, false);
  assert.equal(schedule[39].problems[0].revision, false);
  assert.equal(schedule[40].problems[0].revision, false);
  assert.equal(schedule[45].problems[1].revision, true);
  assert.equal(schedule[52].problems[1].revision, true);
  assert.ok(schedule[69].problems.every(item => item.revision));
});

test('LIS, LCS, MCM, partition DP and graph DAG DP have different families', () => {
  assert.equal(patterns['lis-recursive'].pattern, 'Sequence DP');
  assert.equal(patterns.lcs.pattern, 'Two-sequence DP');
  assert.equal(patterns.mcm.pattern, 'Interval DP');
  assert.equal(patterns.mcm.subPattern, 'MCM / Interval DP');
  assert.equal(patterns.partition.pattern, 'Partition DP');
  assert.equal(patterns['dag-dp'].category, 'Graphs');
  assert.equal(patterns['dag-dp'].pattern, 'DAG');
  assert.equal(patterns['dag-dp'].subPattern, 'Topological DP');
  assert.equal(patterns.bitmask.future, true);
  assert.equal(patterns.digit.future, true);
});

test('early mixed-method days retain the correct pattern per problem', () => {
  const view = dayView(11);
  assert.equal(view.problems[0].taxonomy.pattern, 'Subtree-return DFS');
  assert.equal(view.problems[1].taxonomy.pattern, 'Path DFS');
  assert.ok(dayView(38).dpReminder);
  assert.ok(dayView(59).dpReminder);
  assert.equal(dayView(1).dpReminder, false);
});

test('week 10 daily view does not expose taxonomy, recognition hints or family reminders', () => {
  assert.ok(dayView(43).problems[0].taxonomy);
  for (let day = 64; day <= 70; day++) {
    const view = dayView(day);
    assert.equal(view.blind, true);
    assert.equal(view.dpReminder, false);
    assert.equal(view.focus, '');
    for (const problem of view.problems) {
      assert.equal(problem.taxonomy, undefined);
      assert.equal(problem.patternId, undefined);
      assert.ok(problem.revision);
    }
  }
  assert.equal(dayView(66).problems[2].name, 'Graph Valid Tree');
  assert.equal(dayView(70).title, 'DSA Mixed Mock');
  assert.equal(dayView(70).problems.length, 4);
  assert.equal(new Set(schedule[69].problems.map(item => problems[item.id].patternId)).size, 4);
});

test('missing, partial and malformed saved progress gets safe defaults', () => {
  const empty = { version: 1, currentDay: 1, completedDays: [] };
  for (const value of [null, undefined, [], 'bad']) {
    assert.deepEqual(normalizeProgress(value), empty);
  }
  assert.deepEqual(normalizeProgress({ currentDay: 71, completedDays: [1, 1, 0, 70, 71, '2', 1.5] }), {
    version: 1, currentDay: 1, completedDays: [1, 70],
  });
  assert.deepEqual(normalizeProgress({ currentDay: 43 }), { ...empty, currentDay: 43 });
});

test('checking and unchecking a day keeps completion unique and independent of navigation', () => {
  let progress = normalizeProgress({ currentDay: 43 });
  progress = setCompleted(progress, 43, true);
  progress = setCompleted(progress, 43, true);
  progress = setCompleted(progress, 1, true);
  assert.deepEqual(progress.completedDays, [1, 43]);
  assert.equal(progress.currentDay, 43);
  progress = setCompleted(progress, 43, false);
  assert.deepEqual(progress.completedDays, [1]);
  assert.deepEqual(setCompleted(progress, 71, true), progress);
});

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

test('progress survives reload without touching the existing theme or other learning data', () => {
  const storage = memoryStorage({ 'interview-prep-theme': 'light', 'learning-progress': '{"done":7}' });
  const progress = setCompleted(normalizeProgress({ currentDay: 70 }), 70, true);
  assert.equal(saveProgress(storage, progress), true);
  assert.deepEqual(loadProgress(storage).progress, progress);
  assert.equal(storage.getItem('interview-prep-theme'), 'light');
  assert.equal(storage.getItem('learning-progress'), '{"done":7}');
});

test('unavailable storage and corrupt JSON do not crash or silently erase saved values', () => {
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('full'); } };
  assert.ok(loadProgress(blocked).warning);
  assert.equal(saveProgress(blocked, normalizeProgress(null)), false);
  const corrupt = memoryStorage({ [STORAGE_KEY]: '{broken' });
  assert.ok(loadProgress(corrupt).warning);
  assert.equal(corrupt.getItem(STORAGE_KEY), '{broken');
});

test('daily HTML includes state reasoning for DP and omits pattern hints for every blind day', () => {
  assert.match(renderDay(52), /DP reasoning workflow/);
  assert.match(renderDay(52), /MCM \/ Interval DP/);
  assert.match(renderDay(2), /Revision/);
  assert.match(renderDay(1, true), /id="dsaComplete" checked/);
  for (let number = 64; number <= 70; number++) {
    const html = renderDay(number);
    assert.doesNotMatch(html, /dsa-taxonomy|dsa-hint|dsa-reminder|DP reasoning workflow/);
  }
});

test('reference includes representative exercises beyond scheduled days and future patterns', () => {
  const html = renderReference();
  for (const title of ['Coin Change II', 'Longest Valid Parentheses', 'Largest Divisible Subset', 'Bitmask DP', 'Digit DP']) {
    assert.ok(html.includes(title));
  }
  assert.match(html, /Advanced \/ future/);
});
