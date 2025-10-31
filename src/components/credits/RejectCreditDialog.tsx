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
        const res = await fetch(`${API_BASE_URL}/api/V1/referentiel/categorie/005`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        })
        if (!res.ok) throw new Error("Erreur API motifs")
        const data = await res.json()
        const parsed: MotifItem[] = (Array.isArray(data) ? data : []).map((d: unknown) => {
          if (!d || typeof d !== 'object') return { refID: 0, keyValue: '', value1: '' } as MotifItem;
          const dd = d as { refID?: unknown; keyValue?: unknown; value1?: unknown };
          return {
            refID: typeof dd.refID === 'number' ? dd.refID : Number(dd.refID) || 0,
            keyValue: typeof dd.keyValue === 'string' ? dd.keyValue : String(dd.keyValue || ''),
            value1: typeof dd.value1 === 'string' ? dd.value1 : String(dd.value1 || ''),
          } as MotifItem;
        })
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
            <DialogTitle>Rechazar la solicitud de crédito</DialogTitle>
            <div className="text-sm text-muted-foreground">
              ¿Está seguro de que desea rechazar esta solicitud de crédito?
              {credit && (
                <div className="mt-2 space-y-1">
                  <div className="text-sm">
                    <Label className="mt-4">Otro motivo (si es necesario)</Label> {credit.requestCode || `${credit.id.substring(0, 8)}...`}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Núm. de SMS:</span> {credit.quantity}
                  </div>
                </div>
              )}
            </div>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Motivo del rechazo *</Label>
              <Select
                value={selectedMotif}
                onValueChange={(val) => setSelectedMotif(val)}
                disabled={loading || loadingMotifs}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingMotifs ? "Cargando..." : "Seleccionar un motivo"} />
                </SelectTrigger>
                <SelectContent className="max-h-72 overflow-auto">
                  {motifs.map((m) => (
                    <SelectItem key={m.refID} value={m.value1}>{m.value1}</SelectItem>
                  ))}
                  <SelectItem value="AUTRES">Otros...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedMotif === 'AUTRES' && (
              <div className="space-y-2">
                <Label htmlFor="customReason">Motivo personalizado *</Label>
                <Textarea
                  id="customReason"
                  value={customReason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomReason(e.target.value)}
                  placeholder="Ingrese el motivo personalizado"
                  required
                  disabled={loading}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!selectedMotif || (selectedMotif === 'AUTRES' && !customReason.trim()) || loading}>
              {loading ? 'Procesando...' : 'Confirmar rechazo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
