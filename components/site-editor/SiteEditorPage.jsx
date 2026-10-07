'use client'
import { useEffect,useState } from 'react'
import { useParams,useRouter } from 'next/navigation'
import { SiteEditor } from './SiteEditor'
import { TEMPLATES } from '@/lib/data/templates'

export function SiteEditorPage(){
 const {id}=useParams(); const router=useRouter(); const [project,setProject]=useState(null)
 useEffect(()=>{fetch('/api/projects/'+id,{credentials:'include',cache:'no-store'}).then(r=>r.json()).then(d=>{if(d.project)setProject(d.project);else router.replace('/panel')}).catch(()=>router.replace('/panel'))},[id,router])
 if(!project)return <div className="flex min-h-screen items-center justify-center bg-[#e9e4d9] text-sm text-muted-foreground">Site düzenleyici hazırlanıyor…</div>
 return <SiteEditor project={project} templates={TEMPLATES}/>
}
