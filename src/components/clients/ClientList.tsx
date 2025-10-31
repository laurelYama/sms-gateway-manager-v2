import React from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Client } from "@/types/client"
import {
  Building,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Plus
} from "lucide-react"
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
                             onPageSizeChange,
                             searchQuery,
                             onAddClient
                           }: ClientListProps) {

  // Pagination côté client
  const startIndex = currentPage * pageSize
  const paginatedClients = clients.slice(startIndex, startIndex + pageSize)
  const startItem = clients.length > 0 ? startIndex + 1 : 0
  const endItem = Math.min(startIndex + pageSize, clients.length)

  // Export Excel
  const exportToExcel = () => {
    const dataToExport = clients.map(client => ({
      'ID': client.idclients,
      'Razón social': client.raisonSociale,
      'Correo electrónico': client.email || 'N/A',
      'Teléfono': client.telephone || 'N/A',
      'Ciudad': client.ville || 'N/A',
      'Sector': client.secteurActivite || 'N/A',
      'Estado': client.statutCompte === 'ACTIF' ? 'Activo' : 'Suspendido',
      'Saldo': client.soldeNet || 0,
      'Tipo de cuenta': client.typeCompte === 'POSTPAYE' ? 'Pospago' : 'Prepago',
      'Fecha de creación': client.dateCreation ? new Date(client.dateCreation).toLocaleDateString('es-ES') : 'N/A'
    }))

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes')
    XLSX.writeFile(wb, 'lista_clientes.xlsx')
  }

  // Skeleton loading
  if (loading) {
    return (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="rounded-md border overflow-x-hidden">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contactos</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Coste SMS</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 inline-block ml-2" />
                        <Skeleton className="h-8 w-8 inline-block ml-2" />
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
    )
  }

  // Si aucun client
  if (clients.length === 0) {
    return (
        <div className="text-center py-12">
          <Building className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron clientes</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery ? 'Ningún cliente coincide con su búsqueda.' : 'Comience por añadir un cliente.'}
          </p>
          <div className="mt-6">
            <Button onClick={onAddClient}>
              <Plus className="h-4 w-4 mr-2" />
              Añadir un cliente
            </Button>
          </div>
        </div>
    )
  }

  // Table principale
  return (
      <div className="rounded-md border overflow-x-auto">
        <div className="w-full min-w-full">
          <Table className="w-full min-w-[900px]">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contactos</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Coste SMS</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
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
                          <span className="text-sm">{client.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{client.telephone || 'N/A'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{client.ville || 'N/A'}</span>
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
                      {client.typeCompte === 'POSTPAYE' ? 'Pospago' : 'Prepago'}
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border-t bg-background overflow-x-hidden">
          <div className="text-sm text-muted-foreground">
            Mostrando {startItem} a {endItem} de {totalElements} cliente{totalElements !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                className="ml-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Pagination navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t w-full overflow-x-hidden">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium whitespace-nowrap">Filas por página</p>
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

          <div className="flex items-center gap-1">
            <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => onPageChange(0)}
                disabled={currentPage === 0}
                size="icon"
            >
              <span className="sr-only">Primera página</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 0}
                size="icon"
            >
              <span className="sr-only">Anterior</span>
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
              <span className="sr-only">Siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => onPageChange(totalPages - 1)}
                disabled={currentPage >= totalPages - 1}
                size="icon"
            >
              <span className="sr-only">Última página</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
  )
}
