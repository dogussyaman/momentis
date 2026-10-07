export const metadata = {
  title: 'Taslaklar | MOMENTIS',
}

export default function DraftsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-midnight">Taslaklar</h1>
        <p className="text-muted-foreground mt-2">Henüz yayınlanmamış ve üzerinde çalıştığınız etkinlik projeleri.</p>
      </div>
      <div className="rounded-2xl border border-dashed border-border bg-ivory-50 p-12 text-center">
        <p className="text-muted-foreground">Şu an kayıtlı bir taslağınız bulunmuyor.</p>
      </div>
    </div>
  )
}
