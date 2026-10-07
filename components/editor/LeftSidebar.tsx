import React, { useState } from 'react'
import { LayoutTemplate, Type, Image as ImageIcon, Sparkles, Shapes, ImagePlus, Copy, Layers } from 'lucide-react'
import { useEditorStore } from '@/store/editor-store'
import { v4 as uuidv4 } from 'uuid'
import { SABLONLAR, SEMBOLLER, TEMALAR, KAGITLAR, GRADYANLAR, KATEGORILER } from '@/lib/davetiye-svg'
import { DavetiyeKart } from '@/components/shared/davetiye-kart'
import { EDITOR_ASSETS, EDITOR_ASSET_CATEGORIES, EditorAsset } from '@/lib/editor-assets'

const tabs = [
  { id: 'templates', icon: LayoutTemplate, label: 'Şablonlar' },
  { id: 'text', icon: Type, label: 'Metin' },
  { id: 'elements', icon: Sparkles, label: 'Süslemeler' },
  { id: 'uploads', icon: ImagePlus, label: 'Yüklemeler' },
  { id: 'photos', icon: ImageIcon, label: 'Fotoğraflar' },
  { id: 'shapes', icon: Shapes, label: 'Şekiller' },
  { id: 'background', icon: Copy, label: 'Arka Plan' },
  { id: 'layers', icon: Layers, label: 'Katmanlar' }
]

const svgFiles = [
  "Beyaz ve Altın Minimalist Düğün Dikey Davetiye (1).png",
  "Beyaz ve Altın Minimalist Düğün Dikey Davetiye (2).png",
  "Beyaz ve Altın Minimalist Düğün Dikey Davetiye.png",
  "Gri Beyaz Minimalist Suluboya Düğün Davetiyesi .png",
  "Mavi Geleneksel Düğün Davetiye (1).png",
  "Mavi Geleneksel Düğün Davetiye.png",
  "Siyah Beyaz Minimalist Düğün Davetiye.png"
]

