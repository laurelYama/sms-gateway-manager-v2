import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditRequest } from "@/types/credit"
import { API_BASE_URL } from "@/lib/config"
import { getToken } from "@/lib/auth"

interface RejectCreditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  credit: CreditRequest | null
  onReject: (reason: string) => void
  loading: boolean
}

interface MotifItem { refID: number; keyValue: string; value1: string }

export function RejectCreditDialog({ open, onOpenChange, credit, onReject, loading }: RejectCreditDialogProps) {
  const [motifs, setMotifs] = React.useState<MotifItem[]>([])
  const [selectedMotif, setSelectedMotif] = React.useState<string>("") // value1 ou 'AUTRES'
  const [customReason, setCustomReason] = React.useState("")
  const [loadingMotifs, setLoadingMotifs] = React.useState<boolean>(false)

  // Charger les motifs au moment de l'ouverture
  React.useEffect(() => {
    const fetchMotifs = async () => {
      try {
        setLoadingMotifs(true)
        const token = getToken()
        if (!token) return
        const res = await fetch(`${API_BASE_URL}/api/v1/referentiel/categorie/005`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        })
        if (!res.ok) throw new Error("Erreur API motifs")
        const data = await res.json()
        const parsed: MotifItem[] = (Array.isArray(data) ? data : []).map((d: any) => ({
          refID: d.refID,
          keyValue: d.keyValue,
          value1: d.value1,
        }))
        // Tri FR insensible aux accents/majuscules
        parsed.sort((a, b) => a.value1.localeCompare(b.value1, 'fr', { sensitivity: 'base' }))
        setMotifs(parsed)
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingMotifs(false)
      }
    }
    if (open) {
      fetchMotifs()
      // reset champs à l'ouverture
      setSelectedMotif("")
      setCustomReason("")
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmedCustom = customReason.trim()
    const finalReason = selectedMotif === 'AUTRES' ? trimmedCustom : selectedMotif
    if (!finalReason) return
    onReject(finalReason)
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
              <Label>Motif du rejet *</Label>
              <Select
                value={selectedMotif}
                onValueChange={(val) => setSelectedMotif(val)}
                disabled={loading || loadingMotifs}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingMotifs ? "Chargement..." : "Sélectionner un motif"} />
                </SelectTrigger>
                <SelectContent className="max-h-72 overflow-auto">
                  {motifs.map((m) => (
                    <SelectItem key={m.refID} value={m.value1}>{m.value1}</SelectItem>
                  ))}
                  <SelectItem value="AUTRES">Autres...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedMotif === 'AUTRES' && (
              <div className="space-y-2">
                <Label htmlFor="customReason">Motif personnalisé *</Label>
                <Textarea
                  id="customReason"
                  value={customReason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomReason(e.target.value)}
                  placeholder="Saisir le motif personnalisé"
                  required
                  disabled={loading}
                />
              </div>
            )}
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
            <Button
              type="submit"
              variant="destructive"
              disabled={loading || (!selectedMotif || (selectedMotif === 'AUTRES' && !customReason.trim()))}
            >
              {loading ? "En cours..." : "Confirmer le rejet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
