import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ReactNode } from "react"
import { HelpCircle } from "lucide-react"

interface MetricsCardProps {
  title: string
  value: string | number
  description: string
  icon: ReactNode
  trend?: {
    value: string
    isPositive: boolean
  }
  tooltip?: string
}

export function MetricsCard({ 
  title, 
  value, 
  description, 
  icon,
  trend,
  tooltip
}: MetricsCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {title}
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
        <div className="p-2 rounded-md bg-primary/10">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          {trend && (
            <Badge 
              variant={trend.isPositive ? "default" : "destructive"} 
              className="h-5 px-1.5 text-[10px] font-medium"
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </Badge>
          )}
          <span>{description}</span>
        </div>
      </CardContent>
    </Card>
  )
}
