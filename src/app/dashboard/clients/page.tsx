"use client"

import { useCallback, useEffect, useState } from "react"
import { getToken } from "@/lib/auth"
import { API_BASE_URL } from "@/lib/config"
import { toast } from "sonner"
import { Client, CreateClientForm, EditClientForm, ReferentielItem } from "@/types/client"
import { ClientFilters } from "@/components/clients/ClientFilters"
import { ClientList } from "@/components/clients/ClientList"
import { ClientStats } from "@/components/clients/ClientStats"
import { ClientForm } from "@/components/clients/ClientForm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export default function ClientsPage() {
    // États
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIF" | "SUSPENDU">("ALL")
    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize, setPageSize] = useState(5)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [villes, setVilles] = useState<ReferentielItem[]>([])
    const [secteurs, setSecteurs] = useState<ReferentielItem[]>([])
    const [pays, setPays] = useState<ReferentielItem[]>([]) // Nouvel état pour les pays
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [currentClient, setCurrentClient] = useState<Client | null>(null)
    const [editForm, setEditForm] = useState<EditClientForm>({
        raisonSociale: "",
        secteurActivite: "",
        ville: "",
        adresse: "",
        telephone: "",
        email: "",
        nif: "",
        rccm: "",
        pays: ""
    })
    const token = getToken()

    const loadClients = useCallback(async (page = 1, size = pageSize) => {
        const currentToken = getToken()
        if (!currentToken) {
            return
        }

        setLoading(true)

        try {
            // Construire l'URL avec les paramètres de pagination
            const url = new URL(`${API_BASE_URL}/api/V1/clients`)
            url.searchParams.append('page', (page - 1).toString()) // L'API attend une pagination 0-based
            url.searchParams.append('size', size.toString())

            // Ajouter le filtre de statut si défini
            if (statusFilter !== 'ALL') {
                url.searchParams.append('statutCompte', statusFilter)
            }

            // Ajouter la recherche si définie
            if (searchQuery) {
                url.searchParams.append('search', searchQuery)
            }

            const response = await fetch(url.toString(), {
                headers: {
                    Authorization: `Bearer ${currentToken}`,
                    Accept: 'application/json',
                },
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Erreur API: ${response.status} - ${errorText}`)
            }

            const data = await response.json()

            // Vérifier si la réponse est un tableau
            if (!Array.isArray(data)) {
                throw new Error('Format de réponse inattendu de l\'API')
            }

            // Trier les clients par ID décroissant
            const sortedClients = [...data].sort((a, b) => 
                parseInt(b.idclients) - parseInt(a.idclients)
            )
            
            // Mettre à jour la liste complète des clients
            setClients(sortedClients)
            
            // Calculer la pagination sur la liste complète
            const totalElements = sortedClients.length
            const totalPages = Math.ceil(totalElements / size)
            
            // Mettre à jour les états de pagination
            setTotalPages(totalPages)
            setTotalElements(totalElements)
        } catch (error) {
            console.error("Erreur API clients:", error)
            toast.error("Impossible de charger la liste des clients")
        } finally {
            setLoading(false)
        }
    }, [currentPage, pageSize, statusFilter, searchQuery, token])

    const loadReferentiel = useCallback(async (category: string, setter: (data: ReferentielItem[]) => void) => {
        const currentToken = getToken()
        if (!currentToken) return

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/v1/referentiel/categorie/${category}`,
                {
                    headers: {
                        Authorization: `Bearer ${currentToken}`,
                        Accept: "application/json",
                    },
                }
            )

            if (!response.ok) {
                throw new Error("Erreur API référentiel")
            }

            const data = await response.json()
            setter(data)
        } catch (error) {
            console.error(`Erreur API référentiel ${category}:`, error)
        }
    }, [])

    // Chargement initial des données
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                await Promise.all([
                    loadClients(),
                    loadReferentiel("001", setVilles),
                    loadReferentiel("002", setSecteurs),
                    loadReferentiel("004", setPays) // Charger les pays
                ])
            } catch (error) {
                console.error("Erreur lors du chargement initial des données:", error)
                toast.error("Erreur lors du chargement des données")
            }
        }

        if (token) {
            loadInitialData()
        }
    }, [token])

    // Chargement au changement de page/taille de page
    useEffect(() => {
        if (!token) return

        const loadData = async () => {
            try {
                await loadClients(currentPage, pageSize)
            } catch (error) {
                console.error("Erreur lors du chargement des données:", error)
                toast.error("Erreur lors du chargement des données")
            }
        }

        loadData()
    }, [token, currentPage, pageSize])

    const formatCurrency = useCallback((amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0)
    }, [])

    const calculateMonthlyBalance = useCallback((client: Client) => {
        if (!client.dateCreation) return `${formatCurrency(0)} / mois`

        const creationDate = new Date(client.dateCreation)
        const now = new Date()
        const monthsDiff = Math.max(1, (now.getFullYear() - creationDate.getFullYear()) * 12 +
            (now.getMonth() - creationDate.getMonth()))

        const monthlyBalance = (client.soldeNet || 0) / monthsDiff
        return `${formatCurrency(monthlyBalance)} / mois`
    }, [formatCurrency])

    const filteredClients = clients.filter(client => {
        const matchesStatus = statusFilter === "ALL" || client.statutCompte === statusFilter
        const matchesSearch = client.raisonSociale.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase()))

        return matchesStatus && matchesSearch
    })

    const openEditDialog = (client: Client) => {
        setCurrentClient(client)
        // Trouver l'indicatif du pays dans la liste des pays chargés
    // Fonction pour extraire l'indicatif et le numéro
    const extractPhoneNumber = (phoneWithCode: string) => {
      if (!phoneWithCode) return { indicatif: pays[0]?.value1 || "France", numero: "" };
      
      // Nettoyer le numéro (supprimer les espaces, tirets, etc.)
      const cleaned = phoneWithCode.replace(/[^\d+]/g, '');
      
      // Vérifier d'abord le format +33 (France)
      if (cleaned.startsWith('+33') || cleaned.startsWith('0033')) {
        let numero = cleaned.startsWith('+33') 
          ? cleaned.substring(3) 
          : cleaned.substring(4);
        
        // Si le numéro commence par 0 après l'indicatif, on le supprime
        if (numero.startsWith('0')) {
          numero = numero.substring(1);
        }
        
        // Trouver la France dans la liste des pays
        const france = pays.find(p => p.value1 === 'France' || p.value2 === '+33');
        
        return {
          indicatif: france?.value1 || 'France',
          numero: numero
        };
      }
      
      // Vérifier les autres pays
      for (const p of pays) {
        if (!p.value2) continue;
        
        // Nettoyer l'indicatif du pays pour la comparaison
        const codePays = p.value2.replace(/[^\d+]/g, '');
        
        // Vérifier si le numéro commence par l'indicatif du pays
        if (cleaned.startsWith(codePays)) {
          return {
            indicatif: p.value1,
            numero: cleaned.substring(codePays.length)
          };
        }
      }
      
      // Si le numéro commence par + mais qu'aucun pays n'a été trouvé
      if (cleaned.startsWith('+')) {
        // Essayer d'extraire les 2-3 premiers chiffres après le +
        const codePaysMatch = cleaned.match(/^\+([0-9]{1,3})/);
        if (codePaysMatch) {
          return {
            indicatif: `+${codePaysMatch[1]}`,
            numero: cleaned.substring(codePaysMatch[0].length)
          };
        }
      }
      
      // Si le numéro commence par 00 (format international)
      if (cleaned.startsWith('00')) {
        const codePaysMatch = cleaned.match(/^00([0-9]{1,3})/);
        if (codePaysMatch) {
          const code = `+${codePaysMatch[1]}`;
          return {
            indicatif: code,
            numero: cleaned.substring(codePaysMatch[0].length)
          };
        }
      }
      
      // Si aucun indicatif n'est trouvé, considérer le numéro tel quel
      return {
        indicatif: pays[0]?.value1 || "France",
        numero: cleaned
      };
    };
    
    // Extraire l'indicatif et le numéro
    const { indicatif, numero } = extractPhoneNumber(client.telephoneAvecIndicatif || client.telephone || "");
    
    // D'abord essayer de trouver par value1 (nom du pays)
    let paysClient = pays.find(p => p.value1 === indicatif);
    
    // Si pas trouvé, essayer de trouver par value2 (indicatif avec +)
    if (!paysClient) {
      paysClient = pays.find(p => p.value2 === indicatif);
    }
    
    // Si toujours pas trouvé, essayer de trouver par indicatif numérique
    if (!paysClient) {
      const indicatifNumerique = indicatif.replace(/\D/g, '');
      paysClient = pays.find(p => p.value2 && p.value2.replace(/\D/g, '') === indicatifNumerique);
    }
    
    // Si toujours pas trouvé, prendre le premier pays
    if (!paysClient && pays.length > 0) {
      paysClient = pays[0];
    }
    
    // Préparer les données du formulaire
    const formData = {
      raisonSociale: client.raisonSociale || "",
      secteurActivite: client.secteurActivite || (secteurs[0]?.value1 || ""),
      ville: client.ville || "",
      adresse: client.adresse || "",
      telephone: numero || "",
      email: client.email || "",
      nif: client.nif || "",
      rccm: client.rccm || "",
      pays: paysClient?.value1 || pays[0]?.value1 || "",
      indicatifPays: paysClient?.value2 || pays[0]?.value2 || "",
      telephoneAvecIndicatif: paysClient?.value2 && numero ? `${paysClient.value2}${numero}` : ""
    };
    
    setEditForm(formData);
        setIsEditDialogOpen(true)
    }

    const closeEditDialog = () => {
        setIsEditDialogOpen(false);
        setCurrentClient(null);
    };

    const toggleClientStatus = async (client: Client, newStatus: "ACTIF" | "SUSPENDU") => {
        const endpoint = newStatus === "SUSPENDU" 
            ? `${API_BASE_URL}/api/V1/clients/${client.idclients}/suspend`
            : `${API_BASE_URL}/api/V1/clients/${client.idclients}/reactivate`
        
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`,
                },
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Erreur API: ${response.status} - ${errorText}`)
            }
            
            // Mise à jour optimiste de l'interface
            setClients(prevClients =>
                prevClients.map(c =>
                    c.idclients === client.idclients
                        ? { ...c, statutCompte: newStatus }
                        : c
                )
            )

            toast.success(`Client ${newStatus === "SUSPENDU" ? "suspendu" : "activé"} avec succès`)
            
            // Rafraîchir la liste pour s'assurer que tout est à jour
            loadClients(currentPage, pageSize)
            
        } catch (error) {
            console.error("Erreur lors du changement de statut du client:", error)
            // Annuler la mise à jour optimiste en cas d'erreur
            setClients(prevClients => [...prevClients])
            toast.error(`Échec du changement de statut: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
        }
    }

    const openCreateDialog = () => setIsCreateDialogOpen(true)
    const closeCreateDialog = () => setIsCreateDialogOpen(false)

    const handleEdit = async (formData: EditClientForm) => {
        if (!currentClient) return

        try {
            // Trouver le pays sélectionné
            const paysSelectionne = pays.find(p => p.value1 === formData.indicatifPays);
            
            // Préparer les données à envoyer
            const dataToSend = {
                ...formData,
                // Construire le numéro complet avec l'indicatif
                telephoneAvecIndicatif: paysSelectionne?.value2 
                    ? `${paysSelectionne.value2}${formData.telephone.replace(/\D/g, '')}`
                    : formData.telephone
            };

            const url = `${API_BASE_URL}/api/V1/clients/${currentClient.idclients}`
            
            const response = await fetch(url, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(dataToSend)
            })

            if (!response.ok) throw new Error("Erreur lors de la modification")

            setClients(prevClients =>
                prevClients.map(c =>
                    c.idclients === currentClient.idclients
                        ? {...c, ...formData}
                        : c
                )
            )
            closeEditDialog()
            toast.success("Client modifié avec succès")
        } catch (error) {
            console.error("Erreur:", error)
            toast.error("Une erreur s'est produite lors de la modification")
        }
    }

    const handleCreate = async (formData: CreateClientForm) => {
        try {
            // Préparer les données pour l'API
            const dataToSend = {
                raisonSociale: formData.raisonSociale,
                secteurActivite: formData.secteurActivite,
                ville: formData.ville,
                adresse: formData.adresse,
                telephone: formData.telephoneAvecIndicatif, // Utiliser le numéro avec l'indicatif
                email: formData.email,
                nif: formData.nif,
                rccm: formData.rccm,
                emetteur: formData.emetteur,
                coutSmsTtc: formData.coutSmsTtc,
                typeCompte: formData.typeCompte,
                indicatifPays: formData.indicatifPays,
                telephoneAvecIndicatif: formData.telephoneAvecIndicatif
            };

            const response = await fetch(`${API_BASE_URL}/api/V1/clients`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(dataToSend)
            })

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Erreur API:', errorData);
                throw new Error(errorData.message || "Erreur lors de la création");
            }

            const newClient = await response.json()
            setClients(prevClients => [...prevClients, newClient])
            closeCreateDialog()
            toast.success("Client créé avec succès")
        } catch (error) {
            console.error("Erreur lors de la création du client:", error)
            toast.error(error instanceof Error ? error.message : "Une erreur s'est produite lors de la création")
        }
    }

    const handleManualRefresh = useCallback(() => {
        return loadClients(currentPage, pageSize)
    }, [currentPage, pageSize, loadClients])

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage)
        loadClients(newPage, pageSize)
    }

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize)
        setCurrentPage(0)
        loadClients(0, newSize)
    }

    return (
        <div className="container mx-auto py-6 px-4">
            <ClientFilters
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                onRefresh={handleManualRefresh}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onAddClient={openCreateDialog}
            />

            <ClientStats clients={filteredClients} />

            <div className="mt-6">
                <ClientList
                    clients={filteredClients}
                    loading={loading}
                    onEdit={openEditDialog}
                    onToggleStatus={toggleClientStatus}
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredClients.length / pageSize)}
                    totalElements={filteredClients.length}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    getStatusBadge={(status: string) => (
                        <Badge variant={status === "ACTIF" ? "default" : "destructive"}>
                            {status === "ACTIF" ? "Actif" : "Suspendu"}
                        </Badge>
                    )}
                    formatCurrency={formatCurrency}
                    calculateMonthlyBalance={calculateMonthlyBalance}
                />
            </div>

            {/* Dialog de création */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Créer un nouveau client</DialogTitle>
                    </DialogHeader>
                    <ClientForm
                        mode="create"
                        initialData={{
                            typeCompte: "POSTPAYE",
                            coutSmsTtc: 25
                        }}
                        onSave={handleCreate}
                        onClose={closeCreateDialog}
                        villes={villes}
                        secteurs={secteurs}
                        pays={pays}
                    />
                </DialogContent>
            </Dialog>

            {/* Dialog d'édition */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Modifier le client</DialogTitle>
                    </DialogHeader>
                    <ClientForm
                        mode="edit"
                        initialData={editForm}
                        onSave={handleEdit}
                        onClose={closeEditDialog}
                        villes={villes}
                        secteurs={secteurs}
                        pays={pays}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}