"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    MoreHorizontal,
    Building,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    Edit,
    Shield,
    RefreshCw,
    Filter,
    Briefcase,
    Navigation,
    FileDigit,
    ScrollText,
    Wallet,
    UserCheck,
    UserX,
    X,
    Save,
    Plus,
    ChevronLeft,
    ChevronRight,
} from "lucide-react"
import { getToken } from "@/lib/auth"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner" // ✅ Sonner

interface Client {
    idclients: string
    raisonSociale: string
    secteurActivite: string
    ville: string
    adresse: string
    telephone: string
    email: string
    nif: string
    rccm: string
    emetteur: string
    coutSmsTtc: number
    typeCompte: string
    role: string
    soldeNet: number
    statutCompte: string
}

interface EditClientForm {
    raisonSociale: string
    secteurActivite: string
    ville: string
    adresse: string
    telephone: string
    email: string
    nif: string
    rccm: string
}

interface CreateClientForm {
    raisonSociale: string
    secteurActivite: string
    ville: string
    adresse: string
    telephone: string
    email: string
    nif: string
    rccm: string
    emetteur: string
    coutSmsTtc: number
    typeCompte: string
    motDePasse: string
}

interface ReferentielItem {
    refID: number
    keyValue: string
    value1: string
    value2: string | null
    value3: string | null
    value4: string | null
    refCategory: string
}

