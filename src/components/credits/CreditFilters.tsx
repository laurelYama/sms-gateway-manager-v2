import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface CreditFiltersProps {
  statusFilter: "ALL" | "PENDING" | "APPROVED" | "REJECTED"
  onStatusFilterChange: (status: "ALL" | "PENDING" | "APPROVED" | "REJECTED") => void
  onRefresh: () => void
  loading: boolean
}

export function CreditFilters({
  statusFilter,
  onStatusFilterChange,
  onRefresh,
  loading
}: CreditFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold">Commandes de SMS</h1>
        <p className="text-gray-600">Compte prépayé</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Statut :</span>
          <Select
            value={statusFilter}
            onValueChange={onStatusFilterChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous</SelectItem>
              <SelectItem value="PENDING">En attente</SelectItem>
              <SelectItem value="APPROVED">Approuvés</SelectItem>
              <SelectItem value="REJECTED">Rejetés</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={loading}
          title="Actualiser"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
