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
    dateCreation?: string
    dateModification?: string
    soldeReel?: number
    soldeTheorique?: number
    soldeBloque?: number
    soldeDisponible?: number
    soldeInitial?: number
    indicatifPays?: string
    telephoneAvecIndicatif?: string
}

export interface EditClientForm {
    raisonSociale: string
    secteurActivite: string
    ville: string
    adresse: string
    telephone: string
    email: string
    nif: string
    rccm: string
    indicatifPays: string
    telephoneAvecIndicatif?: string
}

export interface CreateClientForm extends EditClientForm {
    emetteur: string
    coutSmsTtc: number
    typeCompte: string
    motDePasse?: string // Le mot de passe est optionnel car il sera généré côté serveur
}

export interface ReferentielItem {
    refID: number
    keyValue: string
    value1: string
    value2: string | null
    value3: string | null
    value4: string | null
    refCategory: string
}
