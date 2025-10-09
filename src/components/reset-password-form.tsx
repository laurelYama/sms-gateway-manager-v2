"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import { API_BASE_URL } from "@/lib/config"

export function ResetPasswordForm() {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [successMessage, setSuccessMessage] = useState("")
    const [token, setToken] = useState("")
    const [passwordError, setPasswordError] = useState("")
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        // Récupérer le token depuis l'URL
        const tokenParam = searchParams.get('token')
        if (!tokenParam) {
            setErrorMessage("Lien de réinitialisation invalide ou expiré.")
        } else {
            setToken(tokenParam)
        }
    }, [searchParams])

    const validatePassword = (pwd: string) => {
        if (pwd.length < 12) {
            setPasswordError("Le mot de passe doit contenir au moins 12 caractères.")
            return false
        }
        setPasswordError("")
        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!validatePassword(password)) {
            return
        }

        if (password !== confirmPassword) {
            setErrorMessage("Les mots de passe ne correspondent pas.")
            return
        }

        setLoading(true)
        setErrorMessage("")

        try {
            const url = new URL(`${API_BASE_URL}/api/V1/manager/password/reset`)
            url.searchParams.append('token', token)
            
            const response = await fetch(url.toString(), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    newPassword: password
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || "Une erreur est survenue lors de la réinitialisation")
            }

            setSuccessMessage("Votre mot de passe a été réinitialisé avec succès. Redirection...")
            
            // Rediriger vers la page de connexion après 3 secondes
            setTimeout(() => {
                router.push("/login")
            }, 3000)

        } catch (error) {
            console.error("Erreur lors de la réinitialisation:", error)
            setErrorMessage(error instanceof Error ? error.message : "Une erreur est survenue")
        } finally {
            setLoading(false)
        }
    }

    if (errorMessage && !token) {
        return (
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Lien invalide</h2>
                    <p className="mt-2 text-gray-600">{errorMessage}</p>
                    <Button 
                        onClick={() => router.push("/login")} 
                        className="mt-6 bg-[#0072BB] hover:bg-[#005b96]"
                    >
                        Retour à la connexion
                    </Button>
                </div>
            </div>
        )
    }

    if (successMessage) {
        return (
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Réinitialisation réussie</h2>
                    <p className="mt-2 text-gray-600">{successMessage}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen flex overflow-hidden bg-gray-50">
            {/* Partie gauche - Image et contenu */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#0072BB] text-white flex-col justify-center items-center p-12 relative overflow-hidden">
                {/* Motif de fond décoratif */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0"
                         style={{
                             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                         }}>
                    </div>
                </div>

                {/* Contenu principal */}
                <div className="relative z-10 text-center">
                    {/* Logo */}
                    <div className="mb-8">
                        <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-2xl mx-auto">
                            <Image
                                src="/Logo_ION-1-removebg-preview 1.png"
                                alt="Logo"
                                width={96}
                                height={96}
                                className="p-2"
                            />
                        </div>
                    </div>

                    {/* Titre et description */}
                    <h1 className="text-4xl font-bold mb-4">Nouveau mot de passe</h1>
                    <p className="text-xl opacity-90 leading-relaxed">
                        Créez un nouveau mot de passe sécurisé pour votre compte.
                    </p>
                </div>
            </div>

            {/* Partie droite - Formulaire */}
            <div className="w-full lg:w-1/2 flex justify-center items-center p-8">
                <div className="w-full max-w-md">
                    {/* En-tête du formulaire */}
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Réinitialisation du mot de passe</h2>
                        <p className="text-gray-600">Entrez votre nouveau mot de passe</p>
                    </div>

                    {/* Message d'erreur */}
                    {errorMessage && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
                            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                      clipRule="evenodd"/>
                            </svg>
                            <span className="text-sm">{errorMessage}</span>
                        </div>
                    )}

                    {/* Message de succès */}
                    {successMessage && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center">
                            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                            </svg>
                            <span className="text-sm">{successMessage}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Nouveau mot de passe
                            </label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Votre nouveau mot de passe (min. 12 caractères)"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value)
                                        validatePassword(e.target.value)
                                    }}
                                    required
                                    minLength={12}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0072BB] focus:border-[#0072BB] pr-10 transition-all duration-200"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            {passwordError && (
                                <p className="text-sm text-red-500 mt-1">{passwordError}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirmer le mot de passe
                            </label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirmez votre mot de passe"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={12}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0072BB] focus:border-[#0072BB] pr-10 transition-all duration-200"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#0072BB] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#005b96] focus:ring-2 focus:ring-[#0072BB] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg h-12"
                        >
                            {loading ? "Traitement en cours..." : "Définir un nouveau mot de passe"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
