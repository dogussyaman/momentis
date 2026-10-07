import React, { useState } from 'react'
import { renderToString } from 'react-dom/server'
import { LayoutTemplate, Type, Image as ImageIcon, Sparkles, Shapes, ImagePlus, Copy, Layers, Clock, MapPin, Home, Users, Search, PlusCircle, X, Palette, icons } from 'lucide-react'
import { useEditorStore } from '@/store/editor-store'
import { v4 as uuidv4 } from 'uuid'
import { SABLONLAR, SEMBOLLER, TEMALAR, KAGITLAR, GRADYANLAR, KATEGORILER } from '@/lib/davetiye-svg'
import { DavetiyeKart } from '@/components/shared/davetiye-kart'
import { EDITOR_ASSETS, EDITOR_ASSET_CATEGORIES, EditorAsset } from '@/lib/editor-assets'
import { ThemePalettePanel } from './ThemePalettePanel'

const EDITOR_DRAG_EVENT = 'momentis-editor-sidebar-drop'

type SidebarDragData =
  | { kind: 'ornament'; key: string }
  | { kind: 'asset'; asset: EditorAsset }
  | { kind: 'shape'; shapeType: string }

function DragAddButton({ dragData, onClick, className, title, children }: {
  dragData: SidebarDragData
  onClick: () => void
  className?: string
  title?: string
  children: React.ReactNode
}) {
  const draggingRef = React.useRef(false)
  const pointerDownRef = React.useRef<{ x: number; y: number; pointerId: number } | null>(null)
  const suppressClickRef = React.useRef(false)

  React.useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      const start = pointerDownRef.current
      if (!start || event.pointerId !== start.pointerId) return
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) >= 7) {
        draggingRef.current = true
      }
    }
    const handleUp = (event: PointerEvent) => {
      const start = pointerDownRef.current
      if (!start || event.pointerId !== start.pointerId) return
      const wasDragging = draggingRef.current
      pointerDownRef.current = null
      draggingRef.current = false
      if (wasDragging) {
        suppressClickRef.current = true
        window.dispatchEvent(new CustomEvent(EDITOR_DRAG_EVENT, {
          detail: { ...dragData, clientX: event.clientX, clientY: event.clientY }
        }))
        window.setTimeout(() => { suppressClickRef.current = false }, 0)
      }
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointercancel', handleUp)
    }
  }, [dragData])

  return (
    <button
      type="button"
      title={title}
      className={className}
      onPointerDown={(event) => {
        pointerDownRef.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId }
      }}
      onClick={(event) => {
        if (suppressClickRef.current) {
          event.preventDefault()
          event.stopPropagation()
          return
        }
        onClick()
      }}
    >
      {children}
    </button>
  )
}

const tabs = [
  { id: 'templates', icon: LayoutTemplate, label: 'Şablonlar' },
  { id: 'text', icon: Type, label: 'Metin' },
  { id: 'elements', icon: Sparkles, label: 'Süslemeler' },
  { id: 'uploads', icon: ImagePlus, label: 'Yüklemeler' },
  { id: 'photos', icon: ImageIcon, label: 'Fotoğraflar' },
  { id: 'shapes', icon: Shapes, label: 'Şekiller' },
  { id: 'theme', icon: Palette, label: 'Renkler' },
  { id: 'background', icon: Copy, label: 'Arka Plan' },
  { id: 'layers', icon: Layers, label: 'Katmanlar' }
]

const svgFiles = [
  "Adsız tasarım (1).svg",
  "Adsız tasarım (2).svg",
  "Adsız tasarım (3).svg",
  "Adsız tasarım (4).svg",
  "Adsız tasarım (5).svg",
  "Adsız tasarım2.svg",
  "Beyaz ve Altın Minimalist Düğün Dikey Davetiye (1).png",
  "Beyaz ve Altın Minimalist Düğün Dikey Davetiye (2).png",
  "Beyaz ve Altın Minimalist Düğün Dikey Davetiye.png",
  "beautiful-archway-decorated-with-floral-composition-outdoors.jpg",
  "Gri Beyaz Minimalist Suluboya Düğün Davetiyesi .png",
  "Mavi Geleneksel Düğün Davetiye (1).png",
  "Mavi Geleneksel Düğün Davetiye.png",
  "wedding-couple-hold-hands.jpg",
  "Yeşil ve Antrasit Sade Monogram Yapraklı Düğün Davetiyesi.svg",
]

