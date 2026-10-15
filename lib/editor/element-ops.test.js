import assert from 'node:assert/strict'
import test from 'node:test'
import { getTransformableIds, removeUnlockedElements, shouldCommitTextEdit } from './element-ops.js'

const design = {
  id: 'd',
  width: 100,
  height: 100,
  background: '#fff',
  elements: [
    { id: 'a', type: 'rect', x: 0, y: 0 },
    { id: 'b', type: 'rect', x: 0, y: 0, locked: true },
    { id: 'c', type: 'text', x: 0, y: 0 },
  ],
}

test('removeUnlockedElements removes only unlocked selected elements', () => {
  const result = removeUnlockedElements(design, ['a', 'b'])
  assert.deepEqual(result.removedIds, ['a'])
  assert.deepEqual(result.design.elements.map((element) => element.id), ['b', 'c'])
})

test('removeUnlockedElements returns the same design object when nothing is removable', () => {
  const result = removeUnlockedElements(design, ['b', 'missing'])
  assert.equal(result.design, design)
  assert.deepEqual(result.removedIds, [])
})

test('shouldCommitTextEdit only commits real changes', () => {
  assert.equal(shouldCommitTextEdit('Merhaba', 'Merhaba'), false)
  assert.equal(shouldCommitTextEdit(undefined, ''), false)
  assert.equal(shouldCommitTextEdit('Merhaba', 'Merhaba İstanbul'), true)
})

test('getTransformableIds excludes locked elements', () => {
  assert.deepEqual(getTransformableIds(design.elements, ['a', 'b', 'c']), ['a', 'c'])
})
