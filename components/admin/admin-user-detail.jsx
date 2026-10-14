'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, RefreshCw, ShieldCheck, UserRoundCog } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const ROLE_LABELS = { user: 'Kullanıcı', support: 'Destek', admin: 'Admin', super_admin: 'Super admin' }
const EMPTY_DETAIL = {
  quota: { totalCredits: 0, remainingCredits: 0, grants: [], packages: [] },
  events: [], invitations: [], vipRequests: [], orders: [], creditMovements: [], relationships: {},
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString('tr-TR') : '—'
}

function Empty({ children = 'Kayıt bulunmuyor.' }) {
  return <p className="py-5 text-sm text-muted-foreground">{children}</p>
}

function Section({ title, count, children }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-xl text-midnight">{title}</h2>
        {Number.isInteger(count) && <Badge variant="outline">{count}</Badge>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

export function AdminUserDetail() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser, status: authStatus } = useAuth()
  const userId = params?.userId
  const [detail, setDetail] = useState(EMPTY_DETAIL)
  const [packages, setPackages] = useState([])
  const [name, setName] = useState('')
  const [role, setRole] = useState('user')
  const [grantPackage, setGrantPackage] = useState('')
  const [creditAmount, setCreditAmount] = useState('1')
  const [creditReason, setCreditReason] = useState('')
  const [debitAmount, setDebitAmount] = useState('')
  const [debitReason, setDebitReason] = useState('')
  const [deleteEmail, setDeleteEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [confirmAction, setConfirmAction] = useState(null)

  const load = useCallback(async () => {
    if (!userId || currentUser?.role !== 'super_admin') return
    setLoading(true)
    setError('')
    try {
      const [detailResponse, packagesResponse] = await Promise.all([
        fetch(`/api/admin/users/${encodeURIComponent(userId)}`, { credentials: 'include', cache: 'no-store' }),
        fetch('/api/admin/packages', { credentials: 'include', cache: 'no-store' }),
      ])
      const [detailData, packageData] = await Promise.all([
        detailResponse.json().catch(() => ({})),
        packagesResponse.json().catch(() => ({})),
      ])
      if (!detailResponse.ok) throw new Error(detailData.error || 'Kullanıcı bilgileri yüklenemedi')
      if (!packagesResponse.ok) throw new Error(packageData.error || 'Paketler yüklenemedi')
      setDetail(detailData)
      setName(detailData.user.name || '')
      setRole(detailData.user.role || 'user')
      const activePackages = (packageData.items || []).filter((item) => item.settings.is_active && item.eventCredits > 0)
      setPackages(activePackages)
      const nextPackage = activePackages[0]
      setGrantPackage(nextPackage?.id || '')
      setCreditAmount(String(nextPackage?.eventCredits || ''))
    } catch (loadError) {
      setError(loadError.message || 'Kullanıcı bilgileri yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [userId, currentUser?.role])

  useEffect(() => { load() }, [load])

  const mutate = async (key, url, method, body, success, headers = {}) => {
    setBusy(key)
    setError('')
    setNotice('')
    try {
      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        const relationshipCounts = data.relationships
          ? Object.entries(data.relationships).filter(([, value]) => value > 0).map(([label, value]) => `${label}: ${value}`).join(', ')
          : ''
        throw new Error([data.error || 'İşlem tamamlanamadı', relationshipCounts].filter(Boolean).join(' — '))
      }
      setNotice(success)
      if (key === 'delete') {
        router.push('/panel/admin/users')
        return true
      }
      await load()
      return true
    } catch (mutationError) {
      setError(mutationError.message || 'İşlem tamamlanamadı')
      return false
    } finally {
      setBusy('')
    }
  }

  const runConfirmedAction = async () => {
    const action = confirmAction
    setConfirmAction(null)
    if (!action || !detail.user) return
    const base = `/api/admin/users/${encodeURIComponent(detail.user.id)}`
    if (action.type === 'status') {
      await mutate('status', `${base}/status`, 'PATCH', { status: action.status },
        action.status === 'suspended' ? 'Hesap askıya alındı.' : 'Hesap etkinleştirildi.')
    } else if (action.type === 'delete') {
      await mutate('delete', base, 'DELETE', { confirmEmail: deleteEmail.trim().toLowerCase() }, 'Kullanıcı silindi.')
    } else if (action.type === 'role') {
      await mutate('role', `${base}/role`, 'PATCH', { role: action.role }, 'Kullanıcı rolü güncellendi.')
    } else if (action.type === 'debit') {
      const idempotencyKey = crypto.randomUUID()
      const saved = await mutate('debit', `${base}/credits`, 'POST', {
        kind: 'subtract',
        amount: Number(debitAmount),
        reason: debitReason.trim(),
      }, 'Kredi düşüşü kaydedildi.', { 'Idempotency-Key': idempotencyKey })
      if (saved) {
        setDebitAmount('')
        setDebitReason('')
      }
    } else if (action.type === 'credit') {
      const plan = packages.find((item) => item.id === grantPackage)
      if (!plan) return
      const idempotencyKey = crypto.randomUUID()
      const saved = await mutate('grant', `${base}/grants`, 'POST', {
        packageId: plan.id,
        amount: Number(creditAmount),
        reason: creditReason.trim(),
      }, `${plan.eventCredits} kredi eklendi.`, { 'Idempotency-Key': idempotencyKey })
      if (saved) setCreditReason('')
    }
  }

  const addCredits = async (event) => {
    event.preventDefault()
    const plan = packages.find((item) => item.id === grantPackage)
    if (!plan || Number(creditAmount) !== plan.eventCredits || creditReason.trim().length < 10) return
    setConfirmAction({ type: 'credit' })
  }

  if (authStatus === 'loading') {
    return <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-muted-foreground" role="status"><Loader2 className="h-5 w-5 animate-spin" /> Yetki doğrulanıyor</div>
  }

  if (currentUser?.role !== 'super_admin') {
    return <p role="alert" className="rounded-xl border border-destructive/30 bg-white p-5 text-sm text-destructive">Bu bölümü görüntüleme yetkiniz yok.</p>
  }

  if (loading) {
    return <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-muted-foreground" role="status"><Loader2 className="h-5 w-5 animate-spin" /> Kullanıcı yükleniyor</div>
  }

  if (!detail.user) {
    return <div className="space-y-4"><Button asChild variant="outline"><Link href="/panel/admin/users"><ArrowLeft className="mr-2 h-4 w-4" /> Kullanıcı listesi</Link></Button>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</div>
  }

  const account = detail.user
  const isSelf = currentUser?.id === account.id
  const isSuperAdmin = account.role === 'super_admin'
  const selectedPlan = packages.find((item) => item.id === grantPackage)
  const relationshipCount = Object.values(detail.relationships || {}).reduce((total, value) => total + value, 0)

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link href="/panel/admin/users" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-midnight"><ArrowLeft className="h-4 w-4" /> Kullanıcı listesi</Link>
          <p className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-champagne-dark"><UserRoundCog className="h-4 w-4" /> Kullanıcı detayı</p>
          <h1 className="mt-2 break-words font-serif text-3xl text-midnight sm:text-4xl">{account.name || 'İsimsiz kullanıcı'}</h1>
          <p className="mt-1 break-all text-sm text-muted-foreground">{account.email}</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" /> Yenile</Button>
      </div>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {notice && <Alert><AlertDescription>{notice}</AlertDescription></Alert>}
      <p className="flex gap-2 rounded-xl border border-champagne/40 bg-champagne/10 p-4 text-xs leading-relaxed text-midnight"><ShieldCheck className="h-4 w-4 shrink-0" /> E-posta ve kimlik doğrulama bilgileri salt okunurdur. Paket kredileri yalnızca katalog planlarıyla verilir; kredi ve hesap işlemleri denetim kaydına alınır.</p>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <div className="space-y-5">
          <Section title="Profil">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-medium">Ad soyad
                <Input className="mt-2" value={name} maxLength={100} onChange={(event) => setName(event.target.value)} />
              </label>
              <label className="text-xs font-medium">E-posta
                <Input className="mt-2" value={account.email || ''} readOnly />
              </label>
              <div className="text-xs"><span className="font-medium">Kayıt tarihi</span><p className="mt-2 text-muted-foreground">{formatDate(account.createdAt)}</p></div>
              <div className="text-xs"><span className="font-medium">Hesap durumu</span><div className="mt-2"><Badge variant={account.status === 'suspended' ? 'destructive' : 'secondary'}>{account.status === 'suspended' ? 'Askıda' : 'Etkin'}</Badge></div></div>
              <label className="text-xs font-medium">Rol
                <Select value={role} onValueChange={(nextRole) => setConfirmAction({ type: 'role', role: nextRole })} disabled={isSelf || isSuperAdmin}>
                  <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Kullanıcı</SelectItem>
                    <SelectItem value="support">Destek — salt okunur</SelectItem>
                    <SelectItem value="admin">Admin — yönetim</SelectItem>
                    <SelectItem value="super_admin" disabled>Super admin — bootstrap</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <div className="flex flex-wrap items-end gap-2">
                <Button type="button" size="sm" disabled={busy === 'profile' || name.trim() === (account.name || '') || !name.trim()} onClick={() => mutate('profile', `/api/admin/users/${encodeURIComponent(account.id)}`, 'PATCH', { name: name.trim() }, 'Profil güncellendi.')}>Profili kaydet</Button>
                {!isSelf && !isSuperAdmin && (
                  <Button type="button" size="sm" variant={account.status === 'suspended' ? 'outline' : 'destructive'} onClick={() => setConfirmAction({ type: 'status', status: account.status === 'suspended' ? 'active' : 'suspended' })}>
                    {account.status === 'suspended' ? 'Hesabı etkinleştir' : 'Hesabı askıya al'}
                  </Button>
                )}
              </div>
            </div>
          </Section>

          <Section title="Paket ve kredi bakiyesi">
            <div className="flex flex-wrap gap-5 text-sm">
              <p>Hesap planı: <strong>{detail.package?.name || 'Başlangıç'}</strong></p>
              <p>Kullanılabilir: <strong>{detail.quota.remainingCredits}</strong> kredi</p>
              <p>Grant toplamı: <strong>{detail.quota.totalCredits}</strong></p>
            </div>
            {detail.quota.grants.length ? (
              <div className="mt-4 overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[540px] text-left text-xs">
                  <thead className="bg-ivory-50"><tr><th className="px-3 py-2">Paket</th><th className="px-3 py-2">Kredi</th><th className="px-3 py-2">Kaynak</th><th className="px-3 py-2">Durum</th><th className="px-3 py-2">Tarih</th></tr></thead>
                  <tbody className="divide-y">
                    {detail.quota.grants.map((grant) => <tr key={grant.id}><td className="px-3 py-2">{grant.packageId}</td><td className="px-3 py-2">{grant.remaining} / {grant.total}</td><td className="px-3 py-2">{grant.provider || '—'}</td><td className="px-3 py-2">{grant.status}</td><td className="px-3 py-2">{formatDate(grant.createdAt)}</td></tr>)}
                  </tbody>
                </table>
              </div>
            ) : <Empty />}
            <form onSubmit={addCredits} className="mt-5 grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-[1fr_120px_1.5fr_auto] sm:items-end">
              <label className="text-xs font-medium">Kredi paketi
                <Select value={grantPackage} onValueChange={(value) => { setGrantPackage(value); setCreditAmount(String(packages.find((item) => item.id === value)?.eventCredits || '')) }}>
                  <SelectTrigger className="mt-2"><SelectValue placeholder="Paket seçin" /></SelectTrigger>
                  <SelectContent>{packages.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                </Select>
              </label>
              <label className="text-xs font-medium">Miktar
                <Input className="mt-2" type="number" min="1" max="1000" step="1" required value={creditAmount} onChange={(event) => setCreditAmount(event.target.value)} />
              </label>
              <label className="text-xs font-medium">Açıklama
                <Input className="mt-2" minLength={10} maxLength={500} required value={creditReason} onChange={(event) => setCreditReason(event.target.value)} placeholder="En az 10 karakter" />
              </label>
              <Button type="submit" disabled={!selectedPlan || Number(creditAmount) !== selectedPlan.eventCredits || creditReason.trim().length < 10 || busy === 'grant'}>
                {busy === 'grant' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Kredi ekle'}
              </Button>
            </form>
            {selectedPlan && <p className="mt-2 text-xs text-muted-foreground">Paket kotası {selectedPlan.eventCredits} kredi olduğundan miktar bu planla eşleşmelidir.</p>}
            <div className="mt-5 grid gap-3 sm:grid-cols-[140px_1fr_auto] sm:items-end">
              <label className="text-xs font-medium">Düşülecek miktar
                <Input type="number" min="1" max="1000" step="1" value={debitAmount} onChange={(event) => setDebitAmount(event.target.value)} />
              </label>
              <label className="text-xs font-medium">Açıklama
                <Input minLength={10} maxLength={500} value={debitReason} onChange={(event) => setDebitReason(event.target.value)} placeholder="En az 10 karakter" />
              </label>
              <Button type="button" variant="outline" disabled={!Number.isInteger(Number(debitAmount)) || Number(debitAmount) < 1 || Number(debitAmount) > detail.quota.remainingCredits || debitReason.trim().length < 10 || busy === 'debit'} onClick={() => setConfirmAction({ type: 'debit' })}>
                {busy === 'debit' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Kredi düş'}
              </Button>
            </div>
          </Section>
        </div>
        <div className="space-y-5">
          <Section title="Hesap işlemleri">
            <p className="text-xs leading-relaxed text-muted-foreground">Kalıcı silme, geri alınamaz. İlişkili etkinlik, kredi, kullanım, VIP veya sipariş kayıtları varsa silme sunucu tarafından durdurulur. Bulunan bağlantılar: {relationshipCount}</p>
            <Button type="button" className="mt-4" variant="destructive" disabled={isSelf || isSuperAdmin} onClick={() => setConfirmAction({ type: 'delete' })}>Kullanıcıyı kalıcı sil</Button>
          </Section>
          <Section title="Kredi hareketleri" count={detail.creditMovements.length}>
            {detail.creditMovements.length ? <ul className="divide-y">
              {detail.creditMovements.map((movement, index) => <li key={`${movement.source}-${movement.id}-${index}`} className="py-3 text-xs">
                <div className="flex justify-between gap-3"><strong>{movement.kind === 'credit' || movement.kind === 'refund' ? '+' : movement.kind === 'debit' ? '−' : ''}{movement.amount} kredi</strong><span>{formatDate(movement.created_at)}</span></div>
                <p className="mt-1 text-muted-foreground">{movement.source === 'vip' ? 'VIP işlem' : movement.package_id || 'Admin kredi ayarı'}{movement.reason ? ` · ${movement.reason}` : ''}</p>
                {movement.campaign_id && <p className="mt-1 text-muted-foreground">Kampanya: {movement.campaign_id}</p>}
                {movement.request_key && <p className="mt-1 break-all text-[10px] text-muted-foreground">İşlem: {movement.request_key}</p>}
              </li>)}
            </ul> : <Empty />}
          </Section>
        </div>
      </div>

      <Section title="Etkinlikler" count={detail.events.length}>
        {detail.events.length ? <div className="grid gap-3 md:grid-cols-2">{detail.events.map((event) => <article key={event.id} className="rounded-xl border p-4 text-sm"><p className="font-medium">{event.title || 'Adsız etkinlik'}</p><p className="mt-1 text-xs text-muted-foreground">{event.type || '—'} · {event.date || 'Tarih yok'}</p><p className="mt-2 text-xs text-muted-foreground">{event.archived ? 'Arşivlendi' : event.published ? 'Yayında' : 'Taslak'} · Oluşturuldu {formatDate(event.createdAt)}</p></article>)}</div> : <Empty />}
      </Section>
      <Section title="Davetiyeler" count={detail.invitations.length}>
        {detail.invitations.length ? <div className="grid gap-3 md:grid-cols-2">{detail.invitations.map((invitation) => <article key={invitation.id} className="rounded-xl border p-4 text-sm"><p className="font-medium">{invitation.title || 'Başlıksız davetiye'}</p><p className="mt-1 text-xs text-muted-foreground">{invitation.date || 'Tarih yok'} · {invitation.published ? 'Yayında' : 'Taslak'}</p><p className="mt-1 text-xs text-muted-foreground">Şablon: {invitation.template || '—'}</p></article>)}</div> : <Empty />}
      </Section>
      <Section title="VIP talepleri / özel tasarım siparişleri" count={detail.vipRequests.length}>
        {detail.vipRequests.length ? <div className="grid gap-3 md:grid-cols-2">{detail.vipRequests.map((request) => <article key={request.id} className="rounded-xl border p-4 text-sm"><p className="font-medium">{request.eventDetails?.eventType || 'VIP tasarım talebi'}</p><p className="mt-1 text-xs text-muted-foreground">{request.eventDetails?.date || 'Tarih yok'} · {request.status}</p><p className="mt-1 text-xs text-muted-foreground">Talep: {formatDate(request.createdAt)} · Site: {request.siteStatus || 'henüz yok'}</p><Link className="mt-2 inline-block text-xs underline" href={`/panel/admin/vip-talepler/${encodeURIComponent(request.id)}`}>VIP talebini aç</Link></article>)}</div> : <Empty />}
      </Section>
      <Section title="Siparişler" count={detail.orders.length}>
        {detail.orders.length ? <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[600px] text-left text-xs"><thead className="bg-ivory-50"><tr><th className="px-3 py-2">Sipariş</th><th className="px-3 py-2">Paket</th><th className="px-3 py-2">Tutar</th><th className="px-3 py-2">Durum</th><th className="px-3 py-2">Tarih</th></tr></thead><tbody className="divide-y">{detail.orders.map((order) => <tr key={order.id}><td className="px-3 py-2">{order.id}</td><td className="px-3 py-2">{order.package_id}</td><td className="px-3 py-2">{order.amount} {order.currency}</td><td className="px-3 py-2">{order.status} · {order.provider}</td><td className="px-3 py-2">{formatDate(order.created_at)}</td></tr>)}</tbody></table></div> : <Empty />}
      </Section>

      <AlertDialog open={Boolean(confirmAction)} onOpenChange={(open) => { if (!open) setConfirmAction(null) }}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto p-4 sm:p-6 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="break-words">
              {confirmAction?.type === 'delete' ? 'Kullanıcı kalıcı olarak silinsin mi?' :
                confirmAction?.type === 'status' ? (confirmAction.status === 'suspended' ? 'Hesap askıya alınsın mı?' : 'Hesap yeniden etkinleştirilsin mi?') :
                  confirmAction?.type === 'debit' ? `${debitAmount} kredi düşülsün mü?` :
                    confirmAction?.type === 'credit' ? `${creditAmount} kredi eklensin mi?` : 'Kullanıcı rolü değiştirilsin mi?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm leading-relaxed">
              {confirmAction?.type === 'delete'
                ? `Bu işlem geri alınamaz. Devam etmek için ${account.email} adresini girin. İlişkili kayıtlar varsa silme reddedilir.`
                : confirmAction?.type === 'debit'
                  ? `İşlem açıklaması değiştirilemez kredi geçmişine eklenecek: ${debitReason.trim()}`
                  : confirmAction?.type === 'credit'
                    ? `${selectedPlan?.name || ''} paket kotası değiştirilemez kredi geçmişine eklenecek: ${creditReason.trim()}`
                  : confirmAction?.type === 'status'
                    ? 'Hesap durumu değişikliği oturum erişimini de etkiler.'
                    : `Rol "${ROLE_LABELS[confirmAction?.role]}" olarak değiştirilecek.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {confirmAction?.type === 'delete' && <Input autoComplete="off" value={deleteEmail} onChange={(event) => setDeleteEmail(event.target.value)} placeholder={account.email} aria-label="Silme onayı için e-posta" className="h-11 rounded-xl" />}
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-2.5">
            <AlertDialogCancel className="w-full sm:w-auto rounded-xl" onClick={() => setConfirmAction(null)}>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="w-full sm:w-auto rounded-xl"
              disabled={busy !== '' || (confirmAction?.type === 'delete' && deleteEmail.trim().toLowerCase() !== account.email)}
              onClick={(event) => { event.preventDefault(); runConfirmedAction() }}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmAction?.type === 'delete' ? 'Kalıcı sil' : 'Onayla'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
