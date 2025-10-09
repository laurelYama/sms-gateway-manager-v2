'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth'

export function useRequireAnyRole(roles: string[]) {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()

  const allowed = useMemo(() => {
    const role = user?.role
    return role ? roles.includes(role) : false
  }, [user, roles])

  useEffect(() => {
    if (loading) return
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (!allowed) {
      toast.error('Accès refusé')
      router.push('/unauthorized')
    }
  }, [loading, isAuthenticated, allowed, router])

  return {
    isChecking: loading || !isAuthenticated || !allowed,
    allowed: !!allowed && isAuthenticated,
  }
}

export function useRequireRole(role: 'ADMIN' | 'SUPER_ADMIN' | 'AUDITEUR') {
  return useRequireAnyRole([role])
}
