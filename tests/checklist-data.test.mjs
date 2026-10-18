import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decodeSnapshot,
  encodeSnapshotUrl,
  MAX_TASKS_PER_LIST,
  normalizeState
} from '../checklist-data.mjs';

const state = {
  lists: [{
    id: 'list-1',
    sharedId: 'abcdefghijklmnop',
    title: 'Trip ✈️',
    icon: '✈️',
    notes: 'Bring snacks',
    tasks: [{id: 'task-1', text: 'Pack bag', done: true}]
  }],
  activeListId: 'list-1'
};

test('snapshot links remove live mode and round-trip Unicode data', () => {
  const url = new URL(encodeSnapshotUrl('https://example.test/app/?live=abcdefghijklmnop', state, state.lists));
  assert.equal(url.searchParams.has('live'), false);
  assert.deepEqual(decodeSnapshot(url.hash.slice('#share='.length)), normalizeState({
    ...state,
    lists: [{...state.lists[0], sharedId: ''}]
  }));
});

test('normalization rejects invalid field lengths and can enforce live-sharing limits', () => {
  assert.throws(() => normalizeState({
    lists: [{id: 'list-1', title: 'x'.repeat(81), tasks: []}]
  }), /80 characters/);
  const localState = {
    lists: [{id: 'list-1', title: 'List', tasks: Array.from({length: 201}, (_, index) => ({
      id: `task-${index}`,
      text: 'Task'
    }))}]
  };
  assert.equal(normalizeState(localState).lists[0].tasks.length, 201);
  assert.throws(() => normalizeState(localState, {maxTasksPerList: MAX_TASKS_PER_LIST}), /up to 200 items/);
});

test('snapshot decoder rejects malformed and oversized values', () => {
  assert.throws(() => decodeSnapshot('bad%value'));
  assert.throws(() => decodeSnapshot('A'.repeat(8001)), /Invalid or oversized/);
});

test('snapshot links fail with a useful error when the URL would be oversized', () => {
  const oversized = {
    lists: [{
      id: 'list-1',
      title: 'List',
      tasks: [{id: 'task-1', text: 'x'.repeat(240), done: false}]
    }],
    activeListId: 'list-1'
  };
  const largeList = {...oversized.lists[0], tasks: Array.from({length: 200}, (_, index) => ({
    id: `task-${index}`,
    text: oversized.lists[0].tasks[0].text,
    done: false
  }))};
  assert.throws(() => encodeSnapshotUrl('https://example.test/app/', oversized, [largeList]), /too large/);
});
