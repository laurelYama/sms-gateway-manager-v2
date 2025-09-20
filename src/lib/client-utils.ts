import { getToken } from './auth'

export interface ClientInfo {
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
  pays: string
}

export async function getClientById(clientId: string): Promise<ClientInfo | null> {
  const token = getToken()
  if (!token) return null

  try {
    const response = await fetch(`https://api-smsgateway.solutech-one.com/api/V1/clients/${clientId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`Erreur lors de la récupération du client ${clientId}:`, response.statusText)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error(`Erreur lors de la récupération du client ${clientId}:`, error)
    return null
  }
}

export async function getClientsByIds(clientIds: string[]): Promise<Record<string, ClientInfo>> {
  const uniqueIds = [...new Set(clientIds)]
  const clientsMap: Record<string, ClientInfo> = {}
  
  // Récupération en parallèle de tous les clients
  const clientsPromises = uniqueIds.map(id => getClientById(id))
  const clients = await Promise.all(clientsPromises)
  
  // Création d'un map ID client -> données client
  clients.forEach(client => {
    if (client) {
      clientsMap[client.idclients] = client
    }
  })
  
  return clientsMap
}