const invitationIconGroups = [
  {
    id: 'flowers',
    label: 'Çiçekler ve yapraklar',
    icons: [
      ['Flower', 'Çiçek'], ['Flower2', 'Dolgun çiçek'], ['Leaf', 'Yaprak'], ['LeafyGreen', 'Yeşil yaprak'],
      ['Sprout', 'Filiz'], ['Trees', 'Ağaçlar'], ['TreeDeciduous', 'Yapraklı ağaç'], ['Clover', 'Yonca'],
      ['Wheat', 'Başak'], ['Grape', 'Üzüm'], ['Shell', 'Deniz kabuğu'], ['Feather', 'Tüy'], ['Bird', 'Kuş']
    ]
  },
  {
    id: 'wedding',
    label: 'Düğün ve aşk',
    icons: [
      ['Heart', 'Kalp'], ['HeartHandshake', 'Sevgi'], ['HandHeart', 'Kalpten'], ['Gem', 'Mücevher'],
      ['Diamond', 'Elmas'], ['Crown', 'Taç'], ['Church', 'Düğün mekânı'], ['Gift', 'Hediye'],
      ['PartyPopper', 'Kutlama'], ['Ribbon', 'Kurdele'], ['Wine', 'Şarap kadehi'], ['GlassWater', 'Kadeh'],
      ['CakeSlice', 'Pasta dilimi'], ['Cake', 'Pasta'], ['CalendarHeart', 'Özel gün'], ['MailOpen', 'Davetiye'],
      ['Handshake', 'Birliktelik'], ['Infinity', 'Sonsuzluk']
    ]
  },
  {
    id: 'venues',
    label: 'Düğün mekânları',
    icons: [
      ['Building2', 'Düğün salonu'], ['Building', 'Etkinlik binası'], ['Hotel', 'Otel'],
      ['Castle', 'Saray'], ['Church', 'Kilise'], ['Tent', 'Kır düğünü çadırı'],
      ['TentTree', 'Bahçe mekânı'], ['House', 'Villa'], ['Landmark', 'Tarihi mekân'],
      ['Store', 'Etkinlik alanı'], ['Utensils', 'Restoran'], ['Coffee', 'Kafe'],
      ['FerrisWheel', 'Eğlence alanı'], ['Theater', 'Etkinlik salonu'], ['BedDouble', 'Konaklama']
    ]
  },
  {
    id: 'locations',
    label: 'Konum ve ulaşım',
    icons: [
      ['MapPin', 'Konum pini'], ['MapPinned', 'Haritada konum'], ['MapPinHouse', 'Mekân adresi'],
      ['Map', 'Harita'], ['Navigation', 'Yol tarifi'], ['CarFront', 'Araba ile ulaşım'],
      ['BusFront', 'Servis otobüsü'], ['TrainFront', 'Tren ile ulaşım'],
      ['Plane', 'Uçak ile ulaşım'], ['ParkingMeter', 'Otopark'], ['DoorOpen', 'Giriş kapısı']
    ]
  },
  {
    id: 'ornaments',
    label: 'Süsler ve şekiller',
    icons: [
      ['Sparkle', 'Işıltı'], ['Sparkles', 'Parıltılar'], ['Star', 'Yıldız'], ['WandSparkles', 'Sihir'],
      ['Asterisk', 'Yıldız süsü'], ['Circle', 'Daire'], ['CircleDot', 'Noktalı daire'], ['CircleDashed', 'Kesik daire'],
      ['Badge', 'Rozet'], ['BadgeCheck', 'Mühür'], ['Hexagon', 'Altıgen'], ['Octagon', 'Sekizgen'],
      ['Triangle', 'Üçgen'], ['Heart', 'Kalp süsü']
    ]
  },
  {
    id: 'moments',
    label: 'Anlar ve etkinlik',
    icons: [
      ['CalendarDays', 'Takvim'], ['Clock', 'Saat'], ['MapPin', 'Konum'], ['MapPinned', 'Harita'],
      ['Music', 'Müzik'], ['Music2', 'Nota'], ['Camera', 'Fotoğraf makinesi'], ['Image', 'Fotoğraf'],
      ['MessageCircleHeart', 'Sevgi mesajı'], ['Send', 'Uçan davetiye'], ['Compass', 'Pusula'],
      ['Sunrise', 'Gün doğumu'], ['Sunset', 'Gün batımı'], ['MoonStar', 'Ay ve yıldız'],
      ['CloudSun', 'Güneşli gökyüzü'], ['Rainbow', 'Gökkuşağı'], ['Mountain', 'Dağlar'],
      ['Waves', 'Dalgalar'], ['FlameKindling', 'Mum ışığı'], ['Lamp', 'Fener']
    ]
  }
] as const

const weddingPhotos = [
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&q=80",
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80",
  "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=400&q=80",
  "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=400&q=80",
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&q=80",
  "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&q=80",
  "https://images.unsplash.com/photo-1606490656461-f349be9d424b?w=400&q=80",
  "https://images.unsplash.com/photo-1550005809-91ad75fb315f?w=400&q=80",
  "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=400&q=80",
  "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=400&q=80",
  "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&q=80",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&q=80"
];

