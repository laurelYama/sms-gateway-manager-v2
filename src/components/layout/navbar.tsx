"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User } from "lucide-react"
import { getUserData, clearToken, isValidToken, decodeToken, getToken } from "@/lib/auth"

// Clé pour le stockage des données utilisateur dans le localStorage
const USER_DATA_KEY = "userData";

interface UserData {
    sub: string;
    id: string;
    nom: string;
    role: string;
    abonneExpire: boolean;
    iat: number;
    exp: number;
}

export function Navbar() {
    const [userData, setUserData] = useState<UserData | null>(null)
    const router = useRouter()
    const pathname = usePathname()

        const checkAuthStatus = useCallback(() => {
            const token = getToken();
        
            if (!token || !isValidToken()) {
                handleLogout();
                return;
            }

            // D'abord essayer de décoder le token pour avoir les données les plus à jour
            try {
                const decodedUser = decodeToken(token);
                if (decodedUser) {
                    setUserData(decodedUser);
                    // Mettre à jour le stockage local pour la cohérence
                    localStorage.setItem(USER_DATA_KEY, JSON.stringify(decodedUser));
                    return;
                }
            } catch (error) {
                console.error('Erreur d\'authentification');
            }

            const storedUserData = getUserData();
            if (storedUserData) {
                setUserData(storedUserData);
            } else {
                handleLogout();
            }
        }, [])

        useEffect(() => {
            // Vérifier immédiatement l'état d'authentification
            checkAuthStatus()
        
            // Vérifier périodiquement la validité du token (toutes les minutes)
            const interval = setInterval(checkAuthStatus, 60000)
        
            const updateUserData = () => {
                const token = getToken();
                if (token) {
                    const decoded = decodeToken(token);
                    if (decoded) {
                        setUserData(decoded);
                    }
                }
            };
        
            const timeoutId = setTimeout(updateUserData, 1000);
        
            return () => {
                clearInterval(interval);
                clearTimeout(timeoutId);
            };
        }, [checkAuthStatus])
    
    // Mise à jour des données utilisateur
    useEffect(() => {
        // Logs de débogage désactivés
    }, [userData])

    // Duplicate checkAuthStatus removed; using the useCallback version above.

    const handleLogout = useCallback(() => {
        clearToken()
        // Rediriger vers la page de connexion avec un paramètre pour éviter la boucle de redirection
        router.push(`/login?from=${encodeURIComponent(pathname)}`)
    }, [router, pathname])

    const getInitials = (name: string) => {
        if (!name) return "US" // Iniciales por defecto
        return name
            .split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const getRoleDisplay = (role: unknown) => {
        if (!role) return 'Utilisateur';

        // convertir el rol a un formato manejable: string | { role?: string } | array
        let roleValue: unknown = role;
        if (typeof roleValue === 'object' && roleValue !== null) {
            // intentar con propiedades comunes
            const rv = roleValue as { role?: unknown; authority?: unknown };
            if (rv.role) roleValue = rv.role;
            else if (rv.authority) roleValue = rv.authority;
        }

        if (Array.isArray(roleValue)) {
            roleValue = roleValue[0];
        }

        const roleStr = String(roleValue ?? '').trim().toUpperCase();

        const roles: Record<string, string> = {
            'ADMIN': 'Administrador',
            'SUPER_ADMIN': 'Super Administrador',
            'ROLE_SUPER_ADMIN': 'Super Administrador',
            'ROLE_ADMIN': 'Administrador',
            'ROLE_USER': 'Usuario'
        };

        if (roles[roleStr]) return roles[roleStr];

        for (const [key, value] of Object.entries(roles)) {
            if (roleStr.includes(key) || key.includes(roleStr)) return value;
        }

        return roleStr || 'Usuario';
    }


    return (
        <header className="w-full bg-white shadow-sm">
            <div className="flex h-16 items-center justify-between px-6 w-full">
                {/* Logo o título de la aplicación */}
                <div className="flex items-center">
                    <h1 className="text-xl font-bold text-[#0072BB]">SMS Gateway Manager</h1>
                </div>

                    <div className="flex items-center gap-4">

                        {/* Profile Dropdown */}
                        <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <Avatar className="h-8 w-8">
                                <AvatarImage
                                    src="/logo.png"
                                    alt={userData?.nom || "Usuario"}
                                    onError={(e) => {
                                        // Respaldo si la imagen no se carga
                                        e.currentTarget.style.display = 'none'
                                    }}
                                />
                                <AvatarFallback className="bg-[#0072BB] text-white">
                                    {userData?.nom ? getInitials(userData.nom) : "US"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="hidden md:flex flex-col items-start">
                                <span className="text-sm font-medium">
                                    {userData?.nom || "Usuario"}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {userData?.role ? getRoleDisplay(userData.role) : "Usuario"}
                                </span>
                            </div>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {/* Email de l'utilisateur */}
                        {userData?.sub && (
                            <div className="px-2 py-1.5 text-sm text-gray-500">
                                {userData.sub}
                            </div>
                        )}

                        <DropdownMenuItem 
                          className="cursor-pointer"
                          onClick={() => router.push('/dashboard/profil')}
                        >
                            <User className="mr-2 h-4 w-4" />
                            <span>Perfil</span>
                        </DropdownMenuItem>

                        {/* Statut d'abonnement */}
                        {userData && (
                            <>
                                <DropdownMenuSeparator />
                                <div className="px-2 py-1.5 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span>Estado:</span>
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            userData.abonneExpire
                                                ? "bg-red-100 text-red-800"
                                                : "bg-green-100 text-green-800"
                                        }`}>
                                            {userData.abonneExpire ? "Expirado" : "Activo"}
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}

                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="cursor-pointer text-red-600 focus:text-red-600"
                            onClick={handleLogout}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Cerrar sesión</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>
    )
}