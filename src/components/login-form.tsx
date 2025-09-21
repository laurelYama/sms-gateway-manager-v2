"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { ForgotPasswordForm } from "./forgot-password-form"

export function LoginForm() {
    const [email, setEmail] = useState("")
    const [motDePasse, setMotDePasse] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [successMessage, setSuccessMessage] = useState("")
    const [showForgotPassword, setShowForgotPassword] = useState(false)

    const router = useRouter()
    
    const handleBackToLogin = () => {
        setShowForgotPassword(false)
        setErrorMessage("")
        setSuccessMessage("")
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErrorMessage("")
        setSuccessMessage("")

        try {
            const response = await fetch("https://api-smsgateway.solutech-one.com/api/V1/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email,
                    motDePasse: motDePasse
                })
            })

            const data = await response.json()

            if (response.ok) {
                // Connexion réussie
                setSuccessMessage("Connexion réussie!")

                // Stocker le token si nécessaire
                if (data.token) {
                    localStorage.setItem("authToken", data.token)
                    // Stocker également les informations utilisateur si disponibles
                    if (data.user) {
                        localStorage.setItem("userData", JSON.stringify(data.user))
                    }
                }

                // Attendre un peu pour montrer le message de succès
                setTimeout(() => {
                    // Rediriger vers la page dashboard
                    router.push("/dashboard/home")
                }, 1500)

            } else {
                // Erreur de connexion
                setErrorMessage(data.message || "Email ou mot de passe incorrect")
            }
        } catch (error) {
            console.error("Erreur de connexion:", error)
            setErrorMessage("Erreur de connexion au serveur. Veuillez réessayer.")
        } finally {
            setLoading(false)
        }
    }

    const togglePassword = () => {
        setShowPassword(!showPassword)
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
                            <svg className="w-12 h-12 text-[#0072BB]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                            </svg>
                        </div>
                    </div>

                    {/* Titre et description */}
                    <p className="text-xl mb-12 max-w-md opacity-90 leading-relaxed">
                        Votre plateforme de gestion SMS professionnelle.
                        Connectez-vous pour accéder à toutes vos fonctionnalités.
                    </p>
                </div>
            </div>

            {/* Partie droite - Formulaire */}
            <div className="w-full lg:w-1/2 flex justify-center items-center p-8">
                <div className="p-10 w-full max-w-md">
                    {/* En-tête du formulaire */}
                    <div className="text-center mb-8">
                        {/* logo */}
                        <div className="mx-auto mb-6 w-32 h-32 flex items-center justify-center translate-y-8">
                            <Image
                                src="/Logo_ION-1-removebg-preview 1.png"
                                alt="Logo"
                                width={128}
                                height={128}
                                className="mx-auto mb-6 w-32 h-auto object-contain"
                            />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Connexion</h2>
                        <p className="text-gray-600">Accédez à votre espace personnel</p>
                    </div>

                    {/* Message de succès */}
                    {successMessage && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center">
                            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                            </svg>
                            <span className="text-sm">{successMessage}</span>
                        </div>
                    )}

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

                    {/* Formulaire */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Adresse email</label>
                            <Input
                                type="email"
                                id="email"
                                placeholder="votre@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0072BB] focus:border-[#0072BB] transition-all duration-200 placeholder-gray-400"
                            />
                        </div>

                        {/* Mot de passe */}
                        <div className="space-y-2">
                            <label htmlFor="motDePasse" className="block text-sm font-semibold text-gray-700">Mot de passe</label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    id="motDePasse"
                                    placeholder="••••••••"
                                    value={motDePasse}
                                    onChange={(e) => setMotDePasse(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0072BB] focus:border-[#0072BB] transition-all duration-200 pr-12 placeholder-gray-400"
                                />
                                <button
                                    type="button"
                                    onClick={togglePassword}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-50 rounded-r-xl transition-colors"
                                >
                                    {!showPassword ? (
                                        <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd"
                                                  d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"/>
                                            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Lien mot de passe oublié */}
                        <div className="mt-4 text-end">
                            <button
                                type="button"
                                onClick={() => setShowForgotPassword(true)}
                                className="text-sm font-medium text-[#0072BB] hover:text-[#005b96] hover:cursor-pointer transition-colors focus:outline-none"
                            >
                                Mot de passe oublié ?
                            </button>
                        </div>

                        {/* Bouton de connexion */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#0072BB] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#005b96] focus:ring-2 focus:ring-[#0072BB] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg h-12"
                        >
                            {loading ? 'Connexion en cours...' : 'Se connecter'}
                        </Button>
                    </form>
                </div>
            </div>
            
            {/* Overlay et formulaire de mot de passe oublié */}
            {showForgotPassword && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <ForgotPasswordForm onBackToLogin={handleBackToLogin} />
                </div>
            )}
        </div>
    )
}