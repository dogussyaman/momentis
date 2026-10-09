import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeEventProject, syncEventDataFromForm } from './event-normalize'
import { syncEventTokens, syncSiteEventData } from './event-tokens'
import { buildProjectDoc } from '../projects.js'

test('syncEventDataFromForm updates the canonical event details', () => {
  const previous = {
    couple: { bride: 'Ayşe Yılmaz', groom: 'Mehmet Demir' },
    family: { brideMother: 'Aylin Yılmaz' },
    date: '2027-06-12',
  }

  const next = syncEventDataFromForm({
    event_type: 'dugun',
    host_a: 'Deniz Korkmaz',
    host_b: 'Mert Arslan',
    bride_mother: 'Aylin Korkmaz',
    title: 'Deniz & Mert',
    date: '2027-07-18',
    time: '17:00',
    venue: 'Sahil Bahçesi',
    address: 'İskele Caddesi',
    city: 'İzmir',
  }, previous)

  assert.deepEqual(next.couple, { bride: 'Deniz Korkmaz', groom: 'Mert Arslan' })
  assert.deepEqual(next.family, { brideMother: 'Aylin Korkmaz' })
  assert.equal(next.date, '2027-07-18')
  assert.equal(next.venue, 'Sahil Bahçesi')
})

test('missing deliverable metadata is inferred from saved output instead of enabling everything', () => {
  const normalized = normalizeEventProject({
    event_data: { couple: { bride: 'Deniz', groom: 'Mert' } },
    site_data: { sections: [] },
    canvas_design: null,
    published: false,
  })

  assert.equal(normalized.deliverables.site.enabled, true)
  assert.equal(normalized.deliverables.invitation.enabled, false)
})

test('new drafts without saved outputs infer both deliverables as disabled', () => {
  const normalized = normalizeEventProject({
    event_data: { couple: { bride: 'Deniz', groom: 'Mert' } },
    site_data: null,
    canvas_design: null,
    published: false,
  })

  assert.equal(normalized.deliverables.site.enabled, false)
  assert.equal(normalized.deliverables.invitation.enabled, false)
})

test('new project documents are unpublished and keep premium albums disabled by default', () => {
  const project = buildProjectDoc('user-1', {
    event_type: 'dugun',
    host_a: 'Deniz',
    host_b: 'Mert',
    date: '2027-07-18',
  }, 'deniz-mert')

  assert.equal(project.published, false)
  assert.equal(project.album_enabled, false)
})

test('syncEventTokens updates template tokens and previously resolved text', () => {
  const previous = {
    couple: { bride: 'Ayşe Yılmaz', groom: 'Mehmet Demir' },
  }
  const next = {
    couple: { bride: 'Deniz Korkmaz', groom: 'Mert Arslan' },
  }

  const synced = syncEventTokens({
    title: '{{coupleNames}}',
    footer: 'Sevgiyle, Ayşe Yılmaz & Mehmet Demir',
  }, previous, next)

  assert.equal(synced.title, 'Deniz Korkmaz & Mert Arslan')
  assert.equal(synced.footer, 'Sevgiyle, Deniz Korkmaz & Mert Arslan')
})

test('syncSiteEventData replaces template demo details with event details', () => {
  const site = {
    settings: {},
    sections: [
      {
        type: 'hero',
        props: { title: 'Ayşe & Mehmet', date: '12 Haziran 2027 · İstanbul' },
      },
      {
        type: 'event',
        props: {
          events: [
            { id: 'event-1', name: 'Nikah Töreni', venue: 'Feriye Sarayı', note: 'Tören bahçede gerçekleşecektir.' },
            { id: 'event-2', name: 'Düğün Yemeği', venue: 'Feriye Sarayı' },
          ],
        },
      },
      {
        type: 'schedule',
        props: {
          items: [{ id: 'schedule-1', time: '17:00', title: 'Karşılama', desc: 'Hoş geldin içecekleri' }],
        },
      },
    ],
  }
  const eventData = {
    couple: { bride: 'Deniz Korkmaz', groom: 'Mert Arslan' },
    date: '2027-07-18',
    time: '19:30',
    venue: 'Sahil Bahçesi',
    address: 'İskele Caddesi',
    city: 'İzmir',
    eventTypeLabel: 'Düğün',
    program: [],
  }

  const synced = syncSiteEventData(site, null, eventData)

  assert.equal(synced.sections[0].props.title, 'Deniz Korkmaz & Mert Arslan')
  assert.equal(synced.sections[0].props.date, 'Pazar, 18 Temmuz 2027 · İzmir')
  assert.equal(synced.sections[1].props.events.length, 1)
  assert.equal(synced.sections[1].props.events[0].venue, 'Sahil Bahçesi')
  assert.equal(synced.sections[1].props.events[0].note, '')
  assert.equal(synced.sections[2].props.items[0].title, 'Düğün')
  assert.equal(synced.settings.brideName, 'Deniz Korkmaz')
})

test('syncSiteEventData hydrates event and schedule sections that start empty', () => {
  const site = {
    settings: {},
    sections: [
      { type: 'event', props: { events: [] } },
      { type: 'schedule', props: { items: [] } },
    ],
  }
  const eventData = {
    date: '2027-07-18',
    time: '19:30',
    venue: 'Sahil Bahçesi',
    address: 'İskele Caddesi',
    city: 'İzmir',
    eventTypeLabel: 'Düğün',
    program: [{ title: 'Karşılama', time: '19:00', note: 'Bahçe girişi' }],
  }

  const synced = syncSiteEventData(site, null, eventData)

  assert.equal(synced.sections[0].props.events.length, 1)
  assert.equal(synced.sections[0].props.events[0].name, 'Karşılama')
  assert.equal(synced.sections[0].props.events[0].date, '2027-07-18T19:00')
  assert.equal(synced.sections[0].props.events[0].venue, 'Sahil Bahçesi')
  assert.equal(synced.sections[1].props.items[0].title, 'Karşılama')
  assert.equal(synced.sections[1].props.items[0].time, '19:00')
})
