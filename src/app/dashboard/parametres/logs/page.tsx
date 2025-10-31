'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar, Search, Filter, ArrowLeft, User, Globe, Monitor, FileText, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, MoreHorizontal, X, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { format as tzFormat, toZonedTime } from 'date-fns-tz';

// Función para formatear con la zona horaria y localización en español
const formatWithLocale = (date: Date, formatStr: string) => {
  try {
    // Convertir a la zona horaria de Guinea Ecuatorial
    const timeZone = 'Africa/Malabo';
    const zonedDate = toZonedTime(date, timeZone);
    
    // Usar format de date-fns-tz que soporta la configuración de localización
    return tzFormat(zonedDate, formatStr, { 
      timeZone,
      locale: es 
    });
  } catch (error) {
    console.error('Error al formatear la fecha:', error);
    return 'Fecha inválida';
  }
};

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

// Función para formatear el tiempo relativo (ej: "hace 2 horas")
const formatRelativeTime = (dateString: string) => {
  const diffSec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diffSec < 60) return `hace ${diffSec} segundo${diffSec !== 1 ? 's' : ''}`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin} minuto${diffMin !== 1 ? 's' : ''}`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `hace ${diffHour} hora${diffHour !== 1 ? 's' : ''}`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `hace ${diffDay} día${diffDay !== 1 ? 's' : ''}`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `hace ${diffMonth} mes${diffMonth !== 1 ? 'es' : ''}`;
  const diffYear = Math.floor(diffMonth / 12);
  return `hace ${diffYear} año${diffYear !== 1 ? 's' : ''}`;
};


// Función para formatear la fecha con manejo de errores
const formatDate = (dateString: string | Date): string => {
  try {
    if (!dateString) return 'N/A';
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      console.warn('Fecha inválida:', dateString);
      return 'Fecha inválida';
    }
    
    return formatWithLocale(date, 'dd/MM/yyyy HH:mm:ss');
  } catch (error) {
    console.error('Error al formatear la fecha:', error);
    return 'Error de fecha';
  }
};

// Función para extraer el verbo HTTP de una acción
const getActionVerb = (action: string): string => {
  const verb = action.split(' ')[0];
  switch(verb) {
    case 'GET': return 'Consulta';
    case 'POST': return 'Creación';
    case 'PUT':
    case 'PATCH': return 'Actualización';
    case 'DELETE': return 'Eliminación';
    case 'LOGIN': return 'Inicio de sesión';
    default: return action;
  }
};

// Función para obtener la color del badge en función de la acción
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
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logView, setLogView] = useState<LogViewType>('all');

  // Guard: only SUPER_ADMIN can access
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'SUPER_ADMIN') {
      toast.error('Acceso reservado para SUPER_ADMIN');
      router.push('/unauthorized');
    }
  }, [authLoading, isAuthenticated, router, user]);

  // Función para exportar los logs en Excel
  const exportToExcel = () => {
    try {
      // Preparar los datos para la exportación
      const dataToExport = logs.map(log => ({
        'Fecha': formatDate(log.timestamp),
        'Usuario': log.userEmail || 'N/A',
        'Acción': log.action || 'N/A',
        'Tipo de entidad': log.entityType || 'N/A',
        'ID Entidad': log.entityId || 'N/A',
        'IP': log.ipAddress || 'N/A',
        'Rol': log.role || 'N/A',
        'Detalles': log.details || 'N/A',
        'User-Agent': log.userAgent || 'N/A'
      }));

      // Crear un nuevo libro
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataToExport);

      // Ajustar el ancho de las columnas
      const wscols = [
        { wch: 20 }, // Fecha
        { wch: 25 }, // Usuario
        { wch: 15 }, // Acción
        { wch: 20 }, // Tipo de entidad
        { wch: 15 }, // ID Entidad
        { wch: 15 }, // IP
        { wch: 20 }, // Rol
        { wch: 30 }, // Detalles
        { wch: 50 }  // User-Agent
      ];
      ws['!cols'] = wscols;

      // Agregar la hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, 'Logs de auditoría');

      // Generar el archivo Excel
      const date = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `logs-auditoria-${date}.xlsx`);

      toast.success('Exportación a Excel exitosa');
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      toast.error('Error al exportar a Excel');
    }
  };
  
  // Estados para la paginación
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
      
      // Verificar si el usuario está autenticado
      const token = getToken();
      if (!token) {
        setError('Debes estar conectado para acceder a esta página');
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
      console.error('Error al obtener los logs:', error);
      setError('Error al obtener los logs. Por favor, inténtelo de nuevo.');
      if (error instanceof Error && error.message === 'No autenticado') {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [logView, dateRange, userEmail]);

  // Filtrar los logs según la búsqueda
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
        new Date(log.timestamp).toLocaleString('es-ES').toLowerCase().includes(search)
      );
    });

  // Paginación del lado del cliente
  const startIndex = currentPage * pageSize;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + pageSize);
  const totalFilteredElements = filteredLogs.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Registros de actividad</h1>
        <p className="text-muted-foreground">Consulta las actividades recientes en la plataforma</p>
        
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
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="byDate">Por fecha</TabsTrigger>
                  <TabsTrigger value="byUser">Por usuario</TabsTrigger>
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
                              {formatWithLocale(dateRange.from, 'PPP')} -{" "}
                              {formatWithLocale(dateRange.to, 'PPP')}
                            </>
                          ) : (
                            formatWithLocale(dateRange.from, 'PPP')
                          )
                        ) : (
                          <span>Seleccionar rango de fechas</span>
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
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {logView === 'byUser' && (
                <div className="flex w-full space-x-2">
                  <Input
                    placeholder="Correo electrónico del usuario"
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
                    Buscar
                  </Button>
                </div>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar en los logs..."
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
                    <TableHead className="w-[140px]">Fecha/Hora</TableHead>
                    <TableHead className="w-[180px]">Usuario</TableHead>
                    <TableHead className="w-[120px]">Acción</TableHead>
                    <TableHead className="w-[120px]">Rol</TableHead>
                    <TableHead>Detalles</TableHead>
                    <TableHead className="w-[100px] text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap overflow-hidden">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {formatDate(log.timestamp)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatWithLocale(new Date(log.timestamp), 'HH:mm:ss')}
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
                            <span className="font-medium">{log.userEmail || 'Sistema'}</span>
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
                            {log.description || 'Sin detalles'}
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
                              <span>Ver detalles</span>
                            </DropdownMenuItem>
                            
                            <div className="px-2 py-1.5 text-sm space-y-2">
                              <div className="flex items-start gap-2 text-muted-foreground">
                                <Globe className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-medium">Dirección IP</div>
                                  <div className="font-mono text-xs break-all">{log.ipAddress || 'N/A'}</div>
                                </div>
                              </div>
                              <div className="flex items-start gap-2 text-muted-foreground">
                                <Monitor className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-medium">Navegador</div>
                                  <div className="text-xs break-all">{log.userAgent || 'N/A'}</div>
                                </div>
                              </div>
                              {log.details && (
                                <div className="flex items-start gap-2 text-muted-foreground">
                                  <FileText className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <div className="font-medium">Detalles</div>
                                    <div className="text-xs break-all">{typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}</div>
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
                    <span className="sr-only">Primera página</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Página anterior</span>
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    Página {currentPage + 1} de {Math.max(1, Math.ceil(filteredLogs.length / pageSize))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredLogs.length / pageSize) - 1, p + 1))}
                    disabled={currentPage >= Math.ceil(filteredLogs.length / pageSize) - 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Página siguiente</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.ceil(filteredLogs.length / pageSize) - 1)}
                    disabled={currentPage >= Math.ceil(filteredLogs.length / pageSize) - 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsRight className="h-4 w-4" />
                    <span className="sr-only">Última página</span>
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
                    Exportar
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Filter className="h-12 w-12 text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">No se encontraron registros</h3>
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium text-muted-foreground">No se encontraron registros</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchQuery ? 'No hay resultados para su búsqueda.' : 'No hay registros disponibles en este momento.'}
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
            <DialogTitle>Detalles del registro</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Descripción</h4>
                <div className="p-3 bg-muted/50 rounded-md text-sm">
                  {selectedLog.description || 'Sin detalles'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Dirección IP</h4>
                  <div className="p-3 bg-muted/50 rounded-md text-sm font-mono">
                    {selectedLog.ipAddress || 'N/A'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Navegador</h4>
                  <div className="p-3 bg-muted/50 rounded-md text-sm">
                    {selectedLog.userAgent || 'N/A'}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Fecha y hora</h4>
                  <div className="p-3 bg-muted/50 rounded-md text-sm">
                    {formatDate(selectedLog.timestamp)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Usuario</h4>
                  <div className="p-3 bg-muted/50 rounded-md text-sm">
                    {selectedLog.userEmail || 'Sistema'}
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
