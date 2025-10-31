import { useState } from 'react';
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
import { toast } from "sonner"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"

export const columns = (
  onEdit: (referentiel: Referentiel) => void,
  onDeleteSuccess: () => void
): ColumnDef<Referentiel>[] => [
  {
    accessorKey: "keyValue",
    header: "Clave",
    cell: ({ row }) => {
      const value = row.getValue("keyValue") as string
      return value || '-'
    },
  },
  {
    accessorKey: "value1",
    header: "Valor 1",
    cell: ({ row }) => {
      const value = row.getValue("value1") as string
      return value || '-'
    },
  },
  {
    accessorKey: "value2",
    header: "Valor 2",
    cell: ({ row }) => {
      const value = row.getValue("value2") as string
      return value || '-'
    },
  },
  {
    accessorKey: "value3",
    header: "Valor 3",
    cell: ({ row }) => {
      const value = row.getValue("value3") as string
      return value || '-'
    },
  },
  {
    accessorKey: "value4",
    header: "Valor 4",
    cell: ({ row }) => {
      const value = row.getValue("value4") as string
      return value || '-'
    },
  },
  {
    accessorKey: "refCategory",
    header: "Categoría",
    cell: ({ row }) => {
      const category = row.getValue("refCategory") as string
      return REFERENTIEL_CATEGORIES[category] || category
    },
  },
  {
    id: "actions",
    cell: function ActionsCell({ row }) {
      const referentiel = row.original;
      const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
      const [isDeleting, setIsDeleting] = useState(false);
      
      console.log('Données du référentiel dans la cellule:', referentiel);
      
      if (!referentiel || Object.keys(referentiel).length === 0) {
        console.error('Referencial vacío o inválido en la celda:', row);
        return null;
      }

      const handleDelete = async () => {
        if (!referentiel.refID) {
          toast.error("No se puede eliminar esta referencia: falta el refID");
          return;
        }

        try {
          setIsDeleting(true);
          await deleteReferential(referentiel.refID);
          onDeleteSuccess();
          toast.success("La referencia ha sido eliminada con éxito.");
        } catch (error) {
          console.error("Erreur lors de la suppression:", error);
          toast.error(error instanceof Error ? error.message : "Ocurrió un error al eliminar.");
        } finally {
          setIsDeleting(false);
          setIsDeleteDialogOpen(false);
        }
      };

      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => {
                  if (!referentiel.refID) {
                    console.error('Tentative d\'édition d\'un référentiel sans refID:', referentiel);
                    toast.error("No se puede modificar esta referencia: falta el refID");
                    return;
                  }
                  onEdit(referentiel);
                }}
                className="cursor-pointer"
              >
                <Pencil className="mr-2 h-4 w-4" />
                <span>Modificar</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-red-600 cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Eliminar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DeleteConfirmationDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onConfirm={handleDelete}
            title="Eliminar referencia"
            description="¿Está seguro de que desea eliminar esta referencia? Esta acción no se puede deshacer."
            confirmText="Eliminar"
            cancelText="Cancelar"
            loading={isDeleting}
          />
        </div>
      );
    },
  },
];
