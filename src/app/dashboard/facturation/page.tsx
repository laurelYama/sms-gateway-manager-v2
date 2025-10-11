"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"
import { API_BASE_URL } from "@/lib/config"
import { Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FacturationActions } from "@/components/facturation/FacturationActions"
import { FacturationTable } from "@/components/facturation/FacturationTable"
import { CalendrierButton } from "@/components/facturation/CalendrierButton"
import { GenerationFactureDialog } from "@/components/facturation/GenerationFactureDialog"
import { ExerciceConfigDialog } from "@/components/facturation/ExerciceConfigDialog"
import { GenerateUserInvoiceDialog } from "@/components/facturation/GenerateUserInvoiceDialog"
import { Facture, Exercice, Calendrier, GenerationParams } from "@/components/facturation/types"
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
    const [availableYears, setAvailableYears] = useState<number[]>([])
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
    const [loading, setLoading] = useState<boolean>(true)
    const [sending, setSending] = useState<Record<string, boolean>>({})
    const [generating, setGenerating] = useState<boolean>(false)
    const [generationDialogOpen, setGenerationDialogOpen] = useState<boolean>(false)
    const [showExerciceConfig, setShowExerciceConfig] = useState(false)
    const [showUserInvoiceDialog, setShowUserInvoiceDialog] = useState(false)
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
    const [pageSize, setPageSize] = useState(5)
    const [totalPages, setTotalPages] = useState(1)
    const [totalElements, setTotalElements] = useState(0)

    const { token } = useAuth()

    const loadClientInfo = async (clientId: string) => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/V1/clients/${clientId}`, {
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
            // Chargement direct des factures sans vérification de santé préalable
            const response = await fetch(
                `${API_BASE_URL}/api/V1/billing/factures`, 
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    },
                    cache: 'no-store' as RequestCache
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
        if (!token) return;

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/V1/billing/exercices/${annee}/calendrier`, 
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    },
                    cache: 'no-store' as RequestCache
                }
            );

            if (!response.ok) {
                // Créer un objet d'erreur de base
                const errorInfo = {
                    status: response.status,
                    statusText: response.statusText || 'Pas de texte de statut',
                    year: annee,
                    url: response.url,
                    error: null as any
                };

                try {
                    // Essayer de parser la réponse en JSON
                    const contentType = response.headers?.get('content-type');
                    if (contentType?.includes('application/json')) {
                        errorInfo.error = await response.json();
                    } else {
                        const text = await response.text();
                        errorInfo.error = { message: text };
                    }
                } catch (parseError) {
                    console.warn('Erreur lors de l\'analyse de la réponse d\'erreur:', parseError);
                    errorInfo.error = { message: 'Erreur lors de l\'analyse de la réponse' };
                }
                
                // Journalisation sécurisée
                try {
                    console.group('Erreur API calendrier');
                    console.log('Détails:', errorInfo);
                    if (errorInfo.error) {
                        console.log('Erreur détaillée:', errorInfo.error);
                    }
                    console.groupEnd();
                } catch (logError) {
                    console.error('Erreur lors de la journalisation:', logError);
                    console.error('Erreur API calendrier (brute):', JSON.stringify(errorInfo, null, 2));
                }
                
                // Gestion spécifique pour l'erreur 409 (Année fiscale non trouvée ou non ouverte)
                if (response.status === 409) {
                    setCalendrier([]);
                    
                    // Vérifier si l'année demandée est dans le futur
                    const currentYear = new Date().getFullYear();
                    if (annee > currentYear) {
                        // Ne pas afficher de toast pour les années futures
                        // car cela pourrait être un chargement automatique
                        console.log(`L'année ${annee} est dans le futur, chargement ignoré`);
                    } else {
                        // Pour les années passées ou actuelles, afficher un avertissement
                        toast.warning(`L'année fiscale ${annee} n'est pas configurée ou n'est pas ouverte.`, {
                            id: `calendrier-${annee}-warning` // Éviter les doublons
                        });
                    }
                    return [];
                }

                // Pour les autres erreurs, lancer une exception avec un message clair
                const errorMessage = errorInfo.error?.message || 
                                  `Erreur ${response.status} lors du chargement du calendrier pour l'année ${annee}`;
                throw new Error(errorMessage);
            }

            const data = await response.json();
            
            // S'assurer que les données sont un tableau
            if (!Array.isArray(data)) {
                console.warn('La réponse du calendrier n\'est pas un tableau:', data);
                setCalendrier([]);
                toast.warning("Format de données inattendu pour le calendrier.");
                return;
            }
            
            setCalendrier(data);
            
        } catch (error) {
            console.error("Erreur lors du chargement du calendrier:", error);
            
            // Ne pas afficher de toast pour les erreurs 409 déjà gérées
            if (!(error instanceof Error && error.message.includes('409'))) {
                toast.error("Erreur lors du chargement du calendrier. Veuillez réessayer.");
            }
        }
    }, [token])

    const loadFooterConfig = useCallback(async () => {
        if (!token) return

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/v1/footer`, 
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    },
                    cache: 'no-store' as RequestCache
                }
            )

            if (response.ok) {
                const data = await response.json()
                setFooterConfig(data)
            }
        } catch (error) {
            console.error("Erreur lors du chargement de la configuration du pied de page:", error)
            toast.error("Erreur lors du chargement de la configuration du pied de page")
        }
    }, [token])

    // Années disponibles pour la sélection (année en cours par défaut)
    useEffect(() => {
        const currentYear = new Date().getFullYear();
        const years = [currentYear - 1, currentYear, currentYear + 1];
        setAvailableYears(years);
        
        // Définir l'année en cours comme sélectionnée par défaut
        if (!selectedYear || !years.includes(selectedYear)) {
            setSelectedYear(currentYear);
        }
    }, []);

    // Charger les données initiales
    useEffect(() => {
        if (!token) return;
        
        const loadInitialData = async () => {
            try {
                setLoading(true);
                
                // Charger les factures et le calendrier en parallèle
                await Promise.all([
                    loadFactures().catch(error => {
                        console.error('Erreur lors du chargement des factures:', error);
                        toast.error('Erreur lors du chargement des factures');
                    }),
                    loadCalendrier(selectedYear).catch(error => {
                        // Ne rien faire ici car loadCalendrier gère déjà les erreurs
                        // et affiche les messages appropriés
                        console.error('Erreur lors du chargement du calendrier:', error);
                    })
                ]);
            } catch (error) {
                console.error('Erreur lors du chargement des données initiales:', error);
                toast.error('Erreur lors du chargement des données');
            } finally {
                setLoading(false);
            }
        };
        
        loadInitialData();
    }, [token, loadFactures, loadCalendrier, selectedYear]);

    // Gestion du changement d'année
    const handleYearChange = useCallback((year: number) => {
        setSelectedYear(year);
        loadCalendrier(year).catch(error => {
            console.error('Erreur lors du chargement du calendrier:', error);
        });
    }, [loadCalendrier]);

    // Calcul des factures paginées
    const paginatedFactures = factures.slice(
        currentPage * pageSize,
        (currentPage + 1) * pageSize
    );

    // Gestion du téléchargement de toutes les factures
    const handleDownloadAll = async () => {
        if (!token) return;
        
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/V1/billing/factures/export`, 
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/zip',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    },
                    cache: 'no-store' as RequestCache
                }
            );

            if (!response.ok) {
                throw new Error('Erreur lors du téléchargement des factures');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `factures-${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success('Téléchargement des factures réussi');
        } catch (error) {
            console.error('Erreur lors du téléchargement des factures:', error);
            toast.error('Erreur lors du téléchargement des factures');
        }
    };

    // Gestion de la prévisualisation d'une facture (fetch + Authorization, puis ouverture via Object URL)
    const handlePreviewInvoice = async (factureId: string) => {
        if (!token) return;
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/V1/billing/factures/${factureId}/pdf`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/pdf',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    },
                    cache: 'no-store' as RequestCache
                }
            );
            if (!response.ok) {
                throw new Error('Impossible de récupérer le PDF');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            // Libérer l'URL blob après un délai
            setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
        } catch (error) {
            console.error('Erreur prévisualisation facture:', error);
            toast.error("Échec de la prévisualisation (401 probable si non authentifié)");
        }
    };

    // Gestion du téléchargement d'une facture
    const handleDownloadInvoice = async (factureId: string) => {
        if (!token) {
            toast.error('Veuillez vous reconnecter');
            return;
        }
        
        try {
            setSending(prev => ({ ...prev, [factureId]: true }));
            
            const response = await fetch(
                `${API_BASE_URL}/api/V1/billing/factures/${factureId}/pdf`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/pdf',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    },
                    credentials: 'include',
                    cache: 'no-store' as RequestCache
                }
            );

            // Vérifier si la réponse est un PDF
            const contentType = response.headers.get('content-type');
            const isPdf = contentType && contentType.includes('application/pdf');
            
            if (!response.ok || !isPdf) {
                // Essayer de lire le message d'erreur
                let errorMessage = 'Erreur lors du téléchargement';
                try {
                    const errorText = await response.text();
                    if (errorText) {
                        errorMessage = errorText;
                    }
                } catch (e) {
                    console.error('Erreur lors de la lecture de la réponse:', e);
                }
                throw new Error(errorMessage);
            }

            // Créer un blob et forcer le téléchargement
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `facture-${factureId}.pdf`;
            document.body.appendChild(a);
            a.click();
            
            // Nettoyage
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success('Téléchargement de la facture réussi');
        } catch (error) {
            console.error('Erreur lors du téléchargement:', error);
            toast.error(error instanceof Error ? error.message : 'Erreur lors du téléchargement');
        } finally {
            setSending(prev => ({ ...prev, [factureId]: false }));
        }
    };

    // Gestion de l'envoi d'une facture
    const handleSendInvoice = async (factureId: string) => {
        if (!token) return;
        
        try {
            setSending(prev => ({ ...prev, [factureId]: true }));
            
            const response = await fetch(
                `${API_BASE_URL}/api/V1/billing/factures/${factureId}/send`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    },
                    cache: 'no-store' as RequestCache
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Erreur lors de l\'envoi de la facture');
            }
            
            toast.success('Facture envoyée avec succès');
            
            // Recharger les factures pour mettre à jour l'état
            await loadFactures();
        } catch (error) {
            console.error('Erreur lors de l\'envoi de la facture:', error);
            toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'envoi de la facture');
        } finally {
            setSending(prev => ({ ...prev, [factureId]: false }));
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center h-64">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Chargement des données...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
            <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-1 sm:space-y-2">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Gestion de la Facturation</h1>
                        <p className="text-sm sm:text-base text-muted-foreground">Compte postpayé</p>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <Button 
                            variant="outline" 
                            onClick={() => setShowUserInvoiceDialog(true)}
                            className="whitespace-nowrap"
                            disabled={loading}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            {loading ? 'Chargement...' : 'Générer une facture'}
                        </Button>
                        <div className="w-full sm:w-auto">
                            <CalendrierButton 
                                calendrier={calendrier || []}
                                selectedYear={selectedYear}
                                onYearChange={handleYearChange}
                                loading={loading}
                                availableYears={availableYears}
                            />
                        </div>
                    </div>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                    <FacturationActions 
                        onGenerate={() => setGenerationDialogOpen(true)}
                        onDownloadAll={handleDownloadAll}
                        onConfigureFooter={() => setShowExerciceConfig(true)}
                        loading={loading}
                    />
                    
                    <FacturationTable 
                        factures={paginatedFactures}
                        onPreview={handlePreviewInvoice}
                        onDownload={handleDownloadInvoice}
                        onSend={handleSendInvoice}
                        loading={loading}
                        sending={sending}
                    />
                    
                    {/* Pagination améliorée */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-2 sm:px-4 border-t">
                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                            {totalElements > 0 ? (
                                `${(currentPage * pageSize) + 1}-${Math.min((currentPage + 1) * pageSize, totalElements)} sur ${totalElements}`
                            ) : (
                                'Aucune facture'
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                            <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                                <p className="text-sm font-medium whitespace-nowrap">Lignes/page</p>
                                <Select
                                    value={`${pageSize}`}
                                    onValueChange={(value) => {
                                        setPageSize(Number(value));
                                        setCurrentPage(0);
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
                            
                            <div className="flex items-center justify-between w-full sm:w-auto gap-1">
                                <Button
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={() => setCurrentPage(0)}
                                    disabled={currentPage === 0}
                                    size="icon"
                                >
                                    <span className="sr-only">Première page</span>
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                    disabled={currentPage === 0}
                                    size="icon"
                                >
                                    <span className="sr-only">Précédent</span>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="flex items-center justify-center text-sm font-medium w-12">
                                    {currentPage + 1} / {Math.max(1, totalPages)}
                                </div>
                                <Button
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    disabled={currentPage >= totalPages - 1}
                                    size="icon"
                                >
                                    <span className="sr-only">Suivant</span>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={() => setCurrentPage(totalPages - 1)}
                                    disabled={currentPage >= totalPages - 1}
                                    size="icon"
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
                    onSubmit={async (values) => {
                        try {
                            setGenerating(true);
                            const response = await fetch(
                                `https://api-smsgateway.solutech-one.com/api/V1/billing/generer?annee=${values.annee}&mois=${values.mois}`,
                                {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Accept': 'application/json',
                                        'Content-Type': 'application/json',
                                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                                        'Pragma': 'no-cache'
                                    },
                                    cache: 'no-store' as RequestCache
                                }
                            );

                            if (!response.ok) {
                                const errorData = await response.json().catch(() => ({}));
                                throw new Error(errorData.message || 'Erreur lors de la génération des factures');
                            }

                            const result = await response.json();
                            toast.success(`${result.generated} facture(s) générée(s) avec succès`);
                            
                            // Recharger les données
                            await Promise.all([
                                loadFactures(),
                                loadCalendrier(selectedYear)
                            ]);
                            
                            setGenerationDialogOpen(false);
                        } catch (error) {
                            console.error('Erreur lors de la génération des factures:', error);
                            toast.error(error instanceof Error ? error.message : 'Erreur lors de la génération des factures');
                        } finally {
                            setGenerating(false);
                        }
                    }}
                    loading={generating}
                    defaultValues={{
                        annee: selectedYear,
                        mois: new Date().getMonth() + 1
                    }}
                />

                <GenerateUserInvoiceDialog
                    open={showUserInvoiceDialog}
                    onOpenChange={setShowUserInvoiceDialog}
                    token={token}
                    onSuccess={() => {
                        loadFactures()
                        loadCalendrier(selectedYear)
                    }}
                />

                <ExerciceConfigDialog 
                    open={showExerciceConfig}
                    onOpenChange={setShowExerciceConfig}
                    onSave={async (values) => {
                        try {
                            // Mettre à jour l'année sélectionnée
                            setSelectedYear(values.annee);
                            
                            // Recharger le calendrier pour la nouvelle année
                            await loadCalendrier(values.annee);
                            
                            toast.success('Année sélectionnée avec succès');
                            setShowExerciceConfig(false);
                        } catch (error) {
                            console.error('Erreur lors du changement d\'année:', error);
                            toast.error(error instanceof Error ? error.message : 'Erreur lors du changement d\'année');
                        }
                    }}
                />
            </div>
        </div>
    )
}
