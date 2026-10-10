export const COMPONENT_REGISTRY = {
  hero: { name: 'Hero', category: 'Giriş', defaults: 'hero' },
  couple: { name: 'Çift', category: 'İçerik', defaults: 'couple' },
  story: { name: 'Hikâye', category: 'İçerik', defaults: 'story' },
  event: { name: 'Etkinlik', category: 'Etkinlik', defaults: 'event' },
  gallery: { name: 'Galeri', category: 'İçerik', defaults: 'gallery' },
  rsvp: { name: 'RSVP', category: 'Etkileşim', defaults: 'rsvp' },
  footer: { name: 'Alt bilgi', category: 'Düzen', defaults: 'footer' },
} as const

export type ComponentRegistryKey = keyof typeof COMPONENT_REGISTRY

export function getComponentDefinition(type: string) {
  return COMPONENT_REGISTRY[type as ComponentRegistryKey] ?? COMPONENT_REGISTRY.hero
}
