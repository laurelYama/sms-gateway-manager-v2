// src/lib/auth.ts
import { useState, useEffect, useCallback } from 'react';
import { UserToken } from '@/types';

const TOKEN_KEY = "authToken"
const USER_DATA_KEY = "userData"

// Sauvegarder le token
export function setToken(token: string): void {
    if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_KEY, token);

        // Décoder et sauvegarder aussi les données utilisateur
        const userData = decodeToken(token);
        if (userData) {
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
        }
    }
}

// Récupérer le token
export function getToken(): string | null {
    if (typeof window !== "undefined") {
        return localStorage.getItem(TOKEN_KEY);
    }
    return null;
}

// Récupérer les données utilisateur
export function getUserData(): UserToken | null {
    if (typeof window !== "undefined") {
        const userData = localStorage.getItem(USER_DATA_KEY);
        if (userData) {
            return JSON.parse(userData);
        }
    }
    return null;
}

// Supprimer le token
export function clearToken(): void {
    if (typeof window !== "undefined") {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
    }
}

// Décoder le token JWT
export function decodeToken(token: string): UserToken | null {
    try {
        // Vérifier que le token est bien formaté
        if (!token || typeof token !== 'string') {
            console.error('Token invalide ou manquant');
            return null;
        }
        
        // Séparer les parties du token
        const parts = token.split('.');
        if (parts.length !== 3) {
            console.error('Format de token JWT invalide');
            return null;
        }
        
        // Préparer et décoder la partie payload
        const payload = parts[1];
        const base64 = payload.replace(/\-/g, '+').replace(/\_/g, '/');
        
        // Décoder en base64 et gérer les caractères spéciaux
        const decoded = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        
        // Parser le JSON décodé
        const userData = JSON.parse(decoded);
        
        // Log détaillé du rôle avant et après traitement
        // Logs désactivés en production
        
        return userData || null;
    } catch (error) {
        console.error("Erreur lors du décodage du token:", error);
        return null;
    }
}

// Vérifier si le token est expiré
export function isTokenExpired(token: string): boolean {
    const decoded = decodeToken(token);
    if (!decoded) return true;

    const expirationTime = decoded.exp * 1000;
    return Date.now() >= expirationTime;
}

// Vérifier la validité du token
export function isValidToken(): boolean {
    const token = getToken();
    return !!(token && !isTokenExpired(token));
}

// Hook personnalisé pour gérer l'authentification
export function useAuth() {
    const [token, setTokenState] = useState<string | null>(null);
    const [userData, setUserData] = useState<UserToken | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Fonction pour mettre à jour les données utilisateur à partir du token
    const updateUserDataFromToken = useCallback((token: string) => {
        const decoded = decodeToken(token);
        if (decoded) {
            setUserData(decoded);
            // Mettre à jour également le stockage local pour la cohérence
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(decoded));
            return true;
        }
        return false;
    }, []);
    
    // Fonction pour forcer une mise à jour des données utilisateur
    const refreshUserData = useCallback(() => {
        const storedToken = getToken();
        if (storedToken) {
            return updateUserDataFromToken(storedToken);
        }
        return false;
    }, [updateUserDataFromToken]);

    useEffect(() => {
        const storedToken = getToken();
        
        if (storedToken) {
            // Toujours mettre à jour les données à partir du token pour s'assurer qu'elles sont à jour
            const updated = updateUserDataFromToken(storedToken);
            
            if (!updated) {
                // Si le décodage échoue, essayer avec les données stockées
                const storedUserData = getUserData();
                if (storedUserData) {
                    console.log('Utilisation des données utilisateur stockées:', storedUserData);
                    setUserData(storedUserData);
                }
            }
            
            setTokenState(storedToken);
        }
        
        setLoading(false);
    }, [updateUserDataFromToken]);

    const login = useCallback((token: string) => {
        setToken(token);
        setTokenState(token);
        updateUserDataFromToken(token);
    }, [updateUserDataFromToken]);

    const logout = useCallback(() => {
        clearToken();
        setTokenState(null);
        setUserData(null);
    }, []);

    return {
        token, 
        user: userData, 
        userId: userData?.id,
        loading, 
        isAuthenticated: !!token && !isTokenExpired(token),
        login,
        logout,
        refreshUserData
    };
}