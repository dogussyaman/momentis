import assert from 'node:assert/strict'
import test from 'node:test'
import { getCanvasExportOptions } from './canvas-export.js'

test('canvas export crops to the design and emits at its native dimensions', () => {
  const options = getCanvasExportOptions(
    { width: 1080, height: 1520 },
    { x: () => 120, y: () => 40, scaleX: () => 0.5 },
  )

  assert.deepEqual(options, {
    x: 120,
    y: 40,
    width: 540,
    height: 760,
    pixelRatio: 2,
    mimeType: 'image/png',
  })
  assert.equal(options.width * options.pixelRatio, 1080)
  assert.equal(options.height * options.pixelRatio, 1520)
})

test('canvas export rejects invalid layer scales', () => {
  assert.throws(
    () => getCanvasExportOptions(
      { width: 1080, height: 1520 },
      { x: () => 0, y: () => 0, scaleX: () => 0 },
    ),
    /tuval ölçeği geçersiz/,
  )
})
