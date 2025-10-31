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
    if (!token) throw new Error('No autenticado');

    try {
      const { start, end } = params;
      
      // Validar fechas
      const startDateObj = new Date(start);
      const endDateObj = new Date(end);
      
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        throw new Error('Fechas inválidas proporcionadas');
      }
      
      const startDate = startDateObj.toISOString().split('T')[0];
      const endDate = endDateObj.toISOString().split('T')[0];
      
      console.log(`[AuditLogService] Obteniendo logs desde ${startDate} hasta ${endDate}`);
      
      const url = new URL(`${API_BASE_URL}/api/v1/audit-logs`);
      url.searchParams.append('startDate', startDate);
      url.searchParams.append('endDate', endDate);
      
      console.log(`[AuditLogService] URL de la petición: ${url.toString()}`);
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log(`[AuditLogService] Respuesta del servidor: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          console.error('[AuditLogService] Detalles del error:', errorData);
          
          if (errorData && typeof errorData === 'object' && 'message' in errorData) {
            errorMessage = String(errorData.message);
          } else if (errorData && typeof errorData === 'string') {
            errorMessage = errorData;
          }
        } catch (parseError) {
          console.error('[AuditLogService] No se pudo analizar la respuesta de error:', parseError);
        }
        
        console.error(`[AuditLogService] Error al obtener logs por fecha: ${errorMessage}`);
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