export function LeftSidebar() {
  const [activeTab, setActiveTab] = useState('elements')
  const { design, updateElement } = useEditorStore()

  const addImageToCanvas = (filename: string) => {
    useEditorStore.setState((state) => ({
      design: {
        ...state.design,
        elements: [
          ...state.design.elements,
          {
            id: `img_${uuidv4().split('-')[0]}`,
            type: 'image',
            src: `/svg/${filename}`,
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
    <div className="w-[260px] bg-white border-r flex flex-row shrink-0 h-full">
      <div className="w-[64px] border-r bg-ivory flex flex-col items-center py-4 gap-2 overflow-y-auto">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex flex-col items-center gap-1.5 py-3 transition-colors ${activeTab === tab.id ? 'text-midnight bg-black/5' : 'text-midnight/70 hover:text-midnight hover:bg-black/5'}`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[9px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="flex-1 p-3 bg-white overflow-y-auto">
        <h2 className="font-serif text-lg mb-4 text-midnight">{tabs.find(t => t.id === activeTab)?.label}</h2>
        
        {activeTab === 'elements' && (
          <div className="flex flex-col gap-4">
             {Object.entries(KATEGORILER).map(([category, keys]) => (
               <div key={category}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{category}</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {keys.map((key) => {
                      const sembol = SEMBOLLER[key as keyof typeof SEMBOLLER]
                      if (!sembol) return null
                      const svgHtml = `<svg viewBox="0 0 100 100" width="100%" height="100%"><defs>${GRADYANLAR.replace(/var\(--p1\)/g, '#d9a441').replace(/var\(--p2\)/g, '#b8742a').replace(/var\(--l1\)/g, '#5f9564').replace(/var\(--l2\)/g, '#3f7a4f')}</defs>${sembol.svg}</svg>`
                      return (
                        <button 
                          key={key} 
                          onClick={() => addOrnamentToCanvas(key)}
                          className="aspect-square border border-border bg-ivory-50 rounded-xl p-2 hover:border-midnight/40 transition-colors flex items-center justify-center"
                          title={sembol.ad}
                        >
                          <div dangerouslySetInnerHTML={{ __html: svgHtml }} className="w-full h-full object-contain pointer-events-none" />
                        </button>
                      )
                    })}
                  </div>
               </div>
             ))}
          </div>
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
                          <button key={asset.id} onClick={() => addEditorAssetToCanvas(asset)} className="aspect-square border border-border bg-ivory-50 rounded-xl p-2 hover:border-midnight/40 hover:bg-ivory transition-colors" title={asset.name}>
                            <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(asset.svg)}`} alt={asset.name} className="w-full h-full object-contain" />
                          </button>
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
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <button onClick={() => addTextToCanvas('Büyük Başlık', 120, 'Playfair Display')} className="w-full bg-ivory-50 border border-border p-3 rounded-xl text-xl font-serif text-midnight hover:bg-ivory hover:border-midnight/40 transition-colors">
                Başlık Ekle
              </button>
              <button onClick={() => addTextToCanvas('Alt Başlık', 64, 'Lora')} className="w-full bg-ivory-50 border border-border p-2 rounded-xl text-base font-serif text-midnight hover:bg-ivory hover:border-midnight/40 transition-colors">
                Alt Başlık Ekle
              </button>
              <button onClick={() => addTextToCanvas('Davetiye metnini buraya yazabilirsiniz...', 36, 'Montserrat')} className="w-full bg-ivory-50 border border-border p-2 rounded-xl text-xs text-midnight hover:bg-ivory hover:border-midnight/40 transition-colors">
                Gövde Metni Ekle
              </button>
            </div>
            
            <div className="flex flex-col gap-3 border-t pt-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Yazı Kombinasyonları</h3>
              
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
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Temel Şekiller</h3>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => addShapeToCanvas('rect')} className="aspect-square bg-ivory-50 border border-border rounded-xl flex items-center justify-center hover:bg-ivory hover:border-midnight/40 transition-colors" title="Dikdörtgen">
                  <div className="w-12 h-10 bg-midnight/20 rounded-sm" />
                </button>
                <button onClick={() => addShapeToCanvas('circle')} className="aspect-square bg-ivory-50 border border-border rounded-xl flex items-center justify-center hover:bg-ivory hover:border-midnight/40 transition-colors" title="Daire">
                  <div className="w-11 h-11 bg-midnight/20 rounded-full" />
                </button>
                {EDITOR_ASSETS.filter(a => a.category === 'Shape').map(asset => (
                  <button key={asset.id} onClick={() => addEditorAssetToCanvas(asset)} className="aspect-square bg-ivory-50 border border-border rounded-xl p-2 flex items-center justify-center hover:bg-ivory hover:border-midnight/40 transition-colors" title={asset.name}>
                    <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(asset.svg)}`} alt={asset.name} className="w-full h-full object-contain" />
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
           <div className="flex flex-col gap-4">
             <button className="w-full bg-midnight text-ivory rounded-xl p-3 text-xs uppercase tracking-wider font-medium hover:bg-midnight/90 transition-colors flex items-center justify-center gap-2">
               <ImagePlus className="w-4 h-4" /> Görsel Yükle
             </button>
             <p className="text-[10px] text-muted-foreground text-center px-2">
               Yüklediğiniz görseller (PNG, JPG, SVG) burada listelenecek ve tıklayarak davetiyenize ekleyebileceksiniz.
             </p>

             <div className="grid grid-cols-2 gap-2 mt-2">
               {svgFiles.map(filename => (
                 <button
                   key={filename}
                   onClick={() => addImageToCanvas(filename)}
                   className="aspect-[3/4] border border-border bg-ivory-50 rounded-xl overflow-hidden hover:border-midnight/40 transition-all flex items-center justify-center group"
                   title={filename}
                 >
                   <img src={`/svg/${filename}`} alt={filename} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                 </button>
               ))}
             </div>
           </div>
        )}

        {['photos'].includes(activeTab) && (
           <div className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded-xl border-border bg-ivory-50">
             Bu özellik yakında eklenecek...
           </div>
        )}
      </div>
    </div>
  )
}
