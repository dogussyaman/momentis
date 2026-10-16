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

const HISTORY_TEST_DESIGN = {
  id: 'history-test',
  width: 1080,
  height: 1520,
  background: '#FFFDF8',
  elements: [
    {
      id: 'text_1',
      type: 'text',
      x: 190,
      y: 350,
      width: 700,
      height: 100,
      rotation: 0,
      text: 'Zeynep & Emre',
      fontFamily: 'Georgia, serif',
      fontSize: 72,
      fontWeight: 500,
      fill: '#1C2430',
      align: 'center',
      opacity: 1,
      visible: true,
      locked: false,
    },
    {
      id: 'rect_1',
      type: 'rect',
      x: 340,
      y: 500,
      width: 400,
      height: 200,
      rotation: 0,
      fill: '#C9A96E',
      opacity: 0.5,
      visible: true,
      locked: false,
    },
  ],
}

function resetStore() {
  useEditorStore.getState().setDesign(JSON.parse(JSON.stringify(HISTORY_TEST_DESIGN)))
  useEditorStore.getState().clearSelection()
  useEditorStore.getState().setPalettePreview(null)
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

test('single-element deletion cannot remove a locked element', () => {
  resetStore()
  useEditorStore.getState().updateElement('rect_1', { locked: true })
  useEditorStore.temporal.getState().clear()
  useEditorStore.getState().selectElement('rect_1')
  useEditorStore.getState().deleteElement('rect_1')

  assert.equal(useEditorStore.getState().design.elements.some((el) => el.id === 'rect_1'), true)
  assert.deepEqual(useEditorStore.getState().selectedIds, ['rect_1'])
  assert.equal(historyLength(), 0)
})

test('locked elements cannot be changed until explicitly unlocked', () => {
  resetStore()
  useEditorStore.getState().updateElement('rect_1', { locked: true })
  useEditorStore.temporal.getState().clear()

  useEditorStore.getState().updateElement('rect_1', { x: 999, fill: '#ff0000' })
  let element = useEditorStore.getState().design.elements.find((el) => el.id === 'rect_1')
  assert.equal(element.x, 340)
  assert.equal(element.fill, '#C9A96E')
  assert.equal(historyLength(), 0)

  useEditorStore.getState().updateElement('rect_1', { locked: false })
  useEditorStore.getState().updateElement('rect_1', { x: 999 })
  element = useEditorStore.getState().design.elements.find((el) => el.id === 'rect_1')
  assert.equal(element.locked, false)
  assert.equal(element.x, 999)
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
