import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Save, X } from "lucide-react"
import { toast } from "sonner"
import { Client, CreateClientForm, EditClientForm, ReferentielItem } from "@/types/client"

interface ClientFormProps {
  mode: 'create' | 'edit'
  initialData: Partial<CreateClientForm>
  onSave: (data: CreateClientForm) => void
  onClose: () => void
  villes: ReferentielItem[]
  secteurs: ReferentielItem[]
  pays: ReferentielItem[]
}

export function ClientForm({ mode, initialData, onSave, onClose, villes, secteurs, pays }: ClientFormProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<CreateClientForm>({
    raisonSociale: initialData.raisonSociale || "",
    secteurActivite: initialData.secteurActivite || "",
    ville: initialData.ville || "",
    adresse: initialData.adresse || "",
    telephone: initialData.telephone || "",
    email: initialData.email || "",
    nif: initialData.nif || "",
    rccm: initialData.rccm || "",
    emetteur: initialData.emetteur || "",
    coutSmsTtc: initialData.coutSmsTtc || 25,
    typeCompte: initialData.typeCompte || "POSTPAYE",
    motDePasse: initialData.motDePasse || "",
    indicatifPays: initialData.indicatifPays || "+241",
    telephoneAvecIndicatif: initialData.telephoneAvecIndicatif || ""
  })

  const handleNext = () => {
    if (step === 1) {
      if (!formData.raisonSociale || !formData.email || !formData.telephone) {
        toast.error("Veuillez remplir tous les champs obligatoires")
        return
      }
    }
    setStep(step + 1)
  }

  const handlePrevious = () => setStep(step - 1)

  const handleSubmit = () => {
    if (step === 2 && !formData.emetteur) {
      toast.error("Veuillez renseigner l'émetteur")
      return
    }
    onSave(formData)
  }

  const handleClose = () => {
    setStep(1)
    onClose()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center mb-6">
        <div className="flex space-x-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i <= step ? "bg-primary" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="raisonSociale">Raison sociale *</Label>
            <Input
              id="raisonSociale"
              value={formData.raisonSociale}
              onChange={(e) =>
                setFormData({ ...formData, raisonSociale: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                value={formData.adresse}
                onChange={(e) =>
                  setFormData({ ...formData, adresse: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="secteurActivite">Secteur d&lsquo;activité</Label>
              <Select
                value={formData.secteurActivite}
                onValueChange={(value) =>
                  setFormData({ ...formData, secteurActivite: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un secteur" />
                </SelectTrigger>
                <SelectContent>
                  {secteurs.map((secteur) => (
                    <SelectItem key={secteur.refID} value={secteur.value1}>
                      {secteur.value1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ville">Ville</Label>
              <Select
                value={formData.ville}
                onValueChange={(value) =>
                  setFormData({ ...formData, ville: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une ville" />
                </SelectTrigger>
                <SelectContent>
                  {villes.map((ville) => (
                    <SelectItem key={ville.refID} value={ville.value1}>
                      {ville.value1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephone">Téléphone *</Label>
            <div className="flex gap-2">
              <Select
                value={formData.indicatifPays}
                onValueChange={(value) =>
                  setFormData({ 
                    ...formData, 
                    indicatifPays: value,
                    telephoneAvecIndicatif: value + formData.telephone
                  })
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="+241" />
                </SelectTrigger>
                <SelectContent>
                  {pays.map((paysItem) => (
                    <SelectItem key={paysItem.refID} value={paysItem.value1}>
                      {paysItem.value1} {paysItem.value2}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="telephone"
                value={formData.telephone}
                onChange={(e) => {
                  const tel = e.target.value.replace(/\D/g, '');
                  setFormData({ 
                    ...formData, 
                    telephone: tel,
                    telephoneAvecIndicatif: formData.indicatifPays ? formData.indicatifPays + tel : tel
                  })
                }}
                placeholder="6 12 34 56 78"
                required
              />
            </div>
            {formData.telephoneAvecIndicatif && (
              <p className="text-xs text-muted-foreground">
                Numéro complet: {formData.telephoneAvecIndicatif}
              </p>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nif">NIF</Label>
              <Input
                id="nif"
                value={formData.nif}
                onChange={(e) =>
                  setFormData({ ...formData, nif: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rccm">RCCM</Label>
              <Input
                id="rccm"
                value={formData.rccm}
                onChange={(e) =>
                  setFormData({ ...formData, rccm: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emetteur">Émetteur *</Label>
              <Input
                id="emetteur"
                value={formData.emetteur}
                onChange={(e) =>
                  setFormData({ ...formData, emetteur: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coutSmsTtc">Coût SMS TTC</Label>
              <Input
                id="coutSmsTtc"
                type="number"
                value={formData.coutSmsTtc}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    coutSmsTtc: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="typeCompte">Type de compte</Label>
            <Select
              value={formData.typeCompte}
              onValueChange={(value) =>
                setFormData({ ...formData, typeCompte: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="POSTPAYE">Postpayé</SelectItem>
                <SelectItem value="PREPAYE">Prépayé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === 'create' && (
            <div className="space-y-2">
              <Label htmlFor="motDePasse">Mot de passe *</Label>
              <Input
                id="motDePasse"
                type="password"
                value={formData.motDePasse}
                onChange={(e) =>
                  setFormData({ ...formData, motDePasse: e.target.value })
                }
                required
              />
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <div>
          {step > 1 && (
            <Button variant="outline" onClick={handlePrevious}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Précédent
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>

          {step < 2 ? (
            <Button onClick={handleNext}>
              Suivant
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit}>
              <Save className="h-4 w-4 mr-2" />
              {mode === 'create' ? 'Créer' : 'Enregistrer'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
