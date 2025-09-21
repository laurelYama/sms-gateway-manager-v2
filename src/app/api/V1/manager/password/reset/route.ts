import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
 
// Ce gestionnaire gère les requêtes GET vers /api/V1/manager/password/reset
export async function GET(request: NextRequest) {
  // Récupérer le token depuis les paramètres de requête
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  
  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid-token', request.url))
  }

  // Rediriger vers la page de réinitialisation avec le token
  return NextResponse.redirect(new URL(`/reset-password?token=${token}`, request.url))
}

// Désactiver les méthodes non supportées
export async function POST() {
  return new Response('Method not allowed', { status: 405 })
}
