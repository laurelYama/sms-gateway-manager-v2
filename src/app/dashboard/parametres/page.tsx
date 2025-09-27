'use client'

import { useState, useEffect } from 'react';
import { useAuth, getToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Settings } from 'lucide-react';
import { FooterForm } from './components/FooterForm';

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
  const [loading, setLoading] = useState(true);
  const [isFooterModalOpen, setIsFooterModalOpen] = useState(false);
  const [footerData, setFooterData] = useState({
    companyName: '',
    companyAddress: '',
    companyNif: '',
    companyRccm: '',
    companyEmail: '',
    companyPhone: '',
    paymentNote: ''
  });

  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        const token = getToken();
        if (!token) {
          toast({
            title: 'Erreur',
            description: 'Veuillez vous reconnecter',
            variant: 'destructive',
          });
          return;
        }

        const response = await fetch('https://api-smsgateway.solutech-one.com/api/v1/footer', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Erreur lors du chargement des données');
        }

        const data = await response.json();
        setFooterData(data);
      } catch (error) {
        console.error('Erreur:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les paramètres du pied de page',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFooterData();
  }, [toast]);

  const handleOpenFooterModal = () => {
    setIsFooterModalOpen(true);
  };

  const handleCloseFooterModal = () => {
    setIsFooterModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérer les paramètres de l'application
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center p-6 border rounded-lg">
          <div>
            <h3 className="text-lg font-medium">Pied de page des factures</h3>
            <p className="text-sm text-muted-foreground">
              Personnalisez les informations qui apparaissent en bas de vos factures
            </p>
          </div>
          <Button onClick={handleOpenFooterModal}>
            <Settings className="mr-2 h-4 w-4" />
            Modifier le pied de page
          </Button>
        </div>

        {/* Section Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Logs d'activité</CardTitle>
            <CardDescription>
              Historique des activités du système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              <p>Aucun log disponible pour le moment</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Form Modal */}
      <FooterForm 
        isOpen={isFooterModalOpen} 
        onClose={handleCloseFooterModal}
        initialData={footerData}
        onUpdate={(newData) => setFooterData(newData)}
      />
    </div>
  );
}
