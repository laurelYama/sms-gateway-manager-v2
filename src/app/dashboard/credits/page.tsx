"use client"

import { useCallback, useEffect, useState } from "react"
import { API_BASE_URL } from "@/lib/config"
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle, RefreshCw } from "lucide-react"
import { getToken } from "@/lib/auth"
import { CreditList } from "@/components/credits/CreditList"
import { CreditFilters } from "@/components/credits/CreditFilters"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
// Removed unused Input/Label imports to reduce build lint warnings
import { RejectCreditDialog } from "@/components/credits/RejectCreditDialog"

import { CreditRequest, ApiResponse } from '@/types/credit'

export default function CreditsPage() {
    const [credits, setCredits] = useState<CreditRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const [totalElements, setTotalElements] = useState(0)
    const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING")
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [selectedCredit, setSelectedCredit] = useState<CreditRequest | null>(null)
    const [rejectLoading, setRejectLoading] = useState(false)
    const [viewReasonDialogOpen, setViewReasonDialogOpen] = useState(false)
    const [selectedRejectedCredit, setSelectedRejectedCredit] = useState<CreditRequest | null>(null)
    const [pageSize, setPageSize] = useState(5)

    // Compteurs globaux indépendants de la pagination
    const [pendingCount, setPendingCount] = useState<number>(0)
    const [approvedCount, setApprovedCount] = useState<number>(0)
    const [rejectedCount, setRejectedCount] = useState<number>(0)

    const token = getToken()

    const loadCredits = useCallback(async (page: number = 0, status: string = statusFilter, size: number = pageSize) => {
        if (!token) {
            setLoading(false)
            return
        }
        
        setLoading(true)
        try {
            const url = new URL(`${API_BASE_URL}/api/V1/credits`)
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

    // Charger les compteurs globaux par statut (indépendants de la pagination)
    const loadCounts = useCallback(async () => {
        if (!token) return
        try {
            const statuses = ["PENDING", "APPROVED", "REJECTED"] as const
            const urls = statuses.map(s => {
                const u = new URL(`${API_BASE_URL}/api/V1/credits`)
                u.searchParams.append("page", "0")
                u.searchParams.append("size", "1") // inutile d'apporter plus, on lit totalElements
                u.searchParams.append("status", s)
                return u.toString()
            })
            const responses = await Promise.all(urls.map(u => fetch(u, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json",
                },
            })))
            const jsons = await Promise.all(responses.map(r => r.json()))
            // Attendu: { totalElements, ... }
            setPendingCount(jsons[0]?.totalElements ?? 0)
            setApprovedCount(jsons[1]?.totalElements ?? 0)
            setRejectedCount(jsons[2]?.totalElements ?? 0)
        } catch (err) {
            console.error("Erreur lors du chargement des compteurs:", err)
        }
    }, [token])

    // Chargement initial des données
    useEffect(() => {
        if (token) {
            loadCredits(currentPage, statusFilter, pageSize)
            // Charger/rafraîchir aussi les compteurs globaux
            loadCounts()
        }
    }, [token, currentPage, pageSize, statusFilter, loadCounts, loadCredits])

    const handleRefresh = useCallback(() => {
        return loadCredits(currentPage, statusFilter, pageSize)
    }, [currentPage, statusFilter, pageSize, loadCredits])

    const handleApprove = async (id: string) => {
        if (!token) return

        try {
            const response = await fetch(`${API_BASE_URL}/api/V1/credits/${id}/approve`, {
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

    const handleReject = async (reasonParam: string) => {
        if (!selectedCredit || !token) {
            console.error("Aucun crédit sélectionné ou token manquant")
            return
        }

        try {
            console.log("Tentative de rejet du crédit:", selectedCredit.id)
            console.log("Raison du rejet:", reasonParam)
            
            const url = `${API_BASE_URL}/api/V1/credits/${selectedCredit.id}/reject`
            console.log("URL de la requête:", url)
            
            const requestBody = {
                reason: reasonParam.trim()
            }
            console.log("Corps de la requête:", requestBody)
            
            setRejectLoading(true)
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
            await loadCredits(currentPage, statusFilter, pageSize)
            toast.success("Le crédit a été rejeté avec succès")
        } catch (error) {
            console.error("Erreur lors du rejet:", error)
            toast.error(`Échec du rejet: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
        } finally {
            setRejectLoading(false)
        }
    }

    // Note: helper functions (status badge, date and amount formatting) were removed
    // because they were unused in this page; keep formatting logic close to where
    // it's actually rendered if/when needed.

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
                        <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
                        <p className="text-gray-500 text-sm">En attente de validation</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Approuvés</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
                        <p className="text-gray-500 text-sm">Approuvés (tous)</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Rejetés</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
                        <p className="text-gray-500 text-sm">Rejetés (tous)</p>
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

            {/* Dialog de rejet - avec sélection de motifs */}
            <RejectCreditDialog
                open={rejectDialogOpen}
                onOpenChange={setRejectDialogOpen}
                credit={selectedCredit}
                loading={rejectLoading}
                onReject={(reason) => handleReject(reason)}
            />

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
