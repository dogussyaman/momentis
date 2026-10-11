export type VipDesignVariant = 'ivory' | 'midnight' | 'blush' | 'mono' | 'sage'

export type VipSiteTemplate = {
  id: string
  slug: string
  title: string
  description: string
  preview: { background: string; foreground: string; accent: string; surface: string }
  design: {
    variant: VipDesignVariant
    eyebrow: string
    couple: [string, string]
    date: string
    venue: string
    story: string
    sections: string[]
    layout: 'centered' | 'editorial' | 'split' | 'minimal' | 'botanical'
  }
}

export type VipInvitationTemplate = {
  id: string
  slug: string
  title: string
  description: string
  preview: { background: string; foreground: string; accent: string; ornament: string }
  design: { variant: VipDesignVariant; typography: string; layout: 'portrait' | 'editorial' | 'frame' }
}

export type VipRequestStatus = 'created' | 'reviewing' | 'preparing' | 'feedback' | 'completed'

export type VipDesignRequestPayload = {
  userId: string
  userName: string
  userEmail: string
  selectedSiteTemplateId: string
  selectedInvitationTemplateId: string
  eventDetails: {
    brideName: string
    groomName: string
    eventType: string
    date: string
    time: string
    venue: string
    address: string
    familyInfo?: string
    invitationText?: string
  }
  preferences: {
    colors: string
    style: string
    referenceNotes: string
    sections: string[]
    description: string
  }
  albumPreferences: {
    wantsAlbum: boolean
    guestPhotoSharing: boolean
  }
  uploadedPhotoMetadata: Array<{ name: string; type: string; size: number }>
}

export type VipDesignRequest = VipDesignRequestPayload & {
  id: string
  status: VipRequestStatus
  createdAt: string
  adminNotes: Array<{ note: string; createdAt: string }>
  timeline: Array<{ status: VipRequestStatus; createdAt: string; note: string }>
}
