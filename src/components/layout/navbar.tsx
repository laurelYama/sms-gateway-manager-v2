"use client"

import { useState, useEffect } from "react"
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
import { LogOut, Settings, User } from "lucide-react"
import { getUserData, clearToken, isValidToken, isTokenExpired, decodeToken, getToken } from "@/lib/auth"

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

    useEffect(() => {
        // Vérifier immédiatement l'état d'authentification
        checkAuthStatus()
        
        // Vérifier périodiquement la validité du token (toutes les minutes)
        const interval = setInterval(checkAuthStatus, 60000)
        
        // Forcer une mise à jour des données utilisateur après un court délai
        const updateUserData = () => {
            const token = getToken();
            if (token) {
                const decoded = decodeToken(token);
                if (decoded) {
                    console.log('Données utilisateur mises à jour depuis le token:', decoded);
                    setUserData(decoded);
                }
            }
        };
        
        const timeoutId = setTimeout(updateUserData, 1000);
        
        return () => {
            clearInterval(interval);
            clearTimeout(timeoutId);
        };
    }, [])
    
    // Log des données utilisateur lorsqu'elles changent
    useEffect(() => {
        console.log('Données utilisateur mises à jour:', userData);
        if (userData) {
            console.log('Rôle utilisateur:', userData.role);
            console.log('Toutes les propriétés:', Object.keys(userData));
        }
    }, [userData])

    const checkAuthStatus = () => {
        console.group('Vérification du statut d\'authentification');
        
        const token = getToken();
        console.log('Token récupéré:', token ? 'présent' : 'absent');
        
        if (!token || !isValidToken(token)) {
            console.log('Token invalide ou expiré, déconnexion...');
            handleLogout();
            console.groupEnd();
            return;
        }

        // D'abord essayer de décoder le token pour avoir les données les plus à jour
        try {
            const decodedUser = decodeToken(token);
            if (decodedUser) {
                console.log('Utilisateur décodé depuis le token:', decodedUser);
                setUserData(decodedUser);
                // Mettre à jour le stockage local pour la cohérence
                localStorage.setItem(USER_DATA_KEY, JSON.stringify(decodedUser));
                console.groupEnd();
                return;
            }
        } catch (error) {
            console.error('Erreur lors du décodage du token:', error);
        }

        // Si le décodage échoue, essayer de récupérer depuis le stockage local
        const storedUserData = getUserData();
        if (storedUserData) {
            console.log('Utilisation des données utilisateur stockées:', storedUserData);
            setUserData(storedUserData);
        } else {
            console.log('Aucune donnée utilisateur trouvée');
            handleLogout();
        }
        
        console.groupEnd();
    }

    const handleLogout = () => {
        clearToken()
        // Rediriger vers la page de connexion avec un paramètre pour éviter la boucle de redirection
        router.push(`/login?from=${encodeURIComponent(pathname)}`)
    }

    const getInitials = (name: string) => {
        if (!name) return "US"
        return name
            .split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const getRoleDisplay = (role: any) => {
        console.log('Rôle reçu (type):', typeof role, 'valeur:', role);
        
        if (!role) return 'Utilisateur';
        
        // Si le rôle est un objet, essayer d'extraire la propriété 'role' ou 'authority'
        let roleValue = role;
        if (typeof role === 'object' && role !== null) {
            roleValue = role.role || role.authority || role;
        }
        
        // Si c'est un tableau, prendre le premier élément
        if (Array.isArray(roleValue)) {
            roleValue = roleValue[0];
        }
        
        // Convertir en chaîne et nettoyer
        const roleStr = String(roleValue).trim().toUpperCase();
        
        const roles: { [key: string]: string } = {
            'ADMIN': 'Administrateur',
            'SUPER_ADMIN': 'Super Administrateur',
            'ROLE_SUPER_ADMIN': 'Super Administrateur',
            'ROLE_ADMIN': 'Administrateur',
            'ROLE_USER': 'Utilisateur'
        };
        
        // Vérifier les correspondances exactes d'abord
        if (roles[roleStr]) {
            return roles[roleStr];
        }
        
        // Vérifier les correspondances partielles
        for (const [key, value] of Object.entries(roles)) {
            if (roleStr.includes(key) || key.includes(roleStr)) {
                return value;
            }
        }
        
        return roleStr;
    }


    return (
        <header className="w-full bg-white shadow-sm">
            <div className="flex h-16 items-center justify-between px-6 w-full">
                {/* Logo ou titre de l'application */}
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
                                    alt={userData?.nom || "Utilisateur"}
                                    onError={(e) => {
                                        // Fallback si l'image ne charge pas
                                        e.currentTarget.style.display = 'none'
                                    }}
                                />
                                <AvatarFallback className="bg-[#0072BB] text-white">
                                    {userData?.nom ? getInitials(userData.nom) : "US"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="hidden md:flex flex-col items-start">
                                <span className="text-sm font-medium">
                                    {userData?.nom || "Utilisateur"}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {(() => {
                                        console.log('userData.role avant getRoleDisplay:', userData?.role);
                                        return userData?.role ? getRoleDisplay(userData.role) : "Utilisateur";
                                    })()}
                                </span>
                            </div>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {/* Email de l'utilisateur */}
                        {userData?.sub && (
                            <div className="px-2 py-1.5 text-sm text-gray-600">
                                {userData.sub}
                            </div>
                        )}

                        <DropdownMenuItem 
                          className="cursor-pointer"
                          onClick={() => router.push('/dashboard/profil')}
                        >
                            <User className="mr-2 h-4 w-4" />
                            <span>Profil</span>
                        </DropdownMenuItem>

                        {/* Statut d'abonnement */}
                        {userData && (
                            <>
                                <DropdownMenuSeparator />
                                <div className="px-2 py-1.5 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span>Statut:</span>
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            userData.abonneExpire
                                                ? "bg-red-100 text-red-800"
                                                : "bg-green-100 text-green-800"
                                        }`}>
                                            {userData.abonneExpire ? "Expiré" : "Actif"}
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
                            <span>Déconnexion</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>
    )
}