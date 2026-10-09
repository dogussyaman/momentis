import { formatEventDate } from '@/lib/projects'

export const EVENT_TOKENS = [
  '{{brideName}}',
  '{{groomName}}',
  '{{coupleNames}}',
  '{{eventDate}}',
  '{{eventTime}}',
  '{{venueName}}',
  '{{venueAddress}}',
  '{{city}}',
  '{{brideMother}}',
  '{{brideFather}}',
  '{{groomMother}}',
  '{{groomFather}}',
  '{{eventTypeLabel}}'
]

// Extract the value for a specific token from the canonical event data
export function getStoredTokenValue(token, eventData, eventTypeLabel = 'Etkinlik') {
  if (!eventData) return ''

  switch (token) {
    case '{{brideName}}':
      return eventData.couple?.bride || eventData.celebrant?.name || eventData.baby?.parents || eventData.company?.name || ''
    case '{{groomName}}':
      return eventData.couple?.groom || ''
    case '{{coupleNames}}': {
      const b = eventData.couple?.bride || eventData.celebrant?.name || eventData.baby?.parents || eventData.company?.name
      const g = eventData.couple?.groom
      return [b, g].filter(Boolean).join(' & ')
    }
    case '{{eventDate}}':
      return formatEventDate(eventData.date, null) || ''
    case '{{eventTime}}':
      return eventData.time || ''
    case '{{venueName}}':
      return eventData.venue || ''
    case '{{venueAddress}}':
      return eventData.address || ''
    case '{{city}}':
      return eventData.city || ''
    case '{{brideMother}}':
      return eventData.family?.brideMother || ''
    case '{{brideFather}}':
      return eventData.family?.brideFather || ''
    case '{{groomMother}}':
      return eventData.family?.groomMother || ''
    case '{{groomFather}}':
      return eventData.family?.groomFather || ''
    case '{{eventTypeLabel}}':
      return eventTypeLabel
    default:
      return ''
  }
}

// Replace all tokens in a text string
export function resolveTokens(text, eventData, eventTypeLabel = eventData?.eventTypeLabel || 'Etkinlik') {
  if (typeof text !== 'string') return text
  let result = text
  for (const token of EVENT_TOKENS) {
    if (result.includes(token)) {
      const value = getStoredTokenValue(token, eventData, eventTypeLabel)
      result = result.split(token).join(value)
    }
  }
  return result
}

export function syncEventTokens(content, previousData, nextData) {
  const replacements = EVENT_TOKENS
    .map((token) => ({
      token,
      previous: getStoredTokenValue(token, previousData, previousData?.eventTypeLabel || 'Etkinlik'),
      next: getStoredTokenValue(token, nextData, nextData?.eventTypeLabel || 'Etkinlik'),
    }))
    .sort((a, b) => b.previous.length - a.previous.length)
  const dateWithCity = (data) => [
    getStoredTokenValue('{{eventDate}}', data),
    data?.city,
  ].filter(Boolean).join(' · ')
  const brideParents = [
    dataValue(nextData?.family?.brideMother),
    dataValue(nextData?.family?.brideFather),
  ].filter(Boolean).join(' & ')
  const groomParents = [
    dataValue(nextData?.family?.groomMother),
    dataValue(nextData?.family?.groomFather),
  ].filter(Boolean).join(' & ')
  const demoReplacements = [
    { previous: 'Ayşe & Mehmet', next: getStoredTokenValue('{{coupleNames}}', nextData) },
    { previous: 'A & M', next: getStoredTokenValue('{{coupleNames}}', nextData) },
    { previous: 'A + M', next: getStoredTokenValue('{{coupleNames}}', nextData) },
    { previous: 'Ayşe Yılmaz', next: getStoredTokenValue('{{brideName}}', nextData) },
    { previous: 'Mehmet Demir', next: getStoredTokenValue('{{groomName}}', nextData) },
    { previous: '12 Haziran 2027 · İstanbul', next: dateWithCity(nextData) },
    { previous: '12 Haziran 2027', next: getStoredTokenValue('{{eventDate}}', nextData) },
    { previous: 'Feriye Sarayı', next: getStoredTokenValue('{{venueName}}', nextData) },
    { previous: 'Çırağan Cd. No:40, Beşiktaş, İstanbul', next: getStoredTokenValue('{{venueAddress}}', nextData) },
    { previous: 'Fatma & Ali Yılmaz’ın kızı', next: brideParents ? `${brideParents}’ın kızı` : '' },
    { previous: 'Zeynep & Hasan Demir’in oğlu', next: groomParents ? `${groomParents}’ın oğlu` : '' },
  ]
  const previousDateCity = [
    getStoredTokenValue('{{eventDate}}', previousData),
    previousData?.city,
  ].filter(Boolean).join(' · ')
  const nextDateCity = dateWithCity(nextData)
  if (previousDateCity) demoReplacements.push({ previous: previousDateCity, next: nextDateCity })
  demoReplacements.sort((a, b) => b.previous.length - a.previous.length)

  const visit = (value) => {
    if (typeof value === 'string') {
      const withTemplateValues = replacements.reduce((text, item) => {
        let result = text.split(item.token).join(item.next)
        if (item.previous && item.previous !== item.next) {
          result = result === item.previous
            ? item.next
            : item.previous.length >= 4
              ? result.split(item.previous).join(item.next)
              : result
        }
        return result
      }, value)
      return demoReplacements.reduce((text, item) => {
        if (!item.next) return text === item.previous ? '' : text
        return text === item.previous
          ? item.next
          : item.previous.length >= 4
            ? text.split(item.previous).join(item.next)
            : text
      }, withTemplateValues)
    }
    if (Array.isArray(value)) return value.map(visit)
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, visit(entry)]))
    }
    return value
  }

  return visit(content)
}

