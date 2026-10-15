import assert from 'node:assert/strict'
import test from 'node:test'
import { buildSiteFromTemplate } from './templates'
import { useSiteEditorStore } from '../../store/site-editor-store'

test('locked sections reject editing, visibility, deletion, duplication and reordering', () => {
  const site = buildSiteFromTemplate('portfolio')
  const lockedId = site.sections[0].id
  site.sections[0] = { ...site.sections[0], locked: true }
  const store = useSiteEditorStore.getState()
  store.initSite(site)

  const originalSections = structuredClone(useSiteEditorStore.getState().site!.sections)
  const originalProps = structuredClone(originalSections[0].props)

  store.updateSection(lockedId, { visible: false })
  store.updateSectionProps(lockedId, { title: 'Changed' })
  store.updateSectionStyle(lockedId, { paddingY: 999 })
  store.updateSectionAnimation(lockedId, { duration: 99 })
  store.toggleVisibility(lockedId)
  store.removeSection(lockedId)
  store.duplicateSection(lockedId)
  store.moveSection(0, 1)
  store.reorderSections([...originalSections].reverse())

  const unchanged = useSiteEditorStore.getState().site!.sections
  assert.deepEqual(unchanged, originalSections)
  assert.deepEqual(unchanged[0].props, originalProps)

  useSiteEditorStore.getState().toggleLock(lockedId)
  assert.equal(useSiteEditorStore.getState().site!.sections[0].locked, false)
  useSiteEditorStore.getState().updateSectionProps(lockedId, { title: 'Unlocked edit' })
  assert.equal(useSiteEditorStore.getState().site!.sections[0].props.title, 'Unlocked edit')

  useSiteEditorStore.getState().reset()
})
