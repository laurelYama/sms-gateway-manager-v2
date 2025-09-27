import { Button } from "@/components/ui/button"
import { Plus, Calendar } from "lucide-react"
import { FacturationActionsProps } from "./types"

export function FacturationActions({
    onGenerate,
    onConfigureFooter,
    loading = false
}: FacturationActionsProps) {
    return (
        <div className="flex flex-wrap gap-2 mb-4">
            <Button onClick={onGenerate} disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                Générer les factures
            </Button>
            <Button 
                variant="outline" 
                onClick={onConfigureFooter}
                className="ml-auto"
                disabled={loading}
            >
                <Calendar className="mr-2 h-4 w-4" />
                Définir l'exercice
            </Button>
        </div>
    )
}
