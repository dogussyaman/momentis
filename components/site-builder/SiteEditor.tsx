'use client'

import { motion } from 'framer-motion'
import { useEffect, useState, type CSSProperties } from 'react'
import { autosaveSite, useSiteEditorStore } from '@/store/site-editor-store'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Smartphone, Tablet, Monitor, LayoutTemplate, PlusCircle, Undo2, Redo2, Save, Eye, Layers, Cloud, Settings2, Type } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createStarterSite, normalizeSiteForEditor } from '@/lib/site-builder/normalize-site'
import type { WeddingSite } from '@/lib/site-builder/schema'
import type { LeftTab } from '@/store/site-editor-store'

import { SectionsPanel } from './panels/SectionsPanel'
import { InspectorPanel } from './panels/InspectorPanel'
import { TemplatesPanel } from './panels/TemplatesPanel'
import { LayersPanel } from './panels/LayersPanel'
import { SiteCanvas } from './SiteCanvas'
import { SiteViewer } from './SiteViewer'

interface SiteEditorProps {
  onSwitchToCard: () => void;
  isUpdate?: boolean;
  onSave?: (site: any) => Promise<void>;
  initialSite?: WeddingSite | null;
}

export function SiteEditor({ onSwitchToCard, isUpdate, onSave, initialSite }: SiteEditorProps) {
  const { initSite, site, device, setDevice, leftTab, undo, redo, canUndo, canRedo, save, isSaving, lastSavedAt, setIsPreview, isPreview } = useSiteEditorStore();
  const [localSaving, setLocalSaving] = useState(false);
  const [previewTextScale, setPreviewTextScale] = useState(100);

  const handleSave = async () => {
    if (onSave && site) {
      setLocalSaving(true);
      try {
        await onSave(site);
      } finally {
        setLocalSaving(false);
      }
    } else {
      await save();
    }
  }

  useEffect(() => {
    if (initialSite) {
      const hydrated = normalizeSiteForEditor(initialSite, { title: 'Bizim Düğün', slug: 'bizim-dugun', templateId: 'minimal' })
      if (!site || site.id !== hydrated.id || site.updatedAt !== hydrated.updatedAt || site.templateId !== hydrated.templateId) {
        initSite(hydrated)
      }
      return
    }

    if (!site) {
      initSite(createStarterSite())
    }
  }, [initialSite, site, initSite]);

  useEffect(() => {
    if (site) autosaveSite()
  }, [site]);

  if (!site) return <div className="flex items-center justify-center h-full">Yükleniyor...</div>;

  return (
    <div className="flex flex-col h-full w-full bg-ivory overflow-hidden">
      {/* Top Toolbar */}
      <div className="z-20 flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-white px-3 shadow-sm sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Button variant="ghost" onClick={onSwitchToCard} className="h-9 shrink-0 px-2 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-midnight sm:px-3 sm:text-xs">
            <ArrowLeft className="mr-1.5 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Kart Tasarımına Dön</span>
          </Button>
          <div className="h-4 w-px bg-border" />
          <div className="hidden min-w-0 sm:block">
            <p className="truncate font-serif text-xs font-medium text-midnight">{site.title || 'Davet sitesi'}</p>
            <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground">Site tasarım alanı</p>
          </div>
          <div className="flex shrink-0 items-center gap-1 border-l border-border pl-2 sm:pl-3">
            <Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo()} title="Geri al"><Undo2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={redo} disabled={!canRedo()} title="Yinele"><Redo2 className="h-4 w-4" /></Button>
          </div>
        </div>
        
        <div className="flex shrink-0 items-center gap-1">
          {lastSavedAt && <span className="hidden items-center gap-1 text-[9px] text-muted-foreground xl:flex"><Cloud className="h-3 w-3" /> Taslak kaydedildi</span>}
          <Button variant="outline" size="sm" onClick={handleSave} aria-label={isUpdate ? 'Siteyi güncelle' : 'Siteyi kaydet'} className="h-8 gap-1.5 rounded-full px-2.5 text-[10px] sm:px-3"><Save className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{(isSaving || localSaving) ? (isUpdate ? 'Güncelleniyor…' : 'Kaydediliyor…') : (isUpdate ? 'Güncelle' : 'Kaydet')}</span></Button>
          <Button variant="outline" size="sm" onClick={() => setIsPreview(!isPreview)} className="h-8 gap-1.5 rounded-full px-2.5 text-[10px] sm:px-3"><Eye className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{isPreview ? 'Düzenle' : 'Önizle'}</span></Button>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-border bg-ivory-50 p-0.5 sm:gap-1 sm:p-1">
          <Button variant="ghost" size="sm" onClick={() => setDevice('mobile')} aria-label="Mobil önizleme" title="Mobil önizleme" className={cn('h-7 w-7 rounded-full p-0 sm:h-8 sm:w-8', device === 'mobile' ? 'bg-midnight text-ivory' : 'text-midnight/60 hover:text-midnight')}>
            <Smartphone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDevice('tablet')} aria-label="Tablet önizleme" title="Tablet önizleme" className={cn('h-7 w-7 rounded-full p-0 sm:h-8 sm:w-8', device === 'tablet' ? 'bg-midnight text-ivory' : 'text-midnight/60 hover:text-midnight')}>
            <Tablet className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDevice('desktop')} aria-label="Masaüstü önizleme" title="Masaüstü önizleme" className={cn('h-7 w-7 rounded-full p-0 sm:h-8 sm:w-8', device === 'desktop' ? 'bg-midnight text-ivory' : 'text-midnight/60 hover:text-midnight')}>
            <Monitor className="h-4 w-4" />
          </Button>
        </div>
        {isPreview && (
          <div className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-white px-1.5 py-1" role="group" aria-label="Metin okunabilirliği önizlemesi">
            <Type className="ml-1 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <Button type="button" variant="ghost" size="sm" onClick={() => setPreviewTextScale((scale) => Math.max(100, scale - 10))} disabled={previewTextScale <= 100} aria-label="Önizleme metnini küçült" className="h-7 w-7 rounded-full p-0 text-xs">A−</Button>
            <span className="min-w-10 text-center text-[10px] tabular-nums text-muted-foreground" aria-live="polite">{previewTextScale}%</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => setPreviewTextScale((scale) => Math.min(150, scale + 10))} disabled={previewTextScale >= 150} aria-label="Önizleme metnini büyüt" className="h-7 w-7 rounded-full p-0 text-xs">A+</Button>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {isPreview ? (
          <div className="flex-1 overflow-auto bg-ivory-50 p-4 sm:p-8" data-testid="site-responsive-preview">
            <div className="flex min-h-full min-w-max justify-center">
              <div
                className={cn(
                  'h-fit min-h-[600px] overflow-hidden rounded-xl border border-border bg-white shadow-[0_16px_50px_-20px_rgba(16,24,39,0.28)] transition-all duration-300',
                  device === 'mobile' ? 'w-[390px]' :
                  device === 'tablet' ? 'w-[768px]' :
                  'w-full max-w-[1200px]',
                )}
                data-testid={`site-preview-${device}`}
              >
                <SiteViewer
                  site={site}
                  mode="preview"
                  viewportHeight={device === 'mobile' ? 844 : device === 'tablet' ? 1024 : undefined}
                  textScale={previewTextScale}
                />
              </div>
            </div>
          </div>
        ) : <>
        {/* Left Sidebar */}
        <div className="w-[300px] border-r border-border bg-white flex shrink-0 overflow-hidden">
          {/* Nav Strip */}
          <div className="w-[68px] shrink-0 border-r border-border bg-white py-3">
            <div className="flex flex-col items-center gap-1.5">
             {([
               { key: 'add', label: 'Ekle', icon: PlusCircle, title: 'Bölüm ekle' },
               { key: 'templates', label: 'Şablon', icon: LayoutTemplate, title: 'Şablonlar' },
               { key: 'layers', label: 'Katman', icon: Layers, title: 'Katmanlar' },
             ] as Array<{ key: LeftTab; label: string; icon: typeof PlusCircle; title: string }>).map(({ key, label, icon: Icon, title }) => {
               const active = leftTab === key
               return (
                 <motion.button
                   key={key}
                   type="button"
                   title={title}
                   onClick={() => useSiteEditorStore.getState().setLeftTab(key)}
                   whileHover={{ y: -1 }}
                   whileTap={{ scale: 0.98 }}
                   className={cn(
                     'relative flex w-[58px] flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[8px] font-medium transition-all duration-200',
                     active
                       ? 'bg-[#111827] text-[#f8f5f1] shadow-[0_14px_30px_-18px_rgba(17,24,39,0.85)] ring-1 ring-[#111827]/10'
                       : 'text-midnight/55 hover:bg-[#f5f1eb] hover:text-midnight'
                   )}
                 >
                   <Icon className="h-5 w-5" />
                   <span>{label}</span>
                 </motion.button>
               )
             })}
             <button title="Site ayarları" onClick={() => { useSiteEditorStore.getState().selectSection(null); useSiteEditorStore.getState().setLeftTab('add') }} className="flex w-[58px] flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[8px] font-medium text-midnight/55 transition-colors hover:bg-ivory-50 hover:text-midnight">
               <Settings2 className="w-5 h-5" />
               Site ayarı
             </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
             {leftTab === 'add' && <SectionsPanel />}
             {leftTab === 'templates' && <TemplatesPanel />}
             {leftTab === 'layers' && <LayersPanel />}
             {/* other tabs can be added here if needed */}
          </div>
        </div>

        {/* Canvas / Preview */}
        <div className="flex-1 overflow-y-auto bg-[radial-gradient(#d5d0c6_0.75px,transparent_0.75px)] [background-size:18px_18px] bg-[#f5f3ee] p-4 sm:p-8">
          <div className="flex min-h-full flex-col items-center">
          <div className={cn(
            'my-auto flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-[0_16px_50px_-20px_rgba(16,24,39,0.28)] transition-all duration-300',
            device === 'mobile' ? 'w-[390px] min-h-[844px]' :
            device === 'tablet' ? 'w-[768px] min-h-[1024px]' :
            'w-full max-w-[1200px] min-h-[600px]'
          )} style={{ '--sb-screen': device === 'mobile' ? '844px' : device === 'tablet' ? '1024px' : '100vh' } as CSSProperties}>
            <SiteCanvas />
          </div>
          </div>
        </div>

        {/* Right Inspector */}
        <div className="w-[300px] border-l border-border bg-white shrink-0 overflow-hidden">
          <InspectorPanel />
        </div>
        </>}
      </div>
    </div>
  )
}
