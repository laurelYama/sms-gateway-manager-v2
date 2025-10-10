'use client'

import * as React from 'react'
import { Bar as BarPrimitive } from 'recharts'
import { cn } from '@/lib/utils'

const Bar = React.forwardRef<
  React.ElementRef<typeof BarPrimitive>,
  React.ComponentPropsWithoutRef<typeof BarPrimitive>
>(({ className, ...props }, ref) => (
  <BarPrimitive
    ref={ref}
    className={cn('fill-primary', className)}
    {...props}
  />
))
Bar.displayName = 'Bar'

export { Bar }
