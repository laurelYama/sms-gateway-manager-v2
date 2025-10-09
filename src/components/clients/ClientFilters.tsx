import { RefreshCw, Filter, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth"

interface ClientFiltersProps {
  statusFilter: "ALL" | "ACTIF" | "SUSPENDU"
  onStatusFilterChange: (status: "ALL" | "ACTIF" | "SUSPENDU") => void
  onRefresh: () => void
  onAddClient: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function ClientFilters({
  statusFilter,
  onStatusFilterChange,
  onRefresh,
  onAddClient,
  searchQuery,
  onSearchChange,
}: ClientFiltersProps) {
  const { user } = useAuth()
  const canAddClient = user?.role !== 'AUDITEUR'

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold">Gestion des Clients</h1>
        <p className="text-gray-600">Liste des clients enregistrés sur la plateforme</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <div className="relative">
          <Input
            placeholder="Rechercher un client..."
            className="w-full sm:w-64"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          {canAddClient && (
            <Button onClick={onAddClient} className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un client
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            title="Actualiser"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="whitespace-nowrap">
                <Filter className="h-4 w-4 mr-2" />
                Statut: {statusFilter === "ALL" ? "Tous" : statusFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onStatusFilterChange("ALL")}>
                Tous les statuts
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusFilterChange("ACTIF")}>
                Actifs uniquement
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusFilterChange("SUSPENDU")}>
                Suspendus uniquement
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
