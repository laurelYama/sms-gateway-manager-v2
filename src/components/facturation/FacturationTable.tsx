import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download, Send, Eye, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
    sending?: Record<string, boolean>
}

export function FacturationTable({ factures, onPreview, onDownload, onSend, loading = false, sending = {} }: FacturationTableProps) {

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
                        <TableHead>ID facture</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Période</TableHead>
                        <TableHead>Consommation</TableHead>
                        <TableHead>Prix unitaire</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead className="w-40">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {factures.map((facture) => (
                        <TableRow key={facture.id}>
                            <TableCell className="font-mono text-xs" title={facture.id}>
                                {facture.id.substring(0, 8)}
                            </TableCell>
                            <TableCell className="font-medium">{facture.clientNom}</TableCell>
                            <TableCell>
                                {formatDate(facture.dateDebut)} - {formatDate(facture.dateFin)}
                            </TableCell>
                            <TableCell>{facture.consommationSms} SMS</TableCell>
                            <TableCell>{facture.prixUnitaire.toLocaleString('fr-FR')} F CFA</TableCell>
                            <TableCell>{facture.montant.toLocaleString('fr-FR')} F CFA</TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Ouvrir le menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem 
                                            onClick={() => onPreview(facture.id)}
                                            className="cursor-pointer"
                                        >
                                            <Eye className="mr-2 h-4 w-4" />
                                            Prévisualiser
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                            onClick={() => onDownload(facture.id)}
                                            className="cursor-pointer"
                                        >
                                            <Download className="mr-2 h-4 w-4" />
                                            Télécharger
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                            onClick={() => onSend(facture.id)}
                                            disabled={facture.statut === 'ENVOYEE' || facture.statut === 'PAYEE' || sending[facture.id]}
                                            className="cursor-pointer"
                                        >
                                            {sending[facture.id] ? (
                                                <div className="mr-2 h-4 w-4 animate-spin border-2 border-primary border-t-transparent rounded-full" />
                                            ) : (
                                                <Send className="mr-2 h-4 w-4" />
                                            )}
                                            Envoyer
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
