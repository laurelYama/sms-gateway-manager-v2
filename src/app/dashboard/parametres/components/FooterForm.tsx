'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface FooterData {
  companyName: string;
  companyAddress: string;
  companyNif: string;
  companyRccm: string;
  companyEmail: string;
  companyPhone: string;
  paymentNote: string;
}

interface FooterFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: {
    companyName: string;
    companyAddress: string;
    companyNif: string;
    companyRccm: string;
    companyEmail: string;
    companyPhone: string;
    paymentNote: string;
  };
  onUpdate: (data: {
    companyName: string;
    companyAddress: string;
    companyNif: string;
    companyRccm: string;
    companyEmail: string;
    companyPhone: string;
    paymentNote: string;
  }) => void;
}

export function FooterForm({ isOpen, onClose, initialData, onUpdate }: FooterFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [footerData, setFooterData] = useState<FooterData>(initialData);

  // Mettre à jour les données locales lorsque les props initiales changent
  useEffect(() => {
    setFooterData(initialData);
  }, [initialData]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Aucun token trouvé');
      }

      const response = await fetch('https://api-smsgateway.solutech-one.com/api/v1/footer', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(footerData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      toast({
        title: 'Succès',
        description: 'Paramètres du pied de page mis à jour avec succès',
      });
      
      onUpdate(footerData);
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFooterData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le pied de page</DialogTitle>
          <DialogDescription>
            Personnalisez les informations qui apparaissent en bas de vos factures
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="companyName" className="text-sm font-medium">
                  Nom de l'entreprise
                </label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={footerData.companyName}
                  onChange={handleChange}
                  placeholder="Nom de l'entreprise"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="companyAddress" className="text-sm font-medium">
                  Adresse
                </label>
                <Input
                  id="companyAddress"
                  name="companyAddress"
                  value={footerData.companyAddress}
                  onChange={handleChange}
                  placeholder="Adresse de l'entreprise"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="companyNif" className="text-sm font-medium">
                  NIF
                </label>
                <Input
                  id="companyNif"
                  name="companyNif"
                  value={footerData.companyNif}
                  onChange={handleChange}
                  placeholder="Numéro d'identification fiscale"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="companyRccm" className="text-sm font-medium">
                  RCCM
                </label>
                <Input
                  id="companyRccm"
                  name="companyRccm"
                  value={footerData.companyRccm}
                  onChange={handleChange}
                  placeholder="Numéro RCCM"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="companyEmail" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="companyEmail"
                  name="companyEmail"
                  type="email"
                  value={footerData.companyEmail}
                  onChange={handleChange}
                  placeholder="contact@entreprise.com"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="companyPhone" className="text-sm font-medium">
                  Téléphone
                </label>
                <Input
                  id="companyPhone"
                  name="companyPhone"
                  value={footerData.companyPhone}
                  onChange={handleChange}
                  placeholder="+241 XX XX XX XX"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="paymentNote" className="text-sm font-medium">
                Note de paiement
              </label>
              <Textarea
                id="paymentNote"
                name="paymentNote"
                value={footerData.paymentNote}
                onChange={handleChange}
                placeholder="Ex: Paiement exigé sous 15 jours."
                className="min-h-[100px]"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={saving}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
