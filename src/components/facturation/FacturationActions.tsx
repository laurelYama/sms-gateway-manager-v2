import { Button } from "@/components/ui/button"
import { Plus, Download, Send, Settings } from "lucide-react"
import { FacturationActionsProps } from "./types"

export function FacturationActions({
    onGenerate,
    onDownloadAll,
    onSendAll,
    onConfigureFooter,
    loading = false
}: FacturationActionsProps) {
    return (
        <div className="flex flex-wrap gap-2 mb-4">
            <Button onClick={onGenerate} disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                Générer les factures
            </Button>
            <Button variant="outline" onClick={onDownloadAll} disabled={loading}>
                <Download className="mr-2 h-4 w-4" />
                Télécharger tout
            </Button>
            <Button variant="outline" onClick={onSendAll} disabled={loading}>
                <Send className="mr-2 h-4 w-4" />
                Envoyer tout
            </Button>
            <Button 
                variant="outline" 
                onClick={onConfigureFooter}
                className="ml-auto"
                disabled={loading}
            >
                <Settings className="mr-2 h-4 w-4" />
                Configuration du pied de page
            </Button>
        </div>
    )
}
