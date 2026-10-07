import { create } from 'zustand'
import type { WeddingSite, SiteSection, SectionStyle, SectionAnimation } from '@/lib/site-builder/schema'
import { createSectionFromDefinition, refreshIds, uid } from '@/lib/site-builder/definitions'
import { buildSiteFromTemplate } from '@/lib/site-builder/templates'
import debounce from 'lodash/debounce'
export type LeftTab='add'|'layers'|'theme'|'templates'|'settings'
export type InspectorTab='content'|'style'|'animation'
export type Device='desktop'|'tablet'|'mobile'
export const DRAFT_KEY='momentis-site-draft-v3'
interface State{site:WeddingSite|null;selectedSectionId:string|null;selectedOverlayId:string|null;hoveredSectionId:string|null;leftTab:LeftTab;inspectorTab:InspectorTab;device:Device;isPreview:boolean;isSaving:boolean;lastSavedAt:number|null;past:WeddingSite[];future:WeddingSite[];initSite:(s:WeddingSite)=>void;loadTemplate:(id:string,keepContent?:boolean)=>void;setDevice:(d:Device)=>void;setLeftTab:(t:LeftTab)=>void;setInspectorTab:(t:InspectorTab)=>void;setIsPreview:(v:boolean)=>void;selectSection:(id:string|null)=>void;selectOverlay:(id:string|null)=>void;hoverSection:(id:string|null)=>void;addSection:(t:string,i?:number)=>void;removeSection:(id:string)=>void;duplicateSection:(id:string)=>void;updateSection:(id:string,u:Partial<SiteSection>)=>void;updateSectionProps:(id:string,p:Record<string,any>)=>void;updateSectionStyle:(id:string,p:Partial<SectionStyle>)=>void;updateSectionAnimation:(id:string,p:Partial<SectionAnimation>)=>void;toggleVisibility:(id:string)=>void;toggleLock:(id:string)=>void;moveSection:(a:number,b:number)=>void;moveSectionBy:(id:string,d:number)=>void;reorderSections:(s:SiteSection[])=>void;updateSite:(u:Partial<Pick<WeddingSite,'title'|'slug'|'status'>>)=>void;updateTheme:(u:Partial<WeddingSite['theme']>)=>void;updateSettings:(u:Partial<WeddingSite['settings']>)=>void;undo:()=>void;redo:()=>void;canUndo:()=>boolean;canRedo:()=>boolean;save:()=>Promise<void>;reset:()=>void}
const clone=<T,>(v:T):T=>JSON.parse(JSON.stringify(v))
const normalize=(s:WeddingSite):WeddingSite=>({...s,sections:s.sections.map((x,i)=>({...x,order:i})),updatedAt:new Date().toISOString()})
function mutate(set:any,get:()=>State,fn:(s:WeddingSite)=>WeddingSite|null){const cur=get().site;if(!cur)return;const next=fn(cur);if(!next)return;set({site:normalize(next),past:[...get().past,clone(cur)].slice(-80),future:[]})}
export const useSiteEditorStore=create<State>((set,get)=>({
 site:null,selectedSectionId:null,selectedOverlayId:null,hoveredSectionId:null,leftTab:'add',inspectorTab:'content',device:'desktop',isPreview:false,isSaving:false,lastSavedAt:null,past:[],future:[],
 initSite:s=>set({site:normalize(s),selectedSectionId:null,selectedOverlayId:null,past:[],future:[]}),
 loadTemplate:(id,keep=false)=>{const cur=get().site,next=buildSiteFromTemplate(id,cur??undefined);if(!cur){set({site:next,past:[],future:[]});return}mutate(set,get,s=>keep?{...s,theme:next.theme,templateId:id}:next);set({selectedSectionId:null,selectedOverlayId:null})},
 setDevice:device=>set({device}),setLeftTab:leftTab=>set({leftTab}),setInspectorTab:inspectorTab=>set({inspectorTab}),setIsPreview:isPreview=>set({isPreview,selectedSectionId:isPreview?null:get().selectedSectionId,selectedOverlayId:isPreview?null:get().selectedOverlayId}),selectSection:selectedSectionId=>set({selectedSectionId,selectedOverlayId:null}),selectOverlay:selectedOverlayId=>set({selectedOverlayId}),hoverSection:hoveredSectionId=>set({hoveredSectionId}),
 addSection:(type,index)=>{const section=createSectionFromDefinition(type) as SiteSection;mutate(set,get,s=>{const a=[...s.sections],i=index===undefined?a.length:Math.max(0,Math.min(index,a.length));a.splice(i,0,section);return {...s,sections:a}});set({selectedSectionId:section.id,selectedOverlayId:null,inspectorTab:'content'})},
 removeSection:id=>{mutate(set,get,s=>({...s,sections:s.sections.filter(x=>x.id!==id)}));if(get().selectedSectionId===id)set({selectedSectionId:null,selectedOverlayId:null})},
 duplicateSection:id=>{const cur=get().site;if(!cur)return;const i=cur.sections.findIndex(x=>x.id===id);if(i<0)return;const copy=refreshIds(clone(cur.sections[i])) as SiteSection;copy.id=uid('section');mutate(set,get,s=>{const a=[...s.sections];a.splice(i+1,0,copy);return {...s,sections:a}});set({selectedSectionId:copy.id,selectedOverlayId:null})},
 updateSection:(id,u)=>mutate(set,get,s=>({...s,sections:s.sections.map(x=>x.id===id?{...x,...u}:x)})),
 updateSectionProps:(id,p)=>mutate(set,get,s=>({...s,sections:s.sections.map(x=>x.id===id?{...x,props:{...x.props,...p}}:x)})),
 updateSectionStyle:(id,p)=>mutate(set,get,s=>({...s,sections:s.sections.map(x=>x.id===id?{...x,style:{...x.style,...p}}:x)})),
 updateSectionAnimation:(id,p)=>mutate(set,get,s=>({...s,sections:s.sections.map(x=>x.id===id?{...x,animation:{type:'fade',...(x.animation||{}),...p}}:x)})),
 toggleVisibility:id=>mutate(set,get,s=>({...s,sections:s.sections.map(x=>x.id===id?{...x,visible:!x.visible}:x)})),
 toggleLock:id=>mutate(set,get,s=>({...s,sections:s.sections.map(x=>x.id===id?{...x,locked:!x.locked}:x)})),
 moveSection:(a,b)=>mutate(set,get,s=>{if(a<0||b<0||a>=s.sections.length||b>=s.sections.length||a===b)return null;const x=[...s.sections],m=x.splice(a,1)[0];x.splice(b,0,m);return {...s,sections:x}}),
 moveSectionBy:(id,d)=>{const s=get().site;if(!s)return;const i=s.sections.findIndex(x=>x.id===id);get().moveSection(i,i+d)},
 reorderSections:s=>mutate(set,get,site=>({...site,sections:s})),
 updateSite:u=>mutate(set,get,s=>({...s,...u})),
 updateTheme:u=>mutate(set,get,s=>({...s,theme:{...s.theme,...u}})),
 updateSettings:u=>mutate(set,get,s=>({...s,settings:{...s.settings,...u}})),
 undo:()=>{const {site,past,future}=get();if(!site||!past.length)return;set({site:clone(past[past.length-1]),past:past.slice(0,-1),future:[clone(site),...future].slice(0,80),selectedSectionId:null,selectedOverlayId:null})},
 redo:()=>{const {site,past,future}=get();if(!site||!future.length)return;set({site:clone(future[0]),past:[...past,clone(site)].slice(-80),future:future.slice(1),selectedSectionId:null,selectedOverlayId:null})},
 canUndo:()=>get().past.length>0,canRedo:()=>get().future.length>0,
 save:async()=>{const s=get().site;if(!s||typeof window==='undefined')return;set({isSaving:true});try{localStorage.setItem(DRAFT_KEY,JSON.stringify(s));await new Promise(r=>setTimeout(r,150))}finally{set({isSaving:false,lastSavedAt:Date.now()})}},
 reset:()=>set({site:null,selectedSectionId:null,selectedOverlayId:null,past:[],future:[]})
}))
export const autosaveSite=debounce(()=>void useSiteEditorStore.getState().save(),900)
