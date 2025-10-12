'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Settings, Activity } from 'lucide-react';
import { FooterForm } from './components/FooterForm';
import Link from 'next/link';

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
  const [footerData, setFooterData] = useState<FooterData>({
          companyName: 'Solutech One',
          companyAddress: '123 Rue de la Technologie, 75000 Paris',
          companyNif: '1234567890',
    companyRccm: '',
    companyEmail: '',
    companyPhone: '',
    paymentNote: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenFooterModal = () => {
    setIsFooterModalOpen(true);
  };

  const handleCloseFooterModal = () => {
    setIsFooterModalOpen(false);
  };

  // Simuler le chargement des données du pied de page
  useEffect(() => {
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
  }, []);

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
                Gérer les paramètres de l&apos;application
              </p>
      </div>

      <Tabs defaultValue="footer" className="space-y-4">
        <TabsList>
          <TabsTrigger value="footer">Pied de page</TabsTrigger>
          <TabsTrigger value="logs">Journaux d&apos;activité</TabsTrigger>
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
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Journaux d&apos;activité</CardTitle>
              <CardDescription>
                Consultez les activités récentes sur la plateforme.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                <Activity className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-medium">Gestion des journaux d&apos;activité</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Consultez et gérez les journaux d&apos;activité pour suivre toutes les actions effectuées sur la plateforme.
                </p>
                <Button asChild>
                  <Link href="/dashboard/parametres/logs">
                    Accéder aux journaux
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
