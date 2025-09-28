import { getToken } from "@/lib/auth";

export interface UserProfile {
  idManager: string;
  nomManager: string;
  prenomManager: string;
  email: string;
  numeroTelephoneManager: string;
  role: string;
  statutCompte: string;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

export const userService = {
  async getUserProfile(userId: string): Promise<UserProfile> {
    const token = getToken();
    if (!token) {
      throw new Error("Non authentifié");
    }

    const response = await fetch(
      `https://api-smsgateway.solutech-one.com/api/V1/managers/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Échec de la récupération du profil");
    }

    return response.json();
  },

  async changePassword(
    userId: string,
    data: ChangePasswordData
  ): Promise<{ message: string }> {
    const token = getToken();
    if (!token) {
      throw new Error("Non authentifié");
    }

    const response = await fetch(
      `https://api-smsgateway.solutech-one.com/api/V1/managers/${userId}/change-password`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || "Échec de la modification du mot de passe"
      );
    }

    return response.json();
  },
};
