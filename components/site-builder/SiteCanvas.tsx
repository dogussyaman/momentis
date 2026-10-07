import { useSiteEditorStore } from '@/store/site-editor-store'
import { SiteSection } from '@/lib/site-builder/schema'
import { sectionRegistry } from './sections'
import { cn } from '@/lib/utils'
import { Trash2, Copy, GripVertical } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SiteRenderProvider } from './render/primitives'

function SortableSection({ section }: { section: SiteSection }) {
  const { selectedSectionId, selectSection, removeSection, duplicateSection } = useSiteEditorStore()
  const isSelected = selectedSectionId === section.id
  const Component = sectionRegistry[section.type]?.component

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  if (!Component) return <div className="p-4 border border-dashed border-red-300 text-red-500">Unknown component type: {section.type}</div>

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group transition-all",
        isSelected ? "ring-2 ring-midnight z-10" : "hover:ring-2 hover:ring-midnight/30 z-0",
        isDragging && "z-50"
      )}
      onClick={(e) => {
        e.stopPropagation()
        selectSection(section.id)
      }}
    >
      {/* Editor Actions Toolbar */}
      <div className={cn(
        "absolute -right-4 top-4 flex flex-col gap-1 bg-white border border-border rounded-lg shadow-lg opacity-0 transition-opacity p-1 z-20",
        (isSelected || "group-hover:opacity-100") && "opacity-100"
      )}>
        <button {...attributes} {...listeners} className="p-1.5 hover:bg-ivory-50 rounded text-midnight/70 hover:text-midnight cursor-grab active:cursor-grabbing" title="Taşı"><GripVertical className="w-3.5 h-3.5" /></button>
        <div className="w-full h-px bg-border my-0.5" />
        <button onClick={(e) => { e.stopPropagation(); duplicateSection(section.id) }} className="p-1.5 hover:bg-ivory-50 rounded text-midnight/70 hover:text-midnight" title="Çoğalt"><Copy className="w-3.5 h-3.5" /></button>
        <button onClick={(e) => { e.stopPropagation(); removeSection(section.id) }} className="p-1.5 hover:bg-red-50 rounded text-red-400 hover:text-red-600" title="Sil"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>

      <div className={cn("pointer-events-none", isDragging && "pointer-events-none")}>
        <Component section={section} props={section.props} />
      </div>
    </div>
  )
}

export function SiteCanvas() {
  const { site, selectSection, reorderSections } = useSiteEditorStore()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  if (!site) return null

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = site.sections.findIndex((s) => s.id === active.id)
      const newIndex = site.sections.findIndex((s) => s.id === over.id)
      const newSections = arrayMove(site.sections, oldIndex, newIndex)
      reorderSections(newSections)
    }
  }

  return (
    <SiteRenderProvider value={{ site, mode: 'editor' }}>
      <div 
        className="w-full min-h-full bg-white flex flex-col relative"
        onClick={() => selectSection(null)}
        style={{
          backgroundColor: site.theme.backgroundColor,
          color: site.theme.textColor,
        }}
      >
        {site.sections.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-midnight/40">
             <p className="text-sm">Henüz hiç bölüm eklemediniz.</p>
             <p className="text-xs mt-2">Sol panelden bir bölüm seçerek sitenizi oluşturmaya başlayın.</p>
          </div>
        ) : (
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={site.sections.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col">
                {site.sections.map((section) => (
                  <SortableSection 
                    key={section.id} 
                    section={section} 
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </SiteRenderProvider>
  )
}
