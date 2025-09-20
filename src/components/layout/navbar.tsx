"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Bell, LogOut, Settings, User } from "lucide-react"
import { getUserData, clearToken, isValidToken, isTokenExpired, decodeToken } from "@/lib/auth"

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
    const [notificationCount, setNotificationCount] = useState(3)
    const router = useRouter()

    useEffect(() => {
        checkAuthStatus()
        // Vérifier périodiquement la validité du token (toutes les minutes)
        const interval = setInterval(checkAuthStatus, 60000)
        return () => clearInterval(interval)
    }, [])

    const checkAuthStatus = () => {
        if (!isValidToken()) {
            // Token expiré ou invalide
            handleLogout()
            return
        }

        const userData = getUserData()
        if (userData) {
            setUserData(userData)
        } else {
            // Tentative de récupération depuis le token
            const token = localStorage.getItem("authToken")
            if (token) {
                try {
                    const decodedUser = decodeToken(token)
                    if (decodedUser) {
                        setUserData(decodedUser)
                        // Sauvegarder pour les prochains accès
                        localStorage.setItem("userData", JSON.stringify(decodedUser))
                    }
                } catch (error) {
                    console.error("Erreur lors du décodage du token:", error)
                    handleLogout()
                }
            }
        }
    }

    const handleLogout = () => {
        clearToken()
        router.push("/login")
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

    const getRoleDisplay = (role: string) => {
        const roles: { [key: string]: string } = {
            'ADMIN': 'Administrateur',
            'USER': 'Utilisateur',
            'MODERATOR': 'Modérateur',
            'SUPER_ADMIN': 'Super Administrateur'
        }
        return roles[role] || role
    }

    const handleNotificationsClick = () => {
        // Réinitialiser le compteur de notifications
        setNotificationCount(0)
        // TODO: Implémenter la navigation vers les notifications
        console.log("Ouvrir les notifications")
    }

    return (
        <header className="w-full bg-white shadow-sm">
            <div className="flex h-16 items-center justify-between px-6 w-full">
                {/* Logo ou titre de l'application */}
                <div className="flex items-center">
                    <h1 className="text-xl font-bold text-[#0072BB]">SMS Gateway Manager</h1>
                </div>

                    <div className="flex items-center gap-4">
                        {/* Notification Bell */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative"
                            onClick={handleNotificationsClick}
                        >
                            <Bell className="h-5 w-5" />
                            {notificationCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-xs text-white items-center justify-center">
                                        {notificationCount}
                                    </span>
                                </span>
                            )}
                        </Button>

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
                                    {userData?.role ? getRoleDisplay(userData.role) : "Utilisateur"}
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

                        <DropdownMenuItem className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" />
                            <span>Profil</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Paramètres</span>
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