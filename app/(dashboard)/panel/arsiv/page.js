export const metadata = {
  title: 'Arşiv | MOMENTIS',
}

export default function ArchivePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-midnight">Arşiv</h1>
        <p className="text-muted-foreground mt-2">Tarihi geçmiş veya arşivlediğiniz eski etkinlikler.</p>
      </div>
      <div className="rounded-2xl border border-dashed border-border bg-ivory-50 p-12 text-center">
        <p className="text-muted-foreground">Arşivinizde etkinlik bulunmuyor.</p>
      </div>
    </div>
  )
}
