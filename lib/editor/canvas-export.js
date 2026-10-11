export function getCanvasExportOptions(design, layer) {
  const scale = layer.scaleX()
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error('Davetiye dışa aktarılamadı: tuval ölçeği geçersiz')
  }

  return {
    x: layer.x(),
    y: layer.y(),
    width: design.width * scale,
    height: design.height * scale,
    pixelRatio: 1 / scale,
    mimeType: 'image/png',
  }
}
