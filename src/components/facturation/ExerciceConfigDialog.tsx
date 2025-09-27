"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar as CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"

export function ExerciceConfigDialog({
  open,
  onOpenChange,
  onSave
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: { annee: number; invoiceDayOfNextMonth: number }) => Promise<void>
}) {
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [invoiceDay, setInvoiceDay] = useState<number>(1)
  const [invoiceDate, setInvoiceDate] = useState<Date>(() => {
    const date = new Date()
    date.setDate(1) // Premier jour du mois
    return date
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSave({
        annee: year,
        invoiceDayOfNextMonth: invoiceDay
      })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Définir un nouvel exercice</DialogTitle>
            <DialogDescription>
              Créez un nouvel exercice comptable pour la facturation des clients postpayés.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year" className="text-right">
                Année
              </Label>
              <Input
                id="year"
                type="number"
                min={2000}
                max={2100}
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Jour de facturation
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !invoiceDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {invoiceDate ? (
                        `Le ${invoiceDate.getDate()} de chaque mois`
                      ) : (
                        <span>Choisir un jour</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-3">
                      <p className="text-sm text-muted-foreground mb-2">Sélectionnez un jour du mois (1-28)</p>
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                          <Button
                            key={day}
                            variant={invoiceDay === day ? "default" : "outline"}
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              const newDate = new Date()
                              newDate.setDate(day)
                              setInvoiceDate(newDate)
                              setInvoiceDay(day)
                            }}
                          >
                            {day}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <input
                  type="hidden"
                  id="invoiceDay"
                  value={invoiceDay}
                  required
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
