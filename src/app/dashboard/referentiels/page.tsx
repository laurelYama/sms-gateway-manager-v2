'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { DataTable } from './data-table';
import { columns } from './columns';
import { ReferentialForm } from './referential-form';
import { Referentiel, REFERENTIEL_CATEGORIES } from './types';
import { getReferentials, searchReferentials, getCategories } from '@/lib/api/referentials';

export default function ReferentielsPage() {
  const [data, setData] = useState<Referentiel[]>([]);
  const [filteredData, setFilteredData] = useState<Referentiel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReferentiel, setEditingReferentiel] = useState<Referentiel | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  const router = useRouter();

  useEffect(() => {
    loadData();
    loadCategories();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const search = async () => {
        try {
          const results = await searchReferentials(searchTerm);
          setFilteredData(results);
        } catch (error) {
          console.error('Erreur lors de la recherche:', error);
        }
      };
      
      const timer = setTimeout(() => {
        search();
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setFilteredData(data);
    }
  }, [searchTerm, data]);

  useEffect(() => {
    if (selectedCategory) {
      setFilteredData(data.filter(item => item.refCategory === selectedCategory));
    } else {
      setFilteredData(data);
    }
  }, [selectedCategory, data]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const result = await getReferentials();
      setData(result);
      setFilteredData(result);
    } catch (error) {
      console.error('Erreur lors du chargement des référentiels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categories = await getCategories();
      setAvailableCategories(categories);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  const handleEdit = (referentiel: Referentiel) => {
    setEditingReferentiel(referentiel);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingReferentiel(null);
    loadData();
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
        
        <select
          className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">Toutes les catégories</option>
          {availableCategories.map(category => (
            <option key={category} value={category}>
              {REFERENTIEL_CATEGORIES[category] || category}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-md border">
        <DataTable 
          columns={columns(handleEdit, loadData)} 
          data={filteredData} 
          isLoading={isLoading} 
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
        onSuccess={handleFormSuccess}
        initialData={editingReferentiel}
      />
    </div>
  );
}
