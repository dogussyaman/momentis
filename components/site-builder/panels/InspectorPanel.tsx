import { useSiteEditorStore } from '@/store/site-editor-store'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SECTION_DEFINITIONS, FieldDef } from '@/lib/site-builder/definitions'
import { Switch } from '@/components/ui/switch'

export function InspectorPanel() {
  const { site, selectedSectionId, updateSectionProps } = useSiteEditorStore()

  if (!site) return null

  const selectedSection = selectedSectionId 
    ? site.sections.find(s => s.id === selectedSectionId) 
    : null

  if (!selectedSection) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="p-4 border-b border-border bg-ivory-50/50">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-midnight">Site Ayarları</h3>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-[10px] text-muted-foreground">Şu an hiçbir bölüm seçili değil. Buradan genel site ayarlarını düzenleyebilirsiniz.</p>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Site Başlığı</Label>
            <Input value={site.title} readOnly className="h-9 text-xs" />
          </div>
        </div>
      </div>
    )
  }

  const def = SECTION_DEFINITIONS.find(d => d.type === selectedSection.type)

  const handleChange = (key: string, value: any) => {
    updateSectionProps(selectedSection.id, { [key]: value })
  }

  const renderField = (f: FieldDef) => {
    // Check if it should be shown
    if (f.showIf && !f.showIf(selectedSection.props)) return null;

    const value = selectedSection.props[f.key] ?? ''

    if (f.type === 'text' || f.type === 'image' || f.type === 'url' || f.type === 'color' || f.type === 'datetime') {
      return (
        <div key={f.key} className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.label}</Label>
          <Input 
            value={value} 
            onChange={(e) => handleChange(f.key, e.target.value)}
            placeholder={f.placeholder}
            className="h-9 text-xs"
          />
        </div>
      )
    }

    if (f.type === 'textarea') {
      return (
        <div key={f.key} className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.label}</Label>
          <Textarea 
            value={value} 
            onChange={(e) => handleChange(f.key, e.target.value)}
            placeholder={f.placeholder}
            className="text-xs resize-none"
            rows={3}
          />
        </div>
      )
    }

    if (f.type === 'toggle') {
      return (
        <div key={f.key} className="flex items-center justify-between py-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.label}</Label>
          <Switch 
            checked={!!value} 
            onCheckedChange={(c) => handleChange(f.key, c)} 
          />
        </div>
      )
    }

    if (f.type === 'select' || f.type === 'segmented') {
      return (
        <div key={f.key} className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.label}</Label>
          <select 
            value={value} 
            onChange={(e) => handleChange(f.key, e.target.value)}
            className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {f.options.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      )
    }

    if (f.type === 'slider' || f.type === 'number') {
      return (
        <div key={f.key} className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.label} {f.unit ? `(${f.unit})` : ''}</Label>
          <Input 
            type="number"
            min={f.min}
            max={f.max}
            step={f.step}
            value={value} 
            onChange={(e) => handleChange(f.key, Number(e.target.value))}
            className="h-9 text-xs"
          />
        </div>
      )
    }

    if (f.type === 'list') {
      return (
        <div key={f.key} className="space-y-2 border-t pt-2 mt-4">
           <Label className="text-[10px] uppercase tracking-wider text-midnight font-bold">{f.label} (Liste)</Label>
           <p className="text-[10px] text-muted-foreground">Liste elemanlarını düzenlemek için gelişmiş panel (Yakında).</p>
        </div>
      )
    }

    return null
  }

  // Group fields
  const groups = def?.fields.reduce((acc, f) => {
    const group = f.group || 'Genel'
    if (!acc[group]) acc[group] = []
    acc[group].push(f)
    return acc
  }, {} as Record<string, FieldDef[]>) || {}

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-border bg-ivory-50/50">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-midnight">
          {def?.name || selectedSection.type} Ayarları
        </h3>
        <p className="text-[10px] text-muted-foreground mt-1">
          {def?.description}
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {Object.entries(groups).map(([groupName, fields]) => (
          <div key={groupName} className="space-y-3">
             <h4 className="text-[11px] font-semibold text-midnight border-b pb-1">{groupName}</h4>
             <div className="space-y-3">
               {fields.map(renderField)}
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}
