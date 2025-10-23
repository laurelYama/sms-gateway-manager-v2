import { Referentiel, ReferentielFormData } from '@/app/dashboard/referentiels/types';
import { API_BASE_URL } from '@/lib/config';
const REFERENTIALS_BASE = `${API_BASE_URL}/api/V1/referentiel`;

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export async function getReferentials(): Promise<Referentiel[]> {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('Aucun token d\'authentification trouvé');
      throw new Error('Non authentifié. Veuillez vous reconnecter.');
    }

    console.log('Récupération des référentiels depuis:', `${REFERENTIALS_BASE}/all`);
    
    const response = await fetch(`${REFERENTIALS_BASE}/all`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = `Erreur HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        console.error('Détails de l\'erreur:', errorData);
      } catch (e) {
        console.error('Erreur lors de la lecture de la réponse d\'erreur:', e);
      }
      throw new Error(`Erreur lors de la récupération des référentiels: ${errorMessage}`);
    }

    let data;
    try {
      data = await response.json();
      console.log('Référentiels bruts reçus de l\'API:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('Erreur lors du parsing de la réponse JSON:', e);
      throw new Error('Format de réponse invalide reçu du serveur');
    }

    // Vérifier que les données sont un tableau
    if (!Array.isArray(data)) {
      console.error('La réponse de l\'API n\'est pas un tableau:', data);
      throw new Error('Format de données invalide: un tableau était attendu');
    }
    
    // Valider et transformer les données
    const referentialsWithId = data.map((item: Record<string, unknown>, index: number) => {
      // Vérifier que l'élément est un objet valide
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        console.error(`Élément invalide à l'index ${index}:`, item);
        return null;
      }
      
      // Vérifier la présence des champs obligatoires
      if (!item.keyValue || !item.refCategory) {
        console.warn(`Référentiel incomplet à l'index ${index}:`, item);
      }
      
      // Convertir explicitement en nombres et gérer les valeurs manquantes
      const refID = Number(item.refID) || Number(item.id) || 0;
      
      // Créer un objet avec une structure cohérente
      const referential: Referentiel = {
        refID: refID,
        keyValue: String(item.keyValue || ''),
        value1: String(item.value1 || ''),
        value2: String(item.value2 || ''),
        value3: String(item.value3 || ''),
        value4: String(item.value4 || ''),
        refCategory: String(item.refCategory || ''),
        createdAt: item.createdAt ? String(item.createdAt) : undefined,
        updatedAt: item.updatedAt ? String(item.updatedAt) : undefined,
        // Pour la rétrocompatibilité
        id: refID
      };
      
      return referential;
    }).filter((item): item is Referentiel => item !== null);
    
    console.log('Référentiels traités:', JSON.stringify(referentialsWithId, null, 2));
    return referentialsWithId;
  } catch (error) {
    console.error('Erreur dans getReferentials:', error);
    throw error;
  }
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
    const error: { message: string } = await response.json();
    throw new Error(error.message || 'Erreur lors de la création du référentiel');
  }

  return response.json();
}

export async function updateReferential(refID: string | number, data: ReferentielFormData): Promise<Referentiel> {
  console.log('=== Début de updateReferential ===');
  console.log('refID du référentiel:', refID);
  console.log('Type du refID:', typeof refID);
  console.log('Données à mettre à jour:', JSON.stringify(data, null, 2));

  // Vérification de l'authentification
  const token = localStorage.getItem('authToken');
  if (!token) {
    const errorMsg = 'Non authentifié. Veuillez vous reconnecter.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    // Construction de l'URL avec le refID
    const url = `${REFERENTIALS_BASE}/${refID}`;
    console.log(`Mise à jour du référentiel avec l'URL: ${url}`);
    
    // Si c'est un refID temporaire, on utilise POST pour créer un nouvel enregistrement
    const method = typeof refID === 'string' && refID.startsWith('temp-') ? 'POST' : 'PUT';
    console.log(`Méthode HTTP utilisée: ${method}`);
    const requestOptions = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };

    console.log('Envoi de la requête:', {
      url,
      method,
      headers: requestOptions.headers,
      body: requestOptions.body
    });

    // Envoi de la requête
    const response = await fetch(url, requestOptions);
    
    // Journalisation de la réponse brute
    console.log('=== Réponse du serveur ===');
    console.log('Statut:', response.status, response.statusText);
    console.log('URL de la réponse:', response.url);
    
    // Gestion des erreurs HTTP
    if (!response.ok) {
      let errorMessage = `Erreur HTTP ${response.status} ${response.statusText}`;
      let errorDetails: Record<string, unknown> = {};
      
      try {
        // Essayer de parser le corps de la réponse comme JSON
        const responseText = await response.text();
        console.log('Corps de la réponse (texte):', responseText);
        
        if (responseText) {
          try {
            const parsedResponse = JSON.parse(responseText);
            errorDetails = typeof parsedResponse === 'object' && parsedResponse !== null 
              ? parsedResponse 
              : { message: responseText };
            console.error('Détails de l\'erreur (JSON):', errorDetails);
            
            // Vérifier le type de errorDetails.message et errorDetails.error avant de les utiliser
            const message = errorDetails && typeof errorDetails === 'object' && 'message' in errorDetails && typeof errorDetails.message === 'string' 
              ? errorDetails.message 
              : undefined;
            const error = errorDetails && typeof errorDetails === 'object' && 'error' in errorDetails && typeof errorDetails.error === 'string'
              ? errorDetails.error
              : undefined;
              
            errorMessage = message || error || errorMessage;
          } catch (parseError) {
            console.error('Erreur lors du parsing de la réponse d\'erreur:', parseError);
            errorDetails = { message: responseText };
            errorMessage = responseText || errorMessage;
          }
        }
      } catch (e) {
        console.error('Erreur lors de la lecture de la réponse:', e);
      }
      
      const fullErrorMessage = `Erreur lors de la mise à jour du référentiel: ${errorMessage}`;
      console.error(fullErrorMessage, { status: response.status, details: errorDetails });
      
      // Création d'une erreur enrichie avec plus de détails
      interface ExtendedError extends Error {
        status?: number;
        details?: unknown;
      }
      const error: ExtendedError = new Error(fullErrorMessage);
      error.status = response.status;
      error.details = errorDetails;
      throw error;
    }

    // Traitement de la réponse en cas de succès
    try {
      const responseData = await response.json();
      console.log('Référentiel mis à jour avec succès:', responseData);
      return responseData;
    } catch (e) {
      console.error('Erreur lors du parsing de la réponse JSON:', e);
      throw new Error('La réponse du serveur est invalide (format JSON attendu)');
    }
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour du référentiel:', error);
    
    // Si l'erreur est déjà une instance d'Error, on la propage telle quelle
    if (error instanceof Error) {
      throw error;
    }
    
    // Sinon, on crée une nouvelle erreur avec le message d'erreur
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error
      ? String(error.message)
      : 'Une erreur inattendue est survenue';
      
    throw new Error(`Erreur lors de la mise à jour du référentiel: ${errorMessage}`);
  } finally {
    console.log('=== Fin de updateReferential ===');
  }
}

