import React from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Client } from "@/types/client"
import { Building, Mail, Phone, MapPin, Briefcase, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { ClientActions } from "./ClientActions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  
  const startItem = clients.length > 0 ? (currentPage * pageSize) + 1 : 0
  const endItem = Math.min((currentPage + 1) * pageSize, totalElements)
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  // Le message "Aucun client trouvé" est maintenant géré dans le composant parent

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Localisation</TableHead>
            <TableHead>Solde</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
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

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-4 border-t">
        <div className="text-sm text-muted-foreground">
          {totalElements > 0 ? (
            `${startItem}-${endItem} sur ${totalElements} client(s)`
          ) : (
            'Aucun client trouvé'
          )}
        </div>

        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Lignes par page</p>
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
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(0)}
              disabled={currentPage === 0}
            >
              <span className="sr-only">Première page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0}
            >
              <span className="sr-only">Page précédente</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center justify-center text-sm font-medium w-8">
              {currentPage + 1}
            </div>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
            >
              <span className="sr-only">Page suivante</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
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
