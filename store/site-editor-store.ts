import { create, useStore } from 'zustand'
import { temporal } from 'zundo'
import debounce from 'lodash/debounce'
import type { WeddingSite, SiteSection, SectionStyle, SectionAnimation } from '@/lib/site-builder/schema'
import { createSectionFromDefinition, refreshIds, uid } from '@/lib/site-builder/definitions'
import { buildSiteFromTemplate } from '@/lib/site-builder/templates'

export type LeftTab = 'add' | 'layers' | 'theme' | 'templates' | 'settings'
export type InspectorTab = 'content' | 'style' | 'animation'
export type Device = 'desktop' | 'tablet' | 'mobile'

export const DRAFT_KEY = 'momentis-site-draft-v2'

interface SiteEditorState {
  site: WeddingSite | null
  selectedSectionId: string | null
  hoveredSectionId: string | null
  leftTab: LeftTab
  inspectorTab: InspectorTab
  device: Device
  isPreview: boolean
  isSaving: boolean
  lastSavedAt: number | null

  // UI
  initSite: (site: WeddingSite) => void
  loadTemplate: (templateId: string, keepContent?: boolean) => void
  setDevice: (device: Device) => void
  setLeftTab: (tab: LeftTab) => void
  setInspectorTab: (tab: InspectorTab) => void
  setIsPreview: (isPreview: boolean) => void
  selectSection: (id: string | null) => void
  hoverSection: (id: string | null) => void

  // Sections
  addSection: (type: string, index?: number) => void
  removeSection: (id: string) => void
  duplicateSection: (id: string) => void
  updateSection: (id: string, updates: Partial<SiteSection>) => void
  updateSectionProps: (id: string, patch: Record<string, any>) => void
  updateSectionStyle: (id: string, patch: Partial<SectionStyle>) => void
  updateSectionAnimation: (id: string, patch: Partial<SectionAnimation>) => void
  toggleVisibility: (id: string) => void
  toggleLock: (id: string) => void
  moveSection: (oldIndex: number, newIndex: number) => void
  moveSectionBy: (id: string, delta: number) => void
  reorderSections: (sections: SiteSection[]) => void

  // Site
  updateSite: (updates: Partial<Pick<WeddingSite, 'title' | 'slug' | 'status'>>) => void
  updateTheme: (updates: Partial<WeddingSite['theme']>) => void
  updateSettings: (updates: Partial<WeddingSite['settings']>) => void

  save: () => Promise<void>
  reset: () => void
}

const mapSections = (site: WeddingSite, id: string, fn: (s: SiteSection) => SiteSection): WeddingSite => ({
  ...site,
  sections: site.sections.map((s) => (s.id === id ? fn(s) : s)),
  updatedAt: new Date().toISOString(),
})

