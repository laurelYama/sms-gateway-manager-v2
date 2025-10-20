import { useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import { API_BASE_URL } from '@/lib/config'

export interface IndicatifPays {
  refID: number
  keyValue: string
  value1: string  // Nom du pays
  value2: string  // Indicatif
  value3: string | null
  value4: string | null
  refCategory: string
}

export async function fetchIndicatifs(token: string): Promise<IndicatifPays[]> {
  const response = await fetch(`${API_BASE_URL}/api/V1/referentiel/categorie/004`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    },
    cache: 'no-store' as RequestCache
  })

  if (!response.ok) {
    throw new Error('Erreur lors du chargement des indicatifs')
  }

  return response.json()
}

export function useIndicatifs() {
  const { token } = useAuth()
  
  const getIndicatifs = useCallback(async () => {
    if (!token) return []
    return fetchIndicatifs(token)
  }, [token])

  return { getIndicatifs }
}
