"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { API_BASE_URL } from "@/lib/config"

export function ForgotPasswordForm({ onBackToLogin }: { onBackToLogin: () => void }) {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [successMessage, setSuccessMessage] = useState("")
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErrorMessage("")
        setSuccessMessage("")

        try {
            const response = await fetch(`${API_BASE_URL}/api/V1/manager/password/forgot`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    email,
                    resetUrl: `${window.location.origin}/reset-password`
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || "Une erreur est survenue")
            }

            setSuccessMessage("Un email de réinitialisation a été envoyé à votre adresse email.")
        } catch (error) {
            console.error("Erreur lors de la demande de réinitialisation:", error)
            setErrorMessage(error instanceof Error ? error.message : "Une erreur est survenue")
        } finally {
            setLoading(false)
        }
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
                    <h1 className="text-4xl font-bold mb-4">Réinitialisation du mot de passe</h1>
                    <p className="text-xl opacity-90 leading-relaxed">
                        Entrez votre adresse email pour recevoir les instructions de réinitialisation de votre mot de passe.
                    </p>
                </div>
            </div>

            {/* Partie droite - Formulaire */}
            <div className="w-full lg:w-1/2 flex justify-center items-center p-8">
                <div className="w-full max-w-md">
                    {/* En-tête du formulaire */}
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Mot de passe oublié</h2>
                        <p className="text-gray-600">Entrez votre adresse email pour réinitialiser votre mot de passe</p>
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

                    {successMessage ? (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                                <span className="text-sm">{successMessage}</span>
                            </div>
                            <div className="mt-4">
                                <Button
                                    onClick={onBackToLogin}
                                    className="w-full bg-[#0072BB] hover:bg-[#005b96] h-12"
                                >
                                    Retour à la connexion
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Adresse email
                                </label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="votre@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0072BB] focus:border-[#0072BB] transition-all duration-200"
                                />
                            </div>

                            <div className="flex flex-col space-y-4">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#0072BB] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#005b96] focus:ring-2 focus:ring-[#0072BB] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg h-12"
                                >
                                    {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onBackToLogin}
                                    className="w-full h-12 border-2 border-gray-200 hover:bg-gray-50"
                                >
                                    Retour à la connexion
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
