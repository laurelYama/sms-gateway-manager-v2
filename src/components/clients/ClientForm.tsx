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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1)
  // Pas de refs nécessaires pour le scroll natif
  // Fonction pour initialiser les données du formulaire
  const getInitialFormData = () => {
    console.log('Initialisation du formulaire avec les données:', initialData);
    
    // Trouver le pays par défaut
    const paysParDefaut = pays.length > 0 ? pays[0] : null;
    
    // Si on est en mode édition et qu'on a un indicatifPays, trouver le pays correspondant
    let indicatifPays = initialData.indicatifPays;
    let telephone = initialData.telephone || "";
    let telephoneAvecIndicatif = initialData.telephoneAvecIndicatif || "";
    
    // Si on a un numéro de téléphone mais pas d'indicatif, essayer de l'extraire
    if ((!indicatifPays || !telephoneAvecIndicatif) && telephone) {
      // Si le numéro commence par un +, c'est qu'il contient déjà l'indicatif
      if (telephone.startsWith('+')) {
        telephoneAvecIndicatif = telephone;
        // Trouver le pays correspondant à l'indicatif
        const indicatifNumerique = telephone.match(/^\+([0-9]+)/)?.[1];
        if (indicatifNumerique) {
          const paysTrouve = pays.find(p => 
            p.value2 && p.value2.replace(/\D/g, '') === indicatifNumerique
          );
          if (paysTrouve) {
            indicatifPays = paysTrouve.value1;
            telephone = telephone.replace(new RegExp(`^\\+${indicatifNumerique}`), '');
          }
        }
      }
    }
    
    return {
      raisonSociale: initialData.raisonSociale || "",
      secteurActivite: initialData.secteurActivite || "",
      ville: initialData.ville || "",
      adresse: initialData.adresse || "",
      telephone: telephone,
      email: initialData.email || "",
      nif: initialData.nif || "",
      rccm: initialData.rccm || "",
      emetteur: initialData.emetteur || "",
      coutSmsTtc: initialData.coutSmsTtc || 25,
  // Ensure typeCompte is always a string (CreateClientForm requires it)
  typeCompte: (initialData.typeCompte ?? "POSTPAYE") as 'POSTPAYE' | 'PREPAYE' | string,
      indicatifPays: indicatifPays || (paysParDefaut?.value1 || ""),
      telephoneAvecIndicatif: telephoneAvecIndicatif || ""
    };
  };
  
  const [formData, setFormData] = useState<CreateClientForm>(getInitialFormData());

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

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Validation de l'email
      if (!validateEmail(formData.email)) {
        toast.error("Veuillez entrer une adresse email valide");
        return;
      }

      // Validation de l'émetteur (si on est à l'étape 2)
      if (step === 2 && !formData.emetteur) {
        toast.error("Veuillez renseigner l'émetteur");
        return;
      }
      
      // Validation du numéro de téléphone
      if (!formData.telephoneAvecIndicatif) {
        toast.error("Veuillez renseigner un numéro de téléphone");
        return;
      }
      
      // Préparer les données pour l'envoi
      const dataToSave = {
        ...formData,
        // S'assurer que le numéro est bien formaté
        telephone: formData.telephoneAvecIndicatif.startsWith('+') 
          ? formData.telephoneAvecIndicatif 
          : `+${formData.telephoneAvecIndicatif}`.replace(/\s+/g, ''),
        // S'assurer que l'email est en minuscules
        email: formData.email.toLowerCase()
      };
      
      console.log('Données à enregistrer:', dataToSave);
      
      // Appeler la fonction de sauvegarde
      await onSave(dataToSave);
      
    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire:', error);
      toast.error("Une erreur est survenue lors de la sauvegarde");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleClose = () => {
    setStep(1)
    onClose()
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Ne garder que les chiffres
    const value = e.target.value.replace(/\D/g, '');
    
    setFormData(prev => {
      // Créer le numéro complet avec l'indicatif
      const indicatif = pays.find(p => p.value1 === prev.indicatifPays)?.value2 || '';
      const telephoneComplet = indicatif ? `${indicatif}${value}` : value;
      
      return {
        ...prev,
        telephone: value, // Stocker uniquement le numéro sans l'indicatif
        telephoneAvecIndicatif: telephoneComplet // Stocker le numéro complet avec l'indicatif
      };
    });
  }
  
  // Mettre à jour le numéro avec l'indicatif quand l'indicatif change
  const handleIndicatifChange = (value: string) => {
    // Trouver le pays sélectionné
    const paysSelectionne = pays.find(p => p.value1 === value);
    
    setFormData(prev => ({
      ...prev,
      indicatifPays: value, // Stocker la valeur du pays (value1)
      // Mettre à jour le numéro complet avec le nouvel indicatif
      telephoneAvecIndicatif: paysSelectionne?.value2 
        ? `${paysSelectionne.value2}${prev.telephone}` 
        : prev.telephone
    }));
  }

  // Trier les listes par ordre alphabétique
  const secteursTries = [...secteurs].sort((a, b) => a.value1.localeCompare(b.value1, 'fr', { sensitivity: 'base' }));
  const villesTriees = [...villes].sort((a, b) => a.value1.localeCompare(b.value1, 'fr', { sensitivity: 'base' }));
  const paysTries = [...pays].sort((a, b) => a.value1.localeCompare(b.value1, 'fr', { sensitivity: 'base' }));
  
  // Log pour déboguer
  console.log('=== DEBUG PAYS ===');
  console.log('Pays reçus en props:', pays);
  console.log('FormData actuel:', formData);
  
  // Afficher la structure des 3 premiers pays
  if (pays && pays.length > 0) {
    console.log('Structure des 3 premiers pays:');
    pays.slice(0, 3).forEach((p, i) => {
      console.log(`Pays ${i + 1}:`, {
        value1: p.value1,
        value2: p.value2,
        code: p.code,
        refID: p.refID,
        hasValue1: !!p.value1,
        hasValue2: !!p.value2,
        hasCode: !!p.code
      });
    });
  } else {
    console.log('Aucun pays chargé');
  }
  
  // Vérifier le pays sélectionné
  const paysSelectionne = pays.find(p => p.value1 === formData.indicatifPays);
  console.log('Pays sélectionné:', paysSelectionne);
  console.log('Valeur actuelle de indicatifPays:', formData.indicatifPays);
  
  if (paysSelectionne) {
    console.log('Détails du pays sélectionné:', {
      value1: paysSelectionne.value1,
      value2: paysSelectionne.value2,
      code: paysSelectionne.code,
      refID: paysSelectionne.refID
    });
  } else {
    console.log('Aucun pays ne correspond à l\'indicatif actuel');
  }
  
  console.log('==================');
  
  // Fonction pour afficher le texte du sélecteur
  const afficherTexteSelecteur = () => {
    console.log('=== afficherTexteSelecteur ===');
    console.log('indicatifPays:', formData.indicatifPays);
    console.log('Nombre de pays disponibles:', pays.length);
    
    if (!formData.indicatifPays) {
      console.log('Aucun indicatifPays défini');
      return "Sélectionner un pays";
    }
    
    // Afficher les 3 premiers pays pour débogage
    console.log('3 premiers pays disponibles:', pays.slice(0, 3).map(p => ({
      value1: p.value1,
      value2: p.value2,
      code: p.code
    })));
    
    // Essayer de trouver le pays par value1 (code pays)
    let paysTrouve = pays.find(p => p.value1 === formData.indicatifPays);
    console.log('Résultat recherche par value1:', paysTrouve);
    
    // Si pas trouvé, essayer par value2 (indicatif)
    if (!paysTrouve) {
      paysTrouve = pays.find(p => p.value2 === formData.indicatifPays);
      console.log('Résultat recherche par value2:', paysTrouve);
    }
    
    // Si toujours pas trouvé, essayer par code
    if (!paysTrouve) {
      paysTrouve = pays.find(p => p.code === formData.indicatifPays);
      console.log('Résultat recherche par code:', paysTrouve);
    }
    
    if (!paysTrouve) {
      console.log('Aucun pays trouvé avec cet indicatif');
      // Retourner le premier pays disponible comme valeur par défaut
      const premierPays = pays[0];
      if (premierPays) {
        console.log('Utilisation du premier pays disponible comme valeur par défaut');
        return premierPays.value2 || premierPays.value1 || premierPays.code || "Sélectionner un pays";
      }
      return `Inconnu (${formData.indicatifPays})`;
    }
    
    console.log('Pays trouvé:', {
      value1: paysTrouve.value1,
      value2: paysTrouve.value2,
      code: paysTrouve.code
    });
    
    // Retourner value2 (indicatif) s'il existe, sinon value1, sinon code
    return paysTrouve.value2 || paysTrouve.value1 || paysTrouve.code || "Inconnu";
  };

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
                <SelectContent className="max-h-60 overflow-auto">
                  {secteursTries.map((secteur) => (
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
                <SelectContent className="max-h-60 overflow-auto">
                  {villesTriees.map((ville) => (
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
                value={formData.indicatifPays || ''}
                onValueChange={handleIndicatifChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue>
                    {afficherTexteSelecteur()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-auto">
                  {paysTries.map((paysItem) => (
                    <SelectItem key={paysItem.refID} value={paysItem.value1}>
                      {paysItem.value2} {paysItem.value1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="telephone"
                value={formData.telephone}
                onChange={handlePhoneChange}
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
                  setFormData({ ...formData, emetteur: e.target.value.slice(0, 11) })
                }
                maxLength={11}
                className={formData.emetteur.length >= 11 ? "border-red-500 focus-visible:ring-red-500" : undefined}
                required
              />
              <p className={`text-xs ${formData.emetteur.length >= 11 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {formData.emetteur.length}/11 caractères
              </p>
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

          {mode === 'create' && (
            <div className="space-y-2">
              <Label htmlFor="typeCompte">Type de compte</Label>
              <Select
                value={formData.typeCompte}
                onValueChange={(value) =>
                  setFormData({ ...formData, typeCompte: value as 'POSTPAYE' | 'PREPAYE' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type de compte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POSTPAYE">Postpayé</SelectItem>
                  <SelectItem value="PREPAYE">Prépayé</SelectItem>
                </SelectContent>
              </Select>
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
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {mode === 'create' ? 'Création...' : 'Enregistrement...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === 'create' ? 'Créer' : 'Enregistrer'}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
