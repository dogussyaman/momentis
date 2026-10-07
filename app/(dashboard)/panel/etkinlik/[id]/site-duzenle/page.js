import { Suspense } from 'react'
import { SiteEditorPage } from '@/components/site-editor/SiteEditorPage'
export default function SiteEditRoute(){ return <Suspense fallback={null}><SiteEditorPage/></Suspense> }
