// Core taxonomy for every event_project in MOMENTIS.
export const EVENT_TYPES = [
  { id: 'dugun', label: 'Düğün', description: 'Nikâh, tören ve resepsiyon davetleri', greeting: 'Düğünümüze Davetlisiniz' },
  { id: 'nisan', label: 'Nişan', description: 'Nişan töreni ve kutlama davetleri', greeting: 'Nişanımıza Davetlisiniz' },
  { id: 'soz', label: 'Söz', description: 'Samimi söz kesimi buluşmaları', greeting: 'Söz Törenimize Davetlisiniz' },
  { id: 'kina', label: 'Kına Gecesi', description: 'Geleneksel ve modern kına geceleri', greeting: 'Kına Gecemize Davetlisiniz' },
  { id: 'dogum-gunu', label: 'Doğum Günü', description: 'Zarif doğum günü kutlamaları', greeting: 'Doğum Günü Kutlamasına Davetlisiniz' },
  { id: 'baby-shower', label: 'Baby Shower', description: 'Bebek bekleme partileri', greeting: 'Baby Shower Partimize Davetlisiniz' },
  { id: 'kurumsal', label: 'Kurumsal', description: 'Gala, lansman ve kurumsal davetler', greeting: 'Etkinliğimize Davetlisiniz' },
]

export const TEMPLATE_STYLES = [
  { id: 'klasik', label: 'Klasik' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'botanik', label: 'Botanik' },
  { id: 'modern', label: 'Modern' },
  { id: 'luks', label: 'Lüks' },
]

export function getEventType(id) {
  return EVENT_TYPES.find((e) => e.id === id)
}

export function getStyle(id) {
  return TEMPLATE_STYLES.find((s) => s.id === id)
}
