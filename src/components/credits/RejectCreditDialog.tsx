import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CreditRequest } from "@/types/credit"

interface RejectCreditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  credit: CreditRequest | null
  onReject: (reason: string) => void
  loading: boolean
}

export function RejectCreditDialog({ open, onOpenChange, credit, onReject, loading }: RejectCreditDialogProps) {
  const [reason, setReason] = React.useState("")

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (reason.trim()) {
      onReject(reason)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rejeter la demande de crédit</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir rejeter cette demande de crédit ?
              {credit && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm">ID: {credit.id}</p>
                  <p className="text-sm">Client: {credit.clientId}</p>
                  <p className="text-sm">Quantité: {credit.quantity}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motif du rejet *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
                placeholder="Veuillez indiquer le motif du rejet..."
                required
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" variant="destructive" disabled={!reason.trim() || loading}>
              {loading ? "En cours..." : "Confirmer le rejet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
