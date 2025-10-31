'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Referentiel, ReferentielFormData, REFERENTIEL_CATEGORIES } from './types';
import { createReferential, updateReferential, getCategories } from '@/lib/api/referentials';

const formSchema = z.object({
  keyValue: z.string().min(1, 'La clave es requerida'),
  value1: z.string().min(1, 'El valor 1 es requerido'),
  value2: z.string(),
  value3: z.string(),
  value4: z.string(),
  refCategory: z.string().min(1, 'La categoría es requerida'),
});

interface ReferentialFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: Referentiel | null;
}

export function ReferentialForm({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: ReferentialFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<{code: string, label: string}[]>([]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keyValue: '',
      value1: '',
      value2: '',
      value3: '',
      value4: '',
      refCategory: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        keyValue: initialData.keyValue,
        value1: initialData.value1,
        value2: initialData.value2 || '',
        value3: initialData.value3 || '',
        value4: initialData.value4 || '',
        refCategory: initialData.refCategory,
      });
    } else {
      form.reset({
        keyValue: '',
        value1: '',
        value2: '',
        value3: '',
        value4: '',
        refCategory: '',
      });
    }
  }, [initialData, open, form]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await getCategories();
        const formattedCategories = categories.map(cat => ({
          code: cat,
          label: REFERENTIEL_CATEGORIES[cat as keyof typeof REFERENTIEL_CATEGORIES] || cat
        }));
        setAvailableCategories(formattedCategories);
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
      }
    };

    if (open) {
      loadCategories();
    }
  }, [open]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);

      if (initialData) {
        console.log('Mise à jour du référentiel avec ID:', initialData.id);
        console.log('Données du formulaire:', values);
        // Inclure le refID lors de la mise à jour
        await updateReferential(initialData.id!, {
          ...values,
          refID: initialData.refID
        });
        toast({
          title: 'Succès',
          description: 'Le référentiel a été mis à jour avec succès.',
        });
      } else {
        // Pour une création, on utilise les valeurs du formulaire directement
        // car le refID sera généré côté serveur
        await createReferential(values);
        toast({
          title: 'Succès',
          description: 'Le référentiel a été créé avec succès.',
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Modificar referencia' : 'Añadir referencia'}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Modifique los detalles de la referencia.'
              : 'Complete los campos para agregar una nueva referencia.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="keyValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clave</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese la clave" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="refCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="">Seleccione una categoría</option>
                      {availableCategories.map((category) => (
                        <option key={category.code} value={category.code}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor 1</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese el valor 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor 2</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese el valor 2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor 3</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese el valor 3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value4"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor 4</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese el valor 4" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : initialData ? (
                  'Actualizar'
                ) : (
                  'Añadir'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}