import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { API_BASE_URL } from "@/lib/config"

interface Client {
  idclients: string
  raisonSociale: string
  typeCompte: string
}

interface GenerateUserInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  token: string | null
}

export function GenerateUserInvoiceDialog({ open, onOpenChange, onSuccess, token }: GenerateUserInvoiceDialogProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'))

  useEffect(() => {
    if (open) {
      loadClients()
    }
  }, [open])

  const loadClients = async () => {
    if (!token) return
    
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/V1/clients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des clients')
      }

      const data = await response.json()
      setClients(data)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des clients')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!token || !selectedClient) {
      console.error('Token ou client manquant')
      return
    }

    try {
      setGenerating(true)
      
      // Construction de l'URL avec https
      const url = `https://api-smsgateway.solutech-one.com/api/V1/billing/facturer/${selectedClient}/${year}/${month.padStart(2, '0')}`
      console.log('URL de la requête:', url)
      
      // Préparation des options de la requête
      const options: RequestInit = {
        method: 'POST', // Changement en POST comme dans le curl d'origine
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({}), // Corps vide comme dans le curl d'origine
        credentials: 'include',
        mode: 'cors'
      }
      
      console.log('En-têtes de la requête:', {
        method: options.method,
        url,
        headers: options.headers,
        body: options.body
      })
      
      // Envoi de la requête
      const startTime = performance.now()
      const response = await fetch(url, options)
      const endTime = performance.now()
      
      const responseData = await response.json().catch(() => ({}))
      
      console.log('Réponse du serveur:', {
        status: response.status,
        statusText: response.statusText,
        duration: `${(endTime - startTime).toFixed(2)}ms`,
        url: response.url,
        redirected: response.redirected,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseData
      })

      if (!response.ok) {
        const errorMessage = responseData.message || `Erreur HTTP: ${response.status} ${response.statusText}`
        console.error('Détails de l\'erreur:', {
          status: response.status,
          message: errorMessage,
          details: responseData
        })
        throw new Error(errorMessage)
      }
      
      return responseData

      toast.success('Facture générée avec succès')
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la génération de la facture')
    } finally {
      setGenerating(false)
    }
  }

  const months = [
    { value: '01', label: 'Janvier' },
    { value: '02', label: 'Février' },
    { value: '03', label: 'Mars' },
    { value: '04', label: 'Avril' },
    { value: '05', label: 'Mai' },
    { value: '06', label: 'Juin' },
    { value: '07', label: 'Juillet' },
    { value: '08', label: 'Août' },
    { value: '09', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' },
  ]

  const years = Array.from({ length: 5 }, (_, i) => year - 2 + i)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Générer une facture client</DialogTitle>
          <DialogDescription>
            Sélectionnez un client et la période pour générer une facture.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="client" className="text-right">
              Client
            </Label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionnez un client" />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <div className="flex justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  clients
                    .filter(client => client.typeCompte === 'POSTPAYE')
                    .map(client => (
                      <SelectItem key={client.idclients} value={client.idclients}>
                        {client.raisonSociale}
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="month" className="text-right">
              Mois
            </Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionnez un mois" />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="year" className="text-right">
              Année
            </Label>
            <Select value={year.toString()} onValueChange={(value) => setYear(parseInt(value))}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionnez une année" />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={generating}
          >
            Annuler
          </Button>
          <Button 
            type="button" 
            onClick={handleGenerate}
            disabled={!selectedClient || generating}
          >
            {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Générer la facture
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