// ------------------ CREATE CLIENT WIZARD ------------------
const CreateClientWizard = ({
                                isOpen,
                                onClose,
                                onCreate,
                                villes,
                                secteurs,
                            }: {
    isOpen: boolean
    onClose: () => void
    onCreate: (formData: CreateClientForm) => void
    villes: ReferentielItem[]
    secteurs: ReferentielItem[]
}) => {
    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState<CreateClientForm>({
        raisonSociale: "",
        secteurActivite: "",
        ville: "",
        adresse: "",
        telephone: "",
        email: "",
        nif: "",
        rccm: "",
        emetteur: "",
        coutSmsTtc: 25,
        typeCompte: "POSTPAYE",
        motDePasse: "" // ✅ reste dans l'objet mais non affiché
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

    const handlePrevious = () => {
        setStep(step - 1)
    }

    const handleSubmit = () => {
        if (!formData.emetteur) {
            toast.error("Veuillez renseigner l’émetteur")
            return
        }
        onCreate(formData)
    }

    const handleClose = () => {
        setStep(1)
        setFormData({
            raisonSociale: "",
            secteurActivite: "",
            ville: "",
            adresse: "",
            telephone: "",
            email: "",
            nif: "",
            rccm: "",
            emetteur: "",
            coutSmsTtc: 25,
            typeCompte: "POSTPAYE",
            motDePasse: ""
        })
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Créer un nouveau client - Étape {step} sur 2</DialogTitle>
                    <DialogDescription>
                        {step === 1
                            ? "Renseignez les informations de base du client"
                            : "Complétez les informations techniques"}
                    </DialogDescription>
                </DialogHeader>

                {/* Indicateur de progression */}
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
                    <div className="grid gap-4 py-4">
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
                                <Label htmlFor="telephone">Téléphone *</Label>
                                <Input
                                    id="telephone"
                                    value={formData.telephone}
                                    onChange={(e) =>
                                        setFormData({ ...formData, telephone: e.target.value })
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="secteurActivite">Secteur d’activité</Label>
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
                )}

                {step === 2 && (
                    <div className="grid gap-4 py-4">
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
                    </div>
                )}

                <DialogFooter className="flex justify-between">
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
                                Créer le client
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ------------------ MAIN PAGE ------------------
export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIF" | "SUSPENDU">("ALL")
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [currentClient, setCurrentClient] = useState<Client | null>(null)
    const [villes, setVilles] = useState<ReferentielItem[]>([])
    const [secteurs, setSecteurs] = useState<ReferentielItem[]>([])
    const [editForm, setEditForm] = useState<EditClientForm>({
        raisonSociale: "",
        secteurActivite: "",
        ville: "",
        adresse: "",
        telephone: "",
        email: "",
        nif: "",
        rccm: ""
    })
    const token = getToken()

    const loadClients = async () => {
        if (!token) {
            setLoading(false)
            return
        }

        setRefreshing(true)
        try {
            const response = await fetch("https://api-smsgateway.solutech-one.com/api/V1/clients", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            })

            if (!response.ok) throw new Error("Erreur API")

            const data = await response.json()

            if (Array.isArray(data)) {
                setClients(data)
            } else {
                setClients(data.content || [])
            }
        } catch (error) {
            console.error("Erreur API clients:", error)
            toast.error("Impossible de charger la liste des clients")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const loadReferentiel = async (category: string, setter: (data: ReferentielItem[]) => void) => {
        if (!token) return

        try {
            const response = await fetch(`https://api-smsgateway.solutech-one.com/api/v1/referentiel/categorie/${category}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            })

            if (!response.ok) throw new Error("Erreur API référentiel")

            const data = await response.json()
            setter(data)
        } catch (error) {
            console.error(`Erreur API référentiel ${category}:`, error)
        }
    }

    useEffect(() => {
        loadClients()
        loadReferentiel("001", setVilles)
        loadReferentiel("002", setSecteurs)
    }, [token])

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
            rccm: client.rccm
        })
        setIsEditDialogOpen(true)
    }

    const closeEditDialog = () => {
        setIsEditDialogOpen(false)
        setCurrentClient(null)
        setEditForm({
            raisonSociale: "",
            secteurActivite: "",
            ville: "",
            adresse: "",
            telephone: "",
            email: "",
            nif: "",
            rccm: ""
        })
    }

    const openCreateDialog = () => {
        setIsCreateDialogOpen(true)
    }

    const closeCreateDialog = () => {
        setIsCreateDialogOpen(false)
    }

    const handleEdit = async () => {
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
                body: JSON.stringify(editForm)
            })

            if (!response.ok) throw new Error("Erreur lors de la modification")

            setClients(prevClients =>
                prevClients.map(c =>
                    c.idclients === currentClient.idclients
                        ? { ...c, ...editForm }
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
            const url = "https://api-smsgateway.solutech-one.com/api/V1/clients"

            const response = await fetch(url, {
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
            console.error("Erreur:", error)
            toast.error("Une erreur s'est produite lors de la création")
        }
    }

    const toggleClientStatus = async (client: Client) => {
        try {
            const action = client.statutCompte === "ACTIF" ? "suspend" : "reactivate"
            const url = `https://api-smsgateway.solutech-one.com/api/V1/clients/${client.idclients}/${action}`

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) throw new Error("Erreur lors du changement de statut")

            setClients(prevClients =>
                prevClients.map(c =>
                    c.idclients === client.idclients
                        ? { ...c, statutCompte: client.statutCompte === "ACTIF" ? "SUSPENDU" : "ACTIF" }
                        : c
                )
            )

            toast.success(`Client ${client.statutCompte === "ACTIF" ? "suspendu" : "activé"} avec succès`)
        } catch (error) {
            console.error("Erreur:", error)
            toast.error("Une erreur s'est produite lors du changement de statut")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer définitivement ce client ?")) return

        try {
            setClients(prevClients => prevClients.filter(client => client.idclients !== id))
            toast.success("Client supprimé avec succès")
        } catch (error) {
            console.error("Erreur:", error)
            toast.error("Une erreur s'est produite lors de la suppression")
        }
    }

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            ACTIF: { label: "Actif", variant: "default" as const },
            SUSPENDU: { label: "Suspendu", variant: "destructive" as const },
        }

        const config =
            statusConfig[status as keyof typeof statusConfig] || {
                label: status,
                variant: "secondary" as const,
            }

        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "XOF",
        }).format(amount)
    }

    const filteredClients = clients.filter((client) =>
        statusFilter === "ALL" ? true : client.statutCompte === statusFilter
    )

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center h-64">
                <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Chargement des clients...</p>
                </div>
            </div>
        )
    }

    if (!token) {
        return (
            <div className="p-6">
                <Card className="bg-red-50 border-red-200">
                    <CardContent className="pt-6">
                        <div className="text-center text-red-700">
                            <UserX className="h-12 w-12 mx-auto mb-4" />
                            <p className="font-semibold">Connectez-vous pour voir les clients</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* En-tête avec filtres */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Gestion des Clients</h1>
                    <p className="text-gray-600">Liste des clients enregistrés sur la plateforme</p>
                </div>

                <div className="flex items-center gap-2">
                    <Button onClick={openCreateDialog}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un client
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadClients}
                        disabled={refreshing}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                        Actualiser
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Filter className="h-4 w-4 mr-2" />
                                Statut: {statusFilter === "ALL" ? "Tous" : statusFilter}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setStatusFilter("ALL")}>Tous</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("ACTIF")}>Actifs</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("SUSPENDU")}>
                                Suspendus
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Cartes de stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Total Clients
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{filteredClients.length}</div>
                        <p className="text-gray-500 text-sm">Comptes enregistrés</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-green-600" />
                            Actifs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {filteredClients.filter((c) => c.statutCompte === "ACTIF").length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <UserX className="h-4 w-4 text-red-600" />
                            Suspendus
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {filteredClients.filter((c) => c.statutCompte === "SUSPENDU").length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-blue-600" />
                            Solde Moyen
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(
                                filteredClients.reduce((sum, client) => sum + client.soldeNet, 0) /
                                (filteredClients.length || 1)
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tableau des clients */}
            <Card>
                <CardHeader>
                    <CardTitle>Liste des clients</CardTitle>
                    <CardDescription>{filteredClients.length} client(s) trouvé(s)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Raison sociale</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Localisation</TableHead>
                                    <TableHead>Solde</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredClients.length > 0 ? (
                                    filteredClients.map((client) => (
                                        <TableRow key={client.idclients}>
                                            <TableCell>
                                                <div className="font-medium">{client.raisonSociale}</div>
                                                <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                    <Briefcase className="h-3 w-3" />
                                                    {client.secteurActivite}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-3 w-3 text-gray-500" />
                                                        <span className="text-sm">{client.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-3 w-3 text-gray-500" />
                                                        <span className="text-sm">{client.telephone}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-3 w-3 text-gray-500" />
                                                    <span>{client.ville}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {formatCurrency(client.soldeNet)}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(client.statutCompte)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-64">
                                                            <DropdownMenuLabel>Détails du client</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />

                                                            <div className="px-2 py-1.5 text-sm space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <FileDigit className="h-4 w-4 text-gray-500" />
                                                                    <span>NIF: {client.nif}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <ScrollText className="h-4 w-4 text-gray-500" />
                                                                    <span>RCCM: {client.rccm}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Navigation className="h-4 w-4 text-gray-500" />
                                                                    <span className="truncate">Adresse: {client.adresse}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <CreditCard className="h-4 w-4 text-gray-500" />
                                                                    <span>Type: {client.typeCompte}</span>
                                                                </div>
                                                            </div>

                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>

                                                            <DropdownMenuItem onClick={() => openEditDialog(client)}>
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Modifier
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => toggleClientStatus(client)}
                                                                className={client.statutCompte === "ACTIF" ? "text-destructive" : "text-green-600"}
                                                            >
                                                                <Shield className="h-4 w-4 mr-2" />
                                                                {client.statutCompte === "ACTIF" ? "Suspendre" : "Activer"}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                            Aucun client trouvé
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Popup modification */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Modifier le client</DialogTitle>
                        <DialogDescription>
                            Modifiez les informations du client. Cliquez sur enregistrer lorsque vous avez terminé.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="raisonSociale">Raison sociale</Label>
                                <Input
                                    id="raisonSociale"
                                    value={editForm.raisonSociale}
                                    onChange={(e) => setEditForm({ ...editForm, raisonSociale: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="secteurActivite">Secteur d&apos;activité</Label>
                                <Select
                                    value={editForm.secteurActivite}
                                    onValueChange={(value) => setEditForm({ ...editForm, secteurActivite: value })}
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
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="telephone">Téléphone</Label>
                                <Input
                                    id="telephone"
                                    value={editForm.telephone}
                                    onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="ville">Ville</Label>
                                <Select
                                    value={editForm.ville}
                                    onValueChange={(value) => setEditForm({ ...editForm, ville: value })}
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
                            <div className="space-y-2">
                                <Label htmlFor="adresse">Adresse</Label>
                                <Input
                                    id="adresse"
                                    value={editForm.adresse}
                                    onChange={(e) => setEditForm({ ...editForm, adresse: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nif">NIF</Label>
                                <Input
                                    id="nif"
                                    value={editForm.nif}
                                    onChange={(e) => setEditForm({ ...editForm, nif: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rccm">RCCM</Label>
                                <Input
                                    id="rccm"
                                    value={editForm.rccm}
                                    onChange={(e) => setEditForm({ ...editForm, rccm: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeEditDialog}>
                            <X className="h-4 w-4 mr-2" />
                            Annuler
                        </Button>
                        <Button onClick={handleEdit}>
                            <Save className="h-4 w-4 mr-2" />
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assistant de création */}
            <CreateClientWizard
                isOpen={isCreateDialogOpen}
                onClose={closeCreateDialog}
                onCreate={handleCreate}
                villes={villes}
                secteurs={secteurs}
            />
        </div>
    )
}
