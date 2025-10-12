// Types partagés pour l'application

export interface UserToken {
  sub: string;
  id: string;
  nom: string;
  // optional email may be present in decoded tokens depending on auth provider
  email?: string;
  role: string;
  abonneExpire: boolean;
  iat: number;
  exp: number;
}

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
