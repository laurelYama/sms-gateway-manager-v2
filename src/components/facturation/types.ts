export interface Facture {
    id: string
    clientId: string
    dateDebut: string
    dateFin: string
    consommationSms: number
    prixUnitaire: number
    montant: number
    statut: 'BROUILLON' | 'GENEREE' | 'ENVOYEE' | 'PAYEE' | 'ANNULEE'
    clientNom: string
    clientEmail: string
}

export interface Exercice {
    id: string
    annee: number
    statut: string
    createdAt: string
}

export interface Calendrier {
    id: string
    mois: number
    dateDebutConsommation: string
    dateFinConsommation: string
    dateGenerationFacture: string
    exercice: Exercice
}

export interface FooterConfig {
    companyName: string
    companyAddress: string
    companyNif: string
    companyRccm: string
    companyEmail: string
    companyPhone: string
    paymentNote: string
    notes?: string
}

export interface GenerationParams {
    annee: number
    mois: number
}

export interface FacturationActionsProps {
    onGenerate: () => void
    onDownloadAll: () => void
    onSendAll: () => void
    onConfigureFooter: () => void
    loading?: boolean
}

export interface FacturationTableProps {
    factures: Facture[]
    onPreview: (id: string) => void
    onDownload: (id: string) => void
    onSend: (id: string) => void
    loading?: boolean
}

export interface CalendrierFacturationProps {
    calendrier: Calendrier[]
    selectedYear: number
    onYearChange: (year: number) => void
    loading?: boolean
}

export interface GenerationFactureDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (params: GenerationParams) => void
    loading?: boolean
    defaultValues?: GenerationParams
}

export interface FooterConfigDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (config: FooterConfig) => void
    loading?: boolean
    defaultValues?: FooterConfig
}
