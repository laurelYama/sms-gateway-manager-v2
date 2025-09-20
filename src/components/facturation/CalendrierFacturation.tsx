import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Calendar as CalendarIcon } from "lucide-react"
import { format, isSameDay } from "date-fns"
import { fr } from "date-fns/locale"
import { useState, useEffect } from "react"
import { Calendrier } from "./types"

// Extension de l'interface Calendrier pour inclure le statut
interface CalendrierWithStatus extends Calendrier {
    statut?: 'BROUILLON' | 'GENEREE' | 'ENVOYEE' | 'PAYEE' | 'ANNULEE';
}

interface CalendrierFacturationProps {
    calendrier: CalendrierWithStatus[]
    selectedYear: number
    selectedMonth: number
    onYearChange: (year: number) => void
    onMonthChange: (month: number) => void
    loading?: boolean
}

export function CalendrierFacturation({
    calendrier = [],
    selectedYear: propSelectedYear,
    selectedMonth: propSelectedMonth,
    onYearChange,
    onMonthChange,
    loading = false
}: CalendrierFacturationProps) {
    // Initialize with current date if not provided
    const currentDate = new Date();
    const [selectedYear, setSelectedYear] = useState<number>(propSelectedYear ?? currentDate.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number>(propSelectedMonth ?? currentDate.getMonth());
    
    // Update internal state when props change
    useEffect(() => {
        if (propSelectedYear !== undefined) {
            setSelectedYear(propSelectedYear);
        }
        if (propSelectedMonth !== undefined) {
            setSelectedMonth(propSelectedMonth);
        }
    }, [propSelectedYear, propSelectedMonth]);
    
    const handleMonthChange = (month: number) => {
        setSelectedMonth(month);
        onMonthChange?.(month);
    };
    
    const handleYearChange = (year: number) => {
        setSelectedYear(year);
        onYearChange?.(year);
    };
    const [isTableExpanded, setIsTableExpanded] = useState(false)
    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
    const months = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]

    const getDateStatus = (date: Date) => {
        try {
            if (!date || !(date instanceof Date) || isNaN(date.getTime())) return null

            const event = calendrier.find(cal => {
                if (!cal.dateGenerationFacture) return false
                try {
                    const eventDate = new Date(cal.dateGenerationFacture)
                    return isSameDay(eventDate, date)
                } catch (e) {
                    console.error('Erreur lors du traitement de la date:', e)
                    return false
                }
            })

            if (!event) return null

            return {
                status: event.statut || 'BROUILLON',
                tooltip: `Facturation du ${format(new Date(event.dateDebutConsommation), 'dd/MM/yyyy')} au ${format(new Date(event.dateFinConsommation), 'dd/MM/yyyy')}`
            }
        } catch (error) {
            console.error('Erreur dans getDateStatus:', error)
            return null
        }
    }

    const today = new Date();
    const currentDay = today.getDate();

    const dayContent = (day: Date) => {
        if (!day || isNaN(day.getTime())) {
            return <div className="h-6 w-6"></div>;
        }

        const dayNumber = day.getDate();
        const dayMonth = day.getMonth();
        const dayYear = day.getFullYear();

        const isCurrentMonth = dayMonth === selectedMonth && dayYear === selectedYear;
        const isToday = dayNumber === currentDay &&
            dayMonth === today.getMonth() &&
            dayYear === today.getFullYear();

        const status = getDateStatus(day);

        return (
            <div className="relative flex flex-col items-center p-1">
                <div className={`h-6 w-6 flex items-center justify-center rounded-full text-xs
                    ${isToday ? 'bg-blue-500 text-white font-bold' : ''}
                    ${!isCurrentMonth ? 'opacity-30' : 'font-medium'}
                `}>
                    {dayNumber}
                </div>
                {status && (
                    <div
                        className={`h-1.5 w-1.5 rounded-full mt-1 ${
                            status.status === 'GENEREE' ? 'bg-blue-500' :
                                status.status === 'ENVOYEE' ? 'bg-green-500' :
                                    status.status === 'PAYEE' ? 'bg-purple-500' : 'bg-gray-400'
                        }`}
                        title={status.tooltip}
                    />
                )}
            </div>
        )
    }

    if (loading) {
        return (
            <Card className="mb-6">
                <CardContent className="flex justify-center items-center h-48">
                    <div className="animate-pulse text-gray-400">Chargement...</div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-blue-500" />
                    <CardTitle>Calendrier de facturation</CardTitle>
                </div>
                <div className="flex gap-2">
                    <Select
                        value={selectedMonth?.toString() || '0'}
                        onValueChange={(value) => handleMonthChange(parseInt(value))}
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="Mois" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((month, index) => (
                                <SelectItem key={month} value={index.toString()}>
                                    {month}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={selectedYear?.toString() || new Date().getFullYear().toString()}
                        onValueChange={(value) => handleYearChange(parseInt(value))}
                    >
                        <SelectTrigger className="w-24">
                            <SelectValue placeholder="Année" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>

            <CardContent>
                {/* Calendrier compact */}
                <div className="mb-6">
                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 mb-2">
                        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(day => (
                            <div key={day} className="p-1">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: new Date(selectedYear, selectedMonth, 1).getDay() || 0 }).map((_, i) => (
                            <div key={`empty-start-${i}`} className="h-8"></div>
                        ))}

                        {Array.from({ length: new Date(selectedYear, selectedMonth + 1, 0).getDate() }).map((_, i) => {
                            const day = i + 1;
                            const date = new Date(selectedYear, selectedMonth, day);
                            return (
                                <div key={day} className="flex justify-center">
                                    {dayContent(date)}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Légende compacte */}
                <div className="flex justify-center gap-3 mb-6 text-xs">
                    <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <span>Générée</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span>Envoyée</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                        <span>Payée</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                        <span>Brouillon</span>
                    </div>
                </div>

                {/* Résumé des factures */}
                <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-medium">Factures du mois</h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsTableExpanded(!isTableExpanded)}
                            className="h-8 text-xs"
                        >
                            {isTableExpanded ? (
                                <>
                                    <ChevronUp className="h-3 w-3 mr-1" />
                                    Réduire
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                    Détails ({calendrier.length})
                                </>
                            )}
                        </Button>
                    </div>

                    {isTableExpanded && (
                        <div className="overflow-x-auto">
                            <Table className="text-xs">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="h-8 px-2">Mois</TableHead>
                                        <TableHead className="h-8 px-2">Période</TableHead>
                                        <TableHead className="h-8 px-2">Génération</TableHead>
                                        <TableHead className="h-8 px-2">Statut</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {calendrier.map((item) => {
                                        const statusConfig = {
                                            'GENEREE': { color: 'bg-blue-100 text-blue-800', label: 'Générée' },
                                            'ENVOYEE': { color: 'bg-green-100 text-green-800', label: 'Envoyée' },
                                            'PAYEE': { color: 'bg-purple-100 text-purple-800', label: 'Payée' },
                                            'BROUILLON': { color: 'bg-gray-100 text-gray-800', label: 'Brouillon' },
                                            'ANNULEE': { color: 'bg-red-100 text-red-800', label: 'Annulée' }
                                        }

                                        const status = statusConfig[item.statut || 'BROUILLON']

                                        return (
                                            <TableRow key={item.id} className="h-8 hover:bg-muted/50">
                                                <TableCell className="px-2 py-1">
                                                    {new Date(2000, item.mois - 1, 1).toLocaleString('fr-FR', { month: 'short' })}
                                                </TableCell>
                                                <TableCell className="px-2 py-1">
                                                    {format(new Date(item.dateDebutConsommation), 'dd MMM', { locale: fr })} -{' '}
                                                    {format(new Date(item.dateFinConsommation), 'dd MMM', { locale: fr })}
                                                </TableCell>
                                                <TableCell className="px-2 py-1">
                                                    {format(new Date(item.dateGenerationFacture), 'dd MMM', { locale: fr })}
                                                </TableCell>
                                                <TableCell className="px-2 py-1">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {!isTableExpanded && calendrier.length > 0 && (
                        <div className="text-xs text-gray-500 text-center py-2">
                            {calendrier.length} facture{calendrier.length > 1 ? 's' : ''} ce mois-ci
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}