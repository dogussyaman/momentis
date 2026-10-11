'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Crown, Gift, LoaderCircle, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { InvitationPreview } from './InvitationPreview'
import {
  getEligibleTemplates,
  getSelectionStatus,
  selectTemplate,
} from '@/lib/site-gift-campaign/mock-service.mjs'

type GiftTemplate = {
  id: string
  title: string
  description: string
  styleTags: string[]
  premium: boolean
  preview: { background: string; foreground: string; accent: string; secondary: string; ornament: string }
}

type Eligibility = {
  campaignId: string
  eligibilityStatus: 'eligible' | 'not_eligible'
  siteEntitlementId: string | null
  includedInvitationCount: number
  eligibleTemplateIds: string[]
  selectedTemplateId: string | null
  selectionStatus: 'available' | 'selected' | 'unavailable'
  mode: string
}

type LoadState = 'loading' | 'ready' | 'error'

const campaignTitle = 'Site Alımına Özel Hediyen'
const isMockEnabled = process.env.NEXT_PUBLIC_SITE_GIFT_CAMPAIGN_MOCK === 'true'

function resolveReturnTo(value: string | null) {
  return value?.startsWith('/panel/') && !value.startsWith('//') ? value : '/panel'
}

export function SiteGiftCampaign() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const siteEntitlementId = searchParams.get('siteEntitlementId') || ''
  const returnTo = resolveReturnTo(searchParams.get('returnTo'))
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [eligibility, setEligibility] = useState<Eligibility | null>(null)
  const [templates, setTemplates] = useState<GiftTemplate[]>([])
  const [error, setError] = useState('')
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [selecting, setSelecting] = useState(false)

  const load = useCallback(async () => {
    if (!isMockEnabled) {
      setEligibility(null)
      setTemplates([])
      setLoadState('ready')
      return
    }
    setLoadState('loading')
    setError('')
    try {
      const status = await getSelectionStatus(siteEntitlementId) as Eligibility
      setEligibility(status)
      const eligibleTemplates = await getEligibleTemplates(siteEntitlementId) as GiftTemplate[]
      setTemplates(eligibleTemplates)
      setLoadState('ready')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Kampanya bilgileri alınamadı.')
      setLoadState('error')
    }
  }, [siteEntitlementId])

  useEffect(() => { void load() }, [load])

  const chosenTemplate = useMemo(
    () => templates.find((template) => template.id === eligibility?.selectedTemplateId) || null,
    [templates, eligibility?.selectedTemplateId],
  )
  const previewTemplate = templates.find((template) => template.id === previewId) || null
  const confirmationTemplate = templates.find((template) => template.id === confirmId) || null
  const locked = eligibility?.selectionStatus === 'selected'

  const confirmSelection = async () => {
    if (!confirmationTemplate || !eligibility?.siteEntitlementId) return
    setSelecting(true)
    setError('')
    try {
      const selected = await selectTemplate(confirmationTemplate.id, eligibility.siteEntitlementId) as Eligibility
      setEligibility(selected)
      setConfirmId(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Seçim kaydedilemedi.')
      await load()
    } finally {
      setSelecting(false)
    }
  }

  const startEditing = () => {
    if (!chosenTemplate || !eligibility?.siteEntitlementId) return
    const query = new URLSearchParams({
      mode: 'card',
      new: '1',
      giftTemplateId: chosenTemplate.id,
      siteEntitlementId: eligibility.siteEntitlementId,
    })
    router.push(`/panel/etkinlik/new/duzenle?${query.toString()}`)
  }

  return (
    <main className="min-h-dvh bg-[#f7f4ee] px-4 py-8 text-[#172033] sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <Button type="button" variant="ghost" onClick={() => router.push(returnTo)} className="mb-6 -ml-3 text-xs text-[#77746f]">
          <ArrowLeft className="mr-2 h-4 w-4" /> Önceki adıma dön
        </Button>

        <header className="mx-auto mb-9 max-w-2xl text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e6dac4] bg-white text-[#a28453] shadow-sm">
            <Gift className="h-5 w-5" />
          </div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#a28453]">Momentis · Demo kampanya</p>
          <h1 className="font-serif text-3xl sm:text-4xl">{campaignTitle}</h1>
          <p className="mt-3 text-sm text-[#77746f]">5 premium davetiye tasarımından birini ücretsiz seç.</p>
          <p className="mt-2 text-xs text-[#77746f]">1 ücretsiz seçim hakkı · Seçmeden önce tasarımları inceleyebilirsin.</p>
          <div className="mx-auto mt-4 max-w-2xl rounded-xl border border-[#e5d7bc] bg-[#f1eadc] px-4 py-3 text-left text-[11px] leading-relaxed text-[#645947]" role="note">
            Bu ekran demo verisiyle çalışır. Gerçek satın alma, ödeme veya kalıcı hak tanımlaması yapılmaz. Onaylanan demo seçim değiştirilemez.
          </div>
        </header>

        {loadState === 'loading' && (
          <div role="status" className="flex items-center justify-center gap-2 rounded-2xl border border-[#e5ded2] bg-white p-10 text-sm text-[#77746f]">
            <LoaderCircle className="h-4 w-4 animate-spin" /> Kampanya hakkın kontrol ediliyor…
          </div>
        )}

        {loadState === 'error' && (
          <section className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-6 text-center" role="alert">
            <p className="text-sm text-red-700">{error}</p>
            <Button type="button" variant="outline" onClick={() => void load()} className="mt-4 rounded-xl">Tekrar dene</Button>
          </section>
        )}

        {loadState === 'ready' && eligibility?.eligibilityStatus !== 'eligible' && (
          <section className="mx-auto max-w-xl rounded-2xl border border-[#e5ded2] bg-white p-6 text-center">
            <p className="font-medium">{isMockEnabled ? 'Bu demo oturumunda tanımlı bir site hakkı bulunamadı.' : 'Demo kampanya şu anda kapalı.'}</p>
            <p className="mt-2 text-xs leading-5 text-[#77746f]">{isMockEnabled ? 'Kampanya ekranını site stüdyosundaki demo girişinden açarak örnek hakkı oluşturabilirsin.' : 'Bu ekran yalnızca NEXT_PUBLIC_SITE_GIFT_CAMPAIGN_MOCK etkinleştirildiğinde kullanılabilir.'}</p>
            <Button type="button" variant="outline" onClick={() => router.push(returnTo)} className="mt-5 rounded-xl">Site stüdyosuna dön</Button>
          </section>
        )}

        {loadState === 'ready' && eligibility?.eligibilityStatus === 'eligible' && templates.length === 0 && (
          <section className="mx-auto max-w-xl rounded-2xl border border-dashed border-[#ddd1c2] bg-white p-8 text-center text-sm text-[#77746f]">
            Bu kampanya için şu anda uygun tasarım bulunamadı.
          </section>
        )}

        {loadState === 'ready' && eligibility?.eligibilityStatus === 'eligible' && templates.length > 0 && (
          <>
            {locked && chosenTemplate ? (
              <section className="mx-auto grid max-w-4xl items-center gap-7 rounded-3xl border border-[#e5ded2] bg-white p-5 shadow-sm sm:grid-cols-[minmax(220px,300px)_1fr] sm:p-8" aria-live="polite">
                <InvitationPreview theme={chosenTemplate.preview} title={chosenTemplate.title} />
                <div>
                  <Badge variant="default" className="border-0 bg-[#ead9b6] text-[#172033] hover:bg-[#ead9b6]"><Check className="mr-1 h-3 w-3" /> Seçimin tamamlandı</Badge>
                  <h2 className="mt-4 font-serif text-2xl">{chosenTemplate.title}</h2>
                  <p className="mt-2 text-sm text-[#77746f]">{chosenTemplate.description}</p>
                  <p className="mt-3 text-xs text-[#77746f]">Bu demo kuralında ücretsiz seçim tek kullanımlıktır ve sonradan değiştirilemez.</p>
                  <Button type="button" onClick={startEditing} className="mt-6 h-11 w-full rounded-xl bg-[#172033] text-white hover:bg-[#25314a] sm:w-auto">
                    Davetiye Düzenlemeye Başla <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </section>
            ) : (
              <section aria-label="Ücretsiz premium davetiye tasarımları">
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#e5ded2] bg-white px-4 py-3 text-xs text-[#665b49]">
                  <Sparkles className="h-4 w-4 shrink-0 text-[#a28453]" />
                  Hakkın: 5 tasarımdan yalnızca 1 seçim. Seçimden sonra tasarım değiştirilemez.
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {templates.map((template, index) => (
                    <article key={template.id} className="group overflow-hidden rounded-2xl border border-[#e5ded2] bg-white shadow-[0_8px_30px_-24px_rgba(23,32,51,0.45)] transition hover:-translate-y-0.5 hover:shadow-lg">
                      <div className="relative bg-[#f0ece5] p-4">
                        <InvitationPreview theme={template.preview} title={template.title} compact />
                        <Badge variant="default" className="absolute right-6 top-6 border-0 bg-[#ead9b6] text-[#172033] hover:bg-[#ead9b6]"><Crown className="mr-1 h-3 w-3" /> Premium</Badge>
                        <span className="absolute bottom-6 left-6 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-medium text-[#645947]">{String(index + 1).padStart(2, '0')} · Kampanya seçkisi</span>
                      </div>
                      <div className="p-4">
                        <h2 className="font-serif text-xl">{template.title}</h2>
                        <p className="mt-1 min-h-10 text-xs leading-5 text-[#77746f]">{template.description}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {template.styleTags.map((tag) => <span key={tag} className="rounded-full bg-[#f4f0e8] px-2.5 py-1 text-[9px] text-[#6e6558]">{tag}</span>)}
                        </div>
                        <Button type="button" variant="outline" onClick={() => setPreviewId(template.id)} className="mt-4 w-full rounded-xl border-[#d9cfbf]">
                          Önizle
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewId(null)}>
          <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl border-0 bg-[#fbf8f3] sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">{previewTemplate?.title}</DialogTitle>
              <DialogDescription>{previewTemplate?.description}</DialogDescription>
            </DialogHeader>
            {previewTemplate && <InvitationPreview theme={previewTemplate.preview} title={previewTemplate.title} />}
            <div className="flex flex-wrap gap-2">
              {previewTemplate?.styleTags.map((tag) => <Badge key={tag} variant="outline" className="">{tag}</Badge>)}
              <Badge variant="default" className="border-0 bg-[#ead9b6] text-[#172033] hover:bg-[#ead9b6]">Premium · Demo seçkisi</Badge>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setPreviewId(null)} className="w-full rounded-xl sm:w-auto">Karşılaştırmaya dön</Button>
              <Button type="button" onClick={() => { setConfirmId(previewTemplate?.id || null); setPreviewId(null) }} className="w-full rounded-xl bg-[#172033] text-white hover:bg-[#25314a] sm:w-auto">
                Bu tasarımı seç
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!confirmationTemplate} onOpenChange={(open) => !open && !selecting && setConfirmId(null)}>
          <DialogContent className="rounded-2xl border-0 bg-[#fbf8f3]">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Bu ücretsiz seçimi onaylıyor musun?</DialogTitle>
              <DialogDescription>
                {confirmationTemplate?.title} seçilecek. Demo kuralında seçim kesinleşince değiştirilemez ve ikinci ücretsiz seçim yapılamaz.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" disabled={selecting} onClick={() => setConfirmId(null)} className="rounded-xl">Vazgeç</Button>
              <Button type="button" disabled={selecting} onClick={() => void confirmSelection()} className="rounded-xl bg-[#172033] text-white hover:bg-[#25314a]">
                {selecting ? 'Seçim kaydediliyor…' : 'Bu davetiyeyi ücretsiz seç'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {error && loadState === 'ready' && <p className="mt-4 text-center text-xs text-red-700" role="alert">{error}</p>}
      </div>
    </main>
  )
}