function dataValue(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function isDemoSchedule(items) {
  const demoTitles = new Set(['Karşılama', 'Nikah Töreni', 'Kokteyl', 'Yemek', 'İlk Dans & Parti'])
  return Array.isArray(items) && items.length > 0 && items.every((item) => demoTitles.has(item.title))
}

function isDemoEventList(items) {
  const demoNames = new Set(['Nikah Töreni', 'Düğün Yemeği'])
  return Array.isArray(items) && items.length > 0 && items.every((item) => demoNames.has(item.name))
}

function eventDateTime(date, time) {
  if (!date) return ''
  if (!time || date.includes('T')) return date
  return `${date.slice(0, 10)}T${time}`
}

export function syncSiteEventData(site, previousData, nextData) {
  if (!nextData) return site
  const synced = syncEventTokens(site, previousData, nextData)
  if (!synced || !Array.isArray(synced.sections)) return synced

  const eventName = nextData.eventTypeLabel || 'Etkinlik'
  const program = Array.isArray(nextData.program) ? nextData.program.filter((item) => item.title || item.time) : []

  return {
    ...synced,
    settings: {
      ...synced.settings,
      brideName: getStoredTokenValue('{{brideName}}', nextData),
      groomName: getStoredTokenValue('{{groomName}}', nextData),
      eventDate: nextData.date || '',
      venueName: nextData.venue || '',
      venueAddress: [nextData.address, nextData.city].filter(Boolean).join(', '),
      rsvpDeadline: nextData.rsvpDeadline || '',
    },
    sections: synced.sections.map((section) => {
      if (section.type === 'event' && isDemoEventList(section.props?.events)) {
        const existing = section.props.events[0]
        const events = program.length
          ? program.map((item, index) => ({
              ...(section.props.events[index] || existing),
              id: section.props.events[index]?.id || `event-${index + 1}`,
              name: item.title || eventName,
              date: eventDateTime(nextData.date, item.time || nextData.time),
              time: item.time || nextData.time || '',
              venue: nextData.venue || '',
              address: [nextData.address, nextData.city].filter(Boolean).join(', '),
              note: item.note || '',
            }))
          : [{
              ...existing,
              name: eventName,
              date: eventDateTime(nextData.date, nextData.time),
              time: nextData.time || '',
              venue: nextData.venue || '',
              address: [nextData.address, nextData.city].filter(Boolean).join(', '),
              note: '',
            }]
        return { ...section, props: { ...section.props, events } }
      }

      if (section.type === 'schedule' && isDemoSchedule(section.props?.items)) {
        const items = program.length
          ? program.map((item, index) => ({
              id: section.props.items[index]?.id || `schedule-${index + 1}`,
              time: item.time || '',
              title: item.title || eventName,
              desc: [nextData.venue, nextData.city].filter(Boolean).join(', '),
            }))
          : [{
              id: section.props.items[0]?.id || 'schedule-1',
              time: nextData.time || '',
              title: eventName,
              desc: [nextData.venue, nextData.city].filter(Boolean).join(', '),
            }]
        return { ...section, props: { ...section.props, items } }
      }

      return section
    }),
  }
}
