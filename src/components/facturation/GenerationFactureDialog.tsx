import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
// Formato de fecha personalizado para español
const formatMonth = (month: number) => {
    const date = new Date(2000, month - 1, 1);
    return new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(date);
};

const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', { 
        year: 'numeric', 
        month: 'long' 
    }).format(date);
};
import { GenerationParams } from "./types"

interface GenerationFactureDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (params: GenerationParams) => void
    loading?: boolean
    defaultValues?: GenerationParams
}

export function GenerationFactureDialog({
    open,
    onOpenChange,
    onSubmit,
    loading = false,
    defaultValues = {
        annee: new Date().getFullYear(),
        mois: new Date().getMonth() + 1
    }
}: GenerationFactureDialogProps) {
    const [params, setParams] = useState<GenerationParams>(defaultValues)
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1

    useEffect(() => {
        if (open) {
            setParams(defaultValues)
        }
    }, [open, defaultValues])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(params)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Generar facturas</DialogTitle>
                        <DialogDescription>
                            Genere facturas para un período específico.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="annee" className="text-right">
                                Año
                            </Label>
                            <Input
                                id="annee"
                                type="number"
                                min={currentYear - 1}
                                max={currentYear + 5}
                                value={params.annee}
                                onChange={(e) => setParams({...params, annee: parseInt(e.target.value)})}
                                className="col-span-3"
                                disabled={loading}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="mois" className="text-right">
                                Mes
                            </Label>
                            <select
                                id="mois"
                                value={params.mois}
                                onChange={(e) => setParams({...params, mois: parseInt(e.target.value)})}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={loading}
                            >
                                {Array.from({length: 12}, (_, i) => i + 1).map((month) => (
                                    <option key={month} value={month}>
                                        {formatMonth(month)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            <p>Período seleccionado: {formatDate(new Date(params.annee, params.mois - 1, 1))}</p>
                            {params.annee > currentYear || (params.annee === currentYear && params.mois > currentMonth) ? (
                                <p className="text-yellow-600 mt-1">
                                    Attention : Vous êtes en train de générer des factures pour une période future.
                                </p>
                            ) : null}
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Generando...' : 'Generar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
