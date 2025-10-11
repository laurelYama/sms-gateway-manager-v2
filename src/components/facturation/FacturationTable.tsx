import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download, Send, Eye, MoreHorizontal, ChevronDown, ChevronUp } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState } from "react"

// Formatage de date personnalisé pour le français
const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('fr-FR', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
    }).format(d);
}

// Formatage monétaire
const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

import { Facture } from "./types"

// Composant pour afficher une ligne de facture en mode mobile
const MobileFactureRow = ({ facture, onPreview, onDownload, onSend, sending }: { 
    facture: Facture, 
    onPreview: (id: string) => void, 
    onDownload: (id: string) => void, 
    onSend: (id: string) => void, 
    sending: Record<string, boolean> 
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    return (
        <div className="border-b p-4 space-y-3">
            <div className="flex justify-between items-center">
                <div>
                    <div className="font-medium">{facture.clientNom}</div>
                    <div className="text-sm text-muted-foreground">
                        {formatDate(facture.dateDebut)} - {formatDate(facture.dateFin)}
                    </div>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-8 w-8"
                >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
            </div>
            
            {isExpanded && (
                <div className="space-y-2 pt-2 border-t">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="text-sm">
                            <div className="text-muted-foreground">Consommation</div>
                            <div>{facture.consommationSms} SMS</div>
                        </div>
                        <div className="text-sm">
                            <div className="text-muted-foreground">Prix unitaire</div>
                            <div>{formatMoney(facture.prixUnitaire)} FCFA</div>
                        </div>
                        <div className="text-sm">
                            <div className="text-muted-foreground">Montant</div>
                            <div className="font-medium">{formatMoney(facture.montant)} FCFA</div>
                        </div>
                        <div className="text-sm">
                            <div className="text-muted-foreground">Statut</div>
                            <div className="capitalize">{facture.statut.toLowerCase()}</div>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => onPreview(facture.id)}
                        >
                            <Eye className="h-4 w-4 mr-2" /> Voir
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => onDownload(facture.id)}
                        >
                            <Download className="h-4 w-4 mr-2" /> PDF
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => onSend(facture.id)}
                            disabled={facture.statut === 'ENVOYEE' || facture.statut === 'PAYEE' || sending[facture.id]}
                        >
                            {sending[facture.id] ? (
                                <div className="h-4 w-4 animate-spin border-2 border-primary border-t-transparent rounded-full mr-2" />
                            ) : (
                                <Send className="h-4 w-4 mr-2" />
                            )}
                            Envoyer
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

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

    // Affichage mobile
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
        return (
            <div className="border rounded-lg divide-y">
                {factures.map((facture) => (
                    <MobileFactureRow 
                        key={facture.id}
                        facture={facture}
                        onPreview={onPreview}
                        onDownload={onDownload}
                        onSend={onSend}
                        sending={sending || {}}
                    />
                ))}
            </div>
        );
    }

    // Affichage desktop
    return (
        <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="whitespace-nowrap">ID facture</TableHead>
                            <TableHead className="min-w-[180px]">Client</TableHead>
                            <TableHead className="min-w-[180px]">Période</TableHead>
                            <TableHead className="whitespace-nowrap">Consommation</TableHead>
                            <TableHead className="whitespace-nowrap">Prix unitaire</TableHead>
                            <TableHead className="whitespace-nowrap">Montant</TableHead>
                            <TableHead className="w-40 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {factures.map((facture) => (
                            <TableRow key={facture.id}>
                                <TableCell className="font-mono text-xs" title={facture.id}>
                                    {facture.id.substring(0, 8)}
                                </TableCell>
                                <TableCell className="font-medium">{facture.clientNom}</TableCell>
                                <TableCell className="whitespace-nowrap">
                                    {formatDate(facture.dateDebut)} - {formatDate(facture.dateFin)}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">{facture.consommationSms} SMS</TableCell>
                                <TableCell className="whitespace-nowrap">{formatMoney(facture.prixUnitaire)} FCFA</TableCell>
                                <TableCell className="font-medium whitespace-nowrap">{formatMoney(facture.montant)} FCFA</TableCell>
                                <TableCell className="text-right">
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
        </div>
    )
}
