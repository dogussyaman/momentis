import { EVENT_CONFIG } from '@/lib/events/event-config'
import { flattenEventData } from '@/lib/events/event-normalize'

export const NEW_PROJECT_DRAFT_KEY = 'momentis-new-project-draft'

export function createProjectDraft(eventType, eventData, deliverables) {
  const structuredData = {
    couple: { bride: eventData.brideName || '', groom: eventData.groomName || '' },
    family: {
      brideMother: eventData.brideMother || '',
      brideFather: eventData.brideFather || '',
      groomMother: eventData.groomMother || '',
      groomFather: eventData.groomFather || '',
    },
    celebrant: { name: eventData.celebrantName || '', age: eventData.age || '' },
    baby: { name: eventData.babyName || '', parents: eventData.parentNames || '' },
    company: { name: eventData.companyName || '' },
    contact: {
      name: eventData.contactName || eventData.hostName || '',
      phone: eventData.contactPhone || '',
      email: eventData.contactEmail || '',
    },
    eventTitle: eventData.eventTitle || '',
    date: eventData.date || '',
    time: eventData.time || '',
    venue: eventData.venue || '',
    address: eventData.address || '',
    city: eventData.city || '',
    story: eventData.story || '',
    dressCode: eventData.dressCode || '',
    rsvpDeadline: eventData.rsvpDeadline || '',
  }
  const enabled = {
    site: Boolean(deliverables?.site?.enabled ?? deliverables?.site ?? false),
    invitation: Boolean(deliverables?.invitation?.enabled ?? deliverables?.invitation ?? false),
  }

  return {
    ...flattenEventData(structuredData),
    ...(structuredData.eventTitle ? { title: structuredData.eventTitle } : {}),
    event_data: { ...structuredData, eventTypeLabel: EVENT_CONFIG[eventType]?.label || 'Etkinlik' },
    event_type: eventType,
    deliverables: {
      site: { enabled: enabled.site, status: enabled.site ? 'draft' : 'disabled' },
      invitation: { enabled: enabled.invitation, status: enabled.invitation ? 'draft' : 'disabled' },
    },
    published: false,
  }
}
