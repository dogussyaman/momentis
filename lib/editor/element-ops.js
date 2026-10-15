/**
 * Pure helpers for invitation-editor element operations.
 * Kept free of React/Konva/zustand so the rules can be regression-tested in Node.
 */

/**
 * Removes the given element ids from a design, skipping locked elements.
 * Returns the original design object untouched when nothing was removed so callers can
 * avoid creating a spurious history entry.
 */
export function removeUnlockedElements(design, ids) {
  const idSet = new Set(ids || [])
  const removedIds = []
  const elements = design.elements.filter((element) => {
    if (!idSet.has(element.id)) return true
    if (element.locked) return true
    removedIds.push(element.id)
    return false
  })
  return {
    design: removedIds.length ? { ...design, elements } : design,
    removedIds,
  }
}

/** A text edit only needs to be committed (and recorded in history) if the text really changed. */
export function shouldCommitTextEdit(currentText, nextText) {
  return (currentText ?? '') !== (nextText ?? '')
}

/** Returns ids from the selection that may be transformed (resized/rotated). */
export function getTransformableIds(elements, selectedIds) {
  const locked = new Set(elements.filter((element) => element.locked).map((element) => element.id))
  return selectedIds.filter((id) => !locked.has(id))
}
