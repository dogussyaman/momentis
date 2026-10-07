'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Check, Copy, Instagram, MessageCircle, QrCode, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Reveal, SectionHeading, SectionShell, useSiteRender, type SectionComponentProps } from '../render/primitives'

export function ShareSection({ section, props }: SectionComponentProps) {
  const { site } = useSiteRender()
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined' || !site.slug) return
    const url = `${window.location.origin}/d/${encodeURIComponent(site.slug)}`
    setShareUrl(url)
    QRCode.toDataURL(url, {
      width: 480,
      margin: 2,
      color: { dark: site.theme.textColor, light: site.theme.backgroundColor },
    }).then(setQr).catch(() => toast.error('Davet QR kodu oluşturulamadı'))
  }, [site.slug, site.theme.backgroundColor, site.theme.textColor])

  const copyLink = async () => {
    if (!shareUrl) return false
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Davet bağlantısı kopyalandı')
      window.setTimeout(() => setCopied(false), 1800)
      return true
    } catch {
      toast.error('Bağlantı kopyalanamadı. Adres çubuğundan bağlantıyı kopyalayabilirsiniz.')
      return false
    }
  }

  const share = async () => {
    if (!shareUrl) return
    if (!navigator.share) {
      await copyLink()
      return
    }
    try {
      await navigator.share({ title: site.title, text: 'Düğün davetiyemize göz atın.', url: shareUrl })
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') toast.error('Davet paylaşılamadı')
    }
  }

  const shareWhatsApp = () => {
    if (!shareUrl) return
    const text = `Düğün davetiyemize göz atın: ${shareUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  const shareInstagram = async () => {
    const instagramTab = window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer')
    const copiedLink = await copyLink()
    if (!copiedLink) {
      instagramTab?.close()
      return
    }
    toast.info('Bağlantı kopyalandı. Instagram hikâyenize veya mesajınıza ekleyebilirsiniz.')
  }

  return (
    <SectionShell section={section}>
      <SectionHeading eyebrow={props.eyebrow} title={props.title} subtitle={props.subtitle} />
      <div className={cn('grid items-stretch gap-6', props.showQr !== false && '@3xl:grid-cols-[minmax(0,1fr)_280px]')}>
        <Reveal className="sb-card flex flex-col justify-center gap-6 p-6 text-left shadow-lg @2xl:p-9">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl sb-bg-accent text-white"><Share2 className="h-5 w-5" /></span>
            <div>
              <h3 className="sb-heading text-xl">Davetiyeyi paylaşın</h3>
              <p className="mt-1 text-xs sb-muted">Sevdikleriniz davet ve etkinlik bilgilerine kolayca ulaşsın.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={share} className="h-11 rounded-full sb-bg-accent px-5 text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90">
              <Share2 className="mr-2 h-4 w-4" /> Paylaş
            </Button>
            {props.showWhatsapp !== false && (
              <Button type="button" variant="outline" onClick={shareWhatsApp} className="h-11 rounded-full border-current/15 px-5 transition hover:-translate-y-0.5">
                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
              </Button>
            )}
            {props.showInstagram !== false && (
              <Button type="button" variant="outline" onClick={shareInstagram} className="h-11 rounded-full border-current/15 px-5 transition hover:-translate-y-0.5">
                <Instagram className="mr-2 h-4 w-4" /> Instagram
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={copyLink} className="h-11 rounded-full px-4">
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              Bağlantıyı kopyala
            </Button>
          </div>
          <p className="break-all rounded-xl bg-black/[0.035] px-4 py-3 font-mono text-[10px] sb-muted">{shareUrl || 'Davet bağlantısı hazırlanıyor…'}</p>
        </Reveal>
        {props.showQr !== false && (
          <Reveal className="sb-card flex flex-col items-center justify-center gap-3 p-6 text-center shadow-lg">
            {qr ? (
              <a href={qr} download={`${site.slug || 'davet'}-qr.png`} aria-label="Davet QR kodunu indir">
                <img src={qr} alt="Davet sayfası QR kodu" className="h-40 w-40 rounded-xl border border-current/10 bg-white p-2 transition hover:scale-[1.03]" />
              </a>
            ) : <QrCode className="h-12 w-12 opacity-40" />}
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] sb-muted">{props.qrLabel || 'Davetiyeyi QR ile aç'}</p>
            <p className="text-[10px] sb-muted">İndirmek için QR koduna dokunun.</p>
          </Reveal>
        )}
      </div>
    </SectionShell>
  )
}
