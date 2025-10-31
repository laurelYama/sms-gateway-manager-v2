import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock } from "lucide-react"

interface CreditStatusBadgeProps {
    status: "PENDING" | "APPROVED" | "REJECTED"
}

export function CreditStatusBadge({ status }: CreditStatusBadgeProps) {
    const statusConfig = {
        PENDING: { label: "Pendiente", variant: "secondary" as const, icon: Clock },
        APPROVED: { label: "Aprobado", variant: "default" as const, icon: CheckCircle },
        REJECTED: { label: "Rechazado", variant: "destructive" as const, icon: XCircle }
    }

    const config = statusConfig[status] || statusConfig.PENDING
    const Icon = config.icon

    return (
        <Badge variant={config.variant} className="gap-1">
            <Icon className="h-3.5 w-3.5" />
            {config.label}
        </Badge>
    )
}
