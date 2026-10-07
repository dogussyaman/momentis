'use client'

import { useEffect } from 'react'
import { useSiteEditorStore } from '@/store/site-editor-store'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Smartphone, Tablet, Monitor, LayoutTemplate, PlusCircle, Undo2, Redo2, Save, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { v4 as uuidv4 } from 'uuid'
import { buildSiteFromTemplate } from '@/lib/site-builder/templates'

import { SectionsPanel } from './panels/SectionsPanel'
import { InspectorPanel } from './panels/InspectorPanel'
import { TemplatesPanel } from './panels/TemplatesPanel'
import { SiteCanvas } from './SiteCanvas'

interface SiteEditorProps {
  onSwitchToCard: () => void;
}

export function SiteEditor({ onSwitchToCard }: SiteEditorProps) {
  const { initSite, site, device, setDevice, leftTab, undo, redo, canUndo, canRedo, save, isSaving, lastSavedAt, setIsPreview, isPreview } = useSiteEditorStore();

  useEffect(() => {
    if (!site) {
      const template = buildSiteFromTemplate('minimal')
      initSite({
        ...template,
        id: uuidv4(),
        userId: 'demo',
        title: 'Bizim Düğün',
        slug: 'bizim-dugun',
        templateId: 'minimal',
        theme: {
          primaryColor: '#000000',
          secondaryColor: '#ffffff',
          accentColor: '#000000',
          backgroundColor: '#f8f4ec',
          surfaceColor: '#ffffff',
          textColor: '#101827',
          mutedColor: '#6b6458',
          headingFont: 'Playfair Display',
          bodyFont: 'Inter',
          scriptFont: 'Great Vibes',
          borderRadius: 8,
          buttonRadius: 8,
          headingScale: 1,
          letterSpacing: 'normal'
        },
        sections: template.sections,
        settings: {
          musicEnabled: false,
          showCountdown: true
        },
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }, [site, initSite]);

  if (!site) return <div className="flex items-center justify-center h-full">Yükleniyor...</div>;

  return (
    <div className="flex flex-col h-full w-full bg-ivory shadow-sm border border-border rounded-2xl overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-14 border-b border-border bg-white flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onSwitchToCard} className="text-xs uppercase tracking-wider text-muted-foreground hover:text-midnight -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Kart Tasarımına Dön
          </Button>
          <div className="h-4 w-px bg-border" />
          <span className="text-xs font-serif text-midnight font-medium">MOMENTIS Site Editor</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo()} title="Geri al"><Undo2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={redo} disabled={!canRedo()} title="Yinele"><Redo2 className="h-4 w-4" /></Button>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => void save()} className="h-8 rounded-full text-[10px] gap-1.5">{isSaving ? 'Kaydediliyor…' : <><Save className="h-3.5 w-3.5" /> Kaydet</>}</Button>
          <Button variant="outline" size="sm" onClick={() => setIsPreview(!isPreview)} className="h-8 rounded-full text-[10px] gap-1.5"><Eye className="h-3.5 w-3.5" /> {isPreview ? 'Düzenle' : 'Önizle'}</Button>
          {lastSavedAt && <span className="hidden xl:inline text-[9px] text-muted-foreground">Kaydedildi</span>}
        </div>
        <div className="flex items-center gap-1 bg-ivory-50 p-1 rounded-full border border-border">
          <Button variant="ghost" size="sm" onClick={() => setDevice('mobile')} className={cn('h-8 w-8 rounded-full p-0', device === 'mobile' ? 'bg-midnight text-ivory' : 'text-midnight/60 hover:text-midnight')}>
            <Smartphone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDevice('tablet')} className={cn('h-8 w-8 rounded-full p-0', device === 'tablet' ? 'bg-midnight text-ivory' : 'text-midnight/60 hover:text-midnight')}>
            <Tablet className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDevice('desktop')} className={cn('h-8 w-8 rounded-full p-0', device === 'desktop' ? 'bg-midnight text-ivory' : 'text-midnight/60 hover:text-midnight')}>
            <Monitor className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {isPreview ? <div className="flex-1 overflow-y-auto bg-ivory-50 p-8"><div className="mx-auto w-full max-w-[1200px] overflow-hidden rounded-xl bg-white shadow-sm"><SiteCanvas /></div></div> : <>
        {/* Left Sidebar */}
        <div className="w-[300px] border-r border-border bg-white flex shrink-0 overflow-hidden">
          {/* Nav Strip */}
          <div className="w-14 bg-ivory-50 border-r border-border flex flex-col items-center py-4 gap-4 shrink-0">
             <button onClick={() => useSiteEditorStore.getState().setLeftTab('add')} className={cn("p-2 rounded-xl transition-colors", leftTab === 'add' ? 'bg-midnight text-ivory shadow-md' : 'text-midnight/50 hover:bg-ivory hover:text-midnight')}>
               <PlusCircle className="w-5 h-5" />
             </button>
             <button onClick={() => useSiteEditorStore.getState().setLeftTab('templates')} className={cn("p-2 rounded-xl transition-colors", leftTab === 'templates' ? 'bg-midnight text-ivory shadow-md' : 'text-midnight/50 hover:bg-ivory hover:text-midnight')}>
               <LayoutTemplate className="w-5 h-5" />
             </button>
          </div>
          <div className="flex-1 overflow-hidden">
             {leftTab === 'add' && <SectionsPanel />}
             {leftTab === 'templates' && <TemplatesPanel />}
             {/* other tabs can be added here if needed */}
          </div>
        </div>

        {/* Canvas / Preview */}
        <div className="flex-1 bg-ivory-50 flex flex-col items-center p-8 overflow-y-auto">
          <div className={cn(
            'bg-white border border-border shadow-md transition-all duration-300 rounded-xl flex flex-col',
            device === 'mobile' ? 'w-[390px] min-h-[844px]' :
            device === 'tablet' ? 'w-[768px] min-h-[1024px]' :
            'w-full max-w-[1200px] min-h-[600px]'
          )}>
            <SiteCanvas />
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
