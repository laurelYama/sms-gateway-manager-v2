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
  // Optional details payload (may be an object or a string depending on API)
  details?: Record<string, unknown> | string | null;
  // Optional short description provided by the API
  description?: string | null;
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
    if (!token) throw new Error('Non authentifié');

    try {
      const response = await fetch(`${API_BASE_URL}/api/V1/audit-logs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = typeof errorData === 'object' && errorData !== null && 'message' in errorData
          ? String(errorData.message)
          : `Erreur ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data: unknown = await response.json();
      if (!Array.isArray(data)) {
        console.error('La réponse de l\'API n\'est pas un tableau:', data);
        throw new Error('Format de réponse inattendu de l\'API');
      }
      
      // Validation basique des données reçues
      return data.map(log => ({
        id: String(log.id || ''),
        action: String(log.action || ''),
        entityType: String(log.entityType || ''),
        entityId: String(log.entityId || ''),
        userId: String(log.userId || ''),
        userEmail: String(log.userEmail || ''),
        role: String(log.role || ''),
        timestamp: String(log.timestamp || ''),
        ipAddress: String(log.ipAddress || ''),
        userAgent: String(log.userAgent || ''),
        details: log.details !== undefined ? log.details : null,
        description: log.description !== undefined ? String(log.description) : null,
      }));
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
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Réponse du serveur (par date):', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = typeof errorData === 'object' && errorData !== null && 'message' in errorData
          ? String(errorData.message)
          : `Erreur ${response.status}: ${response.statusText}`;
        console.error('Erreur du serveur (par date):', errorMessage);
        throw new Error(errorMessage);
      }

      const data: unknown = await response.json();
      if (!Array.isArray(data)) {
        console.error('La réponse de l\'API n\'est pas un tableau:', data);
        throw new Error('Format de réponse inattendu de l\'API');
      }
      
      // Validation basique des données reçues
      return data.map(log => ({
        id: String(log.id || ''),
        action: String(log.action || ''),
        entityType: String(log.entityType || ''),
        entityId: String(log.entityId || ''),
        userId: String(log.userId || ''),
        userEmail: String(log.userEmail || ''),
        role: String(log.role || ''),
        timestamp: String(log.timestamp || ''),
        ipAddress: String(log.ipAddress || ''),
        userAgent: String(log.userAgent || ''),
        details: log.details !== undefined ? log.details : null,
        description: log.description !== undefined ? String(log.description) : null,
      }));
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
        `${API_BASE_URL}/api/V1/audit-logs/user?userEmail=${encodeURIComponent(userEmail)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = typeof errorData === 'object' && errorData !== null && 'message' in errorData
          ? String(errorData.message)
          : `Erreur ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data: unknown = await response.json();
      if (!Array.isArray(data)) {
        console.error('La réponse de l\'API n\'est pas un tableau:', data);
        throw new Error('Format de réponse inattendu de l\'API');
      }
      
      // Validation basique des données reçues
      return data.map(log => ({
        id: String(log.id || ''),
        action: String(log.action || ''),
        entityType: String(log.entityType || ''),
        entityId: String(log.entityId || ''),
        userId: String(log.userId || ''),
        userEmail: String(log.userEmail || ''),
        role: String(log.role || ''),
        timestamp: String(log.timestamp || ''),
        ipAddress: String(log.ipAddress || ''),
        userAgent: String(log.userAgent || ''),
        details: log.details !== undefined ? log.details : null,
        description: log.description !== undefined ? String(log.description) : null,
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des logs par utilisateur:', error);
      throw error;
    }
  },
};
