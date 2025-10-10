'use client'

import * as React from 'react'
import { Area as AreaPrimitive } from 'recharts'
import { cn } from '@/lib/utils'

const Area = React.forwardRef<
  React.ElementRef<typeof AreaPrimitive>,
  React.ComponentPropsWithoutRef<typeof AreaPrimitive>
>(({ className, ...props }, ref) => (
  <AreaPrimitive
    ref={ref}
    className={cn('fill-primary/10 stroke-primary', className)}
    {...props}
  />
))
Area.displayName = 'Area'

export { Area }
