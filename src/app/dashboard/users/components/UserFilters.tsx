import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Role = 'ADMIN' | 'SUPER_ADMIN' | 'AUDITEUR' | ''

interface UserFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  roleFilter: Role
  onRoleFilterChange: (value: Role) => void
  onAddUser: () => void
}

export function UserFilters({ 
  searchQuery, 
  onSearchChange, 
  roleFilter, 
  onRoleFilterChange, 
  onAddUser 
}: UserFiltersProps) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="w-full sm:w-1/3">
          <Input
            type="search"
            placeholder="Rechercher par nom, email ou téléphone..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full sm:w-1/3">
          <Select
            value={roleFilter === '' ? 'all' : roleFilter}
            onValueChange={(value: string) => onRoleFilterChange(value === 'all' ? '' : value as Role)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tous les rôles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              <SelectItem value="ADMIN">Administrateur</SelectItem>
              <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              <SelectItem value="AUDITEUR">Auditeur</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={onAddUser} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un utilisateur
        </Button>
      </div>
    </div>
  )
}
