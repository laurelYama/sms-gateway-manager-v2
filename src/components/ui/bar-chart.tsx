'use client'

import * as React from 'react'
import { Bar as BarPrimitive } from 'recharts'
import { cn } from '@/lib/utils'

/* eslint-disable @typescript-eslint/no-explicit-any */
function Bar(props: any) {
  const { className, ...rest } = props
  return <BarPrimitive className={cn('fill-primary', className)} {...rest} />
}

export { Bar }
