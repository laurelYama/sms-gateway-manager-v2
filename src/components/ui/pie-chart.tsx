'use client'

import * as React from 'react'
import { Pie as PiePrimitive, Cell } from 'recharts'
import { cn } from '@/lib/utils'

const Pie = React.forwardRef<
  React.ElementRef<typeof PiePrimitive>,
  React.ComponentPropsWithoutRef<typeof PiePrimitive> & {
    colors?: string[]
  }
>(({ className, colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'], ...props }, ref) => {
  const { data, ...rest } = props
  
  return (
    <PiePrimitive
      ref={ref}
      className={cn('', className)}
      {...rest}
    >
      {data?.map((entry: any, index: number) => (
        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
      ))}
    </PiePrimitive>
  )
})
Pie.displayName = 'Pie'

export { Pie, Cell as PieCell }