export const useSiteEditorStore = create<SiteEditorState>()(
  temporal(
    (set, get) => ({
      site: null,
      selectedSectionId: null,
      hoveredSectionId: null,
      leftTab: 'add',
      inspectorTab: 'content',
      device: 'desktop',
      isPreview: false,
      isSaving: false,
      lastSavedAt: null,

      initSite: (site) => {
        set({ site, selectedSectionId: null })
        useSiteEditorStore.temporal.getState().clear()
      },

      loadTemplate: (templateId, keepContent = false) =>
        set((state) => {
          const next = buildSiteFromTemplate(templateId, state.site ?? undefined)
          if (keepContent && state.site) {
            return { site: { ...state.site, theme: next.theme, templateId }, selectedSectionId: null }
          }
          return { site: next, selectedSectionId: null }
        }),

      setDevice: (device) => set({ device }),
      setLeftTab: (leftTab) => set({ leftTab }),
      setInspectorTab: (inspectorTab) => set({ inspectorTab }),
      setIsPreview: (isPreview) => set({ isPreview, selectedSectionId: isPreview ? null : get().selectedSectionId }),
      selectSection: (id) => set({ selectedSectionId: id }),
      hoverSection: (id) => set({ hoveredSectionId: id }),

      addSection: (type, index) =>
        set((state) => {
          if (!state.site) return state
          const section = createSectionFromDefinition(type) as SiteSection
          const sections = [...state.site.sections]
          const at = index === undefined ? sections.length : Math.max(0, Math.min(index, sections.length))
          sections.splice(at, 0, section)
          return {
            site: { ...state.site, sections: sections.map((s, i) => ({ ...s, order: i })) },
            selectedSectionId: section.id,
            inspectorTab: 'content',
          }
        }),

      removeSection: (id) =>
        set((state) => {
          if (!state.site) return state
          return {
            site: { ...state.site, sections: state.site.sections.filter((s) => s.id !== id) },
            selectedSectionId: state.selectedSectionId === id ? null : state.selectedSectionId,
          }
        }),

      duplicateSection: (id) =>
        set((state) => {
          if (!state.site) return state
          const idx = state.site.sections.findIndex((s) => s.id === id)
          if (idx < 0) return state
          const copy: SiteSection = { ...refreshIds(JSON.parse(JSON.stringify(state.site.sections[idx]))), id: uid('section') }
          const sections = [...state.site.sections]
          sections.splice(idx + 1, 0, copy)
          return { site: { ...state.site, sections }, selectedSectionId: copy.id }
        }),

      updateSection: (id, updates) => set((state) => (state.site ? { site: mapSections(state.site, id, (s) => ({ ...s, ...updates })) } : state)),

      updateSectionProps: (id, patch) =>
        set((state) => (state.site ? { site: mapSections(state.site, id, (s) => ({ ...s, props: { ...s.props, ...patch } })) } : state)),

      updateSectionStyle: (id, patch) =>
        set((state) => (state.site ? { site: mapSections(state.site, id, (s) => ({ ...s, style: { ...s.style, ...patch } })) } : state)),

      updateSectionAnimation: (id, patch) =>
        set((state) =>
          state.site
            ? { site: mapSections(state.site, id, (s) => ({ ...s, animation: { type: 'fade', ...(s.animation ?? {}), ...patch } })) }
            : state,
        ),

      toggleVisibility: (id) => set((state) => (state.site ? { site: mapSections(state.site, id, (s) => ({ ...s, visible: !s.visible })) } : state)),
      toggleLock: (id) => set((state) => (state.site ? { site: mapSections(state.site, id, (s) => ({ ...s, locked: !s.locked })) } : state)),

      moveSection: (oldIndex, newIndex) =>
        set((state) => {
          if (!state.site || oldIndex === newIndex) return state
          const sections = [...state.site.sections]
          const [moved] = sections.splice(oldIndex, 1)
          sections.splice(newIndex, 0, moved)
          return { site: { ...state.site, sections: sections.map((s, i) => ({ ...s, order: i })) } }
        }),

      moveSectionBy: (id, delta) => {
        const site = get().site
        if (!site) return
        const idx = site.sections.findIndex((s) => s.id === id)
        const next = idx + delta
        if (idx < 0 || next < 0 || next >= site.sections.length) return
        get().moveSection(idx, next)
      },

      reorderSections: (sections) =>
        set((state) => {
          if (!state.site) return state
          return { site: { ...state.site, sections: sections.map((s, i) => ({ ...s, order: i })) } }
        }),

      updateSite: (updates) => set((state) => (state.site ? { site: { ...state.site, ...updates } } : state)),
      updateTheme: (updates) => set((state) => (state.site ? { site: { ...state.site, theme: { ...state.site.theme, ...updates } } } : state)),
      updateSettings: (updates) =>
        set((state) => (state.site ? { site: { ...state.site, settings: { ...state.site.settings, ...updates } } } : state)),

      save: async () => {
        const site = get().site
        if (!site) return
        set({ isSaving: true })
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(site))
          // TODO: Supabase upsert (wedding_sites) when backend table is ready
          await new Promise((r) => setTimeout(r, 300))
        } finally {
          set({ isSaving: false, lastSavedAt: Date.now() })
        }
      },

      reset: () => set({ site: null, selectedSectionId: null }),
    }),
    {
      limit: 100,
      partialize: (state) => ({ site: state.site }),
      equality: (a, b) => a.site === b.site,
      // Group rapid edits (typing, slider drags) into a single history step
      handleSet: (handleSet) =>
        debounce((...args: any[]) => (handleSet as any)(...args), 400, { leading: true, trailing: false }) as any,
    },
  ),
)

/** Reactive access to undo/redo state */
export function useEditorHistory() {
  const pastCount = useStore(useSiteEditorStore.temporal, (s) => s.pastStates.length)
  const futureCount = useStore(useSiteEditorStore.temporal, (s) => s.futureStates.length)
  const { undo, redo } = useSiteEditorStore.temporal.getState()
  return { undo, redo, canUndo: pastCount > 0, canRedo: futureCount > 0 }
}
