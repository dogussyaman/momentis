import type { VipDesignRequest, VipDesignRequestPayload, VipInvitationTemplate, VipRequestStatus, VipSiteTemplate } from './types'

export const VIP_REQUEST_STORAGE_KEY: string
export function listVipSiteTemplates(): Promise<VipSiteTemplate[]>
export function getVipSiteTemplate(idOrSlug: string): Promise<VipSiteTemplate | null>
export function listVipInvitationTemplates(): Promise<VipInvitationTemplate[]>
export function getVipDesignRequestFormOptions(): Promise<{ eventTypes: string[]; styles: string[]; sections: string[] }>
export function createVipDesignRequest(payload: VipDesignRequestPayload): Promise<VipDesignRequest>
export function listMyVipDesignRequests(userId: string): Promise<VipDesignRequest[]>
export function getMyVipDesignRequest(requestId: string, userId: string): Promise<VipDesignRequest | null>
export function listAdminVipDesignRequests(filters?: { status?: VipRequestStatus | 'all'; query?: string }): Promise<VipDesignRequest[]>
export function getAdminVipDesignRequest(requestId: string): Promise<VipDesignRequest | null>
export function updateMockVipRequestStatus(requestId: string, status: VipRequestStatus, note?: string): Promise<VipDesignRequest>
