import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface StatCardProps {
    title: string
    value: string | number
    icon?: React.ReactNode
}

export function StatCard({ title, value, icon }: StatCardProps) {
    return (
        <Card className="shadow-sm hover:shadow-md transition">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
                {icon && <div className="text-gray-400">{icon}</div>}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    )
}
