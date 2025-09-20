export interface Client {
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

export interface CreditRequest {
    id: string
    clientId: string
    client?: Client
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

export interface ApiResponse {
    totalPages: number
    totalElements: number
    content: CreditRequest[]
    number: number
    size: number
    first: boolean
    last: boolean
}
