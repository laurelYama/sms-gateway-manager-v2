import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoreHorizontal, CheckCircle, XCircle, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from "lucide-react"
import { CreditRequest } from "@/types/credit"
import { CreditStatusBadge } from "./CreditStatusBadge"
import React, { useEffect, useState } from "react"
import { getClientById, ClientInfo } from "@/lib/client-utils"
import { useAuth } from "@/lib/auth"
import { canApprove, canReject } from "@/lib/permissions"

interface CreditListProps {
  credits: CreditRequest[]
  loading: boolean
  onApprove: (id: string) => void
  onReject: (credit: CreditRequest) => void
  onViewReason: (credit: CreditRequest) => void
  currentPage: number
  totalPages: number
  totalElements: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  approveLoading?: Record<string, boolean>
}

export function CreditList({ 
  credits, 
  loading, 
  onApprove, 
  onReject, 
  onViewReason,
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
  approveLoading = {}
}: CreditListProps) {
  const [clients, setClients] = useState<Record<string, ClientInfo>>({})
  const [loadingClients, setLoadingClients] = useState<boolean>(false)
  const { user } = useAuth()
  const canPerformActions = user?.role !== 'AUDITEUR'
  
  // Cargar información de clientes faltantes
  useEffect(() => {
    const loadMissingClients = async () => {
      // Filtrar créditos que aún no tienen datos de cliente cargados
      const missingClientIds = credits
        .filter(credit => !clients[credit.clientId])
        .map(credit => credit.clientId)
      
      if (missingClientIds.length === 0) return
      
      setLoadingClients(true)
      try {
        // Cargar clientes faltantes en lotes de 10 para evitar solicitudes excesivas
        const batchSize = 10
        for (let i = 0; i < missingClientIds.length; i += batchSize) {
          const batch = missingClientIds.slice(i, i + batchSize)
          const newClients = await Promise.all(
            batch.map(id => getClientById(id))
          )
          
          // Actualizar el estado con los nuevos clientes
          setClients(prevClients => ({
            ...prevClients,
            ...newClients.reduce((acc, client) => {
              if (client) acc[client.idclients] = client
              return acc
            }, {} as Record<string, ClientInfo>)
          }))
        }
      } catch (error) {
        console.error("Error al cargar los clientes:", error)
      } finally {
        setLoadingClients(false)
      }
    }
    
    loadMissingClients()
  }, [credits])
  
  const startItem = credits.length > 0 ? (currentPage * pageSize) + 1 : 0
  const endItem = Math.min((currentPage + 1) * pageSize, totalElements)
  if (loading && credits.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted/20 rounded-lg" />
        ))}
      </div>
    )
  }

  if (credits.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground">No se encontraron solicitudes de crédito</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Cantidad</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha de creación</TableHead>
            <TableHead>Fecha de validación</TableHead>
            <TableHead>Validado por</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {credits.map((credit) => (
            <TableRow key={credit.id}>
              <TableCell className="font-mono text-sm">{credit.requestCode}</TableCell>
              <TableCell>
                {loadingClients && !clients[credit.clientId] 
                  ? 'Cargando...' 
                  : clients[credit.clientId]?.raisonSociale || credit.clientId}
              </TableCell>
              <TableCell>{credit.quantity}</TableCell>
              <TableCell>
                <CreditStatusBadge status={credit.status} />
              </TableCell>
              <TableCell>
                {credit.createdAt ? (
                  new Date(credit.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {credit.validatedAt ? (
                  new Date(credit.validatedAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {credit.checkerEmail || '-'}
              </TableCell>
              <TableCell>
                {canPerformActions ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      {canApprove(user) && (
                        <DropdownMenuItem
                          onClick={() => onApprove(credit.id)}
                          disabled={credit.status !== 'PENDING' || approveLoading[credit.id]}
                          className="cursor-pointer"
                        >
                          {approveLoading[credit.id] ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Procesando...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Aprobar
                            </>
                          )}
                        </DropdownMenuItem>
                      )}
                      {canReject(user) && (
                        <DropdownMenuItem
                          onClick={() => onReject(credit)}
                          disabled={credit.status !== 'PENDING'}
                          className="cursor-pointer"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Rechazar
                        </DropdownMenuItem>
                      )}
                      {credit.status === 'REJECTED' && credit.rejectReason && (
                        <DropdownMenuItem
                          onClick={() => onViewReason(credit)}
                          className="cursor-pointer"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver motivo
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button variant="ghost" className="h-8 w-8 p-0" disabled>
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-sm text-muted-foreground">
          Mostrando {startItem} a {endItem} de {totalElements} solicitudes
        </div>
        
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Filas por página</p>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[5, 10, 20, 30, 40, 50].map((size) => (
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
              onClick={() => onPageChange(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
            >
              <span className="sr-only">Page précédente</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center justify-center w-8 h-8 text-sm font-medium border rounded-md">
              {currentPage + 1}
            </div>
            
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
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
