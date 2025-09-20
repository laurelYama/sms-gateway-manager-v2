'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Ticket, TicketStatus } from './types'
import { fetchTickets, updateTicket } from '@/lib/api/tickets'
import { format, startOfMonth, isAfter, isBefore, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, MessageSquare, Send, ChevronDown, ChevronUp, User, Calendar, Building, Filter, List } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function TicketList() {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [replyingTo, setReplyingTo] = useState<string | null>(null)
    const [replyText, setReplyText] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set())
    const [currentPage, setCurrentPage] = useState(1)
    const [statusFilter, setStatusFilter] = useState<TicketStatus>('OUVERT')
    const itemsPerPage = 10

    const loadTickets = async () => {
        try {
            setLoading(true)
            const data = await fetchTickets()
            console.log('Tickets chargés:', data) // Debug
            setTickets(data)
        } catch (err) {
            setError('Erreur lors du chargement des tickets')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // Filtrer les tickets selon les règles métier
    const filteredTickets = useMemo(() => {
        if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
            console.log('Aucun ticket à filtrer')
            return []
        }

        console.log('Filtrage des tickets:', tickets.length)
        const threeMonthsAgo = subMonths(new Date(), 3)

        return tickets.filter(ticket => {
            if (!ticket) return false
            
            // Pour le débogage
            console.log('Ticket en cours de traitement:', {
                id: ticket.id,
                statut: ticket.statut,
                createdAt: ticket.createdAt
            })
            
            // Toujours afficher les tickets ouverts, peu importe la date
            if (ticket.statut === 'OUVERT') {
                console.log('Ticket ouvert conservé:', ticket.id, ticket.statut)
                return true
            }

            // Pour les autres statuts, n'afficher que ceux des 3 derniers mois
            try {
                const ticketDate = new Date(ticket.createdAt)
                const isRecent = isAfter(ticketDate, threeMonthsAgo)
                console.log('Ticket récent:', ticket.id, isRecent, ticketDate)
                return isRecent
            } catch (e) {
                console.error('Erreur de date pour le ticket:', ticket.id, e)
                return false
            }
        })
    }, [tickets])

    // Filtrer par statut
    const ticketsByStatus = useMemo(() => {
        console.log('=== FILTRAGE PAR STATUT ===')
        console.log('Filtre actuel:', statusFilter)
        console.log('Tickets à filtrer:', filteredTickets)
        
        if (statusFilter === 'TOUS') {
            console.log('Retour de tous les tickets:', filteredTickets)
            return filteredTickets
        }
        
        const filtered = filteredTickets.filter(ticket => {
            if (!ticket) return false
            const matches = ticket.statut === statusFilter
            console.log(`Ticket ${ticket.id} - Statut: ${ticket.statut} - Correspond: ${matches}`)
            return matches
        })
        
        console.log('Tickets après filtrage:', filtered)
        return filtered
    }, [filteredTickets, statusFilter])

    // Pagination
    const totalPages = Math.ceil(ticketsByStatus.length / itemsPerPage)
    const currentItems = ticketsByStatus.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const toggleTicketExpansion = (ticketId: string) => {
        const newExpanded = new Set(expandedTickets)
        if (newExpanded.has(ticketId)) {
            newExpanded.delete(ticketId)
        } else {
            newExpanded.add(ticketId)
        }
        setExpandedTickets(newExpanded)
    }

    const handleReply = (ticketId: string) => {
        setReplyingTo(replyingTo === ticketId ? null : ticketId)
        if (replyingTo !== ticketId) {
            setReplyText('')
        }
    }

    const handleSendReply = async (ticketId: string) => {
        if (!replyText.trim()) {
            toast.error('Veuillez saisir un message')
            return
        }

        try {
            setIsSubmitting(true)
            const updatedTicket = await updateTicket(ticketId, {
                statut: 'FERME',
                reponseAdmin: replyText
            })

            setTickets(tickets.map(t =>
                t.id === updatedTicket.id ? updatedTicket : t
            ))

            setReplyingTo(null)
            setReplyText('')
            toast.success('Réponse envoyée et ticket fermé')
        } catch (err) {
            console.error('Erreur lors de l\'envoi de la réponse:', err)
            toast.error('Erreur lors de l\'envoi de la réponse')
        } finally {
            setIsSubmitting(false)
        }
    }

    const getStatusBadgeVariant = (status: TicketStatus) => {
        switch (status) {
            case 'OUVERT': return 'bg-orange-100 text-orange-800 border-orange-200'
            case 'EN_COURS': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'FERME': return 'bg-green-100 text-green-800 border-green-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getStatusIcon = (status: TicketStatus) => {
        switch (status) {
            case 'OUVERT': return '🔴'
            case 'EN_COURS': return '🟡'
            case 'FERME': return '🟢'
            default: return '⚪'
        }
    }

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'dd MMMM yyyy à HH:mm', { locale: fr })
    }

    const formatShortDate = (dateString: string) => {
        return format(new Date(dateString), 'dd/MM/yy HH:mm', { locale: fr })
    }

    useEffect(() => {
        loadTickets()
    }, [])

    const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
        try {
            // L'admin ne peut pas remettre un ticket en "OUVERT"
            if (newStatus === 'OUVERT') {
                toast.error('Vous ne pouvez pas rouvrir un ticket')
                return
            }

            let reponseMessage = ''
            switch (newStatus) {
                case 'EN_COURS':
                    reponseMessage = 'Votre demande est maintenant prise en charge par notre équipe. Nous vous tiendrons informé de l\'avancement.'
                    break
                case 'FERME':
                    reponseMessage = 'Votre demande a été traitée et le ticket est maintenant fermé. Si vous avez d\'autres questions, n\'hésitez pas à nous contacter.'
                    break
                default:
                    reponseMessage = 'Statut du ticket mis à jour.'
            }

            const updatedTicket = await updateTicket(ticketId, {
                statut: newStatus,
                reponseAdmin: reponseMessage
            })

            setTickets(tickets.map(ticket =>
                ticket.id === updatedTicket.id ? updatedTicket : ticket
            ))

            toast.success(`Ticket passé en "${newStatus === 'EN_COURS' ? 'En cours' : 'Fermé'}"`)
        } catch (err) {
            setError('Erreur lors de la mise à jour du ticket')
            console.error(err)
            toast.error('Erreur lors de la mise à jour')
        }
    }

    const statusOptions = [
        { value: 'TOUS', label: 'Tous les statuts' },
        { value: 'OUVERT', label: 'Ouverts' },
        { value: 'EN_COURS', label: 'En cours' },
        { value: 'FERME', label: 'Fermés' }
    ]

    // Debug: afficher les données
    console.log('=== DÉBOGAGE TICKETS ===')
    console.log('Tickets bruts:', JSON.parse(JSON.stringify(tickets)))
    console.log('Tickets filtrés:', JSON.parse(JSON.stringify(filteredTickets)))
    console.log('Tickets par statut:', JSON.parse(JSON.stringify(ticketsByStatus)))
    console.log('Filtre actuel:', statusFilter)
    console.log('Items courants:', JSON.parse(JSON.stringify(currentItems)))
    console.log('=== FIN DÉBOGAGE ===')
    
    // Vérifier si les tickets sont bien formés
    if (tickets.length > 0) {
        console.log('Premier ticket:', {
            id: tickets[0].id,
            statut: tickets[0].statut,
            createdAt: tickets[0].createdAt,
            hasResponse: !!tickets[0].reponseAdmin
        })
    }

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Chargement des tickets...</span>
        </div>
    )

    if (error) return (
        <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
                <div className="text-red-600 text-center">
                    <p className="font-medium">{error}</p>
                    <Button
                        variant="outline"
                        className="mt-4 border-red-300 text-red-600 hover:bg-red-100"
                        onClick={loadTickets}
                    >
                        Réessayer le chargement
                    </Button>
                </div>
            </CardContent>
        </Card>
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Support client</h2>
                    <p className="text-gray-600 mt-1">Gérez les demandes et questions de vos clients</p>
                </div>
                <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {ticketsByStatus.length} ticket{ticketsByStatus.length > 1 ? 's' : ''}
                </div>
            </div>

            {/* Filtres et contrôles */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium">Filtrer par :</span>
                    </div>
                    <Select
                        value={statusFilter}
                        onValueChange={(value) => {
                            setStatusFilter(value as TicketStatus)
                            setCurrentPage(1)
                        }}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                            {statusOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="text-xs text-gray-500 text-center">
                    {statusFilter === 'OUVERT'
                        ? 'Affichage de tous les tickets ouverts'
                        : 'Affichage des tickets des 3 derniers mois'
                    }
                </div>
            </div>

            {!loading && currentItems.length === 0 ? (
                <Card className="text-center py-12 border-dashed">
                    <CardContent>
                        <List className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {statusFilter === 'TOUS' ? 'Aucun ticket' : `Aucun ticket ${statusFilter.toLowerCase()}`}
                        </h3>
                        <p className="text-gray-500">
                            {statusFilter === 'OUVERT'
                                ? 'Aucun ticket ouvert pour le moment'
                                : 'Aucun ticket correspondant à vos critères'
                            }
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Liste des tickets */}
                    <div className="space-y-3">
                        {currentItems.map((ticket) => {
                            const isExpanded = expandedTickets.has(ticket.id)
                            const hasResponse = !!ticket.reponseAdmin

                            return (
                                <Card key={ticket.id} className="overflow-hidden border hover:shadow-md transition-shadow">
                                    <CardContent className="p-0">
                                        {/* Header du ticket */}
                                        <div className="p-4 border-b bg-gray-50">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Badge
                                                            className={`${getStatusBadgeVariant(ticket.statut)} border font-medium`}
                                                        >
                                                            {getStatusIcon(ticket.statut)} {ticket.statut === 'EN_COURS' ? 'En cours' : ticket.statut}
                                                        </Badge>
                                                        <h3 className="font-semibold text-gray-900 truncate">
                                                            {ticket.titre}
                                                        </h3>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                                        <div className="flex items-center gap-1">
                                                            <User className="h-4 w-4" />
                                                            <span>{ticket.emailClient}</span>
                                                        </div>
                                                        {ticket.raisonSociale && (
                                                            <div className="flex items-center gap-1">
                                                                <Building className="h-4 w-4" />
                                                                <span>{ticket.raisonSociale}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-4 w-4" />
                                                            <span>{formatShortDate(ticket.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2 ml-4 shrink-0">
                                                    <select
                                                        value={ticket.statut}
                                                        onChange={(e) => handleStatusChange(ticket.id, e.target.value as TicketStatus)}
                                                        className="text-sm p-2 border rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="OUVERT" disabled>Ouvert</option>
                                                        <option value="EN_COURS">En cours</option>
                                                        <option value="FERME">Fermer</option>
                                                    </select>

                                                    <Button
                                                        size="sm"
                                                        variant={isExpanded ? "secondary" : "outline"}
                                                        onClick={() => toggleTicketExpansion(ticket.id)}
                                                        className="gap-2"
                                                    >
                                                        {isExpanded ? (
                                                            <>
                                                                <ChevronUp className="h-4 w-4" />
                                                                Réduire
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ChevronDown className="h-4 w-4" />
                                                                Détails
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Contenu détaillé */}
                                        {isExpanded && (
                                            <div className="p-4 space-y-4">
                                                {/* Description */}
                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                                                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border">
                                                        {ticket.description}
                                                    </p>
                                                </div>

                                                {/* Réponse existante */}
                                                {hasResponse && (
                                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                            <h4 className="font-medium text-blue-900">Notre réponse</h4>
                                                        </div>
                                                        <p className="text-blue-800">{ticket.reponseAdmin}</p>
                                                        <div className="text-xs text-blue-600 mt-2">
                                                            Répondu le {formatDate(ticket.updatedAt)}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Zone de réponse */}
                                                {ticket.statut !== 'FERME' && (
                                                    <div className="border-t pt-4">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <MessageSquare className="h-4 w-4 text-gray-600" />
                                                            <h4 className="font-medium text-gray-900">Répondre au client</h4>
                                                        </div>
                                                        <Textarea
                                                            placeholder="Écrivez votre réponse au client..."
                                                            value={replyText}
                                                            onChange={(e) => setReplyText(e.target.value)}
                                                            className="min-h-[120px] resize-vertical"
                                                        />
                                                        <div className="flex justify-end gap-2 mt-3">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setReplyingTo(null)
                                                                    setReplyText('')
                                                                }}
                                                            >
                                                                Annuler
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleSendReply(ticket.id)}
                                                                disabled={isSubmitting || !replyText.trim()}
                                                                className="gap-2"
                                                            >
                                                                {isSubmitting ? (
                                                                    <>
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                        Envoi...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Send className="h-4 w-4" />
                                                                        Envoyer et fermer le ticket
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-600">
                                Page {currentPage} sur {totalPages} • {ticketsByStatus.length} ticket{ticketsByStatus.length > 1 ? 's' : ''}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    Précédent
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    Suivant
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}