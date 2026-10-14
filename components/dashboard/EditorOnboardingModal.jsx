'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import Stepper, { Step } from '@/components/ui/Stepper'
import {
  Globe,
  Palette,
  Users,
  Share2,
  Sparkles,
  Layers,
  Smartphone,
  RefreshCw,
  Clock,
  QrCode,
  CheckCircle2,
  Check
} from 'lucide-react'

export function EditorOnboardingModal({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[calc(100dvh-2rem)] overflow-hidden flex flex-col rounded-[28px] border-midnight/10 bg-[#faf8f5] p-0 shadow-2xl">
        <DialogTitle className="sr-only">MOMENTIS Stüdyo Kullanım Rehberi</DialogTitle>

        <div className="flex flex-col max-h-[calc(100dvh-2rem)] p-4 sm:p-6 overflow-hidden">
          <div className="shrink-0 mb-3 sm:mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-midnight/10 pb-3 pr-7 sm:pr-0">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-midnight text-[#e7c98f]">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3 className="font-serif text-base sm:text-lg font-medium text-midnight truncate">MOMENTIS Stüdyo Rehberi</h3>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">Etkinlik web siteniz ve davetiyeniz için adım adım rehber</p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-champagne/30 px-2.5 py-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-midnight">
              5 Adımda Rehber
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <Stepper
              initialStep={1}
              theme="light"
              indicator="numbers"
              orientation="horizontal"
              transition="slide"
              frame={false}
              backButtonText="Önceki"
              nextButtonText="İlerle"
              completeButtonText="Anladım, Başlayalım"
              onFinalStepCompleted={() => onOpenChange(false)}
              contentClassName="py-2"
              footerClassName="flex-wrap gap-2"
            >
            {/* ── ADIM 1: GENEL BAKIŞ ── */}
            <Step title="Başlangıç" description="Genel bakış">
              <div className="space-y-3.5 py-1 text-midnight">
                <div className="rounded-2xl bg-white p-4 shadow-sm border border-midnight/5">
                  <h4 className="font-serif text-base font-medium">Stüdyo Nasıl Çalışır?</h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    MOMENTIS Stüdyo, etkinliğinizin <strong>web sitesini</strong> ve <strong>dijital davetiyesini</strong> tek bir panelde birbiriyle tam senkronize olarak tasarlamanızı sağlar.
                  </p>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-3">
                  <div className="rounded-2xl border border-midnight/5 bg-white/80 p-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-champagne/20 text-midnight">
                      <Globe className="h-3.5 w-3.5" />
                    </span>
                    <p className="mt-2 text-xs font-semibold">Web Sitesi</p>
                    <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                      Program, harita, galeri ve RSVP içeren tam kapsamlı davet sitesi.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-midnight/5 bg-white/80 p-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-champagne/20 text-midnight">
                      <Palette className="h-3.5 w-3.5" />
                    </span>
                    <p className="mt-2 text-xs font-semibold">Dijital Davetiye</p>
                    <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                      WhatsApp ve sosyal medyada paylaşabileceğiniz estetik kart tasarımı.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-midnight/5 bg-white/80 p-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-champagne/20 text-midnight">
                      <RefreshCw className="h-3.5 w-3.5" />
                    </span>
                    <p className="mt-2 text-xs font-semibold">Eşzamanlılık</p>
                    <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                      Tarih, mekan ve çift isimleri her iki tasarımda tek tıkla senkronize olur.
                    </p>
                  </div>
                </div>
              </div>
            </Step>

            {/* ── ADIM 2: WEB SİTESİ EDİTÖRÜ ── */}
            <Step title="Web Sitesi" description="Nasıl düzenlenir?">
              <div className="space-y-3.5 py-1 text-midnight">
                <div className="rounded-2xl bg-white p-4 shadow-sm border border-midnight/5">
                  <h4 className="font-serif text-base font-medium">Web Sitesi Düzenleyici (Site Editor)</h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Siteniz modüler bloklardan oluşur. Dilediğiniz bloğu açıp kapatabilir ve içeriklerini doğrudan düzenleyebilirsiniz.
                  </p>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  <div className="flex gap-3 rounded-2xl border border-midnight/5 bg-white/80 p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-midnight text-white text-xs font-bold">1</span>
                    <div>
                      <p className="text-xs font-semibold">Tıklayarak Düzenleme</p>
                      <p className="mt-0.5 text-[11px] leading-normal text-muted-foreground">
                        Önizlemedeki herhangi bir başlığa veya metne tıklayarak doğrudan yazısını güncelleyebilirsiniz.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-2xl border border-midnight/5 bg-white/80 p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-midnight text-white text-xs font-bold">2</span>
                    <div>
                      <p className="text-xs font-semibold">Bölümler & Katmanlar</p>
                      <p className="mt-0.5 text-[11px] leading-normal text-muted-foreground">
                        Sol menüden Hikayemiz, Program, Geri Sayım ve Galeri bloklarını sıralayabilir veya gizleyebilirsiniz.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-2xl border border-midnight/5 bg-white/80 p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-midnight text-white text-xs font-bold">3</span>
                    <div>
                      <p className="text-xs font-semibold">Tema & Renk Paleti</p>
                      <p className="mt-0.5 text-[11px] leading-normal text-muted-foreground">
                        Tema panelinden altın, adaçayı, pudra veya monokrom renkleri tek tıkla uygulayabilirsiniz.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-2xl border border-midnight/5 bg-white/80 p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-midnight text-white text-xs font-bold">4</span>
                    <div>
                      <p className="text-xs font-semibold">Cihaz Önizlemeleri</p>
                      <p className="mt-0.5 text-[11px] leading-normal text-muted-foreground">
                        Üst bardan mobil, tablet ve masaüstü modlarına geçerek görünümü test edebilirsiniz.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Step>

            {/* ── ADIM 3: DİJİTAL DAVETİYE ── */}
            <Step title="Davetiye" description="Kanvas kullanımı">
              <div className="space-y-3.5 py-1 text-midnight">
                <div className="rounded-2xl bg-white p-4 shadow-sm border border-midnight/5">
                  <h4 className="font-serif text-base font-medium">Dijital Davetiye (Kanvas Tasarımı)</h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Telefon ekranlarına tam uyumlu dikey davetiye görselinizi kanvas üzerinde özgürce düzenleyebilirsiniz.
                  </p>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-3">
                  <div className="rounded-2xl border border-midnight/5 bg-white/80 p-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-champagne/20 text-midnight">
                      <RefreshCw className="h-3.5 w-3.5" />
                    </span>
                    <p className="mt-2 text-xs font-semibold">Otomatik Aktarım</p>
                    <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                      "Bilgileri davetiyeye uygula" butonuyla tarih, saat ve salon bilgileri karta yerleşir.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-midnight/5 bg-white/80 p-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-champagne/20 text-midnight">
                      <Palette className="h-3.5 w-3.5" />
                    </span>
                    <p className="mt-2 text-xs font-semibold">Yazı & Font Ayarı</p>
                    <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                      Herhangi bir metin kutusunu taşıyabilir, font ailesini ve rengini değiştirebilirsiniz.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-midnight/5 bg-white/80 p-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-champagne/20 text-midnight">
                      <Share2 className="h-3.5 w-3.5" />
                    </span>
                    <p className="mt-2 text-xs font-semibold">İndir & Paylaş</p>
                    <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                      Tasarımınızı yüksek çözünürlüklü dijital kart olarak indirip WhatsApp'tan gönderebilirsiniz.
                    </p>
                  </div>
                </div>
              </div>
            </Step>

            {/* ── ADIM 4: LCV / RSVP ── */}
            <Step title="RSVP" description="Misafir takibi">
              <div className="space-y-3.5 py-1 text-midnight">
                <div className="rounded-2xl bg-white p-4 shadow-sm border border-midnight/5">
                  <h4 className="font-serif text-base font-medium">LCV (RSVP) & Misafir Yönetimi</h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Kimin geleceğini, kaç kişi katıldıklarını ve menü tercihlerini telefon trafiğine girmeden anlık toplayın.
                  </p>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  <div className="flex gap-3 rounded-2xl border border-midnight/5 bg-white/80 p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold">Anlık Dijital Form</p>
                      <p className="mt-0.5 text-[11px] leading-normal text-muted-foreground">
                        Davetliler web sitenizden tek tıkla katılım durumunu (Katılıyorum / Katılamıyorum) bildirir.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-2xl border border-midnight/5 bg-white/80 p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                      <Users className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold">Özel Tercihler & Notlar</p>
                      <p className="mt-0.5 text-[11px] leading-normal text-muted-foreground">
                        Kişi sayısı, vejetaryen/özel menü talepleri ve misafir dilekleri panele anında düşer.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Step>

            {/* ── ADIM 5: YAYINLAMA & PAYLAŞIM ── */}
            <Step title="Yayınlama" description="Paylaşım & QR">
              <div className="space-y-3.5 py-1 text-midnight">
                <div className="rounded-2xl bg-white p-4 shadow-sm border border-midnight/5">
                  <h4 className="font-serif text-base font-medium">Yayına Alma ve Paylaşım</h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Tasarımınızı ilk kez "Kaydet" butonuna bastığınızda etkinliğiniz oluşturulur ve anında yayına açılır.
                  </p>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-3">
                  <div className="rounded-2xl border border-midnight/5 bg-white/80 p-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-champagne/20 text-midnight">
                      <Share2 className="h-3.5 w-3.5" />
                    </span>
                    <p className="mt-2 text-xs font-semibold">Özel Bağlantı</p>
                    <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                      Size özel kısa bağlantıyı SMS ve mesajlaşma gruplarında paylaşın.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-midnight/5 bg-white/80 p-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-champagne/20 text-midnight">
                      <QrCode className="h-3.5 w-3.5" />
                    </span>
                    <p className="mt-2 text-xs font-semibold">Masa QR Kodu</p>
                    <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                      Düğün salonundaki masalara konabilecek QR kodu indirip doğrudan kullanın.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-midnight/5 bg-white/80 p-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-champagne/20 text-midnight">
                      <Clock className="h-3.5 w-3.5" />
                    </span>
                    <p className="mt-2 text-xs font-semibold">Sürekli Düzenleme</p>
                    <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                      Etkinlik gününe kadar dilediğiniz zaman panodan bilgileri revize edebilirsiniz.
                    </p>
                  </div>
                </div>
              </div>
            </Step>
          </Stepper>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
