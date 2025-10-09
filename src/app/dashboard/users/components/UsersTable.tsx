'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Edit, Trash2, Loader2, Pause, Play, Archive, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Manager, UserStatus } from "../types"
import { useAuth } from "@/lib/auth"
import { canEdit, canDelete, canSuspend } from "@/lib/permissions"

interface UsersTableProps {
  managers: Manager[]
  loading: boolean
  onEdit: (id: string) => void
  onSuspend: (id: string) => void
  onReactivate: (id: string) => void
  onArchive: (id: string) => void
  currentPage: number
  totalPages: number
  totalElements: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function UsersTable({ 
  managers, 
  loading, 
  onEdit, 
  onSuspend, 
  onReactivate, 
  onArchive, 
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange
}: UsersTableProps) {
    // Fonction pour obtenir les numéros de page à afficher
    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5; // Nombre maximum de boutons de page à afficher
      
      if (totalPages <= maxVisiblePages) {
        // Moins de pages que le maximum visible, toutes les afficher
        for (let i = 0; i < totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Afficher les premières pages, la page actuelle et les dernières pages
        let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = startPage + maxVisiblePages - 1;
        
        if (endPage >= totalPages) {
          endPage = totalPages - 1;
          startPage = Math.max(0, endPage - maxVisiblePages + 1);
        }
        
        // Ajouter les numéros de page
        for (let i = startPage; i <= endPage; i++) {
          pages.push(i);
        }
      }
      
      return pages;
    };
    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'SUPER_ADMIN':
                return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Super Admin</Badge>
            case 'ADMIN':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Administrateur</Badge>
            case 'MANAGER':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Gestionnaire</Badge>
            case 'AUDITEUR':
                return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Auditeur</Badge>
            default:
                return <Badge variant="outline">{role || 'Non défini'}</Badge>
        }
    }

    const getStatusBadge = (manager: Manager) => {
        // Utiliser statutCompte comme source principale, avec fallback sur etat et status
        const status = manager.statutCompte || manager.etat || manager.status;
        
        switch (status?.toUpperCase()) {
            case 'ACTIF':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Actif</Badge>
            case 'SUSPENDU':
                return <Badge variant="destructive">Suspendu</Badge>
            case 'ARCHIVE':
            case 'ARCHIVÉ':
                return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">Archivé</Badge>
            case 'INACTIF':
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Inactif</Badge>
            default:
                return status 
                    ? <Badge variant="outline">{status}</Badge>
                    : <Badge variant="outline">Inconnu</Badge>
        }
    }
    
    // Vérifie si l'utilisateur est actif
    const { user: currentUser } = useAuth();
    
    const isUserActive = (manager: Manager) => {
        const status = (manager.statutCompte || manager.etat || '').toUpperCase();
        return status === 'ACTIF';
    }
    
    // Vérifie si l'utilisateur actuel peut effectuer des actions
    const canPerformActions = currentUser?.role !== 'AUDITEUR';

    if (loading && managers.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <span>Chargement...</span>
            </div>
        )
    }

    if (managers.length === 0) {
        return (
            <div className="text-center py-12 border rounded-lg">
                <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
            </div>
        )
    }

    return (
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="w-40">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading && managers.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                                <p>Chargement des utilisateurs...</p>
                            </TableCell>
                        </TableRow>
                    ) : managers.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                                <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
                            </TableCell>
                        </TableRow>
                    ) : (
                        managers.map((manager) => (
                            <TableRow key={manager.idManager}>
                                <TableCell className="font-medium">{manager.prenomManager} {manager.nomManager}</TableCell>
                                <TableCell>{manager.email}</TableCell>
                                <TableCell>{manager.numeroTelephoneManager}</TableCell>
                                <TableCell>{getRoleBadge(manager.role)}</TableCell>
                                <TableCell>{getStatusBadge(manager)}</TableCell>
                                <TableCell>
                                    {canPerformActions ? (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Ouvrir le menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                {canEdit(currentUser) && (
                                                    <DropdownMenuItem 
                                                        onClick={() => onEdit(manager.idManager)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Modifier
                                                    </DropdownMenuItem>
                                                )}
                                                
                                                {canSuspend(currentUser) && isUserActive(manager) ? (
                                                    <DropdownMenuItem 
                                                        onClick={() => onSuspend(manager.idManager)}
                                                        className="cursor-pointer text-amber-600"
                                                    >
                                                        <Pause className="mr-2 h-4 w-4" />
                                                        Suspendre
                                                    </DropdownMenuItem>
                                                ) : canSuspend(currentUser) && !isUserActive(manager) ? (
                                                    <DropdownMenuItem 
                                                        onClick={() => onReactivate(manager.idManager)}
                                                        className="cursor-pointer text-green-600"
                                                    >
                                                        <Play className="mr-2 h-4 w-4" />
                                                        Activer
                                                    </DropdownMenuItem>
                                                ) : null}
                                                
                                                {canDelete(currentUser) && manager.status !== 'ARCHIVED' && (
                                                    <DropdownMenuItem 
                                                        onClick={() => onArchive(manager.idManager)}
                                                        className="cursor-pointer text-blue-600"
                                                    >
                                                        <Archive className="mr-2 h-4 w-4" />
                                                        Archiver
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
                        ))
                    )}
                </TableBody>
            </Table>
            
            {/* Pagination */}
            <div className="flex items-center justify-between px-2 py-4">
                <div className="flex items-center space-x-2">
                    <p className="text-sm text-muted-foreground">
                        {totalElements > 0 
                            ? `${(currentPage * pageSize) + 1}-${Math.min((currentPage + 1) * pageSize, totalElements)} sur ${totalElements} utilisateur(s)`
                            : 'Aucun utilisateur trouvé'}
                    </p>
                    
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
                    <p className="text-sm text-muted-foreground">par page</p>
                </div>
                
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex"
                        onClick={() => onPageChange(0)}
                        disabled={currentPage === 0}
                    >
                        <span className="sr-only">Aller à la première page</span>
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
                    
                    {/* Boutons de pagination */}
                    {getPageNumbers().map((pageNum) => (
                        <Button
                            key={pageNum}
                            variant={pageNum === currentPage ? "default" : "outline"}
                            className="h-8 w-8 p-0"
                            onClick={() => onPageChange(pageNum)}
                            disabled={loading}
                        >
                            {pageNum + 1}
                        </Button>
                    ))}
                    
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages - 1 || loading}
                    >
                        <span className="sr-only">Page suivante</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex"
                        onClick={() => onPageChange(totalPages - 1)}
                        disabled={currentPage >= totalPages - 1 || loading}
                    >
                        <span className="sr-only">Aller à la dernière page</span>
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
