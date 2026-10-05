import React, { useMemo } from 'react'
import { SEMBOLLER, GRADYANLAR, KAGITLAR, TEMALAR } from '@/lib/davetiye-svg'

function fittedFontSize(value, preferred = 36, maxWidth = 275, minimum = 13) {
  const text = String(value || '')
  if (!text) return preferred
  return Math.max(minimum, Math.min(preferred, maxWidth / Math.max(text.length * 0.58, 1)))
}

function wrapMessage(value, maxLength = 46) {
  const words = String(value || '').trim().split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (next.length > maxLength && line) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  if (lines.length > 2) lines[1] = `${lines[1].slice(0, maxLength - 1).trimEnd()}…`
  return lines.slice(0, 2)
}

function CardText({ children, x, y, fill, fontSize, anchor = 'middle', textWidth = 292, ...props }) {
  const value = String(children || '')
  const longText = value.length > 42
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fill={fill}
      fontSize={fontSize}
      fontFamily="Georgia, 'Times New Roman', serif"
      textLength={longText ? textWidth : undefined}
      lengthAdjust={longText ? 'spacingAndGlyphs' : undefined}
      {...props}
    >
      {value}
    </text>
  )
}

export function DavetiyeKart({ veri, className, scale = 1 }) {
  const tema = TEMALAR[veri?.tema] || TEMALAR[0]
  const kagit = KAGITLAR[veri?.kagit] || KAGITLAR[0]
  const yazilar = veri?.yazilar || {}
  const ogeler = veri?.ogeler || []
  const layout = ['classic', 'editorial', 'modern', 'minimal'].includes(veri?.layout) ? veri.layout : 'classic'
  const isEditorial = layout === 'editorial'
  const isModern = layout === 'modern'
  const isMinimal = layout === 'minimal'
  const firstName = yazilar.isim1 || 'Gelin'
  const secondName = yazilar.isim2 || ''
  const oneName = !secondName.trim()
  const parents = [yazilar.bride_mother, yazilar.bride_father, yazilar.groom_mother, yazilar.groom_father]
  const hasFamilies = parents.some(Boolean)
  const messageLines = wrapMessage(yazilar.mesaj || 'Bu özel günümüzde sizleri de aramızda görmekten mutluluk duyarız.')
  // Keep decorative SVG elements in the top/bottom margins so none cover the copy.
  const safeDecorations = isMinimal ? [] : ogeler.filter((item) => item.y <= 120 || ((item.x <= 34 || item.x >= 326) && item.y >= 448))
  const uniqueSymbols = useMemo(() => Array.from(new Set(safeDecorations.map((item) => item.k))), [safeDecorations])
  const place = String(yazilar.mekan || '')
  const city = String(yazilar.sehir || '')
  const address = String(yazilar.adres || '')
  const hasLocation = Boolean(place || city)
  const title = String(yazilar.title || '').trim()
  if (!veri) return null

  const familyHeadingY = isEditorial ? 258 : isModern ? 262 : 245
  const familyMotherY = familyHeadingY + 15
  const familyFatherY = familyHeadingY + 27
  const messageY = isEditorial ? (hasFamilies ? 310 : 264) : isModern ? (hasFamilies ? 326 : 278) : (hasFamilies ? 295 : 263)
  const informationStartY = messageY + messageLines.length * 14 + 23
  const metadataTop = informationStartY - 8
  const dateCenterX = hasLocation ? 105 : 180
  const leftNameX = 105
  const rightNameX = 255

  return (
    <div className={className} style={{ width: '100%', maxWidth: `${360 * scale}px`, margin: '0 auto', position: 'relative' }} data-testid="invitation-card">
      <svg
        viewBox="0 0 360 520"
        width="100%"
        height="100%"
        role="img"
        aria-label={`Davetiye kartı: ${[firstName, secondName].filter(Boolean).join(' & ')}`}
        style={{ display: 'block', background: kagit.arka, boxShadow: '0 20px 40px -10px rgba(16,24,39,0.18)', borderRadius: '8px', overflow: 'hidden', '--p1': tema.p1, '--p2': tema.p2, '--l1': '#9bbfa8', '--l2': '#5f8a6a' }}
      >
        <defs>
          <style>{`:root{--p1:${tema.p1};--p2:${tema.p2};--l1:#9bbfa8;--l2:#5f8a6a}`}</style>
          <g dangerouslySetInnerHTML={{ __html: GRADYANLAR }} />
          {uniqueSymbols.map((key) => SEMBOLLER[key] && <g id={`s-${key}`} key={key} dangerouslySetInnerHTML={{ __html: SEMBOLLER[key].svg }} />)}
        </defs>

        {!isMinimal && <rect x="19" y="19" width="322" height="482" rx={isEditorial ? 2 : 8} fill="none" stroke={tema.p2} strokeOpacity=".5" strokeWidth="1.2" />}
        {isModern && <rect x="27" y="166" width="306" height="157" rx="22" fill={tema.p1} fillOpacity=".66" stroke={tema.p2} strokeOpacity=".45" />}
        {isEditorial && <>
          <rect x="39" y="166" width="3" height="157" rx="1.5" fill={tema.p2} />
          <path d="M57 160h246" stroke={tema.p2} strokeOpacity=".6" />
        </>}
        {isMinimal && <path d="M50 163h260M50 322h260" stroke={tema.p2} strokeOpacity=".55" />}

        {safeDecorations.map((item, index) => {
          const symbol = SEMBOLLER[item.k]
          if (!symbol) return null
          return <g key={`${item.k}-${index}`} transform={`translate(${item.x} ${item.y}) rotate(${item.r}) scale(${item.w / symbol.w}) translate(-50 -50)`}><use href={`#s-${item.k}`} /></g>
        })}

        <CardText x="180" y="112" fill={tema.p2} fontSize="9" letterSpacing="1.8">
          {(yazilar.baslik || 'Davetlisiniz').toLocaleUpperCase('tr-TR')}
        </CardText>
        {title && <CardText x="180" y="137" fill={kagit.yazi} fontSize={fittedFontSize(title, 12, 280, 8)} letterSpacing="1.4" fontWeight="600">
          {title.toLocaleUpperCase('tr-TR')}
        </CardText>}

        {isEditorial ? <>
          <CardText x="180" y="191" fill={kagit.yazi} fontSize={fittedFontSize(firstName, 35, 255)} fontStyle="italic">{firstName}</CardText>
          {!oneName && <CardText x="180" y="230" fill={kagit.yazi} fontSize={fittedFontSize(secondName, 35, 255)} fontStyle="italic">{secondName}</CardText>}
          {!oneName && <CardText x="180" y="210" fill={tema.p2} fontSize="13" fontStyle="italic">&amp;</CardText>}
        </> : <>
          <CardText x={oneName ? 180 : leftNameX} y="205" fill={kagit.yazi} fontSize={fittedFontSize(firstName, isModern ? 30 : 32, 138)} fontStyle="italic">{firstName}</CardText>
          {!oneName && <CardText x="180" y="205" fill={tema.p2} fontSize="15" fontStyle="italic">&amp;</CardText>}
          {!oneName && <CardText x={rightNameX} y="205" fill={kagit.yazi} fontSize={fittedFontSize(secondName, isModern ? 30 : 32, 138)} fontStyle="italic">{secondName}</CardText>}
        </>}

        {hasFamilies && <>
          <CardText x="110" y={familyHeadingY} fill={tema.p2} fontSize="7.5" letterSpacing=".8" textWidth={145}>GELİN AİLESİ</CardText>
          <CardText x="260" y={familyHeadingY} fill={tema.p2} fontSize="7.5" letterSpacing=".8" textWidth={145}>DAMAT AİLESİ</CardText>
          {yazilar.bride_mother && <CardText x="110" y={familyMotherY} fill={kagit.yazi} fontSize={fittedFontSize(`Anne · ${yazilar.bride_mother}`, 8.2, 145, 6.5)} textWidth={145}>{`Anne · ${yazilar.bride_mother}`}</CardText>}
          {yazilar.bride_father && <CardText x="110" y={familyFatherY} fill={kagit.yazi} fontSize={fittedFontSize(`Baba · ${yazilar.bride_father}`, 8.2, 145, 6.5)} textWidth={145}>{`Baba · ${yazilar.bride_father}`}</CardText>}
          {yazilar.groom_mother && <CardText x="260" y={familyMotherY} fill={kagit.yazi} fontSize={fittedFontSize(`Anne · ${yazilar.groom_mother}`, 8.2, 145, 6.5)} textWidth={145}>{`Anne · ${yazilar.groom_mother}`}</CardText>}
          {yazilar.groom_father && <CardText x="260" y={familyFatherY} fill={kagit.yazi} fontSize={fittedFontSize(`Baba · ${yazilar.groom_father}`, 8.2, 145, 6.5)} textWidth={145}>{`Baba · ${yazilar.groom_father}`}</CardText>}
        </>}

        {!isMinimal && !isModern && <path d="M112 282h136" stroke={tema.p2} strokeOpacity=".65" strokeLinecap="round" />}
        {messageLines.map((line, index) => <CardText key={index} x="180" y={messageY + index * 14} fill={kagit.yazi} fillOpacity=".78" fontSize="9.5" fontStyle="italic">{line}</CardText>)}

        <rect x="34" y={metadataTop} width={hasLocation ? 142 : 292} height="60" rx="10" fill={kagit.yazi} fillOpacity=".035" stroke={tema.p2} strokeOpacity=".3" />
        {hasLocation && <rect x="184" y={metadataTop} width="142" height="60" rx="10" fill={kagit.yazi} fillOpacity=".035" stroke={tema.p2} strokeOpacity=".3" />}

        <g fill="none" stroke={tema.p2} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
          <rect x="48" y={metadataTop + 9} width="11" height="10" rx="2" />
          <path d={`M51 ${metadataTop + 7}v4M56 ${metadataTop + 7}v4M48 ${metadataTop + 13}h11`} />
        </g>
        <CardText x="64" y={metadataTop + 18} fill={tema.p2} fontSize="7.2" letterSpacing="1.1" anchor="start" textWidth={hasLocation ? 95 : 240}>TARİH & SAAT</CardText>
        <CardText x={dateCenterX} y={metadataTop + 36} fill={kagit.yazi} fontSize={fittedFontSize(yazilar.tarih || 'Tarih seçilmedi', 8.5, hasLocation ? 128 : 265, 6.5)} textWidth={hasLocation ? 128 : 265}>
          {(yazilar.tarih || 'Tarih seçilmedi').toLocaleUpperCase('tr-TR')}
        </CardText>
        <CardText x={dateCenterX} y={metadataTop + 50} fill={tema.p2} fontSize="8.2" letterSpacing=".8">{[yazilar.hafta_gunu, yazilar.saat].filter(Boolean).join(' · ') || 'Saat seçilmedi'}</CardText>

        {hasLocation && <>
          <g fill="none" stroke={tema.p2} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
            <path d={`M196 ${metadataTop + 9}c-3.8 0-5.8 2.8-5.8 5.7 0 3.8 5.8 9.2 5.8 9.2s5.8-5.4 5.8-9.2c0-2.9-2-5.7-5.8-5.7z`} />
            <circle cx="196" cy={metadataTop + 14.5} r="1.5" />
          </g>
          <CardText x="207" y={metadataTop + 18} fill={tema.p2} fontSize="7.2" letterSpacing="1.1" anchor="start" textWidth={108}>KONUM</CardText>
          <CardText x="255" y={metadataTop + 36} fill={kagit.yazi} fontSize={fittedFontSize(place || city || address || 'Konum', 9.5, 128, 7)} textWidth={128} fontWeight="600">{place || city || address}</CardText>
          {city && place && <CardText x="255" y={metadataTop + 50} fill={kagit.yazi} fillOpacity=".75" fontSize={fittedFontSize(city, 8, 128, 6.5)} textWidth={128}>{city}</CardText>}
        </>}
        {address && <>
          <rect x="34" y={metadataTop + 66} width="292" height="23" rx="8" fill={kagit.yazi} fillOpacity=".025" stroke={tema.p2} strokeOpacity=".22" />
          <g fill="none" stroke={tema.p2} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
            <path d={`M49 ${metadataTop + 71}c-3 0-4.5 2.2-4.5 4.4 0 3 4.5 7 4.5 7s4.5-4 4.5-7c0-2.2-1.5-4.4-4.5-4.4z`} />
            <circle cx="49" cy={metadataTop + 75.4} r="1.2" />
          </g>
          <CardText x="61" y={metadataTop + 81} fill={kagit.yazi} fillOpacity=".72" fontSize={fittedFontSize(address, 8.2, 252, 6.5)} textWidth={252} anchor="start" fontFamily="Arial, sans-serif">{address}</CardText>
        </>}
      </svg>
    </div>
  )
}
