import { Card, CardHeader, CardContent } from "@/components/ui/card"

export function FacturationHeader() {
    return (
        <Card className="mb-6 border-0 shadow-sm">
            <CardHeader className="pb-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Gestion de la Facturation</h1>
                <p className="text-muted-foreground text-base mt-2">
                    Générez et gérez les factures mensuelles de vos clients
                </p>
            </CardHeader>
        </Card>
    )
}
