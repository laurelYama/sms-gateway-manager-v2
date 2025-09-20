import { StatCard } from "@/components/cards/stat-card"
import { Send, Users, DollarSign } from "lucide-react"

export default function DashboardHomePage() {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="SMS envoyés" value="1 230" icon={<Send className="h-5 w-5" />} />
                <StatCard title="Utilisateurs actifs" value="87" icon={<Users className="h-5 w-5" />} />
                <StatCard title="Crédits restants" value="450" icon={<DollarSign className="h-5 w-5" />} />
            </div>
        </div>
    )
}
