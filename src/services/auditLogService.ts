import { getToken } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/config";

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userEmail: string;
  role: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}

export interface DateRangeParams {
  start: string;
  end: string;
}

export interface UserEmailParams {
  userEmail: string;
}

// URL de base de l'API centralisée via les variables d'environnement

export const auditLogService = {
  async getAllLogs(): Promise<AuditLog[]> {
    const token = getToken();
    console.log('Token:', token ? 'présent' : 'manquant');
    if (!token) throw new Error('Non authentifié');

    try {
      console.log('Tentative de récupération des logs depuis:', `${API_BASE_URL}/api/v1/audit-logs`);
      const response = await fetch(`${API_BASE_URL}/api/v1/audit-logs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Réponse du serveur:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erreur du serveur:', errorData);
        throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Logs récupérés avec succès:', data.length, 'entrées');
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des logs:', error);
      throw error;
    }
  },

  async getLogsByDate(params: DateRangeParams): Promise<AuditLog[]> {
    const token = getToken();
    if (!token) throw new Error('Non authentifié');

    try {
      const { start, end } = params;
      const startDate = new Date(start).toISOString().split('T')[0];
      const endDate = new Date(end).toISOString().split('T')[0];
      
      console.log(`Récupération des logs du ${startDate} au ${endDate}`);
      const response = await fetch(
        `${API_BASE_URL}/api/v1/audit-logs?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Réponse du serveur (par date):', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erreur du serveur (par date):', errorData);
        throw new Error(errorData.message || `Erreur ${response.status}: Échec de la récupération des journaux par date`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des logs par date:', error);
      throw error;
    }
  },

  async getLogsByUser(params: UserEmailParams): Promise<AuditLog[]> {
    const token = getToken();
    if (!token) throw new Error('Non authentifié');

    try {
      const { userEmail } = params;
      console.log(`Récupération des logs pour l'utilisateur: ${userEmail}`);
      
      const response = await fetch(
        `${API_BASE_URL}/api/v1/audit-logs?userEmail=${encodeURIComponent(userEmail)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Réponse du serveur (par utilisateur):', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erreur du serveur (par utilisateur):', errorData);
        throw new Error(errorData.message || `Erreur ${response.status}: Échec de la récupération des journaux par utilisateur`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des logs par utilisateur:', error);
      throw error;
    }
  },
};
