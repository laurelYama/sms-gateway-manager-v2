// allow a local any because Recharts types are incompatible with strict props here
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import * as React from 'react'
import { Area as AreaPrimitive } from 'recharts'
import { cn } from '@/lib/utils'

function Area(props: any) {
  const { className, ...rest } = props
  return (
    <AreaPrimitive
      className={cn('fill-primary/10 stroke-primary', className)}
      {...rest}
    />
  )
}

export { Area }
