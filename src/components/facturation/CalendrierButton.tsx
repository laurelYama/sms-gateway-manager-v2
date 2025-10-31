import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CalendrierFacturation } from "./CalendrierFacturation"
import { Calendrier } from "./types"
import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

interface CalendrierButtonProps {
  calendrier: Calendrier[]
  selectedYear: number
  onYearChange: (year: number) => void
  loading: boolean
  availableYears?: number[]
}

export function CalendrierButton({ 
  calendrier = [], 
  selectedYear, 
  onYearChange, 
  loading = false,
  availableYears = []
}: CalendrierButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localLoading, setLocalLoading] = useState(true)
  const safeCalendrier = Array.isArray(calendrier) ? calendrier : []
  
  // Gérer le chargement local
  useEffect(() => {
    if (isOpen && !loading) {
      const timer = setTimeout(() => setLocalLoading(false), 300)
      return () => clearTimeout(timer)
    }
    return () => {}
  }, [isOpen, loading])
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setLocalLoading(true)
    }
  }
  
  const handleYearSelect = (year: string) => {
    const yearNum = parseInt(year, 10)
    if (!isNaN(yearNum)) {
      onYearChange(yearNum)
      setLocalLoading(true)
    }
  }
  
  // Générer les années disponibles si elles ne sont pas fournies
  const years = availableYears.length > 0 
    ? availableYears 
    : Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="ml-auto" disabled={loading}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {loading ? 'Cargando...' : 'Mostrar calendario'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl sm:max-w-4xl p-0">
        <DialogHeader className="flex-row items-center justify-between px-6 pt-6">
          <DialogTitle>Calendario de facturación</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 pt-2 max-h-[80vh] overflow-y-auto">
          {localLoading || loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <p className="text-sm text-muted-foreground">Cargando calendario...</p>
            </div>
          ) : (
            <CalendrierFacturation 
              calendrier={safeCalendrier}
              selectedYear={selectedYear}
              selectedMonth={new Date().getMonth()}
              onYearChange={onYearChange}
              onMonthChange={() => {}}
              loading={loading}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
