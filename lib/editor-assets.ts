export type EditorAsset = {
  id: string
  name: string
  category: 'Floral' | 'Botanical' | 'Wedding' | 'Ornament' | 'Frame' | 'Divider' | 'Shape'
  svg: string
  width: number
  height: number
}

const S = (content: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">${content}</svg>`

export const EDITOR_ASSETS: EditorAsset[] = [
  { id: 'floral-corner', name: 'Çiçek Köşesi', category: 'Floral', width: 220, height: 220, svg: S('<path d="M8 92C24 70 25 45 45 28C58 17 72 10 92 8" stroke="#B88A45" stroke-width="2"/><path d="M23 71C10 62 8 50 13 42C24 43 31 52 23 71Z" fill="#7C9A73"/><path d="M39 48C28 38 28 27 34 20C44 23 50 33 39 48Z" fill="#A9BE99"/><circle cx="72" cy="22" r="9" stroke="#B88A45" stroke-width="2"/><circle cx="72" cy="22" r="3" fill="#B88A45"/>') },
  { id: 'floral-sprig', name: 'Çiçek Dalı', category: 'Floral', width: 260, height: 120, svg: S('<path d="M8 92C35 75 57 53 92 10" stroke="#B88A45" stroke-width="2"/><path d="M30 73C20 59 22 50 30 44C39 51 39 61 30 73Z" fill="#7C9A73"/><path d="M47 57C40 44 43 35 51 31C58 40 56 49 47 57Z" fill="#A9BE99"/><path d="M65 37C60 26 64 18 72 15C77 25 73 33 65 37Z" fill="#7C9A73"/><circle cx="88" cy="13" r="7" fill="#F4D9D7" stroke="#B88A45" stroke-width="2"/>') },
  { id: 'wreath', name: 'Botanik Çelenk', category: 'Botanical', width: 260, height: 260, svg: S('<path d="M50 8C25 8 9 26 9 50s16 42 41 42 41-18 41-42S75 8 50 8Z" stroke="#7C9A73" stroke-width="2"/><path d="M26 29l-9-5M21 42l-11-1M22 59l-10 4M30 72l-8 8M74 29l9-5M79 42l11-1M78 59l10 4M70 72l8 8" stroke="#B88A45" stroke-width="2" stroke-linecap="round"/><circle cx="50" cy="8" r="4" fill="#B88A45"/>') },
  { id: 'eucalyptus', name: 'Okaliptüs', category: 'Botanical', width: 240, height: 180, svg: S('<path d="M8 90C35 74 55 48 91 8" stroke="#6F8E70" stroke-width="2"/><ellipse cx="27" cy="70" rx="9" ry="5" transform="rotate(-35 27 70)" fill="#9FB49A"/><ellipse cx="39" cy="59" rx="9" ry="5" transform="rotate(-35 39 59)" fill="#7C9A73"/><ellipse cx="52" cy="46" rx="9" ry="5" transform="rotate(-35 52 46)" fill="#9FB49A"/><ellipse cx="65" cy="33" rx="9" ry="5" transform="rotate(-35 65 33)" fill="#7C9A73"/><ellipse cx="77" cy="21" rx="9" ry="5" transform="rotate(-35 77 21)" fill="#9FB49A"/>') },
  { id: 'rings', name: 'Yüzükler', category: 'Wedding', width: 180, height: 130, svg: S('<circle cx="43" cy="63" r="25" stroke="#C9A96E" stroke-width="5"/><circle cx="61" cy="50" r="25" stroke="#9B6B38" stroke-width="5"/><circle cx="61" cy="50" r="8" stroke="#E5C98A" stroke-width="2"/>') },
  { id: 'heart-outline', name: 'Kalp', category: 'Wedding', width: 150, height: 130, svg: S('<path d="M50 86S15 64 15 39c0-12 8-21 20-21 8 0 13 4 15 10 3-6 8-10 15-10 12 0 20 9 20 21 0 25-35 47-35 47Z" stroke="#B88A45" stroke-width="3"/>') },
  { id: 'bow', name: 'Kurdele', category: 'Wedding', width: 220, height: 120, svg: S('<path d="M50 52C33 28 13 22 10 35c-3 13 14 24 40 24M50 52c17-24 37-30 40-17 3 13-14 24-40 24M50 45v42" stroke="#B88A45" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="52" r="8" fill="#C9A96E"/>') },
  { id: 'art-deco', name: 'Art Deco', category: 'Ornament', width: 240, height: 120, svg: S('<path d="M8 92L50 8l42 84M20 92L50 30l30 62M8 92h84M28 92l22-43 22 43" stroke="#B88A45" stroke-width="2"/><circle cx="50" cy="8" r="5" fill="#B88A45"/>') },
  { id: 'flourish', name: 'Zarif Flourish', category: 'Ornament', width: 280, height: 100, svg: S('<path d="M8 65C28 18 46 18 53 48c5 21 19 23 39-17M8 65c19-2 30 7 25 18M92 31c-18 3-29-6-24-17" stroke="#B88A45" stroke-width="2" stroke-linecap="round"/>') },
  { id: 'gold-frame', name: 'İnce Altın Çerçeve', category: 'Frame', width: 260, height: 180, svg: S('<rect x="8" y="8" width="84" height="84" rx="2" stroke="#B88A45" stroke-width="2"/><path d="M8 22h14M78 8v14M92 78H78M22 92V78" stroke="#B88A45" stroke-width="3"/>') },
  { id: 'floral-frame', name: 'Çiçekli Çerçeve', category: 'Frame', width: 260, height: 180, svg: S('<rect x="9" y="9" width="82" height="82" rx="3" stroke="#7C9A73" stroke-width="2"/><circle cx="9" cy="9" r="7" fill="#E7C7C4" stroke="#B88A45"/><circle cx="91" cy="9" r="7" fill="#E7C7C4" stroke="#B88A45"/><circle cx="9" cy="91" r="7" fill="#E7C7C4" stroke="#B88A45"/><circle cx="91" cy="91" r="7" fill="#E7C7C4" stroke="#B88A45"/>') },
  { id: 'divider-floral', name: 'Çiçekli Ayraç', category: 'Divider', width: 300, height: 80, svg: S('<path d="M5 50h32M63 50h32" stroke="#B88A45" stroke-width="2"/><path d="M50 68c-5-11-5-25 0-36 5 11 5 25 0 36Z" fill="#7C9A73"/><circle cx="50" cy="30" r="5" fill="#E7C7C4"/><circle cx="50" cy="70" r="4" fill="#B88A45"/>') },
  { id: 'divider-double', name: 'Çift Çizgi', category: 'Divider', width: 300, height: 70, svg: S('<path d="M5 42h90M20 58h60" stroke="#B88A45" stroke-width="2"/><circle cx="12" cy="50" r="3" fill="#B88A45"/><circle cx="88" cy="50" r="3" fill="#B88A45"/>') },
  { id: 'seal', name: 'Mühür', category: 'Shape', width: 160, height: 160, svg: S('<path d="M50 5l10 8 13-2 7 12 13 4-1 14 8 10-8 10 1 14-13 4-7 12-13-2-10 8-10-8-13 2-7-12-13-4 1-14-8-10 8-10-1-14 13-4 7-12 13 2 10-8Z" fill="#F4E7CE" stroke="#B88A45" stroke-width="2"/><circle cx="50" cy="50" r="28" stroke="#B88A45" stroke-width="2"/><path d="M50 31v38M31 50h38" stroke="#B88A45" stroke-width="2"/>') },
  { id: 'star', name: 'Yıldız', category: 'Shape', width: 150, height: 150, svg: S('<path d="m50 7 10 29 31 1-24 19 8 30-25-17-25 17 8-30L9 37l31-1Z" fill="#F4E7CE" stroke="#B88A45" stroke-width="2"/>') },
  { id: 'diamond', name: 'Baklava', category: 'Shape', width: 150, height: 150, svg: S('<path d="m50 7 43 43-43 43L7 50 50 7Z" fill="#F8F4EC" stroke="#B88A45" stroke-width="2"/><path d="m50 20 30 30-30 30-30-30 30-30Z" stroke="#B88A45"/>') },
  { id: 'banner', name: 'Şerit', category: 'Shape', width: 300, height: 110, svg: S('<path d="M8 20h84v60H8l12-30Z" fill="#F4E7CE" stroke="#B88A45" stroke-width="2"/><path d="M8 20 2 12v28l6-8M92 20l6-8v28l-6-8" fill="#E7C7C4" stroke="#B88A45" stroke-width="2"/>') },
]

export const EDITOR_ASSET_CATEGORIES = ['Floral', 'Botanical', 'Wedding', 'Ornament', 'Frame', 'Divider', 'Shape'] as const
