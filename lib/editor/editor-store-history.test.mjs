import assert from 'node:assert/strict'
import test from 'node:test'

// zustand's persist middleware needs a Storage; provide an in-memory one for Node.
const memory = new Map()
globalThis.localStorage = {
  getItem: (key) => (memory.has(key) ? memory.get(key) : null),
  setItem: (key, value) => { memory.set(key, String(value)) },
  removeItem: (key) => { memory.delete(key) },
}

const { useEditorStore } = await import('../../store/editor-store.ts')

const historyLength = () => useEditorStore.temporal.getState().pastStates.length

function resetStore() {
  useEditorStore.getState().resetDesign()
  useEditorStore.temporal.getState().clear()
}

test('selection, zoom and tool changes do not create undo history entries', () => {
  resetStore()
  const store = useEditorStore.getState()
  store.selectElement('text_1')
  store.setZoom(1.5)
  store.setActiveTool('pen')
  store.setToolColor('#ff0000')
  store.clearSelection()
  assert.equal(historyLength(), 0)
})

test('a design edit creates exactly one undo step and undo restores it', () => {
  resetStore()
  useEditorStore.getState().updateElement('text_1', { x: 999 })
  assert.equal(historyLength(), 1)
  useEditorStore.temporal.getState().undo()
  assert.equal(useEditorStore.getState().design.elements.find((el) => el.id === 'text_1').x, 190)
})

test('deleteElements removes a multi-selection in a single undo step and keeps locked elements', () => {
  resetStore()
  useEditorStore.getState().updateElement('rect_1', { locked: true })
  useEditorStore.temporal.getState().clear()

  useEditorStore.getState().selectElement('text_1')
  useEditorStore.getState().selectMultiple('rect_1')
  useEditorStore.getState().deleteElements(['text_1', 'rect_1'])

  const ids = useEditorStore.getState().design.elements.map((el) => el.id)
  assert.deepEqual(ids, ['rect_1'])
  assert.equal(historyLength(), 1)

  useEditorStore.temporal.getState().undo()
  assert.deepEqual(useEditorStore.getState().design.elements.map((el) => el.id), ['text_1', 'rect_1'])
})

test('deleteElements on only locked elements is a no-op and records no history', () => {
  resetStore()
  useEditorStore.getState().updateElement('rect_1', { locked: true })
  useEditorStore.temporal.getState().clear()
  useEditorStore.getState().deleteElements(['rect_1'])
  assert.equal(useEditorStore.getState().design.elements.length, 2)
  assert.equal(historyLength(), 0)
})

test('duplicating a locked element yields an unlocked, offset copy', () => {
  resetStore()
  useEditorStore.getState().updateElement('rect_1', { locked: true })
  useEditorStore.getState().duplicateElement('rect_1')
  const { design, selectedIds } = useEditorStore.getState()
  const copy = design.elements.find((el) => el.id === selectedIds[0])
  assert.equal(copy.locked, false)
  assert.equal(copy.x, 360)
  assert.equal(design.elements.find((el) => el.id === 'rect_1').locked, true)
})
