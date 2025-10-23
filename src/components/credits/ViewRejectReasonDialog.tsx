import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { CreditRequest } from "@/types/credit"
import { format } from "date-fns"
import { fr } from 'date-fns/locale/fr'

interface ViewRejectReasonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  credit: CreditRequest | null
}

export function ViewRejectReasonDialog({ open, onOpenChange, credit }: ViewRejectReasonDialogProps) {
  if (!credit || !credit.rejectReason) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Motif du rejet</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Détails de la demande :</p>
            <div className="bg-muted/20 p-4 rounded-lg space-y-1">
              <p className="text-sm"><span className="font-medium">ID :</span> {credit.id.substring(0, 8)}...</p>
              <p className="text-sm"><span className="font-medium">Client :</span> {credit.clientId}</p>
              <p className="text-sm"><span className="font-medium">Nbr SMS :</span> {credit.quantity}</p>
              <p className="text-sm">
                <span className="font-medium">Date :</span>{" "}
                {credit.createdAt ? (
                  format(new Date(credit.createdAt), 'PPpp')
                ) : (
                  <span className="text-muted-foreground">Non disponible</span>
                )}
              </p>
            </div>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Motif du rejet</AlertTitle>
            <AlertDescription className="mt-2">
              {credit.rejectReason}
            </AlertDescription>
          </Alert>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => onOpenChange(false)}
            >
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
