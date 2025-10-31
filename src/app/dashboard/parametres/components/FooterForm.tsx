'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/config';
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

      const response = await fetch(`${API_BASE_URL}/api/v1/footer`, {
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
        title: 'Éxito',
        description: 'Configuración del pie de página actualizada correctamente',
      });
      
      onUpdate(footerData);
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Error',
        description: 'Se produjo un error al actualizar',
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
          <DialogTitle>Modificar el pie de página</DialogTitle>
          <DialogDescription>
            Personalice la información que aparece al pie de sus facturas
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
                  Nombre de la empresa
                </label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={footerData.companyName}
                  onChange={handleChange}
                  placeholder="Nombre de la empresa"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="companyAddress" className="text-sm font-medium">
                  Dirección
                </label>
                <Input
                  id="companyAddress"
                  name="companyAddress"
                  value={footerData.companyAddress}
                  onChange={handleChange}
                  placeholder="Pago al recibir la factura. Se acepta pago en efectivo."
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
                  placeholder="Número de identificación fiscal"
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
                  placeholder="Número RCCM"
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
                  Teléfono
                </label>
                <Input
                  id="companyPhone"
                  name="companyPhone"
                  value={footerData.companyPhone}
                  onChange={handleChange}
                  placeholder="+XX XXX XXX XXX"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="paymentNote" className="text-sm font-medium">
                Nota de pago
              </label>
              <Textarea
                id="paymentNote"
                name="paymentNote"
                value={footerData.paymentNote}
                onChange={handleChange}
                placeholder="Ex: Pago exigido bajo 15 días."
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
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar
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
