'use client'

import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Search, Check as CheckIcon } from "lucide-react"
import { useEffect, useState } from 'react'
import { IndicatifPays, useIndicatifs } from '../services/indicatifs'
import * as SelectPrimitive from '@radix-ui/react-select'

// Les indicatifs seront chargés depuis l'API

const formSchema = z.object({
  nomManager: z.string().min(2, 'Le nom est requis'),
  prenomManager: z.string().min(2, 'Le prénom est requis'),
  email: z.string().email('Email invalide'),
  indicatif: z.string().min(1, 'Indicatif requis'),
  numeroTelephoneManager: z.string()
    .min(8, 'Numéro de téléphone invalide')
    .regex(/^[0-9]+$/, 'Le numéro ne doit contenir que des chiffres'),
  role: z.enum(['ADMIN', 'SUPER_ADMIN', 'AUDITEUR']),
  password: z.string().optional(),
})

type UserFormValues = z.infer<typeof formSchema>

interface UserFormProps {
  initialData?: Partial<UserFormValues> & { idManager?: string }
  onSubmit: (data: UserFormValues) => void
  loading: boolean
  isEditing?: boolean
}

export function UserForm({ initialData, onSubmit, loading, isEditing = false }: UserFormProps) {
  const [indicatifs, setIndicatifs] = useState<IndicatifPays[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const { getIndicatifs } = useIndicatifs()

  useEffect(() => {
    const loadIndicatifs = async () => {
      try {
        const data = await getIndicatifs()
        // Vérifier les doublons
        const seen = new Set()
        const duplicates = data.filter(ind => {
          const key = `${ind.refID}-${ind.keyValue}-${ind.value2}`
          if (seen.has(key)) {
            console.warn('Doublon détecté:', key, ind)
            return true
          }
          seen.add(key)
          return false
        })
        
        if (duplicates.length > 0) {
          console.warn(`${duplicates.length} doublons détectés dans les indicatifs`)
        }
        
        setIndicatifs(data)
      } catch (error) {
        console.error('Erreur lors du chargement des indicatifs:', error)
      }
    }
    
    loadIndicatifs()
  }, [getIndicatifs])

  // Créer une liste d'indicatifs uniques avec des clés stables
  const filteredIndicatifs = useMemo(() => {
    if (!Array.isArray(indicatifs)) return [];
    
    const seen = new Set();
    
    return indicatifs
      .filter(ind => {
        if (!ind || !ind.value2) return false;
        
        const key = ind.value2;
        if (seen.has(key)) return false;
        seen.add(key);
        
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const matchesSearch = 
            (ind.value1?.toLowerCase() || '').includes(searchLower) ||
            (ind.value2.toString() || '').includes(searchTerm);
          
          if (!matchesSearch) return false;
        }
        
        return true;
      })
      .map((ind, index) => ({
        ...ind,
        id: `indicatif-${index}-${ind.value2.replace(/\+/g, '')}`,
        displayText: ind.value1 || `Indicatif ${ind.value2}`
      }));
  }, [indicatifs, searchTerm]);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      nomManager: '',
      prenomManager: '',
      email: '',
      numeroTelephoneManager: '',
      indicatif: '+241', // Valeur par défaut pour le Gabon
      role: 'AUDITEUR',
      password: ''
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="prenomManager"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom</FormLabel>
                <FormControl>
                  <Input placeholder="Prénom" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nomManager"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input placeholder="Nom" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@exemple.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="indicatif"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Indicatif</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un indicatif" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="search"
                            placeholder="Rechercher un pays..."
                            className="pl-8 h-9 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {filteredIndicatifs.map((ind) => (
                          <SelectItem 
                            key={ind.id}
                            value={ind.value2}
                            className="[&>span:first-child]:hidden"
                          >
                            <div className="flex items-center">
                              <span className="font-mono text-sm mr-2 text-muted-foreground w-16">
                                {ind.value2}
                              </span>
                              <span>{ind.displayText}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="numeroTelephoneManager"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numéro de téléphone</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none bg-gray-100 rounded-l-md border-r border-gray-300">
                      <span className="text-gray-500 text-sm">
                        {form.watch('indicatif')}
                      </span>
                    </div>
                    <Input 
                      placeholder="XXXXXXXX" 
                      className="pl-20"
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rôle</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem key="super-admin" value="SUPER_ADMIN">Super Administrateur</SelectItem>
                  <SelectItem key="admin" value="ADMIN">Administrateur</SelectItem>
                  <SelectItem key="auditeur" value="AUDITEUR">Auditeur</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isEditing && (
          <div className="p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              Le mot de passe sera généré automatiquement et envoyé par email à l&apos;utilisateur.
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Traitement...' : (isEditing ? 'Mettre à jour' : 'Ajouter')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
