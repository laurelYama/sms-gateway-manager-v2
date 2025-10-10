import { Ticket, UpdateTicketData } from "@/components/tickets/types"
import { authFetch } from "./fetchUtils"

// URL directe vers l'API de production
const API_URL = 'https://api-smsgateway.solutech-one.com/api/V1/tickets'

export const fetchTickets = async (): Promise<Ticket[]> => {
    const response = await authFetch(API_URL)
    return response.json()
}

export const updateTicket = async (ticketId: string, data: UpdateTicketData): Promise<Ticket> => {
    const response = await authFetch(`${API_URL}/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    })
    return response.json()
}
