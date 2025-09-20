import { MoreHorizontal, Edit, Pause, Play, FileText, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Client } from "@/types/client"

interface ClientActionsProps {
  client: Client
  onEdit: (client: Client) => void
  onToggleStatus: (client: Client) => void
}

export function ClientActions({ client, onEdit, onToggleStatus }: ClientActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Ouvrir le menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onEdit(client)}>
          <Edit className="mr-2 h-4 w-4" />
          <span>Modifier</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onToggleStatus(client)}
          className={client.statutCompte === 'ACTIF' ? 'text-amber-600' : 'text-green-600'}
        >
          {client.statutCompte === 'ACTIF' ? (
            <>
              <Pause className="mr-2 h-4 w-4" />
              <span>Suspendre</span>
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              <span>Activer</span>
            </>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Détails</DropdownMenuLabel>
        
        <div className="px-2 py-1.5 text-sm space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>NIF: {client.nif || 'Non renseigné'}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>RCCM: {client.rccm || 'Non renseigné'}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            <span>Type: {client.typeCompte === 'POSTPAYE' ? 'Postpayé' : 'Prépayé'}</span>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
