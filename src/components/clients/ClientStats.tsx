import { Building, UserCheck, UserX, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Client } from "@/types/client"

interface ClientStatsProps {
  clients: Client[]
}

export function ClientStats({ clients }: ClientStatsProps) {
  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(Math.round(amount))
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Building className="h-4 w-4" />
            Total Clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{clients.length}</div>
          <p className="text-gray-500 text-sm">Comptes enregistrés</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-green-600" />
            Actifs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {clients.filter((c) => c.statutCompte === "ACTIF").length}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <UserX className="h-4 w-4 text-red-600" />
            Suspendus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {clients.filter((c) => c.statutCompte === "SUSPENDU").length}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wallet className="h-4 w-4 text-blue-600" />
            Solde Moyen Postpayé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-blue-600">
              {(() => {
                const postpayeClients = clients.filter(client => client.typeCompte === 'POSTPAYE');
                const totalPostpaye = postpayeClients.reduce((sum, client) => sum + (client.soldeNet || 0), 0);
                const average = postpayeClients.length > 0 ? totalPostpaye / postpayeClients.length : 0;
                return formatNumber(average);
              })()}
            </div>
            <p className="text-gray-500 text-xs">
              Moyenne sur {clients.filter(c => c.typeCompte === 'POSTPAYE').length} compte(s) postpayé(s)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
