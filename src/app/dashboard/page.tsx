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
import { useCallback, useEffect, useState, useMemo } from 'react'
import { getToken } from '@/lib/auth'
import { useAuth } from '@/lib/auth'
import { fetchTickets } from '@/lib/api/tickets'
import { API_BASE_URL } from '@/lib/config'
import { 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend, 
  PieChart, 
  BarChart, 
  AreaChart,
  Area as RechartsArea,
  Bar
} from 'recharts'
// Utilisation directe de Bar de recharts au lieu du composant personnalisé
import { Pie as RechartsPie, Cell } from 'recharts'
import {
  MessageSquare, Ticket, Users, CreditCard,
  AlertCircle, CheckCircle, Clock, RefreshCw, RotateCw, Mail,
  Smartphone, UserCheck, HelpCircle, BarChart2, PieChart as PieChartIcon,
  Activity, ArrowUpRight, ArrowDownRight, Search, Filter, Calendar, Download
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TicketStatus } from '@/components/tickets/types'
import { MetricsCard } from '@/components/dashboard/metrics-card'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']
  
// Couleurs pour les statuts des tickets
const statusColors = {
  OUVERT: '#F59E0B', // orange
  EN_COURS: '#3B82F6', // bleu
  FERME: '#10B981', // vert
  REJETE: '#EF4444' // rouge
}

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
  const { token, loading: authLoading } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('7days')
  const [activeClients, setActiveClients] = useState(0)
  const [clientsLoading, setClientsLoading] = useState(true)
  const [openTicketsCount, setOpenTicketsCount] = useState(0)
  const [ticketsLoading, setTicketsLoading] = useState(true)

  // États pour la facturation
  const [billingData, setBillingData] = useState<Array<{
    id: string
    mois: number
    dateDebutConsommation: string
    dateFinConsommation: string
    dateGenerationFacture: string
    exercice: {
      id: string
      annee: number
      statut: string
      createdAt: string
    }
  }>>([])
  const [billingLoading, setBillingLoading] = useState(true)

  // États pour les SMS
  const [smsLoading, setSmsLoading] = useState(true)
  const [pendingSmsLoading, setPendingSmsLoading] = useState(true)
  const [smsTrend, setSmsTrend] = useState<{value: string, isPositive: boolean} | null>(null)
  const [sentSmsCount, setSentSmsCount] = useState(0)
  const [pendingSmsCount, setPendingSmsCount] = useState(0)
  // Interface pour les statistiques SMS
  interface SmsStats {
    current: number;
    previous: number;
    trend: number;
    progress: number;
    yearlyData?: Array<{
      year: number;
      count: number;
    }>;
  }

  // État pour les statistiques SMS
  const [smsStats, setSmsStats] = useState<SmsStats>({
    current: 0,
    previous: 0,
    trend: 0,
    progress: 0,
    monthlyData: undefined
  });
  const [recentSms, setRecentSms] = useState<Array<{
    ref: string;
    type: string;
    destinataire: string;
    emetteur: string;
    statut: string;
    dateDebutEnvoi?: string | null;
    dateFinEnvoi?: string | null;
    updatedAt: string;
  }>>([]);
  const [recentSmsLoading, setRecentSmsLoading] = useState<boolean>(true);

  // Fonction pour calculer la progression des SMS
  const calculateSmsProgress = (smsList: any[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let currentMonthCount = 0;
    let lastMonthCount = 0;

    smsList.forEach(sms => {
      // On ne compte que les SMS avec statut 'ENVOYE' et une date de mise à jour valide
      try {
        const smsDate = new Date(sms.updatedAt);
        const smsMonth = smsDate.getMonth();
        const smsYear = smsDate.getFullYear();

        // Vérification des dates pour le décompte
        if (smsYear === currentYear && smsMonth === currentMonth) {
          currentMonthCount++;
        } else if ((smsYear === lastMonthYear && smsMonth === lastMonth) ||
            (currentMonth === 0 && smsMonth === 11 && smsYear === currentYear - 1)) {
          lastMonthCount++;
        }
      } catch (error) {
        console.error('Erreur lors du traitement de la date du SMS:', sms.updatedAt, error);
      }
    });


    // Calcul de la tendance
    let trend = 0;
    if (lastMonthCount > 0) {
      trend = ((currentMonthCount - lastMonthCount) / lastMonthCount) * 100;
    } else if (currentMonthCount > 0) {
      trend = 100; // Si pas de SMS le mois dernier mais des SMS ce mois-ci
    }

    // Calcul de la progression (limitée à 100%)
    const progress = Math.min(100, (currentMonthCount / (lastMonthCount || 1)) * 100);

    return {
      current: currentMonthCount,
      previous: lastMonthCount,
      trend: parseFloat(trend.toFixed(1)),
      progress: Math.round(progress)
    };
  };

  // Fonction pour charger les données de facturation
  const fetchBillingData = useCallback(async () => {
    try {
      if (authLoading) return [];
      
      if (!token) {
        console.error('Aucun token disponible');
        return [];
      }

      const currentYear = new Date().getFullYear();
      const response = await fetch(`${API_BASE_URL}/api/V1/billing/exercices/${currentYear}/calendrier`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur lors du chargement des données de facturation:', response.status, errorText);
        return [];
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        console.error('La réponse des données de facturation n\'est pas un tableau:', data);
        return [];
      }

      // Trier par date de génération de facture (la plus récente en premier)
      const sortedData = [...data].sort((a, b) =>
          new Date(b.dateGenerationFacture).getTime() - new Date(a.dateGenerationFacture).getTime()
      );

      setBillingData(sortedData);
      return sortedData;

    } catch (error) {
      console.error('Erreur lors du chargement des données de facturation:', error);
      return [];
    } finally {
      setBillingLoading(false);
    }
  }, [token]);

  // Fonction pour charger les clients actifs
  const fetchActiveClients = useCallback(async () => {
    try {
      if (!token) {
        console.error('Aucun token disponible');
        return 0;
      }

      const response = await fetch(`${API_BASE_URL}/api/V1/clients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur lors du chargement des clients:', response.status, errorText);
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }

      const clients = await response.json();

      // Vérifier si clients est un tableau
      if (!Array.isArray(clients)) {
        console.error('La réponse des clients n\'est pas un tableau:', clients);
        return 0;
      }

      const activeCount = clients.filter((client: any) => client.statutCompte === 'ACTIF').length;
      setActiveClients(activeCount);
      return activeCount;

    } catch (error) {
      console.error('Erreur lors du chargement des clients actifs:', error);
      return 0;
    } finally {
      setClientsLoading(false);
    }
  }, [token]);

  // Fonction pour calculer la tendance des SMS
  const calculateSmsTrend = (currentMonthCount: number, previousMonthCount: number) => {
    if (previousMonthCount === 0) {
      return { value: '100%', isPositive: true };
    }

    const percentage = Math.round(((currentMonthCount - previousMonthCount) / previousMonthCount) * 100);

    return {
      value: `${Math.abs(percentage)}%`,
      isPositive: percentage >= 0
    };
  };

  // Fonction pour vérifier si une date est dans un mois donné
  const isInMonth = (dateStr: string, year: number, month: number) => {
    try {
      const date = new Date(dateStr);
      return date.getFullYear() === year && date.getMonth() === month;
    } catch (e) {
      console.error('Erreur de format de date:', dateStr, e);
      return false;
    }
  };

  // Fonction pour compter les SMS envoyés du mois en cours
  const fetchSentSmsCount = useCallback(async () => {
    try {
      if (!token) {
        console.error('Aucun token disponible');
        return { currentMonthCount: 0, previousMonthCount: 0 };
      }

      // Récupérer tous les SMS envoyés
      const response = await fetch(`${API_BASE_URL}/api/V1/sms/envoyes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur lors du chargement des SMS envoyés:', response.status, errorText);
        return { currentMonthCount: 0, previousMonthCount: 0 };
      }

      const allSms = await response.json();
      if (!Array.isArray(allSms)) {
        console.error('La réponse des SMS n\'est pas un tableau:', allSms);
        return { currentMonthCount: 0, previousMonthCount: 0 };
      }

      // Obtenir le mois et l'année actuels
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Compter les SMS du mois en cours
      const currentCount = allSms.filter((sms: any) => {
        if (!sms.updatedAt) return false;
        const smsDate = new Date(sms.updatedAt);
        return smsDate.getMonth() === currentMonth &&
            smsDate.getFullYear() === currentYear &&
            sms.statut === 'ENVOYE';
      }).length;

      // Calculer le mois précédent (en gérant le passage d'année)
      let previousMonth = currentMonth - 1;
      let previousYear = currentYear;
      if (previousMonth < 0) {
        previousMonth = 11;
        previousYear--;
      }

      // Compter les SMS du mois précédent
      const previousCount = allSms.filter((sms: any) => {
        if (!sms.updatedAt) return false;
        const smsDate = new Date(sms.updatedAt);
        return smsDate.getMonth() === previousMonth &&
            smsDate.getFullYear() === previousYear &&
            sms.statut === 'ENVOYE';
      }).length;


      // Mettre à jour le compteur de SMS du mois en cours
      setSentSmsCount(currentCount);

      // Calculer et mettre à jour la tendance
      const trend = calculateSmsTrend(currentCount, previousCount);
      setSmsTrend(trend);


      // Mettre à jour les statistiques SMS
      setSmsStats({
        current: currentCount,
        previous: previousCount,
        trend: trend.isPositive ? parseFloat(trend.value) : -parseFloat(trend.value),
        progress: Math.min(100, currentCount)
      });

      // Retourner les données pour une utilisation ultérieure
      return { currentMonthCount: currentCount, previousMonthCount: previousCount };

    } catch (error) {
      console.error('Erreur lors du chargement des SMS:', error);
      setSentSmsCount(0);
      return { currentMonthCount: 0, previousMonthCount: 0 };
    } finally {
      setSmsLoading(false);
    }
  }, [token]);

// Fonction pour charger les tickets ouverts
  const fetchOpenTickets = useCallback(async () => {
    try {
      if (!token) {
        console.error('Aucun token disponible')
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/V1/tickets`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })


      if (!response.ok) {
        const errorText = await response.text()
        console.error('Erreur lors du chargement des tickets:', response.status, errorText)
        throw new Error(`Erreur ${response.status}: ${errorText}`)
      }

      const ticketsData = await response.json()

      // Filtrer les tickets ouverts
      if (Array.isArray(ticketsData)) {
        const openTickets = ticketsData.filter((ticket: any) => ticket.statut === 'OUVERT')
        setOpenTicketsCount(openTickets.length)
      } else {
        console.error('La réponse des tickets n\'est pas un tableau:', ticketsData)
        setOpenTicketsCount(0)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tickets ouverts:', error)
      setOpenTicketsCount(0)
    } finally {
      setTicketsLoading(false)
    }
  }, [token])

  // Fonction pour charger les tickets
  const fetchTickets = useCallback(async () => {
    if (!token) {
      return [];
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/V1/tickets`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`fetchTickets: Erreur ${response.status}`, errorText);
        throw new Error(`Erreur ${response.status} lors du chargement des tickets`);
      }

      const tickets = await response.json();
      return tickets;
    } catch (error) {
      console.error('Erreur lors du chargement des tickets:', error);
      setError('Impossible de charger les tickets');
      return [];
    }
  }, [token]);

  // Fonction pour charger les SMS en attente
  const fetchPendingSms = useCallback(async () => {
    try {
      if (!token) {
        console.error('Aucun token disponible');
        return 0;
      }

      const response = await fetch(
          `${API_BASE_URL}/api/V1/sms/pending`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            mode: 'cors'
          }
      );


      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur lors du chargement des SMS en attente:', response.status, errorText);
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      // Compter le nombre de SMS en attente
      const pendingCount = Array.isArray(data) ? data.length : 0;
      setPendingSmsCount(pendingCount);
      return pendingCount;

    } catch (error) {
      console.error('Erreur lors du chargement des SMS en attente:', error);
      return 0;
    } finally {
      setPendingSmsLoading(false);
    }
  }, [token])

  // Fonction pour récupérer les statistiques annuelles des SMS
  const fetchYearlySmsStats = useCallback(async () => {
    try {
      if (!token) return [];

      const response = await fetch('https://api-smsgateway.solutech-one.com/api/V1/sms/envoyes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des SMS');
      }

      const allSms = await response.json();

      const yearlyStats = allSms.reduce((acc: {[key: number]: number}, sms: any) => {
        if (!sms.updatedAt) return acc;

        const date = new Date(sms.updatedAt);
        const year = date.getFullYear();

        if (!acc[year]) {
          acc[year] = 0;
        }

        acc[year]++;
        return acc;
      }, {});

      const yearlyData = Object.entries(yearlyStats).map(([year, count]) => ({
        year: parseInt(year),
        count: count as number
      }));

      yearlyData.sort((a, b) => a.year - b.year);

      setSmsStats(prev => ({
        ...prev,
        yearlyData
      }));

      return yearlyData;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques mensuelles:', error);
      return [];
    }
  }, [token]);

  // Fonction pour charger les SMS récents
  const fetchRecentSms = useCallback(async () => {
    if (!token) {
      setRecentSmsLoading(false);
      return [];
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/V1/sms/envoyes?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`fetchRecentSms: Erreur ${response.status}`, errorText);
        throw new Error(`Erreur ${response.status} lors du chargement des SMS récents`);
      }

      let smsList = await response.json();

      if (!Array.isArray(smsList)) {
        console.error('La réponse des SMS n\'est pas un tableau:', smsList);
        return [];
      }

      // Trier par date de mise à jour (du plus récent au plus ancien)
      smsList = smsList.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      // Prendre les 5 premiers
      return smsList.slice(0, 5);

    } catch (error) {
      console.error('Erreur lors du chargement des tickets:', error);
      setError('Impossible de charger les tickets');
      return [];
    }
  }, [token])

  // Statistiques des tickets
  const [ticketStats, setTicketStats] = useState({
    OUVERT: 0,
    EN_COURS: 0,
    FERME: 0
  })

  // Couleurs pour les différents statuts
  const statusColors = {
    OUVERT: '#F59E0B', // Jaune
    EN_COURS: '#3B82F6', // Bleu
    FERME: '#10B981' // Vert
  }

  // Fonction pour charger les données initiales
  const loadInitialData = useCallback(async () => {
    try {
      if (authLoading) return;
      
      setLoading(true);
      setSmsLoading(true);
      setTicketsLoading(true);
      setClientsLoading(true);
      setBillingLoading(true);
      setRecentSmsLoading(true);

      const [
        ticketsData,
        smsData,
        pendingData,
        clientsData,
        billingData,
        recentSmsData,
        yearlyStats
      ] = await Promise.all([
        fetchTickets(),
        fetchSentSmsCount(),
        fetchPendingSms(),
        fetchActiveClients(),
        fetchBillingData(),
        fetchRecentSms(),
        fetchYearlySmsStats()
      ]);

      // Mettre à jour les états avec les données chargées
      setActiveClientsCount(Array.isArray(clientsData) ? clientsData.length : 0);
      setBillingData(Array.isArray(billingData) ? billingData : []);
      setRecentSms(Array.isArray(recentSmsData) ? recentSmsData : []);
      setYearlySmsStats(yearlyStats || []);

      // Mettre à jour les états
      if (Array.isArray(ticketsData)) {
        setTickets(ticketsData);
        const openTickets = ticketsData.filter(ticket =>
            ticket.statut === 'OUVERT' || ticket.statut === 'EN_COURS'
        ).length;
        setOpenTicketsCount(openTickets);
      }

      // Mettre à jour les SMS récents
      if (Array.isArray(recentSmsData)) {
        setRecentSms(recentSmsData);
      }

      // Mettre à jour les compteurs avec des valeurs par défaut si nécessaire
      const smsCount = typeof smsData === 'object' && smsData !== null && 'currentMonthCount' in smsData
          ? smsData.currentMonthCount
          : 0;

      const pendingCount = typeof pendingData === 'number' ? pendingData : 0;
      const clientsCount = typeof clientsData === 'number' ? clientsData : 0;

      setSentSmsCount(smsCount);
      setPendingSmsCount(pendingCount);
      setActiveClients(clientsCount);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setError('Impossible de charger les données du tableau de bord');
    } finally {
      setLoading(false);
      setTicketsLoading(false);
      setSmsLoading(false);
      setPendingSmsLoading(false);
      setClientsLoading(false);
      setBillingLoading(false);
      setRecentSmsLoading(false);
    }
  }, [token, fetchTickets, fetchSentSmsCount, fetchPendingSms, fetchActiveClients, fetchBillingData, fetchRecentSms, fetchYearlySmsStats, authLoading]);

  // Fonction de rafraîchissement manuel
  const handleRefresh = useCallback(() => {
    if (!authLoading) {
      loadInitialData();
    }
  }, [authLoading, loadInitialData]);

  // Effet pour charger les données initiales
  useEffect(() => {
    if (authLoading) return;
    
    let isMounted = true;
    let refreshInterval: NodeJS.Timeout;
    
    const loadInitialData = async () => {
      if (!isMounted) return;
      try {
        setLoading(true);
        setSmsLoading(true);
        setTicketsLoading(true);
        setClientsLoading(true);
        setBillingLoading(true);
        setRecentSmsLoading(true);

        const [
          ticketsData,
          smsData,
          pendingData,
          clientsData,
          billingData,
          recentSmsData,
          yearlyStats
        ] = await Promise.all([
          fetchTickets(),
          fetchSentSmsCount(),
          fetchPendingSms(),
          fetchActiveClients(),
          fetchBillingData(),
          fetchRecentSms(),
          fetchYearlySmsStats()
        ]);

        // Mise à jour des états avec les données chargées
        setActiveClients(Array.isArray(clientsData) ? clientsData.length : 0);
        setBillingData(Array.isArray(billingData) ? billingData : []);
        setRecentSms(Array.isArray(recentSmsData) ? recentSmsData : []);
        // Mise à jour des statistiques SMS avec les données annuelles
        setSmsStats(prev => ({
          ...prev,
          yearlyData: Array.isArray(yearlyStats) ? yearlyStats : []
        }));

        // Mettre à jour les états
        if (Array.isArray(ticketsData)) {
          setTickets(ticketsData);
          const openTickets = ticketsData.filter(ticket =>
              ticket.statut === 'OUVERT' || ticket.statut === 'EN_COURS'
          ).length;
          setOpenTicketsCount(openTickets);
        }

        // Mettre à jour les SMS récents
        if (Array.isArray(recentSmsData)) {
          setRecentSms(recentSmsData);
        }

        // Mettre à jour les compteurs avec des valeurs par défaut si nécessaire
        const smsCount = typeof smsData === 'object' && smsData !== null && 'currentMonthCount' in smsData
            ? smsData.currentMonthCount
            : 0;

        const pendingCount = typeof pendingData === 'number' ? pendingData : 0;
        const clientsCount = typeof clientsData === 'number' ? clientsData : 0;

        setSentSmsCount(smsCount);
        setPendingSmsCount(pendingCount);
        setActiveClients(clientsCount);

      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setError('Impossible de charger les données du tableau de bord');
      } finally {
        setLoading(false);
        setTicketsLoading(false);
        setSmsLoading(false);
        setPendingSmsLoading(false);
        setClientsLoading(false);
        setBillingLoading(false);
        setRecentSmsLoading(false);
      }
    };

    
    loadInitialData();
    
    // Nettoyage
    return () => {
      // Annuler les requêtes en cours si nécessaire
      isMounted = false;
      if (refreshInterval) clearInterval(refreshInterval);
    };
    
    // Charger les données immédiatement
    loadInitialData();
    
    // Configurer le rafraîchissement automatique toutes les 30 secondes
    refreshInterval = setInterval(loadInitialData, 30000);
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [token, fetchTickets, fetchSentSmsCount, fetchPendingSms, fetchActiveClients, fetchBillingData, fetchRecentSms, fetchYearlySmsStats, authLoading]);

  // Mettre à jour les statistiques des tickets
  useEffect(() => {
    if (tickets.length > 0) {
      const stats = tickets.reduce((acc, ticket) => {
        acc[ticket.statut] = (acc[ticket.statut] || 0) + 1;
        return acc;
      }, { OUVERT: 0, EN_COURS: 0, FERME: 0 });

      setTicketStats(stats);
    } else {
      setTicketStats({ OUVERT: 0, EN_COURS: 0, FERME: 0 });
    }
  }, [tickets]);

  // Données pour le graphique circulaire
  const ticketData = useMemo(() => {
    const data = Object.entries(ticketStats)
      .filter(([_, value]) => value > 0) // Ne garder que les statuts avec au moins un ticket
      .map(([name, value]) => ({
        name: name.charAt(0) + name.slice(1).toLowerCase(), // Mettre en forme le nom
        value,
        color: statusColors[name] || '#9CA3AF' // Couleur par défaut gris
      }));
    
    return data;
  }, [ticketStats]);

  // Effet pour suivre les mises à jour de ticketData
  // Effet pour suivre les mises à jour de ticketData
  useEffect(() => {
    // Suivi des mises à jour de ticketData
  }, [ticketData]);

  // Pourcentage total pour la légende
  const totalTickets = Object.values(ticketStats).reduce((a, b) => a + b, 0)

  // Derniers tickets
  const recentTickets = [...tickets]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)

  // État pour stocker les données des SMS
  const [smsData, setSmsData] = useState<Array<{date: string, sent: number, pending: number}>>([])
  const [loadingSms, setLoadingSms] = useState(true)

  // Fonction pour formater la date au format YYYY-MM-DD
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  // Fonction pour obtenir le nom du jour en français
  const getDayName = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { weekday: 'short' })
  }

  // Fonction pour formater la date en temps relatif (ex: "il y a 2 min")
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return 'à l\'instant'
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return `il y a ${diffInMinutes} min`
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return `il y a ${diffInHours} h`
    }

    const diffInDays = Math.floor(diffInHours / 24)
    return `il y a ${diffInDays} j`
  }

  // État pour stocker le dernier ticket
  const [latestTicket, setLatestTicket] = useState<{
    id: string
    emailClient: string
    titre: string
    createdAt: string
  } | null>(null)
  const [loadingTicket, setLoadingTicket] = useState(true)

  // État pour stocker la dernière commande en attente
  const [latestCreditRequest, setLatestCreditRequest] = useState<{
    id: string
    requestCode: string
    clientId: string
    quantity: number
    status: string
    makerEmail: string
    createdAt: string
  } | null>(null)
  const [loadingCreditRequest, setLoadingCreditRequest] = useState(true)

  // État pour stocker les clients les plus actifs (SMS en attente)
  const [topActiveClients, setTopActiveClients] = useState<Array<{
    clientId: string
    emetteur: string
    messageCount: number
    lastActivity: string
  }>>([])
  const [loadingTopActiveClients, setLoadingTopActiveClients] = useState(true)

  // Charger les SMS récents
  useEffect(() => {
    fetchRecentSms()
  }, [fetchRecentSms])

  // Récupérer le dernier ticket
  useEffect(() => {
    const fetchLatestTicket = async () => {
      try {
        const token = getToken()
        if (!token) return

        const response = await fetch(`${API_BASE_URL}/api/V1/tickets`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })

        if (response.ok) {
          const tickets = await response.json()
          if (tickets && tickets.length > 0) {
            // Trier par date de création et prendre le plus récent
            const sortedTickets = [...tickets].sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
            setLatestTicket(sortedTickets[0])
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du dernier ticket:', error)
      } finally {
        setLoadingTicket(false)
      }
    }

    fetchLatestTicket()

    // Récupérer les clients les plus actifs
    const fetchActiveClients = async () => {
      try {
        const token = getToken()
        if (!token) return

        setLoadingTopActiveClients(true)

        const response = await fetch('https://api-smsgateway.solutech-one.com/api/V1/sms/pending', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })

        if (response.ok) {
          const smsList = await response.json()

          // Compter les SMS par client
          const clientActivity: Record<string, {
            clientId: string
            emetteur: string
            count: number
            lastActivity: string
          }> = {}

          smsList.forEach((sms: any) => {
            if (!clientActivity[sms.clientId]) {
              clientActivity[sms.clientId] = {
                clientId: sms.clientId,
                emetteur: sms.emetteur || 'Inconnu',
                count: 0,
                lastActivity: sms.updatedAt || sms.createdAt || new Date().toISOString()
              }
            }
            clientActivity[sms.clientId].count++

            // Mettre à jour la dernière activité si plus récente
            const smsDate = sms.updatedAt || sms.createdAt
            if (smsDate && smsDate > clientActivity[sms.clientId].lastActivity) {
              clientActivity[sms.clientId].lastActivity = smsDate
            }
          })

          // Trier par nombre de SMS (décroissant) et prendre les 5 premiers
          const sortedClients = Object.values(clientActivity)
              .sort((a, b) => b.count - a.count)
              .slice(0, 5)
              .map(client => ({
                clientId: client.clientId,
                emetteur: client.emetteur,
                messageCount: client.count,
                lastActivity: client.lastActivity
              }))

          setTopActiveClients(sortedClients)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des clients actifs:', error)
      } finally {
        setLoadingTopActiveClients(false)
      }
    }

    fetchActiveClients()

    // Récupérer la dernière commande de crédit
    const fetchLatestCreditRequest = async () => {
      try {
        const token = getToken()
        if (!token) return

        const response = await fetch(`${API_BASE_URL}/api/V1/credits?sort=createdAt,desc&size=1`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.content && data.content.length > 0) {
            setLatestCreditRequest(data.content[0])
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de la dernière commande:', error)
      } finally {
        setLoadingCreditRequest(false)
      }
    }

    fetchLatestCreditRequest()
    fetchActiveClients()
  }, [])

  // Récupérer les données des SMS
  useEffect(() => {
    const fetchSmsData = async () => {
      try {
        setLoadingSms(true)
        const token = getToken()

        if (!token) {
          console.error('Aucun token d\'authentification trouvé')
          setLoadingSms(false)
          return
        }

        // Récupérer les SMS envoyés
        const sentResponse = await fetch(
            'https://api-smsgateway.solutech-one.com/api/V1/sms/envoyes',
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              credentials: 'include',
              mode: 'cors'
            }
        )

        // Récupérer les SMS en attente
        const pendingResponse = await fetch(
            'https://api-smsgateway.solutech-one.com/api/V1/sms/pending',
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              credentials: 'include',
              mode: 'cors'
            }
        )

        if (sentResponse.ok && pendingResponse.ok) {
          const sentData = await sentResponse.json()
          const pendingData = await pendingResponse.json()

  
          // Vérifier et formater les données
          const formatSmsDate = (dateStr: string | null | undefined): string => {
            if (!dateStr) return formatDate(new Date());

            try {
              const date = new Date(dateStr);
              if (isNaN(date.getTime())) {
                console.warn('Date invalide:', dateStr);
                return formatDate(new Date());
              }
              return formatDate(date);
            } catch (e) {
              console.error('Erreur lors du formatage de la date:', dateStr, e);
              return formatDate(new Date());
            }
          };

          // Créer un objet pour suivre les compteurs par date et statut
          const dateCounts: Record<string, { sent: number; pending: number }> = {};

          // Fonction pour traiter les SMS (envoyés ou en attente)
          const processSmsList = (smsList: any[], isPending: boolean) => {
            (smsList || []).forEach((sms: any) => {
              // Pour les SMS en attente, utiliser updatedAt comme date de référence
              const date = formatSmsDate(isPending ? sms.updatedAt : (sms.createdAt || sms.updatedAt));

              if (!dateCounts[date]) {
                dateCounts[date] = { sent: 0, pending: 0 };
              }

              if (isPending) {
                dateCounts[date].pending++;
              } else {
                dateCounts[date].sent++;
              }
            });
          };

          // Traiter les SMS envoyés (si disponibles)
          if (Array.isArray(sentData)) {
            processSmsList(sentData, false);
          } else if (sentData && Array.isArray(sentData.content)) {
            processSmsList(sentData.content, false);
          }

          // Traiter les SMS en attente
          processSmsList(Array.isArray(pendingData) ? pendingData : [], true);

          // Convertir en tableau pour le graphique et trier par date
          const formattedData = Object.entries(dateCounts)
              .map(([date, counts]) => ({
                date,
                sent: counts.sent,
                pending: counts.pending
              }))
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


          // Mettre à jour les compteurs totaux
          const totalSent = formattedData.reduce((sum, item) => sum + item.sent, 0);
          const totalPending = Array.isArray(pendingData) ? pendingData.length : 0;

          setSentSmsCount(totalSent);
          setPendingSmsCount(totalPending);
          setSmsData(formattedData);
        } else {
          console.error('Erreur lors de la récupération des données:', {
            sentStatus: sentResponse.status,
            pendingStatus: pendingResponse.status
          })
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des SMS:', error)
      } finally {
        setLoadingSms(false)
      }
    }

    fetchSmsData()
  }, [])

  // Préparer les données pour le graphique
  const getActivityData = useCallback(() => {
    // Créer un tableau pour les 7 derniers jours
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i)) // 6-i pour avoir les 7 derniers jours (aujourd'hui inclus)
      return {
        date: formatDate(date),
        dayName: getDayName(date).charAt(0).toUpperCase() +
            getDayName(date).slice(1, 3) // Format: 'Lun', 'Mar', etc.
      }
    })

    // Créer un objet pour stocker les compteurs par date
    const dateCounts: Record<string, {sent: number, pending: number}> = {};

    // Initialiser toutes les dates avec des compteurs à 0
    last7Days.forEach(day => {
      dateCounts[day.date] = { sent: 0, pending: 0 };
    });

    // Mettre à jour les compteurs avec les données existantes
    smsData.forEach(sms => {
      if (dateCounts[sms.date]) {
        dateCounts[sms.date] = {
          sent: sms.sent || 0,
          pending: sms.pending || 0
        };
      }
    });

    // Convertir en tableau pour le graphique
    const dailyCounts = last7Days.map(day => ({
      name: day.dayName,
      date: day.date,
      sent: dateCounts[day.date]?.sent || 0,
      pending: dateCounts[day.date]?.pending || 0
    }));


    return dailyCounts;
  }, [smsData])

  const activityData = getActivityData()

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
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={loading}
            className="h-9 w-9"
            title="Rafraîchir les données"
          >
            <RotateCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Grille des cartes de métriques */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <MetricsCard
              title="Tickets ouverts"
              value={ticketsLoading ? "-" : openTicketsCount.toString()}
              description="en attente de traitement"
              icon={<Ticket className="h-5 w-5 text-primary" />}
              tooltip={`${openTicketsCount} tickets ouverts nécessitant une attention`}
          />
          <MetricsCard
              title="SMS en attente"
              value={loadingSms ? "-" : pendingSmsCount.toString()}
              description="dans la file d'attente"
              icon={<RefreshCw className="h-5 w-5 text-primary" />}
              tooltip={`${pendingSmsCount} SMS en attente d'envoi`}
          />
          <MetricsCard
              title="SMS envoyés"
              value={loadingSms ? "-" : sentSmsCount.toLocaleString()}
              description="ce mois-ci"
              icon={<MessageSquare className="h-5 w-5 text-primary" />}
              tooltip={`${sentSmsCount} SMS envoyés ce mois-ci`}
          />
          <MetricsCard
              title="Clients actifs"
              value={clientsLoading ? "-" : activeClients.toString()}
              description="sur la plateforme"
              icon={<UserCheck className="h-5 w-5 text-primary" />}
              tooltip="Nombre de clients actuellement actifs"
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
          </div>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-full lg:col-span-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-muted-foreground" />
                    Activité récente
                  </CardTitle>
                  <CardDescription>Évolution des SMS envoyés et en attente sur 7 jours</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingSms ? (
                      <div className="h-[300px] flex items-center justify-center">
                        <p>Chargement des données SMS...</p>
                      </div>
                  ) : (
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart 
                            data={activityData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02}/>
                              </linearGradient>
                              <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0.02}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                className="text-xs"
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                                className="text-xs"
                            />
                            <RechartsTooltip 
                              contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                borderColor: 'hsl(var(--border))',
                                borderRadius: 'var(--radius)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              }}
                              formatter={(value: number, name: string) => [
                                <span key="value" className="text-sm text-muted-foreground">
                                  {value} {name}
                                </span>,
                                ''
                              ]}
                              labelFormatter={(label) => `Jour: ${label}`}
                            />
                            <Legend
                                layout="horizontal"
                                verticalAlign="bottom"
                                align="center"
                                formatter={(value) => (
                                  <span className="text-xs text-muted-foreground">
                                    {value}
                                  </span>
                                )}
                            />
                            <RechartsArea
                                type="monotone"
                                dataKey="sent"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorSent)"
                                name="SMS Envoyés"
                                activeDot={{ r: 6, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                                yAxisId={0}
                                className="fill-primary/10"
                            />
                            <RechartsArea
                                type="monotone"
                                dataKey="pending"
                                stroke="hsl(var(--warning))"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorPending)"
                                name="SMS En attente"
                                activeDot={{ r: 6, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                                yAxisId={0}
                                className="fill-warning/10"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                  )}
                </CardContent>
              </Card>

              {/* Section Répartition des tickets */}
              <Card className="w-full md:col-span-3">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5 text-muted-foreground" />
                    Répartition des tickets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {ticketData && ticketData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart width={400} height={300}>
                          <RechartsPie
                            data={ticketData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            innerRadius={60}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                            fill="#8884d8"
                            style={{
                              fontSize: '12px',
                              fontWeight: '500',
                            }}
                          >
                            {ticketData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={statusColors[entry.name.toUpperCase()] || COLORS[index % COLORS.length]} 
                                stroke="#fff"
                                strokeWidth={1}
                              />
                            ))}
                          </RechartsPie>
                          <Legend 
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                            iconType="circle"
                            wrapperStyle={{
                              paddingTop: '20px',
                              fontSize: '12px',
                            }}
                          />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--background))',
                              borderColor: 'hsl(var(--border))',
                              borderRadius: 'var(--radius)'
                            }}
                            formatter={(value, name) => [
                              <span key="value" className="text-sm text-muted-foreground">
                                {value}
                              </span>,
                              name
                            ]}
                            labelFormatter={(label) => `Statut: ${label}`}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-muted-foreground">Aucune donnée disponible</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analyse annuelle des SMS</CardTitle>
                <CardDescription>Statistiques annuelles des messages envoyés</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {smsStats.yearlyData && smsStats.yearlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={smsStats.yearlyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                        <XAxis
                            dataKey="year"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            className="text-xs"
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                            className="text-xs"
                        />
                        <RechartsTooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Bar
                            dataKey="count"
                            radius={[4, 4, 0, 0]}
                            className="fill-primary"
                            yAxisId={0}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-muted-foreground">Chargement des données annuelles...</p>
                    </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Clients les plus actifs</CardTitle>
                <CardDescription>Top 5 des clients avec le plus de SMS en attente</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTopActiveClients ? (
                    <div className="flex items-center justify-center h-[200px]">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : topActiveClients.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-sm font-medium text-muted-foreground mb-2">
                        <div>Client</div>
                        <div className="text-right">Messages</div>
                        <div className="text-right">Dernière activité</div>
                      </div>
                      {topActiveClients.map((client) => (
                          <div key={client.clientId} className="grid grid-cols-3 gap-4 items-center">
                            <div className="font-medium">
                              <div className="text-sm">{client.emetteur}</div>
                              <div className="text-xs text-muted-foreground">ID: {client.clientId}</div>
                            </div>
                            <div className="text-right">
                        <span className="inline-flex items-center justify-center h-6 px-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                          {client.messageCount}
                        </span>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              {formatRelativeTime(client.lastActivity)}
                            </div>
                          </div>
                      ))}
                    </div>
                ) : (
                    <div className="h-[200px] flex items-center justify-center">
                      <p className="text-muted-foreground">Aucune activité client récente</p>
                    </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="w-full lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                Activité SMS récente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Émetteur
                      </th>
                      <th scope="col" className="px-2 py-2 sm:px-3 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Statut
                      </th>
                      <th scope="col" className="px-2 py-2 sm:px-3 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Type
                      </th>
                      <th scope="col" className="px-2 py-2 sm:px-3 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Date
                      </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {recentSmsLoading ? (
                        // Afficher un indicateur de chargement
                        <tr>
                          <td colSpan={4} className="px-3 py-6 sm:px-6 text-center text-sm text-gray-500">
                            <div className="flex justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                            <p className="mt-2">Chargement des SMS récents...</p>
                          </td>
                        </tr>
                    ) : recentSms.length > 0 ? (
                        // Afficher les vrais SMS
                        recentSms.map((sms) => {
                          const statusText = {
                            'ENVOYE': 'Envoyé',
                            'PENDING': 'En attente',
                            'DELIVERED': 'Livré',
                            'FAILED': 'Échec'
                          }[sms.statut] || sms.statut;

                          const statusColor = {
                            'ENVOYE': 'bg-blue-100 text-blue-800',
                            'PENDING': 'bg-yellow-100 text-yellow-800',
                            'DELIVERED': 'bg-green-100 text-green-800',
                            'FAILED': 'bg-red-100 text-red-800'
                          }[sms.statut] || 'bg-gray-100 text-gray-800';


                          // Déterminer le libellé du type
                          const typeLabel = {
                            'UNIDES': 'SMS Unique',
                            'MULDESP': 'SMS Programmés'
                          }[sms.type] || sms.type;

                          // Couleur pour le type
                          const typeColor = {
                            'UNIDES': 'bg-purple-100 text-purple-800',
                            'MULDESP': 'bg-indigo-100 text-indigo-800'
                          }[sms.type] || 'bg-gray-100 text-gray-800';

                          return (
                              <tr key={sms.ref} className="hover:bg-gray-50">
                                <td className="px-3 py-3 sm:px-4 sm:py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{sms.emetteur}</div>
                                  {sms.type === 'MULDESP' && (
                                      <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                                        {sms.dateDebutEnvoi && (
                                            <div className="whitespace-nowrap">Déb: {format(new Date(sms.dateDebutEnvoi), 'dd/MM HH:mm', { locale: fr })}</div>
                                        )}
                                        {sms.dateFinEnvoi && (
                                            <div className="whitespace-nowrap">Fin: {format(new Date(sms.dateFinEnvoi), 'dd/MM HH:mm', { locale: fr })}</div>
                                        )}
                                      </div>
                                  )}
                                </td>
                                <td className="px-2 py-3 sm:px-3 sm:py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${statusColor} whitespace-nowrap`}>
                                {statusText}
                              </span>
                                </td>
                                <td className="px-2 py-3 sm:px-3 sm:py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${typeColor} whitespace-nowrap`}>
                                {typeLabel}
                              </span>
                                </td>
                                <td className="px-2 py-3 sm:px-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                  {format(new Date(sms.updatedAt), 'dd/MM HH:mm', { locale: fr })}
                                </td>
                              </tr>
                          );
                        })
                    ) : (
                        // Aucun SMS à afficher
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                            <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
                            <p className="mt-2">Aucun SMS récent</p>
                          </td>
                        </tr>
                    )}
                    </tbody>
                  </table>
                </div>

              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Statistiques SMS</span>
                  <div className={`flex items-center text-sm ${smsStats.trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    <span>{smsStats.trend >= 0 ? '+' : ''}{smsStats.trend}%</span>
                    {smsStats.trend >= 0 ? (
                        <ArrowUpRight className="ml-1 h-4 w-4" />
                    ) : (
                        <ArrowDownRight className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </CardTitle>
                <div className="space-y-2">
                  <Progress value={smsStats.progress} className="h-2 [&>div]:bg-blue-600" />
                  <p className="text-xs text-muted-foreground">
                    {smsStats.trend >= 0 ? 'Hausse' : 'Baisse'} de {Math.abs(smsStats.trend)}% par rapport au mois dernier
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">SMS envoyés</span>
                      <span className="text-sm font-semibold">{smsStats.current} ce mois-ci</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Mois dernier: {smsStats.previous}</span>
                      <span>Évolution: {smsStats.trend >= 0 ? '+' : ''}{smsStats.trend}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  Activité récente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {billingLoading ? (
                      <div className="flex items-center justify-center py-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      </div>
                  ) : billingData.length > 0 ? (
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">Période de facturation</span>
                            <span className="text-muted-foreground"> {billingData[0].mois}/{billingData[0].exercice.annee}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Du {format(new Date(billingData[0].dateDebutConsommation), 'd MMMM yyyy', { locale: fr })}
                            {' au '}
                            {format(new Date(billingData[0].dateFinConsommation), 'd MMMM yyyy', { locale: fr })}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Date de génération: {format(new Date(billingData[0].dateGenerationFacture), 'd MMMM yyyy', { locale: fr })}
                          </p>
                        </div>
                      </div>
                  ) : null}

                  {loadingTicket ? (
                      <div className="flex items-center justify-center py-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      </div>
                  ) : latestTicket ? (
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">Nouveau ticket créé</span>
                            <span className="text-muted-foreground"> par {latestTicket.emailClient}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatRelativeTime(latestTicket.createdAt)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {latestTicket.titre}
                          </p>
                        </div>
                      </div>
                  ) : (
                      <p className="text-sm text-muted-foreground">Aucun ticket récent</p>
                  )}

                  {loadingCreditRequest ? (
                      <div className="flex items-center justify-center py-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      </div>
                  ) : latestCreditRequest ? (
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className="h-2 w-2 rounded-full bg-amber-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">
                        <span className="font-medium">
                          {latestCreditRequest.status === 'PENDING' ? 'Commande en attente' : 'Dernière commande'}
                        </span>
                            <span className="text-muted-foreground"> par {latestCreditRequest.makerEmail}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatRelativeTime(latestCreditRequest.createdAt)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
                          {latestCreditRequest.quantity} crédits
                        </span>
                            {latestCreditRequest.status === 'PENDING' && (
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            En attente
                          </span>
                            )}
                          </div>
                        </div>
                      </div>
                  ) : (
                      <p className="text-sm text-muted-foreground">Aucune commande récente</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  )
}