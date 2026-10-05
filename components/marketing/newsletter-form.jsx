'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function NewsletterForm({ source = 'footer' }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Bir hata oluştu')
      toast.success('Teşekkürler! İlham dolu içerikler yakında gelen kutunuzda.')
      setEmail('')
    } catch (err) {
      toast.error(err.message || 'Bir hata oluştu, lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center border-b border-ivory/30 pb-2" data-testid="newsletter-form">
      <Input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-posta adresiniz"
        className="h-10 rounded-2xl border-0 bg-transparent px-0 text-ivory placeholder:text-ivory/40 focus-visible:ring-0 focus-visible:ring-offset-0"
        data-testid="newsletter-email"
      />
      <Button type="submit" variant="ghost" size="icon" disabled={loading} className="text-champagne hover:bg-transparent hover:text-champagne-light" aria-label="Abone ol" data-testid="newsletter-submit">
        <ArrowRight className="h-5 w-5" />
      </Button>
    </form>
  )
}
