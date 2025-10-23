'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Ticket, TicketStatus } from './types'
import { fetchTickets, updateTicket } from '@/lib/api/tickets'
import * as dateFns from 'date-fns'
import { fr } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, Send, ChevronUp, User, Calendar, Building, Filter, List, Eye } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/lib/auth'
import { canUpdateTickets } from '@/lib/permissions'

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
    const { user } = useAuth()
    const canPerformActions = canUpdateTickets(user)
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
    
    // Vérifie si l'utilisateur est l'auteur du ticket (kept for future use)
    const _isTicketAuthor = (ticket: Ticket) => {
        // some payloads use `emailClient`, others embed client info
        const ticketEmail = ticket.emailClient || ticket.client?.email
        return user?.email && ticketEmail ? user.email === ticketEmail : false
    }

    const loadTickets = async () => {
        try {
            setLoading(true)
            const data = await fetchTickets()
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
            return [];
        }

    const threeMonthsAgo = dateFns.subMonths(new Date(), 3);

        return tickets.filter(ticket => {
            if (!ticket) return false;
            
            // Toujours afficher les tickets ouverts, peu importe la date
            if (ticket.statut === 'OUVERT') {
                return true;
            }

            try {
                const ticketDate = new Date(ticket.createdAt);
                return dateFns.isAfter(ticketDate, threeMonthsAgo);
            } catch (e) {
                console.error('Erreur de date pour le ticket:', ticket.id, e)
                return false
            }
        })
    }, [tickets])

    // Filtrer par statut
    const ticketsByStatus = useMemo(() => {
        if (statusFilter === 'TOUS') {
            return filteredTickets;
        }
        
        return filteredTickets.filter(ticket => {
            if (!ticket) return false;
            return ticket.statut === statusFilter;
        })
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

    const _handleReply = (ticketId: string) => {
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

    const formatFn = dateFns.format as unknown as (d: Date | number, f?: string, o?: { locale?: unknown }) => string;

    const formatDate = (dateString: string) => {
        return formatFn(new Date(dateString), 'dd MMMM yyyy à HH:mm', { locale: fr })
    }

    const formatShortDate = (dateString: string) => {
        return formatFn(new Date(dateString), 'dd/MM/yy HH:mm', { locale: fr })
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

    // Vérifier si les tickets sont bien formés
    if (tickets.length > 0 && !tickets[0].id) {
        console.error('Erreur: le premier ticket ne contient pas d\'ID valide');
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
        <div className="flex flex-col h-full w-full max-w-full overflow-hidden px-0 sm:px-6">
            <div className="space-y-4 w-full h-full flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-2">
                    <div className="flex-1">
                        <div className="flex items-center justify-between gap-4">
                            <h2 className="text-2xl font-bold text-gray-900">Support client</h2>
                            <div className="sm:hidden">
                                <span className="inline-flex items-center justify-center h-6 px-3 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                                    {ticketsByStatus.length} ticket{ticketsByStatus.length > 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                        <p className="text-gray-600 mt-1">Gérez les demandes et questions de vos clients</p>
                    </div>
                    <div className="hidden sm:flex items-center">
                        <span className="inline-flex items-center justify-center h-6 px-3 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                            {ticketsByStatus.length} ticket{ticketsByStatus.length > 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

            {/* Filtres et contrôles */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Filter className="h-4 w-4 text-gray-600 flex-shrink-0" />
                    <span className="text-sm font-medium whitespace-nowrap">Filtrer par :</span>
                    <div className="w-full sm:w-auto">
                        <Select
                            value={statusFilter}
                            onValueChange={(value) => {
                                setStatusFilter(value as TicketStatus)
                                setCurrentPage(1)
                            }}
                        >
                            <SelectTrigger className="w-full sm:w-[180px]">
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
                </div>

                <div className="text-xs text-gray-500 text-center w-full sm:w-auto">
                        {statusFilter === 'OUVERT'
                            ? 'Affichage de tous les tickets ouverts'
                            : 'Affichage des tickets des 3 derniers mois'}
                    </div>
                </div>

                {ticketsByStatus.length === 0 ? (
                    <Card className="text-center py-12 border-dashed">
                        <CardContent>
                            <List className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {statusFilter === 'TOUS' ? 'Aucun ticket' : `Aucun ticket ${statusFilter.toLowerCase()}`}
                            </h3>
                            <p className="text-gray-500">
                                {statusFilter === 'OUVERT' 
                                    ? 'Aucun ticket ouvert pour le moment' 
                                    : 'Aucun ticket correspondant à vos critères'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Liste des tickets */}
                        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
                        {currentItems.map((ticket) => {
                            const isExpanded = expandedTickets.has(ticket.id);
                            const hasResponse = !!ticket.reponseAdmin;

                            return (
                                <Card key={ticket.id} className="overflow-hidden border hover:shadow-md transition-shadow w-full">
                                    <CardContent className="p-0">
                                        {/* Header du ticket */}
                                        <div className="p-3 sm:p-4 border-b bg-gray-50">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <Badge className={`${getStatusBadgeVariant(ticket.statut)} border font-medium`}>
                                                                {getStatusIcon(ticket.statut)} {ticket.statut === 'EN_COURS' ? 'En cours' : ticket.statut}
                                                            </Badge>
                                                            <h3 className="font-semibold text-gray-900 truncate">
                                                                {ticket.titre}
                                                            </h3>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => toggleTicketExpansion(ticket.id)}
                                                            className="text-gray-600 hover:bg-gray-100"
                                                        >
                                                            {isExpanded ? (
                                                                <>
                                                                    <ChevronUp className="h-4 w-4 mr-1" />
                                                                    Réduire
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Eye className="h-4 w-4 mr-1" />
                                                                    Détails
                                                                </>
                                                            )}
                                                        </Button>
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
                                                    {isAdmin ? (
                                                        <select
                                                            value={ticket.statut}
                                                            onChange={(e) => handleStatusChange(ticket.id, e.target.value as TicketStatus)}
                                                            className="text-sm border rounded px-2 py-1 bg-white"
                                                        >
                                                            <option value="OUVERT">Ouvert</option>
                                                            <option value="EN_COURS">En cours</option>
                                                            <option value="FERME">Fermé</option>
                                                        </select>
                                                    ) : (
                                                        <Badge className={`${getStatusBadgeVariant(ticket.statut)}`}>
                                                            {getStatusIcon(ticket.statut)} {ticket.statut === 'EN_COURS' ? 'En cours' : ticket.statut}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="p-3 sm:p-4 flex flex-col gap-4">
                                                {/* Description du ticket */}
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 bg-gray-500 rounded-full flex-shrink-0"></div>
                                                        <h4 className="font-medium text-gray-900">Description</h4>
                                                    </div>
                                                    <p className="text-gray-800 pl-4 whitespace-pre-line">{ticket.description}</p>
                                                </div>

                                                {/* Réponse existante */}
                                                {hasResponse ? (
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                                            <h4 className="font-medium text-blue-900">Réponse du support</h4>
                                                        </div>
                                                        <p className="text-blue-800 pl-4 whitespace-pre-line">{ticket.reponseAdmin}</p>
                                                        <div className="text-xs text-blue-600 mt-1 pl-4">
                                                            Dernière mise à jour : {formatDate(ticket.updatedAt)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                                                            <h4 className="font-medium text-yellow-900">Statut</h4>
                                                        </div>
                                                        <p className="text-yellow-800 pl-4">
                                                            En attente de traitement par notre équipe
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Zone de réponse */}
                                                {ticket.statut !== 'FERME' && canPerformActions && (
                                                    <div className="border-t pt-4">
                                                        <div className="flex flex-col gap-2">
                                                            <Textarea
                                                                value={replyText}
                                                                onChange={(e) => setReplyText(e.target.value)}
                                                                placeholder="Tapez votre réponse ici..."
                                                                className="min-h-[100px]"
                                                            />
                                                            <div className="flex justify-end">
                                                                <Button
                                                                    onClick={() => handleSendReply(ticket.id)}
                                                                    disabled={!replyText.trim() || isSubmitting}
                                                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                                                >
                                                                    {isSubmitting ? (
                                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                    ) : (
                                                                        <Send className="h-4 w-4 mr-2" />
                                                                    )}
                                                                    Envoyer la réponse
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-white border-t">
                        <div className="text-sm text-gray-600">
                            Page {currentPage} sur {totalPages} • {ticketsByStatus.length} ticket{ticketsByStatus.length > 1 ? 's' : ''}
                        </div>
                        <div className="flex gap-2">
                            {canPerformActions ? (
                                <>
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
                                </>
                            ) : (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="text-gray-600 border-gray-200 hover:bg-gray-50"
                                >
                                    Suivant
                                </Button>
                            )}
                            </div>
                        </div>
                    )}
                    </div>
                )}
            </div>
        </div>
    )
}