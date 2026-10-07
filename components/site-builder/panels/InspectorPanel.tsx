'use client'
import { useState } from 'react'
import { useSiteEditorStore } from '@/store/site-editor-store'
import { SECTION_DEFINITIONS } from '@/lib/site-builder/definitions'
import { type FieldDef } from '@/lib/site-builder/schema'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Lock, Unlock, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'

export function InspectorPanel(){
 const {site,selectedSectionId,updateSectionProps,updateSectionStyle,updateSectionAnimation,updateTheme,updateSettings,inspectorTab,setInspectorTab,toggleVisibility,toggleLock}=useSiteEditorStore()
 const [openItems,setOpenItems]=useState<Record<string,boolean>>({})
 if(!site)return null
 const section=selectedSectionId?site.sections.find(s=>s.id===selectedSectionId):null
 const def=section?SECTION_DEFINITIONS.find(d=>d.type===section.type):null
 const field=(f:FieldDef)=>{
   if(!section)return null
   if(f.showIf&&!f.showIf(section.props))return null
   const value=section.props[f.key]??''
   const set=(v:any)=>updateSectionProps(section.id,{[f.key]:v})
   if(f.type==='list'){
     const items=Array.isArray(value)?value:[]
     return <div key={f.key} className="space-y-2">
       <div className="flex items-center justify-between"><Label className="text-[10px] uppercase tracking-wider">{f.label}</Label><Button size="sm" variant="outline" className="h-7 px-2 text-[10px]" disabled={!!f.maxItems&&items.length>=f.maxItems} onClick={()=>set([...items,f.newItem()])}><Plus className="mr-1 h-3 w-3"/>Ekle</Button></div>
       {items.map((item:any,i:number)=>{const key=item.id||String(i),open=openItems[key]??i===0;return <div key={key} className="rounded-lg border bg-ivory-50/50">
         <button className="flex w-full items-center justify-between p-2.5 text-left" onClick={()=>setOpenItems(x=>({...x,[key]:!open}))}><span className="truncate text-[10px] font-medium">{item[f.itemLabelKey]||('Öğe '+(i+1))}</span>{open?<ChevronDown className="h-3 w-3"/>:<ChevronRight className="h-3 w-3"/>}</button>
         {open&&<div className="space-y-2 border-t p-2.5">{f.itemFields.map((sub:any)=><div key={sub.key}>{renderField(sub,item[sub.key],v=>{const next=[...items];next[i]={...item,[sub.key]:v};set(next)})}</div>)}<Button variant="ghost" size="sm" className="h-7 w-full text-[10px] text-red-500" onClick={()=>set(items.filter((_:any,j:number)=>j!==i))}><Trash2 className="mr-1 h-3 w-3"/>Sil</Button></div>}
       </div>})}
     </div>
   }
   return <div key={f.key}>{renderField(f,value,set)}</div>
 }
 const groups=(def?.fields||[]).reduce((a:any,f)=>{const g=f.group||'Genel';(a[g]??=[]).push(f);return a},{})
 const style=section?.style||{}
 return <div className="flex h-full flex-col bg-white">
   <div className="border-b bg-ivory-50/60 p-3"><div className="flex items-center justify-between"><div><h3 className="text-xs font-semibold uppercase tracking-wider">{section?def?.name:'Site Ayarları'}</h3><p className="mt-1 text-[10px] text-muted-foreground">{section?def?.description:'Genel site ve yayın ayarları'}</p></div>{section&&<div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>toggleVisibility(section.id)}>{section.visible?<Eye className="h-3.5 w-3.5"/>:<EyeOff className="h-3.5 w-3.5"/>}</Button><Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>toggleLock(section.id)}>{section.locked?<Lock className="h-3.5 w-3.5"/>:<Unlock className="h-3.5 w-3.5"/>}</Button></div>}</div>
   {section&&<div className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-white p-1"><button onClick={()=>setInspectorTab('content')} className={tab(inspectorTab==='content')}>İçerik</button><button onClick={()=>setInspectorTab('style')} className={tab(inspectorTab==='style')}>Tasarım</button><button onClick={()=>setInspectorTab('animation')} className={tab(inspectorTab==='animation')}>Anim.</button></div>}</div>
   <div className="flex-1 overflow-y-auto p-3">
   {!section?<SiteSettings site={site} updateSite={useSiteEditorStore.getState().updateSite} updateTheme={updateTheme} updateSettings={updateSettings}/>:inspectorTab==='content'?<div className="space-y-5">{Object.entries(groups).map(([g,fs]:any)=><div key={g} className="space-y-3"><h4 className="border-b pb-1 text-[10px] font-semibold uppercase tracking-wider">{g}</h4>{fs.map(field)}</div>)}</div>:inspectorTab==='style'?<StylePanel style={style} update={p=>updateSectionStyle(section.id,p)}/>:<AnimationPanel animation={section.animation||{type:'fade',duration:.8,delay:0}} update={p=>updateSectionAnimation(section.id,p)}/>}
   </div>
 </div>
}
function tab(active:boolean){return 'h-7 rounded-md text-[9px] uppercase tracking-wider '+(active?'bg-midnight text-ivory':'text-midnight/60 hover:bg-ivory-50')}
function renderField(f:any,value:any,set:(v:any)=>void){
 if(['text','url','image','datetime','date','time','color','video'].includes(f.type))return <div className="space-y-1"><Label className="text-[9px] text-muted-foreground">{f.label}</Label><Input type={f.type==='color'?'color':'text'} value={value??''} onChange={e=>set(e.target.value)} placeholder={f.placeholder} className="h-8 text-[11px]"/></div>
 if(f.type==='textarea')return <div className="space-y-1"><Label className="text-[9px] text-muted-foreground">{f.label}</Label><Textarea value={value??''} onChange={e=>set(e.target.value)} placeholder={f.placeholder} rows={3} className="text-[11px]"/></div>
 if(f.type==='toggle')return <div className="flex items-center justify-between"><Label className="text-[9px] text-muted-foreground">{f.label}</Label><input type="checkbox" checked={!!value} onChange={e=>set(e.target.checked)}/></div>
 if(f.type==='number'||f.type==='slider')return <div className="space-y-1"><div className="flex justify-between"><Label className="text-[9px] text-muted-foreground">{f.label}</Label><span className="text-[9px]">{value}</span></div><input type="range" min={f.min??0} max={f.max??100} step={f.step??1} value={Number(value)||0} onChange={e=>set(Number(e.target.value))} className="w-full"/>{f.type==='number'&&<Input type="number" value={value??0} onChange={e=>set(Number(e.target.value))} className="h-8 text-[10px]"/>}</div>
 if(f.type==='select'||f.type==='segmented')return <div className="space-y-1"><Label className="text-[9px] text-muted-foreground">{f.label}</Label><select value={value??''} onChange={e=>set(e.target.value)} className="h-8 w-full rounded-md border bg-white px-2 text-[10px]">{f.options.map((o:any)=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
 return null
}
function StylePanel({style:s,update}:any){return <div className="space-y-5">
 <Group title="Arka plan"><select value={s.bgType||'theme'} onChange={e=>update({bgType:e.target.value})} className="h-8 w-full rounded-md border px-2 text-[10px]"><option value="theme">Tema</option><option value="color">Renk</option><option value="gradient">Gradient</option><option value="image">Görsel</option><option value="video">Video</option></select>{['color','gradient'].includes(s.bgType)&&<Color label="Arka plan" value={s.bgColor||s.gradientFrom||'#ffffff'} set={v=>update({bgColor:v,gradientFrom:v})}/>} {['image','video'].includes(s.bgType)&&<Input value={s.bgImage||s.bgVideo||''} onChange={e=>update(s.bgType==='image'?{bgImage:e.target.value}:{bgVideo:e.target.value})} placeholder="URL" className="h-8 text-[10px]"/>}<Color label="Metin" value={s.textColor||'#101827'} set={v=>update({textColor:v})}/></Group>
 <Group title="Boyut & boşluk"><Num label="Dikey boşluk" value={s.paddingY??96} set={v=>update({paddingY:v})}/><Num label="Yatay boşluk" value={s.paddingX??24} set={v=>update({paddingX:v})}/><Num label="Dış boşluk" value={s.marginY??0} set={v=>update({marginY:v})}/><select value={s.width||'normal'} onChange={e=>update({width:e.target.value})} className="h-8 w-full rounded-md border px-2 text-[10px]"><option value="narrow">Dar</option><option value="normal">Normal</option><option value="wide">Geniş</option><option value="full">Tam</option></select></Group>
 <Group title="Görünüm"><Num label="Köşe yuvarlaklığı" value={s.radius??0} set={v=>update({radius:v})}/><Num label="Border" value={s.borderWidth??0} set={v=>update({borderWidth:v})}/><Color label="Border rengi" value={s.borderColor||'#000000'} set={v=>update({borderColor:v})}/><select value={s.shadow||'none'} onChange={e=>update({shadow:e.target.value})} className="h-8 w-full rounded-md border px-2 text-[10px]"><option>none</option><option>sm</option><option>md</option><option>lg</option><option>xl</option></select></Group>
 </div>}
function AnimationPanel({animation:a,update}:any){return <div className="space-y-4"><Group title="Giriş animasyonu"><select value={a.type||'none'} onChange={e=>update({type:e.target.value})} className="h-8 w-full rounded-md border px-2 text-[10px]">{['none','fade','slide-up','slide-left','slide-right','zoom','blur'].map(x=><option key={x} value={x}>{x}</option>)}</select><Num label="Süre (sn)" value={a.duration??.8} set={v=>update({duration:v})}/><Num label="Gecikme (sn)" value={a.delay??0} set={v=>update({delay:v})}/><SwitchRow label="Kademeli giriş" value={!!a.stagger} set={v=>update({stagger:v})}/></Group></div>}
function SiteSettings({site,updateSite,updateTheme,updateSettings}:any){return <div className="space-y-5"><Group title="Site"><Label className="text-[9px]">Başlık</Label><Input value={site.title} onChange={e=>updateSite({title:e.target.value})} className="h-8 text-[11px]"/><Label className="text-[9px]">Slug</Label><Input value={site.slug} onChange={e=>updateSite({slug:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'-')})} className="h-8 text-[11px]"/></Group><Group title="Tema"><Color label="Vurgu" value={site.theme.accentColor} set={v=>updateTheme({accentColor:v})}/><Color label="Arka plan" value={site.theme.backgroundColor} set={v=>updateTheme({backgroundColor:v})}/><Color label="Metin" value={site.theme.textColor} set={v=>updateTheme({textColor:v})}/><Input value={site.theme.headingFont} onChange={e=>updateTheme({headingFont:e.target.value})} className="h-8 text-[11px]" placeholder="Heading font"/><Input value={site.theme.bodyFont} onChange={e=>updateTheme({bodyFont:e.target.value})} className="h-8 text-[11px]" placeholder="Body font"/></Group><Group title="Yayın"><SwitchRow label="Müzik" value={site.settings.musicEnabled} set={v=>updateSettings({musicEnabled:v})}/><SwitchRow label="Geri sayım" value={site.settings.showCountdown} set={v=>updateSettings({showCountdown:v})}/><Input value={site.settings.seoTitle||''} onChange={e=>updateSettings({seoTitle:e.target.value})} placeholder="SEO başlığı" className="h-8 text-[11px]"/><Textarea value={site.settings.seoDescription||''} onChange={e=>updateSettings({seoDescription:e.target.value})} placeholder="SEO açıklaması" className="text-[11px]"/></Group></div>}
function Group({title,children}:any){return <div className="space-y-2"><h4 className="border-b pb-1 text-[10px] font-semibold uppercase tracking-wider">{title}</h4>{children}</div>}
function Num({label,value,set}:any){return <div className="flex items-center justify-between gap-2"><Label className="text-[9px] text-muted-foreground">{label}</Label><Input type="number" value={value} onChange={e=>set(Number(e.target.value))} className="h-8 w-20 text-[10px]"/></div>}
function Color({label,value,set}:any){return <div className="flex items-center justify-between gap-2"><Label className="text-[9px] text-muted-foreground">{label}</Label><input type="color" value={value} onChange={e=>set(e.target.value)} className="h-7 w-10 cursor-pointer rounded border"/></div>}
function SwitchRow({label,value,set}:any){return <div className="flex items-center justify-between"><Label className="text-[9px] text-muted-foreground">{label}</Label><input type="checkbox" checked={!!value} onChange={e=>set(e.target.checked)}/></div>}
