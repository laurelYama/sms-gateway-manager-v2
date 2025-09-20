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
    CheckCircle,
    XCircle,
    Clock,
    Filter,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Eye,
    AlertCircle,
    List,
    ChevronDown,
    ChevronUp
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getToken } from "@/lib/auth"

interface CreditRequest {
    id: string
    clientId: string
    quantity: number
    status: "PENDING" | "APPROVED" | "REJECTED"
    makerEmail: string
    checkerEmail: string | null
    idempotencyKey: string
    rejectReason: string | null
    createdAt: string
    validatedAt: string | null
    pricePerSmsTtc: number | null
    estimatedAmountTtc: number | null
}

interface ApiResponse {
    totalPages: number
    totalElements: number
    content: CreditRequest[]
    number: number
    size: number
    first: boolean
    last: boolean
}

export default function CreditsPage() {
    const [credits, setCredits] = useState<CreditRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [currentPage, setCurrentPage] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const [totalElements, setTotalElements] = useState(0)
    const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING")
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [selectedCredit, setSelectedCredit] = useState<CreditRequest | null>(null)
    const [rejectReason, setRejectReason] = useState("")
    const [viewReasonDialogOpen, setViewReasonDialogOpen] = useState(false)
    const [selectedRejectedCredit, setSelectedRejectedCredit] = useState<CreditRequest | null>(null)
    const [pageSize, setPageSize] = useState(5)
    const [searchQuery, setSearchQuery] = useState("")
    const [showFilters, setShowFilters] = useState(false)
    const [dateFilter, setDateFilter] = useState("all")

    const token = getToken()

    const loadCredits = async (page: number = 0, status: string = statusFilter, size: number = pageSize) => {
        if (!token) {
            setLoading(false)
            return
        }

        setRefreshing(true)
        try {
            const url = new URL("https://api-smsgateway.solutech-one.com/api/V1/credits")
            url.searchParams.append("page", page.toString())
            url.searchParams.append("size", size.toString())
            if (status !== "ALL") {
                url.searchParams.append("status", status)
            }

            const response = await fetch(url.toString(), {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json",
                },
            })

            if (!response.ok) throw new Error("Erreur API")

            const data: ApiResponse = await response.json()
            setCredits(data.content)
            setTotalPages(data.totalPages)
            setTotalElements(data.totalElements)
            setCurrentPage(data.number)
        } catch (error) {
            console.error("❌ Erreur API crédits:", error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        loadCredits(0, statusFilter, pageSize)
    }, [token, statusFilter, pageSize])

    const handleApprove = async (id: string) => {
        if (!token) return alert("Vous devez être connecté")

        try {
            const response = await fetch(`https://api-smsgateway.solutech-one.com/api/V1/credits/${id}/approve`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            })

            if (response.ok) {
                alert("Demande approuvée")
                loadCredits(currentPage, statusFilter, pageSize)
            } else {
                alert("Erreur lors de l'approbation")
            }
        } catch {
            alert("Erreur lors de l'approbation")
        }
    }

    const openRejectDialog = (credit: CreditRequest) => {
        setSelectedCredit(credit)
        setRejectReason("")
        setRejectDialogOpen(true)
    }

    const handleReject = async () => {
        if (!token || !selectedCredit) return
        if (!rejectReason.trim()) {
            alert("Veuillez saisir un motif de rejet")
            return
        }

        try {
            const response = await fetch(`https://api-smsgateway.solutech-one.com/api/V1/credits/${selectedCredit.id}/reject`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ reason: rejectReason }),
            })

            if (response.ok) {
                setRejectDialogOpen(false)
                alert("Demande rejetée")
                loadCredits(currentPage, statusFilter, pageSize)
            } else {
                alert("Erreur lors du rejet")
            }
        } catch {
            alert("Erreur lors du rejet")
        }
    }

    const openViewReasonDialog = (credit: CreditRequest) => {
        setSelectedRejectedCredit(credit)
        setViewReasonDialogOpen(true)
    }

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            PENDING: { label: "En attente", variant: "secondary", icon: Clock },
            APPROVED: { label: "Approuvé", variant: "default", icon: CheckCircle },
            REJECTED: { label: "Rejeté", variant: "destructive", icon: XCircle }
        }

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
        const IconComponent = config.icon

        return (
            <Badge variant={config.variant as "default" | "destructive" | "secondary"} className="flex items-center gap-1">
                <IconComponent className="h-3 w-3" />
                {config.label}
            </Badge>
        )
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const formatAmount = (amount: number | null) => {
        if (amount === null) return "N/A"
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "XOF",
        }).format(amount)
    }

    const filteredCredits = credits.filter(credit => {
        // Filtre de recherche
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            return (
                credit.clientId.toLowerCase().includes(query) ||
                credit.makerEmail.toLowerCase().includes(query) ||
                (credit.checkerEmail && credit.checkerEmail.toLowerCase().includes(query)) ||
                credit.quantity.toString().includes(query)
            )
        }
        return true
    })

    const startItem = currentPage * pageSize + 1
    const endItem = Math.min((currentPage + 1) * pageSize, totalElements)

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center h-64">
                <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Chargement des demandes de crédit...</p>
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
                            <XCircle className="h-12 w-12 mx-auto mb-4" />
                            <p className="font-semibold">⚠️ Vous devez être connecté pour voir les crédits</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* En-tête */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Gestion des Crédits</h1>
                    <p className="text-gray-600">Demandes d&lsquo;achat de crédits SMS</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadCredits(currentPage, statusFilter, pageSize)}
                        disabled={refreshing}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                        Actualiser
                    </Button>

                    {/* Filtres statut */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Filter className="h-4 w-4 mr-2" />
                                {statusFilter === "ALL" ? "Tous" :
                                    statusFilter === "PENDING" ? "En attente" :
                                        statusFilter === "APPROVED" ? "Approuvés" : "Rejetés"}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setStatusFilter("ALL")}>Tous</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("PENDING")}>En attente</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("APPROVED")}>Approuvés</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("REJECTED")}>Rejetés</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Cartes de statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total demandes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalElements}</div>
                        <p className="text-gray-500 text-sm">Demandes totales</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">En attente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">
                            {credits.filter(c => c.status === "PENDING").length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Approuvés</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {credits.filter(c => c.status === "APPROVED").length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Rejetés</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {credits.filter(c => c.status === "REJECTED").length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tableau des demandes */}
            <Card>
                <CardHeader>
                    <CardTitle>Liste des demandes</CardTitle>
                    <CardDescription>
                        {totalElements} demande(s) - Page {currentPage + 1} / {totalPages} • {pageSize} lignes
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client ID</TableHead>
                                    <TableHead>Email Demandeur</TableHead>
                                    <TableHead>Quantité</TableHead>
                                    <TableHead>Montant estimé</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead>Email Validateur</TableHead>
                                    <TableHead>Date création</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCredits.length > 0 ? (
                                    filteredCredits.map((credit) => (
                                        <TableRow key={credit.id}>
                                            <TableCell className="font-medium">{credit.clientId}</TableCell>
                                            <TableCell>{credit.makerEmail}</TableCell>
                                            <TableCell>{credit.quantity.toLocaleString()}</TableCell>
                                            <TableCell>{formatAmount(credit.estimatedAmountTtc)}</TableCell>
                                            <TableCell>{getStatusBadge(credit.status)}</TableCell>
                                            <TableCell>{credit.checkerEmail || "-"}</TableCell>
                                            <TableCell>{formatDate(credit.createdAt)}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        {credit.status === "PENDING" ? (
                                                            <>
                                                                <DropdownMenuItem onClick={() => handleApprove(credit.id)}>
                                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                                    Approuver
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => openRejectDialog(credit)}>
                                                                    <XCircle className="h-4 w-4 mr-2" />
                                                                    Rejeter
                                                                </DropdownMenuItem>
                                                            </>
                                                        ) : credit.status === "REJECTED" && credit.rejectReason ? (
                                                            <>
                                                                <DropdownMenuItem onClick={() => openViewReasonDialog(credit)}>
                                                                    <Eye className="h-4 w-4 mr-2" />
                                                                    Voir le motif de rejet
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <div className="px-2 py-1.5 text-xs text-gray-500">
                                                                    <p className="font-medium">Motif:</p>
                                                                    <p className="truncate">{credit.rejectReason}</p>
                                                                </div>
                                                            </>
                                                        ) : null}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                                            Aucune demande trouvée
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Filtres en bas */}
                    <div className="mt-4 p-4 border rounded-md bg-gray-50">
                        <Button
                            variant="ghost"
                            className="flex items-center gap-2 mb-2"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter className="h-4 w-4" />
                            Filtres avancés
                            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>

                        {showFilters && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                                <div className="space-y-2">
                                    <Label>Recherche</Label>
                                    <Input
                                        placeholder="Rechercher..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Filtrer par date</Label>
                                    <Select value={dateFilter} onValueChange={setDateFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Toutes les dates" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Toutes les dates</SelectItem>
                                            <SelectItem value="today">Aujourd&lsquo;hui</SelectItem>
                                            <SelectItem value="week">Cette semaine</SelectItem>
                                            <SelectItem value="month">Ce mois</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Trier par</Label>
                                    <Select defaultValue="newest">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Plus récent" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="newest">Plus récent</SelectItem>
                                            <SelectItem value="oldest">Plus ancien</SelectItem>
                                            <SelectItem value="quantity">Quantité</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pagination améliorée */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
                        <div className="text-sm text-muted-foreground">
                            {totalElements > 0 ? (
                                `${startItem}-${endItem} sur ${totalElements} élément(s)`
                            ) : (
                                'Aucun élément'
                            )}
                        </div>

                        <div className="flex items-center space-x-6 lg:space-x-8">
                            <div className="flex items-center space-x-2">
                                <p className="text-sm font-medium">Lignes par page</p>
                                <Select
                                    value={`${pageSize}`}
                                    onValueChange={(value) => {
                                        setPageSize(Number(value))
                                        setCurrentPage(0)
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-[70px]">
                                        <SelectValue placeholder={pageSize} />
                                    </SelectTrigger>
                                    <SelectContent side="top">
                                        {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                                            <SelectItem key={pageSize} value={`${pageSize}`}>
                                                {pageSize}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={() => loadCredits(currentPage - 1, statusFilter, pageSize)}
                                    disabled={currentPage === 0 || refreshing}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <div className="flex items-center space-x-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i;
                                        } else if (currentPage < 2) {
                                            pageNum = i;
                                        } else if (currentPage > totalPages - 3) {
                                            pageNum = totalPages - 5 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                className="h-8 w-8 p-0 text-xs"
                                                onClick={() => loadCredits(pageNum, statusFilter, pageSize)}
                                                disabled={refreshing}
                                            >
                                                {pageNum + 1}
                                            </Button>
                                        );
                                    })}

                                    {totalPages > 5 && currentPage < totalPages - 3 && (
                                        <>
                                            <span className="text-sm">...</span>
                                            <Button
                                                variant="outline"
                                                className="h-8 w-8 p-0 text-xs"
                                                onClick={() => loadCredits(totalPages - 1, statusFilter, pageSize)}
                                                disabled={refreshing}
                                            >
                                                {totalPages}
                                            </Button>
                                        </>
                                    )}
                                </div>

                                <Button
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={() => loadCredits(currentPage + 1, statusFilter, pageSize)}
                                    disabled={currentPage === totalPages - 1 || refreshing}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Dialog rejet */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rejeter la demande</DialogTitle>
                        <DialogDescription>
                            Motif du rejet pour {selectedCredit?.quantity.toLocaleString()} crédits
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="rejectReason">Motif *</Label>
                            <Input
                                id="rejectReason"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Saisissez le motif..."
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Annuler</Button>
                        <Button onClick={handleReject} disabled={!rejectReason.trim()} variant="destructive">
                            <XCircle className="h-4 w-4 mr-2" /> Rejeter
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog motif rejet */}
            <Dialog open={viewReasonDialogOpen} onOpenChange={setViewReasonDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Motif de rejet</DialogTitle>
                        <DialogDescription>
                            Détail pour {selectedRejectedCredit?.quantity.toLocaleString()} crédits
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                <div>
                                    <p className="font-medium text-red-800">Motif :</p>
                                    <p className="text-red-700 mt-1">{selectedRejectedCredit?.rejectReason}</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600">
                            <p>Demandeur: {selectedRejectedCredit?.makerEmail}</p>
                            <p>Validateur: {selectedRejectedCredit?.checkerEmail}</p>
                            <p>Date: {selectedRejectedCredit?.validatedAt ? formatDate(selectedRejectedCredit.validatedAt) : "N/A"}</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setViewReasonDialogOpen(false)}>Fermer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}