// Migrate legacy event data fields into the new canonical event_data format.
// And flatten the new format into legacy fields if needed for backward compatibility.

export function normalizeEventProject(project: any) {
  // Preserve explicit selections; otherwise infer deliverables from saved output.
  if (project.event_data) {
    const defaults = {
      site: {
        enabled: Boolean(project.site_data || project.published),
        status: project.published ? 'published' : 'draft'
      },
      invitation: {
        enabled: Boolean(project.canvas_design),
        status: 'draft'
      }
    }

    return {
      ...project,
      deliverables: {
        site: { ...defaults.site, ...project.deliverables?.site },
        invitation: { ...defaults.invitation, ...project.deliverables?.invitation }
      }
    };
  }

  // Convert old structure to new `event_data`
  const event_data = {
    couple: {
      bride: project.host_a || '',
      groom: project.host_b || ''
    },
    family: {
      brideMother: project.bride_mother || '',
      brideFather: project.bride_father || '',
      groomMother: project.groom_mother || '',
      groomFather: project.groom_father || ''
    },
    date: project.date || '',
    time: project.time || '',
    venue: project.venue || '',
    address: project.address || '',
    city: project.city || '',
    story: project.story || '',
    dressCode: project.dress_code || '',
    rsvpDeadline: project.rsvp_deadline || '',
    program: project.program || [],
    menuOptions: project.menu_options || [],
    // Used for birthdays etc if misused in the past
    celebrant: { name: '', age: '' },
    company: { name: project.host_a || '' },
    baby: { name: '', parents: '' },
    contact: { phone: '', email: '' }
  };

  const defaults = {
    site: {
      enabled: !!project.site_data,
      status: project.published ? 'published' : (project.site_data ? 'draft' : 'disabled')
    },
    invitation: {
      enabled: !!project.canvas_design,
      status: project.canvas_design ? 'draft' : 'disabled'
    }
  }

  return {
    ...project,
    event_data,
    deliverables: {
      site: { ...defaults.site, ...project.deliverables?.site },
      invitation: { ...defaults.invitation, ...project.deliverables?.invitation }
    }
  };
}

// Convert new canonical format back to old flat fields if we need to write to an API that expects them.
export function flattenEventData(event_data: any) {
  if (!event_data) return {};
  
  return {
    host_a: event_data.couple?.bride || event_data.celebrant?.name || event_data.baby?.parents || event_data.company?.name || '',
    host_b: event_data.couple?.groom || '',
    title: event_data.eventTitle || '',
    bride_mother: event_data.family?.brideMother || '',
    bride_father: event_data.family?.brideFather || '',
    groom_mother: event_data.family?.groomMother || '',
    groom_father: event_data.family?.groomFather || '',
    date: event_data.date || '',
    time: event_data.time || '',
    venue: event_data.venue || '',
    address: event_data.address || '',
    city: event_data.city || '',
    story: event_data.story || '',
    dress_code: event_data.dressCode || '',
    rsvp_deadline: event_data.rsvpDeadline || '',
    program: event_data.program || [],
    menu_options: event_data.menuOptions || [],
  };
}

export function syncEventDataFromForm(form: any, current: any = {}) {
  const coupleEventTypes = new Set(['dugun', 'kina', 'nisan', 'soz'])
  const eventType = form.event_type
  const couple = coupleEventTypes.has(eventType)
  const birthday = eventType === 'dogum-gunu'
  const babyShower = eventType === 'baby-shower'
  const corporate = eventType === 'kurumsal'

  return {
    ...current,
    couple: {
      ...(current.couple || {}),
      bride: couple ? form.host_a || '' : '',
      groom: couple ? form.host_b || '' : '',
    },
    family: {
      ...(current.family || {}),
      brideMother: form.bride_mother || '',
      brideFather: form.bride_father || '',
      groomMother: form.groom_mother || '',
      groomFather: form.groom_father || '',
    },
    celebrant: {
      ...(current.celebrant || {}),
      name: birthday ? form.host_a || '' : '',
    },
    baby: {
      ...(current.baby || {}),
      parents: babyShower ? form.host_a || '' : '',
    },
    company: {
      ...(current.company || {}),
      name: corporate ? form.host_a || '' : '',
    },
    contact: {
      ...(current.contact || {}),
      phone: form.contact_phone ?? current.contact?.phone ?? '',
      email: form.contact_email ?? current.contact?.email ?? '',
      name: form.contact_name ?? current.contact?.name ?? '',
    },
    eventTitle: form.title ?? current.eventTitle ?? '',
    date: form.date ?? '',
    time: form.time ?? '',
    venue: form.venue ?? '',
    address: form.address ?? '',
    city: form.city ?? '',
    story: form.story ?? '',
    dressCode: form.dress_code ?? '',
    rsvpDeadline: form.rsvp_deadline ?? '',
    program: form.program ?? [],
    menuOptions: form.menu_options ?? [],
    eventTypeLabel: current.eventTypeLabel || 'Etkinlik',
  }
}
