'use client'

import * as React from 'react'
import { Pie as PiePrimitive, Cell } from 'recharts'
import type { PieProps as RechartsPieProps } from 'recharts'
import { cn } from '@/lib/utils'

type PieProps = { className?: string; colors?: string[]; data?: unknown[]; [key: string]: unknown }

function Pie({ className, colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'], data }: PieProps) {
  const typedData: unknown[] = Array.isArray(data) ? data : []
  return (
  <PiePrimitive className={cn('', className)} data={typedData as unknown as RechartsPieProps['data']} dataKey="value">
      {typedData.map((_, index: number) => (
        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
      ))}
    </PiePrimitive>
  )
}

export { Pie, Cell as PieCell }
