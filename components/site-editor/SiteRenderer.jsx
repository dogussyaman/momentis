'use client'
import { SiteSectionRenderer } from './SiteSectionRenderer'
export function SiteRenderer({ project, config, preview=false }) {
  if (!config?.sections?.length) return null
  return <div className="min-h-full" style={{background:config.theme.palette.bg,color:config.theme.palette.text}} data-site-renderer={preview?'preview':'public'}>{config.sections.map(section => <SiteSectionRenderer key={section.id} section={section} project={project} theme={config.theme}/>)}</div>
}