export async function deleteReferential(refID: string | number): Promise<void> {
  console.log('=== Début de deleteReferential ===');
  console.log('ID du référentiel à supprimer:', refID);
  
  // Vérification de l'ID
  if (!refID) {
    const errorMsg = 'ID du référentiel manquant';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Vérification de l'authentification
  const token = localStorage.getItem('authToken');
  if (!token) {
    const errorMsg = 'Non authentifié. Veuillez vous reconnecter.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    // Construction de l'URL avec le bon format
    const url = `${REFERENTIALS_BASE}/${refID}`;
    console.log('URL de suppression:', url);
    
    // Envoi de la requête
    console.log('Envoi de la requête DELETE à:', url);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Journalisation de la réponse
    console.log('Réponse reçue - Statut:', response.status, response.statusText);

    // Gestion des erreurs HTTP
    if (!response.ok) {
      let errorMessage = `Erreur HTTP ${response.status} ${response.statusText}`;
      let errorDetails: { status: number; [key: string]: unknown } = { status: response.status };
      
      try {
        // Essayer de parser la réponse comme JSON
        const responseText = await response.text();
        console.log('Réponse brute:', responseText);
        
        if (responseText) {
          try {
            const parsedResponse = JSON.parse(responseText);
            errorDetails = { 
              ...(typeof parsedResponse === 'object' && parsedResponse !== null ? parsedResponse : {}), 
              status: response.status 
            };
            
            // Vérifier le type de errorDetails.message et errorDetails.error avant de les utiliser
            const message = 'message' in errorDetails && typeof errorDetails.message === 'string' 
              ? errorDetails.message 
              : undefined;
            const error = 'error' in errorDetails && typeof errorDetails.error === 'string'
              ? errorDetails.error
              : undefined;
              
            errorMessage = message || error || errorMessage;
            console.error('Détails de l\'erreur:', errorDetails);
          } catch (_) {
            console.error('La réponse n\'est pas du JSON valide, utilisation du texte brut');
            errorDetails.raw = responseText;
            errorMessage = responseText || errorMessage;
          }
        }
      } catch (e) {
        console.error('Erreur lors de la lecture de la réponse:', e);
      }
      
      const error = new Error(`Erreur lors de la suppression du référentiel: ${errorMessage}`);
      Object.defineProperty(error, 'details', {
        value: errorDetails,
        enumerable: false
      });
      throw error;
    }
    
    console.log('Référentiel supprimé avec succès');
  } catch (error) {
    console.error('Erreur dans deleteReferential:', error);
    
    // Si l'erreur est déjà une instance d'Error, on la propage telle quelle
    if (error instanceof Error) {
      throw error;
    }
    
    // Sinon, on crée une nouvelle erreur avec le message d'erreur
    const errorMessage = typeof error === 'object' && error !== null && 'message' in error
      ? String(error.message)
      : 'Une erreur inattendue est survenue';
      
    throw new Error(`Erreur lors de la suppression du référentiel: ${errorMessage}`);
  } finally {
    console.log('=== Fin de deleteReferential ===');
  }
}

export async function getCategories(): Promise<string[]> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Non authentifié. Veuillez vous reconnecter.');
  }
  
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