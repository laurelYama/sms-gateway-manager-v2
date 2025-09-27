import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, MoreHorizontal } from "lucide-react"
import { Referentiel, REFERENTIEL_CATEGORIES } from "./types"
import { deleteReferential } from "@/lib/api/referentials"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const columns = (
  onEdit: (referentiel: Referentiel) => void,
  onDeleteSuccess: () => void
): ColumnDef<Referentiel>[] => [
  {
    accessorKey: "keyValue",
    header: "Clé",
    cell: ({ row }) => {
      const value = row.getValue("keyValue") as string
      return value || '-'
    },
  },
  {
    accessorKey: "value1",
    header: "Valeur 1",
    cell: ({ row }) => {
      const value = row.getValue("value1") as string
      return value || '-'
    },
  },
  {
    accessorKey: "value2",
    header: "Valeur 2",
    cell: ({ row }) => {
      const value = row.getValue("value2") as string
      return value || '-'
    },
  },
  {
    accessorKey: "value3",
    header: "Valeur 3",
    cell: ({ row }) => {
      const value = row.getValue("value3") as string
      return value || '-'
    },
  },
  {
    accessorKey: "value4",
    header: "Valeur 4",
    cell: ({ row }) => {
      const value = row.getValue("value4") as string
      return value || '-'
    },
  },
  {
    accessorKey: "refCategory",
    header: "Catégorie",
    cell: ({ row }) => {
      const category = row.getValue("refCategory") as string
      return REFERENTIEL_CATEGORIES[category] || category
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const referentiel = row.original

      const handleDelete = async () => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce référentiel ?")) {
          try {
            await deleteReferential(referentiel.id!)
            onDeleteSuccess()
          } catch (error) {
            console.error("Erreur lors de la suppression:", error)
            alert("Une erreur est survenue lors de la suppression.")
          }
        }
      }

      return (
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
              onClick={() => onEdit(referentiel)}
              className="cursor-pointer"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleDelete}
              className="cursor-pointer text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
