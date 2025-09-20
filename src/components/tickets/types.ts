export type TicketStatus = 'TOUS' | 'OUVERT' | 'EN_COURS' | 'FERME';

export interface ClientInfo {
    idclients: string;
    raisonSociale: string;
    secteurActivite: string;
    ville: string;
    adresse: string;
    telephone: string;
    email: string;
    nif: string;
    rccm: string;
    emetteur: string;
    typeCompte: string;
    role: string;
    statutCompte: string;
}

export interface Ticket {
    id: string;
    clientId: string;
    titre: string;
    description: string;
    statut: TicketStatus;
    emailClient: string;
    raisonSociale?: string;
    reponseAdmin?: string;
    createdAt: string;
    updatedAt: string;
    client?: ClientInfo;
}

export interface UpdateTicketData {
    statut: TicketStatus;
    reponseAdmin: string;
}
