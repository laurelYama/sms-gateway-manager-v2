import { getToken } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/config";

export interface DocumentUploadResponse {
  success: boolean;
  message: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

export const documentService = {
  async uploadDocument(file: File): Promise<DocumentUploadResponse> {
    const token = getToken();
    if (!token) {
      throw new Error('Non authentifié');
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/V1/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Ne pas définir 'Content-Type' pour FormData, le navigateur le fera automatiquement avec la boundary
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors du téléversement du document');
      }

      return {
        success: true,
        message: 'Document téléversé avec succès',
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType,
      };
    } catch (error) {
      console.error('Erreur lors du téléversement du document:', error);
      throw error;
    }
  },

  // Vous pouvez ajouter d'autres méthodes ici, comme la récupération de la liste des documents, la suppression, etc.
};
