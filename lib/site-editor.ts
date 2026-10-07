export type SiteSectionType = 'hero' | 'story' | 'event' | 'gallery' | 'countdown' | 'rsvp' | 'music' | 'gift' | 'location' | 'footer'

export type SiteSection = { id:string; type:SiteSectionType; visible:boolean; props:Record<string,any> }
export type SiteTheme = { palette:{bg:string;accent:string;text:string;muted:string}; font:'playfair'|'dm-sans'|'georgia'; radius:'soft'|'classic'|'sharp' }
export type SiteConfig = { version:1; templateId:string; theme:SiteTheme; sections:SiteSection[] }

const newId=(prefix:string)=>prefix+'-'+Math.random().toString(36).slice(2,8)
export function createSection(type:SiteSectionType, project:any):SiteSection {
 const props:any={hero:{eyebrow:'',title:'',subtitle:''},story:{label:'Hikâyemiz',title:'Birlikte başlayan hikâyemiz',body:project?.story||''},event:{title:'Etkinlik detayları',showFamilies:true},location:{title:'Buluşma noktası'},gallery:{title:'Anılarımız',images:[]},countdown:{title:'Büyük güne kalan',enabled:true},rsvp:{title:'Katılımınızı bildirin',enabled:true},music:{title:'Gecenin sesi',enabled:true},gift:{title:'Hediye tercihi',enabled:true},footer:{message:'Bu güzel günde bizimle olduğunuz için teşekkür ederiz.'}}[type]
 if(type==='hero') props.title=[project?.host_a,project?.host_b].filter(Boolean).join(' & ')||'Özel Günümüz'
 return {id:newId(type),type,visible:true,props}
}
export function createSiteConfig(project:any,template:any):SiteConfig {
 const theme:SiteTheme={palette:project?.palette||template?.palette||{bg:'#F8F4EC',accent:'#C9A96E',text:'#101827',muted:'#8B8577'},font:project?.website_font||'playfair',radius:'soft'}
 const types:SiteSectionType[]=['hero','countdown','story','event','location','gallery','rsvp','music','gift','footer']
 return {version:1,templateId:template?.slug||project?.template_slug||'aurelia',theme,sections:types.map(t=>createSection(t,project))}
}
