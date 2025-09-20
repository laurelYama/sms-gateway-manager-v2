import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download, Send, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
// Formatage de date personnalisé pour le français
const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('fr-FR', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
    }).format(d);
}
import { Facture } from "./types"

interface FacturationTableProps {
    factures: Facture[]
    onPreview: (id: string) => void
    onDownload: (id: string) => void
    onSend: (id: string) => void
    loading?: boolean
}

export function FacturationTable({ factures, onPreview, onDownload, onSend, loading = false }: FacturationTableProps) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'GENEREE':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Générée</Badge>
            case 'ENVOYEE':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Envoyée</Badge>
            case 'PAYEE':
                return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Payée</Badge>
            case 'ANNULEE':
                return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">Annulée</Badge>
            default:
                return <Badge variant="outline">Brouillon</Badge>
        }
    }

    if (loading && factures.length === 0) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted/20 rounded-lg" />
                ))}
            </div>
        )
    }

    if (factures.length === 0) {
        return (
            <div className="text-center py-12 border rounded-lg">
                <p className="text-muted-foreground">Aucune facture trouvée</p>
            </div>
        )
    }

    return (
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Période</TableHead>
                        <TableHead>Consommation</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="w-40">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {factures.map((facture) => (
                        <TableRow key={facture.id}>
                            <TableCell className="font-medium">{facture.clientNom}</TableCell>
                            <TableCell>
                                {formatDate(facture.dateDebut)} - {formatDate(facture.dateFin)}
                            </TableCell>
                            <TableCell>{facture.consommationSms} SMS</TableCell>
                            <TableCell>{facture.montant.toLocaleString('fr-FR')} MGA</TableCell>
                            <TableCell>{getStatusBadge(facture.statut)}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => onPreview(facture.id)}
                                        title="Prévisualiser"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => onDownload(facture.id)}
                                        title="Télécharger"
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => onSend(facture.id)}
                                        title="Envoyer"
                                        disabled={facture.statut === 'ENVOYEE' || facture.statut === 'PAYEE'}
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
