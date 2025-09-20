import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import { Referentiel, REFERENTIEL_CATEGORIES } from "./types"
import { deleteReferential } from "@/lib/api/referentials"

export const columns = (
  onEdit: (referentiel: Referentiel) => void,
  onDeleteSuccess: () => void
): ColumnDef<Referentiel>[] => [
  {
    accessorKey: "keyValue",
    header: "Clé",
  },
  {
    accessorKey: "value1",
    header: "Valeur 1",
  },
  {
    accessorKey: "value2",
    header: "Valeur 2",
  },
  {
    accessorKey: "value3",
    header: "Valeur 3",
  },
  {
    accessorKey: "value4",
    header: "Valeur 4",
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
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(referentiel)}
            aria-label="Modifier"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            aria-label="Supprimer"
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  },
]
