'use client'

import { useEffect, type ReactNode } from 'react'

type VipDemoViewportProps = {
  children: ReactNode
  siteId?: string
}

export function VipDemoViewport({ children, siteId }: VipDemoViewportProps) {
  useEffect(() => {
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prev
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden bg-[#f3efe7] p-2 text-midnight sm:p-4"
      data-vip-site={siteId}
    >
      {children}
    </div>
  )
}
