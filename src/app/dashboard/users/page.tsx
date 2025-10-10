'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth, isTokenExpired, getToken } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { UsersTable } from './components/UsersTable'
import { UserForm } from './components/UserForm'
import { UserFilters } from './components/UserFilters'
import { Manager, UserFormData } from './types'
import { API_BASE_URL } from '@/lib/config'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function UsersPage() {
  console.log('Rendu de la page UsersPage')
  const { token, isAuthenticated, loading: authLoading, user } = useAuth()
  const router = useRouter()
  
  // Rediriger vers la page de connexion si non authentifié
  useEffect(() => {
    console.log('useEffect - Vérification de l\'authentification', { 
      isAuthenticated, 
      authLoading,
      hasToken: !!token,
      tokenValid: token ? !isTokenExpired(token) : false
    });

    // Si le chargement est terminé et que l'utilisateur n'est pas authentifié, rediriger vers /login
    if (authLoading === false) {
      if (!isAuthenticated) {
        console.log('Non authentifié, redirection vers /login')
        router.push('/login')
      } else {
        // Vérifier le rôle - Seul le SUPER_ADMIN peut accéder à cette section
        if (user?.role !== 'SUPER_ADMIN') {
          console.log('Rôle insuffisant, redirection vers /unauthorized')
          toast.error('Accès réservé aux SUPER_ADMIN')
          router.push('/unauthorized')
          return
        }
        // Charger les données si l'utilisateur est authentifié
        console.log('Utilisateur authentifié, chargement des données...')
        fetchManagers()
      }
    }
  }, [isAuthenticated, authLoading, router, token])
  const [managers, setManagers] = useState<Manager[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentManager, setCurrentManager] = useState<Manager | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<'' | 'ADMIN' | 'SUPER_ADMIN' | 'AUDITEUR'>('')
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(5) // 5 lignes par défaut
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  
  // État pour la boîte de dialogue de confirmation
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    description: '',
    action: () => {}
  })

  // Charger tous les utilisateurs
  const fetchManagers = useCallback(async (search = searchQuery, isAutoRefresh = false) => {
    console.log('fetchManagers appelé avec search:', search, 'autoRefresh:', isAutoRefresh);
    const currentToken = token || getToken();
    if (!currentToken) {
      console.error('Aucun token JWT disponible');
      if (!isAutoRefresh) {
        setLoading(false);
        setInitialLoad(false);
        toast.error('Veuillez vous reconnecter');
      }
      return;
    }
    
    if (isTokenExpired(currentToken)) {
      console.log('Token expiré, déconnexion...');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return;
    }

    if (!isAutoRefresh) {
      console.log('Début du chargement des données...');
      setLoading(true);
    }
    
    // Liste des URLs à essayer en cas d'échec
    const baseUrls = [
      `${API_BASE_URL}/api/V1/managers`,
      `${API_BASE_URL}/api/managers`
    ];
    
    let lastError = null;
    let lastResponse = null;

    for (const baseUrl of baseUrls) {
      try {
        const url = new URL(baseUrl);
        if (search) {
          url.searchParams.append('search', search);
        }

        console.log(`Tentative de connexion à: ${url.toString()}`);
        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          mode: 'cors'
        });

        console.log('Statut de la réponse:', response.status);
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || `Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Réponse API réussie depuis ${url}:`, data);
        
        // Extraire les managers de la réponse
        const allManagers = Array.isArray(data) ? data : (data.content || data.data || []);
        
        // Mettre à jour l'état avec les données reçues
        setManagers(allManagers);
        setTotalElements(allManagers.length);
        setTotalPages(Math.ceil(allManagers.length / pageSize));
        
        if (!isAutoRefresh) {
          setLoading(false);
          setInitialLoad(false);
        }
        
        console.log('Données mises à jour avec succès', { isAutoRefresh });
        return allManagers;
        
      } catch (error) {
        console.error(`Erreur avec l'URL ${baseUrl}:`, error);
        lastError = error;
        lastResponse = error.response?.data || null;
        
        // Si c'est une erreur d'authentification, on arrête tout
        if (error.message && error.message.includes('401')) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return;
          }
        }
        
        // Si c'est une erreur 500, on essaie l'URL suivante
        if (error.message && error.message.includes('500')) {
          continue;
        }
        
        // Pour les autres erreurs, on affiche un message et on continue
        toast.error('Erreur lors du chargement des utilisateurs');
      }
    }
    
    // Si on arrive ici, toutes les tentatives ont échoué
    setLoading(false);
    setInitialLoad(false);
    
    if (lastError) {
      console.error('Toutes les tentatives ont échoué:', lastError);
      
      // Si on a une réponse partielle mais une erreur, on peut quand même essayer de l'utiliser
      if (lastResponse) {
        try {
          const allManagers = Array.isArray(lastResponse) ? lastResponse : (lastResponse.content || lastResponse.data || []);
          setManagers(allManagers);
          setTotalPages(Math.ceil(allManagers.length / pageSize));
          setTotalElements(allManagers.length);
          toast.warning('Certaines données peuvent être incomplètes en raison d\'une erreur partielle.');
        } catch (e) {
          console.error('Erreur lors du traitement de la réponse partielle:', e);
          setManagers([]);
          setTotalPages(0);
          setTotalElements(0);
          toast.error('Impossible de charger les données. Veuillez réessayer plus tard.');
        }
      } else if (managers.length === 0) {
        // Si pas de données du tout
        setManagers([]);
        setTotalPages(0);
        setTotalElements(0);
        toast.error('Impossible de charger les données. Veuillez vérifier votre connexion et réessayer.');
      }
    }
    
    setLoading(false);
    setInitialLoad(false);
  }, [token, searchQuery, pageSize, isAuthenticated, initialLoad, managers.length]);

  // Filtrer les managers en fonction de la recherche et du rôle
  const filteredManagers = useMemo(() => {
    console.log('Filtrage des managers avec:', { searchQuery, roleFilter, totalManagers: managers?.length });
    
    if (!managers || managers.length === 0) return [];
    
    const filtered = managers.filter(manager => {
      // Filtre par recherche
      const searchTerm = searchQuery ? searchQuery.toLowerCase() : '';
      const matchesSearch = !searchTerm || 
        (manager.nomManager && manager.nomManager.toLowerCase().includes(searchTerm)) ||
        (manager.prenomManager && manager.prenomManager.toLowerCase().includes(searchTerm)) ||
        (manager.email && manager.email.toLowerCase().includes(searchTerm)) ||
        (manager.numeroTelephoneManager && manager.numeroTelephoneManager.toString().toLowerCase().includes(searchTerm)) ||
        (manager.role && manager.role.toLowerCase().includes(searchTerm));
      
      // Filtre par rôle
      const matchesRole = !roleFilter || roleFilter === '' || manager.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
    
    console.log('Résultats du filtrage:', filtered.length);
    return filtered;
  }, [managers, searchQuery, roleFilter]);

  // Gestion du changement de page
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Gestion du changement de taille de page
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0); // Réinitialiser à la première page lors du changement de taille de page
  };
  
  // Obtenir les managers pour la page courante
  const paginatedManagers = useMemo(() => {
    console.log('Pagination des managers:', { currentPage, pageSize, totalFiltered: filteredManagers.length });
    
    // Mettre à jour le nombre total de pages
    const total = Math.ceil(filteredManagers.length / pageSize) || 1;
    setTotalPages(total);
    setTotalElements(filteredManagers.length);
    
    // Réinitialiser la page courante si nécessaire
    if (currentPage >= total && total > 0) {
      setCurrentPage(total - 1);
      return [];
    }
    
    const startIndex = currentPage * pageSize;
    return filteredManagers.slice(startIndex, startIndex + pageSize);
  }, [currentPage, pageSize, filteredManagers]);
  
  // Effet pour charger les données initiales
  // Effet pour le chargement initial et le rafraîchissement
  useEffect(() => {
    console.log('useEffect - Chargement initial des données');
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    
    const loadData = async () => {
      console.log('loadData appelé, isMounted:', isMounted, 'retryCount:', retryCount);
      if (!isMounted) return;
      
      try {
        setLoading(true);
        await fetchManagers(searchQuery);
      } catch (error) {
        if (!isMounted) return;
        
        console.error('Erreur lors du chargement des données:', error);
        
        // Ne pas afficher l'erreur si c'est une erreur d'annulation
        if (error.name === 'AbortError') return;
        
        // Gestion des tentatives de reconnexion
        if (retryCount < maxRetries) {
          retryCount++;
          const delay = 1000 * Math.pow(2, retryCount); // Délai exponentiel
          console.log(`Nouvelle tentative dans ${delay}ms (${retryCount}/${maxRetries})`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          if (isMounted) loadData();
          return;
        }
        
        // Afficher l'erreur après épuisement des tentatives
        toast.error(error.message || 'Erreur lors du chargement des utilisateurs');
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialLoad(false);
        }
      }
    };
    
    // Délai pour éviter les appels trop fréquents lors de la saisie
    const debounceTimer = setTimeout(() => {
      loadData();
    }, 300);
    
    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
    };
  }, [fetchManagers, searchQuery]); // Ajouter searchQuery aux dépendances
  
  // Effet pour le rafraîchissement périodique (silencieux)
  useEffect(() => {
    if (loading) return;
    
    const refreshInterval = 30000; // 30 secondes
    
    const refreshTimer = setInterval(() => {
      fetchManagers(searchQuery, true).catch(() => {}); // Gestion silencieuse des erreurs avec isAutoRefresh=true
    }, refreshInterval);
    
    return () => {
      clearInterval(refreshTimer);
    };
  }, [fetchManagers, searchQuery, loading]);
  
  // Effet pour réinitialiser la page à 0 lorsque les filtres changent
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, roleFilter]);

  const handleEdit = (id: string) => {
    const manager = managers.find(m => m.idManager === id);
    if (!manager) return;
    
    // Fonction pour extraire l'indicatif et le numéro
    const extractPhoneNumber = (phoneWithCode: string) => {
      if (!phoneWithCode) return { indicatif: "+225", numero: "" };
      
      // Nettoyer le numéro (supprimer les espaces, tirets, etc.)
      const cleaned = phoneWithCode.replace(/[^\d+]/g, '');
      
      // Vérifier d'abord le format +225 (Côte d'Ivoire)
      if (cleaned.startsWith('+225') || cleaned.startsWith('00225')) {
        const codePays = cleaned.startsWith('+') ? '+225' : '00225';
        return {
          indicatif: codePays,
          numero: cleaned.substring(codePays.length)
        };
      }
      
      // Pour les autres pays, essayer de trouver un indicatif correspondant
      // (à adapter selon les pays pris en charge)
      const indicatifPatterns = [
        { prefix: '+33', code: '+33' }, // France
        { prefix: '0033', code: '+33' },
        { prefix: '+1', code: '+1' },   // USA/Canada
        { prefix: '001', code: '+1' }
      ];
      
      for (const pattern of indicatifPatterns) {
        if (cleaned.startsWith(pattern.prefix)) {
          return {
            indicatif: pattern.code,
            numero: cleaned.substring(pattern.prefix.length)
          };
        }
      }
      
      // Si le numéro commence par + mais qu'aucun modèle ne correspond
      if (cleaned.startsWith('+')) {
        // Essayer d'extraire les 2-3 premiers chiffres après le +
        const codePaysMatch = cleaned.match(/^\+([0-9]{1,3})/);
        if (codePaysMatch) {
          return {
            indicatif: `+${codePaysMatch[1]}`,
            numero: cleaned.substring(codePaysMatch[0].length)
          };
        }
      }
      
      // Si le numéro commence par 00 (format international)
      if (cleaned.startsWith('00')) {
        const codePaysMatch = cleaned.match(/^00([0-9]{1,3})/);
        if (codePaysMatch) {
          return {
            indicatif: `+${codePaysMatch[1]}`,
            numero: cleaned.substring(codePaysMatch[0].length)
          };
        }
      }
      
      // Si aucun indicatif n'est trouvé, considérer le numéro tel quel
      return {
        indicatif: "+225", // Par défaut Côte d'Ivoire
        numero: cleaned
      };
    };
    
    // Extraire l'indicatif et le numéro
    const { indicatif, numero } = extractPhoneNumber(manager.numeroTelephoneManager || "");
    
    // Préparer les données du formulaire
    const formData = {
      ...manager,
      numeroTelephoneManager: numero,
      indicatif: indicatif,
      password: '' // Ne pas afficher le mot de passe
    };
    
    setCurrentManager(formData);
    setIsDialogOpen(true);
  }

  const handleSuspend = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Confirmer la suspension',
      description: 'Êtes-vous sûr de vouloir suspendre cet utilisateur ?',
      action: async () => {
        if (!token) {
          toast.error('Non autorisé')
          return
        }

        try {
          const response = await fetch(`${API_BASE_URL}/api/V1/managers/${id}/suspend`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            credentials: 'include'
          })

          if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.message || 'Erreur lors de la suspension')
          }

          // Mise à jour optimiste de l'interface
          setManagers(prevManagers => 
            prevManagers.map(manager => 
              manager.idManager === id 
                ? { ...manager, statutCompte: 'SUSPENDU' } 
                : manager
            )
          )
          
          toast.success('Utilisateur suspendu avec succès')
          // Recharger les données pour s'assurer qu'elles sont à jour
          fetchManagers()
        } catch (error) {
          console.error('Erreur lors de la suspension de l\'utilisateur:', error)
          toast.error('Échec de la suspension de l\'utilisateur')
          // Recharger les données pour récupérer l'état réel du serveur
          fetchManagers()
        }
      }
    })
  }

  const handleReactivate = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Confirmer l\'activation',
      description: 'Êtes-vous sûr de vouloir activer cet utilisateur ?',
      action: async () => {
        if (!token) {
          toast.error('Non autorisé')
          return
        }

        try {
          // Mise à jour optimiste de l'interface
          setManagers(prevManagers => 
            prevManagers.map(manager => 
              manager.idManager === id 
                ? { ...manager, statutCompte: 'ACTIF' } 
                : manager
            )
          )

          const response = await fetch(`${API_BASE_URL}/api/V1/managers/${id}/reactivate`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            credentials: 'include'
          })

          if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.message || 'Erreur lors de l\'activation')
          }

          toast.success('Utilisateur activé avec succès')
          // Recharger les données pour s'assurer qu'elles sont à jour
          fetchManagers()
        } catch (error) {
          console.error('Erreur:', error)
          toast.error(error instanceof Error ? error.message : 'Échec de la réactivation de l\'utilisateur')
        }
      }
    })
  }

  const handleArchive = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Confirmer l\'archivage',
      description: 'Êtes-vous sûr de vouloir archiver cet utilisateur ? Il ne pourra plus se connecter.',
      action: async () => {
        if (!token) {
          toast.error('Non autorisé')
          return
        }

        try {
          // Mise à jour optimiste de l'interface
          setManagers(prevManagers => 
            prevManagers.map(manager => 
              manager.idManager === id 
                ? { ...manager, statutCompte: 'ARCHIVE' } 
                : manager
            )
          )

          // 1. Désactiver d'abord l'URL de désarchivage
          try {
            await fetch(`${API_BASE_URL}/api/V1/managers/${id}/unarchive`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              credentials: 'include'
            });
            console.log('URL de désarchivage désactivée avec succès');
          } catch (error) {
            console.error('Erreur lors de la désactivation de l\'URL de désarchivage:', error);
            // On continue quand même l'archivage même si la désactivation de l'URL échoue
          }

          // 2. Ensuite, procéder à l'archivage
          const response = await fetch(`${API_BASE_URL}/api/V1/managers/${id}/archive`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            credentials: 'include'
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            // Vérifier si l'erreur indique que le manager est déjà archivé
            if (error.message && error.message.includes('déjà archivé')) {
              toast.info('Ce manager est déjà archivé');
              // Recharger les données pour s'assurer qu'elles sont à jour
              await fetchManagers();
              return;
            }
            throw new Error(error.message || 'Erreur lors de l\'archivage');
          }

          toast.success('Utilisateur archivé avec succès')
          // Recharger les données pour s'assurer qu'elles sont à jour
          fetchManagers()
        } catch (error) {
          console.error('Erreur lors de l\'archivage de l\'utilisateur:', error)
          toast.error('Échec de l\'archivage de l\'utilisateur')
          // Recharger les données pour récupérer l'état réel du serveur
          fetchManagers()
        }
      }
    })
  }


  const handleSubmit = async (data: any) => {
    if (!token) return
    
    const baseUrl = `${API_BASE_URL}/api/V1/managers`
    const url = currentManager 
      ? `${baseUrl}/${currentManager.idManager}`
      : `${baseUrl}/create`

    const method = currentManager ? 'PATCH' : 'POST'

    // Préparer les données pour l'API
    const requestData = {
      nomManager: data.nomManager,
      prenomManager: data.prenomManager,
      email: data.email,
      numeroTelephoneManager: data.indicatif ? `${data.indicatif}${data.numeroTelephoneManager}` : data.numeroTelephoneManager,
      // Le mot de passe sera généré automatiquement par le serveur
      role: data.role
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Une erreur est survenue')
      }

      toast.success(`Utilisateur ${currentManager ? 'mis à jour' : 'créé'} avec succès`)
      setIsDialogOpen(false)
      setCurrentManager(null)
      fetchManagers()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue')
    }
  }

  // Afficher un message de chargement pendant la vérification d'authentification
  if (authLoading) {
    console.log('Affichage du loader d\'authentification')
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Vérification de l'authentification...</h1>
          <p className="text-muted-foreground">
            Veuillez patienter pendant le chargement de la page.
          </p>
        </div>
      </div>
    );
  }

  // Afficher un message si aucun utilisateur n'est trouvé
  console.log('Rendu - État actuel:', { 
    managersCount: managers.length, 
    loading, 
    initialLoad, 
    isAuthenticated,
    hasToken: !!token
  });
  
  if (initialLoad || loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground">Chargement en cours...</p>
        </div>
      </div>
    );
  }

  if (managers.length === 0 && !loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground">
            Aucun utilisateur trouvé. Vérifiez votre connexion ou vos filtres.
          </p>
        </div>
        <div className="flex justify-center">
          <Button onClick={() => fetchManagers()}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Gestion des utilisateurs</h1>
        <p className="text-muted-foreground">
          Gérez les comptes des utilisateurs et leurs permissions
        </p>
      </div>
      
      <UserFilters 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        onAddUser={() => {
          setCurrentManager(null)
          setIsDialogOpen(true)
        }}
      />

      <div className="mt-6">
        <UsersTable 
          managers={paginatedManagers}
          loading={loading}
          onEdit={handleEdit}
          onSuspend={handleSuspend}
          onReactivate={handleReactivate}
          onArchive={handleArchive}
          currentPage={currentPage}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {currentManager ? 'Modifier un utilisateur' : 'Ajouter un utilisateur'}
            </DialogTitle>
          </DialogHeader>
          <UserForm 
            initialData={currentManager || undefined}
            onSubmit={handleSubmit}
            loading={false}
            isEditing={!!currentManager}
          />
        </DialogContent>
      </Dialog>

      {/* Boîte de dialogue de confirmation */}
      <AlertDialog 
        open={confirmDialog.isOpen} 
        onOpenChange={(isOpen) => setConfirmDialog(prev => ({ ...prev, isOpen }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                confirmDialog.action()
                setConfirmDialog(prev => ({ ...prev, isOpen: false }))
              }}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
