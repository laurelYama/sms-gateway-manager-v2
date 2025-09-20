"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import {
    Plus,
    Download,
    Send,
    Calendar,
    Eye,
    Settings,
    RefreshCw,
    FileText,
    Receipt,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    Clock,
    AlertCircle
} from "lucide-react"
import { getToken } from "@/lib/auth"

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
    const [calendrier, setCalendrier] = useState<Calendrier[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [sending, setSending] = useState(false)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [footerDialogOpen, setFooterDialogOpen] = useState(false)
    const [footerConfig, setFooterConfig] = useState<FooterConfig>({
        companyName: "",
        companyAddress: "",
        companyNif: "",
        companyRccm: "",
        companyEmail: "",
        companyPhone: "",
        paymentNote: ""
    })
    const [newExercice, setNewExercice] = useState({
        annee: new Date().getFullYear(),
        invoiceDayOfNextMonth: 1,
        overwriteIfExists: false
    })
    const [selectedGeneration, setSelectedGeneration] = useState({
        annee: new Date().getFullYear(),
        mois: new Date().getMonth() + 1
    })
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const token = getToken()

    const loadFactures = async () => {
        if (!token) return

        setLoading(true)
        try {
            const response = await fetch("https://api-smsgateway.solutech-one.com/api/V1/billing/factures", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            })

            if (!response.ok) throw new Error("Erreur API factures")

            const data = await response.json()
            setFactures(data)
        } catch (error) {
            console.error("Erreur:", error)
        } finally {
            setLoading(false)
        }
    }

    const loadCalendrier = async (annee: number) => {
        if (!token) return

        try {
            const response = await fetch(`https://api-smsgateway.solutech-one.com/api/V1/billing/exercices/${annee}/calendrier`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            })

            if (!response.ok) throw new Error("Erreur API calendrier")

            const data = await response.json()
            setCalendrier(data)
        } catch (error) {
            console.error("Erreur:", error)
        }
    }

    const loadFooterConfig = async () => {
        if (!token) return

        try {
            const response = await fetch("https://api-smsgateway.solutech-one.com/api/v1/footer", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            })

            if (response.ok) {
                const data = await response.json()
                setFooterConfig(data)
            }
        } catch (error) {
            console.error("Erreur:", error)
        }
    }

    useEffect(() => {
        loadFactures()
        loadCalendrier(selectedYear)
        loadFooterConfig()
    }, [token, selectedYear])

    const createExercice = async () => {
        if (!token) return

        try {
            const response = await fetch("https://api-smsgateway.solutech-one.com/api/V1/billing/exercices", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(newExercice)
            })

            if (!response.ok) throw new Error("Erreur création exercice")

            await loadCalendrier(newExercice.annee)
            setSelectedYear(newExercice.annee)
            setCreateDialogOpen(false)
            alert("Exercice créé avec succès")
        } catch (error) {
            console.error("Erreur:", error)
            alert("Erreur lors de la création de l'exercice")
        }
    }

    const genererFacture = async () => {
        if (!token) return

        setGenerating(true)
        try {
            const response = await fetch(`https://api-smsgateway.solutech-one.com/api/V1/billing/generer?annee=${selectedGeneration.annee}&mois=${selectedGeneration.mois}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            })

            if (!response.ok) throw new Error("Erreur génération facture")

            const result = await response.json()
            alert(`Factures générées: ${result.generated}\nZéro consommation: ${result.skippedZero}`)

            // Recharger les factures
            await loadFactures()
        } catch (error) {
            console.error("Erreur:", error)
            alert("Erreur lors de la génération des factures")
        } finally {
            setGenerating(false)
        }
    }

    const envoyerFacture = async (factureId: string) => {
        if (!token) return

        setSending(true)
        try {
            const response = await fetch(`https://api-smsgateway.solutech-one.com/api/V1/billing/factures/${factureId}/send`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            })

            if (!response.ok) throw new Error("Erreur envoi facture")

            alert("Facture envoyée avec succès")
        } catch (error) {
            console.error("Erreur:", error)
            alert("Erreur lors de l'envoi de la facture")
        } finally {
            setSending(false)
        }
    }

    const previsualiserFacture = async (factureId: string) => {
        if (!token) return

        try {
            const pdfUrl = `https://api-smsgateway.solutech-one.com/api/V1/billing/factures/${factureId}/pdf`

            const response = await fetch(pdfUrl, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) throw new Error("Erreur accès PDF")

            const blob = await response.blob()
            const blobUrl = URL.createObjectURL(blob)

            window.open(blobUrl, "_blank")

            setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
        } catch (error) {
            console.error("Erreur:", error)
            alert("Impossible d'accéder au PDF")
        }
    }

    const downloadFacture = async (factureId: string) => {
        if (!token) return

        try {
            const response = await fetch(`https://api-smsgateway.solutech-one.com/api/V1/billing/factures/${factureId}/pdf`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) throw new Error("Erreur téléchargement PDF")

            const blob = await response.blob()
            const blobUrl = URL.createObjectURL(blob)

            const link = document.createElement('a')
            link.href = blobUrl
            link.download = `facture-${factureId}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
        } catch (error) {
            console.error("Erreur:", error)
            alert("Impossible de télécharger le PDF")
        }
    }

    const updateFooterConfig = async () => {
        if (!token) return

        try {
            const response = await fetch("https://api-smsgateway.solutech-one.com/api/v1/footer", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(footerConfig)
            })

            if (!response.ok) throw new Error("Erreur mise à jour footer")

            setFooterDialogOpen(false)
            alert("Configuration du footer mise à jour")
        } catch (error) {
            console.error("Erreur:", error)
            alert("Erreur lors de la mise à jour du footer")
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "XOF",
        }).format(amount)
    }

    const getMonthName = (month: number) => {
        const months = [
            "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
            "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
        ]
        return months[month - 1] || ""
    }

    const getStatusIcon = (statut: string) => {
        switch (statut) {
            case "OUVERT":
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case "EN_COURS":
                return <Clock className="h-4 w-4 text-blue-500" />
            default:
                return <AlertCircle className="h-4 w-4 text-gray-500" />
        }
    }

    const getStatusColor = (statut: string) => {
        switch (statut) {
            case "OUVERT":
                return "bg-green-100 text-green-800 border-green-200"
            case "EN_COURS":
                return "bg-blue-100 text-blue-800 border-blue-200"
            default:
                return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    const isCurrentMonth = (mois: number, annee: number) => {
        const now = new Date()
        return mois === now.getMonth() + 1 && annee === now.getFullYear()
    }

    const isFutureMonth = (mois: number, annee: number) => {
        const now = new Date()
        return annee > now.getFullYear() || (annee === now.getFullYear() && mois > now.getMonth() + 1)
    }

    const navigateYear = (direction: 'prev' | 'next') => {
        setSelectedYear(prev => direction === 'prev' ? prev - 1 : prev + 1)
    }

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center h-64">
                <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Chargement des factures...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* En-tête */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Facturation</h1>
                    <p className="text-gray-600">Gestion des factures et exercices comptables</p>
                </div>

                <div className="flex items-center gap-2">
                    <Button onClick={() => setFooterDialogOpen(true)} variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Footer
                    </Button>
                    <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvel exercice
                    </Button>
                    <Button onClick={loadFactures} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Actualiser
                    </Button>
                </div>
            </div>

            {/* Cartes de stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total factures</CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{factures.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(factures.reduce((sum, f) => sum + f.montant, 0))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">SMS consommés</CardTitle>
                        <Send className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {factures.reduce((sum, f) => sum + f.consommationSms, 0)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Exercices</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Array.from(new Set(calendrier.map(c => c.exercice.annee))).length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Section génération de factures */}
            <Card>
                <CardHeader>
                    <CardTitle>Génération de factures</CardTitle>
                    <CardDescription>Générez les factures pour un mois spécifique</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="grid grid-cols-2 gap-4 flex-1">
                            <div className="space-y-2">
                                <Label>Année</Label>
                                <Select
                                    value={selectedGeneration.annee.toString()}
                                    onValueChange={(value) => setSelectedGeneration(prev => ({
                                        ...prev,
                                        annee: parseInt(value)
                                    }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner une année" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[2024, 2025, 2026].map(year => (
                                            <SelectItem key={year} value={year.toString()}>
                                                {year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Mois</Label>
                                <Select
                                    value={selectedGeneration.mois.toString()}
                                    onValueChange={(value) => setSelectedGeneration(prev => ({
                                        ...prev,
                                        mois: parseInt(value)
                                    }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un mois" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                            <SelectItem key={month} value={month.toString()}>
                                                {getMonthName(month)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button onClick={genererFacture} disabled={generating}>
                            {generating ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <FileText className="h-4 w-4 mr-2" />
                            )}
                            Générer les factures
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Tableau des factures */}
            <Card>
                <CardHeader>
                    <CardTitle>Liste des factures</CardTitle>
                    <CardDescription>{factures.length} facture(s) trouvée(s)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Période</TableHead>
                                    <TableHead>SMS</TableHead>
                                    <TableHead>Prix unitaire</TableHead>
                                    <TableHead>Montant</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {factures.length > 0 ? (
                                    factures.map((facture) => (
                                        <TableRow key={facture.id}>
                                            <TableCell className="font-medium">{facture.clientId}</TableCell>
                                            <TableCell>
                                                {new Date(facture.dateDebut).toLocaleDateString()} -{" "}
                                                {new Date(facture.dateFin).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>{facture.consommationSms}</TableCell>
                                            <TableCell>{formatCurrency(facture.prixUnitaire)}</TableCell>
                                            <TableCell className="font-medium">
                                                {formatCurrency(facture.montant)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => previsualiserFacture(facture.id)}
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        Voir
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => envoyerFacture(facture.id)}
                                                        disabled={sending}
                                                    >
                                                        <Send className="h-4 w-4 mr-2" />
                                                        Envoyer
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => downloadFacture(facture.id)}
                                                    >
                                                        <Download className="h-4 w-4 mr-2" />
                                                        PDF
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                            Aucune facture trouvée
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Calendrier des exercices - Version améliorée */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Calendrier des exercices</CardTitle>
                            <CardDescription>Planning de génération des factures</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigateYear('prev')}
                                disabled={selectedYear <= 2020}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-lg font-bold bg-primary text-primary-foreground px-3 py-1 rounded-md">
                {selectedYear}
              </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigateYear('next')}
                                disabled={selectedYear >= 2030}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                            const moisCalendrier = calendrier.find(c => c.mois === month)
                            const isCurrent = isCurrentMonth(month, selectedYear)
                            const isFuture = isFutureMonth(month, selectedYear)

                            return (
                                <div
                                    key={month}
                                    className={`rounded-lg border p-4 transition-all duration-200 ${
                                        isCurrent
                                            ? 'bg-primary/10 border-primary shadow-md ring-2 ring-primary/20'
                                            : isFuture
                                                ? 'bg-muted/50 border-muted'
                                                : 'bg-white border-border hover:shadow-md'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-lg">
                                            {getMonthName(month)}
                                        </h3>
                                        {isCurrent && (
                                            <Badge variant="default" className="animate-pulse">
                                                En cours
                                            </Badge>
                                        )}
                                    </div>

                                    {moisCalendrier ? (
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(moisCalendrier.exercice.statut)}
                                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(moisCalendrier.exercice.statut)}`}>
                          {moisCalendrier.exercice.statut}
                        </span>
                                            </div>

                                            <div className="grid gap-1">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Début:</span>
                                                    <span className="font-medium">
                            {new Date(moisCalendrier.dateDebutConsommation).toLocaleDateString()}
                          </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Fin:</span>
                                                    <span className="font-medium">
                            {new Date(moisCalendrier.dateFinConsommation).toLocaleDateString()}
                          </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Génération:</span>
                                                    <span className="font-medium">
                            {new Date(moisCalendrier.dateGenerationFacture).toLocaleDateString()}
                          </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-muted-foreground">
                                            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">Aucun exercice planifié</p>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Dialog création exercice */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Créer un nouvel exercice</DialogTitle>
                        <DialogDescription>
                            Configurez un nouvel exercice comptable pour l'année sélectionnée
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="annee">Année</Label>
                            <Input
                                id="annee"
                                type="number"
                                value={newExercice.annee}
                                onChange={(e) => setNewExercice(prev => ({
                                    ...prev,
                                    annee: parseInt(e.target.value) || new Date().getFullYear()
                                }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invoiceDay">Jour de génération des factures</Label>
                            <Input
                                id="invoiceDay"
                                type="number"
                                min="1"
                                max="28"
                                value={newExercice.invoiceDayOfNextMonth}
                                onChange={(e) => setNewExercice(prev => ({
                                    ...prev,
                                    invoiceDayOfNextMonth: parseInt(e.target.value) || 1
                                }))}
                            />
                            <p className="text-sm text-muted-foreground">
                                Jour du mois suivant pour la génération automatique des factures
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="overwrite"
                                checked={newExercice.overwriteIfExists}
                                onChange={(e) => setNewExercice(prev => ({
                                    ...prev,
                                    overwriteIfExists: e.target.checked
                                }))}
                                className="rounded border-gray-300"
                            />
                            <Label htmlFor="overwrite" className="text-sm">
                                Écraser si l'exercice existe déjà
                            </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                            Annuler
                        </Button>
                        <Button onClick={createExercice}>
                            Créer l'exercice
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog configuration footer */}
            <Dialog open={footerDialogOpen} onOpenChange={setFooterDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Configuration du footer des factures</DialogTitle>
                        <DialogDescription>
                            Personnalisez les informations qui apparaîtront en bas de vos factures
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Nom de l'entreprise</Label>
                                <Input
                                    id="companyName"
                                    value={footerConfig.companyName}
                                    onChange={(e) => setFooterConfig(prev => ({
                                        ...prev,
                                        companyName: e.target.value
                                    }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="companyAddress">Adresse</Label>
                                <Input
                                    id="companyAddress"
                                    value={footerConfig.companyAddress}
                                    onChange={(e) => setFooterConfig(prev => ({
                                        ...prev,
                                        companyAddress: e.target.value
                                    }))}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyNif">NIF</Label>
                                <Input
                                    id="companyNif"
                                    value={footerConfig.companyNif}
                                    onChange={(e) => setFooterConfig(prev => ({
                                        ...prev,
                                        companyNif: e.target.value
                                    }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="companyRccm">RCCM</Label>
                                <Input
                                    id="companyRccm"
                                    value={footerConfig.companyRccm}
                                    onChange={(e) => setFooterConfig(prev => ({
                                        ...prev,
                                        companyRccm: e.target.value
                                    }))}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyEmail">Email</Label>
                                <Input
                                    id="companyEmail"
                                    type="email"
                                    value={footerConfig.companyEmail}
                                    onChange={(e) => setFooterConfig(prev => ({
                                        ...prev,
                                        companyEmail: e.target.value
                                    }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="companyPhone">Téléphone</Label>
                                <Input
                                    id="companyPhone"
                                    value={footerConfig.companyPhone}
                                    onChange={(e) => setFooterConfig(prev => ({
                                        ...prev,
                                        companyPhone: e.target.value
                                    }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="paymentNote">Note de paiement</Label>
                            <Input
                                id="paymentNote"
                                value={footerConfig.paymentNote}
                                onChange={(e) => setFooterConfig(prev => ({
                                    ...prev,
                                    paymentNote: e.target.value
                                }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFooterDialogOpen(false)}>
                            Annuler
                        </Button>
                        <Button onClick={updateFooterConfig}>
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}