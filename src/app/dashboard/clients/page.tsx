"use client"

import { useCallback, useEffect, useState } from "react"
import { getToken } from "@/lib/auth"
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

    const loadClients = useCallback(async (page = currentPage, size = pageSize) => {
        if (!token) {
            setLoading(false)
            return
        }

        setLoading(true)

        try {
            const url = new URL("https://api-smsgateway.solutech-one.com/api/V1/clients")
            url.searchParams.append('page', page.toString())
            url.searchParams.append('size', size.toString())

            if (statusFilter !== 'ALL') {
                url.searchParams.append('statutCompte', statusFilter)
            }

            if (searchQuery) {
                url.searchParams.append('search', searchQuery)
            }

            console.log('Chargement des clients depuis:', url.toString())

            const response = await fetch(url.toString(), {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                cache: 'no-store'
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error('Erreur API:', response.status, errorText)
                throw new Error(`Erreur API: ${response.status} - ${errorText}`)
            }

            const data = await response.json()
            console.log('Réponse API brute:', data)

            const clientsData = Array.isArray(data)
                ? [...data].sort((a, b) => parseInt(b.idclients) - parseInt(a.idclients))
                : []

            const totalElements = clientsData.length
            const totalPages = Math.ceil(totalElements / pageSize) || 1

            setClients(clientsData)
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
                `https://api-smsgateway.solutech-one.com/api/v1/referentiel/categorie/${category}`,
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
        setEditForm({
            raisonSociale: client.raisonSociale,
            secteurActivite: client.secteurActivite,
            ville: client.ville,
            adresse: client.adresse,
            telephone: client.telephone,
            email: client.email,
            nif: client.nif,
            rccm: client.rccm,
            pays: client.pays || ""
        })
        setIsEditDialogOpen(true)
    }

    const closeEditDialog = () => {
        setIsEditDialogOpen(false)
        setCurrentClient(null)
    }

    const toggleClientStatus = async (client: Client) => {
        const currentToken = getToken()
        if (!currentToken) return

        try {
            const response = await fetch(
                `https://api-smsgateway.solutech-one.com/api/V1/clients/${client.idclients}/toggle-status`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${currentToken}`,
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                }
            )

            if (!response.ok) throw new Error("Erreur API statut")

            setClients(prevClients =>
                prevClients.map(c =>
                    c.idclients === client.idclients
                        ? {...c, statutCompte: c.statutCompte === "ACTIF" ? "SUSPENDU" : "ACTIF"}
                        : c
                )
            )

            toast.success(`Client ${client.statutCompte === "ACTIF" ? "suspendu" : "activé"} avec succès`)
        } catch (error) {
            console.error("Erreur lors du changement de statut du client:", error)
            toast.error("Une erreur s'est produite lors du changement de statut")
        }
    }

    const openCreateDialog = () => setIsCreateDialogOpen(true)
    const closeCreateDialog = () => setIsCreateDialogOpen(false)

    const handleEdit = async (formData: EditClientForm) => {
        if (!currentClient) return

        try {
            const url = `https://api-smsgateway.solutech-one.com/api/V1/clients/${currentClient.idclients}`
            const response = await fetch(url, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData)
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
            const response = await fetch("https://api-smsgateway.solutech-one.com/api/V1/clients", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData)
            })

            if (!response.ok) throw new Error("Erreur lors de la création")

            const newClient = await response.json()
            setClients(prevClients => [...prevClients, newClient])
            closeCreateDialog()
            toast.success("Client créé avec succès")
        } catch (error) {
            console.error("Erreur lors de la création du client:", error)
            toast.error("Une erreur s'est produite lors de la création")
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
                    totalPages={totalPages}
                    totalElements={totalElements}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    getStatusBadge={(status: string) => (
                        <Badge variant={status === "ACTIF" ? "default" : "destructive"}>
                            {status === "ACTIF" ? "Actif" : "Suspendu"}
                        </Badge>
                    )}
                    formatCurrency={formatCurrency}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onAddClient={openCreateDialog}
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