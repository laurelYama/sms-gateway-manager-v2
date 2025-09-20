import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CalendrierFacturation } from "./CalendrierFacturation"
import { Calendrier } from "./types"

interface CalendrierButtonProps {
  calendrier: Calendrier[]
  selectedYear: number
  onYearChange: (year: number) => void
  loading: boolean
}

export function CalendrierButton({ calendrier, selectedYear, onYearChange, loading }: CalendrierButtonProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="ml-auto">
          <CalendarIcon className="mr-2 h-4 w-4" />
          Afficher le calendrier
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Calendrier de facturation</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <CalendrierFacturation 
            calendrier={calendrier}
            selectedYear={selectedYear}
            onYearChange={onYearChange}
            loading={loading}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
