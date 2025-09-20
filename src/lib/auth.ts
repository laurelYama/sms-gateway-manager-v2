// src/lib/auth.ts
import { useState, useEffect } from 'react';

const TOKEN_KEY = "authToken"
const USER_DATA_KEY = "userData"

export interface UserToken {
    sub: string;
    id: string;
    nom: string;
    role: string;
    abonneExpire: boolean;
    iat: number;
    exp: number;
}

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
        return userData ? JSON.parse(userData) : null;
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
        return JSON.parse(decoded);
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

    useEffect(() => {
        const storedToken = getToken();
        const storedUserData = getUserData();
        
        if (storedToken && storedUserData) {
            setTokenState(storedToken);
            setUserData(storedUserData);
        }
    }, []);

    const login = (token: string) => {
        setToken(token);
        const userData = decodeToken(token);
        if (userData) {
            setUserData(userData);
        }
    };

    const logout = () => {
        clearToken();
        setTokenState(null);
        setUserData(null);
    };

    return {
        token,
        userData,
        isAuthenticated: !!token && !isTokenExpired(token),
        login,
        logout
    };
}