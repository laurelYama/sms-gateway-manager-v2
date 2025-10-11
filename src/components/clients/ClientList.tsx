import React from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Client } from "@/types/client"
import { Building, Mail, Phone, MapPin, Briefcase, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download } from "lucide-react"
import { ClientActions } from "./ClientActions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import * as XLSX from 'xlsx';

interface ClientListProps {
  clients: Client[]
  onEdit: (client: Client) => void
  onToggleStatus: (client: Client) => void
  loading: boolean
  getStatusBadge: (status: string) => React.ReactNode
  formatCurrency: (amount: number) => React.ReactNode
  currentPage: number
  totalPages: number
  totalElements: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
  onAddClient?: () => void
  calculateMonthlyBalance?: (client: Client) => string
}

export function ClientList({
  clients,
  onEdit,
  onToggleStatus,
  loading,
  getStatusBadge,
  formatCurrency,
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange
}: ClientListProps) {

  // Calculer les éléments à afficher pour la pagination côté client
  const startIndex = currentPage * pageSize
  const paginatedClients = clients.slice(startIndex, startIndex + pageSize)

  const startItem = clients.length > 0 ? startIndex + 1 : 0
  const endItem = Math.min(startIndex + pageSize, clients.length)

  const exportToExcel = () => {
    // Créer un nouveau classeur Excel
    const wb = XLSX.utils.book_new();

    // Préparer les données pour l'export
    const data = [
      ['Raison sociale', 'Secteur', 'Email', 'Téléphone', 'Ville', 'Adresse', 'Solde', 'Type de compte', 'Statut', 'Coût unitaire SMS', 'Coût total SMS']
    ];

    // Ajouter les données des clients
    clients.forEach(client => {
      data.push([
        client.raisonSociale,
        client.secteurActivite,
        client.email,
        client.telephone,
        client.ville,
        client.adresse,
        client.soldeNet || 0,
        client.typeCompte === 'POSTPAYE' ? 'Postpayé' : 'Prépayé',
        client.statutCompte,
        client.coutSmsTtc || 0,
        client.coutSmsTtc ? (client.coutSmsTtc * (client.soldeNet || 0)) : 0
      ]);
    });

    // Créer la feuille de calcul
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Définir les largeurs de colonnes
    ws['!cols'] = [
      { wch: 30 }, // Raison sociale
      { wch: 25 }, // Secteur
      { wch: 30 }, // Email
      { wch: 20 }, // Téléphone
      { wch: 20 }, // Ville
      { wch: 30 }, // Adresse
      { wch: 15 }, // Solde
      { wch: 15 }, // Type de compte
      { wch: 15 }, // Statut
      { wch: 20 }, // Coût unitaire
      { wch: 20 }  // Coût total
    ];

    // Ajouter la feuille au classeur
    XLSX.utils.book_append_sheet(wb, ws, 'Clients');

    // Générer le fichier Excel avec la date dans le nom
    const date = new Date();
    const formattedDate = date.toISOString().split('T')[0];
    XLSX.writeFile(wb, `Liste_Clients_${formattedDate}.xlsx`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end mb-4">
          <Button
            onClick={exportToExcel}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exporter en Excel
          </Button>
        </div>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  // Le message "Aucun client trouvé" est maintenant géré dans le composant parent

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="w-full overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="min-w-[200px]">Client</TableHead>
              <TableHead className="min-w-[180px]">Contact</TableHead>
              <TableHead className="min-w-[180px]">Localisation</TableHead>
              <TableHead className="whitespace-nowrap">Solde</TableHead>
              <TableHead className="whitespace-nowrap">Coût SMS</TableHead>
              <TableHead className="whitespace-nowrap">Statut</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
        <TableBody>
          {paginatedClients.map((client) => (
            <TableRow key={client.idclients}>
              <TableCell>
                <div className="font-medium flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  {client.raisonSociale}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Briefcase className="h-3 w-3" />
                  {client.secteurActivite}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{client.email || 'Non renseigné'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{client.telephone || 'Non renseigné'}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{client.ville || 'Non renseignée'}</span>
                </div>
                {client.adresse && (
                  <div className="text-sm text-muted-foreground truncate max-w-xs">
                    {client.adresse}
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  {formatCurrency(client.soldeNet || 0)}
                  <span className="text-xs text-muted-foreground">
                    {client.typeCompte === 'POSTPAYE' ? 'Postpayé' : 'Prépayé'}
                  </span>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {client.coutSmsTtc ? (
                  formatCurrency(client.coutSmsTtc * (client.soldeNet || 0)) + ' FCFA'
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {getStatusBadge(client.statutCompte)}
              </TableCell>
              <TableCell className="text-right">
                <ClientActions
                  client={client}
                  onEdit={onEdit}
                  onToggleStatus={onToggleStatus}
                />
              </TableCell>
            </TableRow>
          ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-2 sm:px-4 py-2 border-t gap-2">
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {clients.length > 0 && (
              `${startItem}-${endItem} sur ${totalElements}`
            )}
          </div>
          <Button
            onClick={exportToExcel}
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs sm:text-sm"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">Exporter</span>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 w-full sm:w-auto">
          <div className="flex items-center justify-between w-full sm:w-auto gap-2">
            <p className="text-sm font-medium whitespace-nowrap">Lignes/page</p>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[5, 10, 20, 30, 50].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between w-full sm:w-auto gap-1">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(0)}
              disabled={currentPage === 0}
              size="icon"
            >
              <span className="sr-only">Première page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0}
              size="icon"
            >
              <span className="sr-only">Précédent</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center justify-center text-sm font-medium w-12">
              {currentPage + 1} / {Math.max(1, totalPages)}
            </div>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              size="icon"
            >
              <span className="sr-only">Suivant</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
              size="icon"
            >
              <span className="sr-only">Dernière page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
