import { Button } from "@/components/ui/button"
import { Plus, Calendar } from "lucide-react"
import { FacturationActionsProps } from "./types"
import { useAuth } from "@/lib/auth"

export function FacturationActions({
    onGenerate,
    onConfigureFooter,
    loading = false
}: FacturationActionsProps) {
    const { user } = useAuth()
    const canGenerateInvoices = user?.role !== 'AUDITEUR'
    if (!canGenerateInvoices) {
        return null
    }

    return (
        <div className="flex flex-wrap gap-2 mb-4">
            <Button onClick={onGenerate} disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                Generar facturas
            </Button>
        </div>
    )
}
