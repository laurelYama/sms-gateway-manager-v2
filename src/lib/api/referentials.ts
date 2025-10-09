import { Referentiel, ReferentielFormData } from '@/app/dashboard/referentiels/types';
import { API_BASE_URL } from '@/lib/config';
const REFERENTIALS_BASE = `${API_BASE_URL}/api/v1/referentiel`;

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export async function getReferentials(): Promise<Referentiel[]> {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${REFERENTIALS_BASE}/all`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Erreur lors de la récupération des référentiels');
  }
  
  return response.json();
}

export async function searchReferentials(query: string): Promise<PaginatedResponse<Referentiel>> {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${REFERENTIALS_BASE}/search?q=${encodeURIComponent(query)}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Erreur lors de la recherche des référentiels');
  }
  
  return response.json();
}

export async function createReferential(data: ReferentielFormData): Promise<Referentiel> {
  const token = localStorage.getItem('authToken');
  const response = await fetch(REFERENTIALS_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la création du référentiel');
  }
  
  return response.json();
}

export async function updateReferential(id: number, data: ReferentielFormData): Promise<Referentiel> {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${REFERENTIALS_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la mise à jour du référentiel');
  }
  
  return response.json();
}

export async function deleteReferential(id: number): Promise<void> {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la suppression du référentiel');
  }
}

export async function getCategories(): Promise<string[]> {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${REFERENTIALS_BASE}/categories`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des catégories');
  }
  
  return response.json();
}

export async function createBatchReferentials(data: ReferentielFormData[]): Promise<Referentiel[]> {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${REFERENTIALS_BASE}/batch`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la création des référentiels');
  }
  
  return response.json();
}
