'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar, Search, Filter, ArrowLeft, User, Globe, Monitor, FileText, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, MoreHorizontal, X, Eye } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { auditLogService, type AuditLog } from '@/services/auditLogService';
import { Badge } from '@/components/ui/badge';

type LogViewType = 'all' | 'byDate' | 'byUser';

// Fonction pour formater la date relative (ex: "il y a 2 heures")
const formatRelativeTime = (dateString: string) => {
  return formatDistanceToNow(new Date(dateString), { 
    addSuffix: true,
    locale: fr 
  });
};

// Fonction pour formater la date en français
const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss', { locale: fr });
};

// Fonction pour extraire le verbe HTTP d'une action
const getActionVerb = (action: string): string => {
  const verb = action.split(' ')[0];
  switch(verb) {
    case 'GET': return 'Consultation';
    case 'POST': return 'Création';
    case 'PUT':
    case 'PATCH': return 'Mise à jour';
    case 'DELETE': return 'Suppression';
    case 'LOGIN': return 'Connexion';
    default: return action;
  }
};

// Fonction pour obtenir la couleur du badge en fonction de l'action
const getActionColor = (action: string): string => {
  const verb = action.split(' ')[0];
  switch(verb) {
    case 'GET': return 'bg-blue-100 text-blue-800';
    case 'POST': return 'bg-green-100 text-green-800';
    case 'PUT':
    case 'PATCH': return 'bg-yellow-100 text-yellow-800';
    case 'DELETE': return 'bg-red-100 text-red-800';
    case 'LOGIN': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function AuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logView, setLogView] = useState<LogViewType>('all');

  // Fonction pour exporter les logs en Excel
  const exportToExcel = () => {
    try {
      // Préparer les données pour l'export
      const dataToExport = logs.map(log => ({
        'Date': formatDate(log.timestamp),
        'Utilisateur': log.userEmail || 'N/A',
        'Action': log.action || 'N/A',
        'Type d\'entité': log.entityType || 'N/A',
        'ID Entité': log.entityId || 'N/A',
        'IP': log.ipAddress || 'N/A',
        'Rôle': log.role || 'N/A',
        'Détails': log.details || 'N/A',
        'User-Agent': log.userAgent || 'N/A'
      }));

      // Créer un nouveau classeur
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataToExport);

      // Ajuster la largeur des colonnes
      const wscols = [
        { wch: 20 }, // Date
        { wch: 25 }, // Utilisateur
        { wch: 15 }, // Action
        { wch: 20 }, // Type d'entité
        { wch: 15 }, // ID Entité
        { wch: 15 }, // IP
        { wch: 20 }, // Rôle
        { wch: 30 }, // Détails
        { wch: 50 }  // User-Agent
      ];
      ws['!cols'] = wscols;

      // Ajouter la feuille au classeur
      XLSX.utils.book_append_sheet(wb, ws, 'Logs Audit');

      // Générer le fichier Excel
      const date = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `logs-audit-${date}.xlsx`);

      toast.success('Export Excel réussi');
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      toast.error('Erreur lors de l\'export Excel');
    }
  };
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [totalElements, setTotalElements] = useState(0);
  const totalPages = Math.ceil(totalElements / pageSize);
  const startItem = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalElements);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  });
  const [userEmail, setUserEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      let logsData: AuditLog[] = [];
      
      // Vérifier si l'utilisateur est authentifié
      const token = getToken();
      if (!token) {
        setError('Vous devez être connecté pour accéder à cette page');
        router.push('/login');
        return;
      }
      
      if (logView === 'all') {
        logsData = await auditLogService.getAllLogs();
      } else if (logView === 'byDate' && dateRange?.from && dateRange.to) {
        logsData = await auditLogService.getLogsByDate({
          start: dateRange.from.toISOString(),
          end: dateRange.to.toISOString()
        });
      } else if (logView === 'byUser' && userEmail) {
        logsData = await auditLogService.getLogsByUser({ userEmail });
      }
      
      setLogs(logsData);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError('Erreur lors de la récupération des logs. Veuillez réessayer.');
      if (error instanceof Error && error.message === 'Non authentifié') {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [logView, dateRange, userEmail]);

  // Filtrer les logs en fonction de la recherche
  const filteredLogs = logs
    .filter(log => {
      if (!searchQuery) return true;
      const search = searchQuery.toLowerCase();
      return (
        log.userEmail?.toLowerCase().includes(search) ||
        log.action?.toLowerCase().includes(search) ||
        log.entityType?.toLowerCase().includes(search) ||
        log.entityId?.toLowerCase().includes(search) ||
        log.ipAddress?.toLowerCase().includes(search) ||
        log.userAgent?.toLowerCase().includes(search) ||
        log.role?.toLowerCase().includes(search) ||
        new Date(log.timestamp).toLocaleString('fr-FR').toLowerCase().includes(search)
      );
    });

  // Pagination côté client
  const startIndex = currentPage * pageSize;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + pageSize);
  const totalFilteredElements = filteredLogs.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Retour</span>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Journaux d'activité</h1>
          <p className="text-muted-foreground">
            Consultez les activités récentes sur la plateforme
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
              <Tabs 
                value={logView} 
                onValueChange={(value) => setLogView(value as LogViewType)}
                className="w-full sm:w-auto"
              >
                <TabsList>
                  <TabsTrigger value="all">Tous</TabsTrigger>
                  <TabsTrigger value="byDate">Par date</TabsTrigger>
                  <TabsTrigger value="byUser">Par utilisateur</TabsTrigger>
                </TabsList>
              </Tabs>

              {logView === 'byDate' && (
                <div className="grid gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant="outline"
                        className={cn(
                          "w-full sm:w-[300px] justify-start text-left font-normal",
                          !dateRange && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "PPP", { locale: fr })} -{" "}
                              {format(dateRange.to, "PPP", { locale: fr })}
                            </>
                          ) : (
                            format(dateRange.from, "PPP", { locale: fr })
                          )
                        ) : (
                          <span>Sélectionnez une plage de dates</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {logView === 'byUser' && (
                <div className="flex w-full space-x-2">
                  <Input
                    placeholder="Email de l'utilisateur"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="max-w-sm"
                  />
                  <Button 
                    onClick={fetchLogs}
                    disabled={!userEmail}
                    variant="outline"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Rechercher
                  </Button>
                </div>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans les logs..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            {error ? (
              <div className="p-8 text-center">
                <div className="bg-red-50 text-red-700 p-4 rounded-lg inline-flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : paginatedLogs.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Date/Heure</TableHead>
                    <TableHead className="w-[180px]">Utilisateur</TableHead>
                    <TableHead className="w-[120px]">Action</TableHead>
                    <TableHead className="w-[120px]">Rôle</TableHead>
                    <TableHead>Détails</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap overflow-hidden">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {format(new Date(log.timestamp), 'dd/MM/yyyy', { locale: fr })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.timestamp), 'HH:mm:ss', { locale: fr })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(log.timestamp)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="font-medium">{log.userEmail || 'Système'}</span>
                            {log.userId && <span className="text-xs text-muted-foreground">ID: {log.userId}</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <Badge className={`${getActionColor(log.action)} w-fit`}>
                            {getActionVerb(log.action)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {log.action}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {log.role?.replace(/\[|\]/g, '')}
                        </Badge>
                      </TableCell>
                      <TableCell className="overflow-hidden">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate text-sm max-w-[180px] block">
                            {log.description || 'Aucun détail'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Ouvrir le menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-64">
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedLog(log);
                                setIsDetailDialogOpen(true);
                              }}
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              <span>Voir les détails</span>
                            </DropdownMenuItem>
                            
                            <div className="px-2 py-1.5 text-sm space-y-2">
                              <div className="flex items-start gap-2 text-muted-foreground">
                                <Globe className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-medium">Adresse IP</div>
                                  <div className="font-mono text-xs break-all">{log.ipAddress || 'N/A'}</div>
                                </div>
                              </div>
                              <div className="flex items-start gap-2 text-muted-foreground">
                                <Monitor className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-medium">Navigateur</div>
                                  <div className="text-xs break-all">{log.userAgent || 'N/A'}</div>
                                </div>
                              </div>
                              {log.details && (
                                <div className="flex items-start gap-2 text-muted-foreground">
                                  <FileText className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <div className="font-medium">Détails</div>
                                    <div className="text-xs break-all">{log.details}</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(0)}
                    disabled={currentPage === 0}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                    <span className="sr-only">Première page</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Page précédente</span>
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage + 1} sur {Math.max(1, Math.ceil(filteredLogs.length / pageSize))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredLogs.length / pageSize) - 1, p + 1))}
                    disabled={currentPage >= Math.ceil(filteredLogs.length / pageSize) - 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Page suivante</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.ceil(filteredLogs.length / pageSize) - 1)}
                    disabled={currentPage >= Math.ceil(filteredLogs.length / pageSize) - 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsRight className="h-4 w-4" />
                    <span className="sr-only">Dernière page</span>
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 text-sm"
                    onClick={exportToExcel}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Exporter
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Filter className="h-12 w-12 text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">Aucun log trouvé</h3>
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium text-muted-foreground">Aucun log trouvé</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchQuery ? 'Aucun résultat pour votre recherche.' : 'Aucun log disponible pour le moment.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Dialog de détail */}
    <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
      <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Détails du log</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                <div className="p-3 bg-muted/50 rounded-md text-sm">
                  {selectedLog.description || 'Aucun détail'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Adresse IP</h4>
                  <div className="p-3 bg-muted/50 rounded-md text-sm font-mono">
                    {selectedLog.ipAddress || 'N/A'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">User Agent</h4>
                  <div className="p-3 bg-muted/50 rounded-md text-sm">
                    {selectedLog.userAgent || 'N/A'}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Date</h4>
                  <div className="p-3 bg-muted/50 rounded-md text-sm">
                    {formatDate(selectedLog.timestamp)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Utilisateur</h4>
                  <div className="p-3 bg-muted/50 rounded-md text-sm">
                    {selectedLog.userEmail || 'Système'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
