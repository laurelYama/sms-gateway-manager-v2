'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Settings, Calendar as CalendarIcon } from 'lucide-react';
import { FooterForm } from './components/FooterForm';
import Link from 'next/link';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_BASE_URL } from '@/lib/config';
import { getToken } from '@/lib/auth';

interface FooterData {
  companyName: string;
  companyAddress: string;
  companyNif: string;
  companyRccm: string;
  companyEmail: string;
  companyPhone: string;
  paymentNote: string;
}

export default function ParametresPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isFooterModalOpen, setIsFooterModalOpen] = useState(false);
  const [footerData, setFooterData] = useState<FooterData>({
    companyName: '',
    companyAddress: '',
    companyNif: '',
    companyRccm: '',
    companyEmail: '',
    companyPhone: '',
    paymentNote: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // État pour le Dialog "Définir l'exercice"
  const [exerciseOpen, setExerciseOpen] = useState(false);
  const [exerciseYear, setExerciseYear] = useState<number>(new Date().getFullYear());
  const [invoiceDay, setInvoiceDay] = useState<number>(1);
  const [overwrite, setOverwrite] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);

  const handleOpenFooterModal = () => {
    setIsFooterModalOpen(true);
  };

  const handleCloseFooterModal = () => {
    setIsFooterModalOpen(false);
  };

  // Simuler le chargement des données du pied de page
  useEffect(() => {
    // Protection par rôle SUPER_ADMIN
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'SUPER_ADMIN') {
      toast({ title: 'Accès refusé', description: 'Réservé aux SUPER_ADMIN', variant: 'destructive' });
      router.push('/unauthorized');
      return;
    }

    const timer = setTimeout(() => {
      setFooterData({
        companyName: 'Solutech One',
        companyAddress: '123 Rue de la Technologie, 75000 Paris',
        companyNif: '1234567890',
        companyRccm: 'RC 123 456 789',
        companyEmail: 'contact@solutech-one.com',
        companyPhone: '+33 1 23 45 67 89',
        paymentNote: 'Paiement à réception de facture. Paiement en espèces accepté.',
      });
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [authLoading, isAuthenticated, router, toast, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérer les paramètres de l'application
        </p>
      </div>

      <Tabs defaultValue="footer" className="space-y-4">
        <TabsList>
          <TabsTrigger value="footer">Pied de page</TabsTrigger>
        </TabsList>

        <TabsContent value="footer">
          <div className="space-y-6">
            <div className="flex justify-between items-center p-6 border rounded-lg">
              <div>
                <h3 className="text-lg font-medium">Pied de page</h3>
                <p className="text-sm text-muted-foreground">
                  Personnalisez les informations du pied de page pour vos factures
                </p>
              </div>
              <Button onClick={handleOpenFooterModal}>
                <Settings className="mr-2 h-4 w-4" />
                Modifier
              </Button>
            </div>

            {/* Définir l'exercice */}
            <div className="flex justify-between items-center p-6 border rounded-lg">
              <div>
                <h3 className="text-lg font-medium">Exercice de facturation</h3>
                <p className="text-sm text-muted-foreground">
                  Créez l'exercice fiscal (année) et choisissez le jour de génération des factures du mois suivant
                </p>
              </div>
              <Button onClick={() => setExerciseOpen(true)}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                Définir l'exercice
              </Button>
            </div>
          </div>
        </TabsContent>

        
      </Tabs>

      {/* Footer Form Modal */}
      <FooterForm
        isOpen={isFooterModalOpen}
        onClose={handleCloseFooterModal}
        initialData={footerData}
        onUpdate={(newData) => setFooterData(newData)}
      />

      {/* Dialog Définir l'exercice */}
      <Dialog open={exerciseOpen} onOpenChange={setExerciseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Définir l'exercice</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="annee">Année</Label>
                <Input
                  id="annee"
                  type="number"
                  min={2000}
                  max={2100}
                  value={exerciseYear}
                  onChange={(e) => setExerciseYear(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceDay">Jour de génération (mois suivant)</Label>
                <Input
                  id="invoiceDay"
                  type="number"
                  min={1}
                  max={28}
                  value={invoiceDay}
                  onChange={(e) => setInvoiceDay(Number(e.target.value))}
                />
              </div>
              <div className="hidden">
                <input
                  id="overwrite"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={false}
                  readOnly
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExerciseOpen(false)}
              disabled={creating}
            >
              Annuler
            </Button>
            <Button
              onClick={async () => {
                try {
                  const token = getToken();
                  if (!token) {
                    toast({ title: 'Non authentifié', description: 'Veuillez vous reconnecter', variant: 'destructive' });
                    return;
                  }
                  setCreating(true);
                  const res = await fetch(`${API_BASE_URL}/api/V1/billing/exercices`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Accept': 'application/json',
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      annee: exerciseYear,
                      invoiceDayOfNextMonth: invoiceDay,
                      overwriteIfExists: overwrite,
                    })
                  });
                  if (!res.ok) {
                    const status = res.status
                    // On ne montre pas le message anglais du backend à l'utilisateur final
                    let userDesc = "Une erreur est survenue lors de la création de l'exercice."
                    if (status === 409) {
                      userDesc = "Un exercice pour cette année existe déjà. Cochez ‘Écraser si existe déjà’ pour le régénérer."
                    } else if (status === 400) {
                      userDesc = "Requête invalide. Vérifiez l’année et le jour de génération."
                    } else if (status === 401 || status === 403) {
                      userDesc = "Session expirée ou accès refusé. Veuillez vous reconnecter."
                    } else if (status === 422) {
                      userDesc = "Données non valides. Corrigez les champs indiqués."
                    } else if (status >= 500) {
                      userDesc = "Erreur serveur. Réessayez plus tard."
                    }

                    const title = status === 409 ? 'Conflit' : 'Erreur'
                    toast({ title, description: userDesc, variant: 'destructive' })
                    return;
                  }
                  toast({ title: 'Exercice défini', description: `Exercice ${exerciseYear} enregistré` });
                  setExerciseOpen(false);
                } catch (error) {
                  console.error(error);
                  toast({ title: 'Échec', description: error instanceof Error ? error.message : 'Erreur inconnue', variant: 'destructive' });
                } finally {
                  setCreating(false);
                }
              }}
              disabled={creating || !exerciseYear || !invoiceDay}
            >
              {creating ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Traitement...</>) : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
