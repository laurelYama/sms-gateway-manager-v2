'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Calendar, Search, Filter } from 'lucide-react';
import * as dateFns from 'date-fns';
import { fr } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { auditLogService, type AuditLog } from '@/services/auditLogService';

type LogViewType = 'all' | 'byDate' | 'byUser';

export default function LogsPage() {
  // date-fns types conflict with installed @types/date-fns in this project
  // use a permissive wrapper for format and access formatDistanceToNow via the
  // namespace import to avoid signature/type mismatches
  const formatFn = (dateFns.format as unknown as (
    date: Date | number,
    formatStr?: string,
    options?: { locale?: unknown }
  ) => string);
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  // État pour les logs d'audit
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logView, setLogView] = useState<LogViewType>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  });
  const [userEmail, setUserEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      let logsData: AuditLog[] = [];
      
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
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('Error fetching logs:', errMsg);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchLogs();
    }
  }, [authLoading, user]);

  // Filtrer les logs en fonction de la recherche
  const filteredLogs = logs.filter(log => 
    log.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    JSON.stringify(log.details || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Journaux d&apos;activité</h1>
        <p className="text-muted-foreground">
          Consultez les activités récentes sur la plateforme
        </p>
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
                              {formatFn(dateRange.from, "PPP", { locale: fr })} -{" "}
                              {formatFn(dateRange.to, "PPP", { locale: fr })}
                            </>
                          ) : (
                            formatFn(dateRange.from, "PPP", { locale: fr })
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
          <div className="rounded-md border">
            {loadingLogs ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredLogs.length > 0 ? (
              <div className="relative overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Heure</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Détails</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatFn(new Date(log.timestamp), 'PPpp', { locale: fr })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.userEmail}
                        </TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>{log.entityType}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate max-w-[300px]" title={JSON.stringify(log.details || {})}>
                            {JSON.stringify(log.details || {})}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Filter className="h-12 w-12 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">Aucun log trouvé</h3>
                <p className="text-sm text-muted-foreground">
                  Aucune activité ne correspond à vos critères de recherche.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
