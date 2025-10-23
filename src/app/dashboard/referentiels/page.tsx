'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { DataTable } from './data-table';
import { columns } from './columns';
import { ReferentialForm } from './referential-form';
import { Referentiel, REFERENTIEL_CATEGORIES } from './types';
import { getReferentials, searchReferentials, getCategories } from '@/lib/api/referentials';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ReferentielsPage() {
  const [data, setData] = useState<Referentiel[]>([]);
  const [filteredData, setFilteredData] = useState<Referentiel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReferentiel, setEditingReferentiel] = useState<Referentiel | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(5); // 5 lignes par défaut
  const [totalElements, setTotalElements] = useState(0);
  const totalPages = Math.ceil(totalElements / pageSize);

  const router = useRouter();

  // Fonction pour charger toutes les données
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const allData = await getReferentials();
      
      // Vérifier que chaque élément a un ID
      const validatedData = allData.map((item) => {
        // S'assurer que l'item est un objet valide
        if (!item || typeof item !== 'object') {
          return null;
        }
        
        // Vérifier que l'élément est valide et a les propriétés requises
        if (!item || typeof item !== 'object') return null;
        
        // Créer un objet avec les propriétés requises de Referentiel
        const validatedItem: Referentiel = {
          refID: Number(item.refID) || 0,
          keyValue: String(item.keyValue || ''),
          value1: String(item.value1 || ''),
          value2: String(item.value2 || ''),
          value3: String(item.value3 || ''),
          value4: String(item.value4 || ''),
          refCategory: String(item.refCategory || ''),
          createdAt: item.createdAt ? String(item.createdAt) : undefined,
          updatedAt: item.updatedAt ? String(item.updatedAt) : undefined,
          id: item.id ? Number(item.id) : undefined
        };
        
        return validatedItem;
      }).filter((item): item is Referentiel => item !== null);
      
      setData(validatedData);
      return validatedData;
    } catch (error) {
      console.error('Erreur lors du chargement des référentiels:', error);
      throw error;
    } finally {
      console.log('Fin du chargement des référentiels');
      setIsLoading(false);
    }
  }, []);

  // Filtrer les données en fonction de la recherche et de la catégorie
  const filterData = useCallback((data: Referentiel[], search: string, category: string): Referentiel[] => {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    
    return data.filter(item => {
      if (!item) return false;
      
      const matchesSearch = !search || 
        (item.keyValue && item.keyValue.toLowerCase().includes(search.toLowerCase())) ||
        (item.value1 && item.value1.toLowerCase().includes(search.toLowerCase())) ||
        (item.value2 && item.value2.toLowerCase().includes(search.toLowerCase())) ||
        (item.value3 && item.value3.toLowerCase().includes(search.toLowerCase())) ||
        (item.value4 && item.value4.toLowerCase().includes(search.toLowerCase()));
      
      const matchesCategory = category === 'all' || item.refCategory === category;
      
      return matchesSearch && matchesCategory;
    });
  }, []);

  // Mettre à jour les données paginées lorsque les données, la recherche ou la catégorie changent
  useEffect(() => {
    if (data.length === 0) return;
    
    const filteredData = filterData(data, searchTerm, selectedCategory);
    const startIndex = currentPage * pageSize;
    const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);
    
    setFilteredData(paginatedData);
    setTotalElements(filteredData.length);
  }, [data, currentPage, pageSize, searchTerm, selectedCategory, filterData]);

  // Effet initial pour charger les données et les catégories
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchAllData();
        try {
          const categories = await getCategories();
          setAvailableCategories(categories);
        } catch (categoryError) {
          console.error('Erreur lors du chargement des catégories:', categoryError);
          // On continue même si le chargement des catégories échoue
          setAvailableCategories([]);
        }
      } catch (error) {
        // L'erreur est déjà gérée dans fetchAllData
        console.error('Erreur lors du chargement initial des données:', error);
      }
    };
    
    loadInitialData();
  }, [fetchAllData]);

  // Gérer la recherche avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(0); // Réinitialiser à la première page lors de la recherche
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory]);

  // La fonction loadCategories a été intégrée dans l'effet initial

  const handleEdit = (referentiel: Referentiel) => {
    console.log('Édition du référentiel:', referentiel);
    if (!referentiel.id) {
      console.error('Tentative d\'édition d\'un référentiel sans ID:', referentiel);
      return;
    }
    setEditingReferentiel(referentiel);
    setIsFormOpen(true);
  };

  const handleFormSuccess = (isNew: boolean) => {
    setIsFormOpen(false);
    setEditingReferentiel(null);
    fetchAllData(); // Recharger toutes les données
    
    // Afficher une notification de succès
    if (isNew) {
      toast.success("Le référentiel a été ajouté avec succès");
    } else {
      toast.success("Le référentiel a été mis à jour avec succès");
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Gestion des Référentiels</h1>
        <Button onClick={() => {
          setEditingReferentiel(null);
          setIsFormOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un référentiel
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un référentiel..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select
          value={selectedCategory}
          onValueChange={(value) => {
            setSelectedCategory(value);
            setCurrentPage(0); // Réinitialiser à la première page lors du changement de catégorie
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {availableCategories.map(category => (
              <SelectItem key={category} value={category}>
                {REFERENTIEL_CATEGORIES[category] || category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md">
        <DataTable 
          columns={columns(handleEdit, fetchAllData)} 
          data={filteredData}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            console.log('Changement de la taille de la page:', size);
            setPageSize(size);
            setCurrentPage(0); // Réinitialiser à la première page lors du changement de taille de page
          }}
        />
      </div>

      <ReferentialForm
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false);
            setEditingReferentiel(null);
          }
        }}
        onSuccess={() => handleFormSuccess(!editingReferentiel)}
        initialData={editingReferentiel}
      />
    </div>
  );
}
