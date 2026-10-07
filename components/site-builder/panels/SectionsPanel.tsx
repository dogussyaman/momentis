import { useSiteEditorStore } from '@/store/site-editor-store'
import { Button } from '@/components/ui/button'
import { Plus, LayoutTemplate, Heart, Image as ImageIcon, MapPin, CalendarHeart, Clock, Send, Music, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const SECTION_TYPES = [
  { id: 'hero', name: 'Hero (Kapak)', icon: LayoutTemplate, desc: 'Ana karşılama ekranı' },
  { id: 'couple', name: 'Çift', icon: Heart, desc: 'Gelin ve damat bilgileri' },
  { id: 'story', name: 'Hikayemiz', icon: Clock, desc: 'Zaman tüneli' },
  { id: 'gallery', name: 'Galeri', icon: ImageIcon, desc: 'Fotoğraf albümü' },
  { id: 'event', name: 'Etkinlik', icon: MapPin, desc: 'Tarih ve mekan bilgisi' },
  { id: 'countdown', name: 'Geri Sayım', icon: CalendarHeart, desc: 'Düğüne kalan zaman' },
  { id: 'rsvp', name: 'LCV (Katılım)', icon: Send, desc: 'Katılım formu' },
  { id: 'music', name: 'Müzik', icon: Music, desc: 'Arka plan müziği' },
  { id: 'faq', name: 'S.S.S.', icon: MessageSquare, desc: 'Sıkça sorulan sorular' }
]

export function SectionsPanel() {
  const { addSection, site } = useSiteEditorStore()

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-border bg-ivory-50/50">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-midnight">Bölüm Ekle</h3>
        <p className="text-[10px] text-muted-foreground mt-1">Sitenize eklemek istediğiniz bölümü seçin.</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2">
          {SECTION_TYPES.map((section) => (
            <button
              key={section.id}
              onClick={() => addSection(section.id)}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-border bg-ivory-50 hover:border-midnight/40 hover:bg-ivory transition-colors text-midnight text-center group"
            >
              <section.icon className="w-6 h-6 text-midnight/60 group-hover:text-midnight transition-colors" />
              <div>
                <div className="text-[11px] font-semibold">{section.name}</div>
                <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight hidden xl:block">{section.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
