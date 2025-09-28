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
            console.log('Définition du rôle dans le localStorage:', userData.role);
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
            console.log('Rôle après stockage:', JSON.parse(localStorage.getItem(USER_DATA_KEY) || '{}').role);
        }
    }
}

// Récupérer le token
export function getToken(): string | null {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem(TOKEN_KEY);
        console.group('Récupération du token:');
        console.log('Token brut:', token ? `${token.substring(0, 20)}...` : 'null');
        
        if (token) {
            try {
                const decoded = decodeToken(token);
                console.log('Rôle dans le token décodé:', decoded?.role);
            } catch (e) {
                console.error('Erreur lors du décodage du token:', e);
            }
        }
        
        console.groupEnd();
        return token;
    }
    return null;
}

// Récupérer les données utilisateur
export function getUserData(): UserToken | null {
    if (typeof window !== "undefined") {
        const userData = localStorage.getItem(USER_DATA_KEY);
        if (userData) {
            const parsedData = JSON.parse(userData);
            console.log('Données utilisateur du localStorage:', parsedData);
            return parsedData;
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
        const payload = token.split('.')[1];
        const base64 = payload.replace(/\-/g, '+').replace(/\_/g, '/');
        const decoded = atob(base64);
        const userData = JSON.parse(decoded);
        
        // Log détaillé du rôle avant et après traitement
        console.group('Décodage du token:');
        console.log('Token complet décodé:', userData);
        console.log('Rôle dans le token:', userData.role);
        console.log('Type du rôle:', typeof userData.role);
        console.groupEnd();
        
        return userData;
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
            console.log('Mise à jour des données utilisateur depuis le token:', decoded);
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