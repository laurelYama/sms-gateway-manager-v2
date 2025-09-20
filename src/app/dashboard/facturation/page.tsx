"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"
import { Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FacturationActions } from "@/components/facturation/FacturationActions"
import { FacturationTable } from "@/components/facturation/FacturationTable"
import { CalendrierButton } from "@/components/facturation/CalendrierButton"
import { GenerationFactureDialog } from "@/components/facturation/GenerationFactureDialog"
import { FooterConfigDialog } from "@/components/facturation/FooterConfigDialog"
import { Facture, Exercice, Calendrier, FooterConfig, GenerationParams } from "@/components/facturation/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

interface Facture {
    id: string
    clientId: string
    dateDebut: string
    dateFin: string
    consommationSms: number
    prixUnitaire: number
    montant: number
}

interface Exercice {
    id: string
    annee: number
    statut: string
    createdAt: string
}

interface Calendrier {
    id: string
    mois: number
    dateDebutConsommation: string
    dateFinConsommation: string
    dateGenerationFacture: string
    exercice: Exercice
}

interface FooterConfig {
    companyName: string
    companyAddress: string
    companyNif: string
    companyRccm: string
    companyEmail: string
    companyPhone: string
    paymentNote: string
}

export default function FacturationPage() {
    const [factures, setFactures] = useState<Facture[]>([])
    const [calendrier, setCalendrier] = useState<Calendrier | null>(null)
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
    const [loading, setLoading] = useState<boolean>(true)
    const [generating, setGenerating] = useState<boolean>(false)
    const [generationDialogOpen, setGenerationDialogOpen] = useState<boolean>(false)
    const [footerDialogOpen, setFooterDialogOpen] = useState<boolean>(false)
    const [footerConfig, setFooterConfig] = useState<FooterConfig>({
        companyName: "",
        companyAddress: "",
        companyNif: "",
        companyRccm: "",
        companyEmail: "",
        companyPhone: "",
        paymentNote: ""
    })
  
    // Pagination
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize, setPageSize] = useState(10)
    const [totalPages, setTotalPages] = useState(1)
    const [totalElements, setTotalElements] = useState(0)

    const { token } = useAuth()

    const loadClientInfo = async (clientId: string) => {
        try {
            const response = await fetch(
                `https://api-smsgateway.solutech-one.com/api/V1/clients/${clientId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            )

            if (response.ok) {
                const clientData = await response.json()
                return clientData.raisonSociale || `Client ${clientId}`
            }
            return `Client ${clientId}`
        } catch (error) {
            console.error("Erreur lors du chargement des informations du client:", error)
            return `Client ${clientId}`
        }
    }

    const loadFactures = useCallback(async () => {
        if (!token) return

        setLoading(true)
        try {
            // Chargement des factures
            const response = await fetch(
                'https://api-smsgateway.solutech-one.com/api/V1/billing/factures', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            )

            if (!response.ok) {
                throw new Error("Erreur lors du chargement des factures")
            }

            const facturesData = await response.json()
            
            // Si ce n'est pas un tableau, on retourne un tableau vide
            if (!Array.isArray(facturesData)) {
                setFactures([])
                return
            }

            // Pour chaque facture, on charge les informations du client
            const facturesAvecClients = await Promise.all(
                facturesData.map(async (facture: any) => {
                    const clientNom = await loadClientInfo(facture.clientId)
                    return {
                        ...facture,
                        clientNom,
                        clientEmail: facture.clientEmail || ''
                    }
                })
            )

            setFactures(facturesAvecClients)
        } catch (error) {
            console.error("Erreur lors du chargement des factures:", error)
            toast.error("Erreur lors du chargement des factures")
        } finally {
            setLoading(false)
        }
    }, [token])

    const loadCalendrier = useCallback(async (annee: number) => {
        if (!token) return

        try {
            const response = await fetch(
                `https://api-smsgateway.solutech-one.com/api/V1/billing/exercices/${annee}/calendrier`, 
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                    cache: 'no-store'
                }
            )

            if (!response.ok) throw new Error("Erreur API calendrier")

            const data = await response.json()
            setCalendrier(data)
        } catch (error) {
            console.error("Erreur lors du chargement du calendrier:", error)
            toast.error("Erreur lors du chargement du calendrier")
        }
    }, [token])

    const loadFooterConfig = useCallback(async () => {
        if (!token) return

        try {
            const response = await fetch("https://api-smsgateway.solutech-one.com/api/v1/footer", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                cache: 'no-store'
            })

            if (response.ok) {
                const data = await response.json()
                setFooterConfig(data)
            }
        } catch (error) {
            console.error("Erreur lors du chargement de la configuration du pied de page:", error)
            toast.error("Erreur lors du chargement de la configuration du pied de page")
        }
    }, [token])

    // Chargement initial des données
    useEffect(() => {
        if (token) {
            loadFactures()
            loadCalendrier(selectedYear)
            loadFooterConfig()
        }
    }, [token, loadFactures, loadCalendrier, loadFooterConfig, selectedYear])

    // Mise à jour de la pagination lorsque les données changent
    useEffect(() => {
        setTotalPages(Math.ceil(factures.length / pageSize) || 1)
        setTotalElements(factures.length)
    }, [factures, pageSize])

    // Calcul des factures à afficher pour la page courante
    const paginatedFactures = factures.slice(
        currentPage * pageSize,
        (currentPage + 1) * pageSize
    )

    const handleGenerateInvoices = useCallback(async (params: GenerationParams) => {
        if (!token) return

        setGenerating(true)
        try {
            const response = await fetch(
                `https://api-smsgateway.solutech-one.com/api/V1/billing/generer?annee=${params.annee}&mois=${params.mois}`, 
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            )

            if (!response.ok) throw new Error("Erreur lors de la génération des factures")

            const result = await response.json()
            toast.success(
                `Factures générées avec succès: ${result.generated} factures créées`
            )
            
            // Recharger les données
            await loadFactures()
            setGenerationDialogOpen(false)
        } catch (error) {
            console.error("Erreur lors de la génération des factures:", error)
            toast.error("Erreur lors de la génération des factures")
        } finally {
            setGenerating(false)
        }
    }, [token, loadFactures])

    const handleDownloadAll = useCallback(async () => {
        if (!token) return
            
        toast.info("Téléchargement de toutes les factures en cours...")
            
        // Implémentez la logique de téléchargement groupé ici
        // Cette fonctionnalité pourrait nécessiter une implémentation côté serveur
        toast.warning("Fonctionnalité de téléchargement groupé non implémentée")
    }, [token])

    const handleSendAll = useCallback(async () => {
        if (!token) return
            
        toast.info("Envoi de toutes les factures en cours...")
            
        // Implémentez la logique d'envoi groupé ici
        // Cette fonctionnalité pourrait nécessiter une implémentation côté serveur
        toast.warning("Fonctionnalité d'envoi groupé non implémentée")
    }, [token])

    const handlePreviewInvoice = useCallback(async (factureId: string) => {
        if (!token) return

        try {
            const pdfUrl = `https://api-smsgateway.solutech-one.com/api/V1/billing/factures/${factureId}/pdf`

            const response = await fetch(pdfUrl, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store'
            })

            if (!response.ok) throw new Error("Erreur d'accès au PDF")

            const blob = await response.blob()
            const blobUrl = URL.createObjectURL(blob)
            window.open(blobUrl, "_blank")
            
            // Nettoyer l'URL après utilisation
            setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
        } catch (error) {
            console.error("Erreur lors de la prévisualisation de la facture:", error)
            toast.error("Impossible d'accéder au PDF de la facture")
        }
    }, [token])

    const handleDownloadInvoice = useCallback(async (factureId: string) => {
        if (!token) return

        try {
            const response = await fetch(
                `https://api-smsgateway.solutech-one.com/api/V1/billing/factures/${factureId}/pdf`, 
                {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: 'no-store'
                }
            )

            if (!response.ok) throw new Error("Erreur de téléchargement du PDF")

            const blob = await response.blob()
            const blobUrl = URL.createObjectURL(blob)

            const link = document.createElement('a')
            link.href = blobUrl
            link.download = `facture-${factureId}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            // Nettoyage
            setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
        } catch (error) {
            console.error("Erreur lors du téléchargement de la facture:", error)
            toast.error("Erreur lors du téléchargement de la facture")
        }
    }, [token])

    const handleSaveFooterConfig = useCallback(async (config: FooterConfig) => {
        if (!token) return

        try {
            const response = await fetch("https://api-smsgateway.solutech-one.com/api/v1/footer", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(config)
            })

            if (!response.ok) throw new Error("Erreur lors de la sauvegarde de la configuration")

            setFooterConfig(config)
            setFooterDialogOpen(false)
            toast.success("Configuration du pied de page enregistrée avec succès")
        } catch (error) {
            console.error("Erreur lors de l'enregistrement de la configuration:", error)
            toast.error("Erreur lors de l'enregistrement de la configuration")
        }
    }, [token])

    const handleYearChange = useCallback((year: number) => {
        setSelectedYear(year)
    }, [])

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center h-64">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Chargement des factures...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="space-y-6">
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Gestion de la Facturation</h1>
                        <p className="text-muted-foreground">
                            Générez et gérez les factures mensuelles de vos clients
                        </p>
                    </div>
                    <CalendrierButton 
                        calendrier={calendrier}
                        selectedYear={selectedYear}
                        onYearChange={handleYearChange}
                        loading={loading}
                    />
                </div>
                
                <div className="space-y-4">
                    <FacturationActions 
                        onGenerate={() => setGenerationDialogOpen(true)}
                        onDownloadAll={handleDownloadAll}
                        onSendAll={handleSendAll}
                        onConfigureFooter={() => setFooterDialogOpen(true)}
                        loading={loading}
                    />
                    
                    <FacturationTable 
                        factures={paginatedFactures}
                        onPreview={handlePreviewInvoice}
                        onDownload={handleDownloadInvoice}
                        onSend={handleSendAll}
                        loading={loading}
                    />
                    
                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            {totalElements > 0 ? (
                                `${(currentPage * pageSize) + 1}-${Math.min((currentPage + 1) * pageSize, totalElements)} sur ${totalElements} facture(s)`
                            ) : (
                                'Aucune facture trouvée'
                            )}
                        </div>

                        <div className="flex items-center space-x-6 lg:space-x-8">
                            <div className="flex items-center space-x-2">
                                <p className="text-sm font-medium">Lignes par page</p>
                                <Select
                                    value={`${pageSize}`}
                                    onValueChange={(value) => {
                                        setPageSize(Number(value))
                                        setCurrentPage(0) // Reset à la première page lors du changement de taille
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-[70px]">
                                        <SelectValue placeholder={pageSize} />
                                    </SelectTrigger>
                                    <SelectContent side="top">
                                        {[5, 10, 20, 30, 50].map((size) => (
                                            <SelectItem key={size} value={`${size}`}>
                                                {size}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={() => setCurrentPage(0)}
                                    disabled={currentPage === 0}
                                >
                                    <span className="sr-only">Première page</span>
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
                                    disabled={currentPage === 0}
                                >
                                    <span className="sr-only">Page précédente</span>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="flex items-center justify-center text-sm font-medium w-8">
                                    {currentPage + 1}
                                </div>
                                <Button
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))}
                                    disabled={currentPage >= totalPages - 1}
                                >
                                    <span className="sr-only">Page suivante</span>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={() => setCurrentPage(totalPages - 1)}
                                    disabled={currentPage >= totalPages - 1}
                                >
                                    <span className="sr-only">Dernière page</span>
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <GenerationFactureDialog 
                    open={generationDialogOpen}
                    onOpenChange={setGenerationDialogOpen}
                    onSubmit={handleGenerateInvoices}
                    loading={generating}
                    defaultValues={{
                        annee: new Date().getFullYear(),
                        mois: new Date().getMonth() + 1
                    }}
                />

                <FooterConfigDialog
                    open={footerDialogOpen}
                    onOpenChange={setFooterDialogOpen}
                    onSubmit={handleSaveFooterConfig}
                    defaultValues={footerConfig}
                    loading={false}
                />
            </div>
        </div>
    )
}
