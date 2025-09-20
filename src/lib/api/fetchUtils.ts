import { getToken } from "@/lib/auth"

export async function authFetch(url: string, options: RequestInit = {}) {
    const token = getToken()
    
    const headers = new Headers(options.headers || {})
    
    if (token) {
        headers.set('Authorization', `Bearer ${token}`)
    }
    
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json')
    }
    
    const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Important pour les cookies d'authentification
    })
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.message || 'Une erreur est survenue')
    }
    
    return response
}