export function LeftSidebar() {
  const [activeTab, setActiveTab] = useState('elements')
  const [iconSearch, setIconSearch] = useState('')
  const [uploadSearch, setUploadSearch] = useState('')
  const [iconCategory, setIconCategory] = useState('Tümü')
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const { design, updateElement } = useEditorStore()
  const filteredSvgFiles = svgFiles.filter((filename) =>
    filename.replace(/\.(svg|png|jpe?g)$/i, '').toLocaleLowerCase('tr').includes(uploadSearch.trim().toLocaleLowerCase('tr'))
  )
  const assetLabel = (filename: string) => filename
    .replace(/\.(svg|png|jpe?g)$/i, '')
    .replace(/\s*\((\d+)\)/, ' · $1')
    .replace(/^Adsız tasarım/i, 'Düğün grafiği')

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImages(prev => [event.target!.result as string, ...prev])
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const addExternalImageToCanvas = (url: string) => {
    useEditorStore.setState((state) => ({
      design: {
        ...state.design,
        elements: [
          ...state.design.elements,
          {
            id: `img_${uuidv4().split('-')[0]}`,
            type: 'image',
            src: url,
            x: 200,
            y: 200,
            width: 300,
            height: 420,
            rotation: 0,
            opacity: 1,
            visible: true,
            locked: false
          }
        ]
      }
    }))
  }

  const addImageToCanvas = (filename: string) => {
    useEditorStore.setState((state) => ({
      design: {
        ...state.design,
        elements: [
          ...state.design.elements,
          {
            id: `img_${uuidv4().split('-')[0]}`,
            type: 'image',
            src: `/svg/${encodeURIComponent(filename)}`,
            x: 200,
            y: 200,
            width: 300,
            height: 420,
            rotation: 0,
            opacity: 1,
            visible: true,
            locked: false
          }
        ]
      }
    }))
  }

  const addTextToCanvas = (text: string, fontSize: number, fontFamily = 'Playfair Display') => {
    useEditorStore.setState((state) => ({
      design: {
        ...state.design,
        elements: [
          ...state.design.elements,
          {
            id: `text_${uuidv4().split('-')[0]}`,
            type: 'text',
            text,
            x: 140,
            y: 700,
            width: 800,
            fontSize,
            fontFamily,
            fill: '#3b2f27',
            align: 'center',
            rotation: 0,
            opacity: 1,
            visible: true,
            locked: false
          }
        ]
      }
    }))
  }

  const addComposition = (
    texts: Array<{t: string, s: number, f: string, y: number, w: number, x: number}> = [],
    svgs: Array<{k: string, x: number, y: number, w: number, r?: number}> = []
  ) => {
    const textElements = texts.map(m => {
      const textWidth = m.w;
      return {
        id: `text_${uuidv4().split('-')[0]}`,
        type: 'text' as const,
        text: m.t,
        x: (m.x * 3) - (textWidth / 2),
        y: m.y * 3,
        width: textWidth,
        fontSize: m.s,
        fontFamily: m.f,
        fill: '#3b2f27',
        align: 'center',
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false
      }
    })

    const svgElements = svgs.map(oge => {
      const sembol = SEMBOLLER[oge.k as keyof typeof SEMBOLLER]
      if (!sembol) return null
      const h = (sembol.h / sembol.w) * oge.w
      
      const processSVG = (svgStr: string) => {
         const defs = GRADYANLAR
            .replace(/var\(--p1\)/g, '#d9a441')
            .replace(/var\(--p2\)/g, '#b8742a')
            .replace(/var\(--l1\)/g, '#5f9564')
            .replace(/var\(--l2\)/g, '#3f7a4f');
         const fullSvg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${svgStr}</svg>`;
         return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(fullSvg)))}`;
      }

      return {
         id: `svg_${uuidv4().split('-')[0]}`,
         type: 'image' as const,
         src: processSVG(sembol.svg),
         x: oge.x * 3,
         y: oge.y * 3,
         width: oge.w * 3,
         height: h * 3,
         rotation: oge.r || 0,
         opacity: 1,
         centered: true
      }
    }).filter(Boolean)

    useEditorStore.setState((state) => ({
      design: {
        ...state.design,
        elements: [...state.design.elements, ...textElements, ...svgElements] as any
      }
    }))
  }

  const addEditorAssetToCanvas = (asset: EditorAsset) => {
    const scale = Math.min(1, 700 / Math.max(asset.width, asset.height))
    const width = Math.round(asset.width * scale)
    const height = Math.round(asset.height * scale)
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(asset.svg)}`

    useEditorStore.setState((state) => ({
      design: {
        ...state.design,
        elements: [
          ...state.design.elements,
          {
            id: `asset_${uuidv4().split('-')[0]}`,
            type: 'image',
            src: dataUrl,
            x: state.design.width / 2,
            y: state.design.height / 2,
            width,
            height,
            rotation: 0,
            opacity: 1,
            visible: true,
            locked: false,
            centered: true,
            assetId: asset.id,
            assetCategory: asset.category
          }
        ]
      }
    }))
  }

  const addShapeToCanvas = (shapeType: string) => {
    useEditorStore.setState((state) => ({
      design: {
        ...state.design,
        elements: [
          ...state.design.elements,
          {
            id: `shape_${uuidv4().split('-')[0]}`,
            type: shapeType,
            x: 200,
            y: 200,
            width: 150,
            height: 150,
            fill: '#e9e4d9',
            rotation: 0,
            opacity: 1,
            visible: true,
            locked: false
          } as any
        ]
      }
    }))
  }

  const addIconToCanvas = (svgContent: string) => {
    useEditorStore.setState((state) => ({
      design: {
        ...state.design,
        elements: [
          ...state.design.elements,
          {
            id: `icon_${uuidv4().split('-')[0]}`,
            type: 'icon',
            svgContent,
            fill: '#3b2f27',
            x: 200,
            y: 200,
            width: 50,
            height: 50,
            rotation: 0,
            opacity: 1,
            visible: true,
            locked: false,
            centered: true
          } as any
        ]
      }
    }))
  }

  const addLucideIconToCanvas = (iconName: string) => {
    const Icon = icons[iconName as keyof typeof icons]
    if (!Icon) return
    const svgString = renderToString(<Icon size={24} strokeWidth={1.5} color="#3b2f27" />)
    const innerSvg = svgString
      .replace(/^<svg[^>]*>|<\/svg>$/g, '')
      .replace(/currentColor/g, '#3b2f27')
    addIconToCanvas(innerSvg)
  }

  const changeBackground = (color: string) => {
    useEditorStore.setState((state) => ({
      design: {
        ...state.design,
        background: color
      }
    }))
  }

  const addOrnamentToCanvas = (key: string) => {
    const sembol = SEMBOLLER[key as keyof typeof SEMBOLLER]
    if (!sembol) return
    const h = (sembol.h / sembol.w) * sembol.varsayilanGenislik
    
    // Quick inline helper
    const processSVG = (svgStr: string) => {
       const defs = GRADYANLAR
          .replace(/var\(--p1\)/g, '#d9a441')
          .replace(/var\(--p2\)/g, '#b8742a')
          .replace(/var\(--l1\)/g, '#5f9564')
          .replace(/var\(--l2\)/g, '#3f7a4f');
       const fullSvg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${svgStr}</svg>`;
       return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(fullSvg)))}`;
    }

    useEditorStore.setState((state) => ({
      design: {
        ...state.design,
        elements: [
          ...state.design.elements,
          {
            id: `svg_${uuidv4().split('-')[0]}`,
            type: 'image',
            src: processSVG(sembol.svg),
            x: 540,
            y: 760,
            width: sembol.varsayilanGenislik * 1.5,
            height: h * 1.5,
            rotation: 0,
            opacity: 1,
            centered: true
          }
        ]
      }
    }))
  }

  const applyTemplate = (sablonKey: string) => {
    const sablon = SABLONLAR[sablonKey]
    if (!sablon) return
    const tema = TEMALAR[sablon.tema] || TEMALAR[0]
    const kagit = KAGITLAR[sablon.kagit || 0] || KAGITLAR[0]

    const processSVG = (svgStr: string) => {
       const defs = GRADYANLAR
          .replace(/var\(--p1\)/g, tema.p1)
          .replace(/var\(--p2\)/g, tema.p2)
          .replace(/var\(--l1\)/g, '#5f9564')
          .replace(/var\(--l2\)/g, '#3f7a4f');
       const fullSvg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${svgStr}</svg>`;
       return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(fullSvg)))}`;
    }

    const scale = 3 // 360x560 to 1080x1680

    const newElements = sablon.ogeler.map((oge: any) => {
       const [key, cx, cy, w, rot] = oge
       const sembol = SEMBOLLER[key as keyof typeof SEMBOLLER]
       if (!sembol) return null
       
       const h = (sembol.h / sembol.w) * w
       return {
         id: `svg_${uuidv4().split('-')[0]}`,
         type: 'image',
         src: processSVG(sembol.svg),
         x: (cx * scale),
         y: (cy * scale),
         width: w * scale,
         height: h * scale,
         rotation: rot || 0,
         opacity: 1,
         centered: true // New flag for CanvasImage
       }
    }).filter(Boolean)

    sablon.metinler.forEach((m: any) => {
      const textWidth = m.w;
      newElements.push({
        id: `text_${uuidv4().split('-')[0]}`, type: 'text',
        x: (m.x * scale) - (textWidth / 2), y: m.y * scale, width: textWidth, height: m.s * 1.5,
        text: m.t, fontFamily: m.f, fontSize: m.s, fill: kagit.yazi, align: 'center', centered: false
      })
    })

    useEditorStore.setState(state => ({
      design: {
        ...state.design,
        background: kagit.arka.includes('gradient') ? '#FFFFFF' : kagit.arka,
        elements: newElements
      }
    }))
  }

  return (
    <div className="flex h-full w-[280px] shrink-0 flex-row border-r border-border bg-white shadow-[2px_0_18px_-16px_rgba(16,24,39,0.35)]">
      <div className="flex w-[68px] flex-col items-center gap-1.5 overflow-y-auto border-r border-border bg-[#faf9f6] py-3">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            className={`relative mx-1 flex w-[58px] flex-col items-center gap-1.5 rounded-xl py-2.5 transition-colors ${activeTab === tab.id ? 'bg-midnight text-ivory shadow-sm' : 'text-midnight/60 hover:bg-white hover:text-midnight'}`}
          >
            <tab.icon className="h-[18px] w-[18px]" />
            <span className="text-[8px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto bg-white p-4">
        <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-6 border-b border-border bg-white/95 px-4 py-4 backdrop-blur">
          <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-champagne-dark">Momentis · Kart</p>
          <h2 className="mt-1 font-serif text-xl text-midnight">{tabs.find(t => t.id === activeTab)?.label}</h2>
        </div>
        
        {activeTab === 'elements' && (
          <div className="flex flex-col gap-4">
            <section className="border-b border-[#E9E2D6] pb-4">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-midnight">Davetiye simgeleri</h3>
              <p className="mb-3 text-[10px] leading-relaxed text-muted-foreground">
                60+ simgeyi arayın veya kategorilerden seçin. Dokunarak tasarıma ekleyin.
              </p>
              <input
                type="search"
                value={iconSearch}
                onChange={event => setIconSearch(event.target.value)}
                placeholder="Çiçek, yüzük, kalp ara..."
                aria-label="Davetiye simgesi ara"
                className="mb-2.5 h-9 w-full rounded-lg border border-border bg-[#FBFAF7] px-3 text-xs text-midnight outline-none transition focus:border-champagne focus:ring-2 focus:ring-champagne/20"
              />
              <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
                {['Tümü', ...invitationIconGroups.map(group => group.label)].map(category => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setIconCategory(category)}
                    aria-pressed={iconCategory === category}
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-medium transition ${
                      iconCategory === category
                        ? 'border-midnight bg-midnight text-white'
                        : 'border-border bg-white text-midnight/70 hover:border-champagne hover:bg-[#FBF8F1]'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                {invitationIconGroups
                  .filter(group => iconCategory === 'Tümü' || group.label === iconCategory)
                  .map(group => {
                    const matchingIcons = group.icons.filter(([name, label]) =>
                      `${name} ${label}`.toLocaleLowerCase('tr').includes(iconSearch.trim().toLocaleLowerCase('tr'))
                    )
                    if (!matchingIcons.length) return null
                    return (
                      <div key={group.id}>
                        {iconCategory === 'Tümü' && (
                          <h4 className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-midnight/55">{group.label}</h4>
                        )}
                        <div className="grid grid-cols-4 gap-1.5">
                          {matchingIcons.map(([name, label]) => {
                            const Icon = icons[name as keyof typeof icons]
                            return (
                              <button
                                key={`${group.id}-${name}-${label}`}
                                type="button"
                                onClick={() => addLucideIconToCanvas(name)}
                                title={`${label} ekle`}
                                aria-label={`${label} ekle`}
                                className="group flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl border border-[#EEE9E0] bg-white px-1 py-2 text-midnight/75 transition-all hover:-translate-y-0.5 hover:border-champagne hover:bg-[#FBF8F1] hover:text-midnight hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne"
                              >
                                <Icon size={19} strokeWidth={1.6} />
                                <span className="w-full truncate text-center text-[8px] leading-tight">{label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                {!invitationIconGroups.some(group =>
                  (iconCategory === 'Tümü' || group.label === iconCategory) &&
                  group.icons.some(([name, label]) => `${name} ${label}`.toLocaleLowerCase('tr').includes(iconSearch.trim().toLocaleLowerCase('tr')))
                ) && (
                  <p className="rounded-lg bg-[#FBF8F1] px-3 py-4 text-center text-[10px] text-muted-foreground">
                    Bu aramayla eşleşen simge bulunamadı.
                  </p>
                )}
              </div>
            </section>
             {Object.entries(KATEGORILER).map(([category, keys]) => (
               <div key={category}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{category}</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {keys.map((key) => {
                      const sembol = SEMBOLLER[key as keyof typeof SEMBOLLER]
                      if (!sembol) return null
                      const svgHtml = `<svg viewBox="0 0 100 100" width="100%" height="100%"><defs>${GRADYANLAR.replace(/var\(--p1\)/g, '#d9a441').replace(/var\(--p2\)/g, '#b8742a').replace(/var\(--l1\)/g, '#5f9564').replace(/var\(--l2\)/g, '#3f7a4f')}</defs>${sembol.svg}</svg>`
                      return (
                        <DragAddButton
                          key={key}
                          dragData={{ kind: 'ornament', key }}
                          onClick={() => addOrnamentToCanvas(key)}
                          className="aspect-square border border-border bg-ivory-50 rounded-xl p-2 hover:border-midnight/40 transition-colors flex items-center justify-center"
                          title={sembol.ad}
                        >
                          <div dangerouslySetInnerHTML={{ __html: svgHtml }} className="w-full h-full object-contain pointer-events-none" />
                        </DragAddButton>
                      )
                    })}
                  </div>
               </div>
             ))}
            <div className="pt-4 border-t">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Yeni Dekorasyon Kütüphanesi</h3>
              <p className="text-[10px] text-muted-foreground mb-3">MOMENTIS için hazır SVG süslemeler. Mevcut kütüphanen korunur.</p>
              <div className="space-y-3">
                {EDITOR_ASSET_CATEGORIES.filter(category => category !== 'Shape').map(category => {
                  const assets = EDITOR_ASSETS.filter(asset => asset.category === category)
                  if (!assets.length) return null
                  return (
                    <div key={category}>
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-midnight/70 mb-2">{category}</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {assets.map(asset => (
                          <DragAddButton key={asset.id} dragData={{ kind: 'asset', asset }} onClick={() => addEditorAssetToCanvas(asset)} className="aspect-square border border-border bg-ivory-50 rounded-xl p-2 hover:border-midnight/40 hover:bg-ivory transition-colors" title={asset.name}>
                            <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(asset.svg)}`} alt={asset.name} className="w-full h-full object-contain" />
                          </DragAddButton>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'text' && (
          <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2.5">
            <button onClick={() => addTextToCanvas('Büyük Başlık', 120, 'Playfair Display')} className="group flex min-h-12 w-full items-center justify-between rounded-xl border border-[#D9C8A7] bg-gradient-to-br from-[#FBF8F1] to-white px-3 py-2.5 text-left text-base font-serif text-midnight shadow-sm transition-all hover:-translate-y-0.5 hover:border-champagne hover:shadow-md">
                Başlık Ekle
              <span aria-hidden className="text-lg text-champagne-dark transition-transform group-hover:translate-x-0.5">+</span>
            </button>
            <button onClick={() => addTextToCanvas('Alt Başlık', 64, 'Lora')} className="group flex min-h-11 w-full items-center justify-between rounded-xl border border-border bg-white px-3 py-2.5 text-left text-sm font-serif text-midnight shadow-sm transition-all hover:-translate-y-0.5 hover:border-champagne hover:bg-[#FBF8F1] hover:shadow-md">
              Alt Başlık Ekle
              <span aria-hidden className="text-lg text-champagne-dark transition-transform group-hover:translate-x-0.5">+</span>
            </button>
            <button onClick={() => addTextToCanvas('Davetiye metnini buraya yazabilirsiniz...', 36, 'Montserrat')} className="group flex min-h-10 w-full items-center justify-between rounded-xl border border-border bg-white px-3 py-2.5 text-left text-xs text-midnight shadow-sm transition-all hover:-translate-y-0.5 hover:border-champagne hover:bg-[#FBF8F1] hover:shadow-md">
              Gövde Metni Ekle
              <span aria-hidden className="text-lg text-champagne-dark transition-transform group-hover:translate-x-0.5">+</span>
            </button>
          </div>

          <div className="flex flex-col gap-2.5 border-t border-[#E9E2D6] pt-4">
            <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-midnight/65">Hazır Davetiye Sözleri</h3>
              
            {[
              "Birlikteliğimizi sonsuzluğa taşırken sizleri de aramızda görmekten mutluluk duyarız.",
                "Hayat boyu birlikte ilerlemeye karar verdiğimiz bu yolda bizimle olmanız dileğiyle...",
                "Sevgi, saygı ve anlayışla temelini attığımız beraberliğimizi taçlandıracağımız düğün törenimizde sizleri de bekliyoruz.",
                "Bu mutlu günümüzde yanımızda olmanız dileğiyle...",
                "Ömür boyu sürecek mutlu beraberliğimizin başlangıcında sizleri de aramızda görmekten onur duyarız."
              ].map((text, i) => (
                <button 
                  key={i}
                  onClick={() => addTextToCanvas(text, 32, 'Montserrat')} 
                  className="group relative w-full rounded-xl border border-[#E9E2D6] bg-gradient-to-br from-white to-[#FBF9F5] px-3 py-3 text-left shadow-[0_2px_8px_-5px_rgba(16,24,39,0.24)] transition-all hover:-translate-y-0.5 hover:border-champagne hover:shadow-[0_8px_18px_-10px_rgba(16,24,39,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne"
                  title={text}
                >
                  <span className="mb-1.5 flex items-center justify-between text-[9px] font-medium uppercase tracking-[0.12em] text-champagne-dark">
                    Davetiye sözü {String(i + 1).padStart(2, '0')}
                    <span aria-hidden className="text-base leading-none transition-transform group-hover:translate-x-0.5">+</span>
                  </span>
                  <span className="block whitespace-normal break-words text-[11px] leading-[1.55] text-midnight/85">
                    “{text}”
                  </span>
                </button>
              ))}
            </div>
            
            <div className="flex flex-col gap-3 border-t border-[#E9E2D6] pt-4">
              <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-midnight/65">Yazı Kombinasyonları</h3>
              
              <button 
                onClick={() => addComposition(
                  [
                    { t: "A & M", f: "Cinzel", s: 120, x: 180, y: 260, w: 800 }
                  ],
                  [
                    { k: "celenk", x: 180, y: 280, w: 260, r: 0 }
                  ]
                )}
                className="w-full border border-border bg-ivory-50 rounded-xl p-4 hover:border-midnight/40 transition-colors flex flex-col items-center justify-center gap-2 relative overflow-hidden"
              >
                <div className="absolute opacity-10 scale-[2.5]" dangerouslySetInnerHTML={{ __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%"><defs>${GRADYANLAR.replace(/var\(--p1\)/g, '#d9a441').replace(/var\(--p2\)/g, '#b8742a').replace(/var\(--l1\)/g, '#5f9564').replace(/var\(--l2\)/g, '#3f7a4f')}</defs>${SEMBOLLER["celenk"].svg}</svg>` }} />
                <span className="text-3xl text-midnight z-10" style={{ fontFamily: 'Cinzel, serif' }}>A & M</span>
                <span className="text-[9px] font-sans text-muted-foreground z-10 uppercase tracking-widest mt-1">Çelenkli İsimler</span>
              </button>

              <button 
                onClick={() => addComposition(
                  [
                    { t: "Zeynep", f: "Great Vibes", s: 120, x: 180, y: 200, w: 600 },
                    { t: "Emre", f: "Great Vibes", s: 120, x: 180, y: 320, w: 600 }
                  ],
                  [
                    { k: "kalp", x: 180, y: 290, w: 60, r: 0 }
                  ]
                )}
                className="w-full border border-border bg-ivory-50 rounded-xl p-4 hover:border-midnight/40 transition-colors flex flex-col items-center justify-center gap-1"
              >
                <span className="text-2xl text-midnight" style={{ fontFamily: 'Great Vibes, cursive' }}>Zeynep</span>
                <div className="w-4 h-4" dangerouslySetInnerHTML={{ __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%"><defs>${GRADYANLAR.replace(/var\(--p1\)/g, '#d9a441').replace(/var\(--p2\)/g, '#b8742a')}</defs>${SEMBOLLER["kalp"].svg}</svg>` }} />
                <span className="text-2xl text-midnight" style={{ fontFamily: 'Great Vibes, cursive' }}>Emre</span>
              </button>

              <button 
                onClick={() => addComposition(
                  [
                    { t: "24.08.2026", f: "Oswald", s: 42, x: 180, y: 320, w: 500 }
                  ],
                  [
                    { k: "ayrac2", x: 180, y: 280, w: 200, r: 0 }
                  ]
                )}
                className="w-full border border-border bg-ivory-50 rounded-xl p-4 hover:border-midnight/40 transition-colors flex flex-col items-center justify-center gap-3"
              >
                <div className="w-24 h-6" dangerouslySetInnerHTML={{ __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 40" width="100%" height="100%"><defs>${GRADYANLAR.replace(/var\(--p1\)/g, '#d9a441').replace(/var\(--p2\)/g, '#b8742a')}</defs>${SEMBOLLER["ayrac2"].svg}</svg>` }} />
                <span className="text-sm font-semibold text-midnight tracking-widest" style={{ fontFamily: 'Oswald, sans-serif' }}>24.08.2026</span>
              </button>

              <button 
                onClick={() => addComposition([
                  { t: "Evleniyoruz", f: "Montserrat", s: 32, x: 180, y: 220, w: 600 },
                  { t: "Aslı & Mert", f: "Great Vibes", s: 150, x: 180, y: 260, w: 1000 }
                ])}
                className="w-full border border-border bg-ivory-50 rounded-xl p-4 hover:border-midnight/40 transition-colors flex flex-col items-center justify-center gap-2"
              >
                <span className="text-[10px] tracking-[0.2em] uppercase font-sans text-muted-foreground">Evleniyoruz</span>
                <span className="text-3xl text-midnight" style={{ fontFamily: 'Great Vibes, cursive' }}>Aslı & Mert</span>
              </button>

            </div>
          </div>
        )}

        {activeTab === 'shapes' && (
          <div className="flex flex-col gap-4 h-full">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Temel Şekiller</h3>
              <div className="grid grid-cols-3 gap-2 shrink-0">
                <DragAddButton dragData={{ kind: 'shape', shapeType: 'rect' }} onClick={() => addShapeToCanvas('rect')} className="aspect-square bg-ivory-50 border border-border rounded-xl flex items-center justify-center hover:bg-ivory hover:border-midnight/40 transition-colors" title="Dikdörtgen">
                  <div className="w-12 h-10 bg-midnight/20 rounded-sm" />
                </DragAddButton>
                <DragAddButton dragData={{ kind: 'shape', shapeType: 'circle' }} onClick={() => addShapeToCanvas('circle')} className="aspect-square bg-ivory-50 border border-border rounded-xl flex items-center justify-center hover:bg-ivory hover:border-midnight/40 transition-colors" title="Daire">
                  <div className="w-11 h-11 bg-midnight/20 rounded-full" />
                </DragAddButton>
                {EDITOR_ASSETS.filter(a => a.category === 'Shape').map(asset => (
                  <button key={asset.id} onClick={() => addEditorAssetToCanvas(asset)} className="aspect-square bg-ivory-50 border border-border rounded-xl p-2 flex items-center justify-center hover:bg-ivory hover:border-midnight/40 transition-colors" title={asset.name}>
                    <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(asset.svg)}`} alt={asset.name} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col gap-3 flex-1 pt-3 border-t">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tüm İkonlar</h3>
              <input 
                type="text" 
                placeholder="İkon ara (örn: heart, star...)" 
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-midnight bg-ivory-50"
              />
              <div className="grid grid-cols-4 gap-2 overflow-y-auto max-h-[300px] pr-1">
                {Object.entries(icons)
                  .filter(([name]) => name.toLowerCase().includes(iconSearch.toLowerCase()))
                  .slice(0, 100)
                  .map(([name, Icon]) => (
                    <button 
                      key={name}
                      onClick={() => addLucideIconToCanvas(name)}
                      className="aspect-square flex items-center justify-center border border-transparent hover:border-border hover:bg-ivory-50 rounded-lg transition-colors text-midnight"
                      title={name}
                    >
                      <Icon size={20} strokeWidth={1.5} />
                    </button>
                  ))}
              </div>
            </div>
            <p className="text-[10px] leading-relaxed text-muted-foreground border-t pt-3">
              Şekiller canvas'a bağımsız katman olarak eklenir; taşıyabilir, büyütüp küçültebilir, döndürebilir ve katman sırasını değiştirebilirsin.
            </p>
          </div>
        )}

        {activeTab === 'background' && (
          <div className="flex flex-col gap-4">
             <div className="grid grid-cols-4 gap-2">
                {['#FFFFFF', '#F8F4EC', '#FDFBF7', '#E9E4D9', '#EAE6E1', '#DCD4C4', '#F4F1E9', '#000000', '#101827', '#1F2937'].map(color => (
                  <button 
                    key={color} 
                    onClick={() => changeBackground(color)}
                    className="aspect-square rounded-full border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
             </div>
             <div className="flex items-center gap-3 pt-4 border-t">
               <input 
                 type="color" 
                 value={design.background} 
                 onChange={(e) => changeBackground(e.target.value)}
                 className="w-10 h-10 rounded cursor-pointer"
               />
               <span className="text-xs text-muted-foreground uppercase font-mono">{design.background}</span>
             </div>
          </div>
        )}

        {activeTab === 'layers' && (
          <div className="flex flex-col gap-2">
            {design.elements.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Katman bulunamadı</p>
            ) : (
              [...design.elements].reverse().map(el => (
                <div key={el.id} className="flex items-center justify-between p-2 rounded-lg border border-border bg-ivory-50 hover:border-midnight/40 transition-colors">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-[10px] uppercase font-bold text-midnight/50 bg-black/5 px-1.5 py-0.5 rounded shrink-0">{el.type}</span>
                    <span className="text-xs truncate text-midnight font-medium">
                      {el.type === 'text' ? el.text : el.type === 'image' ? 'Görsel' : 'Şekil'}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      useEditorStore.setState(s => ({
                        design: { ...s.design, elements: s.design.elements.filter(x => x.id !== el.id) }
                      }))
                    }}
                    className="text-muted-foreground hover:text-red-500 p-1"
                    title="Sil"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="grid grid-cols-2 gap-2">
            {[
              "Altın Sarısı Modern Düğün Davetiyesi.svg",
              "Beyaz ve Altın Klasik Düğün Davetiye.svg",
              "Beyaz ve Mavi Geleneksel Düğün Davetiye.svg",
              "Kahverengi ve Beyaz Fotoğraflı Düğün Davetiyesi.svg",
              "Siyah Beyaz Minimalist Eğlenceli Düğün Davetiyesi.svg",
              "Tek Renkli Minimalist Çiçek Düğün Davetiyesi (A6).png",
              "Tek Renkli Minimalist Çiçek Düğün Davetiyesi (A6).svg"
            ].map((filename) => {
              const displayName = filename.replace(/\.(svg|png)$/, '');
              return (
                <button 
                  key={filename} 
                  className="group border border-border hover:border-midnight/40 p-1 rounded-lg text-left transition-all"
                  onClick={() => {
                    useEditorStore.setState(state => ({
                      design: {
                        ...state.design,
                        background: '#FFFFFF',
                        elements: [
                          {
                            id: `img_${uuidv4().split('-')[0]}`,
                            type: 'image',
                            src: `/tamplate/${filename}`,
                            x: 540,
                            y: 840,
                            width: 1080,
                            height: 1680,
                            rotation: 0,
                            opacity: 1,
                            centered: true
                          }
                        ]
                      }
                    }))
                  }}
                >
                  <div className="aspect-[3/4] overflow-hidden rounded bg-ivory flex items-center justify-center pointer-events-none w-full">
                     <img src={`/tamplate/${filename}`} alt={displayName} className="w-full h-full object-cover" />
                  </div>
                  <p className="mt-1 truncate text-center font-serif text-[9px] text-midnight" title={displayName}>{displayName}</p>
                </button>
              )
            })}
          </div>
        )}

        {activeTab === 'uploads' && (
          <div className="space-y-5">
            <label className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-midnight/20 bg-gradient-to-br from-[#FBF8F1] to-white p-4 transition-all hover:border-champagne hover:shadow-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-midnight text-champagne shadow-sm transition-transform group-hover:scale-105">
                <ImagePlus className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-midnight">Kendi görselini yükle</span>
                <span className="mt-1 block text-[9px] text-muted-foreground">PNG, JPG veya SVG · Bu oturumda kullanılabilir</span>
              </span>
              <PlusCircle className="h-4 w-4 shrink-0 text-midnight/40 transition-colors group-hover:text-champagne-dark" />
              <input type="file" accept="image/*,.svg" className="hidden" onChange={handleFileUpload} />
            </label>

            {uploadedImages.length > 0 && (
              <section className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-midnight">Yüklediklerim</h3>
                  <span className="rounded-full bg-ivory-50 px-2 py-0.5 text-[9px] tabular-nums text-muted-foreground">{uploadedImages.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {uploadedImages.map((src, i) => (
                    <button
                      key={`${i}-${src.slice(0, 24)}`}
                      type="button"
                      onClick={() => addExternalImageToCanvas(src)}
                      aria-label={`Yüklenen görsel ${i + 1} tuvale ekle`}
                      className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-[#F8F6F1] p-1.5 text-left transition-all hover:-translate-y-0.5 hover:border-champagne hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne"
                    >
                      <img src={src} alt="" className="h-full w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-105" />
                      <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-midnight opacity-0 shadow-md transition-all group-hover:opacity-100">
                        <PlusCircle className="h-4 w-4" />
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-3">
              <div className="flex items-end justify-between gap-2">
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-midnight">Hazır grafikler</h3>
                  <p className="mt-1 text-[9px] text-muted-foreground">Seçtiğin görsele dokunarak tasarıma ekle.</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#F5F1E8] px-2 py-1 text-[9px] font-medium tabular-nums text-midnight/70">
                  {filteredSvgFiles.length} / {svgFiles.length}
                </span>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-midnight/35" />
                <input
                  type="search"
                  value={uploadSearch}
                  onChange={(event) => setUploadSearch(event.target.value)}
                  placeholder="Grafiklerde ara..."
                  aria-label="Hazır grafiklerde ara"
                  className="h-9 w-full rounded-xl border border-border bg-white pl-9 pr-8 text-[10px] text-midnight outline-none transition focus:border-champagne focus:ring-2 focus:ring-champagne/15"
                />
                {uploadSearch && (
                  <button type="button" onClick={() => setUploadSearch('')} aria-label="Aramayı temizle" className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-midnight/40 hover:bg-ivory-50 hover:text-midnight">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {filteredSvgFiles.length > 0 ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {filteredSvgFiles.map((filename) => {
                    const label = assetLabel(filename)
                    const isPhoto = /\.(jpe?g)$/i.test(filename)
                    return (
                      <button
                        key={filename}
                        type="button"
                        onClick={() => addImageToCanvas(filename)}
                        aria-label={`${label} görselini tuvale ekle`}
                        title={`${label} · Tuvale eklemek için tıkla`}
                        className="group relative min-w-0 overflow-hidden rounded-xl border border-[#EAE5DC] bg-white p-1.5 text-left shadow-[0_2px_8px_rgba(16,24,39,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-champagne hover:shadow-[0_8px_18px_rgba(16,24,39,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne"
                      >
                        <span className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-[linear-gradient(145deg,#F8F6F1,#F0ECE3)] p-2">
                          <img
                            src={`/svg/${encodeURIComponent(filename)}`}
                            alt=""
                            loading="lazy"
                            className={`h-full w-full transition-transform duration-300 group-hover:scale-105 ${isPhoto ? 'rounded-md object-cover' : 'object-contain'}`}
                          />
                          <span className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-midnight opacity-0 shadow-md transition-all duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                            <PlusCircle className="h-4 w-4" />
                          </span>
                        </span>
                        <span className="block truncate px-1 pb-0.5 pt-2 text-[9px] font-medium text-midnight/75">{label}</span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-[#FBFAF7] px-3 py-7 text-center">
                  <Search className="mx-auto h-5 w-5 text-midnight/25" />
                  <p className="mt-2 text-[10px] font-medium text-midnight/65">Grafik bulunamadı</p>
                  <button type="button" onClick={() => setUploadSearch('')} className="mt-1 text-[9px] text-champagne-dark underline underline-offset-2">Aramayı temizle</button>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'theme' && <ThemePalettePanel />}

        {activeTab === 'photos' && (
           <div className="flex flex-col gap-4">
             <p className="text-[10px] text-muted-foreground text-center px-2">
               Düğün, gelin ve damat fotoğrafları. Tıklayarak davetiyenize ekleyebilirsiniz.
             </p>
             <div className="grid grid-cols-2 gap-2">
               {weddingPhotos.map((url, i) => (
                 <button
                   key={i}
                   onClick={() => addExternalImageToCanvas(url)}
                   className="aspect-[3/4] border border-border bg-ivory-50 rounded-xl overflow-hidden hover:border-midnight/40 transition-all flex items-center justify-center group"
                 >
                   <img src={url} alt="Wedding" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                 </button>
               ))}
             </div>
           </div>
        )}
      </div>
    </div>
  )
}
