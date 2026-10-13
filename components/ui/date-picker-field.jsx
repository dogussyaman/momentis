'use client'

import * as React from 'react'
import { CalendarDays } from 'lucide-react'
import { format, parse } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

function parseDate(value) {
  if (!value) return undefined
  const parsed = parse(value, 'yyyy-MM-dd', new Date())
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

export function DatePickerField({ value, onChange, placeholder = 'Tarih seçin', className, testid, disabled }) {
  const selected = parseDate(value)
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)

  const trigger = (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      className={cn('h-11 w-full justify-start rounded-2xl border-border bg-ivory-50 px-3 text-left font-normal hover:bg-ivory-50', !selected && 'text-muted-foreground', className)}
      data-testid={testid}
    >
      <CalendarDays className="mr-2 h-4 w-4 shrink-0 text-champagne-dark" />
      <span className="truncate">{selected ? format(selected, 'd MMMM yyyy', { locale: tr }) : placeholder}</span>
    </Button>
  )

  const calendar = (
    <Calendar
      mode="single"
      selected={selected}
      onSelect={(date) => {
        onChange(date ? format(date, 'yyyy-MM-dd') : '')
        if (date) setOpen(false)
      }}
      locale={tr}
      initialFocus
      className="mx-auto rounded-xl"
    />
  )

  return isMobile ? (
    <Drawer open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn('h-11 w-full justify-start rounded-2xl border-border bg-ivory-50 px-3 text-left font-normal hover:bg-ivory-50', !selected && 'text-muted-foreground', className)}
        data-testid={testid}
      >
        <CalendarDays className="mr-2 h-4 w-4 shrink-0 text-champagne-dark" />
        <span className="truncate">{selected ? format(selected, 'd MMMM yyyy', { locale: tr }) : placeholder}</span>
      </Button>
      <DrawerContent className="max-h-[90dvh] rounded-t-3xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <DrawerHeader className="px-2 text-left">
          <DrawerTitle className="font-serif text-xl text-midnight">Etkinlik tarihi</DrawerTitle>
          <DrawerDescription>Takvimden gün, ay ve yıl seçin.</DrawerDescription>
        </DrawerHeader>
        {calendar}
      </DrawerContent>
    </Drawer>
  ) : (
    <Popover>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" sideOffset={6}>
        {calendar}
      </PopoverContent>
    </Popover>
  )
}
