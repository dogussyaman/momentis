/* Curated stock imagery (Unsplash) used by defaults, templates & image picker */
const u = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`

export const STOCK = {
  hero1: u('1519741497674-611481863552', 2000),
  hero2: u('1511285560929-80b456fea0bc', 2000),
  hero3: u('1465495976277-4387d4b0b4c6', 2000),
  hero4: u('1469371670807-013ccf25f16a', 2000),
  hero5: u('1606216794074-735e91aa2c92', 2000),
  bride: u('1494790108377-be9c29b29330', 800),
  groom: u('1507003211169-0a1dd7228f2d', 800),
  rings: u('1515934751635-c81c6bc9a2d8', 1200),
  bouquet: u('1494774157365-9e04c6720e47', 1200),
  table: u('1478146896981-b80fe463b330', 1200),
  decor: u('1550005809-91ad75fb315f', 1200),
  couple1: u('1522673607200-164d1b6ce486', 1200),
  couple2: u('1525258946800-98cfd641d0de', 1200),
  couple3: u('1460978812857-470ed1c77af0', 1200),
  flowers: u('1507504031003-b417219a0fde', 1200),
  bride2: u('1520854221256-17451cc331bf', 1200),
  ceremony: u('1537633552985-df8429e8048b', 1200),
  venue: u('1519225421980-715cb0215aed', 1200),
  hotel1: u('1566073771259-6a8506099945', 1000),
  hotel2: u('1542314831-068cd1dbfeeb', 1000),
  hotel3: u('1551882547-ff40c63fe5fa', 1000),
}

export const STOCK_LIBRARY: { src: string; label: string }[] = [
  { src: STOCK.hero1, label: 'Çift' },
  { src: STOCK.hero2, label: 'Tören' },
  { src: STOCK.hero3, label: 'Gün batımı' },
  { src: STOCK.hero4, label: 'Mekan' },
  { src: STOCK.hero5, label: 'Romantik' },
  { src: STOCK.couple1, label: 'Çift 2' },
  { src: STOCK.couple2, label: 'Çift 3' },
  { src: STOCK.couple3, label: 'Eller' },
  { src: STOCK.rings, label: 'Yüzükler' },
  { src: STOCK.bouquet, label: 'Buket' },
  { src: STOCK.flowers, label: 'Çiçekler' },
  { src: STOCK.table, label: 'Masa' },
  { src: STOCK.decor, label: 'Dekor' },
  { src: STOCK.bride2, label: 'Gelin' },
  { src: STOCK.ceremony, label: 'Seremoni' },
  { src: STOCK.venue, label: 'Salon' },
  { src: STOCK.bride, label: 'Portre K' },
  { src: STOCK.groom, label: 'Portre E' },
]

export const GALLERY_DEFAULT = [
  STOCK.couple1,
  STOCK.rings,
  STOCK.hero3,
  STOCK.bouquet,
  STOCK.couple2,
  STOCK.table,
  STOCK.couple3,
  STOCK.flowers,
]
