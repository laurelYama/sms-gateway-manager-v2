import { Ticket, UpdateTicketData } from "@/components/tickets/types"
import { authFetch } from "./fetchUtils"
import { API_BASE_URL } from "@/lib/config"

const API_URL = `${API_BASE_URL}/api/V1/tickets`

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
