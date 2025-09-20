'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useEffect, useState } from 'react'
import { fetchTickets } from '@/lib/api/tickets'
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid, Area, AreaChart
} from 'recharts'
import { 
  MessageSquare, Ticket, Users, CreditCard, 
  AlertCircle, CheckCircle, Clock, RefreshCw, Mail, 
  Smartphone, UserCheck, HelpCircle, BarChart2, PieChart as PieChartIcon,
  Activity, ArrowUpRight, ArrowDownRight, Search, Filter, Calendar, Download
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TicketStatus } from '@/components/tickets/types'
import { MetricsCard } from '@/components/dashboard/metrics-card'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

// Données factices pour les exemples
const mockSmsData = [
  { name: 'Lun', value: 400 },
  { name: 'Mar', value: 300 },
  { name: 'Mer', value: 600 },
  { name: 'Jeu', value: 800 },
  { name: 'Ven', value: 500 },
  { name: 'Sam', value: 100 },
  { name: 'Dim', value: 200 },
]

const mockClientData = [
  { name: 'Actifs', value: 75 },
  { name: 'Inactifs', value: 25 },
]

export default function DashboardPage() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('7days')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchTickets()
        setTickets(data)
      } catch (err) {
        setError('Erreur lors du chargement des données')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Statistiques des tickets
  const ticketStats = tickets.reduce((acc, ticket) => {
    acc[ticket.statut] = (acc[ticket.statut] || 0) + 1
    return acc
  }, { OUVERT: 0, EN_COURS: 0, FERME: 0 })

  // Données pour les graphiques
  const ticketData = Object.entries(ticketStats).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value,
  }))

  // Derniers tickets
  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  // Données pour le graphique d'activité
  const activityData = [
    { name: 'Lun', tickets: 4, sms: 2400 },
    { name: 'Mar', tickets: 3, sms: 1398 },
    { name: 'Mer', tickets: 6, sms: 9800 },
    { name: 'Jeu', tickets: 8, sms: 3908 },
    { name: 'Ven', tickets: 5, sms: 4800 },
    { name: 'Sam', tickets: 1, sms: 800 },
    { name: 'Dim', tickets: 2, sms: 1000 },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-xl font-medium">Erreur de chargement des données</p>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Réessayer
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Aperçu de votre activité et de vos performances
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              className="w-full pl-9 md:w-[200px] lg:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">7 derniers jours</SelectItem>
                <SelectItem value="30days">30 derniers jours</SelectItem>
                <SelectItem value="90days">3 derniers mois</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Tickets ouverts"
          value={ticketStats.OUVERT}
          description="par rapport au mois dernier"
          icon={<Ticket className="h-5 w-5 text-primary" />}
          trend={{ value: "20%", isPositive: false }}
          tooltip="Nombre de tickets actuellement ouverts"
        />
        <MetricsCard
          title="Tickets en cours"
          value={ticketStats.EN_COURS}
          description="par rapport au mois dernier"
          icon={<RefreshCw className="h-5 w-5 text-primary" />}
          trend={{ value: "5%", isPositive: false }}
          tooltip="Tickets en cours de traitement"
        />
        <MetricsCard
          title="SMS envoyés"
          value="1,234"
          description="par rapport au mois dernier"
          icon={<MessageSquare className="h-5 w-5 text-primary" />}
          trend={{ value: "12%", isPositive: true }}
          tooltip="Nombre total de SMS envoyés cette période"
        />
        <MetricsCard
          title="Clients actifs"
          value="42"
          description="par rapport au mois dernier"
          icon={<UserCheck className="h-5 w-5 text-primary" />}
          trend={{ value: "8%", isPositive: true }}
          tooltip="Nombre de clients actifs sur la plateforme"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              Analyse
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              Rapports
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="mr-2 h-4 w-4" />
              Filtres
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  Activité récente
                </CardTitle>
                <CardDescription>Évolution des tickets et des SMS sur 7 jours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={activityData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorSms" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          borderRadius: '0.5rem',
                          border: '1px solid #e5e7eb',
                          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="tickets" 
                        stroke="#8884d8" 
                        fillOpacity={1} 
                        fill="url(#colorTickets)" 
                        name="Tickets"
                        strokeWidth={2}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="sms" 
                        stroke="#82ca9d" 
                        fillOpacity={1} 
                        fill="url(#colorSms)" 
                        name="SMS"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-muted-foreground" />
                  Répartition des tickets
                </CardTitle>
                <CardDescription>Statut actuel des tickets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ticketData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => 
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {ticketData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          borderRadius: '0.5rem',
                          border: '1px solid #e5e7eb',
                          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
                        }}
                        formatter={(value, name, props) => {
                          const percent = (Number(value) / ticketData.reduce((a, b) => a + b.value, 0)) * 100
                          return [`${name}: ${value} (${percent.toFixed(1)}%)`, '']
                        }}
                      />
                      <Legend 
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        formatter={(value, entry, index) => (
                          <span className="text-sm text-muted-foreground">
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyse détaillée</CardTitle>
              <CardDescription>Données et métriques avancées</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Section d'analyse en cours de développement</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rapports</CardTitle>
              <CardDescription>Générez et consultez vos rapports</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Section des rapports en cours de développement</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-muted-foreground" />
                Derniers tickets
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-8">
                Voir tout
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTickets.length > 0 ? (
                recentTickets.map((ticket) => (
                  <Card key={ticket.id} className="overflow-hidden hover:shadow-sm transition-shadow">
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Ticket className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium leading-none">{ticket.titre}</h4>
                            <Badge 
                              variant={ticket.statut === 'OUVERT' ? 'destructive' : ticket.statut === 'EN_COURS' ? 'warning' : 'success'}
                              className="text-xs"
                            >
                              {ticket.statut.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {ticket.description}
                          </p>
                          <div className="mt-2 flex items-center text-xs text-muted-foreground">
                            <span>{format(new Date(ticket.createdAt), 'PP', { locale: fr })}</span>
                            <span className="mx-2">•</span>
                            <span>{ticket.client?.name || 'Client inconnu'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Ticket className="h-12 w-12 text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium">Aucun ticket récent</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Créez votre premier ticket pour commencer
                  </p>
                  <Button className="mt-4">Créer un ticket</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                Statistiques SMS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Crédits restants</span>
                    <span className="text-sm font-semibold">1,245</span>
                  </div>
                  <Progress value={65} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Environ 30 jours restants
                  </p>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Taux de livraison</span>
                    <div className="flex items-center">
                      <span className="text-sm font-semibold">98.5%</span>
                      <ArrowUpRight className="ml-1 h-4 w-4 text-green-500" />
                    </div>
                  </div>
                  <Progress value={98.5} className="h-2" indicatorClassName="bg-green-500" />
                  <p className="text-xs text-muted-foreground mt-1">
                    +0.5% par rapport au mois dernier
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Clients actifs</span>
                    <span className="text-sm font-semibold">42/50</span>
                  </div>
                  <Progress value={84} className="h-2" indicatorClassName="bg-purple-500" />
                  <p className="text-xs text-muted-foreground mt-1">
                    8 places disponibles
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button className="w-full" size="sm">
                <CreditCard className="mr-2 h-4 w-4" />
                Acheter des crédits
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-muted-foreground" />
                Activité récente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: 1, action: 'Nouveau ticket créé', time: '2 min', user: 'John Doe' },
                { id: 2, action: 'SMS envoyé', time: '10 min', user: 'Jane Smith' },
                { id: 3, action: 'Ticket résolu', time: '1h', user: 'Admin' },
                { id: 4, action: 'Nouveau client', time: '2h', user: 'System' },
              ].map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.action}</span>
                      <span className="text-muted-foreground"> par {activity.user}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Il y a {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
