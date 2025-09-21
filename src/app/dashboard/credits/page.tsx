"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, XCircle, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { getToken } from "@/lib/auth"
import { CreditList } from "@/components/credits/CreditList"
import { CreditFilters } from "@/components/credits/CreditFilters"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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

    const token = getToken()

    const loadCredits = useCallback(async (page: number = 0, status: string = statusFilter, size: number = pageSize) => {
        if (!token) {
            setLoading(false)
            return
        }
        
        setLoading(true)
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
            console.error("Erreur API crédits:", error)
        } finally {
            setLoading(false)
        }
    }, [token, statusFilter, pageSize])

    // Chargement initial des données
    useEffect(() => {
        if (token) {
            loadCredits(currentPage, statusFilter, pageSize)
        }
    }, [token, currentPage, pageSize, statusFilter])

    const handleRefresh = useCallback(() => {
        return loadCredits(currentPage, statusFilter, pageSize)
    }, [currentPage, statusFilter, pageSize, loadCredits])

    const handleApprove = async (id: string) => {
        if (!token) return

        try {
            const response = await fetch(`https://api-smsgateway.solutech-one.com/api/V1/credits/${id}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) throw new Error("Erreur lors de l'approbation")
            
            // Recharger les crédits après l'approbation
            loadCredits(currentPage, statusFilter, pageSize)
        } catch (error) {
            console.error("Erreur lors de l'approbation:", error)
        }
    }

    const openRejectDialog = (credit: CreditRequest) => {
        setSelectedCredit(credit)
        setRejectDialogOpen(true)
    }

    const viewRejectReason = (credit: CreditRequest) => {
        setSelectedRejectedCredit(credit)
        setViewReasonDialogOpen(true)
    }

    const handleReject = async () => {
        if (!selectedCredit || !token) {
            console.error("Aucun crédit sélectionné ou token manquant")
            return
        }

        try {
            console.log("Tentative de rejet du crédit:", selectedCredit.id)
            console.log("Raison du rejet:", rejectReason)
            
            const url = `https://api-smsgateway.solutech-one.com/api/V1/credits/${selectedCredit.id}/reject`
            console.log("URL de la requête:", url)
            
            const requestBody = {
                reason: rejectReason.trim()
            }
            console.log("Corps de la requête:", requestBody)
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            })

            const responseData = await response.json().catch(() => ({}))
            console.log("Réponse de l'API:", {
                status: response.status,
                statusText: response.statusText,
                data: responseData
            })

            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: ${response.statusText}`)
            }
            
            // Réinitialiser le formulaire et recharger les crédits
            setRejectDialogOpen(false)
            setRejectReason("")
            await loadCredits(currentPage, statusFilter, pageSize)
            toast.success("Le crédit a été rejeté avec succès")
        } catch (error) {
            console.error("Erreur lors du rejet:", error)
            toast.error(`Échec du rejet: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
        }
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

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        loadCredits(page, statusFilter, pageSize)
    }

    const handlePageSizeChange = (size: number) => {
        setPageSize(size)
        setCurrentPage(0) // Réinitialiser à la première page
        loadCredits(0, statusFilter, size)
    }

    const filteredCredits = credits

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
        <div className="container mx-auto py-6 px-4">
            {/* Filtres */}
            <CreditFilters
                statusFilter={statusFilter}
                onStatusFilterChange={(value) => setStatusFilter(value as "ALL" | "PENDING" | "APPROVED" | "REJECTED")}
                onRefresh={handleRefresh}
                loading={loading}
            />

            {/* Cartes de statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Demandes ce mois</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {credits.filter(c => {
                                const creditDate = new Date(c.createdAt);
                                const now = new Date();
                                return creditDate.getMonth() === now.getMonth() && 
                                       creditDate.getFullYear() === now.getFullYear();
                            }).length}
                        </div>
                        <p className="text-gray-500 text-sm">Demandes ce mois-ci</p>
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
                        <p className="text-gray-500 text-sm">En attente de validation</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Approuvés</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {credits.filter(c => {
                                if (c.status !== "APPROVED") return false;
                                const creditDate = new Date(c.validatedAt || c.createdAt);
                                const now = new Date();
                                return creditDate.getMonth() === now.getMonth() && 
                                       creditDate.getFullYear() === now.getFullYear();
                            }).length}
                        </div>
                        <p className="text-gray-500 text-sm">Approuvés ce mois-ci</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Rejetés</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {credits.filter(c => {
                                if (c.status !== "REJECTED") return false;
                                const creditDate = new Date(c.validatedAt || c.createdAt);
                                const now = new Date();
                                return creditDate.getMonth() === now.getMonth() && 
                                       creditDate.getFullYear() === now.getFullYear();
                            }).length}
                        </div>
                        <p className="text-gray-500 text-sm">Rejetés ce mois-ci</p>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-6 border rounded-lg overflow-hidden">
                <CreditList
                    credits={filteredCredits}
                    loading={loading}
                    onApprove={handleApprove}
                    onReject={openRejectDialog}
                    onViewReason={viewRejectReason}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalElements={totalElements}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                />
            </div>

            {/* Dialog de rejet */}
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
                                placeholder="Saisissez le motif du rejet"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                            Annuler
                        </Button>
                        <Button onClick={handleReject} disabled={!rejectReason.trim() || loading}>
                            {loading ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Traitement...
                                </>
                            ) : (
                                'Confirmer le rejet'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog de visualisation du motif de rejet */}
            <Dialog open={viewReasonDialogOpen} onOpenChange={setViewReasonDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Motif du rejet</DialogTitle>
                        <DialogDescription>
                            Détails du rejet pour {selectedRejectedCredit?.quantity.toLocaleString()} crédits
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">
                                        {selectedRejectedCredit?.rejectReason || "Aucun motif fourni"}
                                    </h3>
                                    {selectedRejectedCredit?.checkerEmail && (
                                        <div className="mt-2 text-sm text-red-700">
                                            <p>Rejeté par : {selectedRejectedCredit.checkerEmail}</p>
                                            {selectedRejectedCredit.validatedAt && (
                                                <p>Le {new Date(selectedRejectedCredit.validatedAt).toLocaleDateString('fr-FR')}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
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
