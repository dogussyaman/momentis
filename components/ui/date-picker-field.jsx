'use client'

import { CalendarDays } from 'lucide-react'
import { format, parse } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

function parseDate(value) {
  if (!value) return undefined
  const parsed = parse(value, 'yyyy-MM-dd', new Date())
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

export function DatePickerField({ value, onChange, placeholder = 'Tarih seçin', className, testid, disabled }) {
  const selected = parseDate(value)

  return (
    <Popover>
      <PopoverTrigger asChild>
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
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" sideOffset={6}>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => onChange(date ? format(date, 'yyyy-MM-dd') : '')}
          locale={tr}
          initialFocus
          className="rounded-xl"
        />
      </PopoverContent>
    </Popover>
  )
}
