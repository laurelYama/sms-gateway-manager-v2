import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { FooterConfig } from "./types"

interface FooterConfigDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (config: FooterConfig) => void
    loading?: boolean
    defaultValues?: FooterConfig
}

export function FooterConfigDialog({
    open,
    onOpenChange,
    onSubmit,
    loading = false,
    defaultValues = {
        companyName: '',
        companyAddress: '',
        companyNif: '',
        companyRccm: '',
        companyEmail: '',
        companyPhone: '',
        paymentNote: '',
        notes: ''
    }
}: FooterConfigDialogProps) {
    const [config, setConfig] = useState<FooterConfig>(defaultValues)

    useEffect(() => {
        if (open) {
            setConfig(defaultValues)
        }
    }, [open, defaultValues])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Vérification des champs requis
        if (!config.companyName || !config.companyAddress || !config.companyPhone || !config.companyEmail) {
            toast.error("Veuillez remplir tous les champs obligatoires")
            return
        }
        onSubmit(config)
    }

    const handleChange = (field: keyof FooterConfig, value: string) => {
        setConfig(prev => ({
            ...prev,
            [field]: value
        }))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Configuration du pied de page</DialogTitle>
                    <DialogDescription>
                        Personnalisez les informations du pied de page des factures.
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6 py-2">
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium">Informations de l&lsquo;`entreprise</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Nom de l&lsquo;`entreprise <span className="text-red-500">*</span></Label>
                                <Input
                                    id="companyName"
                                    value={config.companyName}
                                    onChange={(e) => handleChange('companyName', e.target.value)}
                                    placeholder="Nom de l'entreprise"
                                    className="w-full"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="companyAddress">Adresse <span className="text-red-500">*</span></Label>
                                <Input
                                    id="companyAddress"
                                    value={config.companyAddress}
                                    onChange={(e) => handleChange('companyAddress', e.target.value)}
                                    placeholder="Adresse complète"
                                    className="w-full"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyNif">NIF</Label>
                                <Input
                                    id="companyNif"
                                    value={config.companyNif}
                                    onChange={(e) => handleChange('companyNif', e.target.value)}
                                    placeholder="Numéro d'identification fiscale"
                                    className="w-full"
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="companyRccm">RCCM</Label>
                                <Input
                                    id="companyRccm"
                                    value={config.companyRccm}
                                    onChange={(e) => handleChange('companyRccm', e.target.value)}
                                    placeholder="Numéro RCCM"
                                    className="w-full"
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="companyPhone">Téléphone <span className="text-red-500">*</span></Label>
                                <Input
                                    id="companyPhone"
                                    type="tel"
                                    value={config.companyPhone}
                                    onChange={(e) => handleChange('companyPhone', e.target.value)}
                                    placeholder="Numéro de téléphone"
                                    className="w-full"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyEmail">Email <span className="text-red-500">*</span></Label>
                                <Input
                                    id="companyEmail"
                                    type="email"
                                    value={config.companyEmail}
                                    onChange={(e) => handleChange('companyEmail', e.target.value)}
                                    placeholder="contact@entreprise.com"
                                    className="w-full"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="paymentNote">Conditions de paiement</Label>
                                <Input
                                    id="paymentNote"
                                    value={config.paymentNote}
                                    onChange={(e) => handleChange('paymentNote', e.target.value)}
                                    placeholder="Ex: Paiement à 30 jours"
                                    className="w-full"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes supplémentaires</Label>
                            <Textarea
                                id="notes"
                                value={config.notes || ''}
                                onChange={(e) => handleChange('notes', e.target.value)}
                                placeholder="Informations complémentaires..."
                                className="min-h-[100px] w-full"
                                disabled={loading}
                            />
                        </div>
                    </div>
                    
                    <DialogFooter className="gap-2 sm:gap-4">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                            className="w-full sm:w-auto"
                        >
                            Annuler
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="w-full sm:w-auto min-w-[200px]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enregistrement...
                                </>
                            ) : (
                                'Enregistrer les modifications'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
